# Obsidian 到网页的发布规则

## 核心规则

网页只读取带有 `publish: true` 的笔记。没有确认的想法、内部备注、敏感信息都保留在 Obsidian 私有区。

## 推荐目录

```text
InvestmentVault
├── 00_Inbox
├── 01_Videos
├── 02_Concepts
├── 03_Books
├── 04_Companies
├── 05_Masters
├── 06_Checklists
├── 07_Metrics
├── 08_Insights
├── 09_Public
└── 99_Private
```

## 必填字段

```yaml
---
title: ""
type: concept
status: draft
publish: false
tags: []
---
```

## 内容类型

- `video_episode`：视频入库
- `concept`：投资概念
- `company`：公司研究
- `book_note`：读书笔记
- `insight`：认知更新
- `checklist`：研究清单
- `metric`：跟踪指标

## 发布前检查

- 没有具体买卖建议
- 没有内部信息或持仓暴露
- 没有目标价、确定性收益表述
- 有清晰的学习笔记免责声明
- 观点能追溯到来源或个人推理
