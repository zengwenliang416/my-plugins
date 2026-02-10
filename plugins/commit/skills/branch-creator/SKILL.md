---
name: branch-creator
description: |
  [Trigger] Commit workflow phase 3.5 to prepare or switch a working branch.
  [Output] `${run_dir}/branch-info.json` and selected branch state.
  [Skip] User explicitly keeps the current branch or `skip_branch=true`.
  [Ask] If already on a feature branch, ask whether to reuse or create another one.
  [Resource Usage] Read naming rules from `references/branch-naming.md` and execute `scripts/create-branch.ts`.
allowed-tools:
  - Bash
  - Read
  - Write
  - AskUserQuestion
arguments:
  - name: run_dir
    type: string
    required: true
    description: Runtime directory that stores workflow artifacts.
  - name: branch_name
    type: string
    required: false
    description: Optional explicit branch name.
  - name: skip_branch
    type: boolean
    required: false
    description: Skip branch creation and keep current branch.
---

# Branch Creator

## Script Entry

```bash
npx tsx scripts/create-branch.ts [args]
```

## Resource Usage

- Reference docs: `references/branch-naming.json`
- Execution script: `scripts/create-branch.ts`

## Input/Output

| Item | Value |
| --- | --- |
| Input | `${run_dir}/changes-analysis.json` and optional `branch_name` |
| Output | `${run_dir}/branch-info.json` |

## Naming Convention

- Preferred format: `<type>/<scope>-<description>`
- Allowed chars: lowercase letters, digits, `/`, `-`
- Suggested max length: 64
- Reference details: `references/branch-naming.json`

## Execution

1. Validate branch naming rules from `references/branch-naming.md`.
2. Execute:
   `npx ts-node --esm scripts/create-branch.ts --run-dir "${run_dir}" [--branch-name "${branch_name}"] [--skip-branch]`
3. Read `${run_dir}/branch-info.json` and continue workflow.

## Return

Return summary:
- target branch
- operation type (`created`, `switched`, `reused`, `skipped`)
- artifact path `${run_dir}/branch-info.json`
