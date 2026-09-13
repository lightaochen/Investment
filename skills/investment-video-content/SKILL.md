---
name: investment-video-content
description: Create value-investing Douyin video scripts, Obsidian notes, and screenshot-ready 9:16 HTML slides. Use when the user wants to turn investment ideas, book notes, company research, asset allocation concepts, Buffett/Munger/Duan Yongping ideas, or value-investing frameworks into short-form video copy, Obsidian markdown files, Douyin captions, and visual HTML pages.
---

# Investment Video Content

## Core Workflow

When creating a new episode:

1. Create an Obsidian note under `obsidian/01_Videos/`.
2. Write a Douyin-oriented script, usually 500-700 Chinese characters unless the user specifies otherwise.
3. Include:
   - 视频标题
   - 一句话结论
   - 开头钩子
   - 口播脚本
   - 画面结构
   - 发布前核对
   - 后续微调
4. Create a matching asset folder:
   `obsidian/01_Videos/episode-XX-topic-assets/`
5. Generate screenshot-ready `slides.html` and `slides.css`.
6. When the user wants ready-to-post images, prefer generating image cards directly or exporting the slides to a sibling `png/` folder.
7. Keep HTML as a preview layer, not the final publishing step.
8. Use 9:16 vertical slide cards for Douyin visuals.
9. Keep financial content educational, not advisory.

## Obsidian Note Format

Use this structure:

```markdown
---
title: "第X期：主题"
type: video_episode
status: draft
publish: false
date: YYYY-MM-DD
tags: []
related_concepts: []
related_companies: []
related_books: []
compliance_note: "不荐股，不预测，不构成投资建议。"
---

# 第X期：主题

## 视频标题

## 一句话结论

## 开头钩子

## 口播脚本

## 画面结构

素材页：[[episode-XX-topic-assets/slides.html]]

## 发布前核对

## 后续微调

## 待继续思考的问题
```

## Douyin Retention Rules

Optimize every script for Douyin retention.

### Douyin Rewrite Principle

When rewriting a draft, turn it into a Douyin-native structure:

- Start with a 3-second choice, contradiction, or self-relevance hook.
- Keep asking small questions in the middle so the audience has a reason to keep listening.
- End with suspense, an interactive question, or a next-episode teaser.
- Make it feel like a short video people want to finish, not a quiet research note.
- Prefer concrete objects and life choices over abstract concepts.
- Translate professional finance terms into ordinary language before using them.
- Make sure a non-finance audience can understand the core idea without knowing terms like ROE, ROIC, DCF, or free cash flow.

### Opening Hook

The first 3 seconds must create curiosity, conflict, or self-relevance.

Good hooks:

- “你以为自己买的是资产，其实它可能一直在拿走你的钱。”
- “普通人投资，最怕的不是亏钱，而是假装自己懂。”
- “指数不是发财按钮，但它可能是普通人最容易理解的资产。”
- “巴菲特真正买的不是股票，而是会长期印钱的生意。”

Avoid:

- “大家好，今天我们来讲……”
- “本期主要介绍……”
- Long background setup.

### Script Rhythm

For videos longer than 60 seconds:

- Insert a mini-hook every 15-20 seconds.
- Use contrast:
  - 看起来是资产，其实是负债
  - 名义收益高，真实回报低
  - 短期很舒服，长期很危险
- Use simple questions:
  - “那问题来了，它到底靠什么赚钱？”
  - “如果扣掉这些成本，还值得吗？”
  - “为什么这件事说起来简单，做起来很难？”

### Structure

Prefer:

1. 3-second hook
2. One-sentence thesis
3. Simple example
4. Core concept
5. Comparison or formula
6. Counterintuitive reminder
7. Summary
8. Soft closing

### Retention Devices

Use at least 2 per script:

- Contradiction: “不是A，而是B”
- Everyday example: noodles, rent, salary, mortgage, car loan
- Formula: `资产现金流 > 日常消费`
- Comparison: cash vs bond vs stock vs gold
- Question: “你买的是现金流，还是情绪安全感？”
- Boundary: “这不是建议，只是我的学习笔记”

## Script Style

- Use simple spoken Chinese.
- Prefer short sentences.
- Write for ordinary people first, then introduce investment concepts.
- If using a professional term, explain it immediately in plain Chinese.
- Prefer "公司用一块钱本金能赚多少钱" over raw terms like "ROE" when addressing general audiences.
- Prefer "赚到的钱是不是真能留下来" over raw terms like "free cash flow" when addressing general audiences.
- Avoid guru-like, salesy, or overconfident phrasing.
- Keep the tone sincere, rational, vivid, and learning-in-public.
- Creator persona: a young Shanghai-based financial IT worker learning value investing publicly with AI.
- Use examples from Buffett, Munger, Duan Yongping, Coca-Cola, Apple, Moutai, index investing, asset allocation, and cashflow thinking when relevant.
- Avoid direct buy/sell recommendations.

## Platform Safety Language

Before writing Douyin titles, scripts, subtitles, captions, image text, or comments, apply platform-safe wording.

- Avoid using finance, alcohol, tobacco, medical, platform-contact, and absolute marketing terms as traffic hooks.
- Do not promise returns, certainty, safety, healing, exam outcomes, or other guaranteed results.
- Do not include off-platform contact guidance, private group guidance, QR codes, account handles, or "contact me privately" wording.
- Prefer category names over brand/contact words when the exact brand is not necessary.
- Do not rely on pinyin, symbols, numbers, or split words to bypass moderation. If using mild platform slang, use it only for readability and brand-neutrality, not for prohibited conduct.
- For detailed examples and replacements, read `references/platform-safety.md` when creating or reviewing public-facing content.

## HTML Visual Rules

Generated HTML slides should be more expressive than plain note cards.

### Visual Format

- Use 9:16 vertical slides.
- Express only one idea per slide.
- Use large short titles, not long paragraphs.
- Put the key sentence in the visual center.
- Use visual hierarchy:
  - eyebrow label
  - big headline
  - one core sentence
  - visual object or comparison
- Avoid dense text blocks.

### Recommended Slide Types

Use a mix of:

- Shock card
- Formula card
- Comparison card
- Flow card
- Ladder card
- Risk card
- Quote-style card
- Checklist card

### Motion-Friendly Design

Design static HTML for video editing:

- Leave space for zoom-in animations.
- Use directional layouts:
  - left-to-right flow
  - top-to-bottom ladder
  - center-out comparison
- Use repeated visual elements for continuity.
- Emphasize key words:
  - 资产
  - 负债
  - 现金流
  - 机会成本
  - 护城河
  - 安全边际

### Text Limits

Per slide:

- Headline: under 16 Chinese characters if possible.
- Body: under 40 Chinese characters.
- List items: 3-5 max.
- No paragraph longer than 2 lines.

### Visual Tone

Keep the existing project style:

- warm off-white background
- dark green text
- gold emphasis
- thin borders
- grid texture
- calm research-terminal feeling

Add stronger Douyin readability:

- bigger titles
- more contrast
- fewer words
- clearer arrows and formulas
- one screen, one punchline

### Export Convention

- Prefer generating `slides.html` and `slides.css` first.
- When the user wants to skip manual screenshots, make the final output a numbered PNG card series.
- Keep filenames in slide order so the images can be dropped directly into video editing or posting tools.
- If a local HTML exporter is available and stable, it can be used as a fallback.

## Output Requirements

For every episode, produce:

1. Obsidian note
2. 500-700 character main script unless otherwise requested
3. 3 alternative hooks when useful
4. 3 alternative titles when useful
5. Douyin caption text when requested
6. 6-9 HTML slides
7. Slide-by-slide editing notes when useful
8. Compliance checklist

## Compliance

Always include:

```text
不荐股，不预测，不构成投资建议。
```

For data:

- Mark uncertain data as `待核验`.
- For index returns, specify:
  - start date
  - end date
  - whether dividends are included
  - monthly or yearly investment
  - currency
  - taxes and fees
- Avoid:
  - 必涨
  - 稳赚
  - 确定跑赢
  - 应该买
  - 目标价
