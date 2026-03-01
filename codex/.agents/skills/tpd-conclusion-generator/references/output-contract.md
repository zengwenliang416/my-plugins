# Output Contract

## Script

- Entry: `scripts/run-tpd-conclusion-generator.ts`
- Invocation:
  - `npx tsx scripts/run-tpd-conclusion-generator.ts --run_dir <dir>`

## Inputs

- Required arguments
  - `run_dir: string`
- Required files
  - `${run_dir}/synthesis.md`
- Optional files
  - `${run_dir}/clarifications.md`

## Stdout (JSON)

```json
{
  "skill": "tpd-conclusion-generator",
  "status": "ready",
  "inputs": {
    "run_dir": "<dir>",
    "synthesis": "<dir>/synthesis.md",
    "clarifications": "<dir>/clarifications.md"
  },
  "outputs": [
    "<dir>/conclusion.md"
  ],
  "open_questions": []
}
```

## Stderr and Exit Codes

- `1`: invalid argument
- `2`: missing synthesis file
