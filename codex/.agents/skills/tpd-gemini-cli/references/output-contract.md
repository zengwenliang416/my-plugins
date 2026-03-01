# Output Contract

## Script

- Entry: `scripts/run-tpd-gemini-cli.ts`
- Invocation:
  - `npx tsx scripts/run-tpd-gemini-cli.ts --role <role> --prompt <text> [--mode <analyze|prototype>] [--focus <text>] [--run_dir <dir>]`

## Inputs

- Required arguments
  - `role: constraint-analyst | architect | implementer | auditor`
  - `prompt: string`
- Conditional arguments
  - `mode: analyze | prototype` (required when `role=implementer`)
- Optional arguments
  - `focus: string`
  - `run_dir: string` (default: `.`)

## Stdout (JSON)

```json
{
  "skill": "tpd-gemini-cli",
  "status": "ready",
  "inputs": {
    "role": "architect",
    "mode": null,
    "focus": null,
    "run_dir": "."
  },
  "command": [
    "npx",
    "tsx",
    "scripts/invoke-gemini.ts"
  ],
  "artifact": "./gemini-architect.md"
}
```

## Stderr and Exit Codes

- `1`: invalid argument or invalid role
- `2`: missing mode for implementer role
