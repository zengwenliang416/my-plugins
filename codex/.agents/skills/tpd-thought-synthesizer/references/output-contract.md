# Output Contract

## Required Inputs
- At least one `${run_dir}/explore-*.json`
- `depth` in `light|deep|ultra`

## Optional Inputs
- `${run_dir}/codex-thought.md`
- `${run_dir}/gemini-thought.md`

## Required Outputs
- `${run_dir}/synthesis.md`
  - Must include: hard constraints, soft constraints, risks, dependencies, success criteria, open questions.
  - Detail level must align with `depth`.

## Status Signals
- `STATUS: SUCCESS` -> depth is valid and explore evidence is present.
- `STATUS: FAILURE` -> no exploration evidence or invalid depth.

## Runner JSON Summary
```json
{
  "skill": "tpd-thought-synthesizer",
  "status": "ready",
  "runDir": "<path>",
  "parameters": { "depth": "deep" },
  "exploreArtifacts": ["explore-boundary-a.json"],
  "optionalInputs": ["codex-thought.md", "gemini-thought.md"],
  "expectedOutputs": ["synthesis.md"]
}
```
