#!/usr/bin/env python
"""Serve the local red-dividend dashboard and its read-only SQLite API.

No web framework is needed: this keeps the research dashboard small, portable and
fully local. It never writes market data or sends an order.
"""
from __future__ import annotations

import argparse
import json
import sqlite3
from collections import deque
from datetime import datetime
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = PROJECT_ROOT / "data" / "red_dividend_timing.sqlite"
WEB_ROOT = PROJECT_ROOT / "web"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="启动红利因子本地可视化看板")
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8787)
    return parser.parse_args()


def table_exists(conn: sqlite3.Connection, table_name: str) -> bool:
    return conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type=? AND name=?", ("table", table_name)
    ).fetchone() is not None


def table_columns(conn: sqlite3.Connection, table_name: str) -> set[str]:
    return {row[1] for row in conn.execute(f"PRAGMA table_info({table_name})")}


def database_connection(path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(f"file:{path.resolve()}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn


def with_ma500(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    closes: deque[float] = deque(maxlen=500)
    running_sum = 0.0
    for row in rows:
        close = row.get("close")
        if isinstance(close, (int, float)):
            if len(closes) == closes.maxlen:
                running_sum -= closes[0]
            closes.append(float(close))
            running_sum += float(close)
        row["ma500"] = round(running_sum / 500, 6) if len(closes) == 500 else None
    return rows


def read_indexes(db_path: Path) -> dict[str, Any]:
    with database_connection(db_path) as conn:
        if not table_exists(conn, "ifind_index_daily"):
            return {"indexes": [], "message": "尚无 iFinD 指数数据，请先运行同步器。"}
        rows = conn.execute(
            """SELECT index_code, MIN(trade_date) AS first_date, MAX(trade_date) AS last_date, COUNT(*) AS observations
               FROM ifind_index_daily GROUP BY index_code ORDER BY index_code"""
        ).fetchall()
    return {"indexes": [dict(row) for row in rows]}


def read_series(db_path: Path, index_code: str) -> dict[str, Any]:
    with database_connection(db_path) as conn:
        if not table_exists(conn, "ifind_index_daily"):
            return {"series": [], "message": "尚无 iFinD 指数数据。"}
        columns = table_columns(conn, "ifind_index_daily")
        ps_expr = "i.ps" if "ps" in columns else "NULL"
        pcf_expr = "i.pcf" if "pcf" in columns else "NULL"
        has_signal = table_exists(conn, "red_dividend_signal_daily")
        signal_select = (
            "s.bond_minus_dividend, s.rolling_mean, s.rolling_std, s.zscore, s.proposed_allocation, s.signal_state, s.state_changed"
            if has_signal else
            "NULL AS bond_minus_dividend, NULL AS rolling_mean, NULL AS rolling_std, NULL AS zscore, NULL AS proposed_allocation, NULL AS signal_state, NULL AS state_changed"
        )
        signal_join = "LEFT JOIN red_dividend_signal_daily s ON s.index_code=i.index_code AND s.trade_date=i.trade_date" if has_signal else ""
        query = f"""
          SELECT i.trade_date, i.close, i.pe_ttm_index, i.pb_mrq, {ps_expr} AS ps, {pcf_expr} AS pcf,
                 i.dividend_yield, {signal_select}
          FROM ifind_index_daily i
          {signal_join}
          WHERE i.index_code=?
          ORDER BY i.trade_date
        """
        rows = [dict(row) for row in conn.execute(query, (index_code,))]
    return {"series": with_ma500(rows), "index_code": index_code}


def latest_summary(series: list[dict[str, Any]]) -> dict[str, Any]:
    latest = next((row for row in reversed(series) if row.get("close") is not None), series[-1] if series else {})
    zscore = latest.get("zscore")
    trend = "数据不足"
    if latest.get("ma500") is not None and latest.get("close") is not None:
        trend = "趋势向上" if latest["close"] >= latest["ma500"] else "趋势偏弱"
    valuation_factor = 1.0
    if isinstance(zscore, (int, float)):
        if zscore <= -2:
            valuation_factor = 1.5
        elif zscore <= -1:
            valuation_factor = 1.25
        elif zscore >= 2:
            valuation_factor = 0.5
        elif zscore >= 1:
            valuation_factor = 0.75
    trend_factor = 1.0 if trend == "趋势向上" else 0.6 if trend == "趋势偏弱" else 1.0
    return {
        "latest": latest,
        "trend": trend,
        "trend_factor": trend_factor,
        "valuation_factor": valuation_factor,
        "suggested_factor": round(trend_factor * valuation_factor, 2),
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "disclaimer": "研究看板，不构成投资建议；定投调整建议按月复核，不据此自动交易。",
    }


class DashboardHandler(SimpleHTTPRequestHandler):
    db_path: Path = DEFAULT_DB

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(WEB_ROOT), **kwargs)

    def send_json(self, payload: dict[str, Any], status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False, allow_nan=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if not parsed.path.startswith("/api/"):
            return super().do_GET()
        try:
            if parsed.path == "/api/indexes":
                return self.send_json(read_indexes(self.db_path))
            if parsed.path == "/api/series":
                code = parse_qs(parsed.query).get("index_code", ["000922.CSI"])[0]
                return self.send_json(read_series(self.db_path, code))
            if parsed.path == "/api/summary":
                code = parse_qs(parsed.query).get("index_code", ["000922.CSI"])[0]
                series = read_series(self.db_path, code)["series"]
                return self.send_json(latest_summary(series))
            return self.send_json({"error": "unknown API path"}, HTTPStatus.NOT_FOUND)
        except (OSError, sqlite3.Error, ValueError) as exc:
            return self.send_json({"error": str(exc)}, HTTPStatus.INTERNAL_SERVER_ERROR)


def main() -> int:
    args = parse_args()
    if not args.db.exists():
        raise SystemExit(f"找不到 SQLite 数据库：{args.db}")
    DashboardHandler.db_path = args.db
    server = ThreadingHTTPServer((args.host, args.port), DashboardHandler)
    print(f"红利看板：http://{args.host}:{args.port}  （Ctrl+C 停止）")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
