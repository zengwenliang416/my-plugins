---
name: workflow-memory
description: |
  Archive and recall workflow execution state for resumable multi-step operations.
  [Trigger] Long-running workflow interrupted or user wants to resume previous work.
  [Output] .claude/memory/workflows/${id}.json (save) or restored state (load).
  [Skip] When workflow is short-lived and doesn't need persistence.
  [Ask] Action to perform (save, load, list, cleanup) if not specified.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
arguments:
  - name: run_dir
    type: string
    required: false
    description: Run directory to archive or resume from
  - name: action
    type: string
    required: true
    description: "save, load, list, or cleanup"
  - name: workflow_id
    type: string
    required: false
    description: Specific workflow ID for load/cleanup
---

# workflow-memory

## Purpose

Manage workflow execution state: save snapshots for resumability, load previous state to continue interrupted workflows, and clean up completed workflow artifacts.

## Actions

| Action    | Description                         | Required Args                  |
| --------- | ----------------------------------- | ------------------------------ |
| `save`    | Archive current workflow state      | `run_dir`                      |
| `load`    | Restore workflow state from archive | `workflow_id`                  |
| `list`    | List all archived workflows         | none                           |
| `cleanup` | Remove old workflow archives        | `workflow_id` or age threshold |

## Steps

### action=save

1. Read `${run_dir}/` contents to identify workflow artifacts.
2. Create workflow snapshot:

```json
{
  "id": "wf-{timestamp}",
  "saved_at": "ISO-8601",
  "run_dir": "openspec/changes/my-change/",
  "status": "in_progress",
  "phase": "doc-generation",
  "completed_steps": ["module-discovery", "layer-3-docs"],
  "pending_steps": ["layer-2-docs", "layer-1-docs", "audit"],
  "artifacts": [
    {
      "name": "modules.json",
      "path": "openspec/changes/my-change/modules.json"
    }
  ],
  "resume_command": "/context-memory:memory claude-update full --run-id my-change"
}
```

3. Write to `.claude/memory/workflows/${id}.json`.

### action=load

4. Read `.claude/memory/workflows/${workflow_id}.json`.
5. Verify referenced artifacts still exist.
6. If artifacts missing, flag and report which steps need re-execution.
7. Output the workflow state for the orchestrating command to resume.

### action=list

8. Scan `.claude/memory/workflows/*.json` using `Glob`.
9. For each workflow, extract id, status, phase, and saved_at.
10. Present as sorted table (newest first):

```
| ID | Status | Phase | Saved At |
| wf-20260214 | in_progress | doc-generation | 2026-02-14 |
| wf-20260213 | completed | audit | 2026-02-13 |
```

### action=cleanup

11. If `workflow_id` specified, delete that archive.
12. If not specified, delete archives older than 7 days with status `completed`.
13. Report what was cleaned up.

## Verification

- save: Archive JSON exists and references valid artifacts.
- load: Workflow state is valid and resume command is actionable.
- list: All archives are readable and properly formatted.
- cleanup: Only completed or specified archives removed; in-progress preserved.
