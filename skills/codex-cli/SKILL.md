---
name: codex-cli
description: |
  【触发条件】当需要后端逻辑分析、跨文件修改、调试错误、安全/性能审查，或需要第二意见时使用。
  【触发关键词】复杂逻辑、后端、调试、代码审查、Codex、第二意见
  【核心能力】只读沙箱分析代码 → 输出 unified diff patch → Claude 审查重构后应用
  【不触发】前端 UI/CSS（改用 gemini-cli）、简单单文件修复、不需要读取代码库的问题
  【注意】Codex 无写入权限，所有输出仅为参考原型
allowed-tools:
  - Bash
  - Read
  - Task
---

# Codex CLI - 多模型协作后端专家

Backend coding assistant via `codeagent-wrapper`. **Read-only sandbox** → unified diff patches → Claude review & apply.

## 执行命令

```bash
# 标准调用
~/.claude/bin/codeagent-wrapper codex \
  --workdir /path/to/project \
  --role analyzer \
  --prompt "Your task" \
  --sandbox read-only

# 后台并行执行
~/.claude/bin/codeagent-wrapper codex --prompt "$PROMPT" --sandbox read-only &
```

## 强制 4 步协作流程

### Step 1: 需求分析协同

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role analyzer \
  --prompt "用户需求：[需求]\n我的初步分析：[思路]\n请完善需求分析，识别风险，提供实施计划。" \
  --sandbox read-only
```

- 对比 Codex 分析与你的思路
- 识别差异和盲区

### Step 2: 代码原型索取（强制只读）

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role architect \
  --prompt "任务：[编码任务]\n要求：仅分析设计，输出 unified diff patch，说明设计理由。" \
  --sandbox read-only \
  --session "$SESSION_ID"
```

- ⚠️ **严禁直接使用原型**
- 原型仅供逻辑参考，必须重写

### Step 3: 批判性重写（Claude 执行）

1. 理解原型核心逻辑和设计意图
2. 识别改进点（命名/结构/错误处理）
3. 按项目规范重写代码
4. 确保符合 SOLID/DRY/KISS

### Step 4: 代码审查确认

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role reviewer \
  --prompt "我已完成修改：[摘要]\n原始需求：[需求]\n请审查：质量/完成度/潜在bug/改进建议" \
  --sandbox read-only \
  --session "$SESSION_ID"
```

## 角色提示词

| 角色      | 用途             | 命令示例           |
| --------- | ---------------- | ------------------ |
| analyzer  | 代码/需求分析    | `--role analyzer`  |
| architect | API/后端架构设计 | `--role architect` |
| debugger  | 问题调试         | `--role debugger`  |
| reviewer  | 代码审查         | `--role reviewer`  |
| optimizer | 性能优化         | `--role optimizer` |
| tester    | 测试生成         | `--role tester`    |

## 会话管理

```bash
# 第一次调用 - 获取 SESSION_ID
result=$(~/.claude/bin/codeagent-wrapper codex --prompt "..." --sandbox read-only)
SESSION_ID=$(echo "$result" | grep SESSION_ID | cut -d= -f2)

# 后续调用 - 继续会话
~/.claude/bin/codeagent-wrapper codex --prompt "..." --session "$SESSION_ID"
```

## 并行执行（后台模式）

```bash
# 使用 Task tool 的 run_in_background=true
# 禁止擅自终止后台任务
```

## 强制约束

| 必须执行                      | 禁止事项                    |
| ----------------------------- | --------------------------- |
| ✅ 使用 `--sandbox read-only` | ❌ 直接使用原型不重写       |
| ✅ 保存 SESSION_ID            | ❌ 跳过审查步骤             |
| ✅ 原型必须经 Claude 重构     | ❌ 使用 `--yolo` 或写入沙箱 |
| ✅ 后台执行用 Task tool       | ❌ 擅自终止后台任务         |
| ✅ 质疑 Codex 的建议          | ❌ 盲从 Codex 输出          |

## 输出格式

```json
{
  "success": true,
  "SESSION_ID": "uuid",
  "agent_messages": "analysis or unified diff patch"
}
```

---

SESSION_ID=xxx
