# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Add branch-creator skill for automatic feature branch creation (branch-creator)
- Add interactive selection mode (-s) and dry-run mode (-d) to sync-plugins.sh (scripts)
- Add unified TPD (Thinking→Plan→Dev) workflow plugin (tpd)
  - Consolidates dev, plan, thinking plugins into single integrated workflow
  - New skills: handoff-generator, context-explorer
  - Migrated skills: codex-cli, gemini-cli, codex-thinker, gemini-thinker, requirement-parser, task-decomposer, risk-assessor, plan-synthesizer, audit-reviewer, code-implementer
  - Supports OpenSpec specification for workflow handoff
- Add enhanced file reading strategy hints to read-limit hook (hooks)
- Add install and list features to sync-plugins.sh script (scripts)
- Add thinking plugin registration to marketplace (marketplace)
- Add thinking plugin to sync script (scripts)
- Add sequential-thinking MCP tool integration to all workflow skills (skills)
  - commit: 5 skills - structured analysis and generation workflow
  - dev: 5 skills - structured development and audit workflow
  - plan: 8 skills - structured planning and architecture workflow
  - ui-design: 8 skills - structured design and code generation workflow
- Add Top 5 hooks for enhanced session management (hooks)
  - SessionStart: night-guardian.sh - Deep night rest reminder (23:00-05:00)
  - SessionEnd: handover-assistant.sh - Team handover document generation
  - UserPromptSubmit: emotion-resonance.sh - Emotion detection and support
  - PreToolUse:Bash: team-standards.sh - Git operation standards checking
  - PreCompact: compact-evaluator.sh - Context compression evaluation
- Add hooks plugin for common automation hooks (hooks)
  - UserPromptSubmit: unified-eval.sh - Intent evaluation + tool priority injection
  - PreToolUse: killshell-guard.sh, auto-backup.sh, mcp-logger.sh
  - PostToolUse: auto-format.sh - Automatic code formatting
  - Stop: stop-check.sh - Task completion check + notifications
- Add brainstorm plugin for AI-assisted brainstorming workflow (brainstorm)
  - Phase 1: topic-researcher - External research via exa integration
  - Phase 2: idea-generator - Multi-model parallel creativity (Codex + Gemini)
  - Phase 3: idea-evaluator - Impact/Feasibility/Innovation/Alignment scoring
  - Phase 4: report-synthesizer - Generate brief/detailed reports
  - Support SCAMPER and Six Thinking Hats methods
  - 7 skill modules: codex-cli, gemini-cli, exa, topic-researcher, idea-generator, idea-evaluator, report-synthesizer
- Add context-memory plugin for intelligent context management (context-memory)
  - context-loader: Context loading with priority management
  - session-compactor: Session compression and summarization
  - code-map-generator: Code map and dependency analysis
  - skill-indexer/loader: Skill indexing and dynamic loading
  - workflow-memory: Workflow state persistence
  - style-memory: Code style detection and memory
  - doc-planner/generator/updater: Documentation management (5 skills)
  - swagger-generator: OpenAPI documentation generation
  - tech-rules-generator: Technical rules generation
  - Integrates codex-cli, gemini-cli, exa for multi-model collaboration
- Add hooks detection support to sync-plugins.sh script (scripts)

### Changed

- Update commit workflow documentation with branch-creator integration (commit)
- Translate commit skill documentation to English (skills)
- Translate all TPD commands and skills documentation to English (tpd)
- Remove deprecated dev, plan, thinking plugins (migrated to tpd) (plugins)
  - dev: 42 files removed
  - plan: 59 files removed
  - thinking: 25 files removed
- Clean up obsolete hook scripts (hooks)
- Update build scripts to support tpd plugin (scripts)
- Update marketplace configuration for tpd plugin (root)
- Rewrite project documentation with updated installation guide and plugin list (root)
- Rename plugin command files from run.md to descriptive names (plugins)
  - brainstorm.md, commit.md, memory.md, dev.md, plan.md, refactor.md, thinking.md, ui-design.md
- Add REFACTOR-PLAN.md for context-memory plugin architecture (context-memory)
- Restructure plugin directories from plugins/commands/ to plugins/ (plugins)
  - Flatten plugin hierarchy for simpler navigation
  - Update marketplace.json, sync-plugins.sh, validate-skills.sh references
  - Add refactor plugin to sync list
  - Clean up deprecated plugin directories (869 files removed):
    - commands/ (343), ccg-office (136), ccg-core (125), ccg-developing (97)
    - ccg-ui (77), ccg-writing (44), ccg-testing (26), ccg-tools (14)
- Refactor all 22 skills to conform to official specifications (skills)
  - All SKILL.md files now under 500 lines
  - Standardized 4-part description format: 【触发条件】【核心产出】【不触发】【先问什么】
  - Unified directory structure: scripts/ + references/ + assets/
  - image-analyzer now uses 8 parallel Gemini analysis dimensions (consulted Gemini/Codex)
  - Fixed validate-skills.sh multi-line YAML parsing

### Fixed

- Remove async property from notification hook configuration (hooks)
- Fix relative path handling in read-limit.sh hook (hooks)
- Add emoji mapping table and format specification for batch commits (commit)
- Add mandatory continuation instructions and next_phase return value to all skills (ui-design)
- Update image-analyzer to use codeagent-wrapper `--file` parameter for multimodal input (ui-design)
