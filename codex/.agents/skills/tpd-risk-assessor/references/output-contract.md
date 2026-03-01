# Output Contract

## Required Inputs
- `${run_dir}/architecture.md`
- `${run_dir}/tasks.md`
- `${run_dir}/constraints.md`

## Required Outputs
- `${run_dir}/risks.md`
  - Each risk entry must include: `id`, `category`, `severity`, `likelihood`, `impact`, `mitigation`, `owner`, `trigger`.
  - Must include a short summary of top critical/high risks.

## Status Signals
- `STATUS: SUCCESS` -> risk baseline inputs are complete.
- `STATUS: FAILURE` -> one or more required inputs are missing.

## Runner JSON Summary
```json
{
  "skill": "tpd-risk-assessor",
  "status": "ready",
  "runDir": "<path>",
  "requiredInputs": ["architecture.md", "tasks.md", "constraints.md"],
  "expectedOutputs": ["risks.md"]
}
```
