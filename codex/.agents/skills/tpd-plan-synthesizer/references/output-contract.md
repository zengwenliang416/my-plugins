# Output Contract

## Required Inputs
- `${run_dir}/architecture.md`
- `${run_dir}/constraints.md`
- `${run_dir}/tasks.md`
- `${run_dir}/risks.md`
- `${run_dir}/pbt.md`

## Required Outputs
- `${run_dir}/plan.md`
  - Must include: scope, sequence, verification strategy, and risk summary.
- `${run_dir}/decision-log.md`
  - Must include: unresolved decisions, owner, due date, impact.
- `${run_dir}/timeline.md`
  - Must include: phased schedule, dependencies, milestones.

## Status Signals
- `STATUS: SUCCESS` -> all mandatory artifacts are available for synthesis.
- `STATUS: FAILURE` -> one or more mandatory inputs are missing.

## Runner JSON Summary
```json
{
  "skill": "tpd-plan-synthesizer",
  "status": "ready",
  "runDir": "<path>",
  "requiredInputs": [
    "architecture.md",
    "constraints.md",
    "tasks.md",
    "risks.md",
    "pbt.md"
  ],
  "expectedOutputs": ["plan.md", "decision-log.md", "timeline.md"]
}
```
