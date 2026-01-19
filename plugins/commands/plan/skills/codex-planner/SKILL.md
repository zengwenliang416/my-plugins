---
name: codex-planner
description: |
  【触发条件】plan 工作流中需要后端架构规划、API 设计、数据模型、安全策略分析时使用
  【核心产出】输出架构规划文档（PLANS.md 格式），包含技术方案、风险分析、实施路径
  【强制模式】只读沙箱 + 规划模式，禁止生成实际代码
  【不触发】前端 UI/组件规划（用 gemini-planner）、简单任务
allowed-tools:
  - Bash
  - Read
  - Task
arguments:
  - name: run_dir
    type: string
    required: true
    description: 规划运行目录路径
  - name: focus
    type: string
    required: false
    description: 规划焦点（architecture|api|data|security|performance）
---

# Codex Planner - 多模型协作后端规划专家

Backend architecture planning via `codeagent-wrapper` in **plan mode**. Read-only analysis → PLANS.md format → Claude synthesis.

## 核心理念

基于 [OpenAI Codex PLANS.md](https://cookbook.openai.com/articles/codex_exec_plans) 方法论：

- **Living Documents**: 计划是"活文档"，可验证、可迭代
- **Deep Exploration**: 深度探索代码库、依赖关系、外部资源
- **Long-horizon Thinking**: 支持复杂任务的长期规划（7+ 小时）

## 执行命令

```bash
# 规划模式调用（强制只读）
~/.claude/bin/codeagent-wrapper codex \
  --workdir "$PROJECT_DIR" \
  --role planner \
  --prompt "$PLANNING_PROMPT" \
  --sandbox read-only \
  --mode plan
```

## 🚨🚨🚨 强制规划流程 🚨🚨🚨

### Step 1: 需求理解与范围界定

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role planner \
  --prompt "
需求：$REQUIREMENT

请作为高级架构师分析：
1. 核心功能边界
2. 技术约束和依赖
3. 潜在风险点
4. 需要澄清的问题

输出格式：PLANS.md 第一章节
" \
  --sandbox read-only
```

### Step 2: 代码库探索

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role analyzer \
  --prompt "
基于需求，探索代码库：
1. 相关模块和文件
2. 现有架构模式
3. 数据流向
4. 集成点

使用工具：grep, find, ast-grep
输出：代码库上下文摘要
" \
  --sandbox read-only \
  --session "$SESSION_ID"
```

### Step 3: 架构方案设计

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role architect \
  --prompt "
基于探索结果，设计架构方案：

## 方案 A: [名称]
- 优点：
- 缺点：
- 风险：
- 工作量：

## 方案 B: [名称]
- 优点：
- 缺点：
- 风险：
- 工作量：

## 推荐方案
- 选择：
- 理由：
" \
  --sandbox read-only \
  --session "$SESSION_ID"
```

### Step 4: 详细技术规格

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role architect \
  --prompt "
为推荐方案生成详细技术规格：

### API 设计
- 端点定义
- 请求/响应格式
- 错误处理

### 数据模型
- 实体关系
- 迁移策略

### 安全策略
- 认证/授权
- 输入验证
- 敏感数据处理

### 性能考量
- 缓存策略
- 数据库优化
- 并发处理
" \
  --sandbox read-only \
  --session "$SESSION_ID"
```

### Step 5: 实施路径规划

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role planner \
  --prompt "
生成分阶段实施计划：

### 阶段 1: 基础设施
- 任务列表
- 依赖关系
- 验收标准

### 阶段 2: 核心功能
- 任务列表
- 依赖关系
- 验收标准

### 阶段 3: 集成测试
- 任务列表
- 依赖关系
- 验收标准

### 关键路径
- 阻塞项识别
- 并行机会
" \
  --sandbox read-only \
  --session "$SESSION_ID"
```

## 角色提示词

| 角色      | 用途               | 命令示例           |
| --------- | ------------------ | ------------------ |
| planner   | 需求分析、路径规划 | `--role planner`   |
| analyzer  | 代码库探索         | `--role analyzer`  |
| architect | 架构设计           | `--role architect` |
| security  | 安全分析           | `--role security`  |
| reviewer  | 方案审查           | `--role reviewer`  |

## PLANS.md 输出格式

```markdown
# [功能名称] 技术规划

## 元信息

- 规划 ID: ${run_id}
- 创建时间: ${timestamp}
- 规划者: Codex + Claude

## 1. 需求理解

### 1.1 功能边界

### 1.2 技术约束

### 1.3 待澄清问题

## 2. 代码库上下文

### 2.1 相关模块

### 2.2 现有模式

### 2.3 依赖分析

## 3. 架构方案

### 3.1 方案对比

### 3.2 推荐方案

### 3.3 决策理由

## 4. 技术规格

### 4.1 API 设计

### 4.2 数据模型

### 4.3 安全策略

### 4.4 性能考量

## 5. 实施路径

### 5.1 阶段划分

### 5.2 任务分解

### 5.3 关键路径

## 6. 风险与缓解

### 6.1 技术风险

### 6.2 缓解策略

## 7. 验收标准

### 7.1 功能验收

### 7.2 质量验收
```

## 会话管理

```bash
# 保存 SESSION_ID 用于多步规划
result=$(~/.claude/bin/codeagent-wrapper codex --role planner --prompt "..." --sandbox read-only)
SESSION_ID=$(echo "$result" | grep SESSION_ID | cut -d= -f2)

# 后续步骤继续会话
~/.claude/bin/codeagent-wrapper codex --prompt "..." --session "$SESSION_ID"
```

## 强制约束

| 必须执行                      | 禁止事项                  |
| ----------------------------- | ------------------------- |
| ✅ 使用 `--sandbox read-only` | ❌ 生成可执行代码         |
| ✅ 使用 `--mode plan`         | ❌ 跳过代码库探索         |
| ✅ 输出 PLANS.md 格式         | ❌ 直接给出实施方案不分析 |
| ✅ 多方案对比                 | ❌ 盲从单一方案           |
| ✅ 保存 SESSION_ID            | ❌ 丢失规划上下文         |

## 输出文件

执行完成后，将结果写入：

- `${run_dir}/codex-plan.md` - Codex 规划输出
- 内容将被 architecture-analyzer 整合到 `architecture.md`

## 与其他 Skills 的协作

```
plan-context-retriever → codex-planner (后端) ─┐
                                              ├→ architecture-analyzer → task-decomposer
                       → gemini-planner (前端) ─┘
```

---

SESSION_ID=xxx
