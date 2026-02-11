---
name: codex-cli
description: |
  【触发条件】TPD 工作流中需要后端代码分析、约束分析、架构规划、代码原型生成时使用。
  【核心产出】只读沙箱分析代码 → 输出分析报告或 unified diff patch → Claude 审查后应用
  【不触发】前端 UI/UX 分析（改用 gemini-cli）
  【先问什么】无需询问，由 agents 调用
  [Resource Usage] Use scripts/ entrypoint `scripts/invoke-codex.ts`.
allowed-tools:
  - Bash
  - Read
  - Write
arguments:
  - name: role
    type: string
    required: true
    description: 角色类型 (constraint-analyst|architect|implementer|auditor)
  - name: prompt
    type: string
    required: true
    description: 任务提示词
  - name: workdir
    type: string
    required: false
    description: 工作目录，默认为项目根目录
  - name: session
    type: string
    required: false
    description: 会话 ID，用于多轮对话
---

# Codex CLI - TPD 工作流后端专家

Backend analysis expert via `scripts/invoke-codex.ts`. **Read-only sandbox** → constraint/architecture/prototype analysis → Claude review & apply.

## Script Entry

```bash
npx tsx scripts/invoke-codex.ts --role "<role>" --prompt "<prompt>" [--workdir "<path>"] [--session "<id>"] [--sandbox "read-only"]
```

## Resource Usage

- Execution script: `scripts/invoke-codex.ts`

## 执行命令

```bash
# 标准调用
npx tsx scripts/invoke-codex.ts \
  --workdir "${workdir:-$(pwd)}" \
  --role "${role}" \
  --prompt "${prompt}" \
  --sandbox read-only

# 带会话继续
npx tsx scripts/invoke-codex.ts \
  --workdir "${workdir:-$(pwd)}" \
  --role "${role}" \
  --prompt "${prompt}" \
  --session "${session}" \
  --sandbox read-only
```

## TPD 专用角色

| 角色               | 用途               | 适用阶段 |
| ------------------ | ------------------ | -------- |
| constraint-analyst | 技术约束与风险分析 | thinking |
| architect          | 后端架构规划       | plan     |
| implementer        | 后端代码原型生成   | dev      |
| auditor            | 安全性能审计       | dev      |

> 兼容说明：若本机 `~/.claude/prompts/codex/` 缺少上述角色 prompt，脚本会自动回退到内置可用角色（如 `analyzer` / `reviewer`），避免 `role prompt not found` 警告导致流程中断。

---

## 场景模板

### 场景 1: 约束分析 (thinking 阶段)

```bash
npx tsx scripts/invoke-codex.ts \
  --role constraint-analyst \
  --prompt "
## 任务
分析以下问题的技术约束。

## 问题
${QUESTION}

## 分析维度
1. 技术可行性约束
2. 实现风险点
3. 依赖约束
4. 安全考量

## 输出格式
- Hard Constraints（必须遵守）
- Soft Constraints（建议遵守）
- Risk Points（风险点）
- Confidence Assessment（置信度评估）
" \
  --sandbox read-only
```

### 场景 2: 架构规划 (plan 阶段)

```bash
npx tsx scripts/invoke-codex.ts \
  --role architect \
  --prompt "
## 任务
设计后端架构方案。

## 需求
${REQUIREMENT}

## 输出内容
1. 需求理解与边界
2. 代码库上下文
3. 架构方案对比
4. 技术规格
5. 实现路径

## 输出格式
PLANS.md 格式
" \
  --sandbox read-only
```

### 场景 3: 代码原型 (dev 阶段)

```bash
npx tsx scripts/invoke-codex.ts \
  --role implementer \
  --prompt "
## 任务
基于分析生成代码原型。

## 上下文
${CONTEXT}

## 要求
1. 完整的代码变更
2. 遵循项目代码风格
3. 包含类型定义
4. 必要时添加注释

## 输出格式
仅输出 Unified Diff Patch
" \
  --sandbox read-only
```

### 场景 4: 安全审计 (dev 阶段)

```bash
npx tsx scripts/invoke-codex.ts \
  --role auditor \
  --prompt "
## 任务
审查代码变更的安全性和性能。

## 变更列表
${CHANGES}

## 审查维度
- OWASP Top 10
- 性能问题 (N+1, 内存泄漏, 缓存)
- 边界条件处理

## 输出格式
Issue 列表 + 修复建议 + 总分 (1-5)
" \
  --sandbox read-only
```

---

## 会话管理

```bash
# 第一次调用 - 获取 SESSION_ID
result=$(npx tsx scripts/invoke-codex.ts --role architect --prompt "..." --sandbox read-only)
SESSION_ID=$(echo "$result" | grep SESSION_ID | cut -d= -f2)

# 后续调用 - 继续会话
npx tsx scripts/invoke-codex.ts --role architect --prompt "..." --session "$SESSION_ID" --sandbox read-only
```

---

## 约束条件

| 必须执行                      | 禁止事项                    |
| ----------------------------- | --------------------------- |
| ✅ 使用 `--sandbox read-only` | ❌ 直接应用 patch 不审查    |
| ✅ 保存 SESSION_ID            | ❌ 跳过安全性验证           |
| ✅ patch 必须经 Claude 审查   | ❌ 使用 `--yolo` 或写入沙箱 |
| ✅ 后台执行用 Task tool       | ❌ 盲从 Codex 输出          |

---

## 输出格式

```json
{
  "success": true,
  "SESSION_ID": "uuid",
  "agent_messages": "analysis result or unified diff patch"
}
```
