# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Remove `--approval-mode plan` from invoke-gemini.ts — headless mode works without it (context-memory)
- Remove Claude inline fallback from gemini-cli and codex-cli — fail-fast if Gemini unavailable (context-memory)
- Enforce MANDATORY Hard Stop for AskUserQuestion across all plugins to prevent models from skipping menus (brainstorm, d2c, refactor, ui-design, tpd)
- Disambiguate skill/agent references in doc-generation skills to prevent LLM misrouting (context-memory)
- Enforce external model usage with mandatory constraint blocks in doc-generation skills (context-memory)

### Changed

- Split /memory router into 7 independent commands: /doc, /load, /compact, /swagger, /tech-rules, /code-map, /skill (context-memory)
- Downgrade /memory to lightweight help command listing available commands (context-memory)
- Harden investigator agent with mandatory behavior rules and fallback report template (docflow)
- Add Task Result Handling section to all team-based plugin commands (plugins)
- Add Task Tool Rules prohibition to all plugin CLAUDE.md files (plugins)
- Restructure sync-plugins script for new agent type paths (scripts)
- Fix outdated TaskOutput reference in project overview (llmdoc)
- Migrate skill scripts from Bash to TypeScript for better type safety and cross-platform compatibility (skills)
- Update commit workflow documentation with branch-creator integration (commit)
- Translate commit skill documentation to English (skills)
- Translate all TPD commands and skills documentation to English (tpd)
- Remove deprecated dev, plan, thinking plugins (migrated to tpd) (plugins)
- Clean up obsolete hook scripts (hooks)
- Update build scripts to support tpd plugin (scripts)
- Update marketplace configuration for tpd plugin (root)
- Rewrite project documentation with updated installation guide and plugin list (root)
- Rename plugin command files from run.md to descriptive names (plugins)
- Add REFACTOR-PLAN.md for context-memory plugin architecture (context-memory)
- Restructure plugin directories from plugins/commands/ to plugins/ (plugins)
- Refactor all 22 skills to conform to official specifications (skills)
- 重构 context-memory 插件结构
- 同步 TPD 工作流与迁移文档
- 更新 ui-design 智能体/技能编排与文档
- 调整外部模型调用脚本与配套参考资源
- 更新 llmdoc 指南、架构与索引文档

### Added

- Add docflow plugin for documentation-first workflow (docflow)
- Enhance skill validation script with TypeScript support and bilingual frontmatter (validation)
- Add docflow plugin to marketplace registry (marketplace)
- Add branch-creator skill for automatic feature branch creation (branch-creator)
- Add interactive selection mode (-s) and dry-run mode (-d) to sync-plugins.sh (scripts)
- Add unified TPD (Thinking→Plan→Dev) workflow plugin (tpd)
- Add enhanced file reading strategy hints to read-limit hook (hooks)
- Add install and list features to sync-plugins.sh script (scripts)
- Add thinking plugin registration to marketplace (marketplace)
- Add thinking plugin to sync script (scripts)
- Add sequential-thinking MCP tool integration to all workflow skills (skills)
- Add Top 5 hooks for enhanced session management (hooks)
- Add hooks plugin for common automation hooks (hooks)
- Add brainstorm plugin for AI-assisted brainstorming workflow (brainstorm)
- Add context-memory plugin for intelligent context management (context-memory)
- Add hooks detection support to sync-plugins.sh script (scripts)
- 新增或整理 docflow 在 codex 侧的 prompts/skills/agents 与 manifest 资产

### Fixed

- Remove async property from notification hook configuration (hooks)
- Fix relative path handling in read-limit.sh hook (hooks)
- Add emoji mapping table and format specification for batch commits (commit)
- Add mandatory continuation instructions and next_phase return value to all skills (ui-design)
- Update image-analyzer to use codeagent-wrapper `--file` parameter for multimodal input (ui-design)
