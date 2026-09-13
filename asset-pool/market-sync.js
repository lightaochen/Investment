// market-sync.js — 行情与分红自动同步模块（数据源：东方财富公开接口）
// 页面通过 JSONP 调用，兼容 file:// 与 http:// 打开方式，无需任何后端和密钥。
(function () {
  "use strict";

  let jsonpSeq = 0;

  // 通用 JSONP 请求。paramName：push2 用 cb，datacenter 用 callback。
  function jsonp(url, paramName = "cb", timeout = 12000) {
    return new Promise((resolve, reject) => {
      const cbName = `__msync_cb_${Date.now()}_${jsonpSeq++}`;
      const script = document.createElement("script");
      const timer = setTimeout(() => { cleanup(); reject(new Error("请求超时")); }, timeout);
      function cleanup() { clearTimeout(timer); delete window[cbName]; script.remove(); }
      window[cbName] = (payload) => { try { cleanup(); resolve(payload); } catch (e) { reject(e); } };
      script.onerror = () => { cleanup(); reject(new Error("网络请求失败")); };
      script.src = `${url}${url.includes("?") ? "&" : "?"}${paramName}=${cbName}`;
      document.head.append(script);
    });
  }

  // 代码 → 东财 secid。支持 A 股（6 位数字）与港股（hk 前缀，如 hk00700）。
  // 港股市场前缀 116；外汇（港币兑离岸人民币）市场前缀 133。
  function secid(code) {
    const raw = String(code || "").trim();
    const hk = /^hk(\d{1,5})$/i.exec(raw);
    if (hk) return "116." + hk[1].padStart(5, "0");
    const digits = raw.replace(/\D/g, "");
    if (!/^\d{6}$/.test(digits)) return null;
    if (/^[569]/.test(digits)) return "1." + digits;
    if (/^[023]/.test(digits)) return "0." + digits;
    return null;
  }

  function plainCode(code) {
    const raw = String(code || "").trim();
    const hk = /^hk(\d{1,5})$/i.exec(raw);
    if (hk) return hk[1].padStart(5, "0");
    return raw.replace(/\D/g, "");
  }

  const FX_SECID = "133.HKDCNH"; // 港币兑离岸人民币
  const FX_KEY = "HKDCNH";

  // 批量拉取最新行情（A股/ETF/港股通用，withFx=true 时附带港币汇率）。
  // 返回 { 代码: {price, changeRate, name, date} }，汇率以 "HKDCNH" 为键。
  async function fetchQuotes(codes, withFx = false) {
    const secids = [...new Set(codes.map(secid).filter(Boolean))];
    if (withFx) secids.push(FX_SECID);
    if (!secids.length) return {};
    const fields = "f2,f3,f12,f14,f124";
    const base = (host) => `https://${host}/api/qt/ulist.np/get?secids=${secids.join(",")}&fields=${fields}&fltt=2&invt=2`;
    let payload = null;
    for (const host of ["push2.eastmoney.com", "push2delay.eastmoney.com"]) {
      try { payload = await jsonp(base(host), "cb"); if (payload?.data?.diff?.length) break; } catch (e) { /* 尝试下一个节点 */ }
    }
    const result = {};
    const rows = payload?.data?.diff || [];
    for (const row of rows) {
      if (!row?.f12 || !(row.f2 > 0)) continue;
      result[String(row.f12)] = {
        price: Number(row.f2),
        changeRate: Number(row.f3 || 0),
        name: String(row.f14 || ""),
        date: row.f124 ? new Date(row.f124 * 1000).toISOString().slice(0, 10) : "",
      };
    }
    return result;
  }

  // 拉取单只股票的现金分红历史（东财数据中心 RPT_SHAREBONUS_DET）。
  // 返回 [{ exDate, recordDate, payDate, perShare, profile }]
  async function fetchStockDividends(code) {
    const digits = plainCode(code);
    if (!digits) return [];
    const url = "https://datacenter-web.eastmoney.com/api/data/v1/get"
      + "?reportName=RPT_SHAREBONUS_DET"
      + "&columns=SECURITY_CODE,SECURITY_NAME_ABBR,PRETAX_BONUS_RMB,EQUITY_RECORD_DATE,EX_DIVIDEND_DATE,ASSIGN_PROGRESS,IMPL_PLAN_PROFILE"
      + `&filter=(SECURITY_CODE%3D%22${digits}%22)`
      + "&sortColumns=EX_DIVIDEND_DATE&sortTypes=-1&pageSize=60&pageNumber=1";
    const payload = await jsonp(url, "callback");
    const rows = payload?.result?.data || [];
    return rows.filter((row) => row.EX_DIVIDEND_DATE && row.PRETAX_BONUS_RMB > 0).map((row) => ({
      exDate: String(row.EX_DIVIDEND_DATE).slice(0, 10),
      recordDate: row.EQUITY_RECORD_DATE ? String(row.EQUITY_RECORD_DATE).slice(0, 10) : "",
      payDate: "",
      perShare: Number(row.PRETAX_BONUS_RMB) / 10, // “每10股派X元” → 每股
      profile: String(row.IMPL_PLAN_PROFILE || ""),
    }));
  }

  // ETF 分红：读取 data/etf-dividends.js 写入的本地数据（由 WorkBuddy 抓取天天基金生成）。
  function etfDividends(code) {
    return (window.ETF_DIVIDENDS || {})[plainCode(code)] || [];
  }

  // ---- 港币历史汇率（新浪财经 JSONP：fx_shkdcny 日K，收盘价即当日汇率）----
  // 用于按交易日期取成交日汇率。结果缓存在 localStorage，4 天内的缓存不再重复请求。
  const FX_CACHE_KEY = "fx-hkdcny-daily";

  function sinaFxJsonp(cbName) {
    // 新浪的回调名放在 URL 路径里：/forex/api/jsonp.php/{回调名}/接口名
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const timer = setTimeout(() => { delete window[cbName]; script.remove(); reject(new Error("汇率请求超时")); }, 15000);
      window[cbName] = (payload) => { clearTimeout(timer); delete window[cbName]; script.remove(); resolve(payload); };
      script.onerror = () => { clearTimeout(timer); delete window[cbName]; script.remove(); reject(new Error("汇率请求失败")); };
      script.src = `https://vip.stock.finance.sina.com.cn/forex/api/jsonp.php/${cbName}/NewForexService.getDayKLine?symbol=fx_shkdcny`;
      document.head.append(script);
    });
  }

  async function fetchHkFxHistory() {
    let cache = null;
    try { cache = JSON.parse(localStorage.getItem(FX_CACHE_KEY) || "null"); } catch (e) { /* 忽略损坏缓存 */ }
    const staleBefore = new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10);
    if (Array.isArray(cache?.rows) && cache.rows.length && String(cache.lastDate) >= staleBefore) return cache.rows;
    try {
      const cbName = `__msync_fx_${Date.now()}`;
      const payload = await sinaFxJsonp(cbName);
      const text = typeof payload === "string" ? payload : String(payload);
      const rows = text.split("|").map((chunk) => chunk.split(","))
        .filter((parts) => parts.length >= 5 && /^\d{4}-\d{2}-\d{2}$/.test(parts[0]))
        .map((parts) => [parts[0], Number(parts[4])])
        .filter((row) => row[1] > 0);
      if (rows.length) {
        rows.sort((a, b) => a[0].localeCompare(b[0]));
        try { localStorage.setItem(FX_CACHE_KEY, JSON.stringify({ fetchedAt: new Date().toISOString(), lastDate: rows[rows.length - 1][0], rows })); } catch (e) { /* 存储满时忽略 */ }
        return rows;
      }
    } catch (e) { /* 网络失败时退回旧缓存 */ }
    return Array.isArray(cache?.rows) ? cache.rows : [];
  }

  // 取某交易日的汇率（≤该日最近一个交易日的收盘价）。拿不到返回 null。
  async function fxRateOn(date) {
    const rows = await fetchHkFxHistory();
    const target = String(date || "");
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i][0] <= target) return rows[i][1];
    }
    return null;
  }

  window.MarketSync = { jsonp, secid, plainCode, fetchQuotes, fetchStockDividends, etfDividends, fetchHkFxHistory, fxRateOn, FX_KEY };
})();
