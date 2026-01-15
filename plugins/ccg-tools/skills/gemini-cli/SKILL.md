---
name: gemini-cli
description: |
  【触发条件】当需要 UI 组件设计、CSS 样式、响应式布局、视觉原型时使用。
  【触发关键词】React 组件、Tailwind、CSS、UI/UX、表单设计、前端原型、Gemini
  【核心能力】输出 React/HTML/CSS 代码，上下文限制 32k tokens
  【不触发】后端逻辑、数据库操作、API 实现、复杂业务逻辑（改用 codex-cli）
  【注意】适合快速前端原型，复杂逻辑交给 Codex
allowed-tools:
  - Bash
  - Read
  - Task
---

# Gemini CLI - 多模型协作前端专家

Frontend design assistant via `codeagent-wrapper`. **UI/CSS/响应式布局** → React/HTML 原型 → Claude review & apply. Context limit: **32k tokens**.

## 执行命令

```bash
# 标准调用
~/.claude/bin/codeagent-wrapper gemini \
  --workdir /path/to/project \
  --role frontend \
  --prompt "Your task"

# 后台并行执行
~/.claude/bin/codeagent-wrapper gemini --prompt "$PROMPT" &
```

## 强制协作流程

### Step 1: 设计分析

```bash
~/.claude/bin/codeagent-wrapper gemini \
  --role analyzer \
  --prompt "需求：[UI需求]\n请分析：组件结构、样式方案、响应式策略。"
```

- 获取 Gemini 的设计建议
- 确认技术栈和风格方向

### Step 2: 原型生成

```bash
~/.claude/bin/codeagent-wrapper gemini \
  --role frontend \
  --prompt "任务：[组件任务]\n技术栈：[React/Vue/HTML]\n风格：[Tailwind/CSS]\n输出组件代码。" \
  --session "$SESSION_ID"
```

- ⚠️ **原型仅供参考**
- 必须经 Claude 审查重构

### Step 3: Claude 重构

1. 审查原型的设计意图
2. 优化命名和结构
3. 确保符合项目规范
4. 添加必要的类型和注释

### Step 4: 审查确认

```bash
~/.claude/bin/codeagent-wrapper gemini \
  --role reviewer \
  --prompt "我已完成：[组件摘要]\n请审查：可访问性/响应式/样式一致性" \
  --session "$SESSION_ID"
```

## 角色提示词

| 角色      | 用途         | 命令示例           |
| --------- | ------------ | ------------------ |
| frontend  | UI/组件开发  | `--role frontend`  |
| analyzer  | 前端架构分析 | `--role analyzer`  |
| debugger  | 前端问题调试 | `--role debugger`  |
| reviewer  | 前端代码审查 | `--role reviewer`  |
| optimizer | 前端性能优化 | `--role optimizer` |
| tester    | 组件测试生成 | `--role tester`    |

## 上下文管理 (32k 限制)

| 策略            | 方法                        |
| --------------- | --------------------------- |
| Atomic Design   | 一次一个组件                |
| Interface First | 只传接口，不传完整实现      |
| Multi-turn      | 布局 → 样式 → 交互 分步进行 |
| Session Reuse   | 使用 `--session` 保持上下文 |

## 会话管理

```bash
# 第一次调用 - 获取 SESSION_ID
result=$(~/.claude/bin/codeagent-wrapper gemini --prompt "..." )
SESSION_ID=$(echo "$result" | grep SESSION_ID | cut -d= -f2)

# 后续调用 - 继续会话
~/.claude/bin/codeagent-wrapper gemini --prompt "..." --session "$SESSION_ID"
```

## 并行执行（后台模式）

```bash
# 使用 Task tool 的 run_in_background=true
# 禁止擅自终止后台任务
```

## 强制约束

| 必须执行                  | 禁止事项              |
| ------------------------- | --------------------- |
| ✅ 保存 SESSION_ID        | ❌ 直接使用原型不审查 |
| ✅ 原型必须经 Claude 重构 | ❌ 超过 32k 上下文    |
| ✅ 后台执行用 Task tool   | ❌ 擅自终止后台任务   |
| ✅ 指定明确的风格方向     | ❌ 使用泛泛的 AI 审美 |

## 输出格式

```json
{
  "success": true,
  "SESSION_ID": "uuid",
  "agent_messages": "component code, styles, or analysis"
}
```

---

SESSION_ID=xxx
