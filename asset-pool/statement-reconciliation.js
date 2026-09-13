// Apply a reviewed statement once. Unknown securities and changed records are never overwritten.
(function (root) {
  function applyStatementPlan(raw, plan) {
    if (!plan || raw.statementReconciliations?.includes(plan.id)) return { store: raw, applied: false };
    const member = raw.family?.members?.find((item) => item.id === plan.memberId);
    if (!member) return { store: raw, applied: false };
    const state = member.data;
    const conflicts = [];
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    for (const expected of plan.assets) {
      const asset = state.assets.find((item) => item.id === expected.id);
      if (!asset || asset.code !== expected.code || asset.account !== expected.account) conflicts.push(expected.name);
    }
    for (const [collection, edits] of [[state.transactions, plan.transactions], [state.cashflows, plan.cashflows]]) {
      for (const edit of edits) {
        const current = collection.find((item) => item.id === edit.id);
        // Compare all source fields, while allowing unrelated newly introduced metadata.
        if (!current || Object.keys(edit.before).some((key) => !same(current[key], edit.before[key]))) conflicts.push(edit.id);
      }
    }
    for (const tx of plan.newTransactions) {
      if (state.transactions.some((item) => item.id === tx.id || item.sourceRef === tx.sourceRef)) conflicts.push(tx.id);
    }
    if (conflicts.length) return { store: raw, applied: false, conflicts };
    const next = JSON.parse(JSON.stringify(raw));
    const target = next.family.members.find((item) => item.id === plan.memberId).data;
    for (const [collection, edits] of [[target.transactions, plan.transactions], [target.cashflows, plan.cashflows]]) {
      for (const edit of edits) Object.assign(collection.find((item) => item.id === edit.id), edit.changes);
    }
    target.transactions.push(...JSON.parse(JSON.stringify(plan.newTransactions)));
    for (const expected of plan.assets) {
      const asset = target.assets.find((item) => item.id === expected.id);
      asset.statementIncomePeriods = [...(asset.statementIncomePeriods || []), { ...plan.period, source: plan.id }];
    }
    next.statementReconciliations = [...(next.statementReconciliations || []), plan.id];
    return { store: next, applied: true };
  }
  root.applyAssetPoolStatementPlan = applyStatementPlan;
  if (typeof module !== 'undefined') module.exports = { applyStatementPlan };
})(globalThis);
