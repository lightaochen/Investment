import json, sys, io, os
sys.stdout.reconfigure(encoding='utf-8')
p = sys.argv[1]
lim = int(sys.argv[2]) if len(sys.argv) > 2 else 2500
kw = [k.strip() for k in sys.argv[3].split(',')] if len(sys.argv) > 3 else None
d = json.load(open(p, encoding='utf-8'))
data = d.get('data', {})
api = data.get('apiData', {}) or {}
for blk in api.get('apiRecall', []) or []:
    c = blk.get('content', '')
    if kw and not any(k in c for k in kw):
        continue
    print('#### API:', blk.get('type'), '|', blk.get('desc'))
    print(c[:lim])
    print('---')
doc = data.get('docData', {}) or {}
for g in doc.get('docRecall', []) or []:
    for x in g.get('docList', []) or []:
        c = x.get('content', '')
        if kw and not any(k in c for k in kw):
            continue
        print('==== ', x.get('title'), '|', x.get('publishTimeStr'))
        print(c[:lim])
        print('---')
