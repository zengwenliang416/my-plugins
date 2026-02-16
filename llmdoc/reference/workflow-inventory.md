# Workflow Inventory

This document provides a summary of all workflows in the ccg-workflows codebase.

## 1. Core Summary

The documented core workflows currently include 11 commands across 7 plugins. They combine phased execution, parallel agents, and Agent Team orchestration with explicit hand-off signals.

## 2. Source of Truth

### Commit Plugin (v2.0.0)

- **Command:** `plugins/commit/commands/commit.md`
- **Pattern:** Parallel (semantic + symbol analyzers)
- **Phases:** 10 phases, hard stops at Phase 6 (confirm) and Phase 10 (deliver)
- **Agents:** change-investigator, semantic-analyzer, symbol-analyzer, commit-worker
- **Run Dir:** `openspec/changes/{change_id}/`

### TPD Plugin (v2.0.0)

- **Commands:**
  - `plugins/tpd/commands/thinking.md` - Deep analysis with boundary exploration
  - `plugins/tpd/commands/plan.md` - Multi-model architecture planning
  - `plugins/tpd/commands/dev.md` - OpenSpec-based development
- **Pattern:** Phased with checkpoints + parallel multi-model
- **Agents (Claude profile):** boundary-explorer, context-analyzer, codex-constraint, gemini-constraint, codex-architect, gemini-architect, codex-implementer, gemini-implementer, codex-auditor, gemini-auditor
- **Agents (Trae profile):** boundary-explorer, context-analyzer, `codex` (role-based), `gemini` (role-based)
- **Trae Mapping:** `plugins/tpd/.trae/agents/README.md`
- **Run Dir:** `openspec/changes/{proposal_id}/` (phase outputs may use `{proposal_id}/{phase}/`)

### UI-Design Plugin (v2.0.0)

- **Command:** `plugins/ui-design/commands/ui-design.md`
- **Pattern:** Parallel (3 design variants) + sequential dual-model code generation
- **Phases:** 10 phases with variant selection and validation loops
- **Agents:** requirement-analyzer, design-variant-generator, ux-guideline-checker, gemini-prototype-generator, claude-code-refactor, quality-validator
- **Run Dir:** `openspec/changes/{change_id}/`

### Brainstorm Plugin (v1.1.0)

- **Command:** `plugins/brainstorm/commands/brainstorm.md`
- **Pattern:** Sequential
- **Flow:** Research → Ideation → Evaluation → Report
- **Run Dir:** `openspec/changes/{change_id}/`

### Refactor Plugin (v1.0.0)

- **Command:** `plugins/refactor/commands/refactor.md`
- **Pattern:** Sequential with conditional legacy mode
- **Flow:** Smell Detection → Suggestions → Impact Analysis → Execution
- **Run Dir:** `openspec/changes/{change_id}/`

### Context-Memory Plugin (v1.0.0)

- **Command:** `plugins/context-memory/commands/memory.md`
- **Pattern:** Interactive router
- **Function:** Dispatches to specialized skills based on user selection
- **Run Dir:** no fixed run directory; command acts as router and delegated workflows should use OpenSpec artifacts when runtime output is needed

### Docflow Plugin (v1.0.0)

- **Commands:**
  - `.codex/prompts/docflow-init-doc.md` - `/prompts:docflow-init-doc`, initialize `llmdoc` via scout + recorder Agent Team
  - `.codex/prompts/docflow-with-scout.md` - `/prompts:docflow-with-scout`, investigate-first execution via investigator + worker Agent Team
  - `.codex/prompts/docflow-what.md` - `/prompts:docflow-what`, clarify ambiguous requests and route to `/prompts:docflow-with-scout`
- **Pattern:** Team-orchestrated investigation and execution with cross-check + fix-loop
- **Agents:** `docflow-scout`, `docflow-recorder`, `docflow-investigator`, `docflow-worker`
- **Team Signals (examples):**
  - init-doc: `SCOUT_REPORT_READY`, `SCOUT_CROSSCHECK_RESULT`, `DOC_DRAFT_READY`
  - with-scout: `INVESTIGATION_READY`, `INVESTIGATION_REVIEW_RESULT`, `EXECUTION_RESULT`, `EXECUTION_FIX_APPLIED`
- **Retry Policy:** bounded repair loops (max 2 rounds), unresolved blockers escalate to user
- **Compatibility:** legacy `plugins/docflow/commands/*.md` remains as mapping reference; recommended entry is `/prompts:docflow-*`
- **Run Dir:** no fixed run directory; uses task-scoped context and `llmdoc/agent/` artifacts where applicable

## 3. Related Architecture

- `/llmdoc/architecture/workflow-orchestration.md` - Workflow patterns and execution model
- `/llmdoc/architecture/plugin-structure.md` - Plugin directory conventions
