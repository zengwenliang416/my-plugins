---
name: session-compactor
description: |
  Compact session insights into persistent memory files.
  [Trigger] End of a coding session with decisions, corrections, or patterns worth saving.
  [Output] .claude/memory/sessions/{id}.json with categorized insights.
  [Skip] When session had no extractable insights (pure Q&A, no decisions).
  [Ask] Whether to also update style or workflow memory from session findings.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
arguments:
  - name: run_dir
    type: string
    required: false
    description: Run directory containing session artifacts
  - name: session_id
    type: string
    required: false
    description: Specific session to compact (defaults to current)
---

# session-compactor

## Purpose

Extract durable insights from a coding session and persist them to structured memory files. Prevents knowledge loss between sessions.

## What Gets Compacted

| Source                 | Target                               | Content                            |
| ---------------------- | ------------------------------------ | ---------------------------------- |
| User corrections       | `.claude/memory/sessions/{id}.json`  | Preferences, patterns user prefers |
| Resolved issues        | `.claude/memory/sessions/{id}.json`  | Bug patterns, solutions found      |
| Architecture decisions | `.claude/memory/sessions/{id}.json`  | Design choices with rationale      |
| Style preferences      | `.claude/memory/styles/{pkg}.json`   | Code style patterns if detected    |
| Workflow patterns      | `.claude/memory/workflows/{id}.json` | Recurring task sequences           |

## Steps

### Phase 1: Session Analysis

1. If `run_dir` provided, scan `${run_dir}/` for artifacts.
2. If `session_id` provided, read `.claude/memory/sessions/${session_id}.json`.
3. Otherwise, analyze current conversation context for:
   - User corrections (things the user asked to change or redo)
   - Architecture decisions made during the session
   - Patterns the user explicitly stated as preferences
   - Problems solved and their solutions

### Phase 2: Extraction

4. Categorize extracted insights:
   - **Corrections**: "User prefers X over Y" → preference memory
   - **Decisions**: "Chose JWT over sessions because..." → decision log
   - **Solutions**: "Fixed auth bug by..." → solution patterns
   - **Preferences**: "Always use bun, not npm" → workflow preferences

### Phase 3: Persistence

5. Ensure `.claude/memory/sessions/` directory exists.
6. Write session snapshot:

```json
{
  "id": "session-{timestamp}",
  "timestamp": "ISO-8601",
  "task_summary": "What was worked on",
  "insights": [
    {
      "type": "preference",
      "content": "Use single quotes",
      "confidence": "high"
    },
    {
      "type": "decision",
      "content": "JWT for auth",
      "rationale": "Stateless scaling"
    },
    {
      "type": "solution",
      "content": "Fix circular dep by...",
      "context": "src/auth"
    }
  ],
  "files_touched": ["src/auth/middleware.ts", "src/config/jwt.ts"],
  "duration_estimate": "45min"
}
```

7. If style-related insights found, append to `.claude/memory/styles/{pkg}.json`.
8. If workflow patterns found, append to `.claude/memory/workflows/{id}.json`.

### Phase 4: Deduplication

9. Read existing sessions and deduplicate insights.
10. Merge conflicting preferences (latest wins, log conflict).

## Verification

- Session JSON exists at expected path.
- Insights array is non-empty (warn if session had no extractable insights).
- No duplicate insights across sessions.
