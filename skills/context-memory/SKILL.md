---
name: context-memory
description: |
  项目记忆管理与上下文编排技能。用于用户提出 /memory 命令，或需要加载项目上下文、压缩会话、生成代码地图、更新 CLAUDE.md、进行文档规划/生成/更新、生成 Swagger、生成技术规则、技能索引/加载、工作流或样式记忆等任务时触发。负责子命令解析、参数路由与交互式引导，并按需加载 references/context-memory 下的原始流程文档。
---

# Context Memory - 项目记忆管理

## 概述

以“/memory 子命令”为入口，统一编排项目上下文加载、会话压缩、代码地图、CLAUDE.md 更新、文档管理、API/规则生成与技能记忆等流程。该技能本身不实现底层功能，负责路由与流程引导，具体执行细节以 references 中的原始 Skill 文档为准。

## 触发与入口

当用户出现以下任一意图时触发：

- 明确输入 `/memory ...` 命令
- 提出“加载上下文/压缩会话/生成代码地图/更新 CLAUDE.md/文档规划或生成/Swagger/技术规则/技能索引或加载/工作流记忆/样式记忆”

## 总体流程

1. 解析子命令与参数。
2. 若未提供子命令，先进行交互式选择（见 references/context-memory/commands/memory.md）。
3. 校验必要参数；缺失时追问。
4. 路由到对应的子技能流程（见下方映射）。
5. 按子技能文档执行，并返回结果与下一步建议。

## 子命令 → 子技能映射

优先参考 `references/context-memory/commands/memory.md` 的路由逻辑；执行细节按对应技能文档。

- `load <task>` → `references/context-memory/skills/context-loader/SKILL.md`
- `compact` → `references/context-memory/skills/session-compactor/SKILL.md`
- `code-map <feature>` → `references/context-memory/skills/code-map-generator/SKILL.md`
- `skill-index [path]` → `references/context-memory/skills/skill-indexer/SKILL.md`
- `skill-load [name]` → `references/context-memory/skills/skill-loader/SKILL.md`
- `workflow <id|all>` → `references/context-memory/skills/workflow-memory/SKILL.md`
- `style <package>` → `references/context-memory/skills/style-memory/SKILL.md`
- `claude-full [path]` → 先 `module-discovery`，再逐层执行 `claude-updater`
  - `references/context-memory/skills/module-discovery/SKILL.md`
  - `references/context-memory/skills/claude-updater/SKILL.md`
- `claude-related` → 先 `change-detector`，再执行 `claude-updater`
  - `references/context-memory/skills/change-detector/SKILL.md`
  - `references/context-memory/skills/claude-updater/SKILL.md`
- `docs [path]` → `references/context-memory/skills/doc-planner/SKILL.md`
- `docs-full [path]` → `references/context-memory/skills/doc-full-generator/SKILL.md`
- `docs-related [path]` → `references/context-memory/skills/doc-related-generator/SKILL.md`
- `docs-update-full [path]` → `references/context-memory/skills/doc-full-updater/SKILL.md`
- `docs-update-related` → `references/context-memory/skills/doc-incremental-updater/SKILL.md`
- `swagger [path]` → `references/context-memory/skills/swagger-generator/SKILL.md`
- `tech-rules <stack>` → `references/context-memory/skills/tech-rules-generator/SKILL.md`

## 参数处理规范

- `--tool`: 指定底层 AI 工具（`gemini`/`codex`），未指定时按子技能建议选择。
- `--regenerate`: 强制重新生成，忽略已有缓存或输出。
- `--mode`: `full`/`partial`，影响扫描或生成范围。

若子命令需要额外参数（如 `load` 的 task、`code-map` 的 feature），必须主动追问并补齐。

## 交互式引导模板

当未提供子命令时，直接给出选项列表并要求单选；当进入 `claude-update` 或 `docs` 时追加二次选项。详细交互提示词与选项集见：

- `references/context-memory/commands/memory.md`

## 资源与引用

- `references/context-memory/commands/memory.md`：完整子命令路由与交互式入口规范。
- `references/context-memory/skills/**/SKILL.md`：各子技能的执行流程、输入输出与降级策略。

遵循“按需加载”的原则，只有在执行对应子命令时才读取相关参考文档。
