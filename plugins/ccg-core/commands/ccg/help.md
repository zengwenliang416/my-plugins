---
argument-hint: [command-name]
allowed-tools: Read, Glob
description: 帮助 - 显示所有 CCG 命令
---

# /ccg:help - 帮助

## 上下文预获取

- 可用命令: !`ls ~/.claude/commands/ccg/*.md 2>/dev/null | xargs -I{} basename {} .md | tr '\n' ' '`
- 版本: !`~/.claude/bin/codeagent-wrapper --version 2>&1 | head -1 || echo "Unknown"`

## 参数解析

- **命令名称**: $1（可选，指定时显示该命令的详细帮助）

---

显示 CCG 多模型协作命令体系的帮助信息。

## 命令列表

### 开发命令

| 命令            | 说明                          | 路由     |
| --------------- | ----------------------------- | -------- |
| `/ccg:dev`      | 完整开发流程（6阶段）         | 智能路由 |
| `/ccg:code`     | 代码生成                      | 智能路由 |
| `/ccg:backend`  | 后端开发                      | Codex    |
| `/ccg:frontend` | 前端开发                      | Gemini   |
| `/ccg:scaffold` | 脚手架生成（20+ GitHub 模板） | 智能路由 |

### 规划命令

| 命令         | 说明                                           | 路由   |
| ------------ | ---------------------------------------------- | ------ |
| `/ccg:plan`  | 多模型协作规划（Plan-and-Execute + Loop 集成） | 双模型 |
| `/ccg:think` | 深度分析（UltraThink）                         | 双模型 |

### 分析命令

| 命令           | 说明     | 路由   |
| -------------- | -------- | ------ |
| `/ccg:analyze` | 代码分析 | 双模型 |
| `/ccg:review`  | 代码审查 | 双模型 |

### 问题解决

| 命令          | 说明     | 路由  |
| ------------- | -------- | ----- |
| `/ccg:bugfix` | Bug 修复 | Codex |
| `/ccg:debug`  | 深度调试 | Codex |

### 代码质量

| 命令            | 说明     | 路由     |
| --------------- | -------- | -------- |
| `/ccg:test`     | 测试生成 | 智能路由 |
| `/ccg:refactor` | 代码重构 | Codex    |
| `/ccg:optimize` | 性能优化 | 双模型   |
| `/ccg:enhance`  | 功能增强 | Codex    |

### Git 操作

| 命令                  | 说明     |
| --------------------- | -------- |
| `/ccg:commit`         | 智能提交 |
| `/ccg:pr`             | 创建 PR  |
| `/ccg:clean-branches` | 分支清理 |

### 内容创作

| 命令          | 说明                 |
| ------------- | -------------------- |
| `/ccg:wechat` | 公众号推文完整工作流 |

### 工具命令

| 命令        | 说明       |
| ----------- | ---------- |
| `/ccg:init` | 项目初始化 |
| `/ccg:help` | 显示帮助   |

## 工作流说明

### 6 阶段工作流

```
Phase 0: 提示词增强
    ↓
Phase 1: 上下文检索 (Auggie/LSP)
    ↓
Phase 2: 多模型分析 ⏸️ Hard Stop
    ↓
Phase 3: 原型生成 (Codex/Gemini)
    ↓
Phase 4: Claude 重构实施
    ↓
Phase 5: 双模型审查 ⏸️ Hard Stop
    ↓
Phase 6: 修正与交付
```

### 智能路由规则

| 任务类型        | 路由           |
| --------------- | -------------- |
| 后端/API/数据库 | Codex          |
| 前端/UI/CSS     | Gemini         |
| 分析/审查/优化  | 双模型并行     |
| 混合任务        | 拆分后分别路由 |

### 核心原则

1. **代码主权**: Claude 是最终交付者，外部模型输出仅为参考
2. **只读沙箱**: Codex 始终在只读模式运行
3. **Hard Stop**: 关键节点需用户确认
4. **最小改动**: 改动严格限于需求范围

## 快速开始

```bash
# 初始化项目
/ccg:init

# 规划复杂功能（先规划后执行）
/ccg:plan 实现完整的用户认证系统

# 规划并自动执行（结合 Ralph Loop）
/ccg:plan 实现购物车功能 --loop --max-iterations 30

# 开发新功能
/ccg:dev 实现用户登录功能

# 修复 Bug
/ccg:bugfix 用户无法注册的问题

# 提交代码
/ccg:commit
```
