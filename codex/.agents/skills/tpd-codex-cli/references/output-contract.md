# Output Contract

## Script

- Entry: `scripts/run-tpd-codex-cli.ts`
- Invocation:
  - `npx tsx scripts/run-tpd-codex-cli.ts --role <role> --prompt <text> [--mode <analyze|prototype>] [--focus <text>] [--run_dir <dir>]`

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
  "skill": "tpd-codex-cli",
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
    "scripts/invoke-codex.ts"
  ],
  "artifact": "./codex-architect.md"
}
```

## Stderr and Exit Codes

- `1`: invalid argument or invalid role
- `2`: missing mode for implementer role
