const STORAGE_KEY = "asset-pool-v1";

const money = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 });
const app = document.querySelector("#app");
const modalLayer = document.querySelector("#modalLayer");

const seedData = {
  profile: { name: "我的", baseExpense: 6500 },
  assets: [
    { id: "a-cash", name: "日常储蓄", code: "", category: "现金及存款", quantity: 0, avgCost: 0, latestPrice: 0, value: 48000, cost: 48000, monthlyCashflow: 56, account: "招商银行卡", date: "2026-07-28", priceSource: "手动" },
    { id: "a-fund", name: "红利低波 ETF", code: "510880", category: "基金", quantity: 1000, avgCost: 30, latestPrice: 32.6, value: 32600, cost: 30000, monthlyCashflow: 110, account: "证券账户", date: "2026-07-28", priceSource: "手动" },
    { id: "a-stock", name: "贵州茅台", code: "600519", category: "股票", quantity: 10, avgCost: 1695.5, latestPrice: 1840, value: 18400, cost: 16955, monthlyCashflow: 28, account: "证券账户", date: "2026-07-28", priceSource: "手动" },
    { id: "a-gold", name: "积存金", code: "", category: "黄金及贵金属", quantity: 20, avgCost: 540, latestPrice: 600, value: 12000, cost: 10800, monthlyCashflow: 0, account: "支付宝", date: "2026-07-28", priceSource: "手动" },
  ],
  liabilities: [
    { id: "l-mortgage", name: "住房按揭", category: "房贷", balance: 568000, rate: 3.45, monthlyPayment: 3140, dueDay: 15 },
    { id: "l-card", name: "信用卡账单", category: "信用卡", balance: 1240, rate: 18, monthlyPayment: 1240, dueDay: 8 },
  ],
  cashflows: [
    { id: "c-dividend", name: "红利低波 ETF 分红", type: "资产现金流", amount: 330, date: "2026-07-12", sustainable: true, recurring: true },
    { id: "c-interest", name: "存款利息", type: "资产现金流", amount: 56, date: "2026-07-20", sustainable: true, recurring: true },
    { id: "c-salary", name: "工资收入", type: "主动收入", amount: 15000, date: "2026-07-10", sustainable: false, recurring: true },
    { id: "c-rent", name: "房租与日常生活", type: "生活支出", amount: -6500, date: "2026-07-16", sustainable: false, recurring: true },
  ],
  cashflowCategories: ["资产现金流", "主动收入", "生活支出", "房租", "餐饮", "日用品", "交通", "医疗", "教育", "礼赠", "非必需消费", "负债支出", "一次性收支"],
  transactions: [
    { id: "t-1", assetId: "a-fund", type: "买入", quantity: 1000, price: 30, fee: 0, date: "2026-06-18", reason: "建立红利现金流底仓" },
    { id: "t-2", assetId: "a-stock", type: "买入", quantity: 10, price: 1695, fee: 5, date: "2026-05-20", reason: "长期持有优质消费品牌" },
  ],
  notes: [
    { id: "n-1", title: "建仓前的三个问题", type: "投资原则", visibility: "私密", body: "我是否理解它如何赚钱？价格是否留有安全边际？我会在什么情况下承认判断错误？", url: "" },
    { id: "n-2", title: "资产不是名词，是现金流方向", type: "视频卡片", visibility: "可公开", body: "不要只问买了什么，要问这项资产长期会把钱放进口袋还是拿出口袋。", url: "https://www.douyin.com/" },
    { id: "n-3", title: "红利低波的首次建仓复盘", type: "交易复盘", visibility: "私密", body: "分批建仓避免一次性择时，继续观察分红稳定性与估值区间。", url: "" },
  ],
  tasks: { inventory: true, debtRate: true, dividend: true, expense: false, thesis: true },
};

let store = normalizeStore(loadStore());
let data = currentMemberData();
let view = "dashboard";
save();

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function loadStore() {
  let raw;
  try { raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || clone(seedData); }
  catch { return clone(seedData); }
  const plan = globalThis.AssetPoolStatementPlan;
  const marker = plan ? `${STORAGE_KEY}:${plan.id}:applied` : "";
  if (!plan || !globalThis.applyAssetPoolStatementPlan || localStorage.getItem(marker)) return raw;
  try {
    const result = globalThis.applyAssetPoolStatementPlan(raw, plan);
    if (result.conflicts?.length) {
      globalThis.statementReconciliationNotice = "成交单校准暂未执行：现有记录已变化，请重新核对后再应用。";
      return raw;
    }
    if (!result.applied) return raw;
    const verified = normalizeStore(clone(result.store));
    const target = verified.family.members.find((member) => member.id === plan.memberId);
    const errors = rebuildHoldings(target.data);
    if (errors.length) throw new Error(errors.join("；"));
    localStorage.setItem(`${STORAGE_KEY}:${plan.id}:backup`, JSON.stringify(raw));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(verified));
    localStorage.setItem(marker, "1");
    globalThis.statementReconciliationNotice = "成交单已校准：28 笔买卖、8 笔分红、6 笔红利税；原数据已备份。";
    return verified;
  } catch (error) {
    globalThis.statementReconciliationNotice = `成交单校准未完成：${error.message}`;
    return raw;
  }
}
function normalizeStore(raw) {
  if (raw.family?.members?.length) {
    raw.family.members = raw.family.members.map((member) => ({ ...member, data: normalizeData(member.data || seedData) }));
    raw.family.currentMemberId = raw.family.currentMemberId || raw.family.members[0].id;
    return raw;
  }
  const memberName = raw.profile?.name || "我的";
  return { family: { currentMemberId:"m-self", members:[{ id:"m-self", name:memberName, relation:"我", data:normalizeData(raw) }] } };
}
function currentMember() { return store.family.members.find((member) => member.id === store.family.currentMemberId) || store.family.members[0]; }
function currentMemberData() { return currentMember().data; }
function save() { currentMember().data = data; localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }
function switchMember(memberId) { save(); store.family.currentMemberId = memberId; data = currentMemberData(); view = "dashboard"; save(); render(); toast(`已切换到 ${currentMember().name}`); }
function uid(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function fmt(value) { return money.format(Number(value || 0)); }
function pct(value) { return `${decimal.format(value || 0)}%`; }
function escapeHtml(value = "") { return String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]); }
function today() { return new Date().toISOString().slice(0, 10); }
function num(value) { return Number(value || 0); }
function normalizeText(value = "") { return String(value).trim().toLowerCase(); }
function normalizeData(raw) {
  const next = { ...clone(seedData), ...raw };
  next.assets = (next.assets || []).map(normalizeAsset);
  next.liabilities = next.liabilities || [];
  next.cashflows = next.cashflows || [];
  next.cashflowCategories = next.cashflowCategories || clone(seedData.cashflowCategories);
  next.transactions = (next.transactions || []).map(normalizeTransaction);
  next.notes = next.notes || [];
  next.tasks = next.tasks || {};
  migrateOpeningBalances(next);
  rebuildHoldings(next);
  return next;
}
function normalizeAsset(asset) {
  const quantity = num(asset.quantity);
  const value = num(asset.value);
  const cost = num(asset.cost);
  const latestPrice = num(asset.latestPrice) || (quantity ? value / quantity : 0);
  const avgCost = num(asset.avgCost) || (quantity ? cost / quantity : 0);
  return { code: "", currency: "CNY", fxRate: 0, quantity, avgCost, latestPrice, soldQuantity: 0, realizedProfit: 0, realizedPriceGain: 0, manualMonthlyCashflow: undefined, cashflowSource: "手动", openingQuantity: undefined, openingCost: undefined, openingValue: undefined, priceSource: "手动", ...asset, quantity, avgCost, latestPrice };
}
// 外币资产的换算汇率（最新价与成本均以原币记录，估值时折人民币）。港币资产由行情同步自动更新 fxRate。
function assetFxRate(asset) { return asset.currency === "HKD" && num(asset.fxRate) > 0 ? num(asset.fxRate) : 1; }
// 某笔交易折算人民币用的汇率：优先交易记录里保存的成交日汇率，否则回退资产当前汇率。
function txFxRate(tx, asset) {
  if (asset?.currency !== "HKD") return 1;
  return num(tx.fxRate) > 0 ? num(tx.fxRate) : assetFxRate(asset);
}
function transactionGrossRmb(tx, asset) {
  if (tx.grossAmountRmb !== undefined && tx.grossAmountRmb !== null && tx.grossAmountRmb !== "") {
    const amount = Number(tx.grossAmountRmb);
    if (!Number.isFinite(amount) || amount < 0) throw new Error("人民币成交金额无效");
    return amount;
  }
  return num(tx.quantity) * num(tx.price) * txFxRate(tx, asset);
}
function normalizeTransaction(tx) {
  return { id: uid("t"), assetId: "", type: "买入", quantity: 0, price: 0, fee: 0, fxRate: 0, date: today(), reason: "", recurring: true, ...tx, quantity: num(tx.quantity), price: num(tx.price), fee: num(tx.fee), dividendTax: num(tx.dividendTax), fxRate: num(tx.fxRate) };
}
function migrateOpeningBalances(state) {
  state.assets.forEach((asset) => {
    if (asset.openingQuantity !== undefined || asset.openingCost !== undefined || asset.openingValue !== undefined) return;
    const related = state.transactions.filter((tx) => tx.assetId === asset.id);
    const bought = related.filter((tx) => tx.type === "买入").reduce((sum, tx) => sum + num(tx.quantity), 0);
    const sold = related.filter((tx) => tx.type === "卖出").reduce((sum, tx) => sum + num(tx.quantity), 0);
    const buyCost = related.filter((tx) => tx.type === "买入").reduce((sum, tx) => sum + num(tx.quantity) * num(tx.price) + num(tx.fee), 0);
    asset.openingQuantity = Math.max(0, num(asset.quantity) - bought + sold);
    asset.openingCost = Math.max(0, num(asset.cost) - buyCost);
    asset.openingValue = asset.openingQuantity ? asset.openingQuantity * num(asset.latestPrice) * assetFxRate(asset) : (related.length ? 0 : num(asset.value));
  });
}
function assetKey(asset) {
  const code = normalizeText(asset.code);
  return code ? `code:${code}` : [asset.category, asset.name, asset.account].map(normalizeText).join("|");
}
function recalcAsset(asset) {
  asset.quantity = Math.max(0, num(asset.quantity));
  asset.cost = Math.max(0, num(asset.cost));
  asset.avgCost = asset.quantity ? asset.cost / asset.quantity : 0;
  asset.latestPrice = num(asset.latestPrice) || (asset.quantity ? num(asset.value) / asset.quantity : 0);
  asset.value = asset.quantity ? asset.quantity * asset.latestPrice * assetFxRate(asset) : num(asset.value);
}
function cashAssets(state = data) {
  return (state.assets || []).filter((asset) => asset.category === "现金及存款");
}
function cashAssetSelect(selected = "", label = "影响现金账户") {
  const options = cashAssets().map((asset) => `<option value="${asset.id}" ${asset.id === selected ? "selected" : ""}>${escapeHtml(asset.name)}${asset.account ? ` · ${escapeHtml(asset.account)}` : ""}</option>`).join("");
  const help = options ? "选择后，这笔现金流会同步增加或减少该现金资产余额。" : "还没有现金资产。可在新增交易里选择“创建新资产 + 期初建档 + 现金及存款”建立银行卡/现金账户。";
  return `<div class="field full"><label for="f-cashAssetId">${label}</label><select id="f-cashAssetId" name="cashAssetId"><option value="">不影响现金资产</option>${options}</select><small>${help}</small></div>`;
}
function resetAssetToOpening(asset) {
  asset.quantity = num(asset.openingQuantity);
  asset.cost = num(asset.openingCost);
  asset.value = num(asset.openingValue);
  asset.soldQuantity = 0;
  asset.realizedProfit = 0;
  asset.realizedPriceGain = 0;
  recalcAsset(asset);
}
function rebuildHoldings(state = data) {
  const errors = [];
  state.cashflows = (state.cashflows || []).filter((item) => !item.sourceTransactionId);
  state.assets.forEach(resetAssetToOpening);
  [...state.transactions].sort((a, b) => (String(a.date).localeCompare(String(b.date)) || String(a.tradeTime || "").localeCompare(String(b.tradeTime || "")))).forEach((tx) => {
    const result = applyTransaction(tx, { state, syncCashflow: true });
    if (!result.ok) errors.push(result.message);
  });
  reconcileStoredAutoDividends(state);
  applyCashflowBalances(state);
  updateAssetMonthlyCashflows(state);
  return errors;
}
function applyCashflowBalances(state = data) {
  (state.cashflows || []).forEach((item) => {
    if (!item.cashAssetId) return;
    const asset = cashAssets(state).find((cashAsset) => cashAsset.id === item.cashAssetId);
    if (!asset) return;
    const amount = num(item.amount);
    asset.value = num(asset.value) + amount;
    asset.cost = num(asset.cost) + amount;
    asset.date = item.date || asset.date;
    recalcAsset(asset);
  });
}
function trailingYearStart(now = new Date()) {
  const start = new Date(now);
  start.setFullYear(start.getFullYear() - 1);
  return start.toISOString().slice(0, 10);
}
function assetIncomeRecords(assetId, state = data) {
  const start = trailingYearStart();
  return (state.cashflows || []).filter((item) => item.assetId === assetId && item.type === "资产现金流" && item.recurring && String(item.date || "") >= start);
}
function assetIncomeTotal(assetId, state = data) {
  return (state.cashflows || []).filter((item) => item.assetId === assetId && item.type === "资产现金流").reduce((sum, item) => sum + Math.max(0, num(item.amount)), 0);
}
function assetTrailingIncomeTotal(assetId, state = data) {
  return assetIncomeRecords(assetId, state).reduce((sum, item) => sum + Math.max(0, num(item.amount)), 0);
}
function assetPriceGain(asset, state = data) {
  return num(asset.value) - num(asset.cost) + num(asset.realizedPriceGain);
}
function assetTotalGain(asset, state = data) {
  return assetPriceGain(asset, state) + assetIncomeTotal(asset.id, state);
}
function updateAssetMonthlyCashflows(state = data) {
  state.assets.forEach((asset) => {
    if (asset.manualMonthlyCashflow === undefined) asset.manualMonthlyCashflow = num(asset.monthlyCashflow);
    const records = assetIncomeRecords(asset.id, state);
    const trailingTotal = assetTrailingIncomeTotal(asset.id, state);
    if (records.length) {
      asset.monthlyCashflow = trailingTotal / 12;
      asset.cashflowSource = `近一年${records.length}笔`;
    } else {
      asset.monthlyCashflow = num(asset.manualMonthlyCashflow);
      asset.cashflowSource = "手动预估";
    }
  });
}
// —— 行情与分红自动同步（数据源：东方财富公开接口，见 market-sync.js）——
let marketSyncRunning = false;
async function syncMarketData(manual = false) {
  if (marketSyncRunning || !window.MarketSync) return;
  marketSyncRunning = true;
  try {
    const coded = data.assets.filter((item) => MarketSync.plainCode(item.code) && MarketSync.secid(item.code));
    if (!coded.length) { if (manual) toast("没有可同步的标的：请先为股票/基金资产填写代码（A股 6 位数字，港股用 hk 前缀如 hk00700）", true); return; }
    if (manual) toast("正在同步行情与分红…");
    const hasHk = coded.some((item) => /^hk/i.test(String(item.code).trim()) || item.currency === "HKD");
    const quotes = await MarketSync.fetchQuotes(coded.map((item) => item.code), hasHk);
    const hkFx = hasHk ? num(quotes[MarketSync.FX_KEY]?.price) : 0;
    let priceCount = 0;
    for (const asset of coded) {
      const isHk = /^hk/i.test(String(asset.code).trim());
      if (isHk) asset.currency = "HKD";
      const quote = quotes[MarketSync.plainCode(asset.code)];
      if (asset.currency === "HKD" && hkFx > 0) asset.fxRate = hkFx;
      if (quote?.price > 0) {
        asset.latestPrice = quote.price; // 最新价按原币记录（港币资产存港币价），估值时通过 fxRate 折人民币
        asset.date = quote.date || today();
        asset.priceSource = "东财实时";
        recalcAsset(asset);
        priceCount++;
      }
    }
    let dividendCount = 0;
    for (const asset of coded) {
      const digits = MarketSync.plainCode(asset.code);
      let records = [];
      // 分红数据源判断：基金类别或 5/1 开头（沪深 ETF/LOF）读本地 ETF 缓存；
      // 其余（0/2/3 深市股票、6 沪市股票、港股）走股票分红接口。
      const fundLike = asset.category === "基金" || /^[15]/.test(digits);
      if (fundLike) {
        records = MarketSync.etfDividends(digits);
      } else {
        try { records = await MarketSync.fetchStockDividends(digits); } catch (e) { records = []; }
      }
      const firstDate = firstHoldingDate(asset);
      if (!firstDate) continue;
      // 同一除息日可能有多笔分红方案（如年度分红 + 季度分红同日实施），先合并金额
      const byExDate = new Map();
      for (const record of records) {
        if (!record.exDate) continue;
        const prev = byExDate.get(record.exDate);
        if (prev) {
          prev.perShare = Math.round((prev.perShare + num(record.perShare)) * 10000) / 10000;
          prev.parts = (prev.parts || 1) + 1;
        } else {
          byExDate.set(record.exDate, { ...record, parts: 1 });
        }
      }
      for (const record of byExDate.values()) {
        if (record.exDate < firstDate || record.exDate > today()) continue;
        if (reconcileAutoDividend(data, asset, digits, record)) dividendCount++;
      }
    }
    // 港币资产：仅回填缺汇率（0 或 1）的交易，不覆盖用户已输入的实际汇率
    if (MarketSync.fxRateOn) {
      for (const asset of coded) {
        if (asset.currency !== "HKD") continue;
        const hkTxs = data.transactions.filter((tx) => tx.assetId === asset.id && ["买入", "卖出", "期初建档"].includes(tx.type) && (!(num(tx.fxRate) > 0) || num(tx.fxRate) === 1));
        if (!hkTxs.length) continue;
        try {
          for (const tx of hkTxs) {
            const rate = await MarketSync.fxRateOn(tx.date);
            if (rate) tx.fxRate = Math.round(rate * 10000) / 10000;
          }
        } catch (e) { /* 汇率获取失败时维持现有汇率 */ }
      }
    }
    rebuildHoldings();
    save();
    render();
    if (priceCount || dividendCount) toast(`行情已同步：${priceCount} 个标的最新价，更新 ${dividendCount} 笔分红记录`);
    else if (manual) toast("行情已同步：暂无需要更新的内容");
  } catch (error) {
    if (manual) toast(`行情同步失败：${error?.message || "网络异常"}`, true);
  } finally {
    marketSyncRunning = false;
  }
}
function firstHoldingDate(asset) {
  const dates = data.transactions.filter((tx) => tx.assetId === asset.id && ["买入", "期初建档"].includes(tx.type)).map((tx) => String(tx.date)).sort();
  return dates[0] || "";
}
function quantityAtDate(asset, date, state = data) {
  let qty = num(asset.openingQuantity);
  for (const tx of state.transactions) {
    if (tx.assetId !== asset.id || String(tx.date) > String(date)) continue;
    if (tx.type === "买入" || tx.type === "期初建档") qty += num(tx.quantity);
    else if (tx.type === "卖出") qty -= num(tx.quantity);
  }
  return Math.max(0, qty);
}

function reconcileAutoDividend(state, asset, digits, record) {
  const incomeDate = record.recordDate || record.payDate || record.exDate;
  if ((asset.statementIncomePeriods || []).some((period) => incomeDate >= period.from && incomeDate <= period.through)) return false;
  const ref = `auto:div:${digits}:${record.exDate}`;
  const existingIndex = state.cashflows.findIndex((item) => item.sourceRef === ref);
  const held = quantityAtDate(asset, record.recordDate || record.exDate, state);
  const amount = Math.round(held * num(record.perShare) * 100) / 100;
  if (held <= 0 || amount <= 0) {
    if (existingIndex < 0) return false;
    state.cashflows.splice(existingIndex, 1);
    return true;
  }

  const note = `自动同步：每份分红 ${record.perShare} 元 × 持仓 ${held}（除息 ${record.exDate}${record.parts > 1 ? `，同日 ${record.parts} 笔分红合并` : ""}，含税）`;
  const details = {
    assetId: asset.id, incomeKind: "分红", name: `${asset.name} 分红`, type: "资产现金流",
    amount, date: record.payDate || record.exDate, recordDate: record.recordDate || record.exDate,
    exDate: record.exDate, sustainable: true, recurring: true, note,
  };
  if (existingIndex < 0) {
    state.cashflows.unshift({ id: uid("c"), sourceRef: ref, ...details });
    return true;
  }
  const existing = state.cashflows[existingIndex];
  const changed = Object.entries(details).some(([key, value]) => existing[key] !== value);
  Object.assign(existing, details);
  return changed;
}

function reconcileStoredAutoDividends(state = data) {
  state.cashflows = state.cashflows.filter((item) => {
    if (!String(item.sourceRef || "").startsWith("auto:div:")) return true;
    const asset = state.assets.find((candidate) => candidate.id === item.assetId);
    if (!asset) return false;
    if (item.recordDate) return quantityAtDate(asset, item.recordDate, state) > 0;

    // 旧记录没有保存登记日：只清理“除息日前已清仓”的确定情况。
    // 除息日当天有交易时无法判断盘中先后，留待下一次行情同步用登记日校验。
    const exDate = item.exDate || String(item.sourceRef).split(":").at(-1);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(exDate)) return true;
    const tradedOnExDate = state.transactions.some((tx) => tx.assetId === asset.id && String(tx.date) === exDate);
    return tradedOnExDate || quantityAtDate(asset, exDate, state) > 0;
  });
}

function totalsFor(state = data) {
  const assetValue = state.assets.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const liabilityValue = state.liabilities.reduce((sum, item) => sum + Number(item.balance || 0), 0);
  const passive = state.assets.reduce((sum, item) => sum + Number(item.monthlyCashflow || 0), 0);
  const extraCashflow = state.cashflows.filter((item) => item.type === "资产现金流" && item.recurring && !item.assetId).reduce((sum, item) => sum + Math.max(0, Number(item.amount || 0)), 0) / 12;
  const coverageIncome = passive + extraCashflow;
  const expense = Number(state.profile.baseExpense || 0);
  return { assetValue, liabilityValue, netWorth: assetValue - liabilityValue, passive: coverageIncome, expense, coverage: expense ? coverageIncome / expense * 100 : 0 };
}
function totals() { return totalsFor(data); }

function render() {
  const titles = { dashboard: "你的资产池", assets: "资产", liabilities: "负债池", cashflow: "现金流", family: "家庭汇总", journey: "成长地图", notes: "复盘与思想", settings: "数据与设置" };
  document.querySelector("#pageTitle").textContent = titles[view];
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  updateProfileButton();
  const screens = { dashboard: dashboardView, assets: assetsView, liabilities: liabilitiesView, cashflow: cashflowView, family: familyView, journey: journeyView, notes: notesView, settings: settingsView };
  app.innerHTML = screens[view]();
  bindViewEvents();
}

function dashboardView() {
  const t = totals();
  const allocation = allocationData();
  const nextTarget = t.coverage < 10 ? 10 : t.coverage < 30 ? 30 : t.coverage < 50 ? 50 : t.coverage < 100 ? 100 : 150;
  const needed = Math.max(0, data.profile.baseExpense * nextTarget / 100 - t.passive);
  const recent = [...data.cashflows].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  return `<section class="view">
    <div class="section-title"><div><h2>财富不是一笔余额，而是一条正在变宽的河。</h2><p>从可持续现金流开始，慢慢把生活的选择权拿回来。</p></div><div class="actions"><button class="button secondary" data-action="add-cashflow">记录现金流</button><button class="button primary" data-action="add-transaction">新增交易</button></div></div>
    <div class="metric-grid">
      ${metric("资产总额", fmt(t.assetValue), "已录入的全部资产市值")}
      ${metric("负债余额", fmt(t.liabilityValue), "本月待偿还 " + fmt(data.liabilities.reduce((s, x) => s + Number(x.monthlyPayment || 0), 0)), "negative")}
      ${metric("净资产", fmt(t.netWorth), "资产减去负债")}
      ${metric("月资产现金流", fmt(t.passive), "不含工资与一次性收入", "positive")}
    </div>
    <div class="dashboard-grid">
      <article class="panel coverage-hero"><div class="panel-heading"><div><h3>现金流覆盖率</h3><p>资产产生的月现金流 / 基础生活支出</p></div><span class="tag">本月</span></div><div class="coverage-number">${pct(t.coverage)}<small> 覆盖</small></div><div class="progress-track"><span style="width:${Math.min(t.coverage, 100)}%"></span></div><div class="coverage-meta"><span>${fmt(t.passive)} 资产现金流</span><span>${fmt(t.expense)} 基础支出</span></div><div class="coverage-next"><span>下一里程碑</span><b>${nextTarget}%</b><span>还需每月增加 ${fmt(needed)}</span></div></article>
      <article class="panel"><div class="panel-heading"><div><h3>最近现金流</h3><p>收入、支出与资产回报</p></div><button class="button subtle" data-view="cashflow">查看全部</button></div><div class="cashflow-list">${recent.map(cashflowRow).join("") || empty("还没有现金流记录", "记录第一笔分红、利息或支出。")}</div></article>
    </div>
    <div class="split-layout">
      ${pieChartPanel("资产配置", "按当前估值统计 · 点击扇区或图例可查看该类资产", allocation.map(({ label, value }) => ({ label, value })), { centerLabel: "总资产", nav: "assets" })}
      <article class="panel journey-panel"><div class="panel-heading"><div><h3>成长路径</h3><p>目标是自由选择，不是盲目追逐数字。</p></div><button class="button subtle" data-view="journey">查看地图</button></div>${journeyPath(t.coverage)}</article>
    </div>
    <article class="callout"><span>✦</span><div><strong>今天的一个小行动</strong><p>${nextTaskText()} </p></div></article>
  </section>`;
}

function metric(label, value, hint, tone = "") { return `<article class="metric-card"><p class="label">${label}</p><p class="value ${tone}">${value}</p><p class="hint">${hint}</p></article>`; }
function empty(title, body) { return `<div class="empty"><strong>${title}</strong><span>${body}</span></div>`; }

function assetsView() {
  assetFilterState = { category: "全部", query: "" }; // 视图重建时筛选标签复位，状态同步清零（排序状态保留）
  const categories = ["全部", ...new Set(data.assets.map((item) => item.category))];
  if (pendingAssetFilter) { if (categories.includes(pendingAssetFilter)) assetFilterState.category = pendingAssetFilter; pendingAssetFilter = null; }
  const totalPriceGain = data.assets.reduce((sum, item) => sum + assetPriceGain(item), 0);
  const totalGain = data.assets.reduce((sum, item) => sum + assetTotalGain(item), 0);
  const totalIncome = data.assets.reduce((sum, item) => sum + assetIncomeTotal(item.id), 0);
  const trailingIncome = data.assets.reduce((sum, item) => sum + assetTrailingIncomeTotal(item.id), 0);
  return `<section class="view"><div class="section-title"><div><h2>资产</h2><p>资产由交易、期初建档和现金流记录自动汇总。</p></div><div class="actions"><button class="button secondary" data-action="add-asset-income">记录分红/租金</button><button class="button secondary" data-action="sync-market">同步行情</button><button class="button secondary" data-action="update-price">手动改价</button><button class="button primary" data-action="add-transaction">新增交易</button></div></div>
  <div class="metric-grid">${metric("资产总额", fmt(totals().assetValue), `${data.assets.length} 项资产`)}${metric("总收益", fmt(totalGain), `价差 ${fmt(totalPriceGain)} + 分红/租金 ${fmt(totalIncome)}`, totalGain >= 0 ? "positive" : "negative")}${metric("历史总分红", fmt(totalIncome), "资产累计现金回报", "positive")}${metric("近一年现金流", fmt(trailingIncome), `折算月均 ${fmt(trailingIncome / 12)}`, "positive")}</div>
  <div class="filter-bar"><div class="filter-group">${categories.map((category) => `<button class="filter-chip ${category === assetFilterState.category ? "active" : ""}" data-filter-asset="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join("")}</div><input class="search-input" id="assetSearch" placeholder="搜索资产名称" /></div>
  <article class="panel table-panel asset-table"><div class="table-header" id="assetHeader">${assetHeaderCells()}</div><div id="assetRows">${assetRows(filteredAssets())}</div></article>
  <article class="panel history-panel"><div class="panel-heading"><div><h3>交易历史</h3><p id="transactionCount">${data.transactions.length} 笔交易</p></div></div>${transactionFilters()}<div class="table-panel transaction-table"><div class="table-header"><span>交易</span><span>类型</span><span>数量</span><span>价格/金额</span><span>日期</span><span></span></div><div id="transactionRows">${transactionRows(data.transactions)}</div></div></article></section>`;
}
// —— 资产表排序（点击表头列切换升降序，保持当前筛选/搜索条件）——
let assetSort = { key: null, dir: -1 };
let assetFilterState = { category: "全部", query: "" };
let pendingAssetFilter = null; // 由总览饼图点击扇区带入的类别筛选
const ASSET_SORT_ACCESSORS = {
  name: (item) => String(item.name || ""),
  quantity: (item) => num(item.quantity),
  latestPrice: (item) => num(item.latestPrice),
  value: (item) => num(item.value),
  cost: (item) => num(item.cost),
  gain: (item) => assetTotalGain(item),
  income: (item) => assetIncomeTotal(item.id),
  trailingIncome: (item) => assetTrailingIncomeTotal(item.id),
  monthlyCashflow: (item) => num(item.monthlyCashflow),
};
const ASSET_SORT_LABELS = [["name", "资产"], ["quantity", "持仓"], ["latestPrice", "最新价"], ["value", "当前估值"], ["cost", "成本"], ["gain", "收益"], ["income", "历史总分红"], ["trailingIncome", "近一年现金流"], ["monthlyCashflow", "月现金流"]];
function assetHeaderCells() {
  return ASSET_SORT_LABELS.map(([key, label]) => {
    const active = assetSort.key === key;
    const arrow = active ? (assetSort.dir === 1 ? " ↑" : " ↓") : "";
    return `<span class="sortable ${active ? "sorted" : ""}" data-sort-asset="${key}" title="点击排序">${label}${arrow}</span>`;
  }).join("") + "<span></span>";
}
function sortAssetColumn(key) {
  if (!ASSET_SORT_ACCESSORS[key]) return;
  if (assetSort.key === key) assetSort.dir = assetSort.dir === 1 ? -1 : 1;
  else assetSort = { key, dir: key === "name" ? 1 : -1 };
  document.querySelector("#assetHeader").innerHTML = assetHeaderCells();
  bindAssetSortEvents();
  applyAssetFilter();
}
function filteredAssets() {
  return data.assets.filter((item) => (assetFilterState.category === "全部" || item.category === assetFilterState.category) && String(item.name || "").toLowerCase().includes(assetFilterState.query.toLowerCase()));
}
function applyAssetFilter() {
  const rows = document.querySelector("#assetRows");
  if (rows) rows.innerHTML = assetRows(filteredAssets());
}
function bindAssetSortEvents(scope = document) {
  scope.querySelectorAll("[data-sort-asset]").forEach((cell) => cell.addEventListener("click", () => sortAssetColumn(cell.dataset.sortAsset)));
}
function assetRows(items) {
  let list = [...items];
  if (assetSort.key && ASSET_SORT_ACCESSORS[assetSort.key]) {
    const get = ASSET_SORT_ACCESSORS[assetSort.key];
    list.sort((a, b) => {
      const va = get(a); const vb = get(b);
      const cmp = (typeof va === "string" || typeof vb === "string") ? String(va).localeCompare(String(vb), "zh") : va - vb;
      return cmp * assetSort.dir;
    });
  }
  return list.length ? list.map((item) => {
  const totalIncome = assetIncomeTotal(item.id);
  const gain = assetTotalGain(item);
  const priceGain = assetPriceGain(item);
  const gainTone = gain >= 0 ? "positive" : "negative";
  const holding = num(item.quantity) ? `${decimal.format(item.quantity)} 份` : "整体估值";
  const isHk = item.currency === "HKD";
  const latestPrice = num(item.latestPrice) ? (isHk ? `HK$${decimal.format(item.latestPrice)}` : fmt(item.latestPrice)) : "手动估值";
  const priceMeta = `${escapeHtml(item.priceSource || "手动")}${isHk && num(item.fxRate) > 0 ? ` · 汇率 ${decimal.format(item.fxRate)}` : ""}`;
  const avgCostText = num(item.avgCost) ? (isHk ? `折¥ ${fmt(item.avgCost)}` : fmt(item.avgCost)) : "-";
  const trailingIncome = assetTrailingIncomeTotal(item.id);
  return `<div class="data-row"><div class="asset-name"><span class="asset-icon">${assetGlyph(item.category)}</span><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.code || item.category)} · ${escapeHtml(item.account || "未指定账户")} · 更新于 ${item.date || "未记录"}</small></div></div><span>${holding}<small class="muted">均价 ${avgCostText}</small></span><span>${latestPrice}<small class="muted">${priceMeta}</small></span><strong>${fmt(item.value)}</strong><span>${fmt(item.cost)}</span><strong class="${gainTone}">${fmt(gain)}<small class="muted">价差 ${fmt(priceGain)}</small></strong><span class="positive">${fmt(totalIncome)}</span><span class="positive">${fmt(trailingIncome)}</span><span class="positive">${fmt(item.monthlyCashflow || 0)}<small class="muted">${escapeHtml(item.cashflowSource || "手动预估")}</small></span><span class="row-actions"><button class="row-menu" title="编辑资产" aria-label="编辑资产" data-edit-asset="${item.id}">✎</button><button class="row-menu danger-icon" title="删除" data-delete="asset" data-id="${item.id}">×</button></span></div>`;
}).join("") : empty("还没有资产", "从现金、基金、股票或房产开始盘点。"); }
function assetGlyph(category) { return ({ "股票": "股", "基金": "基", "现金及存款": "现", "债券": "债", "黄金及贵金属": "金", "房产": "房", "经营性资产": "营" })[category] || "资"; }
function transactionFilters() {
  const assetOptions = data.assets.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}${item.code ? `（${escapeHtml(item.code)}）` : ""}</option>`).join("");
  return `<div class="history-filters"><select id="txAssetFilter"><option value="全部">全部标的</option>${assetOptions}</select><select id="txTypeFilter"><option value="全部">全部类型</option>${["买入","卖出","分红/派息","红利税","手续费","期初建档"].map((type) => `<option>${type}</option>`).join("")}</select><input id="txStartDate" type="date" aria-label="开始日期" /><input id="txEndDate" type="date" aria-label="结束日期" /><input id="txSearch" type="search" placeholder="搜索理由/标的" /></div>`;
}
function transactionRows(list = data.transactions) {
  const items = [...list].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return items.length ? items.map((tx) => {
    const asset = data.assets.find((item) => item.id === tx.assetId);
    let priceText;
    if (asset?.currency === "HKD" && ["买入", "卖出", "期初建档"].includes(tx.type)) {
      const fx = num(tx.fxRate) > 0 ? tx.fxRate : 1;
      const rmbAmount = transactionGrossRmb(tx, asset) + (tx.type === "卖出" ? -tx.fee - num(tx.dividendTax) : tx.fee);
      priceText = `${fmt(rmbAmount)}<small class="muted">HK$${decimal.format(tx.price)}${num(tx.fxRate) > 0 ? ` × ${decimal.format(tx.fxRate)}` : ""}</small>`;
    } else if (asset?.currency === "HKD") {
      priceText = `HK$${decimal.format(tx.price)}${num(tx.fxRate) > 0 ? `<small class="muted"> × ${decimal.format(tx.fxRate)}</small>` : ""}`;
    } else {
      priceText = fmt(tx.price);
    }
    if (tx.type === "红利税") priceText = `-¥${num(tx.dividendTax).toFixed(2)}`;
    if (tx.statementSource) priceText += `<small class="muted">成交单第 ${num(tx.statementSource.row)} 行</small>`;
    if (tx.type === "卖出") priceText += `<small class="muted">手续费 ¥${num(tx.fee).toFixed(2)} · 红利税 ¥${num(tx.dividendTax).toFixed(2)}</small>`;
    return `<div class="data-row"><div><strong>${escapeHtml(asset?.name || "已删除资产")}</strong><small>${escapeHtml(tx.reason || "未填写复盘")}</small></div><span class="tag">${escapeHtml(tx.type)}</span><span>${num(tx.quantity) ? decimal.format(tx.quantity) : "-"}</span><strong>${priceText}</strong><span class="muted">${tx.date}</span><span class="row-actions"><button class="row-menu" title="修改" aria-label="修改交易" data-edit-transaction="${tx.id}">✎</button><button class="row-menu danger-icon" title="删除" aria-label="删除交易" data-delete-transaction="${tx.id}">×</button></span></div>`;
  }).join("") : empty("还没有交易", "买入、卖出、分红都会出现在这里。");
}

function liabilitiesView() { const total = data.liabilities.reduce((s, x) => s + Number(x.balance || 0), 0); const payment = data.liabilities.reduce((s, x) => s + Number(x.monthlyPayment || 0), 0); return `<section class="view"><div class="section-title"><div><h2>负债池</h2><p>看清每一笔将钱拿出口袋的承诺。</p></div><div class="actions"><button class="button primary" data-action="add-liability">新增负债</button></div></div><div class="metric-grid">${metric("负债余额", fmt(total), `${data.liabilities.length} 笔负债`, "negative")}${metric("本月还款", fmt(payment), "本金与利息的计划支出", "negative")}${metric("最高年利率", `${decimal.format(Math.max(0, ...data.liabilities.map((x) => Number(x.rate || 0))))}%`, "高利率负债值得优先关注", "negative")}${metric("净资产影响", fmt(-total), "资产减去未偿余额", "negative")}</div><article class="callout"><span>!</span><div><strong>关注高成本负债</strong><p>信用卡、消费贷等高利率负债会持续侵蚀现金流。这里提供提醒和数据，不提供投资或还款建议。</p></div></article><article class="panel table-panel liability-table"><div class="table-header"><span>负债</span><span>剩余余额</span><span>年利率</span><span>月供</span><span>还款日</span><span></span></div>${liabilityRows()}</article></section>`; }
function liabilityRows() { return data.liabilities.length ? data.liabilities.map((item) => `<div class="data-row"><div class="asset-name"><span class="asset-icon" style="background:var(--red-pale);color:var(--red)">负</span><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.category)}</small></div></div><strong class="negative">${fmt(item.balance)}</strong><span class="${Number(item.rate) >= 10 ? "negative" : "muted"}">${decimal.format(item.rate)}%</span><span>${fmt(item.monthlyPayment)}</span><span class="muted">每月 ${item.dueDay} 日</span><button class="row-menu" title="删除" data-delete="liability" data-id="${item.id}">×</button></div>`).join("") : empty("还没有负债", "保持良好，或录入房贷、车贷等长期负债。"); }

function cashflowView() { const items = [...data.cashflows].sort((a, b) => b.date.localeCompare(a.date)); const income = items.filter((x) => Number(x.amount) > 0).reduce((s,x)=>s+Number(x.amount),0); const spending = items.filter((x) => Number(x.amount) < 0).reduce((s,x)=>s+Number(x.amount),0); const categories = ["全部", ...new Set([...(data.cashflowCategories || []), ...items.map((item) => item.type)])]; return `<section class="view"><div class="section-title"><div><h2>现金流</h2><p>分清收入、资产现金流、基础支出和非必需消费。</p></div><div class="actions"><button class="button secondary" data-action="manage-cash-categories">管理类别</button><button class="button primary" data-action="add-cashflow">记录现金流</button></div></div><div class="metric-grid">${metric("本期流入", fmt(income), "全部正向现金流", "positive")}${metric("本期流出", fmt(Math.abs(spending)), "全部支出记录", "negative")}${metric("净现金流", fmt(income + spending), "流入减去流出", income + spending >= 0 ? "positive" : "negative")}${metric("资产现金流", fmt(totals().passive), "用于计算覆盖率", "positive")}</div><div class="filter-bar"><div class="filter-group">${categories.map((category, index) => `<button class="filter-chip ${index === 0 ? "active" : ""}" data-filter-cash="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join("")}</div></div><article class="panel table-panel cash-table"><div class="table-header"><span>项目</span><span>类型</span><span>日期</span><span>金额</span><span></span></div><div id="cashRows">${cashRows(items)}</div></article></section>`; }
function cashflowMeta(item) {
  const asset = item.assetId ? data.assets.find((asset) => asset.id === item.assetId) : null;
  const cashAsset = item.cashAssetId ? data.assets.find((asset) => asset.id === item.cashAssetId) : null;
  const parts = [item.type, item.incomeKind, asset?.name, cashAsset ? `入账 ${cashAsset.name}` : "", item.date].filter(Boolean);
  return parts.join(" · ");
}
function cashflowRow(item) { const plus = Number(item.amount) >= 0; return `<div class="cashflow-item"><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(cashflowMeta(item))}</small></div><b class="${plus ? "positive" : "negative"}">${plus ? "+" : ""}${fmt(item.amount)}</b></div>`; }
function cashRows(items) { return items.length ? items.map((item) => { const plus = Number(item.amount) >= 0; const cashAsset = item.cashAssetId ? data.assets.find((asset) => asset.id === item.cashAssetId) : null; const action = item.sourceTransactionId ? `<span class="muted">交易生成</span>` : `<span class="row-actions"><button class="row-menu" title="修改" aria-label="修改现金流" data-edit-cashflow="${item.id}">✎</button><button class="row-menu danger-icon" title="删除" aria-label="删除现金流" data-delete="cashflow" data-id="${item.id}">×</button></span>`; return `<div class="data-row"><div><strong>${escapeHtml(item.name)}</strong>${item.sustainable ? `<small>${item.assetId ? "计入该资产近一年月均现金流" : "计入可持续资产现金流"}</small>` : cashAsset ? `<small>已同步到 ${escapeHtml(cashAsset.name)}</small>` : ""}</div><span class="tag">${escapeHtml(item.incomeKind || item.type)}</span><span class="muted">${item.date}</span><strong class="${plus ? "positive" : "negative"}">${plus ? "+" : ""}${fmt(item.amount)}</strong>${action}</div>`; }).join("") : empty("还没有现金流记录", "从一笔生活支出或一笔分红开始。"); }

function journeyView() { const t = totals(); const tasks = [ ["inventory", "完成首轮资产盘点"], ["debtRate", "补齐所有债务利率"], ["dividend", "记录第一笔资产现金流"], ["expense", "连续三个月更新生活支出"], ["thesis", "为一项资产写下投资理由"] ]; return `<section class="view"><div class="section-title"><div><h2>成长地图</h2><p>用长期行动，换取越来越多的选择权。</p></div></div><div class="split-layout"><article class="panel goal-card"><div class="panel-heading"><div><h3>走向财务安全</h3><p>当资产现金流覆盖你的基础生活支出。</p></div><span class="tag">当前目标</span></div><div class="big">${pct(t.coverage)} <span style="font-size:14px;font-weight:500">/ 100%</span></div><p class="muted">每月还需增加 <strong class="positive">${fmt(Math.max(0, t.expense - t.passive))}</strong> 的可持续资产现金流。</p><div class="progress-track goal-progress"><span style="width:${Math.min(t.coverage,100)}%"></span></div><div class="coverage-meta" style="color:var(--ink-soft)"><span>${fmt(t.passive)} 已建立</span><span>${fmt(t.expense)} 目标</span></div></article><article class="panel"><div class="panel-heading"><div><h3>本阶段行动</h3><p>完成事实性的财务整理，而不是冲动交易。</p></div></div><div class="tasks">${tasks.map(([key, label]) => `<label class="task ${data.tasks[key] ? "done" : ""}"><input type="checkbox" data-task="${key}" ${data.tasks[key] ? "checked" : ""}/><span>${label}</span></label>`).join("")}</div></article></div><article class="panel journey-panel"><div class="panel-heading"><div><h3>你的资产池路径</h3><p>阶段可在正式版中自定义。</p></div></div>${journeyPath(t.coverage, true)}</article><article class="callout"><span>✦</span><div><strong>衡量的是结构，不是炫耀的数字</strong><p>工资、浮盈和卖出本金都很重要，但不会替代“可持续资产现金流”这个核心指标。</p></div></article></section>`; }
function journeyPath(coverage, expanded = false) { const stages = [{ n:"盘点", c:0, d:"看见全貌" }, { n:"起步", c:10, d:"第一笔现金流" }, { n:"小溪", c:30, d:"覆盖一部分支出" }, { n:"河流", c:50, d:"半自由状态" }, { n:"安全", c:100, d:"覆盖基础生活" }]; return `<div class="journey-path">${stages.map((stage, index) => { const status = coverage >= stage.c && (stage.c !== 0 || coverage >= 0) ? (coverage >= (stages[index + 1]?.c ?? Infinity) ? "done" : "current") : ""; return `<div class="journey-stage ${status}"><span class="stage-dot">${status === "done" ? "✓" : stage.c + "%"}</span><strong>${stage.n}</strong><small>${expanded ? stage.d : stage.c + "% 覆盖"}</small></div>`; }).join("")}</div>`; }

// ===== 家庭汇总视图：自选成员合并统计，相同资产按代码/名称自动加总 =====
const familyViewState = { selected: null };

function aggregateFamilyData(ids = []) {
  const members = store.family.members.filter((member) => ids.includes(member.id));
  const assetMap = new Map();
  const liabilityMap = new Map();
  const acc = { assetValue: 0, liabilityValue: 0, passive: 0, expense: 0 };
  for (const member of members) {
    const mt = totalsFor(member.data);
    acc.assetValue += mt.assetValue; acc.liabilityValue += mt.liabilityValue;
    acc.passive += mt.passive; acc.expense += mt.expense;
    for (const asset of member.data.assets) {
      const key = assetKey(asset);
      if (!assetMap.has(key)) {
        assetMap.set(key, { name: asset.name, code: asset.code || "", category: asset.category, account: asset.account || "", quantity: num(asset.quantity), cost: num(asset.cost), value: num(asset.value), monthlyCashflow: num(asset.monthlyCashflow), realizedProfit: num(asset.realizedProfit), owners: [member.name] });
      } else {
        const target = assetMap.get(key);
        target.quantity += num(asset.quantity); target.cost += num(asset.cost); target.value += num(asset.value);
        target.monthlyCashflow += num(asset.monthlyCashflow); target.realizedProfit += num(asset.realizedProfit);
        if (!target.code && asset.code) target.code = asset.code;
        if (!target.owners.includes(member.name)) target.owners.push(member.name);
      }
    }
    for (const item of member.data.liabilities) {
      const key = [item.name, item.category].map(normalizeText).join("|");
      if (!liabilityMap.has(key)) {
        liabilityMap.set(key, { name: item.name, category: item.category, balance: num(item.balance), monthlyPayment: num(item.monthlyPayment), rate: num(item.rate), owners: [member.name] });
      } else {
        const target = liabilityMap.get(key);
        target.balance += num(item.balance); target.monthlyPayment += num(item.monthlyPayment);
        target.rate = Math.max(target.rate, num(item.rate));
        if (!target.owners.includes(member.name)) target.owners.push(member.name);
      }
    }
  }
  return {
    members,
    assets: [...assetMap.values()].sort((a, b) => b.value - a.value),
    liabilities: [...liabilityMap.values()].sort((a, b) => b.balance - a.balance),
    totals: { ...acc, netWorth: acc.assetValue - acc.liabilityValue, coverage: acc.expense ? acc.passive / acc.expense * 100 : 0 },
  };
}

// ===== 通用表格排序（默认配置）=====
// 每张表注册一条配置：columns = [排序key, 表头文案, 首次点击默认方向(1升/-1降)]，accessors = 取值函数；
// default = [key, dir] 表示进入页面时的初始排序。新增可排序表只需在这里加一条配置，点击事件已统一委托。
const TABLE_SORT_CONFIG = {
  "family-assets": {
    columns: [["name", "资产（合并）", 1], ["category", "类别", 1], ["quantity", "数量", -1], ["cost", "成本", -1], ["value", "估值", -1], ["gain", "浮动盈亏", -1]],
    accessors: { name: (a) => a.name, category: (a) => a.category, quantity: (a) => num(a.quantity), cost: (a) => num(a.cost), value: (a) => num(a.value), gain: (a) => num(a.value) - num(a.cost) },
    default: ["value", -1],
  },
  "family-members": {
    columns: [["name", "成员", 1], ["assetValue", "资产", -1], ["liabilityValue", "负债", -1], ["netWorth", "净资产", -1], ["passive", "月现金流", -1]],
    accessors: { name: (m) => m.member.name, assetValue: (m) => m.mt.assetValue, liabilityValue: (m) => m.mt.liabilityValue, netWorth: (m) => m.mt.netWorth, passive: (m) => m.mt.passive },
    default: ["assetValue", -1],
  },
  "family-liabilities": {
    columns: [["name", "负债（合并）", 1], ["balance", "余额", -1], ["rate", "利率", -1], ["monthlyPayment", "月供", -1]],
    accessors: { name: (l) => l.name, balance: (l) => num(l.balance), rate: (l) => num(l.rate), monthlyPayment: (l) => num(l.monthlyPayment) },
    default: ["balance", -1],
  },
};
const tableSortState = {}; // 运行时排序状态：{ key, dir }，切换视图/勾选成员后保留
function tableSortStateFor(tableKey) {
  if (tableSortState[tableKey]) return tableSortState[tableKey];
  const conf = TABLE_SORT_CONFIG[tableKey];
  return conf?.default ? { key: conf.default[0], dir: conf.default[1] } : null;
}
function tableSortHeader(tableKey, trailing = "") {
  const conf = TABLE_SORT_CONFIG[tableKey];
  if (!conf) return "";
  const state = tableSortStateFor(tableKey);
  return conf.columns.map(([key, label, dir]) => {
    const active = state && state.key === key;
    const arrow = active ? (state.dir === 1 ? " ↑" : " ↓") : "";
    return `<span class="sortable ${active ? "sorted" : ""}" data-sort-table="${tableKey}" data-sort-key="${key}" title="点击排序">${label}${arrow}</span>`;
  }).join("") + trailing;
}
function sortTableRows(tableKey, rows) {
  const conf = TABLE_SORT_CONFIG[tableKey];
  const state = tableSortStateFor(tableKey);
  const get = conf?.accessors[state?.key];
  if (!get) return rows;
  return [...rows].sort((a, b) => {
    const va = get(a); const vb = get(b);
    const cmp = (typeof va === "string" || typeof vb === "string") ? String(va).localeCompare(String(vb), "zh") : va - vb;
    return cmp * state.dir;
  });
}

// ===== 饼图（SVG 环形图）：市值占比与总额 =====
const PIE_COLORS = ["#12695f", "#2e9e8a", "#7fc8b8", "#c8a15a", "#b4713d", "#8c5b7c", "#5b6f9e", "#a35555", "#6b8f5a", "#8a8f8c"];

function pieChartPanel(title, subtitle, items, options = {}) {
  const centerLabel = options.centerLabel || "总市值";
  const nav = options.nav || null;
  const valid = items.filter((item) => num(item.value) > 0).sort((a, b) => b.value - a.value);
  const total = valid.reduce((sum, item) => sum + item.value, 0);
  let body;
  if (!total) {
    body = `<p class="muted" style="padding:6px 20px 18px">暂无数据，勾选成员后这里会显示占比。</p>`;
  } else {
    const cx = 90, cy = 90, ro = 80, ri = 54;
    let angle = -Math.PI / 2;
    const sliceAttrs = (item, index) => ` class="pie-slice" data-pie-idx="${index}" data-label="${escapeHtml(item.label)}" data-value="${fmt(item.value)}" data-share="${decimal.format(Math.round(item.value / total * 1000) / 10)}%"`;
    const slices = valid.map((item, index) => {
      const frac = item.value / total;
      const a0 = angle, a1 = angle + frac * Math.PI * 2;
      angle = a1;
      const color = PIE_COLORS[index % PIE_COLORS.length];
      if (frac >= 0.9999) return `<circle cx="${cx}" cy="${cy}" r="${(ro + ri) / 2}" fill="none" stroke="${color}" stroke-width="${ro - ri}"${sliceAttrs(item, index)}/>`;
      const large = frac > 0.5 ? 1 : 0;
      const p = (r, a) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
      return `<path d="M ${p(ro, a0)} A ${ro} ${ro} 0 ${large} 1 ${p(ro, a1)} L ${p(ri, a1)} A ${ri} ${ri} 0 ${large} 0 ${p(ri, a0)} Z" fill="${color}"${sliceAttrs(item, index)}/>`;
    }).join("");
    const legend = valid.map((item, index) => {
      const share = item.value / total * 100;
      return `<li data-pie-idx="${index}" data-label="${escapeHtml(item.label)}" data-value="${fmt(item.value)}" data-share="${decimal.format(Math.round(share * 10) / 10)}%"><span class="dot" style="background:${PIE_COLORS[index % PIE_COLORS.length]}"></span><span class="name" title="${escapeHtml(item.label)}">${escapeHtml(item.label)}</span><span class="val">${fmt(item.value)}</span><span class="share">${decimal.format(Math.round(share * 10) / 10)}%</span></li>`;
    }).join("");
    body = `<div class="pie-wrap pie-chart${nav ? " clickable" : ""}" data-total="${fmt(total)}" data-center-label="${escapeHtml(centerLabel)}"${nav ? ` data-nav="${nav}"` : ""}>
      <svg viewBox="0 0 180 180" class="pie-svg" role="img" aria-label="${escapeHtml(title)}">
        ${slices}
        <text x="90" y="85" text-anchor="middle" class="pie-center-total">¥${decimal.format(Math.round(total))}</text>
        <text x="90" y="102" text-anchor="middle" class="pie-center-label">${escapeHtml(centerLabel)}</text>
      </svg>
      <ul class="pie-legend">${legend}</ul>
    </div>`;
  }
  return `<article class="panel pie-panel"><div class="panel-heading"><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(subtitle)}</p></div></div>${body}</article>`;
}

function familyView() {
  const members = store.family.members;
  if (!familyViewState.selected) familyViewState.selected = members.map((member) => member.id);
  const selectedIds = members.filter((member) => familyViewState.selected.includes(member.id)).map((member) => member.id);
  const agg = aggregateFamilyData(selectedIds);
  const t = agg.totals;
  const allOn = selectedIds.length === members.length;
  const chips = members.map((member) => `<button class="filter-chip ${selectedIds.includes(member.id) ? "active" : ""}" data-family-member="${member.id}">${escapeHtml(member.name)}</button>`).join("");
  const memberRows = agg.members.length ? sortTableRows("family-members", agg.members.map((member) => ({ member, mt: totalsFor(member.data) }))).map(({ member, mt }) => {
    return `<div class="data-row"><div><strong>${escapeHtml(member.name)}</strong><small>${escapeHtml(member.relation || "成员")}</small></div><span>${fmt(mt.assetValue)}</span><span class="negative">${fmt(mt.liabilityValue)}</span><strong>${fmt(mt.netWorth)}</strong><span class="positive">${fmt(mt.passive)}/月</span></div>`;
  }).join("") : empty("未选择成员", "点击上方成员名勾选想要汇总的人。");
  const assetRows = agg.assets.length ? sortTableRows("family-assets", agg.assets).map((asset) => {
    const gain = asset.value - asset.cost;
    return `<div class="data-row"><div class="asset-name"><span class="asset-icon">${escapeHtml(asset.name.slice(0, 1) || "资")}</span><div><strong>${escapeHtml(asset.name)}</strong><small>${escapeHtml(asset.owners.join("、"))}${asset.code ? ` · ${escapeHtml(asset.code)}` : ""}</small></div></div><span class="muted">${escapeHtml(asset.category)}</span><span>${asset.quantity ? decimal.format(asset.quantity) : "-"}</span><span>${fmt(asset.cost)}</span><strong>${fmt(asset.value)}</strong><strong class="${gain >= 0 ? "positive" : "negative"}">${gain >= 0 ? "+" : ""}${fmt(gain)}</strong></div>`;
  }).join("") : empty("所选成员暂无资产", "勾选成员后，相同资产会自动合并加总。");
  const liabilityRows = agg.liabilities.length ? sortTableRows("family-liabilities", agg.liabilities).map((item) => `<div class="data-row"><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.owners.join("、"))} · ${escapeHtml(item.category || "负债")}</small></div><strong class="negative">${fmt(item.balance)}</strong><span>${decimal.format(item.rate)}%</span><span>${fmt(item.monthlyPayment)}</span></div>`).join("") : empty("所选成员暂无负债", "保持良好。");
  return `<section class="view">
    <div class="section-title"><div><h2>家庭汇总</h2><p>自选成员合并统计；相同资产（按代码或名称+账户）自动加总，只读不影响各成员数据。</p></div><div class="actions"><button class="button secondary" data-family-all="${allOn ? "none" : "all"}">${allOn ? "取消全选" : "全选"}</button></div></div>
    <div class="filter-bar"><div class="filter-group">${chips}</div></div>
    <div class="metric-grid">
      ${metric("资产总额", fmt(t.assetValue), `${agg.members.length} 位成员合计`)}
      ${metric("负债余额", fmt(t.liabilityValue), "合并全部负债", "negative")}
      ${metric("净资产", fmt(t.netWorth), "资产减负债")}
      ${metric("月资产现金流", fmt(t.passive), `合计覆盖率 ${pct(t.coverage)}`, "positive")}
    </div>
    <div class="split-layout">
      ${pieChartPanel("各成员市值占比", "所选成员的资产市值构成与总额", agg.members.map((member) => ({ label: member.name, value: totalsFor(member.data).assetValue })))}
      ${pieChartPanel("各资产市值占比", "合并后每项资产的市值构成与总额", agg.assets.map((asset) => ({ label: asset.name, value: asset.value })))}
    </div>
    <article class="panel table-panel family-table"><div class="table-header">${tableSortHeader("family-assets")}</div>${assetRows}</article>
    <div class="split-layout">
      <article class="panel table-panel family-member-table"><div class="table-header">${tableSortHeader("family-members")}</div>${memberRows}</article>
      <article class="panel table-panel family-liability-table"><div class="table-header">${tableSortHeader("family-liabilities")}</div>${liabilityRows}</article>
    </div>
  </section>`;
}
function toggleFamilyMember(id) {
  const list = familyViewState.selected || [];
  familyViewState.selected = list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
  render();
}

function notesView() { return `<section class="view"><div class="section-title"><div><h2>复盘与思想</h2><p>让每一次决策都留下理由，让经验慢慢成为自己的系统。</p></div><div class="actions"><button class="button primary" data-action="add-note">新建内容</button></div></div><div class="note-grid">${data.notes.map((note) => `<article class="note-card"><span class="tag">${escapeHtml(note.type)}</span><h3>${escapeHtml(note.title)}</h3><p>${escapeHtml(note.body)}</p><div style="margin-top:13px;display:flex;justify-content:space-between;align-items:center"><small class="muted">${escapeHtml(note.visibility)}</small>${note.url ? `<a class="button subtle" target="_blank" rel="noreferrer" href="${escapeHtml(note.url)}">打开链接</a>` : `<button class="row-menu" data-delete="note" data-id="${note.id}" title="删除">×</button>`}</div></article>`).join("") || empty("还没有复盘", "写下你的第一条投资原则或交易复盘。")}</div><article class="callout"><span>●</span><div><strong>私密与公开内容分开保存</strong><p>“可公开”的内容可在下一阶段导出到你的内容网站；金额、账户和家庭资料不会被带出。</p></div></article></section>`; }

function settingsView() { return `<section class="view"><div class="section-title"><div><h2>数据与设置</h2><p>家庭资料库保存在当前浏览器的本地存储中。</p></div></div><div class="settings-grid"><article class="panel"><div class="panel-heading"><div><h3>当前成员</h3><p>设置 ${escapeHtml(currentMember().name)} 的基础生活支出目标。</p></div></div><div class="setting-list"><div class="setting-item"><div><strong>基础生活支出</strong><p>用于计算财务安全覆盖率。</p></div><button class="button secondary" data-action="set-expense">${fmt(data.profile.baseExpense)} / 月</button></div><div class="setting-item"><div><strong>当前成员数据</strong><p>只清空 ${escapeHtml(currentMember().name)} 的资产、负债、现金流和交易记录。</p></div><button class="button danger" data-action="clear-data">清空数据</button></div></div></article><article class="panel"><div class="panel-heading"><div><h3>家庭备份</h3><p>导出后请将文件放在你信任的位置。</p></div></div><div class="setting-list"><div class="setting-item"><div><strong>导出家庭完整备份</strong><p>下载包含全部家庭成员、资产、负债、记录和笔记的 JSON 文件。</p></div><button class="button primary" data-action="export-data">导出</button></div><div class="setting-item"><div><strong>导入家庭备份</strong><p>导入会覆盖当前浏览器中的全部家庭资料库。</p></div><label class="button secondary" for="importFile">导入</label><input class="file-input" id="importFile" type="file" accept="application/json,.json" /></div></div></article></div><article class="callout"><span>!</span><div><strong>原型的数据边界</strong><p>现在的版本使用浏览器本地存储，适合验证流程，但还不是加密的正式财务资料库。正式可售版会迁移为桌面应用和加密数据库。</p></div></article></section>`; }

function allocationData() { const total = totals().assetValue || 1; const labels = ["现金及存款", "基金", "股票", "其他"]; const values = labels.map((label) => ({ label, value: data.assets.filter((x) => label === "其他" ? !["现金及存款","基金","股票"].includes(x.category) : x.category === label).reduce((s,x)=>s+Number(x.value||0),0) })); return values.map((x) => ({ ...x, percent: x.value / total * 100 })); }
function nextTaskText() { const pending = { inventory:"完成你的首轮资产盘点，让总览有可信的起点。", debtRate:"为每笔负债补充年利率，识别真正昂贵的负担。", dividend:"记录一笔分红、利息或租金，开始追踪资产现金流。", expense:"更新基础生活支出目标，让覆盖率贴近真实生活。", thesis:"为一项资产写下投资理由，给未来的自己留下判断依据。" }; return Object.entries(pending).find(([key]) => !data.tasks[key])?.[1] || "很好，当前阶段的基础任务已完成。现在可以整理一次月度复盘。"; }

function bindViewEvents() {
  const scope = app;
  // 行内按钮（编辑/删除/切换视图/操作）统一走 app 事件委托，避免 innerHTML 替换后丢失事件
  scope.querySelectorAll("[data-task]").forEach((input) => input.addEventListener("change", () => { data.tasks[input.dataset.task] = input.checked; save(); render(); }));
  bindAssetSortEvents(scope);
  scope.querySelector("#assetSearch")?.addEventListener("input", (event) => searchAssets(event.target.value));
  ["#txAssetFilter", "#txTypeFilter", "#txStartDate", "#txEndDate", "#txSearch"].forEach((selector) => scope.querySelector(selector)?.addEventListener("input", filterTransactions));
  ["#txAssetFilter", "#txTypeFilter", "#txStartDate", "#txEndDate"].forEach((selector) => scope.querySelector(selector)?.addEventListener("change", filterTransactions));
  scope.querySelector("#importFile")?.addEventListener("change", importData);
}

function handleAppClick(event) {
  const viewBtn = event.target.closest("[data-view]");
  if (viewBtn) { view = viewBtn.dataset.view; render(); return; }
  const actionBtn = event.target.closest("[data-action]");
  if (actionBtn) { handleAction(actionBtn.dataset.action); return; }
  const delBtn = event.target.closest("[data-delete]");
  if (delBtn) { deleteItem(delBtn.dataset.delete, delBtn.dataset.id); return; }
  const editTxBtn = event.target.closest("[data-edit-transaction]");
  if (editTxBtn) { transactionForm(editTxBtn.dataset.editTransaction); return; }
  const delTxBtn = event.target.closest("[data-delete-transaction]");
  if (delTxBtn) { deleteTransaction(delTxBtn.dataset.deleteTransaction); return; }
  const editAssetBtn = event.target.closest("[data-edit-asset]");
  if (editAssetBtn) { assetEditForm(editAssetBtn.dataset.editAsset); return; }
  const editCashBtn = event.target.closest("[data-edit-cashflow]");
  if (editCashBtn) { editCashflow(editCashBtn.dataset.editCashflow); return; }
  const filterAssetBtn = event.target.closest("[data-filter-asset]");
  if (filterAssetBtn) { filterAssets(filterAssetBtn.dataset.filterAsset, filterAssetBtn); return; }
  const filterCashBtn = event.target.closest("[data-filter-cash]");
  if (filterCashBtn) { filterCash(filterCashBtn.dataset.filterCash, filterCashBtn); return; }
  const familyChip = event.target.closest("[data-family-member]");
  if (familyChip) { toggleFamilyMember(familyChip.dataset.familyMember); return; }
  const familyAllBtn = event.target.closest("[data-family-all]");
  if (familyAllBtn) { familyViewState.selected = familyAllBtn.dataset.familyAll === "all" ? store.family.members.map((member) => member.id) : []; render(); return; }
  // 通用表格排序：点击任意注册过的表头列，切换升/降序后重渲染（排序状态在各表间独立记忆）
  const sortCell = event.target.closest("[data-sort-table]");
  if (sortCell) {
    const tableKey = sortCell.dataset.sortTable;
    const key = sortCell.dataset.sortKey;
    const column = TABLE_SORT_CONFIG[tableKey]?.columns.find(([colKey]) => colKey === key);
    if (column) {
      const current = tableSortStateFor(tableKey);
      tableSortState[tableKey] = current && current.key === key ? { key, dir: current.dir === 1 ? -1 : 1 } : { key, dir: column[2] };
      render();
    }
    return;
  }
}

function filterAssets(category, button) { document.querySelectorAll("[data-filter-asset]").forEach((item) => item.classList.toggle("active", item === button)); assetFilterState.category = category; applyAssetFilter(); }
function searchAssets(query) { assetFilterState.query = String(query || "").trim(); applyAssetFilter(); }
function filterCash(category, button) { document.querySelectorAll("[data-filter-cash]").forEach((item) => item.classList.toggle("active", item === button)); const items = [...data.cashflows].sort((a,b)=>b.date.localeCompare(a.date)).filter((item) => category === "全部" || item.type === category); document.querySelector("#cashRows").innerHTML = cashRows(items); }
function filterTransactions() {
  const assetId = document.querySelector("#txAssetFilter")?.value || "全部";
  const type = document.querySelector("#txTypeFilter")?.value || "全部";
  const start = document.querySelector("#txStartDate")?.value || "";
  const end = document.querySelector("#txEndDate")?.value || "";
  const query = normalizeText(document.querySelector("#txSearch")?.value || "");
  const items = data.transactions.filter((tx) => {
    const asset = data.assets.find((item) => item.id === tx.assetId);
    const haystack = normalizeText([asset?.name, asset?.code, tx.type, tx.reason, tx.date].filter(Boolean).join(" "));
    return (assetId === "全部" || tx.assetId === assetId)
      && (type === "全部" || tx.type === type)
      && (!start || String(tx.date) >= start)
      && (!end || String(tx.date) <= end)
      && (!query || haystack.includes(query));
  });
  document.querySelector("#transactionRows").innerHTML = transactionRows(items);
  const counter = document.querySelector("#transactionCount");
  if (counter) counter.textContent = `${items.length} / ${data.transactions.length} 笔交易`;
}

function handleAction(action) { const actions = { "add-liability": liabilityForm, "add-cashflow": cashflowForm, "add-asset-income": assetIncomeForm, "add-transaction": transactionForm, "update-price": priceForm, "sync-market": () => syncMarketData(true), "add-note": noteForm, "set-expense": expenseForm, "manage-cash-categories": cashCategoryForm, "clear-data": clearData, "export-data": exportData }; actions[action]?.(); }
function openModal(title, description, content, onSubmit, submitLabel = "保存") { modalLayer.innerHTML = `<form class="modal" id="modalForm"><div class="modal-head"><div><h2>${title}</h2><p>${description}</p></div><button class="close" type="button" data-close-modal>×</button></div><div class="modal-body">${content}</div><div class="modal-foot"><button class="button secondary" type="button" data-close-modal>取消</button><button class="button primary" type="submit">${submitLabel}</button></div></form>`; modalLayer.classList.add("open"); modalLayer.setAttribute("aria-hidden", "false"); modalLayer.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeModal)); modalLayer.querySelector("#modalForm").addEventListener("submit", async (event) => { event.preventDefault(); await onSubmit(new FormData(event.currentTarget)); }); }
function closeModal() { modalLayer.classList.remove("open"); modalLayer.setAttribute("aria-hidden", "true"); modalLayer.innerHTML = ""; }
function formFields(fields) { return `<div class="form-grid">${fields.join("")}</div>`; }
function field(name, label, type = "text", value = "", extra = "") { const isOptional = extra.includes("optional"); return `<div class="field ${extra.includes("full") ? "full" : ""}"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" type="${type}" value="${escapeHtml(value)}" ${extra.replace("full", "").replace("optional", "")} ${isOptional ? "" : "required"} /></div>`; }
function select(name, label, values, selected = "", extra = "") { return `<div class="field ${extra}"><label for="f-${name}">${label}</label><select id="f-${name}" name="${name}">${values.map((value) => `<option ${value === selected ? "selected" : ""}>${value}</option>`).join("")}</select></div>`; }
function textArea(name, label, value = "", extra = "full") { return `<div class="field ${extra}"><label for="f-${name}">${label}</label><textarea id="f-${name}" name="${name}">${escapeHtml(value)}</textarea></div>`; }

function liabilityForm() { openModal("新增负债", "负债会影响你的净资产与每月现金流。", formFields([field("name","负债名称","text","","full"), select("category","负债类别",["房贷","车贷","消费贷","信用卡","经营贷","亲友借款","其他负债"]), field("balance","剩余余额（元）","number","",'min="0" step="0.01"'), field("rate","年利率（%）","number","",'min="0" step="0.01"'), field("monthlyPayment","每月还款（元）","number","",'min="0" step="0.01"'), field("dueDay","还款日（每月几日）","number","1",'min="1" max="31" step="1"')]), (form) => { data.liabilities.push({ id:uid("l"), name:form.get("name"), category:form.get("category"), balance:Number(form.get("balance")), rate:Number(form.get("rate")), monthlyPayment:Number(form.get("monthlyPayment")), dueDay:Number(form.get("dueDay")) }); save(); closeModal(); toast("负债已记录"); render(); }); }
function cashflowForm(editId = "") {
  const existing = data.cashflows.find((item) => item.id === editId);
  const categories = data.cashflowCategories || seedData.cashflowCategories;
  openModal(existing ? "修改现金流" : "记录现金流", "工资、支出、礼赠等放在这里；可选择同步到现金资产余额。", `<p class="help">收入填正数，支出填负数，例如工资 15000、房租 -6500。类别可以在现金流页面中自定义。</p>${formFields([field("name","项目名称","text",existing?.name || "","full"), select("type","类别",categories, existing?.type || "生活支出"), field("amount","金额（元）","number",existing?.amount ?? "",'step="0.01"'), field("date","日期","date",existing?.date || today()), cashAssetSelect(existing?.cashAssetId || ""), `<label class="field check-field full"><input type="checkbox" name="recurring" ${existing?.recurring === false ? "" : "checked"} /><span>计入可持续资产现金流（仅资产现金流）</span></label>`])}`, (form) => {
    const type = form.get("type");
    const item = { ...(existing || {}), id: existing?.id || uid("c"), name:form.get("name"), type, amount:Number(form.get("amount")), date:form.get("date"), cashAssetId:form.get("cashAssetId"), sustainable:type === "资产现金流" && form.get("recurring") === "on", recurring:type === "资产现金流" && form.get("recurring") === "on" };
    if (existing) data.cashflows = data.cashflows.map((cash) => cash.id === existing.id ? item : cash);
    else data.cashflows.unshift(item);
    rebuildHoldings(); save(); closeModal(); toast(existing ? "现金流已修改，现金资产已重算" : "现金流已记录，现金资产已重算"); render();
  });
}
function editCashflow(id) {
  const item = data.cashflows.find((cash) => cash.id === id);
  if (!item || item.sourceTransactionId) return;
  if (item.assetId) assetIncomeForm(id);
  else cashflowForm(id);
}
function assetIncomeForm(editId = "") {
  if (!data.assets.length) { toast("请先用新增交易创建第一项资产", true); return; }
  const existing = data.cashflows.find((item) => item.id === editId);
  const assetOptions = data.assets.map((item) => `<option value="${item.id}" ${item.id === existing?.assetId ? "selected" : ""}>${escapeHtml(item.name)}${item.code ? `（${escapeHtml(item.code)}）` : ""}</option>`).join("");
  openModal(existing ? "修改分红/租金" : "记录分红/租金", "记录某项资产真实收到的现金流；也可以同步到银行卡、现金等现金资产。", formFields([`<div class="field"><label for="f-assetId">资产</label><select id="f-assetId" name="assetId">${assetOptions}</select></div>`, select("incomeKind","现金流类型",["分红","派息","租金","利息","版权/经营分成","其他"], existing?.incomeKind || "分红"), field("amount","收到金额（元）","number",existing?.amount ?? "",'min="0" step="0.01"'), field("date","收到日期","date",existing?.date || today()), cashAssetSelect(existing?.cashAssetId || "", "入账现金账户"), `<label class="field check-field full"><input type="checkbox" name="recurring" ${existing?.recurring === false ? "" : "checked"} /><span>纳入最近一年月均现金流计算</span></label>`, textArea("note","备注",existing?.note || "","full")]), (form) => {
    const asset = data.assets.find((item) => item.id === form.get("assetId"));
    if (!asset) { toast("没有找到这项资产", true); return; }
    const amount = num(form.get("amount"));
    if (!amount) { toast("请填写收到金额", true); return; }
    const item = { ...(existing || {}), id: existing?.id || uid("c"), assetId:asset.id, incomeKind:form.get("incomeKind"), name:`${asset.name} ${form.get("incomeKind")}`, type:"资产现金流", amount, date:form.get("date"), cashAssetId:form.get("cashAssetId"), sustainable:form.get("recurring") === "on", recurring:form.get("recurring") === "on", note:form.get("note") };
    if (existing) data.cashflows = data.cashflows.map((cash) => cash.id === existing.id ? item : cash);
    else data.cashflows.unshift(item);
    rebuildHoldings();
    save(); closeModal(); toast(`${asset.name} 的${form.get("incomeKind")}已保存，资产池已重算`); render();
  });
}
function cashCategoryForm() {
  const categories = data.cashflowCategories || [];
  openModal("管理现金流类别", "新增类别会出现在记录现金流和筛选栏中。", `<div class="category-cloud">${categories.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}</div>${formFields([field("category","新增类别","text","","full")])}`, (form) => {
    const category = String(form.get("category") || "").trim();
    if (!category) { toast("请填写类别名称", true); return; }
    if (!data.cashflowCategories) data.cashflowCategories = [];
    if (!data.cashflowCategories.includes(category)) data.cashflowCategories.push(category);
    save(); closeModal(); toast(`${category} 已加入现金流类别`); render();
  });
}
function profileForm() {
  const member = currentMember();
  const members = store.family.members;
  const memberList = `<div class="member-list">${members.map((item) => `<button class="member-option ${item.id === member.id ? "active" : ""}" type="button" data-switch-member="${item.id}"><span>${escapeHtml(item.name.slice(0,1) || "家")}</span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.relation || "成员")}</small></button>`).join("")}</div>`;
  openModal("家庭成员", "每位成员拥有独立的资产、负债、现金流和交易记录。", `${memberList}${formFields([field("name","当前成员名称","text",member.name || "我的","full"), select("relation","关系",["我","父亲","母亲","配偶","子女","家庭共同","其他"], member.relation || "我"), field("newName","新增成员名称","text","","full optional"), select("newRelation","新增成员关系",["父亲","母亲","配偶","子女","家庭共同","其他"])])}`, (form) => {
    member.name = String(form.get("name") || member.name).trim() || member.name;
    member.relation = form.get("relation") || member.relation;
    member.data.profile.name = member.name;
    const newName = String(form.get("newName") || "").trim();
    if (newName) {
      const id = uid("m");
      store.family.members.push({ id, name:newName, relation:form.get("newRelation") || "其他", data:normalizeData({ ...clone(seedData), profile:{ name:newName, baseExpense:0 }, assets:[], liabilities:[], cashflows:[], transactions:[], notes:[], tasks:{} }) });
    }
    save(); closeModal(); updateProfileButton(); toast("家庭成员已更新"); render();
  });
  modalLayer.querySelectorAll("[data-switch-member]").forEach((button) => button.addEventListener("click", () => { closeModal(); switchMember(button.dataset.switchMember); }));
}
function transactionForm(editId = "") {
  const existing = data.transactions.find((item) => item.id === editId);
  const existingAssetOptions = data.assets.map((item) => `<option value="${item.id}" ${item.id === existing?.assetId ? "selected" : ""}>${escapeHtml(item.name)}${item.code ? `（${escapeHtml(item.code)}）` : ""}</option>`);
  const assetOptions = data.assets.length ? [...existingAssetOptions, `<option value="__new__">+ 创建新资产</option>`].join("") : `<option value="__new__">+ 创建新资产</option>`;
  const prefillAsset = data.assets.find((item) => item.id === (existing?.assetId || data.assets[0]?.id));
  const fxDefault = existing?.fxRate || "";
  let existingRmbTotal = "";
  if (existing) {
    const exAsset = data.assets.find((item) => item.id === existing.assetId);
    const exFx = exAsset?.currency === "HKD" ? (num(existing.fxRate) > 0 ? num(existing.fxRate) : 1) : 1;
    const exBase = transactionGrossRmb(existing, exAsset);
    const exFee = num(existing.fee);
    existingRmbTotal = (existing.type === "卖出" ? exBase - exFee - num(existing.dividendTax) : exBase + exFee).toFixed(2);
  }
  openModal(existing ? "修改交易" : "新增交易", "交易是资产持仓的来源；如果标的不存在，可在这笔交易里直接创建资产。", `<p class="help">现金/银行卡余额也属于资产：选择"创建新资产"，交易类型选"期初建档"，新资产类别选"现金及存款"，数量填 0，单价/金额填当前余额。工资、支出、礼赠等不要放在这里，去"记录现金流"并选择入账现金账户。<strong>港股交易建议直接填写"人民币成交总额"</strong>（券商 App 显示的实际扣款金额），系统会据此反推实际结算汇率，比市场中间价更准确。最新估值仍用最新市场汇率计算。</p>${formFields([`<div class="field"><label for="f-assetId">标的</label><select id="f-assetId" name="assetId">${assetOptions}</select></div>`, select("type","交易类型",["买入","卖出","分红/派息","红利税","手续费","期初建档"], existing?.type || "买入"), field("quantity","数量","number",existing?.quantity ?? "0",'min="0" step="0.0001"'), field("price","单价/金额（原币）","number",existing?.price ?? "0",'min="0" step="0.0001"'), field("rmbTotal","人民币成交总额（买入含手续费，卖出扣手续费及红利税）","number",existingRmbTotal,'min="0" step="0.01" optional'), field("fxRate","汇率（填写人民币总额后自动反推，或手动填写）","number",fxDefault,'min="0" step="any" optional'), field("fee","手续费（人民币，元）","number",existing?.fee ?? "0",'min="0" step="0.01"'), field("dividendTax","红利税（卖出补扣或独立扣税，人民币元）","number",existing?.dividendTax ?? "0",'min="0" step="0.01"'), `<p class="help full">红利税单独填写；如原来已计入手续费，请从手续费中减去对应金额，避免重复扣除。</p>`, field("date","交易日期","date",existing?.date || today()), `<label class="field check-field full"><input type="checkbox" name="recurring" ${existing?.recurring === false ? "" : "checked"} /><span>分红/派息计入可持续资产现金流</span></label>`, field("assetName","新资产名称","text","","full optional"), field("assetCode","代码/识别名（可选，港股用 hk00700 格式）","text","","optional"), select("assetCategory","新资产类别",["现金及存款","股票","基金","债券","黄金及贵金属","房产","保险现金价值","经营性资产","其他资产"]), field("assetAccount","所属账户（可选）","text","","optional"), textArea("reason","投资理由或复盘",existing?.reason || "","full")])}`, async (form) => {
    const beforeTransactions = clone(data.transactions);
    const beforeAssets = clone(data.assets);
    let assetId = form.get("assetId");
    if (assetId === "__new__") {
      const asset = createAssetFromTransaction(form);
      if (!asset) return;
      assetId = asset.id;
    }
    const asset = data.assets.find((item) => item.id === assetId);
    const rmbTotal = num(form.get("rmbTotal"));
    const qty = num(form.get("quantity"));
    const price = num(form.get("price"));
    const fee = num(form.get("fee"));
    const txType = form.get("type");
    const dividendTax = ["卖出", "红利税"].includes(txType) ? num(form.get("dividendTax")) : 0;
    // 优先用人民币成交总额反推实际结算汇率（最准确，与券商扣款一致）
    let fxRate = 0;
    if (asset?.currency === "HKD" && rmbTotal > 0 && qty > 0 && price > 0) {
      const net = txType === "卖出" ? rmbTotal + fee + dividendTax : rmbTotal - fee;
      fxRate = Math.round(net / (qty * price) * 100000000) / 100000000;
    }
    // 其次用手工填写的汇率
    if (!(fxRate > 0)) fxRate = num(form.get("fxRate"));
    // 最后按成交日自动获取
    if (asset?.currency === "HKD" && !(fxRate > 0) && window.MarketSync?.fxRateOn) {
      try {
        const rate = await MarketSync.fxRateOn(form.get("date"));
        if (rate) fxRate = Math.round(rate * 10000) / 10000;
      } catch (e) {}
    }
    if (asset?.currency === "HKD" && !(fxRate > 0)) {
      toast("港币交易需要汇率：请填写人民币成交总额或汇率，或点击同步行情获取", true);
      return;
    }
    const tx = normalizeTransaction({ ...existing, id: existing?.id || uid("t"), assetId, type:txType, quantity:qty, price, fee, dividendTax, fxRate, grossAmountRmb: ["买入", "卖出"].includes(txType) && rmbTotal > 0 ? Math.round((txType === "卖出" ? rmbTotal + fee + dividendTax : rmbTotal - fee) * 100) / 100 : undefined, date:form.get("date"), reason:form.get("reason"), recurring:form.get("recurring") === "on" });
    if (existing) data.transactions = data.transactions.map((item) => item.id === existing.id ? tx : item);
    else data.transactions.unshift(tx);
    const errors = rebuildHoldings();
    if (errors.length) {
      data.transactions = beforeTransactions;
      data.assets = beforeAssets;
      rebuildHoldings();
      toast(errors[0], true);
      return;
    }
    save(); closeModal(); toast(existing ? "交易已修改，资产已重新计算" : "交易已记录，资产已重新计算"); render();
  });
  bindFxRateAutofill(!!num(existing?.fxRate));
  bindRmbTotalSync();
}

// 人民币成交总额双向同步：
// 用户填人民币总额 → 反算汇率（优先）或单价；改单价/数量/汇率/手续费 → 更新总额
function bindRmbTotalSync() {
  const modal = document.querySelector("#modalLayer");
  if (!modal) return;
  const form = modal.querySelector("form");
  if (!form) return;
  const rmbField = form.querySelector('[name="rmbTotal"]');
  if (!rmbField) return;
  const priceField = form.querySelector('[name="price"]');
  const qtyField = form.querySelector('[name="quantity"]');
  const fxFld = form.querySelector('[name="fxRate"]');
  const feeField = form.querySelector('[name="fee"]');
  const taxField = form.querySelector('[name="dividendTax"]');
  const typeField = form.querySelector('[name="type"]');
  let rmbLocked = false;
  const getFx = () => { const v = num(fxFld?.value || 0); return v > 0 ? v : 1; };
  const isHkAsset = () => {
    const assetId = form.querySelector('[name="assetId"]')?.value || "";
    const asset = data.assets.find((item) => item.id === assetId);
    const newCode = String(form.querySelector('[name="assetCode"]')?.value || "").trim();
    return asset?.currency === "HKD" || /^hk\d{1,5}$/i.test(newCode);
  };
  // 港币资产：有人民币总额时反推汇率；人民币资产：不需要汇率
  const updateFx = () => {
    if (!isHkAsset()) { fxFld.value = ""; fxFld.placeholder = ""; return; }
    const rmb = num(rmbField?.value || 0);
    const qty = num(qtyField?.value || 0);
    const price = num(priceField?.value || 0);
    const fee = num(feeField?.value || 0);
    const type = typeField?.value || "买入";
    if (rmb > 0 && qty > 0 && price > 0) {
      const net = type === "卖出" ? rmb + fee + num(taxField?.value) : rmb - fee;
      const fx = net / (qty * price);
      if (fx > 0) { fxFld.value = fx.toFixed(8); fxFld.placeholder = "由人民币总额反推"; return; }
    }
    fxFld.placeholder = "填写人民币总额后自动计算";
  };
  const updateRmb = () => {
    if (rmbLocked) return;
    const qty = num(qtyField?.value || 0);
    const price = num(priceField?.value || 0);
    const fx = getFx();
    const fee = num(feeField?.value || 0);
    const type = typeField?.value || "买入";
    const base = qty * price * fx;
    const total = type === "卖出" ? base - fee - num(taxField?.value) : base + fee;
    rmbField.value = total > 0 ? total.toFixed(2) : "";
  };
  const updatePrice = () => {
    if (!rmbLocked) return;
    const rmb = num(rmbField?.value || 0);
    const qty = num(qtyField?.value || 0);
    const fx = getFx();
    const fee = num(feeField?.value || 0);
    const type = typeField?.value || "买入";
    const net = type === "卖出" ? rmb + fee + num(taxField?.value) : rmb - fee;
    if (qty > 0 && fx > 0) {
      const price = net / (qty * fx);
      if (price > 0) priceField.value = price.toFixed(4);
    }
  };
  rmbField.addEventListener("input", () => { rmbLocked = true; updateFx(); });
  [priceField, qtyField, feeField, taxField].forEach((f) => f?.addEventListener("input", () => { rmbLocked = false; updateRmb(); }));
  const onFxChange = () => { if (rmbLocked) updatePrice(); else updateRmb(); };
  fxFld?.addEventListener("input", onFxChange);
  fxFld?.addEventListener("change", onFxChange);
  const updateTaxField = () => { if (taxField) taxField.disabled = !["卖出", "红利税"].includes(typeField?.value); };
  typeField?.addEventListener("change", () => { updateTaxField(); if (rmbLocked) updateFx(); else updateRmb(); });
  updateTaxField();
  if (!num(rmbField.value)) updateRmb();
}
// 外币资产（港币）：按交易日期自动获取成交日汇率。manualLocked=true（已有手工汇率）时不覆盖，
// 用户手动输入后即锁定，改日期/换标的会重新自动获取。
function bindFxRateAutofill(manualLocked = false) {
  const modal = document.querySelector("#modalLayer");
  const fxField = modal?.querySelector('[name="fxRate"]');
  if (!modal || !fxField) return;
  let auto = !manualLocked;
  let seq = 0;
  const autofill = async () => {
    const form = modal.querySelector("form");
    if (!form || !window.MarketSync?.fxRateOn) return;
    const assetId = form.querySelector('[name="assetId"]')?.value || "";
    const asset = data.assets.find((item) => item.id === assetId);
    const newCode = String(form.querySelector('[name="assetCode"]')?.value || "").trim();
    const isHk = asset?.currency === "HKD" || /^hk\d{1,5}$/i.test(newCode);
    if (!isHk) { if (auto) { fxField.value = ""; fxField.dispatchEvent(new Event("input", { bubbles: true })); } fxField.placeholder = ""; return; }
    // 用户已填人民币总额时，汇率由总额反推，不再自动获取
    const rmbTotal = form.querySelector('[name="rmbTotal"]')?.value;
    if (num(rmbTotal) > 0) { fxField.placeholder = "由人民币总额反推"; return; }
    if (!auto) return;
    const date = form.querySelector('[name="date"]')?.value || today();
    const mySeq = ++seq;
    fxField.value = "";
    fxField.dispatchEvent(new Event("input", { bubbles: true }));
    fxField.placeholder = "正在按成交日获取汇率…";
    try {
      const rate = await MarketSync.fxRateOn(date);
      if (mySeq !== seq || !auto) return;
      if (rate) { fxField.value = Math.round(rate * 10000) / 10000; fxField.dispatchEvent(new Event("input", { bubbles: true })); fxField.placeholder = "自动：成交日汇率，可修改"; }
      else fxField.placeholder = "查不到该日汇率，请手动填写";
    } catch (e) {
      if (mySeq === seq && auto) fxField.placeholder = "汇率获取失败，请手动填写";
    }
  };
  fxField.addEventListener("input", () => { if (fxField.value.trim() !== "") { auto = false; fxField.placeholder = ""; } });
  modal.querySelector('[name="date"]')?.addEventListener("change", () => { auto = auto || !fxField.value.trim(); autofill(); });
  modal.querySelector('[name="assetId"]')?.addEventListener("change", autofill);
  modal.querySelector('[name="assetCode"]')?.addEventListener("input", autofill);
  autofill();
}
function createAssetFromTransaction(form) {
  const name = String(form.get("assetName") || "").trim();
  if (!name) { toast("创建新资产需要填写资产名称", true); return null; }
  const code = String(form.get("assetCode") || "").trim();
  const isHk = /^hk\d{1,5}$/i.test(code);
  const draft = { id:uid("a"), name, code, currency:isHk ? "HKD" : "CNY", fxRate:isHk ? num(form.get("fxRate")) : 0, category:form.get("assetCategory"), account:form.get("assetAccount"), quantity:0, cost:0, value:0, openingQuantity:0, openingCost:0, openingValue:0, latestPrice:num(form.get("price")), manualMonthlyCashflow:0, monthlyCashflow:0, date:form.get("date"), priceSource:"交易价" };
  const existing = data.assets.find((item) => assetKey(item) === assetKey(draft));
  if (existing) return existing;
  const asset = normalizeAsset(draft);
  data.assets.push(asset);
  return asset;
}
function applyTransaction(tx, options = {}) {
  const state = options.state || data;
  const asset = state.assets.find((item) => item.id === tx.assetId);
  if (!asset) return { ok:false, message:"没有找到这项资产" };
  if (tx.type === "买入") {
    if (!tx.quantity || !tx.price) return { ok:false, message:"买入需要填写数量和单价" };
    const fx = txFxRate(tx, asset);
    asset.quantity = num(asset.quantity) + tx.quantity;
    asset.cost = num(asset.cost) + transactionGrossRmb(tx, asset) + tx.fee;
    if (!num(asset.latestPrice)) asset.latestPrice = tx.price;
    asset.date = tx.date;
    if (!asset.priceSource || asset.priceSource === "交易价") asset.priceSource = "交易价";
    recalcAsset(asset);
    return { ok:true, message:`买入已入账，${asset.name} 持仓已更新` };
  }
  if (tx.type === "期初建档") {
    if (!tx.price) return { ok:false, message:"期初建档需要填写金额或单价" };
    const fx = txFxRate(tx, asset);
    if (tx.quantity) {
      asset.quantity = num(asset.quantity) + tx.quantity;
      asset.cost = num(asset.cost) + transactionGrossRmb(tx, asset) + tx.fee;
      if (!num(asset.latestPrice)) asset.latestPrice = tx.price;
    } else {
      asset.value = num(asset.value) + tx.price * fx;
      asset.cost = num(asset.cost) + tx.price * fx + tx.fee;
    }
    asset.date = tx.date;
    recalcAsset(asset);
    return { ok:true, message:`${asset.name} 已完成期初建档` };
  }
  if (tx.type === "卖出") {
    if (!tx.quantity || !tx.price) return { ok:false, message:"卖出需要填写数量和单价" };
    if (tx.quantity > num(asset.quantity)) return { ok:false, message:"卖出数量不能超过当前持仓" };
    const fx = txFxRate(tx, asset);
    const avgCost = num(asset.avgCost) || (num(asset.quantity) ? num(asset.cost) / num(asset.quantity) : 0);
    const costOut = avgCost * tx.quantity;
    const dividendTax = num(tx.dividendTax);
    if (!Number.isFinite(dividendTax) || dividendTax < 0) return { ok:false, message:"红利税必须是大于或等于 0 的金额" };
    const proceeds = transactionGrossRmb(tx, asset) - tx.fee - dividendTax;
    asset.quantity = num(asset.quantity) - tx.quantity;
    asset.cost = Math.max(0, num(asset.cost) - costOut);
    if (!asset.quantity) asset.value = 0;
    asset.soldQuantity = num(asset.soldQuantity) + tx.quantity;
    asset.realizedPriceGain = num(asset.realizedPriceGain) + proceeds - costOut;
    asset.realizedProfit = num(asset.realizedProfit) + proceeds - costOut;
    if (!num(asset.latestPrice)) asset.latestPrice = tx.price;
    asset.date = tx.date;
    if (!asset.priceSource || asset.priceSource === "交易价") asset.priceSource = "交易价";
    recalcAsset(asset);
    return { ok:true, message:`卖出已入账，已实现收益 ${fmt(proceeds - costOut)}` };
  }
  if (tx.type === "红利税") {
    const amount = num(tx.dividendTax);
    if (!(amount > 0) || !Number.isFinite(amount)) return { ok:false, message:"请填写大于 0 的红利税金额" };
    asset.realizedPriceGain = num(asset.realizedPriceGain) - amount;
    asset.realizedProfit = num(asset.realizedProfit) - amount;
    return { ok:true, message:`红利税已扣除 ${fmt(amount)}` };
  }
  if (tx.type === "分红/派息") {
    const amount = tx.price - tx.fee;
    if (!amount) return { ok:false, message:"分红/派息需要填写收到的金额" };
    asset.realizedProfit = num(asset.realizedProfit) + amount;
    if (options.syncCashflow) state.cashflows.unshift({ id:uid("c"), sourceTransactionId: tx.id, assetId:asset.id, incomeKind:"分红/派息", name:`${asset.name} 分红/派息`, type:"资产现金流", amount, date:tx.date, sustainable:tx.recurring, recurring:tx.recurring });
    return { ok:true, message:`分红已记录，并同步到现金流 ${fmt(amount)}` };
  }
  if (tx.type === "手续费") {
    if (!tx.fee && !tx.price) return { ok:false, message:"手续费需要填写金额" };
    const amount = tx.fee || tx.price;
    asset.cost = num(asset.cost) + amount;
    asset.realizedProfit = num(asset.realizedProfit) - amount;
    recalcAsset(asset);
    return { ok:true, message:`手续费已计入 ${asset.name} 成本` };
  }
  return { ok:false, message:"暂不支持这类交易" };
}
function deleteTransaction(id) {
  const tx = data.transactions.find((item) => item.id === id);
  if (!tx) return;
  if (!confirm("确定删除这笔交易吗？删除后资产持仓、成本和现金流会重新计算。")) return;
  data.transactions = data.transactions.filter((item) => item.id !== id);
  const errors = rebuildHoldings();
  if (errors.length) toast(errors[0], true);
  save(); toast("交易已删除，资产已重新计算"); render();
}
function assetEditForm(assetId) {
  const asset = data.assets.find((item) => item.id === assetId);
  if (!asset) { toast("资产不存在", true); return; }
  openModal(`编辑资产：${asset.name}`, "修改代码后建议立即同步行情。A股填 6 位代码（如 600519），港股填 hk + 5 位代码（如 hk00700）；黄金、现金等无代码资产留空并用手动改价。", formFields([
    field("name", "资产名称", "text", asset.name),
    field("code", "证券代码（可选）", "text", asset.code || "", "optional"),
    select("category", "类别", ["现金及存款", "股票", "基金", "债券", "黄金及贵金属", "房产", "保险现金价值", "经营性资产", "其他资产"], asset.category),
    field("account", "所属账户（可选）", "text", asset.account || "", "optional"),
  ]), (form) => {
    const name = String(form.get("name") || "").trim();
    if (!name) { toast("资产名称不能为空", true); return; }
    const code = String(form.get("code") || "").trim();
    const wasHk = asset.currency === "HKD";
    const isHk = /^hk\d+$/i.test(code);
    asset.name = name;
    asset.code = code;
    asset.category = form.get("category");
    asset.account = String(form.get("account") || "").trim();
    if (isHk) { asset.currency = "HKD"; } else { asset.currency = "CNY"; asset.fxRate = 0; }
    recalcAsset(asset);
    save();
    closeModal();
    toast(`${asset.name} 已更新${wasHk !== isHk ? `，货币已切换为 ${isHk ? "港币" : "人民币"}` : ""}`);
    render();
    if (code && (isHk || /^\d{6}$/.test(code))) syncMarketData(true);
  });
}
function priceForm() { if (!data.assets.length) { toast("请先新增一项资产", true); return; } const assetOptions = data.assets.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}${item.code ? `（${escapeHtml(item.code)}）` : ""}</option>`).join(""); openModal("更新最新价", "手动更新最新价格，适合黄金、现金等没有证券代码的资产；股票和基金可用“同步行情”自动获取。港币资产请填港币原币价，汇率由“同步行情”自动更新。", formFields([`<div class="field"><label for="f-assetId">标的</label><select id="f-assetId" name="assetId">${assetOptions}</select></div>`, field("latestPrice","最新价（原币）","number","",'min="0" step="0.0001"'), field("date","价格日期","date",today())]), (form) => { const asset = data.assets.find((item) => item.id === form.get("assetId")); if (!asset) return; asset.latestPrice = num(form.get("latestPrice")); asset.date = form.get("date"); asset.priceSource = "手动"; recalcAsset(asset); save(); closeModal(); toast(`${asset.name} 最新价已更新`); render(); }); }
function noteForm() { openModal("新建内容", "保存自己的原则、复盘或外部视频链接。", formFields([field("title","标题","text","","full"), select("type","内容类型",["投资原则","交易复盘","读书笔记","案例","视频卡片"]), select("visibility","可见性",["私密","可公开"]), field("url","外部链接（可选）","url","","full optional"), textArea("body","内容","","full")]), (form) => { data.notes.unshift({ id:uid("n"), title:form.get("title"), type:form.get("type"), visibility:form.get("visibility"), url:form.get("url"), body:form.get("body") }); save(); closeModal(); toast("内容已保存到思想库"); render(); }); }
function expenseForm() { openModal("设置基础生活支出", "这是资产现金流覆盖率的分母，可以随生活阶段更新。", formFields([field("baseExpense","每月基础生活支出（元）","number",data.profile.baseExpense,'min="0" step="1" full')]), (form) => { data.profile.baseExpense = Number(form.get("baseExpense")); save(); closeModal(); toast("基础生活支出已更新"); render(); }); }
function deleteItem(type, id) {
  const labels = { asset:"资产", liability:"负债", cashflow:"现金流", note:"内容" };
  if (!confirm(`确定删除这条${labels[type]}记录吗？此操作无法撤销。`)) return;
  if (type === "asset") {
    const relatedIds = data.transactions.filter((tx) => tx.assetId === id).map((tx) => tx.id);
    data.assets = data.assets.filter((item) => item.id !== id);
    data.transactions = data.transactions.filter((tx) => tx.assetId !== id);
    data.cashflows = data.cashflows.filter((item) => item.assetId !== id && item.cashAssetId !== id && !relatedIds.includes(item.sourceTransactionId));
    rebuildHoldings();
  } else {
    const key = type === "liability" ? "liabilities" : type === "cashflow" ? "cashflows" : `${type}s`;
    data[key] = data[key].filter((item) => item.id !== id);
    if (type === "cashflow") rebuildHoldings();
  }
  save(); toast("记录已删除"); render();
}
function clearData() { if (!confirm(`确定清空 ${currentMember().name} 的资产池数据吗？建议先导出备份。`)) return; data = normalizeData({ profile:{name:currentMember().name,baseExpense:0}, assets:[], liabilities:[], cashflows:[], cashflowCategories:clone(seedData.cashflowCategories), transactions:[], notes:[], tasks:{} }); save(); toast("当前成员资料库已清空"); render(); }
function exportData() { save(); const blob = new Blob([JSON.stringify({ version:2, exportedAt:new Date().toISOString(), store }, null, 2)], { type:"application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `家庭资产池备份-${today()}.json`; link.click(); URL.revokeObjectURL(url); toast("家庭备份文件已下载"); }
function importData(event) { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const parsed = JSON.parse(reader.result); const incoming = parsed.store || parsed.data || parsed; if (!confirm("导入会覆盖当前家庭资料库，确定继续吗？")) return; store = normalizeStore(incoming); data = currentMemberData(); save(); toast("家庭备份已恢复"); render(); } catch { toast("无法识别这个备份文件", true); } }; reader.readAsText(file); }
function toast(message, error = false) { const item = document.createElement("div"); item.className = `toast${error ? " error" : ""}`; item.textContent = message; document.querySelector("#toastRegion").append(item); setTimeout(() => item.remove(), 2800); }
function updateProfileButton() {
  const button = document.querySelector("#profileButton");
  const label = String(currentMember().name || data.profile.name || "我的").trim();
  if (!button) return;
  button.querySelector("span").textContent = label.slice(0, 1) || "我";
  button.title = `当前成员：${label}`;
}

document.querySelectorAll(".nav-item, .settings-link").forEach((button) => button.addEventListener("click", () => { view = button.dataset.view; render(); }));
document.querySelector("#quickSearch").addEventListener("click", () => { view = "assets"; render(); setTimeout(() => document.querySelector("#assetSearch")?.focus(), 0); });
document.querySelector("#profileButton").addEventListener("click", profileForm);
document.querySelector("#todayLabel").textContent = new Intl.DateTimeFormat("zh-CN", { year:"numeric", month:"long", day:"numeric", weekday:"short" }).format(new Date());
modalLayer.addEventListener("click", (event) => { if (event.target === modalLayer) closeModal(); });
app.addEventListener("click", handleAppClick);

// ===== 饼图悬停交互：浮动提示框 + 扇区/图例双向联动高亮 =====
function initPieTooltip() {
  const tooltip = document.createElement("div");
  tooltip.className = "pie-tooltip";
  document.body.appendChild(tooltip);
  const target = (event) => event.target.closest("[data-pie-idx]");
  const show = (node) => {
    const wrap = node.closest(".pie-chart");
    if (!wrap) return;
    wrap.classList.add("hovering");
    const idx = node.dataset.pieIdx;
    wrap.querySelectorAll(`[data-pie-idx="${idx}"]`).forEach((el) => el.classList.add("hover"));
    tooltip.innerHTML = `<strong>${node.dataset.label}</strong><span>金额 ${node.dataset.value}</span><span>占比 ${node.dataset.share}</span><em>${wrap.dataset.centerLabel || "总市值"} ${wrap.dataset.total}</em>`;
    tooltip.classList.add("show");
  };
  const hide = (node) => {
    const wrap = node.closest(".pie-chart");
    wrap?.classList.remove("hovering");
    document.querySelectorAll(".pie-slice.hover, .pie-legend li.hover").forEach((el) => el.classList.remove("hover"));
    tooltip.classList.remove("show");
  };
  const move = (event) => {
    if (!tooltip.classList.contains("show")) return;
    const w = tooltip.offsetWidth, h = tooltip.offsetHeight;
    let x = event.clientX + 14, y = event.clientY + 14;
    if (x + w > window.innerWidth - 8) x = event.clientX - w - 14;
    if (y + h > window.innerHeight - 8) y = event.clientY - h - 14;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
  };
  document.addEventListener("mouseover", (event) => { const node = target(event); if (node) show(node); });
  document.addEventListener("mouseout", (event) => { const node = target(event); if (node) hide(node); });
  document.addEventListener("mousemove", move, { passive: true });
  // 可点击饼图：点击扇区/图例跳转到对应视图（如总览资产配置 → 资产页并按类别筛选）
  document.addEventListener("click", (event) => {
    const node = event.target.closest("[data-pie-idx]");
    const wrap = node?.closest(".pie-chart[data-nav]");
    if (!wrap || !node.dataset.label) return;
    if (wrap.dataset.nav === "assets") {
      const label = node.dataset.label;
      if (label && label !== "其他" && label !== "全部") pendingAssetFilter = label;
      view = "assets"; render();
    }
  });
}
initPieTooltip();
render();
if (globalThis.statementReconciliationNotice) toast(globalThis.statementReconciliationNotice);
syncMarketData();
