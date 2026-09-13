---
name: douyin-cover-short
description: Generate short, mobile-friendly Douyin cover images and carousel covers with a compact 4:5 vertical layout, centered hierarchy, and generous top and bottom breathing room. Use when the user asks to make or regenerate a Douyin cover, homepage thumbnail, short vertical poster, or any cover that must fit comfortably on a phone screen.
---

# Douyin Cover Short

Use this skill when making covers that need to look good in a phone feed, especially when the previous version felt too tall or too crowded.

## Core spec

- Prefer a `4:5` vertical composition.
- Target a short, compact feel; avoid long poster-like layouts.
- Keep all critical text and focal objects inside the middle `70%` of the canvas.
- Leave about `15%` empty space at the top and bottom.
- Use one main title only; keep it short and readable at thumbnail size.
- Put secondary labels small and close to the main subject, never in the corners.

## Layout rules

- For comparison covers, split left/right clearly and keep both sides vertically centered.
- For single-subject covers, center the subject and keep the title above it.
- For carousel covers, let the cover be stronger and simpler than the inner pages.
- If the image feels too tall, crop from the bottom first.
- Never let the conclusion bar, footer note, or icons push the image into a long-poster shape.

## Writing prompts for this skill

Include these instructions in the prompt:

- `4:5` vertical canvas
- `short mobile cover`
- `centered safe area`
- `large title`
- `top and bottom breathing room`
- `homepage thumbnail readability`

## Useful defaults

- Good exact crop target: `941x1280`
- Good mood: bold, clear, commercial, easy to read
- Good title length: `4-12` Chinese characters per line

## Regeneration rule

When updating an existing cover, keep a backup of the old file first, then regenerate or crop the new version to the short format.
