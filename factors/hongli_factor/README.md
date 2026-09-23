# 红利择时数据采集

本目录使用 SQLite 保存红利研究数据；不依赖 MySQL 或 PostgreSQL。现在包含两条数据链路：

- iFinD：六只红利相关指数的日行情与指数股息率，供历史回补和日更信号使用；
- 原有公开源：10 年期国债收益率，作为股债收益差的债券端。

## iFinD 历史与日更

直接填写本机的 `config/ifind.env` 即可。该文件已经被 Git 忽略，不会提交；不要把它发送给任何人。脚本优先使用此文件，文件不存在或字段为空时才回退到 Windows 环境变量。

```text
THS_USERNAME=你的iFinD账号
THS_PASSWORD=你的iFinD密码
```

填写后，首次回补研报样本起点至今的数据：

```powershell
cd E:\AI-Investment2\Investment\factors\hongli_factor
& D:\Anaconda\python.exe scripts\sync_ifind_red_dividend.py --from 2010-01-01 --max-dividend-requests 0
```

`THS_HQ` 以 120 个自然日分段获取；`THS_BD` 用六个指数合并为单个交易日请求。历史股息率请求较多，脚本可安全重跑：已经成功写入的日期会跳过，失败请求会记录在 `ifind_sync_failures` 中。若先想小批量验证，可加入 `--max-dividend-requests 20`。

每日收盘后运行：

```powershell
& D:\Anaconda\python.exe scripts\sync_ifind_red_dividend.py --daily
npm.cmd run sync
& D:\Anaconda\python.exe scripts\build_red_dividend_signals.py
```

或使用 `scripts\run-daily.ps1` 一次完成三步。首次使用原有国债同步器前仍需执行一次 `npm.cmd ci`。

信号脚本在同一 SQLite 中生成 `red_dividend_signal_daily`，输出最新 JSON 观察信号。它使用 `000922.CSI` 的指数股息率和 10 年期国债收益率，计算：

```text
bond_minus_dividend = 10Y 国债收益率 - 指数股息率
```

Z-score 的 5 年（1,260 个交易日）窗口和 `100% / 80% / 60% / 30%` 研究仓位均在 `config/red_dividend_strategy.json` 固定；信号默认只提示，不自动下单。

## 本地策略看板

同步完数据后，运行以下命令并在浏览器打开 `http://127.0.0.1:8787`：

```powershell
& D:\Anaconda\python.exe scripts\serve_dashboard.py
```

看板从同一 SQLite 只读展示历史 PE(TTM)、PB(MRQ)、PS、PCF、股息率、500 日均线与股债收益差的 ±1σ/±2σ 通道。首次补充 PS/PCF 后，需要重新运行一次相同日期区间的同步器以更新既有行情行；已完成的股息率不会重复请求。

若只想补充已经下载过行情中的 PS/PCF，不重新请求历史股息率，可使用：

```powershell
& D:\Anaconda\python.exe scripts\sync_ifind_red_dividend.py --from 2006-01-01 --to 2026-09-01 --skip-dividend
```

若行情历史已经完整、只需要分批补历史指数股息率，可使用 `--skip-market`，避免重复请求 THS_HQ：

```powershell
& D:\Anaconda\python.exe scripts\sync_ifind_red_dividend.py --from 2010-01-01 --to 2026-09-23 --skip-market --max-dividend-requests 100
```

定投模块是研究纪律而非自动交易：500 日均线提供趋势系数（向上 1.00，向下 0.60），Z-score 提供估值系数（-2σ 以下 1.50，-1σ 至 -2σ 为 1.25，+1σ 至 +2σ 为 0.75，+2σ 以上为 0.50），二者相乘得到月度手动定投参考额。

## 原有公开源同步器

原有同步器当前采集三个中证红利指数与财政部页面展示的中国 10 年期国债收益率：

- `000922` 中证红利；
- `H30269` 中证红利低波；
- `000825` 中证央企红利。

数据保存到 `data/red_dividend_timing.sqlite`。数据库不提交到 Git；它会保存原始响应、每次运行状态、指数行情、指数股息率和国债收益率。

## 初次安装与同步

```powershell
cd D:\desktop\Investment\factors\hongli_factor
npm.cmd install
npm.cmd run sync
```

初次运行会尽可能拉取公开可得的长历史：中证红利从 2005 年、央企红利从 2012 年、红利低波从 2013 年、财政部国债曲线从 2006 年开始。中证估值文件只提供近期数据，因此 TTM 股息率历史长度由官网实际返回的范围决定；长期的价格与国债数据不等于长期股债收益差信号。

## 日常更新与失败补数

```powershell
npm.cmd run sync
npm.cmd run report
```

每次 `sync` 都会重新拉取最近 30 个自然日，并优先重试数据库中所有未完成的历史请求区间；因网络、限流或上游延迟错过的数据会在后续运行自动补齐。若要指定历史区间：

```powershell
npm.cmd run sync -- --from 2025-01-01 --to 2025-12-31
```

## Windows 日更任务

建议在工作日 18:30（北京时间）运行，使 iFinD 行情与国债日终数据有更充分的更新时间，并生成次一交易日可执行的观察信号。以下命令仅在确认路径无误后执行一次：

```powershell
schtasks /Create /TN "HongliFactorDailySync" /SC WEEKLY /D MON,TUE,WED,THU,FRI /ST 18:30 /TR "powershell.exe -NoProfile -ExecutionPolicy Bypass -File E:\AI-Investment2\Investment\factors\hongli_factor\scripts\run-daily.ps1" /F
```

任务只负责采集与更新数据库，不下单、不产生自动交易。

## 数据口径

- 国债：财政部页面嵌入的中债历史数据接口，读取 10 年期字段；
- 指数行情：中证指数官网 `index-perf` 公开接口；
- 指数股息率：中证指数官网的 `indicator.xls` 文件，使用 `D/P1（总股本）` 作为 `dividend_yield_total`；
- `bond_minus_dividend = 10 年国债收益率 - 指数股息率`，与当前研究方案一致。

当任一来源失败，运行会被标记为 `failed` 并保留错误详情；不会把旧数据伪装成新信号。
