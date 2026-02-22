# TPD Plugin

<!-- Machine-readable metadata for unified-eval.sh -->
<available-skills>

| Skill           | Trigger                | Description                                |
| --------------- | ---------------------- | ------------------------------------------ |
| `/tpd:init`     | "初始化", "init tpd"   | Initialize OpenSpec environment            |
| `/tpd:thinking` | "深度思考", "分析问题" | Constraint-set exploration (solo phase)    |
| `/tpd:plan`     | "制定计划", "规划"     | Zero-decision plan generation (solo phase) |
| `/tpd:dev`      | "开发", "实现"         | Minimal-phase implementation (solo phase)  |

</available-skills>

## Overview

TPD v2: Independent four-phase workflow (thinking → plan → dev) with parallel analysis and OpenSpec data handoff.

All four phases are fully independent, linked by OpenSpec's proposal_id:

- Each phase can be executed standalone
- Data exchange via `openspec/changes/<proposal_id>/` directory
- No required execution order (but thinking → plan → dev is recommended)

## Quick Start

```bash
# 1. Initialize OpenSpec
/tpd:init

# 2. Deep thinking on a problem
/tpd:thinking --depth=deep "How to implement user authentication with JWT?"

# 3. Generate execution plan
/tpd:plan

# 4. Implement in minimal phases
/tpd:dev
```

## Phase Data Flow

```
init ─────→ OpenSpec initialization
                ↓ (openspec/)
thinking ─────→ constraint-set output → openspec/changes/<proposal_id>/
                ↓ (proposal_id linkage)
plan ─────────→ zero-decision plan → openspec/changes/<proposal_id>/
                ↓ (proposal_id linkage)
dev ──────────→ minimal verifiable phase implementation
```

## Key Artifacts

### Thinking Phase

- `boundaries.json` - Context boundaries
- `explore-*.json` - Boundary exploration results
- `synthesis.md` - Constraint integration
- `conclusion.md` - Final conclusion
- `handoff.md/json` - Handoff summary

### Plan Phase

- `requirements.md` - Parsed requirements
- `context.md` - Retrieved context
- `codex-plan.md` / `gemini-plan.md` - Multi-model analysis
- `architecture.md` - Architecture design
- `tasks.md` - Task decomposition
- `plan.md` - Final plan

### Dev Phase

- `tasks-scope.md` - Current phase scope
- `analysis-*.md` - Implementation analysis
- `prototype-*.diff` - Code prototypes
- `changes.md` - Applied changes
- `audit-*.md` - Audit reports

## Agent Types (v2.1)

TPD now uses 3 merged agents:

- `context-explorer`: investigation workloads for both boundary exploration and plan context retrieval.
- `codex-core`: role-routed Codex agent (`constraint`, `architect`, `implementer`, `auditor`).
- `gemini-core`: role-routed Gemini agent (`constraint`, `architect`, `implementer`, `auditor`).

Team orchestration is defined directly in `plugins/tpd/commands/{thinking,plan,dev}.md`.

---

## Recommended CLAUDE.md Configuration

Copy the following to your project's `.claude/CLAUDE.md`:

```markdown
<system-reminder>

## Workflow Completion Rules

<workflow-completion>

### Multi-Phase Workflow Management

- All workflows use `openspec/changes/{change_id}/` isolated run directories
- Track phase progress via `state.json`, support `--run-id` to resume interrupted workflows
- Use **Hard Stop** (`AskUserQuestion`) at critical decision points
- Final phase MUST generate delivery summary and prompt next steps

</workflow-completion>

## Parallel Task Integration Rules

<parallel-task-integration>

### Consolidation Protocol

When using parallel task agents:

1. Wait for all parallel tasks to complete
2. Merge findings into a single summary
3. Highlight conflicts or concerns
4. Present actionable next steps
5. **Never leave parallel work hanging without a summary**

</parallel-task-integration>

</system-reminder>
```
