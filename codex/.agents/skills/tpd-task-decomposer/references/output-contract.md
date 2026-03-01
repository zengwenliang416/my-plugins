# Output Contract

## Required Inputs
- `${run_dir}/architecture.md`
- `${run_dir}/constraints.md`

## Optional Inputs
- `task_type` (`fullstack`, `frontend`, `backend`; default `fullstack`)

## Required Outputs
- `${run_dir}/tasks.md`
  - Each task must include: id, scope, dependencies, acceptance criteria.
- `${run_dir}/pbt.md`
  - Must map properties/checks back to constraints and critical behaviors.

## Status Signals
- `STATUS: SUCCESS` -> input artifacts and `task_type` are valid.
- `STATUS: FAILURE` -> missing input artifact or unsupported `task_type`.

## Runner JSON Summary
```json
{
  "skill": "tpd-task-decomposer",
  "status": "ready",
  "runDir": "<path>",
  "parameters": { "taskType": "fullstack" },
  "requiredInputs": ["architecture.md", "constraints.md"],
  "expectedOutputs": ["tasks.md", "pbt.md"]
}
```
