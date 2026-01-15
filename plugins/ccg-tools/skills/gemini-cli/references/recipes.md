# Gemini CLI 常用配方

## 快速参考

```bash
# 基础调用
~/.claude/bin/codeagent-wrapper gemini \
  --workdir /path/to/project \
  --role frontend \
  --prompt "Your task"
```

## 配方 1：React 组件

```bash
--prompt "Create a [COMPONENT_NAME] component.

Requirements:
- Use React + TypeScript
- Style with Tailwind CSS
- Mobile-first, responsive
- Include prop types interface

Design:
[DESCRIBE VISUAL APPEARANCE]"
```

## 配方 2：UI 布局

```bash
--prompt "Create a [LAYOUT_TYPE] layout.

Specs:
- Desktop: [COLUMN_COUNT] columns
- Mobile: single column stack
- Gap: [SPACING]
- Container max-width: [WIDTH]

Use CSS Grid/Flexbox as appropriate."
```

## 配方 3：表单设计

```bash
--prompt "Design a [FORM_PURPOSE] form.

Fields:
- [FIELD_1]: [TYPE]
- [FIELD_2]: [TYPE]

Include:
- Validation states (error, success)
- Loading state for submit button
- Accessible labels and error messages"
```

## 配方 4：需求清晰化

```bash
--prompt "Help clarify this requirement:

[PASTE REQUIREMENT]

Generate:
1. Clarifying questions
2. Potential edge cases
3. Suggested acceptance criteria"
```

## 配方 5：样式优化

```bash
--prompt "Optimize the styles for [COMPONENT]:

Current issues:
- [ISSUE_1]
- [ISSUE_2]

Improve:
- Visual hierarchy
- Spacing and alignment
- Color contrast (WCAG AA)"
```

## 配方 6：动画效果

```bash
--prompt "Add animations to [COMPONENT].

Effects needed:
- [EFFECT_1]: [TRIGGER]
- [EFFECT_2]: [TRIGGER]

Use Framer Motion or CSS transitions.
Keep animations subtle and performant."
```

## 多轮对话模式

```bash
# 第一轮：保存 SESSION_ID
RESULT=$(~/.claude/bin/codeagent-wrapper gemini \
  --workdir /project --role frontend --prompt "...")
SESSION_ID=$(echo "$RESULT" | jq -r '.SESSION_ID')

# 后续轮：使用 SESSION_ID
~/.claude/bin/codeagent-wrapper gemini \
  --workdir /project \
  --session "$SESSION_ID" \
  --prompt "Continue..."
```

## 上下文控制（32k 限制）

| 策略     | 做法                              |
| -------- | --------------------------------- |
| 原子设计 | 一次只请求一个组件                |
| 接口优先 | 只传 interface 定义，不传完整实现 |
| 分步构建 | 布局 → 样式 → 交互，分多轮完成    |
| 会话续接 | 用 `--session-id` 保持上下文连续  |

## 视觉描述关键词

| 类别 | 关键词                                          |
| ---- | ----------------------------------------------- |
| 布局 | Grid, Flexbox, Masonry, Sidebar, Modal, Drawer  |
| 风格 | Material, Glassmorphism, Neomorphism, Brutalist |
| 行为 | Sticky, Infinite scroll, Accordion, Collapse    |
| 动效 | Fade, Slide, Scale, Spring, Stagger             |
