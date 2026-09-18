import json, sys, re
sys.stdout.reconfigure(encoding='utf-8')
p = sys.argv[1]
names = sys.argv[2].split(',') if len(sys.argv) > 2 else ['销售毛利率', '加权净资产收益率ROE', '投入资本回报率ROIC', '销售净利率']
d = json.load(open(p, encoding='utf-8'))
data = d.get('data', {})
for blk in (data.get('apiData', {}) or {}).get('apiRecall', []) or []:
    if blk.get('type') != '综合财务指标':
        continue
    c = blk.get('content', '')
    name = re.search(r'##\s*(.+)（', c)
    header = None
    cur = None
    for line in c.split('\n'):
        if line.startswith('### '):
            cur = line[4:].strip()
            header = None
            continue
        if line.startswith('|'):
            cells = [x.strip() for x in line.strip('|').split('|')]
            if cells[0] == '发布日期':
                header = cells
                continue
            if header and re.match(r'^\d{4}-\d{2}-\d{2}$', cells[0]) and '盈利能力' in cur:
                idx = [i for i, h in enumerate(header) if h in names]
                out = [f'{header[i]}={cells[i]}' for i in idx if i < len(cells)]
                print((name.group(1) if name else '?'), cells[2], '|', ' ; '.join(out))
