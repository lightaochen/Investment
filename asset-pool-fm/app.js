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

let data = normalizeData(load());
let view = "dashboard";
save();

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || clone(seedData); } catch { return clone(seedData); } }
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
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
  return { code: "", quantity, avgCost, latestPrice, soldQuantity: 0, realizedProfit: 0, realizedPriceGain: 0, manualMonthlyCashflow: undefined, cashflowSource: "手动", openingQuantity: undefined, openingCost: undefined, openingValue: undefined, priceSource: "手动", ...asset, quantity, avgCost, latestPrice };
}
function normalizeTransaction(tx) {
  return { id: uid("t"), assetId: "", type: "买入", quantity: 0, price: 0, fee: 0, date: today(), reason: "", recurring: true, ...tx, quantity: num(tx.quantity), price: num(tx.price), fee: num(tx.fee) };
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
    asset.openingValue = asset.openingQuantity ? asset.openingQuantity * num(asset.latestPrice) : (related.length ? 0 : num(asset.value));
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
  asset.value = asset.quantity ? asset.quantity * asset.latestPrice : num(asset.value);
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
  [...state.transactions].sort((a, b) => String(a.date).localeCompare(String(b.date))).forEach((tx) => {
    const result = applyTransaction(tx, { state, syncCashflow: true });
    if (!result.ok) errors.push(result.message);
  });
  updateAssetMonthlyCashflows(state);
  return errors;
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
function totals() {
  const assetValue = data.assets.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const liabilityValue = data.liabilities.reduce((sum, item) => sum + Number(item.balance || 0), 0);
  const passive = data.assets.reduce((sum, item) => sum + Number(item.monthlyCashflow || 0), 0);
  const extraCashflow = data.cashflows.filter((item) => item.type === "资产现金流" && item.recurring && !item.assetId).reduce((sum, item) => sum + Math.max(0, Number(item.amount || 0)), 0) / 12;
  const coverageIncome = passive + extraCashflow;
  const expense = Number(data.profile.baseExpense || 0);
  return { assetValue, liabilityValue, netWorth: assetValue - liabilityValue, passive: coverageIncome, expense, coverage: expense ? coverageIncome / expense * 100 : 0 };
}

function render() {
  const titles = { dashboard: "你的资产池", assets: "资产", liabilities: "负债池", cashflow: "现金流", journey: "成长地图", notes: "复盘与思想", settings: "数据与设置" };
  document.querySelector("#pageTitle").textContent = titles[view];
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  const screens = { dashboard: dashboardView, assets: assetsView, liabilities: liabilitiesView, cashflow: cashflowView, journey: journeyView, notes: notesView, settings: settingsView };
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
      <article class="panel"><div class="panel-heading"><div><h3>资产配置</h3><p>按当前估值统计</p></div><button class="button subtle" data-view="assets">管理资产</button></div>${allocationPanel(allocation, t.assetValue)}</article>
      <article class="panel journey-panel"><div class="panel-heading"><div><h3>成长路径</h3><p>目标是自由选择，不是盲目追逐数字。</p></div><button class="button subtle" data-view="journey">查看地图</button></div>${journeyPath(t.coverage)}</article>
    </div>
    <article class="callout"><span>✦</span><div><strong>今天的一个小行动</strong><p>${nextTaskText()} </p></div></article>
  </section>`;
}

function metric(label, value, hint, tone = "") { return `<article class="metric-card"><p class="label">${label}</p><p class="value ${tone}">${value}</p><p class="hint">${hint}</p></article>`; }
function empty(title, body) { return `<div class="empty"><strong>${title}</strong><span>${body}</span></div>`; }

function assetsView() {
  const categories = ["全部", ...new Set(data.assets.map((item) => item.category))];
  const totalPriceGain = data.assets.reduce((sum, item) => sum + assetPriceGain(item), 0);
  const totalGain = data.assets.reduce((sum, item) => sum + assetTotalGain(item), 0);
  const totalIncome = data.assets.reduce((sum, item) => sum + assetIncomeTotal(item.id), 0);
  const trailingIncome = data.assets.reduce((sum, item) => sum + assetTrailingIncomeTotal(item.id), 0);
  return `<section class="view"><div class="section-title"><div><h2>资产</h2><p>资产由交易、期初建档和现金流记录自动汇总。</p></div><div class="actions"><button class="button secondary" data-action="add-asset-income">记录分红/租金</button><button class="button secondary" data-action="update-price">更新价格</button><button class="button primary" data-action="add-transaction">新增交易</button></div></div>
  <div class="metric-grid">${metric("资产总额", fmt(totals().assetValue), `${data.assets.length} 项资产`)}${metric("总收益", fmt(totalGain), `价差 ${fmt(totalPriceGain)} + 分红/租金 ${fmt(totalIncome)}`, totalGain >= 0 ? "positive" : "negative")}${metric("历史总分红", fmt(totalIncome), "资产累计现金回报", "positive")}${metric("近一年现金流", fmt(trailingIncome), `折算月均 ${fmt(trailingIncome / 12)}`, "positive")}</div>
  <div class="filter-bar"><div class="filter-group">${categories.map((category, index) => `<button class="filter-chip ${index === 0 ? "active" : ""}" data-filter-asset="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join("")}</div><input class="search-input" id="assetSearch" placeholder="搜索资产名称" /></div>
  <article class="panel table-panel asset-table"><div class="table-header"><span>资产</span><span>持仓</span><span>最新价</span><span>当前估值</span><span>成本</span><span>收益</span><span>历史总分红</span><span>近一年现金流</span><span>月现金流</span><span></span></div><div id="assetRows">${assetRows(data.assets)}</div></article>
  <article class="panel history-panel"><div class="panel-heading"><div><h3>交易历史</h3><p id="transactionCount">${data.transactions.length} 笔交易</p></div></div>${transactionFilters()}<div class="table-panel transaction-table"><div class="table-header"><span>交易</span><span>类型</span><span>数量</span><span>价格/金额</span><span>日期</span><span></span></div><div id="transactionRows">${transactionRows(data.transactions)}</div></div></article></section>`;
}
function assetRows(items) { return items.length ? items.map((item) => {
  const totalIncome = assetIncomeTotal(item.id);
  const gain = assetTotalGain(item);
  const priceGain = assetPriceGain(item);
  const gainTone = gain >= 0 ? "positive" : "negative";
  const holding = num(item.quantity) ? `${decimal.format(item.quantity)} 份` : "整体估值";
  const latestPrice = num(item.latestPrice) ? fmt(item.latestPrice) : "手动估值";
  const trailingIncome = assetTrailingIncomeTotal(item.id);
  return `<div class="data-row"><div class="asset-name"><span class="asset-icon">${assetGlyph(item.category)}</span><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.code || item.category)} · ${escapeHtml(item.account || "未指定账户")} · 更新于 ${item.date || "未记录"}</small></div></div><span>${holding}<small class="muted">均价 ${num(item.avgCost) ? fmt(item.avgCost) : "-"}</small></span><span>${latestPrice}<small class="muted">${escapeHtml(item.priceSource || "手动")}</small></span><strong>${fmt(item.value)}</strong><span>${fmt(item.cost)}</span><strong class="${gainTone}">${fmt(gain)}<small class="muted">价差 ${fmt(priceGain)}</small></strong><span class="positive">${fmt(totalIncome)}</span><span class="positive">${fmt(trailingIncome)}</span><span class="positive">${fmt(item.monthlyCashflow || 0)}<small class="muted">${escapeHtml(item.cashflowSource || "手动预估")}</small></span><button class="row-menu" title="删除" data-delete="asset" data-id="${item.id}">×</button></div>`;
}).join("") : empty("还没有资产", "从现金、基金、股票或房产开始盘点。"); }
function assetGlyph(category) { return ({ "股票": "股", "基金": "基", "现金及存款": "现", "债券": "债", "黄金及贵金属": "金", "房产": "房", "经营性资产": "营" })[category] || "资"; }
function transactionFilters() {
  const assetOptions = data.assets.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}${item.code ? `（${escapeHtml(item.code)}）` : ""}</option>`).join("");
  return `<div class="history-filters"><select id="txAssetFilter"><option value="全部">全部标的</option>${assetOptions}</select><select id="txTypeFilter"><option value="全部">全部类型</option>${["买入","卖出","分红/派息","手续费","期初建档"].map((type) => `<option>${type}</option>`).join("")}</select><input id="txStartDate" type="date" aria-label="开始日期" /><input id="txEndDate" type="date" aria-label="结束日期" /><input id="txSearch" type="search" placeholder="搜索理由/标的" /></div>`;
}
function transactionRows(list = data.transactions) {
  const items = [...list].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return items.length ? items.map((tx) => {
    const asset = data.assets.find((item) => item.id === tx.assetId);
    return `<div class="data-row"><div><strong>${escapeHtml(asset?.name || "已删除资产")}</strong><small>${escapeHtml(tx.reason || "未填写复盘")}</small></div><span class="tag">${escapeHtml(tx.type)}</span><span>${num(tx.quantity) ? decimal.format(tx.quantity) : "-"}</span><strong>${fmt(tx.price)}</strong><span class="muted">${tx.date}</span><span class="row-actions"><button class="row-menu" title="修改" aria-label="修改交易" data-edit-transaction="${tx.id}">✎</button><button class="row-menu danger-icon" title="删除" aria-label="删除交易" data-delete-transaction="${tx.id}">×</button></span></div>`;
  }).join("") : empty("还没有交易", "买入、卖出、分红都会出现在这里。");
}

function liabilitiesView() { const total = data.liabilities.reduce((s, x) => s + Number(x.balance || 0), 0); const payment = data.liabilities.reduce((s, x) => s + Number(x.monthlyPayment || 0), 0); return `<section class="view"><div class="section-title"><div><h2>负债池</h2><p>看清每一笔将钱拿出口袋的承诺。</p></div><div class="actions"><button class="button primary" data-action="add-liability">新增负债</button></div></div><div class="metric-grid">${metric("负债余额", fmt(total), `${data.liabilities.length} 笔负债`, "negative")}${metric("本月还款", fmt(payment), "本金与利息的计划支出", "negative")}${metric("最高年利率", `${decimal.format(Math.max(0, ...data.liabilities.map((x) => Number(x.rate || 0))))}%`, "高利率负债值得优先关注", "negative")}${metric("净资产影响", fmt(-total), "资产减去未偿余额", "negative")}</div><article class="callout"><span>!</span><div><strong>关注高成本负债</strong><p>信用卡、消费贷等高利率负债会持续侵蚀现金流。这里提供提醒和数据，不提供投资或还款建议。</p></div></article><article class="panel table-panel liability-table"><div class="table-header"><span>负债</span><span>剩余余额</span><span>年利率</span><span>月供</span><span>还款日</span><span></span></div>${liabilityRows()}</article></section>`; }
function liabilityRows() { return data.liabilities.length ? data.liabilities.map((item) => `<div class="data-row"><div class="asset-name"><span class="asset-icon" style="background:var(--red-pale);color:var(--red)">负</span><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.category)}</small></div></div><strong class="negative">${fmt(item.balance)}</strong><span class="${Number(item.rate) >= 10 ? "negative" : "muted"}">${decimal.format(item.rate)}%</span><span>${fmt(item.monthlyPayment)}</span><span class="muted">每月 ${item.dueDay} 日</span><button class="row-menu" title="删除" data-delete="liability" data-id="${item.id}">×</button></div>`).join("") : empty("还没有负债", "保持良好，或录入房贷、车贷等长期负债。"); }

function cashflowView() { const items = [...data.cashflows].sort((a, b) => b.date.localeCompare(a.date)); const income = items.filter((x) => Number(x.amount) > 0).reduce((s,x)=>s+Number(x.amount),0); const spending = items.filter((x) => Number(x.amount) < 0).reduce((s,x)=>s+Number(x.amount),0); const categories = ["全部", ...new Set([...(data.cashflowCategories || []), ...items.map((item) => item.type)])]; return `<section class="view"><div class="section-title"><div><h2>现金流</h2><p>分清收入、资产现金流、基础支出和非必需消费。</p></div><div class="actions"><button class="button secondary" data-action="manage-cash-categories">管理类别</button><button class="button primary" data-action="add-cashflow">记录现金流</button></div></div><div class="metric-grid">${metric("本期流入", fmt(income), "全部正向现金流", "positive")}${metric("本期流出", fmt(Math.abs(spending)), "全部支出记录", "negative")}${metric("净现金流", fmt(income + spending), "流入减去流出", income + spending >= 0 ? "positive" : "negative")}${metric("资产现金流", fmt(totals().passive), "用于计算覆盖率", "positive")}</div><div class="filter-bar"><div class="filter-group">${categories.map((category, index) => `<button class="filter-chip ${index === 0 ? "active" : ""}" data-filter-cash="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join("")}</div></div><article class="panel table-panel cash-table"><div class="table-header"><span>项目</span><span>类型</span><span>日期</span><span>金额</span><span></span></div><div id="cashRows">${cashRows(items)}</div></article></section>`; }
function cashflowMeta(item) {
  const asset = item.assetId ? data.assets.find((asset) => asset.id === item.assetId) : null;
  const parts = [item.type, item.incomeKind, asset?.name, item.date].filter(Boolean);
  return parts.join(" · ");
}
function cashflowRow(item) { const plus = Number(item.amount) >= 0; return `<div class="cashflow-item"><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(cashflowMeta(item))}</small></div><b class="${plus ? "positive" : "negative"}">${plus ? "+" : ""}${fmt(item.amount)}</b></div>`; }
function cashRows(items) { return items.length ? items.map((item) => { const plus = Number(item.amount) >= 0; const action = item.sourceTransactionId ? `<span class="muted">交易生成</span>` : `<span class="row-actions"><button class="row-menu" title="修改" aria-label="修改现金流" data-edit-cashflow="${item.id}">✎</button><button class="row-menu danger-icon" title="删除" aria-label="删除现金流" data-delete="cashflow" data-id="${item.id}">×</button></span>`; return `<div class="data-row"><div><strong>${escapeHtml(item.name)}</strong>${item.sustainable ? `<small>${item.assetId ? "计入该资产近一年月均现金流" : "计入可持续资产现金流"}</small>` : ""}</div><span class="tag">${escapeHtml(item.incomeKind || item.type)}</span><span class="muted">${item.date}</span><strong class="${plus ? "positive" : "negative"}">${plus ? "+" : ""}${fmt(item.amount)}</strong>${action}</div>`; }).join("") : empty("还没有现金流记录", "从一笔生活支出或一笔分红开始。"); }

function journeyView() { const t = totals(); const tasks = [ ["inventory", "完成首轮资产盘点"], ["debtRate", "补齐所有债务利率"], ["dividend", "记录第一笔资产现金流"], ["expense", "连续三个月更新生活支出"], ["thesis", "为一项资产写下投资理由"] ]; return `<section class="view"><div class="section-title"><div><h2>成长地图</h2><p>用长期行动，换取越来越多的选择权。</p></div></div><div class="split-layout"><article class="panel goal-card"><div class="panel-heading"><div><h3>走向财务安全</h3><p>当资产现金流覆盖你的基础生活支出。</p></div><span class="tag">当前目标</span></div><div class="big">${pct(t.coverage)} <span style="font-size:14px;font-weight:500">/ 100%</span></div><p class="muted">每月还需增加 <strong class="positive">${fmt(Math.max(0, t.expense - t.passive))}</strong> 的可持续资产现金流。</p><div class="progress-track goal-progress"><span style="width:${Math.min(t.coverage,100)}%"></span></div><div class="coverage-meta" style="color:var(--ink-soft)"><span>${fmt(t.passive)} 已建立</span><span>${fmt(t.expense)} 目标</span></div></article><article class="panel"><div class="panel-heading"><div><h3>本阶段行动</h3><p>完成事实性的财务整理，而不是冲动交易。</p></div></div><div class="tasks">${tasks.map(([key, label]) => `<label class="task ${data.tasks[key] ? "done" : ""}"><input type="checkbox" data-task="${key}" ${data.tasks[key] ? "checked" : ""}/><span>${label}</span></label>`).join("")}</div></article></div><article class="panel journey-panel"><div class="panel-heading"><div><h3>你的资产池路径</h3><p>阶段可在正式版中自定义。</p></div></div>${journeyPath(t.coverage, true)}</article><article class="callout"><span>✦</span><div><strong>衡量的是结构，不是炫耀的数字</strong><p>工资、浮盈和卖出本金都很重要，但不会替代“可持续资产现金流”这个核心指标。</p></div></article></section>`; }
function journeyPath(coverage, expanded = false) { const stages = [{ n:"盘点", c:0, d:"看见全貌" }, { n:"起步", c:10, d:"第一笔现金流" }, { n:"小溪", c:30, d:"覆盖一部分支出" }, { n:"河流", c:50, d:"半自由状态" }, { n:"安全", c:100, d:"覆盖基础生活" }]; return `<div class="journey-path">${stages.map((stage, index) => { const status = coverage >= stage.c && (stage.c !== 0 || coverage >= 0) ? (coverage >= (stages[index + 1]?.c ?? Infinity) ? "done" : "current") : ""; return `<div class="journey-stage ${status}"><span class="stage-dot">${status === "done" ? "✓" : stage.c + "%"}</span><strong>${stage.n}</strong><small>${expanded ? stage.d : stage.c + "% 覆盖"}</small></div>`; }).join("")}</div>`; }

function notesView() { return `<section class="view"><div class="section-title"><div><h2>复盘与思想</h2><p>让每一次决策都留下理由，让经验慢慢成为自己的系统。</p></div><div class="actions"><button class="button primary" data-action="add-note">新建内容</button></div></div><div class="note-grid">${data.notes.map((note) => `<article class="note-card"><span class="tag">${escapeHtml(note.type)}</span><h3>${escapeHtml(note.title)}</h3><p>${escapeHtml(note.body)}</p><div style="margin-top:13px;display:flex;justify-content:space-between;align-items:center"><small class="muted">${escapeHtml(note.visibility)}</small>${note.url ? `<a class="button subtle" target="_blank" rel="noreferrer" href="${escapeHtml(note.url)}">打开链接</a>` : `<button class="row-menu" data-delete="note" data-id="${note.id}" title="删除">×</button>`}</div></article>`).join("") || empty("还没有复盘", "写下你的第一条投资原则或交易复盘。")}</div><article class="callout"><span>●</span><div><strong>私密与公开内容分开保存</strong><p>“可公开”的内容可在下一阶段导出到你的内容网站；金额、账户和家庭资料不会被带出。</p></div></article></section>`; }

function settingsView() { return `<section class="view"><div class="section-title"><div><h2>数据与设置</h2><p>你的资料库保存在当前浏览器的本地存储中。</p></div></div><div class="settings-grid"><article class="panel"><div class="panel-heading"><div><h3>资料库</h3><p>设置你的基础生活支出目标。</p></div></div><div class="setting-list"><div class="setting-item"><div><strong>基础生活支出</strong><p>用于计算财务安全覆盖率。</p></div><button class="button secondary" data-action="set-expense">${fmt(data.profile.baseExpense)} / 月</button></div><div class="setting-item"><div><strong>演示数据</strong><p>本原型附带可编辑的示例资产和记录。</p></div><button class="button danger" data-action="clear-data">清空数据</button></div></div></article><article class="panel"><div class="panel-heading"><div><h3>备份与恢复</h3><p>导出后请将文件放在你信任的位置。</p></div></div><div class="setting-list"><div class="setting-item"><div><strong>导出完整备份</strong><p>下载含资产、负债、记录和笔记的 JSON 文件。</p></div><button class="button primary" data-action="export-data">导出</button></div><div class="setting-item"><div><strong>导入备份</strong><p>导入会覆盖当前浏览器中的资料库。</p></div><label class="button secondary" for="importFile">导入</label><input class="file-input" id="importFile" type="file" accept="application/json,.json" /></div></div></article></div><article class="callout"><span>!</span><div><strong>原型的数据边界</strong><p>现在的版本使用浏览器本地存储，适合验证流程，但还不是加密的正式财务资料库。正式可售版会迁移为桌面应用和加密数据库。</p></div></article></section>`; }

function allocationData() { const total = totals().assetValue || 1; const labels = ["现金及存款", "基金", "股票", "其他"]; const values = labels.map((label) => ({ label, value: data.assets.filter((x) => label === "其他" ? !["现金及存款","基金","股票"].includes(x.category) : x.category === label).reduce((s,x)=>s+Number(x.value||0),0) })); return values.map((x) => ({ ...x, percent: x.value / total * 100 })); }
function allocationPanel(items, total) { const classes = ["", "gold", "soft", "gray"]; return `<div class="allocation"><div class="donut"><div class="donut-center"><strong>${fmt(total)}</strong><small>总资产</small></div></div><div class="allocation-legend">${items.map((item,i) => `<div class="legend-item"><span class="legend-key"><i class="dot ${classes[i]}"></i>${item.label}</span><span>${pct(item.percent)}</span></div>`).join("")}</div></div>`; }
function nextTaskText() { const pending = { inventory:"完成你的首轮资产盘点，让总览有可信的起点。", debtRate:"为每笔负债补充年利率，识别真正昂贵的负担。", dividend:"记录一笔分红、利息或租金，开始追踪资产现金流。", expense:"更新基础生活支出目标，让覆盖率贴近真实生活。", thesis:"为一项资产写下投资理由，给未来的自己留下判断依据。" }; return Object.entries(pending).find(([key]) => !data.tasks[key])?.[1] || "很好，当前阶段的基础任务已完成。现在可以整理一次月度复盘。"; }

function bindViewEvents() {
  const scope = app;
  scope.querySelectorAll("[data-view]").forEach((element) => element.addEventListener("click", () => { view = element.dataset.view; render(); }));
  scope.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => handleAction(button.dataset.action)));
  scope.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => deleteItem(button.dataset.delete, button.dataset.id)));
  scope.querySelectorAll("[data-edit-transaction]").forEach((button) => button.addEventListener("click", () => transactionForm(button.dataset.editTransaction)));
  scope.querySelectorAll("[data-delete-transaction]").forEach((button) => button.addEventListener("click", () => deleteTransaction(button.dataset.deleteTransaction)));
  scope.querySelectorAll("[data-edit-cashflow]").forEach((button) => button.addEventListener("click", () => editCashflow(button.dataset.editCashflow)));
  scope.querySelectorAll("[data-task]").forEach((input) => input.addEventListener("change", () => { data.tasks[input.dataset.task] = input.checked; save(); render(); }));
  scope.querySelectorAll("[data-filter-asset]").forEach((button) => button.addEventListener("click", () => filterAssets(button.dataset.filterAsset, button)));
  scope.querySelectorAll("[data-filter-cash]").forEach((button) => button.addEventListener("click", () => filterCash(button.dataset.filterCash, button)));
  scope.querySelector("#assetSearch")?.addEventListener("input", (event) => searchAssets(event.target.value));
  ["#txAssetFilter", "#txTypeFilter", "#txStartDate", "#txEndDate", "#txSearch"].forEach((selector) => scope.querySelector(selector)?.addEventListener("input", filterTransactions));
  ["#txAssetFilter", "#txTypeFilter", "#txStartDate", "#txEndDate"].forEach((selector) => scope.querySelector(selector)?.addEventListener("change", filterTransactions));
  scope.querySelector("#importFile")?.addEventListener("change", importData);
}

function filterAssets(category, button) { document.querySelectorAll("[data-filter-asset]").forEach((item) => item.classList.toggle("active", item === button)); document.querySelector("#assetRows").innerHTML = assetRows(data.assets.filter((item) => category === "全部" || item.category === category)); }
function searchAssets(query) { document.querySelector("#assetRows").innerHTML = assetRows(data.assets.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))); }
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

function handleAction(action) { const actions = { "add-liability": liabilityForm, "add-cashflow": cashflowForm, "add-asset-income": assetIncomeForm, "add-transaction": transactionForm, "update-price": priceForm, "add-note": noteForm, "set-expense": expenseForm, "manage-cash-categories": cashCategoryForm, "clear-data": clearData, "export-data": exportData }; actions[action]?.(); }
function openModal(title, description, content, onSubmit, submitLabel = "保存") { modalLayer.innerHTML = `<form class="modal" id="modalForm"><div class="modal-head"><div><h2>${title}</h2><p>${description}</p></div><button class="close" type="button" data-close-modal>×</button></div><div class="modal-body">${content}</div><div class="modal-foot"><button class="button secondary" type="button" data-close-modal>取消</button><button class="button primary" type="submit">${submitLabel}</button></div></form>`; modalLayer.classList.add("open"); modalLayer.setAttribute("aria-hidden", "false"); modalLayer.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeModal)); modalLayer.querySelector("#modalForm").addEventListener("submit", (event) => { event.preventDefault(); onSubmit(new FormData(event.currentTarget)); }); }
function closeModal() { modalLayer.classList.remove("open"); modalLayer.setAttribute("aria-hidden", "true"); modalLayer.innerHTML = ""; }
function formFields(fields) { return `<div class="form-grid">${fields.join("")}</div>`; }
function field(name, label, type = "text", value = "", extra = "") { const isOptional = extra.includes("optional"); return `<div class="field ${extra.includes("full") ? "full" : ""}"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" type="${type}" value="${escapeHtml(value)}" ${extra.replace("full", "").replace("optional", "")} ${isOptional ? "" : "required"} /></div>`; }
function select(name, label, values, selected = "", extra = "") { return `<div class="field ${extra}"><label for="f-${name}">${label}</label><select id="f-${name}" name="${name}">${values.map((value) => `<option ${value === selected ? "selected" : ""}>${value}</option>`).join("")}</select></div>`; }
function textArea(name, label, value = "", extra = "full") { return `<div class="field ${extra}"><label for="f-${name}">${label}</label><textarea id="f-${name}" name="${name}">${escapeHtml(value)}</textarea></div>`; }

function liabilityForm() { openModal("新增负债", "负债会影响你的净资产与每月现金流。", formFields([field("name","负债名称","text","","full"), select("category","负债类别",["房贷","车贷","消费贷","信用卡","经营贷","亲友借款","其他负债"]), field("balance","剩余余额（元）","number","",'min="0" step="0.01"'), field("rate","年利率（%）","number","",'min="0" step="0.01"'), field("monthlyPayment","每月还款（元）","number","",'min="0" step="0.01"'), field("dueDay","还款日（每月几日）","number","1",'min="1" max="31" step="1"')]), (form) => { data.liabilities.push({ id:uid("l"), name:form.get("name"), category:form.get("category"), balance:Number(form.get("balance")), rate:Number(form.get("rate")), monthlyPayment:Number(form.get("monthlyPayment")), dueDay:Number(form.get("dueDay")) }); save(); closeModal(); toast("负债已记录"); render(); }); }
function cashflowForm(editId = "") {
  const existing = data.cashflows.find((item) => item.id === editId);
  const categories = data.cashflowCategories || seedData.cashflowCategories;
  openModal(existing ? "修改现金流" : "记录现金流", "资产现金流会计入覆盖率；工资和一次性收入不会。", `<p class="help">支出请填写负数金额，例如 -6500。类别可以在现金流页面中自定义。</p>${formFields([field("name","项目名称","text",existing?.name || "","full"), select("type","类别",categories, existing?.type || "生活支出"), field("amount","金额（元）","number",existing?.amount ?? "",'step="0.01"'), field("date","日期","date",existing?.date || today()), `<label class="field check-field full"><input type="checkbox" name="recurring" ${existing?.recurring === false ? "" : "checked"} /><span>计入可持续资产现金流（仅资产现金流）</span></label>`])}`, (form) => {
    const type = form.get("type");
    const item = { ...(existing || {}), id: existing?.id || uid("c"), name:form.get("name"), type, amount:Number(form.get("amount")), date:form.get("date"), sustainable:type === "资产现金流" && form.get("recurring") === "on", recurring:type === "资产现金流" && form.get("recurring") === "on" };
    if (existing) data.cashflows = data.cashflows.map((cash) => cash.id === existing.id ? item : cash);
    else data.cashflows.unshift(item);
    updateAssetMonthlyCashflows(); save(); closeModal(); toast(existing ? "现金流已修改" : "现金流已记录"); render();
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
  openModal(existing ? "修改分红/租金" : "记录分红/租金", "记录某项资产真实收到的现金流；资产月现金流会按最近一年合计除以 12 自动折算。", formFields([`<div class="field"><label for="f-assetId">资产</label><select id="f-assetId" name="assetId">${assetOptions}</select></div>`, select("incomeKind","现金流类型",["分红","派息","租金","利息","版权/经营分成","其他"], existing?.incomeKind || "分红"), field("amount","收到金额（元）","number",existing?.amount ?? "",'min="0" step="0.01"'), field("date","收到日期","date",existing?.date || today()), `<label class="field check-field full"><input type="checkbox" name="recurring" ${existing?.recurring === false ? "" : "checked"} /><span>纳入最近一年月均现金流计算</span></label>`, textArea("note","备注",existing?.note || "","full")]), (form) => {
    const asset = data.assets.find((item) => item.id === form.get("assetId"));
    if (!asset) { toast("没有找到这项资产", true); return; }
    const amount = num(form.get("amount"));
    if (!amount) { toast("请填写收到金额", true); return; }
    const item = { ...(existing || {}), id: existing?.id || uid("c"), assetId:asset.id, incomeKind:form.get("incomeKind"), name:`${asset.name} ${form.get("incomeKind")}`, type:"资产现金流", amount, date:form.get("date"), sustainable:form.get("recurring") === "on", recurring:form.get("recurring") === "on", note:form.get("note") };
    if (existing) data.cashflows = data.cashflows.map((cash) => cash.id === existing.id ? item : cash);
    else data.cashflows.unshift(item);
    updateAssetMonthlyCashflows();
    save(); closeModal(); toast(`${asset.name} 的${form.get("incomeKind")}已保存，月现金流已重算`); render();
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
function transactionForm(editId = "") {
  const existing = data.transactions.find((item) => item.id === editId);
  const existingAssetOptions = data.assets.map((item) => `<option value="${item.id}" ${item.id === existing?.assetId ? "selected" : ""}>${escapeHtml(item.name)}${item.code ? `（${escapeHtml(item.code)}）` : ""}</option>`);
  const assetOptions = data.assets.length ? [...existingAssetOptions, `<option value="__new__">+ 创建新资产</option>`].join("") : `<option value="__new__">+ 创建新资产</option>`;
  openModal(existing ? "修改交易" : "新增交易", "交易是资产持仓的来源；如果标的不存在，可在这笔交易里直接创建资产。", `<p class="help">第一次录入某个资产时，选择“创建新资产”，再填写下方资产信息。买入/卖出的“单价”按每份价格填写；期初建档可用于补录房产、现金、已有持仓等。</p>${formFields([`<div class="field"><label for="f-assetId">标的</label><select id="f-assetId" name="assetId">${assetOptions}</select></div>`, select("type","交易类型",["买入","卖出","分红/派息","手续费","期初建档"], existing?.type || "买入"), field("quantity","数量","number",existing?.quantity ?? "0",'min="0" step="0.0001"'), field("price","单价/金额（元）","number",existing?.price ?? "0",'min="0" step="0.0001"'), field("fee","手续费（元）","number",existing?.fee ?? "0",'min="0" step="0.01"'), field("date","交易日期","date",existing?.date || today()), `<label class="field check-field full"><input type="checkbox" name="recurring" ${existing?.recurring === false ? "" : "checked"} /><span>分红/派息计入可持续资产现金流</span></label>`, field("assetName","新资产名称","text","","full optional"), field("assetCode","代码/识别名（可选）","text","","optional"), select("assetCategory","新资产类别",["现金及存款","股票","基金","债券","黄金及贵金属","房产","保险现金价值","经营性资产","其他资产"]), field("assetAccount","所属账户（可选）","text","","optional"), textArea("reason","投资理由或复盘",existing?.reason || "","full")])}`, (form) => {
    const beforeTransactions = clone(data.transactions);
    const beforeAssets = clone(data.assets);
    let assetId = form.get("assetId");
    if (assetId === "__new__") {
      const asset = createAssetFromTransaction(form);
      if (!asset) return;
      assetId = asset.id;
    }
    const tx = normalizeTransaction({ id: existing?.id || uid("t"), assetId, type:form.get("type"), quantity:num(form.get("quantity")), price:num(form.get("price")), fee:num(form.get("fee")), date:form.get("date"), reason:form.get("reason"), recurring:form.get("recurring") === "on" });
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
}
function createAssetFromTransaction(form) {
  const name = String(form.get("assetName") || "").trim();
  if (!name) { toast("创建新资产需要填写资产名称", true); return null; }
  const draft = { id:uid("a"), name, code:form.get("assetCode"), category:form.get("assetCategory"), account:form.get("assetAccount"), quantity:0, cost:0, value:0, openingQuantity:0, openingCost:0, openingValue:0, latestPrice:num(form.get("price")), manualMonthlyCashflow:0, monthlyCashflow:0, date:form.get("date"), priceSource:"交易价" };
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
    asset.quantity = num(asset.quantity) + tx.quantity;
    asset.cost = num(asset.cost) + tx.quantity * tx.price + tx.fee;
    if (!num(asset.latestPrice)) asset.latestPrice = tx.price;
    asset.date = tx.date;
    if (!asset.priceSource || asset.priceSource === "交易价") asset.priceSource = "交易价";
    recalcAsset(asset);
    return { ok:true, message:`买入已入账，${asset.name} 持仓已更新` };
  }
  if (tx.type === "期初建档") {
    if (!tx.price) return { ok:false, message:"期初建档需要填写金额或单价" };
    if (tx.quantity) {
      asset.quantity = num(asset.quantity) + tx.quantity;
      asset.cost = num(asset.cost) + tx.quantity * tx.price + tx.fee;
      if (!num(asset.latestPrice)) asset.latestPrice = tx.price;
    } else {
      asset.value = num(asset.value) + tx.price;
      asset.cost = num(asset.cost) + tx.price + tx.fee;
    }
    asset.date = tx.date;
    recalcAsset(asset);
    return { ok:true, message:`${asset.name} 已完成期初建档` };
  }
  if (tx.type === "卖出") {
    if (!tx.quantity || !tx.price) return { ok:false, message:"卖出需要填写数量和单价" };
    if (tx.quantity > num(asset.quantity)) return { ok:false, message:"卖出数量不能超过当前持仓" };
    const avgCost = num(asset.avgCost) || (num(asset.quantity) ? num(asset.cost) / num(asset.quantity) : 0);
    const costOut = avgCost * tx.quantity;
    const proceeds = tx.quantity * tx.price - tx.fee;
    asset.quantity = num(asset.quantity) - tx.quantity;
    asset.cost = Math.max(0, num(asset.cost) - costOut);
    asset.soldQuantity = num(asset.soldQuantity) + tx.quantity;
    asset.realizedPriceGain = num(asset.realizedPriceGain) + proceeds - costOut;
    asset.realizedProfit = num(asset.realizedProfit) + proceeds - costOut;
    if (!num(asset.latestPrice)) asset.latestPrice = tx.price;
    asset.date = tx.date;
    if (!asset.priceSource || asset.priceSource === "交易价") asset.priceSource = "交易价";
    recalcAsset(asset);
    return { ok:true, message:`卖出已入账，已实现收益 ${fmt(proceeds - costOut)}` };
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
function priceForm() { if (!data.assets.length) { toast("请先新增一项资产", true); return; } const assetOptions = data.assets.map((item) => `<option value="${item.id}">${escapeHtml(item.name)}${item.code ? `（${escapeHtml(item.code)}）` : ""}</option>`).join(""); openModal("更新最新价", "手动更新最新价格；后续可接入 Tushare 等行情源作为增值能力。", formFields([`<div class="field"><label for="f-assetId">标的</label><select id="f-assetId" name="assetId">${assetOptions}</select></div>`, field("latestPrice","最新价（元）","number","",'min="0" step="0.0001"'), field("date","价格日期","date",today())]), (form) => { const asset = data.assets.find((item) => item.id === form.get("assetId")); if (!asset) return; asset.latestPrice = num(form.get("latestPrice")); asset.date = form.get("date"); asset.priceSource = "手动"; recalcAsset(asset); save(); closeModal(); toast(`${asset.name} 最新价已更新`); render(); }); }
function noteForm() { openModal("新建内容", "保存自己的原则、复盘或外部视频链接。", formFields([field("title","标题","text","","full"), select("type","内容类型",["投资原则","交易复盘","读书笔记","案例","视频卡片"]), select("visibility","可见性",["私密","可公开"]), field("url","外部链接（可选）","url","","full optional"), textArea("body","内容","","full")]), (form) => { data.notes.unshift({ id:uid("n"), title:form.get("title"), type:form.get("type"), visibility:form.get("visibility"), url:form.get("url"), body:form.get("body") }); save(); closeModal(); toast("内容已保存到思想库"); render(); }); }
function expenseForm() { openModal("设置基础生活支出", "这是资产现金流覆盖率的分母，可以随生活阶段更新。", formFields([field("baseExpense","每月基础生活支出（元）","number",data.profile.baseExpense,'min="0" step="1" full')]), (form) => { data.profile.baseExpense = Number(form.get("baseExpense")); save(); closeModal(); toast("基础生活支出已更新"); render(); }); }
function deleteItem(type, id) {
  const labels = { asset:"资产", liability:"负债", cashflow:"现金流", note:"内容" };
  if (!confirm(`确定删除这条${labels[type]}记录吗？此操作无法撤销。`)) return;
  if (type === "asset") {
    const relatedIds = data.transactions.filter((tx) => tx.assetId === id).map((tx) => tx.id);
    data.assets = data.assets.filter((item) => item.id !== id);
    data.transactions = data.transactions.filter((tx) => tx.assetId !== id);
    data.cashflows = data.cashflows.filter((item) => !relatedIds.includes(item.sourceTransactionId));
    rebuildHoldings();
  } else {
    const key = type === "liability" ? "liabilities" : type === "cashflow" ? "cashflows" : `${type}s`;
    data[key] = data[key].filter((item) => item.id !== id);
    if (type === "cashflow") updateAssetMonthlyCashflows();
  }
  save(); toast("记录已删除"); render();
}
function clearData() { if (!confirm("确定清空当前浏览器中的所有资产池数据吗？建议先导出备份。")) return; data = { profile:{name:"我的",baseExpense:0}, assets:[], liabilities:[], cashflows:[], cashflowCategories:clone(seedData.cashflowCategories), transactions:[], notes:[], tasks:{} }; save(); toast("当前资料库已清空"); render(); }
function exportData() { const blob = new Blob([JSON.stringify({ version:1, exportedAt:new Date().toISOString(), data }, null, 2)], { type:"application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `资产池备份-${today()}.json`; link.click(); URL.revokeObjectURL(url); toast("备份文件已下载"); }
function importData(event) { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const parsed = JSON.parse(reader.result); if (!parsed.data?.assets || !parsed.data?.liabilities) throw new Error(); if (!confirm("导入会覆盖当前资料库，确定继续吗？")) return; data = normalizeData(parsed.data); save(); toast("备份已恢复"); render(); } catch { toast("无法识别这个备份文件", true); } }; reader.readAsText(file); }
function toast(message, error = false) { const item = document.createElement("div"); item.className = `toast${error ? " error" : ""}`; item.textContent = message; document.querySelector("#toastRegion").append(item); setTimeout(() => item.remove(), 2800); }

document.querySelectorAll(".nav-item, .settings-link").forEach((button) => button.addEventListener("click", () => { view = button.dataset.view; render(); }));
document.querySelector("#quickSearch").addEventListener("click", () => { view = "assets"; render(); setTimeout(() => document.querySelector("#assetSearch")?.focus(), 0); });
document.querySelector("#todayLabel").textContent = new Intl.DateTimeFormat("zh-CN", { year:"numeric", month:"long", day:"numeric", weekday:"short" }).format(new Date());
modalLayer.addEventListener("click", (event) => { if (event.target === modalLayer) closeModal(); });
render();
