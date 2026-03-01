# Output Contract

## Required Inputs
- `${run_dir}/requirements.md`

## Optional Inputs
- `${run_dir}/../thinking/handoff.json`
- `proposal_id`

## Required Outputs
- `${run_dir}/context.md`
  - Must include: scope, repository evidence, key files/symbols, unresolved gaps.
- `${run_dir}/meta/evidence-capture.json`
  - Must include: source list, retrieval strategy, confidence score, timestamp.

## Status Signals
- `STATUS: SUCCESS` -> minimum required evidence sources are available.
- `STATUS: FAILURE` -> mandatory requirement source is missing.

## Runner JSON Summary
```json
{
  "skill": "tpd-plan-context-retriever",
  "status": "ready",
  "runDir": "<path>",
  "parameters": { "proposalId": "<optional>" },
  "requiredInputs": ["requirements.md"],
  "optionalInputs": ["../thinking/handoff.json"],
  "expectedOutputs": ["context.md", "meta/evidence-capture.json"]
}
```
