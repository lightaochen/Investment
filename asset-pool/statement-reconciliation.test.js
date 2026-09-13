const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');
const { applyStatementPlan } = require('./statement-reconciliation');
const read = (file) => fs.readFileSync(path.join(__dirname, file), 'utf8');
const baseline = JSON.parse(read('orderfill/before-reconciliation-20260910.json')).store;
const planContext = vm.createContext({});
vm.runInContext(read('data/statement-reconciliation-20260910.js'), planContext);
const plan = JSON.parse(JSON.stringify(planContext.AssetPoolStatementPlan));

function boot(raw = baseline) {
  const memory = new Map([['asset-pool-v1', JSON.stringify(raw)]]);
  const context = vm.createContext({
    console, document: { querySelector: () => ({}) },
    localStorage: { getItem: (key) => memory.get(key) || null, setItem: (key, value) => memory.set(key, value) },
    applyAssetPoolStatementPlan: applyStatementPlan,
    AssetPoolStatementPlan: plan,
  });
  // Execute the actual initialization and all domain functions, before DOM event wiring.
  const script = read('app.js').split('document.querySelectorAll(".nav-item, .settings-link")')[0];
  vm.runInContext(script, context);
  return { context, memory, store: JSON.parse(memory.get('asset-pool-v1')) };
}

test('statement updates only the existing eight securities and preserves other members and unmatched trades', () => {
  const result = applyStatementPlan(baseline, plan);
  assert.equal(result.applied, true);
  assert.deepEqual(result.store.family.members.slice(1), baseline.family.members.slice(1));
  const before = baseline.family.members[0].data;
  const after = result.store.family.members[0].data;
  assert.deepEqual(after.assets.map(a => a.id), before.assets.map(a => a.id));
  assert.equal(after.transactions.length, 35);
  const unmatched = before.transactions.find(t => t.date === '2026-09-10');
  assert.deepEqual(after.transactions.find(t => t.id === unmatched.id), unmatched);
  for (const tx of before.transactions) assert.equal(after.transactions.find(t => t.id === tx.id).reason, tx.reason);
  assert.equal(after.cashflows.length, before.cashflows.length);
  assert.deepEqual(after.cashflows.find(c => c.type === '生活支出'), before.cashflows.find(c => c.type === '生活支出'));
});

test('initialization applies once, preserves a backup, and matches every broker settlement to cents', () => {
  const { store, memory, context } = boot();
  assert.ok(store.statementReconciliations?.includes(plan.id));
  assert.deepEqual(JSON.parse(memory.get(`asset-pool-v1:${plan.id}:backup`)), baseline);
  const d = store.family.members[0].data;
  for (const edit of plan.transactions) {
    const tx = d.transactions.find(t => t.id === edit.id);
    const asset = d.assets.find(a => a.id === tx.assetId);
    const gross = context.transactionGrossRmb(tx, asset);
    const net = tx.type === '买入' ? -(gross + tx.fee) : gross - tx.fee;
    assert.ok(Math.abs(net - tx.statementSource.amount) < 1e-8, `row ${tx.statementSource.row}`);
  }
  for (const edit of plan.cashflows) assert.equal(d.cashflows.find(c => c.id === edit.id).amount, edit.changes.statementSource.amount);
  assert.equal(applyStatementPlan(store, plan).applied, false);
  assert.deepEqual(boot(store).store, store);
  for (const name of ['迈瑞医疗', '招商银行', '美的集团', '泡泡玛特']) {
    const a = d.assets.find(a => a.name === name);
    assert.equal(a.quantity, 0);
    assert.equal(a.value, 0);
    assert.equal(a.cost, 0);
  }
  const tax = d.transactions.filter(t => t.type === '红利税');
  assert.equal(tax.length, 6);
  assert.ok(Math.abs(tax.reduce((s, t) => s + t.dividendTax, 0) - 157.35) < 1e-8);
});

test('a changed transaction or missing whitelist asset blocks the entire reconciliation', () => {
  const raw = structuredClone(baseline);
  raw.family.members[0].data.transactions.find(t => t.id === plan.transactions[0].id).fee += 1;
  const result = applyStatementPlan(raw, plan);
  assert.equal(result.applied, false);
  assert.ok(result.conflicts.length);
  assert.deepEqual(result.store, raw);
  const missing = structuredClone(baseline);
  missing.family.members[0].data.assets.pop();
  assert.equal(applyStatementPlan(missing, plan).applied, false);
});

test('subsequent market dividend sync cannot duplicate statement-confirmed income', () => {
  const { store, context } = boot();
  const state = store.family.members[0].data;
  const asset = state.assets.find(a => a.code === '600519');
  const before = JSON.stringify(state.cashflows);
  assert.equal(context.reconcileAutoDividend(state, asset, '600519', { exDate: '2026-06-26', recordDate: '2026-06-25', perShare: 28.02423 }), false);
  assert.equal(JSON.stringify(state.cashflows), before);
  assert.equal(context.reconcileAutoDividend(state, asset, '600519', { exDate: '2026-12-20', recordDate: '2026-12-19', perShare: 1 }), true);
});

test('standalone tax and attached sale tax both survive a holdings rebuild without duplication', () => {
  const { store, context } = boot();
  const state = store.family.members[0].data;
  const first = JSON.stringify(state);
  assert.equal(context.rebuildHoldings(state).length, 0);
  assert.equal(JSON.stringify(state), first);
  const a = state.assets.find(a => a.name === '迈瑞医疗');
  const income = context.assetIncomeTotal(a.id, state);
  assert.ok(Math.abs(a.realizedPriceGain + income - 1725.49) < 1e-8);
  const pop = state.assets.find(a => a.name === '泡泡玛特');
  assert.ok(Math.abs(pop.realizedPriceGain - 695.73) < 1e-8);
});

test('editing an imported HKD trade preserves its exact RMB settlement and original notes', async () => {
  const { context } = boot();
  const edit = plan.transactions.find(e => e.changes.statementSource.row === 545);
  const original = vm.runInContext(`data.transactions.find(t => t.id === ${JSON.stringify(edit.id)})`, context);
  let submit;
  context.openModal = (title, help, body, handler) => { submit = handler; };
  for (const name of ['bindFxRateAutofill', 'bindRmbTotalSync', 'closeModal', 'toast', 'render']) context[name] = () => {};
  context.transactionForm(edit.id);
  const fields = { ...original, rmbTotal: '44393.25', recurring: 'on' };
  await submit({ get: key => fields[key] ?? '' });
  const updated = vm.runInContext(`data.transactions.find(t => t.id === ${JSON.stringify(edit.id)})`, context);
  assert.equal(updated.grossAmountRmb, 44210.17);
  assert.equal(updated.fee, 183.08);
  assert.equal(updated.reason, original.reason);
  assert.equal(updated.statementSource.row, 545);
});

if (process.argv.includes('--report')) {
  const { store } = boot();
  const d = store.family.members[0].data;
  console.log(JSON.stringify({ store, summary: d.assets.map(a => ({
    name: a.name, quantity: a.quantity, cost: a.cost,
    realizedPriceGain: a.realizedPriceGain,
    income: d.cashflows.filter(c => c.assetId === a.id && c.type === '资产现金流').reduce((s, c) => s + c.amount, 0),
  })) }));
}
