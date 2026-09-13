"""Independent Decimal reconciliation against the unchanged source workbook."""
import json
from decimal import Decimal
from pathlib import Path
import openpyxl

root = Path(__file__).resolve().parent
state = json.loads((root / 'reconciled-20260910.json').read_text(encoding='utf8'))['store']['family']['members'][0]['data']
rows = list(openpyxl.load_workbook(root / '我的成交单.xlsx', read_only=True, data_only=True).active.values)
dec = lambda x: Decimal(str(x or 0))
code = lambda x: str(x).lower().removeprefix('hk').lstrip('0')
matched = 0
for asset in state['assets']:
    selected = [(i + 2, r) for i, r in enumerate(rows[1:]) if code(r[2]) == code(asset['code'])]
    selected.sort(key=lambda pair: (str(pair[1][0]), str(pair[1][1]), pair[0]))
    qty = cost = gain = income = Decimal(0)
    for row_number, row in selected:
        matched += 1
        operation, amount = row[4], dec(row[14])
        if operation in ('证券买入', '证券卖出'):
            tx = next(t for t in state['transactions'] if t.get('statementSource', {}).get('row') == row_number)
            assert dec(tx['grossAmountRmb']) == dec(row[7])
            assert dec(tx['fee']) == sum(map(dec, row[11:14]))
            assert dec(tx['quantity']) == abs(dec(row[5]))
            assert dec(tx['price']) == dec(row[6])
            assert tx['dividendTax'] == 0
            if operation == '证券买入':
                qty += dec(row[5])
                cost -= amount
            else:
                sold = abs(dec(row[5]))
                assert qty >= sold
                out = cost / qty * sold
                qty -= sold
                cost -= out
                gain += amount - out
        elif operation == '股息入账':
            cf = next(c for c in state['cashflows'] if c.get('statementSource', {}).get('row') == row_number)
            assert dec(cf['amount']) == amount
            income += amount
        elif operation == '股息红利税补缴':
            tx = next(t for t in state['transactions'] if t.get('statementSource', {}).get('row') == row_number)
            assert dec(tx['dividendTax']) == -amount
            gain += amount
        else:
            raise AssertionError(operation)
    # Preserve unmatched manual trades, notably the 2026-09-10 Tencent purchase.
    for tx in state['transactions']:
        if tx['assetId'] == asset['id'] and not tx.get('statementSource'):
            assert tx['type'] == '买入'
            qty += dec(tx['quantity'])
            cost += dec(tx['quantity']) * dec(tx['price']) * (dec(tx['fxRate']) if asset['currency'] == 'HKD' else 1) + dec(tx['fee'])
    assert qty == dec(asset['quantity']), asset['name']
    assert abs(cost - dec(asset['cost'])) < Decimal('0.005'), asset['name']
    assert abs(gain - dec(asset['realizedPriceGain'])) < Decimal('0.005'), asset['name']
    recorded_income = sum(dec(c['amount']) for c in state['cashflows'] if c.get('assetId') == asset['id'] and c['type'] == '资产现金流')
    assert income == recorded_income, asset['name']
assert matched == 42
print('PASS: 42 source rows, 8 assets; amounts, positions, fees, tax and realized gains reconcile to cents.')
