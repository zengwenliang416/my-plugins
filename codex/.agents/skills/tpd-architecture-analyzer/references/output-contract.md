# Output Contract

## Script

- Entry: `scripts/run-tpd-architecture-analyzer.ts`
- Invocation:
  - `npx tsx scripts/run-tpd-architecture-analyzer.ts --run_dir <dir> [--task_type <fullstack|frontend|backend>]`

## Inputs

- Required arguments
  - `run_dir: string`
- Optional arguments
  - `task_type: fullstack | frontend | backend` (default: `fullstack`)
- Required files
  - `${run_dir}/requirements.md`
  - `${run_dir}/context.md`
  - `${run_dir}/codex-plan.md` (for `backend`, `fullstack`)
  - `${run_dir}/gemini-plan.md` (for `frontend`, `fullstack`)

## Stdout (JSON)

```json
{
  "skill": "tpd-architecture-analyzer",
  "status": "ready",
  "inputs": {
    "run_dir": "<dir>",
    "task_type": "fullstack"
  },
  "required_inputs": [
    "<dir>/requirements.md",
    "<dir>/context.md"
  ],
  "outputs": [
    "<dir>/architecture.md",
    "<dir>/constraints.md"
  ]
}
```

## Stderr and Exit Codes

- `1`: invalid argument or invalid task type
- `2`: missing required input files
