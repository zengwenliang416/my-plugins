# CCG Workflows

面向 [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) 的可插拔工作流插件集。包含 **15 个插件**、**19 条命令**、**51 个 Agent**、**57 个 Skill** 和 **6 个 Hook**，覆盖从深度思考、开发规划、代码实现到提交发布的完整开发生命周期。

## 亮点

- **4 层架构**: Commands → Agents → Skills → Hooks，职责分离、可组合
- **Agent Team 协作**: 8 个插件使用 Agent Team 模式（Fan-Out/Fan-In、Pipeline、Debate）
- **多模型协作**: Claude + Codex + Gemini 并行分析，Claude 保持最终代码主权
- **OpenSpec 集成**: TPD 插件通过 OpenSpec 规范实现跨阶段数据交接
- **CSV 状态机**: plan-execute 插件使用 CSV 作为合约驱动全量任务完成

## 快速开始

> 需已安装 Claude Code CLI（可用 `claude` 命令）。

### 安装

```bash
# 1. 添加本地插件市场
claude plugin marketplace add .

# 2. 安装需要的插件
claude plugin install commit@ccg-workflows
claude plugin install tpd@ccg-workflows
claude plugin install feature-impl@ccg-workflows
# ... 按需安装
```

### 一键同步（开发者）

```bash
# 同步并安装全部插件
./scripts/sync-plugins.sh --install

# 列出可用插件
./scripts/sync-plugins.sh --list

# 同步指定插件
./scripts/sync-plugins.sh tpd commit
```

## 插件总览

### 核心工作流插件

| 插件             | 命令                                                             | Agents | 模式           | 说明                                                  |
| ---------------- | ---------------------------------------------------------------- | ------ | -------------- | ----------------------------------------------------- |
| **commit**       | `/commit`                                                        | 4      | Parallel       | 规范提交：调查 → 并行分析 → 合成 → 分支 → 消息 → 提交 |
| **tpd**          | `/tpd:init` `/tpd:thinking` `/tpd:plan` `/tpd:dev`               | 10     | Multi-phase    | 深度思考 → 零决策规划 → 最小相位实现（OpenSpec 交接） |
| **plan-execute** | `/plan-execute:plan` `/plan-execute:csv` `/plan-execute:execute` | 3      | Pipeline + CSV | CSV 驱动的 plan → csv → execute 三阶段流水线          |

### Agent Team 插件

| 插件                  | 命令                 | Agents | 模式             | 说明                                                   |
| --------------------- | -------------------- | ------ | ---------------- | ------------------------------------------------------ |
| **feature-impl**      | `/feature-impl`      | 5      | Pipeline         | 功能实现：规划 → 分阶段实现 → 并行测试/审查 → 构建检查 |
| **code-review**       | `/code-review`       | 3      | Fan-Out/Fan-In   | 多视角并行代码审查（安全 + 性能 + 质量）+ 交叉验证     |
| **security-audit**    | `/security-audit`    | 3      | Fan-Out + Debate | 跨层安全审计（依赖 + 代码 + 配置）+ 辩论模式           |
| **tdd**               | `/tdd`               | 3      | Pipeline         | 测试驱动开发：写测试 → 实现 → 覆盖率验证               |
| **bug-investigation** | `/bug-investigation` | 3      | Fan-Out          | 多角度 Bug 调查（日志 + 代码追踪 + 复现）              |
| **database-design**   | `/database-design`   | 2      | Debate           | 数据库设计：schema-designer vs query-optimizer 辩论    |
| **refactor-team**     | `/refactor-team`     | 3      | Pipeline         | 团队重构：气味检测 → 安全重构 → 回归验证               |

### 辅助插件

| 插件               | 命令          | 说明                                                                     |
| ------------------ | ------------- | ------------------------------------------------------------------------ |
| **ui-design**      | `/ui-design`  | UI/UX 设计：需求分析 → 样式推荐 → 并行 3 变体 → UX 检查 → 双模型代码生成 |
| **brainstorm**     | `/brainstorm` | 头脑风暴：研究 → 多模型发散 → 创意评估 → 报告                            |
| **refactor**       | `/refactor`   | 代码重构：气味检测 → 建议 → 影响分析 → 安全执行                          |
| **context-memory** | `/memory`     | 上下文管理：上下文加载、会话压缩、代码地图、技能索引、文档管理           |
| **hooks**          | —             | 通用钩子：意图评估、安全防护、智能路由、日志备份、代码质量               |

## 命令示例

```bash
# 深度思考
/tpd:thinking "如何设计低成本的灰度发布方案"

# 开发规划 + 实现
/tpd:plan
/tpd:dev

# CSV 驱动的批量实现
/plan-execute:plan Add JWT auth to user API
/plan-execute:csv --run-id=20260208-120000
/plan-execute:execute --run-id=20260208-120000

# 功能实现（Agent Team）
/feature-impl Add email verification to user registration
/feature-impl --plan-only Design microservices migration

# TDD
/tdd Add search functionality with tests

# 代码审查 / 安全审计
/code-review
/security-audit

# Bug 调查
/bug-investigation Login fails intermittently on Safari

# 数据库设计
/database-design E-commerce order management schema

# 规范提交
/commit
/commit --type feat --scope auth

# UI 设计
/ui-design "B2B 产品后台仪表盘" --tech-stack=react

# 头脑风暴
/brainstorm "提升新手引导转化率"

# 上下文管理
/memory docs
/memory code-map auth-flow
```

## 架构

```
┌─────────────────────────────────────────────────────────┐
│                    Claude Code CLI                       │
├─────────────────────────────────────────────────────────┤
│  Layer 1: Commands    (commands/*.md)     ← 入口        │
│  Layer 2: Agents      (agents/**/*.md)    ← 专业执行    │
│  Layer 3: Skills      (skills/**/SKILL.md)← 原子操作    │
│  Layer 4: Hooks       (hooks/hooks.json)  ← 横切关注    │
├─────────────────────────────────────────────────────────┤
│  Multi-Model:  Claude ←→ Codex (backend)                │
│                Claude ←→ Gemini (frontend/UX)           │
│                Sandbox: read-only → unified diff patch   │
├─────────────────────────────────────────────────────────┤
│  State:        .claude/{plugin}/runs/{RUN_ID}/          │
│  Cross-phase:  openspec/changes/{proposal_id}/          │
└─────────────────────────────────────────────────────────┘
```

### Agent Team 模式

| 模式               | 说明                               | 使用插件                                       |
| ------------------ | ---------------------------------- | ---------------------------------------------- |
| **Fan-Out/Fan-In** | 并行派发 → 汇总合成                | code-review, security-audit, bug-investigation |
| **Pipeline**       | 顺序执行 + 依赖链                  | feature-impl, tdd, refactor-team, plan-execute |
| **Debate**         | 多角色辩论 → 共识                  | database-design, security-audit                |
| **Fix Loop**       | 审查 → 修复 → 重检（max 2 rounds） | feature-impl, plan-execute                     |

### Hook 系统

| Hook               | 生命周期         | 作用                   |
| ------------------ | ---------------- | ---------------------- |
| privacy-firewall   | UserPromptSubmit | 敏感信息检测，阻止泄露 |
| unified-eval       | UserPromptSubmit | 智能插件路由           |
| read-limit         | PreToolUse       | 大文件自动注入 limit   |
| db-guard           | PreToolUse       | 危险 SQL 拦截          |
| git-conflict-guard | PreToolUse       | Git 冲突标记检测       |
| killshell-guard    | PreToolUse       | 保护关键进程           |

## 目录结构

```
.
├── .claude-plugin/
│   └── marketplace.json              # 本地插件市场定义（15 个插件）
├── plugins/
│   ├── commit/                       # 规范提交（4 agents, 7 skills）
│   ├── tpd/                          # TPD 工作流（10 agents, 14 skills）
│   ├── plan-execute/                 # CSV 驱动执行（3 agents）
│   ├── feature-impl/                 # 功能实现（5 agents）
│   ├── code-review/                  # 代码审查（3 agents）
│   ├── security-audit/               # 安全审计（3 agents）
│   ├── tdd/                          # 测试驱动（3 agents）
│   ├── bug-investigation/            # Bug 调查（3 agents）
│   ├── database-design/              # 数据库设计（2 agents）
│   ├── refactor-team/                # 团队重构（3 agents）
│   ├── ui-design/                    # UI 设计（12 agents, 1 skill）
│   ├── brainstorm/                   # 头脑风暴（8 skills）
│   ├── context-memory/               # 上下文管理（20 skills）
│   ├── refactor/                     # 代码重构（7 skills）
│   └── hooks/                        # 通用钩子（6 hooks）
├── openspec/                         # OpenSpec 规范与变更提案
├── scripts/
│   ├── sync-plugins.sh               # 插件同步/安装工具
│   └── validate-skills.sh            # 技能规范校验
└── llmdoc/                           # LLM 优化文档
```

## 插件开发

每个插件遵循统一的 4 层结构：

```
plugins/{name}/
├── .claude-plugin/
│   └── plugin.json                   # 元数据（name, version, description）
├── CLAUDE.md                         # 插件说明 + available-skills 表
├── commands/
│   └── {cmd}.md                      # 命令定义（YAML frontmatter + 指令）
├── agents/
│   └── {category}/{agent}.md         # Agent 定义（tools, model, color）
├── skills/
│   └── {skill}/SKILL.md              # 技能定义（原子操作）
└── hooks/
    └── hooks.json                    # 钩子声明
```

**开发验证：**

```bash
# 校验所有技能规范
./scripts/validate-skills.sh

# 检查插件结构
./scripts/sync-plugins.sh --list
```

## 许可证

MIT
