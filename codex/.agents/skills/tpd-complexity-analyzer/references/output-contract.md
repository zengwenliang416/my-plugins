# Output Contract

## Script

- Entry: `scripts/run-tpd-complexity-analyzer.ts`
- Invocation:
  - `npx tsx scripts/run-tpd-complexity-analyzer.ts --run_dir <dir>`

## Inputs

- Required arguments
  - `run_dir: string`
- Required files
  - `${run_dir}/input.md`

## Stdout (JSON)

```json
{
  "skill": "tpd-complexity-analyzer",
  "status": "ready",
  "inputs": {
    "run_dir": "<dir>",
    "input": "<dir>/input.md"
  },
  "score": 5,
  "depth": "deep",
  "needs_confirmation": true,
  "output": "<dir>/complexity-analysis.md"
}
```

## Stderr and Exit Codes

- `1`: invalid argument
- `2`: missing input file
