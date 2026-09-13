#!/usr/bin/env node
/**
 * 红利指数与 10 年期国债数据同步器。
 * 数据真值：财政部嵌入的中债曲线与中证指数官网。
 * 每次同步会回补最近 30 个自然日；失败日期将在后续运行中自动重试。
 */
import { DatabaseSync } from "node:sqlite";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as XLSX from "xlsx";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const DEFAULT_DB = resolve(PROJECT_ROOT, "data", "red_dividend_timing.sqlite");
// 历史价格和国债尽可能从公开源可得的最早时间开始补齐。
const DEFAULT_START = "2005-01-01";
const BOND_START = "2006-03-01";
const RECONCILE_DAYS = 30;
const INDEXES = [
  { code: "000922", name: "中证红利", startDate: "2005-01-04", url: "https://www.csindex.com.cn/#/indices/family/detail?indexCode=000922" },
  { code: "H30269", name: "中证红利低波", startDate: "2013-12-19", url: "https://www.csindex.com.cn/#/indices/family/detail?indexCode=H30269" },
  { code: "000825", name: "中证央企红利", startDate: "2012-07-20", url: "https://www.csindex.com.cn/#/indices/family/detail?indexCode=000825" },
];
const CSINDEX_PERF = "https://www.csindex.com.cn/csindex-home/perf/index-perf";
const CSINDEX_INDICATOR = "https://oss-ch.csindex.com.cn/static/html/csindex/public/uploads/file/autofile/indicator";
const BOND_HISTORY = "https://yield.chinabond.com.cn/cbweb-czb-web/czb/historyQuery";

function usage() {
  console.log(`\nUsage:\n  npm run sync [-- --from YYYY-MM-DD --to YYYY-MM-DD]\n  npm run report\n\nOptions:\n  --db <path>       SQLite database path\n  --from <date>     Start date for a historical backfill\n  --to <date>       End date (default: today)\n  --report          Only print the latest common-date observations\n`);
}

function parseArgs(argv) {
  const args = { db: DEFAULT_DB, from: null, to: today(), report: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--db") args.db = resolve(argv[++i]);
    else if (arg === "--from") args.from = assertDate(argv[++i], "--from");
    else if (arg === "--to") args.to = assertDate(argv[++i], "--to");
    else if (arg === "--report") args.report = true;
    else if (arg === "--help" || arg === "-h") { usage(); process.exit(0); }
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (args.from && args.from > args.to) throw new Error("--from cannot be after --to");
  return args;
}

function today() { return new Date().toISOString().slice(0, 10); }
function assertDate(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) throw new Error(`${label} must be YYYY-MM-DD`);
  return value;
}
function addDays(date, count) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + count);
  return next.toISOString().slice(0, 10);
}
function sleep(milliseconds) { return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds)); }
function compactDate(date) { return date.replaceAll("-", ""); }
function numberOrNull(value) {
  if (value === null || value === undefined || value === "" || value === "--") return null;
  const n = Number(String(value).replaceAll(",", "").replace("%", ""));
  return Number.isFinite(n) ? n : null;
}
function dateFromValue(value) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString().slice(0, 10);
  const text = String(value ?? "").trim();
  if (/^\d{8}$/.test(text)) return `${text.slice(0, 4)}-${text.slice(4, 6)}-${text.slice(6, 8)}`;
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(text)) {
    const [year, month, day] = text.slice(0, 10).replaceAll("/", "-").split("-");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  if (typeof value === "number" && value > 20000 && value < 100000) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  }
  return null;
}

function openDatabase(path) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS source_runs (
      run_id TEXT PRIMARY KEY,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      status TEXT NOT NULL,
      requested_from TEXT,
      requested_to TEXT,
      error_message TEXT
    );
    CREATE TABLE IF NOT EXISTS raw_payloads (
      source TEXT NOT NULL,
      request_url TEXT NOT NULL,
      payload_sha256 TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      run_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      PRIMARY KEY (source, request_url, payload_sha256)
    );
    CREATE TABLE IF NOT EXISTS index_catalog (
      index_code TEXT PRIMARY KEY,
      index_name TEXT NOT NULL,
      official_url TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS index_market_daily (
      index_code TEXT NOT NULL,
      trade_date TEXT NOT NULL,
      index_name TEXT,
      close REAL,
      open REAL,
      high REAL,
      low REAL,
      change_value REAL,
      change_pct REAL,
      pe_ttm REAL,
      source TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      run_id TEXT NOT NULL,
      PRIMARY KEY (index_code, trade_date)
    );
    CREATE TABLE IF NOT EXISTS index_valuation_daily (
      index_code TEXT NOT NULL,
      trade_date TEXT NOT NULL,
      index_name TEXT,
      dividend_yield_total REAL,
      dividend_yield_float REAL,
      pe_total REAL,
      pe_float REAL,
      source TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      run_id TEXT NOT NULL,
      PRIMARY KEY (index_code, trade_date)
    );
    CREATE TABLE IF NOT EXISTS govt_bond_yield_daily (
      trade_date TEXT PRIMARY KEY,
      yield_10y REAL NOT NULL,
      source TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      run_id TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sync_failures (
      failure_id INTEGER PRIMARY KEY,
      dataset TEXT NOT NULL,
      index_code TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 1,
      last_error TEXT NOT NULL,
      last_attempt_at TEXT NOT NULL,
      resolved_at TEXT,
      UNIQUE(dataset, index_code, start_date, end_date)
    );
  `);
  return db;
}

function persistRaw(db, runId, source, requestUrl, payload) {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload);
  const hash = createHash("sha256").update(text).digest("hex");
  db.prepare(`INSERT OR IGNORE INTO raw_payloads
    (source, request_url, payload_sha256, fetched_at, run_id, payload) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(source, requestUrl, hash, new Date().toISOString(), runId, text);
}

async function request(url, options = {}) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          // 中证官网的网页请求依赖常规浏览器头；此处不使用未公开接口或绕过登录。
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "zh-CN,zh;q=0.9",
          "X-Requested-With": "XMLHttpRequest",
          ...(options.headers || {}),
        },
      });
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status} for ${url}`);
      if (![403, 429, 500, 502, 503, 504].includes(response.status)) throw lastError;
    } catch (error) {
      lastError = error;
    }
    if (attempt < 3) await sleep(1000 * (attempt + 1));
  }
  throw lastError;
}

function recordFailure(db, dataset, indexCode, from, to, error) {
  db.prepare(`INSERT INTO sync_failures
    (dataset, index_code, start_date, end_date, attempts, last_error, last_attempt_at, resolved_at)
    VALUES (?, ?, ?, ?, 1, ?, ?, NULL)
    ON CONFLICT(dataset, index_code, start_date, end_date) DO UPDATE SET
      attempts=sync_failures.attempts + 1, last_error=excluded.last_error,
      last_attempt_at=excluded.last_attempt_at, resolved_at=NULL`)
    .run(dataset, indexCode, from, to, String(error.message || error), new Date().toISOString());
}

function resolveFailure(db, dataset, indexCode, from, to) {
  db.prepare(`UPDATE sync_failures SET resolved_at=?
    WHERE dataset=? AND index_code IS ? AND start_date=? AND end_date=? AND resolved_at IS NULL`)
    .run(new Date().toISOString(), dataset, indexCode, from, to);
}

async function fetchIndexHistory(db, runId, index, from, to) {
  const url = new URL(CSINDEX_PERF);
  url.searchParams.set("indexCode", index.code);
  url.searchParams.set("startDate", compactDate(from));
  url.searchParams.set("endDate", compactDate(to));
  const response = await request(url, { headers: { Referer: index.url } });
  const payload = await response.json();
  persistRaw(db, runId, "csindex:index-perf", url.toString(), payload);
  if (String(payload.code) !== "200" || !Array.isArray(payload.data)) throw new Error(`Unexpected index response for ${index.code}`);
  const insert = db.prepare(`INSERT INTO index_market_daily
    (index_code, trade_date, index_name, close, open, high, low, change_value, change_pct, pe_ttm, source, fetched_at, run_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'csindex:index-perf', ?, ?)
    ON CONFLICT(index_code, trade_date) DO UPDATE SET
      index_name=excluded.index_name, close=excluded.close, open=excluded.open, high=excluded.high, low=excluded.low,
      change_value=excluded.change_value, change_pct=excluded.change_pct, pe_ttm=excluded.pe_ttm,
      source=excluded.source, fetched_at=excluded.fetched_at, run_id=excluded.run_id`);
  const fetchedAt = new Date().toISOString();
  let count = 0;
  for (const row of payload.data) {
    const tradeDate = dateFromValue(row.tradeDate);
    if (!tradeDate) continue;
    insert.run(index.code, tradeDate, row.indexNameCn || index.name, numberOrNull(row.close), numberOrNull(row.open),
      numberOrNull(row.high), numberOrNull(row.low), numberOrNull(row.change), numberOrNull(row.changePct),
      numberOrNull(row.pe), fetchedAt, runId);
    count += 1;
  }
  return count;
}

async function fetchIndexValuation(db, runId, index) {
  const url = `${CSINDEX_INDICATOR}/${index.code}indicator.xls`;
  const response = await request(url, { headers: { Referer: index.url } });
  const bytes = Buffer.from(await response.arrayBuffer());
  persistRaw(db, runId, "csindex:indicator", url, bytes.toString("base64"));
  const workbook = XLSX.read(bytes, { type: "buffer", cellDates: true });
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, raw: true, defval: null });
  const insert = db.prepare(`INSERT INTO index_valuation_daily
    (index_code, trade_date, index_name, dividend_yield_total, dividend_yield_float, pe_total, pe_float, source, fetched_at, run_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'csindex:indicator', ?, ?)
    ON CONFLICT(index_code, trade_date) DO UPDATE SET
      index_name=excluded.index_name, dividend_yield_total=excluded.dividend_yield_total,
      dividend_yield_float=excluded.dividend_yield_float, pe_total=excluded.pe_total, pe_float=excluded.pe_float,
      source=excluded.source, fetched_at=excluded.fetched_at, run_id=excluded.run_id`);
  const fetchedAt = new Date().toISOString();
  let count = 0;
  for (const row of rows) {
    const tradeDate = dateFromValue(row[0]);
    if (!tradeDate) continue;
    // 中证 indicator 文件的固定列：日期、代码、全称、简称、英文全称、英文简称、PE1、PE2、D/P1、D/P2。
    insert.run(index.code, tradeDate, row[3] || row[2] || index.name, numberOrNull(row[8]), numberOrNull(row[9]),
      numberOrNull(row[6]), numberOrNull(row[7]), fetchedAt, runId);
    count += 1;
  }
  if (!count) throw new Error(`No valuation rows parsed for ${index.code}; upstream schema may have changed`);
  return count;
}

async function fetchBondHistory(db, runId, from, to) {
  const url = new URL(BOND_HISTORY);
  url.searchParams.set("startDate", from);
  url.searchParams.set("endDate", to);
  url.searchParams.set("gjqx", "10");
  url.searchParams.set("locale", "cn_ZH");
  url.searchParams.set("qxmc", "1");
  const response = await request(url, {
    method: "POST",
    headers: { Referer: "https://gks.mof.gov.cn/gzsylqs/gzlssj/" },
  });
  const payload = await response.json();
  persistRaw(db, runId, "mof-chinabond:history", url.toString(), payload);
  if (String(payload.flag) !== "0" || !Array.isArray(payload.heList)) {
    if (String(payload.flag) === "1") return 0;
    throw new Error("Unexpected ChinaBond historical response");
  }
  const insert = db.prepare(`INSERT INTO govt_bond_yield_daily
    (trade_date, yield_10y, source, fetched_at, run_id) VALUES (?, ?, 'mof-chinabond:history', ?, ?)
    ON CONFLICT(trade_date) DO UPDATE SET yield_10y=excluded.yield_10y, source=excluded.source,
      fetched_at=excluded.fetched_at, run_id=excluded.run_id`);
  const fetchedAt = new Date().toISOString();
  let count = 0;
  for (const row of payload.heList) {
    const tradeDate = dateFromValue(row.workTime);
    const yield10y = numberOrNull(row.tenYear);
    if (!tradeDate || yield10y === null) continue;
    insert.run(tradeDate, yield10y, fetchedAt, runId);
    count += 1;
  }
  return count;
}

function latestStoredDate(db) {
  const rows = [
    db.prepare("SELECT MAX(trade_date) AS date FROM index_market_daily").get(),
    db.prepare("SELECT MAX(trade_date) AS date FROM govt_bond_yield_daily").get(),
  ].map((row) => row.date).filter(Boolean);
  return rows.length ? rows.sort()[0] : null;
}

async function retryUnresolvedFailures(db, runId) {
  const failures = db.prepare(`SELECT dataset, index_code, start_date, end_date FROM sync_failures
    WHERE resolved_at IS NULL ORDER BY last_attempt_at ASC`).all();
  let repaired = 0;
  for (const failure of failures) {
    try {
      if (failure.dataset === "index_market") {
        const index = INDEXES.find((item) => item.code === failure.index_code);
        if (!index) throw new Error(`Unknown index in failure queue: ${failure.index_code}`);
        await fetchIndexHistory(db, runId, index, failure.start_date, failure.end_date);
      } else if (failure.dataset === "bond") {
        await fetchBondHistory(db, runId, failure.start_date, failure.end_date);
      } else {
        throw new Error(`Unknown failure dataset: ${failure.dataset}`);
      }
      resolveFailure(db, failure.dataset, failure.index_code, failure.start_date, failure.end_date);
      repaired += 1;
      await sleep(750);
    } catch (error) {
      recordFailure(db, failure.dataset, failure.index_code, failure.start_date, failure.end_date, error);
    }
  }
  return repaired;
}

function printReport(db) {
  const rows = db.prepare(`
    SELECT p.index_code, p.index_name, p.trade_date, p.close, v.dividend_yield_total, b.yield_10y,
      (b.yield_10y - v.dividend_yield_total) AS bond_minus_dividend
    FROM index_market_daily p
    JOIN index_valuation_daily v ON v.index_code = p.index_code AND v.trade_date = p.trade_date
    JOIN govt_bond_yield_daily b ON b.trade_date = p.trade_date
    WHERE p.trade_date = (
      SELECT MAX(p2.trade_date) FROM index_market_daily p2
      JOIN index_valuation_daily v2 ON v2.index_code = p2.index_code AND v2.trade_date = p2.trade_date
      JOIN govt_bond_yield_daily b2 ON b2.trade_date = p2.trade_date
      WHERE p2.index_code = p.index_code
    )
    ORDER BY p.index_code`)
    .all();
  if (!rows.length) {
    console.log("No common-date observations yet. Run a sync first.");
    return;
  }
  console.table(rows.map((row) => ({
    date: row.trade_date, code: row.index_code, name: row.index_name, close: row.close,
    dividend_yield_ttm: row.dividend_yield_total, govt_10y: row.yield_10y,
    bond_minus_dividend: row.bond_minus_dividend,
  })));
}

async function sync(db, args) {
  const latest = latestStoredDate(db);
  const from = args.from || (latest ? [DEFAULT_START, addDays(latest, -RECONCILE_DAYS)].sort().at(-1) : DEFAULT_START);
  const runId = randomUUID();
  db.prepare("INSERT INTO source_runs (run_id, started_at, status, requested_from, requested_to) VALUES (?, ?, 'running', ?, ?)")
    .run(runId, new Date().toISOString(), from, args.to);
  try {
    for (const index of INDEXES) {
      db.prepare(`INSERT INTO index_catalog (index_code, index_name, official_url, active, updated_at) VALUES (?, ?, ?, 1, ?)
        ON CONFLICT(index_code) DO UPDATE SET index_name=excluded.index_name, official_url=excluded.official_url, active=1, updated_at=excluded.updated_at`)
        .run(index.code, index.name, index.url, new Date().toISOString());
    }
    const repairedFailures = await retryUnresolvedFailures(db, runId);
    let marketRows = 0;
    let bondRows = 0;
    let failedRanges = 0;
    for (let cursor = from; cursor <= args.to; cursor = addDays(cursor, 365)) {
      const chunkEnd = [addDays(cursor, 364), args.to].sort()[0];
      const tasks = [];
      // 中证官网会限制突发并行访问：同一时间段按指数串行请求，并在请求间留出间隔。
      for (const index of INDEXES.filter((item) => chunkEnd >= item.startDate)) {
        const rangeStart = [cursor, index.startDate].sort().at(-1);
        try {
          tasks.push({ type: "market", count: await fetchIndexHistory(db, runId, index, rangeStart, chunkEnd) });
        } catch (error) {
          recordFailure(db, "index_market", index.code, rangeStart, chunkEnd, error);
          tasks.push({ type: "failed", count: 0 });
        }
        await sleep(750);
      }
      if (chunkEnd >= BOND_START) {
        const rangeStart = [cursor, BOND_START].sort().at(-1);
        try {
          tasks.push({ type: "bond", count: await fetchBondHistory(db, runId, rangeStart, chunkEnd) });
        } catch (error) {
          recordFailure(db, "bond", null, rangeStart, chunkEnd, error);
          tasks.push({ type: "failed", count: 0 });
        }
      }
      for (const result of tasks) {
        if (result.type === "market") marketRows += result.count;
        else if (result.type === "bond") bondRows += result.count;
        else failedRanges += 1;
      }
      await sleep(250);
    }
    let valuationRows = 0;
    for (const index of INDEXES) valuationRows += await fetchIndexValuation(db, runId, index);
    const status = failedRanges ? "partial" : "success";
    db.prepare("UPDATE source_runs SET status=?, finished_at=? WHERE run_id=?").run(status, new Date().toISOString(), runId);
    console.log(`Sync ${status}. Index market rows: ${marketRows}; bond rows: ${bondRows}; valuation rows: ${valuationRows}; repaired failures: ${repairedFailures}; new failed ranges: ${failedRanges}.`);
  } catch (error) {
    db.prepare("UPDATE source_runs SET status='failed', finished_at=?, error_message=? WHERE run_id=?")
      .run(new Date().toISOString(), String(error.stack || error.message || error), runId);
    throw error;
  }
}

const args = parseArgs(process.argv.slice(2));
const db = openDatabase(args.db);
try {
  if (args.report) printReport(db);
  else {
    await sync(db, args);
    printReport(db);
  }
} finally {
  db.close();
}
