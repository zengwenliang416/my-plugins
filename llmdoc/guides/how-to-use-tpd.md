# How to Use TPD Workflow

A step-by-step guide for executing the TPD (Thinking → Plan → Dev) workflow.

## Command Entry Points

| Command         | Purpose                                    | Key Arguments                                    |
| --------------- | ------------------------------------------ | ------------------------------------------------ |
| `/tpd:init`     | Initialize OpenSpec and validate MCP tools | `--skip-install`                                 |
| `/tpd:thinking` | Deep constraint discovery                  | `--depth=auto\|light\|deep\|ultra`, `--parallel` |
| `/tpd:plan`     | Transform proposal into executable plan    | `proposal_id`, `--task-type`, `--loop`           |
| `/tpd:dev`      | Iterative minimal-phase implementation     | `--proposal-id`, `--task-type`                   |

## Usage Pattern 1: Full Workflow

1. **Initialize:** Run `/tpd:init` to install OpenSpec and verify MCP tools (codex, gemini).
2. **Think:** Run `/tpd:thinking <problem description>` to explore constraints.
3. **Plan:** Run `/tpd:plan` to select the proposal and generate executable plan.
4. **Develop:** Run `/tpd:dev` to implement tasks iteratively.

## Usage Pattern 2: Direct Planning (Skip Thinking)

1. **Prerequisite:** Create OpenSpec proposal manually via `openspec new <name>`.
2. **Plan:** Run `/tpd:plan <proposal_id>` to generate plan from existing proposal.
3. **Develop:** Run `/tpd:dev --proposal-id=<id>` to implement.

## Usage Pattern 3: Loop Mode

1. **Continuous Flow:** Run `/tpd:plan --loop` to auto-chain to dev phase after approval.

## Hard Stop Points (User Confirmation Required)

### Thinking Phase

| Stop Point               | Trigger Condition                        | User Action                 |
| ------------------------ | ---------------------------------------- | --------------------------- |
| Depth confirmation       | `--depth=auto` and score 4-6             | Confirm light/deep/ultra    |
| Constraint clarification | `synthesis.md` contains `open_questions` | Answer clarifying questions |
| Ultra continuation       | Ultra mode conclusion displayed          | Confirm further exploration |

### Plan Phase

| Stop Point               | Trigger Condition                  | User Action                 |
| ------------------------ | ---------------------------------- | --------------------------- |
| Architecture differences | Both Codex and Gemini plans ready  | Review and approve approach |
| Ambiguity resolution     | Ambiguities identified in proposal | Confirm each decision point |
| Plan approval            | Final `plan.md` generated          | Approve to proceed to dev   |

### Dev Phase

| Stop Point              | Trigger Condition                  | User Action                     |
| ----------------------- | ---------------------------------- | ------------------------------- |
| Task scope confirmation | Minimal phase selected (1-3 tasks) | Confirm scope                   |
| Approach approval       | Analysis complete                  | Approve implementation approach |
| Critical audit issues   | Audit finds critical problems      | Fix before proceeding           |
| Iteration decision      | Current phase complete             | Continue to next phase or stop  |

## Verification Checklist

After each phase, verify artifacts exist:

- **Thinking:** `openspec/changes/${PROPOSAL_ID}/artifacts/thinking/handoff.json`
- **Plan:** `openspec/changes/${PROPOSAL_ID}/artifacts/plan/plan.md`
- **Dev:** `openspec/changes/${PROPOSAL_ID}/artifacts/dev/changes.md`
