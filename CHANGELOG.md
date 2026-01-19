# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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

### Changed

- Refactor all 22 skills to conform to official specifications (skills)
  - All SKILL.md files now under 500 lines
  - Standardized 4-part description format: 【触发条件】【核心产出】【不触发】【先问什么】
  - Unified directory structure: scripts/ + references/ + assets/
  - image-analyzer now uses 8 parallel Gemini analysis dimensions (consulted Gemini/Codex)
  - Fixed validate-skills.sh multi-line YAML parsing

### Fixed

- Add emoji mapping table and format specification for batch commits (commit)
- Add mandatory continuation instructions and next_phase return value to all skills (ui-design)
- Update image-analyzer to use codeagent-wrapper `--file` parameter for multimodal input (ui-design)
