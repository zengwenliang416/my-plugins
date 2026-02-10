---
name: gemini-cli
description: |
  【触发条件】TPD 工作流中需要前端分析、UX 约束分析、UI 架构规划、前端代码原型生成时使用。
  【核心产出】输出分析报告或前端代码原型，上下文限制 32k tokens
  【不触发】后端逻辑分析、API 设计、数据库操作（改用 codex-cli）
  【先问什么】无需询问，由 agents 调用
---

# Gemini CLI - TPD 工作流前端专家

Frontend analysis expert via `../../skills/gemini-cli/scripts/invoke-gemini.ts`. **UX/UI/组件分析** → 架构规划/原型代码 → Claude review & apply. Context limit: **32k tokens**.

## 执行命令

```bash
# 标准调用
npx tsx ../../skills/gemini-cli/scripts/invoke-gemini.ts \
  --workdir "${workdir:-$(pwd)}" \
  --role "${role}" \
  --prompt "${prompt}"

# 带会话继续
npx tsx ../../skills/gemini-cli/scripts/invoke-gemini.ts \
  --workdir "${workdir:-$(pwd)}" \
  --role "${role}" \
  --prompt "${prompt}" \
  --session "${session}"
```

## TPD 专用角色

| 角色               | 用途              | 适用阶段 |
| ------------------ | ----------------- | -------- |
| constraint         | UX/多视角约束分析 | thinking |
| architect          | 前端架构规划      | plan     |
| implementer        | 前端代码原型生成  | dev      |
| auditor            | UX/可访问性审计   | dev      |

---

## 场景模板

### 场景 1: 多视角约束分析 (thinking 阶段)

```bash
npx tsx ../../skills/gemini-cli/scripts/invoke-gemini.ts \
  --role constraint \
  --prompt "
## 任务
从多个视角分析约束。

## 问题
${QUESTION}

## 分析视角
1. 用户体验约束
2. 可维护性约束
3. 创新机会

## 输出格式
- 各视角约束发现
- 共识约束
- 分歧点
- 置信度评估
"
```

### 场景 2: 前端架构规划 (plan 阶段)

```bash
npx tsx ../../skills/gemini-cli/scripts/invoke-gemini.ts \
  --role architect \
  --prompt "
## 任务
设计前端架构方案。

## 需求
${REQUIREMENT}

## 输出内容
1. 用户旅程分析
2. 设计系统上下文
3. 组件架构（Atomic Design）
4. 状态管理策略
5. 路由设计
6. 响应式与可访问性

## 输出格式
SPEC.md 格式
"
```

### 场景 3: 前端代码原型 (dev 阶段)

```bash
npx tsx ../../skills/gemini-cli/scripts/invoke-gemini.ts \
  --role implementer \
  --prompt "
## 任务
基于分析生成前端代码原型。

## 上下文
${CONTEXT}

## 要求
1. React 组件代码
2. Tailwind CSS / styled-components
3. 响应式设计
4. 可访问性 (ARIA, keyboard)

## 输出格式
仅输出 Unified Diff Patch
"
```

### 场景 4: UX/可访问性审计 (dev 阶段)

```bash
npx tsx ../../skills/gemini-cli/scripts/invoke-gemini.ts \
  --role auditor \
  --prompt "
## 任务
审查代码变更的 UX 和可访问性。

## 变更列表
${CHANGES}

## 审查维度
- UX 质量（用户流程、反馈、一致性）
- WCAG 2.1 合规
- 响应式布局

## 输出格式
Issue 列表 + 修复建议 + 总分 (1-5)
"
```

---

## 上下文管理 (32k 限制)

| 策略            | 方法                        |
| --------------- | --------------------------- |
| Atomic Design   | 一次处理一个组件层级        |
| Interface First | 只传递接口，不传完整实现    |
| Multi-turn      | 布局 → 样式 → 交互 分步处理 |
| Session Reuse   | 使用 SESSION_ID 保持上下文  |

---

## 会话管理

```bash
# 第一次调用 - 获取 SESSION_ID
result=$(npx tsx ../../skills/gemini-cli/scripts/invoke-gemini.ts --role architect --prompt "...")
SESSION_ID=$(echo "$result" | grep SESSION_ID | cut -d= -f2)

# 后续调用 - 继续会话
npx tsx ../../skills/gemini-cli/scripts/invoke-gemini.ts --role architect --prompt "..." --session "$SESSION_ID"
```

---

## 约束条件

| 必须执行                  | 禁止事项              |
| ------------------------- | --------------------- |
| ✅ 注意 32k 上下文限制    | ❌ 直接应用代码不审查 |
| ✅ 保存 SESSION_ID        | ❌ 一次传递过多文件   |
| ✅ 代码必须经 Claude 审查 | ❌ 忽略可访问性检查   |
| ✅ 后台执行用 Task tool   | ❌ 盲从 Gemini 输出   |

---

## 输出格式

```json
{
  "success": true,
  "SESSION_ID": "uuid",
  "agent_messages": "analysis result or component code"
}
```
