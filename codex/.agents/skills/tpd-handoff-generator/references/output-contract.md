# Output Contract

## Required Inputs
- `${run_dir}/conclusion.md`
- `${run_dir}/synthesis.md`
- `proposal_id`

## Required Outputs
- `${run_dir}/handoff.md`
  - Must include: problem summary, constraints, non-goals, success criteria, risks, open questions.
- `${run_dir}/handoff.json`
  - Must include: `proposal_id`, `generated_at`, `constraints`, `success_criteria`, `risks`, `open_questions`.
- `${run_dir}/meta/artifact-manifest.json`
  - Must reference both `handoff.md` and `handoff.json`.

## Status Signals
- `STATUS: SUCCESS` -> prerequisites are complete and output plan is valid.
- `STATUS: FAILURE` -> prerequisites are missing or invalid.

## Runner JSON Summary
```json
{
  "skill": "tpd-handoff-generator",
  "status": "ready",
  "runDir": "<path>",
  "parameters": { "proposalId": "<id>" },
  "requiredInputs": ["conclusion.md", "synthesis.md"],
  "expectedOutputs": ["handoff.md", "handoff.json", "meta/artifact-manifest.json"]
}
```
