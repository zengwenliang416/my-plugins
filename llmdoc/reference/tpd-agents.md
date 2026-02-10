# Reference: TPD Agents

## 1. Core Summary

TPD has two orchestration profiles:

- **Claude profile:** 10 specialized agents in 4 categories (Investigation, Reasoning, Planning, Execution).
- **Trae profile:** 4 agents (`boundary-explorer`, `context-analyzer`, `codex`, `gemini`), where `codex`/`gemini` use `role` parameters to switch responsibilities.

All profiles enforce run-directory isolation and synchronous execution.

## 2. Claude Profile Agent Registry (10 agents)

### Investigation Agents

| Agent | File | Purpose | Key Tools |
| --- | --- | --- | --- |
| boundary-explorer | `plugins/tpd/agents/investigation/boundary-explorer.md` | Explore codebase within context boundary, output constraint set | `mcp__auggie-mcp__codebase-retrieval`, Read, Write |
| context-analyzer | `plugins/tpd/agents/investigation/context-analyzer.md` | Retrieve codebase context for planning | `mcp__auggie-mcp__codebase-retrieval`, Read, Write |

### Reasoning Agents

| Agent | File | Purpose | Key Tools |
| --- | --- | --- | --- |
| codex-constraint | `plugins/tpd/agents/reasoning/codex-constraint.md` | Technical constraint analysis (backend perspective) | Skill (`tpd:codex-cli`), Read, Write |
| gemini-constraint | `plugins/tpd/agents/reasoning/gemini-constraint.md` | UX/frontend constraint analysis | Skill (`tpd:gemini-cli`), Read, Write |

### Planning Agents

| Agent | File | Purpose | Key Tools |
| --- | --- | --- | --- |
| codex-architect | `plugins/tpd/agents/planning/codex-architect.md` | Backend architecture planning (API, data models) | Skill (`tpd:codex-cli`), Read, Write |
| gemini-architect | `plugins/tpd/agents/planning/gemini-architect.md` | Frontend architecture planning (components, UX) | Skill (`tpd:gemini-cli`), Read, Write |

### Execution Agents

| Agent | File | Purpose | Key Tools |
| --- | --- | --- | --- |
| codex-implementer | `plugins/tpd/agents/execution/codex-implementer.md` | Generate backend prototypes (Unified Diff) | Skill (`tpd:codex-cli`), Read, Write |
| gemini-implementer | `plugins/tpd/agents/execution/gemini-implementer.md` | Generate frontend prototypes (Unified Diff) | Skill (`tpd:gemini-cli`), Read, Write |
| codex-auditor | `plugins/tpd/agents/execution/codex-auditor.md` | Security and performance audit | Skill (`tpd:codex-cli`), Read, Write |
| gemini-auditor | `plugins/tpd/agents/execution/gemini-auditor.md` | UX and accessibility audit | Skill (`tpd:gemini-cli`), Read, Write |

## 3. Trae Profile Agent Registry (4 agents)

| Agent | File | Purpose | Key Tools |
| --- | --- | --- | --- |
| boundary-explorer | `plugins/tpd/.trae/agents/README.md` | Thinking Step 2 boundary exploration | Read, Edit |
| context-analyzer | `plugins/tpd/.trae/agents/README.md` | Plan Step 2 context analysis | Read, Edit |
| codex | `plugins/tpd/.trae/agents/README.md` | Core model agent, role-routed (`constraint/architect/implementer/auditor`) | Read, Terminal |
| gemini | `plugins/tpd/.trae/agents/README.md` | Core model agent, role-routed (`constraint/architect/implementer/auditor`) | Read, Terminal |

### Trae Role Mapping

| Role | Codex Output | Gemini Output | Typical Stage |
| --- | --- | --- | --- |
| `constraint` | `codex-thought.md` | `gemini-thought.md` | Thinking Step 3 |
| `architect` | `codex-plan.md` | `gemini-plan.md` | Plan Step 3 |
| `implementer` + `mode=analyze` | `analysis-codex.md` | `analysis-gemini.md` | Dev Step 2 |
| `implementer` + `mode=prototype` | `prototype-codex.diff` | `prototype-gemini.diff` | Dev Step 3 |
| `auditor` | `audit-codex.md` | `audit-gemini.md` | Dev Step 5 |

## 4. Source of Truth

- **Claude Agent Definitions:** `plugins/tpd/agents/` (investigation/reasoning/planning/execution)
- **Trae Agent Configuration:** `plugins/tpd/.trae/agents/README.md`
- **Trae Role-based Orchestration:**
  - `plugins/tpd/.trae/skills/thinking/SKILL.md`
  - `plugins/tpd/.trae/skills/plan/SKILL.md`
  - `plugins/tpd/.trae/skills/dev/SKILL.md`
- **CLI Wrappers:** `plugins/tpd/skills/codex-cli/SKILL.md`, `plugins/tpd/skills/gemini-cli/SKILL.md`
- **Related Architecture:** `/llmdoc/architecture/tpd-workflow.md`

## 5. Invocation Patterns

### Claude Profile

```text
Task(
  subagent_type="tpd:<category>:<agent-name>",
  description="<brief description>",
  prompt="Execute <task>. run_dir=${DIR} <key>=<value>"
)
```

### Trae Profile

```text
调用 @codex，参数：run_dir=${DIR} role=<constraint|architect|implementer|auditor> [mode=analyze|prototype] [focus=...]
调用 @gemini，参数：run_dir=${DIR} role=<constraint|architect|implementer|auditor> [mode=analyze|prototype] [focus=...]
```

Agents MUST NOT be run in background mode; commands wait synchronously for completion.
