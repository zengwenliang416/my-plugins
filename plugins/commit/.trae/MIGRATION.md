# commit → Trae Migration Guide

## 概览

| Claude Code | Trae                | 数量 |
| ----------- | ------------------- | ---- |
| Commands    | Orchestration Skill | 1    |
| Agents      | 自定义智能体 (UI)   | 4    |
| Skills      | Skills              | 7    |
| Hooks       | ❌ 不支持           | 0    |

---

## 1. Trae 智能体配置清单

在 Trae 设置 → 智能体中创建以下智能体：

| 智能体名称 | 英文标识            | 工具配置             | 状态 |
| ---------- | ------------------- | -------------------- | ---- |
| 变更调查员 | change-investigator | Read, Terminal       | ☐    |
| 提交执行器 | commit-worker       | Read, Edit, Terminal | ☐    |
| 语义分析器 | semantic-analyzer   | Read                 | ☐    |
| 符号分析器 | symbol-analyzer     | Read                 | ☐    |

详细配置说明见 `.trae/agents/README.md`

---

## 2. Trae Skills 目录结构

```
.trae/
├── MIGRATION.md           # 本文件
├── agents/
│   └── README.md          # 智能体 UI 配置指南
└── skills/
    ├── commit/            # 主编排 skill（原 commands/commit.md）
    │   └── SKILL.md
    ├── analysis-synthesizer/
    │   └── SKILL.md
    ├── branch-creator/
    │   └── SKILL.md
    ├── change-analyzer/
    │   └── SKILL.md
    ├── change-collector/
    │   └── SKILL.md
    ├── changelog-generator/
    │   └── SKILL.md
    ├── commit-executor/
    │   └── SKILL.md
    └── message-generator/
        └── SKILL.md
```

---

## 3. 关键转换规则

### 3.1 工具映射

| Claude Code 工具                      | Trae 工具 | 转换说明               |
| ------------------------------------- | --------- | ---------------------- |
| Read                                  | Read      | 直接映射               |
| Glob, Grep                            | Read      | 搜索功能合并到 Read    |
| Write, Edit                           | Edit      | 直接映射               |
| Bash                                  | Terminal  | 直接映射               |
| `mcp__auggie-mcp__codebase-retrieval` | ❌        | 降级为 Read + 手动分析 |
| LSP                                   | ❌        | 降级为 Read + 代码解析 |

### 3.2 调用语法转换

| Claude Code                 | Trae                            |
| --------------------------- | ------------------------------- |
| `Task(subagent_type="xxx")` | `调用 @xxx，参数：...`          |
| `Skill("xxx")`              | `调用 /xxx，参数：...`          |
| `AskUserQuestion({...})`    | 直接问句 + (a)/(b)/(c) 选项格式 |
| `run_in_background=true`    | `并行调用以下智能体：`          |

### 3.3 YAML Front Matter 转换

移除的字段：

- `allowed-tools` - Trae 不支持工具限制声明
- `arguments` - 改为在描述中说明参数
- `context: fork` - Trae 不支持上下文模式
- `model` - Trae 不支持模型指定
- `disable-model-invocation` - Trae 不支持

保留的字段：

- `name` - 技能名称
- `description` - 技能描述

---

## 4. 迁移检查清单

### Skills 转换 ✅

- [x] commands/commit.md → skills/commit/SKILL.md
- [x] skills/analysis-synthesizer/SKILL.md → 转换完成
- [x] skills/branch-creator/SKILL.md → 转换完成
- [x] skills/change-analyzer/SKILL.md → 转换完成
- [x] skills/change-collector/SKILL.md → 转换完成
- [x] skills/changelog-generator/SKILL.md → 转换完成
- [x] skills/commit-executor/SKILL.md → 转换完成
- [x] skills/message-generator/SKILL.md → 转换完成

### Agents 转换 ✅

- [x] agents/change-investigator.md → 配置文档已生成
- [x] agents/commit-worker.md → 配置文档已生成
- [x] agents/semantic-analyzer.md → 配置文档已生成
- [x] agents/symbol-analyzer.md → 配置文档已生成

### 手动步骤

- [ ] 在 Trae UI 中创建 4 个智能体
- [ ] 配置各智能体的工具权限
- [ ] 测试 `/commit` skill 调用
- [ ] 验证智能体间的协作流程

---

## 5. 限制说明

### 5.1 不支持的功能

| 功能         | Claude Code | Trae | 降级方案                 |
| ------------ | ----------- | ---- | ------------------------ |
| MCP 工具     | ✅          | ❌   | 使用 Read 替代           |
| LSP 符号分析 | ✅          | ❌   | 读取代码手动分析         |
| 后台任务     | ✅          | ⚠️   | 可能需要手动等待         |
| 预获取上下文 | ✅          | ❌   | 转换为显式 Terminal 命令 |
| Hooks        | ✅          | ❌   | 无替代方案               |

### 5.2 语义分析降级

原 Claude Code 使用 `mcp__auggie-mcp__codebase-retrieval` 进行语义代码检索。
在 Trae 中，需要：

1. 使用 Read 工具读取相关文件
2. 手动分析代码结构和依赖
3. 基于文件内容推断语义分组

### 5.3 符号分析降级

原 Claude Code 使用 LSP 工具获取文档符号。
在 Trae 中，需要：

1. 使用 Read 工具读取代码文件
2. 通过正则或代码解析识别类/函数/接口
3. 手动提取导出符号

---

## 6. 回滚策略

如需恢复使用 Claude Code 版本：

1. 原始文件保留在以下位置：
   - `agents/*.md` - 智能体定义
   - `commands/commit.md` - 主命令
   - `skills/*/SKILL.md` - 技能文件

2. `.trae/` 目录可以安全删除：

   ```bash
   rm -rf .trae/
   ```

3. 原始 Claude Code 配置无需修改即可继续使用

---

## 7. 测试流程

### 7.1 基础测试

1. 调用 `/commit` 验证主流程
2. 检查智能体是否正确响应
3. 验证文件输出路径正确

### 7.2 完整工作流测试

1. 准备一些 git 变更
2. 执行 `/commit`
3. 验证各阶段输出：
   - `changes-raw.json`
   - `semantic-analysis.json`
   - `symbol-analysis.json`
   - `changes-analysis.json`
   - `branch-info.json`
   - `commit-message.md`
   - `commit-result.json`

---

## 迁移完成时间

- 迁移日期: 2026-02-04
- 源版本: Claude Code v2.0
- 目标版本: Trae
