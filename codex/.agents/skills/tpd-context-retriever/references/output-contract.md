# Output Contract

## Script

- Entry: `scripts/run-tpd-context-retriever.ts`
- Invocation:
  - `npx tsx scripts/run-tpd-context-retriever.ts --run_dir <dir> [--mode <full|incremental>] [--base_context <path>]`

## Inputs

- Required arguments
  - `run_dir: string`
- Optional arguments
  - `mode: full | incremental` (default: `full`)
  - `base_context: string` (required when `mode=incremental`)
- Required files
  - `${run_dir}/tasks.md`

## Stdout (JSON)

```json
{
  "skill": "tpd-context-retriever",
  "status": "ready",
  "inputs": {
    "run_dir": "<dir>",
    "mode": "full",
    "base_context": null
  },
  "scope": "<dir>/tasks.md",
  "outputs": [
    "<dir>/context.md"
  ]
}
```

## Stderr and Exit Codes

- `1`: invalid argument
- `2`: invalid mode or missing required mode-specific argument
- `3`: missing task scope input
