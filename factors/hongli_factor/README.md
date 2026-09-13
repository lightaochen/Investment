# 红利择时数据采集

本目录当前采集三个中证红利指数与财政部页面展示的中国 10 年期国债收益率：

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

建议在工作日 18:15（北京时间）运行，使用收盘后可获得的数据生成次一交易日可执行的观察信号。以下命令仅在确认路径无误后执行一次：

```powershell
schtasks /Create /TN "HongliFactorDailySync" /SC WEEKLY /D MON,TUE,WED,THU,FRI /ST 18:15 /TR "powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\desktop\Investment\factors\hongli_factor\scripts\run-daily.ps1" /F
```

任务只负责采集与更新数据库，不下单、不产生自动交易。

## 数据口径

- 国债：财政部页面嵌入的中债历史数据接口，读取 10 年期字段；
- 指数行情：中证指数官网 `index-perf` 公开接口；
- 指数股息率：中证指数官网的 `indicator.xls` 文件，使用 `D/P1（总股本）` 作为 `dividend_yield_total`；
- `bond_minus_dividend = 10 年国债收益率 - 指数股息率`，与当前研究方案一致。

当任一来源失败，运行会被标记为 `failed` 并保留错误详情；不会把旧数据伪装成新信号。
