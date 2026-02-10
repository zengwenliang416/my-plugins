# TPD → Trae Migration Guide

## 概览

| Claude Code | Trae                | 数量 |
| ----------- | ------------------- | ---- |
| Commands    | Orchestration Skill | 4    |
| Agents      | 自定义智能体 (UI)   | 4    |
| Skills      | Skills              | 14   |
| Hooks       | ❌ 不支持           | 0    |

---

## 1. Trae 智能体配置清单

在 Trae 设置 → 智能体中创建以下智能体：

| 智能体名称 | 英文标识 | 分类 | 工具配置 | 状态 |
| ---------- | -------- | ---- | -------- | ---- |
| 边界探索器 | boundary-explorer | Investigation | Read, Edit | ☐ |
| 上下文分析器 | context-analyzer | Investigation | Read, Edit | ☐ |
| Codex 核心 | codex | Reasoning/Planning/Execution/Audit | Read, Terminal | ☐ |
| Gemini 核心 | gemini | Reasoning/Planning/Execution/Audit | Read, Terminal | ☐ |

详细配置说明见 `.trae/agents/README.md`

---

## 2. Trae Skills 目录结构

```
.trae/
├── MIGRATION.md              # 本文件
├── agents/
│   └── README.md             # 智能体 UI 配置指南
├── rules/
│   └── workflow-rules.md     # 工作流规则
└── skills/
    ├── init/                 # 初始化（原 commands/init.md）
    │   └── SKILL.md
    ├── thinking/             # 深度思考编排（原 commands/thinking.md）
    │   └── SKILL.md
    ├── plan/                 # 规划编排（原 commands/plan.md）
    │   └── SKILL.md
    ├── dev/                  # 开发编排（原 commands/dev.md）
    │   └── SKILL.md
    ├── codex-cli/            # Codex 后端专家
    │   └── SKILL.md
    ├── gemini-cli/           # Gemini 前端专家
    │   └── SKILL.md
    ├── complexity-analyzer/  # 复杂度评估
    │   └── SKILL.md
    ├── thought-synthesizer/  # 思考综合
    │   └── SKILL.md
    ├── conclusion-generator/ # 结论生成
    │   └── SKILL.md
    ├── handoff-generator/    # 交接产物生成
    │   └── SKILL.md
    ├── context-retriever/    # 上下文检索（dev 阶段）
    │   └── SKILL.md
    ├── plan-context-retriever/ # 上下文检索（plan 阶段）
    │   └── SKILL.md
    ├── requirement-parser/   # 需求解析
    │   └── SKILL.md
    ├── architecture-analyzer/ # 架构分析整合
    │   └── SKILL.md
    ├── task-decomposer/      # 任务分解
    │   └── SKILL.md
    ├── risk-assessor/        # 风险评估
    │   └── SKILL.md
    ├── plan-synthesizer/     # 计划综合
    │   └── SKILL.md
    └── code-implementer/     # 代码实现（重构原型）
        └── SKILL.md
```

---

## 3. 关键转换规则

### 3.1 工具映射

| Claude Code 工具                      | Trae 工具 | 转换说明                        |
| ------------------------------------- | --------- | ------------------------------- |
| Read                                  | Read      | 直接映射                        |
| Glob, Grep                            | SearchCodebase + Read | 推荐先 SearchCodebase 后 Read |
| Write, Edit                           | Edit      | 直接映射                        |
| Bash                                  | Terminal  | 直接映射                        |
| 语义检索能力                          | SearchCodebase | Trae 原生能力              |
| Codex 调用                            | codeagent-wrapper codex | 通过 Terminal 执行       |
| Gemini 调用                           | codeagent-wrapper gemini | 通过 Terminal 执行      |
| LSP                                   | ❌        | 降级为 Read + 代码解析          |

### 3.2 调用语法转换

| Claude Code                                  | Trae                            |
| -------------------------------------------- | ------------------------------- |
| `Task(subagent_type="tpd:xxx:yyy", ...)`     | `调用 @yyy，参数：...`          |
| `Skill(skill="tpd:xxx", args="...")`         | `调用 /xxx，参数：...`          |
| `AskUserQuestion({question, options})`       | 直接问句 + (a)/(b)/(c) 选项格式 |
| `run_in_background=true`                     | `并行调用以下智能体：`          |
| `语义检索调用({...})` | `使用 SearchCodebase："..."`       |
| `Codex 直连调用: "..."` | `使用 Codex 分析："..."`        |
| `Gemini 直连调用: "..."` | `使用 Gemini 分析："..."`       |

### 3.3 YAML Front Matter 转换

移除的字段：

- `allowed-tools` - Trae 不支持工具限制声明
- `arguments` - 改为在描述中说明参数
- `argument-hint` - 移除
- `context: fork` - Trae 不支持上下文模式
- `model` - Trae 不支持模型指定
- `memory` - Trae 不支持
- `color` - Trae 不支持

保留的字段：

- `name` - 技能名称
- `description` - 技能描述

---

## 4. 迁移检查清单

### Commands → Skills 转换 ✅

- [x] commands/init.md → skills/init/SKILL.md
- [x] commands/thinking.md → skills/thinking/SKILL.md
- [x] commands/plan.md → skills/plan/SKILL.md
- [x] commands/dev.md → skills/dev/SKILL.md

### Skills 转换 ✅

- [x] skills/codex-cli/SKILL.md → 转换完成
- [x] skills/gemini-cli/SKILL.md → 转换完成
- [x] skills/complexity-analyzer/SKILL.md → 转换完成
- [x] skills/thought-synthesizer/SKILL.md → 转换完成
- [x] skills/conclusion-generator/SKILL.md → 转换完成
- [x] skills/handoff-generator/SKILL.md → 转换完成
- [x] skills/context-retriever/SKILL.md → 转换完成
- [x] skills/plan-context-retriever/SKILL.md → 转换完成
- [x] skills/requirement-parser/SKILL.md → 转换完成
- [x] skills/architecture-analyzer/SKILL.md → 转换完成
- [x] skills/task-decomposer/SKILL.md → 转换完成
- [x] skills/risk-assessor/SKILL.md → 转换完成
- [x] skills/plan-synthesizer/SKILL.md → 转换完成
- [x] skills/code-implementer/SKILL.md → 转换完成

### Agents 转换 ✅

- [x] agents/investigation/boundary-explorer.md → 配置文档已生成
- [x] agents/investigation/context-analyzer.md → 配置文档已生成
- [x] agents/README.md（codex 段落）→ 合并为单核心智能体（通过 role 调用）
- [x] agents/README.md（gemini 段落）→ 合并为单核心智能体（通过 role 调用）

### Rules 转换 ✅

- [x] CLAUDE.md → rules/workflow-rules.md

### 手动步骤

- [ ] 在 Trae UI 中创建 4 个智能体
- [ ] 配置各智能体的工具权限
- [ ] 测试 `/thinking` skill 调用
- [ ] 测试 `/plan` skill 调用
- [ ] 测试 `/dev` skill 调用
- [ ] 验证智能体间的协作流程

---

## 5. 限制说明

### 5.1 不支持的功能

| 功能 | Claude Code | Trae | 处理方式 |
| --- | --- | --- | --- |
| Trae 原生 SearchCodebase | ❌ | ✅ | 直接使用 SearchCodebase + Read |
| Codex/Gemini 直连 | ✅ | ❌ | 通过 codeagent-wrapper Terminal |
| LSP 符号分析 | ✅ | ❌ | 读取代码手动分析 |
| 后台任务 | ✅ | ⚠️ | 可能需要手动等待 |
| 预获取上下文 | ✅ | ❌ | 转换为显式 Terminal 命令 |
| Hooks | ✅ | ❌ | 无替代方案 |
| Agent Teams | ✅ | ❌ | 使用标准顺序执行 |

### 5.2 检索执行规范

在 Trae 中，语义代码检索统一使用原生 `SearchCodebase`。
在 Trae 中，需要：

1. 先用 SearchCodebase 定位候选实现
2. 使用 Read 对命中文件做证据化精读
3. 基于文件内容整理语义分组和依赖关系

### 5.3 多模型调用方式

在 Trae 中：

1. 通过 `codeagent-wrapper` CLI 工具调用
2. 使用 Terminal 执行命令
3. 保持 SESSION_ID 进行多轮对话

---

## 6. 回滚策略

如需恢复使用 Claude Code 版本：

1. 原始文件保留在以下位置：
   - `agents/` - 智能体定义
   - `commands/` - 主命令
   - `skills/` - 技能文件
   - `CLAUDE.md` - 项目规则

2. `.trae/` 目录可以安全删除：

   ```bash
   rm -rf .trae/
   ```

3. 原始 Claude Code 配置无需修改即可继续使用

---

## 7. 测试流程

### 7.1 Thinking 阶段测试

1. 调用 `/thinking` 验证深度思考流程
2. 检查 @boundary-explorer 是否正确响应
3. 检查 @codex(role=constraint) / @gemini(role=constraint) 是否正确响应
4. 验证产物：complexity-analysis.md, explore-\*.json, synthesis.md, conclusion.md, handoff.json

### 7.2 Plan 阶段测试

1. 调用 `/plan` 验证规划流程
2. 检查 @context-analyzer / @codex(role=architect) / @gemini(role=architect) 响应
3. 验证 thinking 阶段产物被正确加载
4. 验证产物：requirements.md, context.md, codex-plan.md, gemini-plan.md, architecture.md, tasks.md, plan.md

### 7.3 Dev 阶段测试

1. 调用 `/dev` 验证开发流程
2. 检查 @codex(role=implementer/auditor) / @gemini(role=implementer/auditor) 响应
3. 验证 plan 阶段产物被正确加载
4. 验证产物：tasks-scope.md, analysis-codex.md, prototype-_.diff, changes.md, audit-_.md

---

## 迁移完成时间

- 迁移日期: 2026-02-08
- 源版本: Claude Code TPD v2.0.0
- 目标版本: Trae
