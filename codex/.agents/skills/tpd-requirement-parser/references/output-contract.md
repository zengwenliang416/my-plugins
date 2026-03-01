# Output Contract

## Required Inputs
- At least one of:
  - `${run_dir}/input.md`
  - `${run_dir}/proposal.md`
  - `${run_dir}/../proposal.md`
  - `${run_dir}/../thinking/handoff.json`

## Required Outputs
- `${run_dir}/requirements.md`
  - Must include: functional requirements, non-functional requirements, assumptions, open questions.
  - Must include source trace markers for each requirement group.

## Status Signals
- `STATUS: SUCCESS` -> at least one requirement source is valid.
- `STATUS: FAILURE` -> no requirement source can be resolved.

## Runner JSON Summary
```json
{
  "skill": "tpd-requirement-parser",
  "status": "ready",
  "runDir": "<path>",
  "resolvedSource": "<relative-path>",
  "optionalInputs": ["clarifications.md"],
  "expectedOutputs": ["requirements.md"]
}
```
