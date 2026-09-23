$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

# 1. iFinD 指数行情与股息率。账号从当前用户的环境变量读取，不写入脚本。
& 'D:\Anaconda\python.exe' scripts\sync_ifind_red_dividend.py --daily
if ($LASTEXITCODE -ne 0) { throw "iFinD 同步失败，退出码：$LASTEXITCODE" }

# 2. 保留原有公开源同步器以更新 10 年国债收益率；首次运行前执行 npm.cmd ci。
npm.cmd run sync
if ($LASTEXITCODE -ne 0) { throw "国债同步失败，退出码：$LASTEXITCODE" }

# 3. 只输出研究观察信号，不自动下单。
& 'D:\Anaconda\python.exe' scripts\build_red_dividend_signals.py
if ($LASTEXITCODE -ne 0) { throw "信号生成失败，退出码：$LASTEXITCODE" }
