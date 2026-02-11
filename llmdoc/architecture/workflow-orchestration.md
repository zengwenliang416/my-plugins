# Architecture of Workflow Orchestration

## 1. Identity

- **What it is:** The core execution framework for multi-phase workflows in ccg-workflows plugins.
- **Purpose:** Orchestrates command execution through phased pipelines with parallel agent support, state persistence, and user confirmation checkpoints.

## 2. Core Components

- `plugins/*/commands/*.md` (Command Entry Points): Define workflows via YAML frontmatter + phase-based markdown specification.
- `plugins/*/agents/*.md` (Agent Definitions): Specialized sub-task workers invoked via Task tool with `run_in_background` support.
- `plugins/*/skills/*/SKILL.md` (Skill Modules): Atomic reusable operations invoked via Skill tool.
- `openspec/changes/*/` (Change Workspace): Workflow progress, phase outputs, and resumable context.

## 3. Workflow Patterns

### 3.1 Sequential Workflows

Linear phase execution where each phase depends on the previous output.

```
Phase 1 → Phase 2 → Phase 3 → Phase 4
```

**Examples:**

- `brainstorm`: Research → Ideation → Evaluation → Report
- `refactor`: Smell Detection → Suggestions → Impact Analysis → Execution

### 3.2 Parallel Workflows

Multiple agents execute concurrently, then results are synthesized.

```
           ┌─ Agent A (background) ─┐
Phase 1 → ├─ Agent B (background) ─┼→ Synthesize → Phase N
           └─ Agent C (background) ─┘
```

**Implementation:** `plugins/commit/commands/commit.md:78-101` - Phase 3 launches semantic-analyzer and symbol-analyzer with `run_in_background=true`.

### 3.3 Phased Workflows with Checkpoints

Complex multi-stage workflows with hard stops for user confirmation.

```
Auto: Phase 1→2→3→4→5
Hard Stop: Phase 6 (Confirm) ⏸️
Auto: Phase 7→8→9
Hard Stop: Phase 10 (Deliver) ⏸️
```

**Implementation:** `plugins/tpd/commands/dev.md` - 12 phases with hard stops at Phase 3, 5, 9, 10.

## 4. Runtime Artifact Directory Pattern

All workflows use OpenSpec change directories for runtime state and outputs:

```
openspec/changes/{change_id}/
├── state.json              # Workflow state tracking
├── input.md                # Original input/request
├── changes-raw.json        # Phase 1 output
├── semantic-analysis.json  # Parallel agent output
├── symbol-analysis.json    # Parallel agent output
├── changes-analysis.json   # Synthesized output
└── ...
```

TPD phased workflows use proposal-scoped artifacts:

```
openspec/changes/{proposal_id}/{phase}/
```

**Implementation:** `plugins/commit/commands/commit.md` and `plugins/tpd/commands/{thinking,plan,dev}.md`.

## 5. State Tracking

`state.json` tracks workflow progress for resumption:

```json
{
  "domain": "commit|thinking|ui-design",
  "workflow_id": "20260131T120000Z",
  "phases": [
    { "id": "initialization", "status": "completed" },
    { "id": "analysis", "status": "pending" }
  ]
}
```

**Resume:** Pass `--run-id={timestamp}` to continue from first pending phase.

## 6. Data Flow (LLM Retrieval Map)

- **1. Initialize:** Command creates `RUN_DIR`, writes `state.json` and `input.md`.
- **2. Phase Execution:** Each phase reads from `${RUN_DIR}`, processes, writes artifacts.
- **3. Agent Invocation:** `Task(prompt="...run_dir=${RUN_DIR}", run_in_background=true/false)`
- **4. Skill Invocation:** `Skill("{skill-name}", "run_dir=${RUN_DIR}")`
- **5. Synthesis:** Downstream phases read multiple artifacts, merge into unified output.
- **6. Delivery:** Final phase aggregates all artifacts, presents summary.

## 7. Design Rationale

- **Isolation:** change-id + workflow + run-id partitioning prevents artifact collision across runs.
- **Parallelism:** `run_in_background=true` enables concurrent agent execution.
- **Checkpoints:** Hard stops with `AskUserQuestion` ensure user control at critical decisions.
- **Resumability:** State tracking enables interrupted workflows to continue.
