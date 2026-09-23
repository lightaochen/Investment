#!/usr/bin/env python
"""iFinD 红利指数历史回补与日更同步器。

行情由 THS_HQ 批量取得；指数股息率由 THS_BD 按交易日取得。所有请求的
DataFrame 快照都会写入 SQLite，以便复核字段口径和失败区间。账号信息优先从
config/ifind.env 读取，字段为空时才回退至 THS_USERNAME / THS_PASSWORD 环境变量。
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sqlite3
import sys
import time
import uuid
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

import pandas as pd

try:
    from iFinDPy import THS_BD, THS_HQ, THS_iFinDLogin, THS_iFinDLogout
except ImportError as exc:  # pragma: no cover - depends on the local iFinD installation
    raise SystemExit(f"无法导入 iFinDPy：{exc}") from exc


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = PROJECT_ROOT / "config" / "red_dividend_strategy.json"
DEFAULT_DB = PROJECT_ROOT / "data" / "red_dividend_timing.sqlite"
DEFAULT_CREDENTIALS_FILE = PROJECT_ROOT / "config" / "ifind.env"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="同步 iFinD 红利指数行情及指数股息率到 SQLite")
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument(
        "--credentials-file",
        type=Path,
        default=DEFAULT_CREDENTIALS_FILE,
        help="iFinD 凭据文件，默认 config/ifind.env；文件不存在或字段为空时回退到环境变量。",
    )
    parser.add_argument("--from", dest="start_date", help="历史开始日，YYYY-MM-DD")
    parser.add_argument("--to", dest="end_date", help="结束日，YYYY-MM-DD，默认今天")
    parser.add_argument("--daily", action="store_true", help="只回补最近 10 个自然日，供日更任务使用")
    parser.add_argument("--skip-market", action="store_true", help="跳过 THS_HQ 行情请求，只补 THS_BD 历史股息率")
    parser.add_argument("--skip-dividend", action="store_true", help="只刷新 THS_HQ 行情/估值字段，不请求 THS_BD 股息率")
    parser.add_argument("--market-window-days", type=int, default=120, help="THS_HQ 的单次日期窗口")
    parser.add_argument("--pause-seconds", type=float, default=0.2, help="THS_BD 请求间隔")
    parser.add_argument(
        "--max-dividend-requests",
        type=int,
        default=0,
        help="本次最多补多少个交易日的股息率；0 表示不限制。限额可让长历史回补断点续跑。",
    )
    return parser.parse_args()


def parse_iso(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def date_windows(start_date: date, end_date: date, window_days: int) -> list[tuple[date, date]]:
    if window_days < 1:
        raise ValueError("market-window-days 必须大于 0")
    windows: list[tuple[date, date]] = []
    cursor = start_date
    while cursor <= end_date:
        window_end = min(cursor + timedelta(days=window_days - 1), end_date)
        windows.append((cursor, window_end))
        cursor = window_end + timedelta(days=1)
    return windows


def load_config(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        config = json.load(handle)
    required = {"index_codes", "history_start", "hq_fields", "dividend_field"}
    missing = required.difference(config)
    if missing:
        raise ValueError(f"策略配置缺少字段：{', '.join(sorted(missing))}")
    return config


def load_credentials(path: Path) -> tuple[str | None, str | None]:
    """优先读取本地忽略文件，再回退环境变量；支持 PASSWORD 中出现等号。"""
    values: dict[str, str] = {}
    if path.exists():
        for raw_line in path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            value = value.strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
                value = value[1:-1]
            values[key.strip()] = value
    username = values.get("THS_USERNAME") or os.getenv("THS_USERNAME")
    password = values.get("THS_PASSWORD") or os.getenv("THS_PASSWORD")
    return username, password


def open_db(path: Path) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS ifind_sync_runs (
          run_id TEXT PRIMARY KEY,
          started_at TEXT NOT NULL,
          finished_at TEXT,
          status TEXT NOT NULL,
          requested_from TEXT NOT NULL,
          requested_to TEXT NOT NULL,
          error_message TEXT
        );
        CREATE TABLE IF NOT EXISTS ifind_raw_payloads (
          run_id TEXT NOT NULL,
          dataset TEXT NOT NULL,
          request_key TEXT NOT NULL,
          fetched_at TEXT NOT NULL,
          payload_sha256 TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          PRIMARY KEY (dataset, request_key, payload_sha256)
        );
        CREATE TABLE IF NOT EXISTS ifind_sync_failures (
          dataset TEXT NOT NULL,
          request_key TEXT NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 1,
          last_error TEXT NOT NULL,
          last_attempt_at TEXT NOT NULL,
          resolved_at TEXT,
          PRIMARY KEY (dataset, request_key)
        );
        CREATE TABLE IF NOT EXISTS ifind_index_daily (
          index_code TEXT NOT NULL,
          trade_date TEXT NOT NULL,
          pre_close REAL,
          open REAL,
          high REAL,
          low REAL,
          close REAL,
          change_ratio REAL,
          volume REAL,
          amount REAL,
          turnover_ratio REAL,
          total_capital REAL,
          float_capital REAL,
          pe_ttm_index REAL,
          pb_mrq REAL,
          pe_index_publisher REAL,
          ps REAL,
          pcf REAL,
          dividend_yield REAL,
          hq_fetched_at TEXT,
          dividend_fetched_at TEXT,
          PRIMARY KEY (index_code, trade_date)
        );
        CREATE INDEX IF NOT EXISTS idx_ifind_index_daily_date
          ON ifind_index_daily(trade_date, index_code);
        """
    )
    # 兼容已由旧版同步器创建的 SQLite；SQLite 的 CREATE TABLE IF NOT EXISTS 不会补列。
    existing_columns = {row[1] for row in conn.execute("PRAGMA table_info(ifind_index_daily)")}
    for name in ("ps", "pcf"):
        if name not in existing_columns:
            conn.execute(f"ALTER TABLE ifind_index_daily ADD COLUMN {name} REAL")
    return conn


def json_snapshot(frame: pd.DataFrame) -> str:
    return frame.to_json(orient="records", force_ascii=False, date_format="iso")


def save_payload(conn: sqlite3.Connection, run_id: str, dataset: str, request_key: str, frame: pd.DataFrame) -> None:
    payload = json_snapshot(frame)
    digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    conn.execute(
        """INSERT OR IGNORE INTO ifind_raw_payloads
           (run_id, dataset, request_key, fetched_at, payload_sha256, payload_json)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (run_id, dataset, request_key, datetime.now().isoformat(timespec="seconds"), digest, payload),
    )


def record_failure(conn: sqlite3.Connection, dataset: str, request_key: str, error: Exception) -> None:
    conn.execute(
        """INSERT INTO ifind_sync_failures
           (dataset, request_key, attempts, last_error, last_attempt_at, resolved_at)
           VALUES (?, ?, 1, ?, ?, NULL)
           ON CONFLICT(dataset, request_key) DO UPDATE SET
             attempts=ifind_sync_failures.attempts + 1,
             last_error=excluded.last_error,
             last_attempt_at=excluded.last_attempt_at,
             resolved_at=NULL""",
        (dataset, request_key, str(error), datetime.now().isoformat(timespec="seconds")),
    )


def resolve_failure(conn: sqlite3.Connection, dataset: str, request_key: str) -> None:
    conn.execute(
        """UPDATE ifind_sync_failures SET resolved_at=?
           WHERE dataset=? AND request_key=? AND resolved_at IS NULL""",
        (datetime.now().isoformat(timespec="seconds"), dataset, request_key),
    )


def result_frame(result: Any, request_label: str) -> pd.DataFrame:
    error_code = getattr(result, "errorcode", 0)
    if error_code not in (0, None, "0"):
        raise RuntimeError(f"{request_label} iFinD errorcode={error_code}: {getattr(result, 'errmsg', '')}")
    frame = getattr(result, "data", None)
    if not isinstance(frame, pd.DataFrame):
        raise RuntimeError(f"{request_label} 未返回 DataFrame，实际类型：{type(frame).__name__}")
    return frame.copy()


def column_lookup(frame: pd.DataFrame) -> dict[str, str]:
    return {str(column).strip().lower(): str(column) for column in frame.columns}


def get_value(row: pd.Series, lookup: dict[str, str], name: str, default: Any = None) -> Any:
    column = lookup.get(name.lower())
    return row[column] if column is not None else default


def as_float(value: Any) -> float | None:
    if value is None or pd.isna(value):
        return None
    try:
        cleaned = str(value).replace(",", "").replace("%", "").strip()
        return float(cleaned) if cleaned else None
    except (TypeError, ValueError):
        return None


def normalize_trade_date(value: Any) -> str | None:
    parsed = pd.to_datetime(value, errors="coerce")
    if pd.isna(parsed):
        return None
    return parsed.strftime("%Y-%m-%d")


def normalize_code(value: Any) -> str | None:
    if value is None or pd.isna(value):
        return None
    code = str(value).strip().upper()
    return code or None


def upsert_hq(conn: sqlite3.Connection, frame: pd.DataFrame, fetched_at: str) -> int:
    lookup = column_lookup(frame)
    rows: list[tuple[Any, ...]] = []
    fields = [
        "preclose", "open", "high", "low", "close", "changeratio", "volume", "amount",
        "turnoverratio", "totalcapital", "floatcapital", "pe_ttm_index", "pb_mrq", "pe_indexpublisher", "ps", "pcf",
    ]
    for _, row in frame.iterrows():
        code = normalize_code(get_value(row, lookup, "thscode"))
        trade_date = normalize_trade_date(get_value(row, lookup, "time", get_value(row, lookup, "date")))
        if not code or not trade_date:
            continue
        rows.append((code, trade_date, *(as_float(get_value(row, lookup, field)) for field in fields), fetched_at))
    conn.executemany(
        """INSERT INTO ifind_index_daily (
          index_code, trade_date, pre_close, open, high, low, close, change_ratio, volume, amount,
          turnover_ratio, total_capital, float_capital, pe_ttm_index, pb_mrq, pe_index_publisher, ps, pcf, hq_fetched_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(index_code, trade_date) DO UPDATE SET
          pre_close=excluded.pre_close, open=excluded.open, high=excluded.high, low=excluded.low,
          close=excluded.close, change_ratio=excluded.change_ratio, volume=excluded.volume, amount=excluded.amount,
          turnover_ratio=excluded.turnover_ratio, total_capital=excluded.total_capital,
          float_capital=excluded.float_capital, pe_ttm_index=excluded.pe_ttm_index, pb_mrq=excluded.pb_mrq,
          pe_index_publisher=excluded.pe_index_publisher, ps=excluded.ps, pcf=excluded.pcf,
          hq_fetched_at=excluded.hq_fetched_at""",
        rows,
    )
    return len(rows)


def upsert_dividend(conn: sqlite3.Connection, frame: pd.DataFrame, requested_date: str, fetched_at: str, field: str) -> int:
    lookup = column_lookup(frame)
    field_column = lookup.get(field.lower())
    if field_column is None:
        raise RuntimeError(f"THS_BD 返回中没有 `{field}`；实际字段：{', '.join(map(str, frame.columns))}")
    rows: list[tuple[Any, ...]] = []
    for _, row in frame.iterrows():
        code = normalize_code(get_value(row, lookup, "thscode"))
        if not code:
            continue
        rows.append((code, requested_date, as_float(row[field_column]), fetched_at))
    conn.executemany(
        """INSERT INTO ifind_index_daily (index_code, trade_date, dividend_yield, dividend_fetched_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(index_code, trade_date) DO UPDATE SET
             dividend_yield=excluded.dividend_yield, dividend_fetched_at=excluded.dividend_fetched_at""",
        rows,
    )
    return len(rows)


def missing_dividend_dates(conn: sqlite3.Connection, codes: list[str], start_date: str, end_date: str) -> list[str]:
    placeholders = ",".join("?" for _ in codes)
    query = f"""
      SELECT trade_date
      FROM ifind_index_daily
      WHERE index_code IN ({placeholders})
        AND trade_date BETWEEN ? AND ?
      GROUP BY trade_date
      HAVING COUNT(*) < ? OR SUM(CASE WHEN dividend_yield IS NOT NULL THEN 1 ELSE 0 END) < ?
      ORDER BY trade_date
    """
    return [row[0] for row in conn.execute(query, (*codes, start_date, end_date, len(codes), len(codes)))]


def missing_market_close_rows(
    conn: sqlite3.Connection, codes: list[str], start_date: str, end_date: str
) -> list[tuple[str, str]]:
    placeholders = ",".join("?" for _ in codes)
    query = f"""
      SELECT index_code, trade_date
      FROM ifind_index_daily
      WHERE index_code IN ({placeholders})
        AND trade_date BETWEEN ? AND ?
        AND close IS NULL
      ORDER BY trade_date, index_code
    """
    return [(row[0], row[1]) for row in conn.execute(query, (*codes, start_date, end_date))]


def main() -> int:
    args = parse_args()
    config = load_config(args.config)
    end_date = parse_iso(args.end_date) if args.end_date else date.today()
    if args.daily:
        start_date = end_date - timedelta(days=10)
    else:
        start_date = parse_iso(args.start_date or config["history_start"])
    if start_date > end_date:
        raise SystemExit("--from 不能晚于 --to")

    username, password = load_credentials(args.credentials_file)
    if not username or not password:
        raise SystemExit(
            f"缺少 iFinD 凭据；请填写 {args.credentials_file}，或设置 THS_USERNAME / THS_PASSWORD 环境变量。"
        )

    codes = list(config["index_codes"])
    code_string = ",".join(codes)
    start_text, end_text = start_date.isoformat(), end_date.isoformat()
    conn = open_db(args.db)
    run_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO ifind_sync_runs (run_id, started_at, status, requested_from, requested_to) VALUES (?, ?, 'running', ?, ?)",
        (run_id, datetime.now().isoformat(timespec="seconds"), start_text, end_text),
    )
    conn.commit()
    login_ok = False
    hq_count = dividend_count = failures = 0
    try:
        login_code = THS_iFinDLogin(username, password)
        if login_code != 0:
            raise RuntimeError(f"iFinD 登录失败，errorcode={login_code}")
        login_ok = True

        if not args.skip_market:
            for window_start, window_end in date_windows(start_date, end_date, args.market_window_days):
                request_key = f"{code_string}|{window_start.isoformat()}|{window_end.isoformat()}"
                try:
                    frame = result_frame(
                        THS_HQ(code_string, config["hq_fields"], "", window_start.isoformat(), window_end.isoformat()),
                        f"THS_HQ {request_key}",
                    )
                    save_payload(conn, run_id, "THS_HQ", request_key, frame)
                    hq_count += upsert_hq(conn, frame, datetime.now().isoformat(timespec="seconds"))
                    resolve_failure(conn, "THS_HQ", request_key)
                    conn.commit()
                except Exception as exc:  # one failed window must not discard others
                    failures += 1
                    record_failure(conn, "THS_HQ", request_key, exc)
                    conn.commit()
                    print(f"[WARN] THS_HQ 失败 {request_key}: {exc}", file=sys.stderr)

        dividend_dates = [] if args.skip_dividend else missing_dividend_dates(conn, codes, start_text, end_text)
        if args.max_dividend_requests > 0:
            dividend_dates = dividend_dates[:args.max_dividend_requests]
        for trade_date in dividend_dates:
            request_key = f"{code_string}|{trade_date}|{config['dividend_field']}"
            try:
                frame = result_frame(
                    THS_BD(code_string, config["dividend_field"], trade_date),
                    f"THS_BD {request_key}",
                )
                save_payload(conn, run_id, "THS_BD", request_key, frame)
                dividend_count += upsert_dividend(
                    conn, frame, trade_date, datetime.now().isoformat(timespec="seconds"), config["dividend_field"]
                )
                resolve_failure(conn, "THS_BD", request_key)
                conn.commit()
            except Exception as exc:
                failures += 1
                record_failure(conn, "THS_BD", request_key, exc)
                conn.commit()
                print(f"[WARN] THS_BD 失败 {request_key}: {exc}", file=sys.stderr)
            time.sleep(args.pause_seconds)

        remaining_dividend_dates = missing_dividend_dates(conn, codes, start_text, end_text)
        market_close_gaps = missing_market_close_rows(conn, codes, start_text, end_text)
        status = "partial" if failures or market_close_gaps else "success"
        conn.execute(
            "UPDATE ifind_sync_runs SET finished_at=?, status=? WHERE run_id=?",
            (datetime.now().isoformat(timespec="seconds"), status, run_id),
        )
        conn.commit()
        print(json.dumps({
            "status": status,
            "hq_rows": hq_count,
            "market_skipped": args.skip_market,
            "dividend_rows": dividend_count,
            "dividend_request_dates": len(dividend_dates),
            "remaining_missing_dividend_dates": len(remaining_dividend_dates),
            "missing_market_close_rows": market_close_gaps,
            "failed_requests": failures,
        }, ensure_ascii=False))
        return 0 if status == "success" else 2
    except Exception as exc:
        conn.execute(
            "UPDATE ifind_sync_runs SET finished_at=?, status='failed', error_message=? WHERE run_id=?",
            (datetime.now().isoformat(timespec="seconds"), str(exc), run_id),
        )
        conn.commit()
        raise
    finally:
        if login_ok:
            try:
                THS_iFinDLogout()
            except Exception:
                pass
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
