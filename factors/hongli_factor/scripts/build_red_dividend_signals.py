#!/usr/bin/env python
"""基于 SQLite 中已审计的 iFinD 指数股息率与 10Y 国债生成日更观察信号。"""
from __future__ import annotations

import argparse
import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = PROJECT_ROOT / "config" / "red_dividend_strategy.json"
DEFAULT_DB = PROJECT_ROOT / "data" / "red_dividend_timing.sqlite"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="构建红利股债收益差信号")
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--index-code", help="默认使用配置中的 primary_signal_index")
    return parser.parse_args()


def load_config(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def open_db(path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS red_dividend_signal_daily (
          index_code TEXT NOT NULL,
          trade_date TEXT NOT NULL,
          dividend_yield REAL NOT NULL,
          govt_10y_yield REAL NOT NULL,
          bond_minus_dividend REAL NOT NULL,
          rolling_mean REAL,
          rolling_std REAL,
          zscore REAL,
          proposed_allocation REAL,
          signal_state TEXT NOT NULL,
          state_changed INTEGER NOT NULL,
          data_status TEXT NOT NULL,
          generated_at TEXT NOT NULL,
          PRIMARY KEY (index_code, trade_date)
        );
        CREATE INDEX IF NOT EXISTS idx_red_dividend_signal_latest
          ON red_dividend_signal_daily(index_code, trade_date DESC);
        """
    )
    return conn


def allocation_and_state(zscore: float | None, strategy: dict[str, Any]) -> tuple[float | None, str]:
    if zscore is None or pd.isna(zscore):
        return None, "insufficient_history"
    if zscore <= -2:
        return float(strategy["allocation_at_or_below_minus_2"]), "extreme_cheap"
    if zscore < 1:
        return float(strategy["allocation_between_minus_2_and_plus_1"]), "normal_hold"
    if zscore < 2:
        return float(strategy["allocation_between_plus_1_and_plus_2"]), "trim_observation"
    return float(strategy["allocation_at_or_above_plus_2"]), "crowded_reduce"


def main() -> int:
    args = parse_args()
    config = load_config(args.config)
    index_code = args.index_code or config["primary_signal_index"]
    strategy = config["strategy"]
    window = int(strategy["rolling_window_trading_days"])
    min_observations = int(strategy["min_observations"])
    if min_observations > window:
        raise SystemExit("min_observations 不能大于 rolling_window_trading_days")

    conn = open_db(args.db)
    try:
        required_tables = {"ifind_index_daily", "govt_bond_yield_daily"}
        existing_tables = {
            row[0] for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name IN (?, ?)",
                tuple(required_tables),
            )
        }
        missing_tables = sorted(required_tables.difference(existing_tables))
        if missing_tables:
            print(json.dumps({
                "status": "stale",
                "reason": "缺少数据表：" + ", ".join(missing_tables) + "；请先完成 iFinD 和 10Y 国债同步。",
            }, ensure_ascii=False))
            return 2
        frame = pd.read_sql_query(
            """SELECT i.trade_date, i.dividend_yield, b.yield_10y AS govt_10y_yield
               FROM ifind_index_daily i
               JOIN govt_bond_yield_daily b ON b.trade_date=i.trade_date
               WHERE i.index_code=?
                 AND i.dividend_yield IS NOT NULL
                 AND b.yield_10y IS NOT NULL
               ORDER BY i.trade_date""",
            conn,
            params=(index_code,),
        )
        if frame.empty:
            print(json.dumps({"status": "stale", "reason": "没有同日的 iFinD 股息率与 10Y 国债数据"}, ensure_ascii=False))
            return 2

        frame["bond_minus_dividend"] = frame["govt_10y_yield"] - frame["dividend_yield"]
        rolling = frame["bond_minus_dividend"].rolling(window=window, min_periods=min_observations)
        frame["rolling_mean"] = rolling.mean()
        frame["rolling_std"] = rolling.std(ddof=0)
        frame["zscore"] = (frame["bond_minus_dividend"] - frame["rolling_mean"]) / frame["rolling_std"]
        frame.loc[frame["rolling_std"] == 0, "zscore"] = float("nan")

        states: list[str] = []
        allocations: list[float | None] = []
        for value in frame["zscore"]:
            allocation, state = allocation_and_state(value, strategy)
            allocations.append(allocation)
            states.append(state)
        frame["proposed_allocation"] = allocations
        frame["signal_state"] = states
        frame["state_changed"] = (frame["signal_state"] != frame["signal_state"].shift(1)).astype(int)
        frame.loc[frame.index[0], "state_changed"] = 0
        generated_at = datetime.now().isoformat(timespec="seconds")
        rows = []
        for record in frame.to_dict(orient="records"):
            rows.append((
                index_code, record["trade_date"], record["dividend_yield"], record["govt_10y_yield"],
                record["bond_minus_dividend"], record["rolling_mean"], record["rolling_std"], record["zscore"],
                record["proposed_allocation"], record["signal_state"], int(record["state_changed"]),
                "ready" if pd.notna(record["zscore"]) else "insufficient_history", generated_at,
            ))
        conn.executemany(
            """INSERT INTO red_dividend_signal_daily (
                index_code, trade_date, dividend_yield, govt_10y_yield, bond_minus_dividend, rolling_mean,
                rolling_std, zscore, proposed_allocation, signal_state, state_changed, data_status, generated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(index_code, trade_date) DO UPDATE SET
                dividend_yield=excluded.dividend_yield, govt_10y_yield=excluded.govt_10y_yield,
                bond_minus_dividend=excluded.bond_minus_dividend, rolling_mean=excluded.rolling_mean,
                rolling_std=excluded.rolling_std, zscore=excluded.zscore,
                proposed_allocation=excluded.proposed_allocation, signal_state=excluded.signal_state,
                state_changed=excluded.state_changed, data_status=excluded.data_status,
                generated_at=excluded.generated_at""",
            rows,
        )
        conn.commit()
        latest = frame.iloc[-1]
        report = {
            "status": "ready" if pd.notna(latest["zscore"]) else "insufficient_history",
            "date": latest["trade_date"], "index_code": index_code,
            "dividend_yield": round(float(latest["dividend_yield"]), 6),
            "govt_10y_yield": round(float(latest["govt_10y_yield"]), 6),
            "bond_minus_dividend": round(float(latest["bond_minus_dividend"]), 6),
            "zscore": round(float(latest["zscore"]), 4) if pd.notna(latest["zscore"]) else None,
            "signal_state": latest["signal_state"],
            "proposed_allocation": latest["proposed_allocation"],
            "state_changed": bool(latest["state_changed"]),
            "note": "这是研究观察信号；默认不自动下单。",
        }
        print(json.dumps(report, ensure_ascii=False))
        return 0 if report["status"] == "ready" else 2
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
