# Output Contract

## Script

- Entry: `scripts/run-tpd-code-implementer.ts`
- Invocation:
  - `npx tsx scripts/run-tpd-code-implementer.ts --run_dir <dir> [--constraints_ref <path>] [--pbt_ref <path>]`

## Inputs

- Required arguments
  - `run_dir: string`
- Optional arguments
  - `constraints_ref: string`
  - `pbt_ref: string`
- Required files
  - At least one of:
    - `${run_dir}/prototype-codex.diff`
    - `${run_dir}/prototype-gemini.diff`

## Stdout (JSON)

```json
{
  "skill": "tpd-code-implementer",
  "status": "ready",
  "inputs": {
    "run_dir": "<dir>",
    "constraints_ref": "<optional>",
    "pbt_ref": "<optional>"
  },
  "selected_diffs": [
    "<dir>/prototype-codex.diff"
  ],
  "outputs": [
    "<dir>/changes.md"
  ]
}
```

## Stderr and Exit Codes

- `1`: invalid argument
- `2`: no prototype diff found
- `3`: optional reference path is provided but missing
