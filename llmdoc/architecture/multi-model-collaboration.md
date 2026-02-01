# Multi-Model Collaboration Architecture

## 1. Identity

- **What it is:** A pattern for orchestrating multiple external AI models (Codex, Gemini) within Claude Code workflows.
- **Purpose:** Leverage specialized model strengths through role-based delegation and parallel execution.

## 2. Core Components

- `~/.claude/bin/codeagent-wrapper` (CLI): Unified wrapper for invoking external models with role-based prompting and sandbox constraints.
- `plugins/*/skills/codex-cli/SKILL.md` (Skill): Technical perspective integration via Codex with `--sandbox read-only`.
- `plugins/*/skills/gemini-cli/SKILL.md` (Skill): UX/visual perspective integration via Gemini with session management.
- `plugins/*/agents/*/codex-*.md` (Agents): Codex-based agents for backend architecture, constraints, implementation.
- `plugins/*/agents/*/gemini-*.md` (Agents): Gemini-based agents for frontend, UX, prototyping.

## 3. Execution Flow (LLM Retrieval Map)

### Pattern A: Parallel Multi-Model Analysis

- **1. Dispatch:** Command launches paired agents via Task tool with `run_in_background=true`.
  - `plugins/commit/commands/commit.md:45-55` (semantic + symbol analyzers)
  - `plugins/tpd/commands/dev.md:35-50` (codex + gemini implementers)
- **2. Execute:** Each agent calls its respective model via codeagent-wrapper CLI.
- **3. Synthesize:** Synthesizer skill merges results after both complete.
  - `plugins/commit/skills/analysis-synthesizer/SKILL.md` (conflict resolution)

### Pattern B: Sequential Dual-Model Refinement

- **1. Generate:** Gemini produces rapid prototype (~70% quality).
  - `plugins/ui-design/agents/generation/gemini-prototype-generator.md`
- **2. Refine:** Claude refactors to production quality (~95%).
  - `plugins/ui-design/agents/generation/claude-code-refactor.md`

### Pattern C: Role-Based Delegation

| Model  | Roles                                   | Strength                      |
| ------ | --------------------------------------- | ----------------------------- |
| Codex  | architect, analyzer, planner            | Backend, system design, logic |
| Gemini | brainstorm, designer, component-analyst | Frontend, UX, visual analysis |

## 4. Design Rationale

**Sandbox Constraints:** External models MUST use `--sandbox read-only` to prevent unauthorized file writes. All code output is in Unified Diff format, applied only by Claude.

**Session Management:** Gemini supports multi-turn context via `--session` parameter for workflows requiring iterative refinement.

**Structured Output:** External models output JSON or Unified Diff only. Unstructured text is forbidden to ensure machine-parseable handoffs.

**Parallel Execution:** Task tool's `run_in_background=true` enables concurrent model invocation, reducing total workflow time.
