const fs = require("node:fs");
const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");

const source = fs.readFileSync(require("node:path").join(__dirname, "app.js"), "utf8");

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Missing function: ${name}`);
  const bodyMarker = source.indexOf(") {", start);
  if (bodyMarker < 0) throw new Error(`Missing body: ${name}`);
  const brace = bodyMarker + 2;
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Unclosed function: ${name}`);
}

function loadFunctions(names, extras = {}) {
  if (names.includes("applyTransaction") && !names.includes("transactionGrossRmb")) names = [...names, "transactionGrossRmb"];
  const context = { console, ...extras };
  vm.createContext(context);
  vm.runInContext(names.map(extractFunction).join("\n"), context);
  return context;
}

test("legacy transactions default to zero tax without changing fees", () => {
  const c = loadFunctions(["num", "normalizeTransaction"], { uid: () => "t", today: () => "2026-09-10" });
  const tx = c.normalizeTransaction({ type: "卖出", fee: 51.41 });
  assert.equal(tx.dividendTax, 0);
  assert.equal(tx.fee, 51.41);
  assert.equal(c.normalizeTransaction({ dividendTax: "20.50" }).dividendTax, 20.5);
});

test("splitting sale fees into fee and dividend tax preserves net gain in CNY and HKD", () => {
  const c = loadFunctions(["num", "assetFxRate", "txFxRate", "recalcAsset", "applyTransaction"], { fmt: String });
  for (const currency of ["CNY", "HKD"]) {
    const run = (fee, dividendTax) => {
      const asset = { id: "a", currency, quantity: 200, cost: 32465.1, avgCost: 162.3255, latestPrice: 165.7, value: 33140 };
      const result = c.applyTransaction({ assetId: "a", type: "卖出", quantity: 200, price: 169.65, fxRate: 0.9, fee, dividendTax }, { state: { assets: [asset] } });
      assert.equal(result.ok, true);
      assert.equal(asset.value, 0);
      return asset.realizedPriceGain;
    };
    assert.ok(Math.abs(run(51.41, 0) - run(31.41, 20)) < 1e-8);
    assert.ok(Math.abs(run(31.41, 0) - run(31.41, 20) - 20) < 1e-8);
  }
});

test("sale form includes tax in totals and HKD FX reverse calculation", () => {
  const fields = {};
  for (const [key, value] of Object.entries({ rmbTotal: "", price: "100", quantity: "200", fxRate: "0.9", fee: "10", dividendTax: "20", type: "卖出", assetId: "a", assetCode: "" })) {
    fields[key] = { value, listeners: {}, addEventListener(event, fn) { this.listeners[event] = fn; } };
  }
  const form = { querySelector: (selector) => fields[selector.match(/name="(.*?)"/)[1]] };
  const c = loadFunctions(["num", "bindRmbTotalSync"], {
    data: { assets: [{ id: "a", currency: "HKD" }] },
    document: { querySelector: () => ({ querySelector: () => form }) },
  });
  c.bindRmbTotalSync();
  assert.equal(fields.rmbTotal.value, "17970.00");
  assert.equal(fields.dividendTax.disabled, false);
  fields.rmbTotal.value = "17970";
  fields.rmbTotal.listeners.input();
  assert.equal(fields.fxRate.value, "0.90000000");
  fields.dividendTax.value = "30";
  fields.dividendTax.listeners.input();
  assert.equal(fields.rmbTotal.value, "17960.00");
  fields.type.value = "买入";
  fields.type.listeners.change();
  assert.equal(fields.dividendTax.disabled, true);
  assert.equal(fields.rmbTotal.value, "18010.00");
});

test("clearing a stock position removes its market value from total gain", () => {
  const context = loadFunctions(
    ["num", "assetFxRate", "txFxRate", "recalcAsset", "applyTransaction"],
    { data: null, fmt: (value) => `¥${Number(value).toFixed(2)}` },
  );
  const asset = {
    id: "mindray", name: "迈瑞医疗", category: "股票", currency: "CNY",
    quantity: 0, cost: 0, value: 33140, latestPrice: 165.7,
    realizedPriceGain: 0, realizedProfit: 0, soldQuantity: 0,
  };
  const state = { assets: [asset] };
  const transactions = [
    { assetId: asset.id, type: "买入", quantity: 100, price: 166.52, fee: 1.6, date: "2026-03-23" },
    { assetId: asset.id, type: "买入", quantity: 100, price: 158.1, fee: 1.5, date: "2026-04-27" },
    { assetId: asset.id, type: "卖出", quantity: 200, price: 169.65, fee: 51.41, date: "2026-09-07" },
  ];

  for (const tx of transactions) assert.equal(context.applyTransaction(tx, { state }).ok, true);

  assert.equal(asset.quantity, 0);
  assert.equal(asset.cost, 0);
  assert.equal(asset.value, 0);
  assert.ok(Math.abs(asset.realizedPriceGain - 1413.49) < 0.001);
  assert.ok(Math.abs(asset.value - asset.cost + asset.realizedPriceGain + 312 - 1725.49) < 0.001);
});

test("market sync removes an automatic dividend after a backdated full sale", () => {
  const context = loadFunctions(
    ["num", "quantityAtDate", "reconcileAutoDividend"],
    { data: null, uid: () => "unused" },
  );
  const asset = { id: "mindray", name: "迈瑞医疗", openingQuantity: 0 };
  const state = {
    assets: [asset],
    transactions: [
      { assetId: asset.id, type: "买入", quantity: 200, date: "2026-04-27" },
      { assetId: asset.id, type: "卖出", quantity: 200, date: "2026-09-07" },
    ],
    cashflows: [
      { sourceRef: "auto:div:300760:2026-09-08", assetId: asset.id, amount: 266 },
    ],
  };
  const record = {
    exDate: "2026-09-08", recordDate: "2026-09-07", payDate: "2026-09-08",
    perShare: 1.33, parts: 1,
  };

  assert.equal(context.reconcileAutoDividend(state, asset, "300760", record), true);
  assert.deepEqual(state.cashflows, []);
});

test("rebuild pruning keeps manually entered and still-entitled dividends", () => {
  const context = loadFunctions(
    ["num", "quantityAtDate", "reconcileStoredAutoDividends"],
    { data: null },
  );
  const asset = { id: "mindray", openingQuantity: 0 };
  const state = {
    assets: [asset],
    transactions: [{ assetId: asset.id, type: "买入", quantity: 200, date: "2026-04-27" }],
    cashflows: [
      { id: "eligible", sourceRef: "auto:div:300760:2026-05-28", assetId: asset.id, recordDate: "2026-05-27" },
      { id: "manual", assetId: asset.id, amount: 100 },
    ],
  };

  context.reconcileStoredAutoDividends(state);
  assert.deepEqual(state.cashflows.map((item) => item.id), ["eligible", "manual"]);
});

test("rebuild pruning removes a legacy auto dividend when the position was cleared before ex-date", () => {
  const context = loadFunctions(
    ["num", "quantityAtDate", "reconcileStoredAutoDividends"],
    { data: null },
  );
  const asset = { id: "mindray", openingQuantity: 0 };
  const state = {
    assets: [asset],
    transactions: [
      { assetId: asset.id, type: "买入", quantity: 200, date: "2026-04-27" },
      { assetId: asset.id, type: "卖出", quantity: 200, date: "2026-09-07" },
    ],
    cashflows: [
      { id: "stale", sourceRef: "auto:div:300760:2026-09-08", assetId: asset.id, amount: 266 },
      { id: "manual", assetId: asset.id, amount: 100 },
    ],
  };

  context.reconcileStoredAutoDividends(state);
  assert.deepEqual(state.cashflows.map((item) => item.id), ["manual"]);
});
