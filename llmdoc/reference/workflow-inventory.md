# Workflow Inventory

This document provides a summary of all workflows in the ccg-workflows codebase.

## 1. Core Summary

The codebase contains 7 workflow commands across 6 plugins. All workflows follow the phased execution model with run directory isolation, state tracking, and hard stops for user confirmation.

## 2. Source of Truth

### Commit Plugin (v2.0.0)

- **Command:** `plugins/commit/commands/commit.md`
- **Pattern:** Parallel (semantic + symbol analyzers)
- **Phases:** 10 phases, hard stops at Phase 6 (confirm) and Phase 10 (deliver)
- **Agents:** change-investigator, semantic-analyzer, symbol-analyzer, commit-worker
- **Run Dir:** `.claude/committing/runs/{timestamp}/`

### TPD Plugin (v2.0.0)

- **Commands:**
  - `plugins/tpd/commands/thinking.md` - Deep analysis with boundary exploration
  - `plugins/tpd/commands/plan.md` - Multi-model architecture planning
  - `plugins/tpd/commands/dev.md` - OpenSpec-based development
- **Pattern:** Phased with checkpoints + parallel multi-model
- **Agents (Claude profile):** boundary-explorer, context-analyzer, codex-constraint, gemini-constraint, codex-architect, gemini-architect, codex-implementer, gemini-implementer, codex-auditor, gemini-auditor
- **Agents (Trae profile):** boundary-explorer, context-analyzer, `codex` (role-based), `gemini` (role-based)
- **Trae Mapping:** `plugins/tpd/.trae/agents/README.md`
- **Run Dir:** `openspec/changes/{proposal_id}/artifacts/{phase}/`

### UI-Design Plugin (v2.0.0)

- **Command:** `plugins/ui-design/commands/ui-design.md`
- **Pattern:** Parallel (3 design variants) + sequential dual-model code generation
- **Phases:** 10 phases with variant selection and validation loops
- **Agents:** requirement-analyzer, design-variant-generator, ux-guideline-checker, gemini-prototype-generator, claude-code-refactor, quality-validator
- **Run Dir:** `.claude/ui-design/runs/{timestamp}/`

### Brainstorm Plugin (v1.1.0)

- **Command:** `plugins/brainstorm/commands/brainstorm.md`
- **Pattern:** Sequential
- **Flow:** Research → Ideation → Evaluation → Report
- **Run Dir:** `.claude/brainstorm/runs/{timestamp}/`

### Refactor Plugin (v1.0.0)

- **Command:** `plugins/refactor/commands/refactor.md`
- **Pattern:** Sequential with conditional legacy mode
- **Flow:** Smell Detection → Suggestions → Impact Analysis → Execution
- **Run Dir:** `.claude/refactor/runs/{timestamp}/`

### Context-Memory Plugin (v1.0.0)

- **Command:** `plugins/context-memory/commands/memory.md`
- **Pattern:** Interactive router
- **Function:** Dispatches to specialized skills based on user selection
- **Run Dir:** `.claude/context-memory/runs/{timestamp}/`

## 3. Related Architecture

- `/llmdoc/architecture/workflow-orchestration.md` - Workflow patterns and execution model
- `/llmdoc/architecture/plugin-structure.md` - Plugin directory conventions
