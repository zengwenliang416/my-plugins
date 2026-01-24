# CCG Workflows

面向 Claude Code 的工作流插件集。本仓库同时包含本地插件市场配置与各插件源码，适合按需安装、组合使用。

## 在 Claude Code 中安装

> 需要已安装 Claude Code CLI（可用 `claude` 命令），在仓库根目录执行。

### 1) 添加本地插件市场

```bash
claude plugin marketplace add .
```

### 2) 安装需要的插件

```bash
claude plugin install commit@ccg-workflows
claude plugin install dev@ccg-workflows
claude plugin install plan@ccg-workflows
```

## 开发者同步（可选）

用于本地开发/调试时同步到 Claude Code 的本地缓存，普通使用不需要。

### 列出可用插件

```bash
./scripts/sync-plugins.sh --list
```

### 同步插件到本地缓存

```bash
# 同步全部插件
./scripts/sync-plugins.sh

# 仅同步某个插件
./scripts/sync-plugins.sh dev
```

### 同步并安装

```bash
# 同步并安装全部插件
./scripts/sync-plugins.sh --install

# 安装单个插件
./scripts/sync-plugins.sh dev --install
```

## 插件列表

来源：`.claude-plugin/marketplace.json`

| 插件 | 说明 | 命令入口 |
|------|------|----------|
| commit | 规范提交工作流：收集 → 分析 → 生成消息 → 更新 Changelog → 执行 | `/commit` |
| dev | 开发工作流：上下文 → 分析 → 原型 → 实施 → 审计 | `/dev` |
| plan | 开发规划工作流：需求解析 → 上下文检索 → 架构分析 → 任务分解 → 风险评估 → 计划生成 | `/plan` |
| ui-design | UI/UX 设计工作流：需求分析 → 样式推荐 → 设计生成 → UX 检查 → 代码生成 → 质量验证 | `/ui-design` |
| brainstorm | 头脑风暴工作流：研究 → 发散 → 评估 → 报告 | `/brainstorm` |
| thinking | 深度思考工作流：复杂度评估 → 多模型并行 → 思考整合 → 结论生成 | `/thinking` |
| context-memory | 智能上下文管理：上下文加载、会话压缩、代码地图、技能索引、文档管理 | `/memory` |
| refactor | 代码重构工作流：气味检测 → 建议 → 影响分析 → 安全执行 | `/refactor` |
| hooks | 通用钩子集合：意图评估、日志备份、质量检查、智能路由、安全防护、会话管理 | — |

## 命令示例

```bash
/plan "实现用户认证"
/dev "实现用户认证" --task-type=fullstack
/commit --scope auth
/refactor src/ --mode=analyze
/ui-design "B2B 产品后台仪表盘" --tech-stack=react
/brainstorm "提升新手引导转化率"
/thinking "如何设计低成本的灰度发布方案" --depth=deep
/memory docs
```

## 目录结构

```
.
├── .claude-plugin/
│   └── marketplace.json          # 本地插件市场定义
├── plugins/
│   ├── commit/
│   │   ├── .claude-plugin/
│   │   ├── commands/
│   │   └── skills/
│   ├── dev/
│   │   ├── .claude-plugin/
│   │   ├── commands/
│   │   └── skills/
│   ├── plan/
│   │   ├── .claude-plugin/
│   │   ├── commands/
│   │   └── skills/
│   ├── ui-design/
│   │   ├── .claude-plugin/
│   │   ├── commands/
│   │   ├── hooks/
│   │   └── skills/
│   ├── brainstorm/
│   │   ├── .claude-plugin/
│   │   ├── commands/
│   │   └── skills/
│   ├── thinking/
│   │   ├── .claude-plugin/
│   │   ├── commands/
│   │   └── skills/
│   ├── context-memory/
│   │   ├── .claude-plugin/
│   │   ├── commands/
│   │   └── skills/
│   ├── refactor/
│   │   ├── .claude-plugin/
│   │   ├── commands/
│   │   ├── references/
│   │   └── skills/
│   └── hooks/
│       ├── .claude-plugin/
│       ├── hooks/
│       └── scripts/
├── scripts/
│   ├── sync-plugins.sh            # 同步/安装插件
│   └── validate-skills.sh         # 校验技能规范
└── Claude-Code-Workflow-main/      # 附带目录（详见其内 README）
```

## 开发与验证

```bash
# 校验所有技能的 frontmatter/结构规范
./scripts/validate-skills.sh
```

## 许可证

MIT
