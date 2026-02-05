# Reference: TPD Agents

## 1. Core Summary

TPD workflow uses 10 specialized agents organized into 4 categories: Investigation, Reasoning, Planning, and Execution. All agents operate with strict tool access controls and produce artifacts in the designated `run_dir`.

## 2. Agent Registry

### Investigation Agents

| Agent             | File                                                    | Purpose                                                         | Key Tools                                          |
| ----------------- | ------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------- |
| boundary-explorer | `plugins/tpd/agents/investigation/boundary-explorer.md` | Explore codebase within context boundary, output constraint set | `mcp__auggie-mcp__codebase-retrieval`, Read, Write |
| context-analyzer  | `plugins/tpd/agents/investigation/context-analyzer.md`  | Retrieve codebase context for planning                          | `mcp__auggie-mcp__codebase-retrieval`, Read, Write |

### Reasoning Agents

| Agent             | File                                                | Purpose                                             | Key Tools                             |
| ----------------- | --------------------------------------------------- | --------------------------------------------------- | ------------------------------------- |
| codex-constraint  | `plugins/tpd/agents/reasoning/codex-constraint.md`  | Technical constraint analysis (backend perspective) | Skill (`tpd:codex-cli`), Read, Write  |
| gemini-constraint | `plugins/tpd/agents/reasoning/gemini-constraint.md` | UX/frontend constraint analysis                     | Skill (`tpd:gemini-cli`), Read, Write |

### Planning Agents

| Agent            | File                                              | Purpose                                          | Key Tools                             |
| ---------------- | ------------------------------------------------- | ------------------------------------------------ | ------------------------------------- |
| codex-architect  | `plugins/tpd/agents/planning/codex-architect.md`  | Backend architecture planning (API, data models) | Skill (`tpd:codex-cli`), Read, Write  |
| gemini-architect | `plugins/tpd/agents/planning/gemini-architect.md` | Frontend architecture planning (components, UX)  | Skill (`tpd:gemini-cli`), Read, Write |

### Execution Agents

| Agent              | File                                                 | Purpose                                     | Key Tools                             |
| ------------------ | ---------------------------------------------------- | ------------------------------------------- | ------------------------------------- |
| codex-implementer  | `plugins/tpd/agents/execution/codex-implementer.md`  | Generate backend prototypes (Unified Diff)  | Skill (`tpd:codex-cli`), Read, Write  |
| gemini-implementer | `plugins/tpd/agents/execution/gemini-implementer.md` | Generate frontend prototypes (Unified Diff) | Skill (`tpd:gemini-cli`), Read, Write |
| codex-auditor      | `plugins/tpd/agents/execution/codex-auditor.md`      | Security and performance audit              | Skill (`tpd:codex-cli`), Read, Write  |
| gemini-auditor     | `plugins/tpd/agents/execution/gemini-auditor.md`     | UX and accessibility audit                  | Skill (`tpd:gemini-cli`), Read, Write |

## 3. Source of Truth

- **Agent Definitions:** `plugins/tpd/agents/` directory, organized by category (investigation, reasoning, planning, execution).
- **CLI Wrappers:** `plugins/tpd/skills/codex-cli/SKILL.md` and `plugins/tpd/skills/gemini-cli/SKILL.md`.
- **Command Orchestration:** `plugins/tpd/commands/` defines how agents are invoked per phase.
- **Related Architecture:** `/llmdoc/architecture/tpd-workflow.md`.

## 4. Agent Invocation Pattern

```
Task(
  subagent_type="tpd:<category>:<agent-name>",
  description="<brief description>",
  prompt="Execute <task>. run_dir=${DIR} <key>=<value>"
)
```

Agents MUST NOT be run in background with `run_in_background=true`. Commands wait synchronously for agent completion.
