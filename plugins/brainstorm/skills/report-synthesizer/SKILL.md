---
name: report-synthesizer
description: |
  [Trigger] Brainstorm Phase 4: Generate final report
  [Output] ${run_dir}/brainstorm-report.md
  [Skip] evaluation.md does not exist
  [Ask] Report format preference (brief/detailed)
allowed-tools:
  - Read
  - Write
  - AskUserQuestion
  - mcp__sequential-thinking__sequentialthinking
  - mcp__auggie-mcp__codebase-retrieval
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---

# Report Synthesizer

Consolidate all phase artifacts and generate structured final brainstorm report.

## MCP Tool Integration

| Tool                  | Purpose                                       | Required |
| --------------------- | --------------------------------------------- | -------- |
| `sequential-thinking` | Structure report content, ensure logical flow | Yes      |
| `auggie-mcp`          | Verify technical proposals against codebase   | Yes      |
| `context7`            | Supplement best practice recommendations      | Yes      |

## Parameters

| Param   | Type   | Required | Description                                      |
| ------- | ------ | -------- | ------------------------------------------------ |
| run_dir | string | Yes      | Run directory path                               |
| format  | string | No       | Report format (brief/detailed), default detailed |

## Prerequisites

1. Verify required files exist:
   - `${run_dir}/research-brief.md` (optional if --skip-research)
   - `${run_dir}/ideas-pool.md`
   - `${run_dir}/evaluation.md`
2. If evaluation.md missing, prompt user to run idea-evaluator first

## Workflow

### Step 1: Read All Artifacts

```bash
research_brief=$(cat "${run_dir}/research-brief.md" 2>/dev/null || echo "")
ideas_pool=$(cat "${run_dir}/ideas-pool.md")
evaluation=$(cat "${run_dir}/evaluation.md")
```

### Step 2: Extract Key Information

**From research-brief.md:** Core problem, key trends (3-5), important cases (3-5), cross-domain insights
**From ideas-pool.md:** Total count, source distribution, category stats
**From evaluation.md:** Top 5 details, mindmap code, quadrant code, group stats

### Step 3: Determine Report Format

If format param missing, use AskUserQuestion:

- **brief**: Concise version (quick sharing)
- **detailed**: Full version (deep analysis)

### Step 3.1: Report Planning (sequential-thinking)

**Required MCP call:**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Plan brainstorm report. Format: {format}. Need to integrate research, ideas, evaluation phases.",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**Focus areas:** Content inventory -> Core insights -> Narrative logic (problem->findings->ideas->solutions) -> Visualization plan -> Action-oriented ending

### Step 3.2: Technical Proposal Verification (auggie-mcp)

```
mcp__auggie-mcp__codebase-retrieval({
  information_request: "Verify Top 5 proposals against codebase:
  Proposals: {top_5_ideas}
  Analyze: 1. Technical feasibility 2. Modules to modify 3. Potential risks"
})
```

### Step 3.3: Best Practices Supplement (context7)

```
mcp__context7__resolve-library-id({
  libraryName: "{primary_technology}",
  query: "implementation best practices"
})

mcp__context7__query-docs({
  libraryId: "{resolved_library_id}",
  query: "{top_idea} best practices, recommended patterns, considerations"
})
```

### Step 4: Generate Report

Use template from references/report-template.md based on selected format.

### Step 5: Write File

```bash
write "${run_dir}/brainstorm-report.md" "${report_content}"
```

## Output Formats

### brief (Concise)

~500-800 words:

- One-paragraph summary
- Top 3 proposals (brief description)
- Next steps checklist

Use for: Quick reports, email sharing, initial discussions

### detailed (Full)

~2000-3000 words:

- Executive summary
- Research findings
- Ideas category overview
- Detailed evaluation results
- Top 5 deep analysis
- Risks and blind spots
- Phased action plan
- Appendix (full data)

Use for: Formal proposals, project initiation, deep review

## Output Validation

Confirm:

- `${run_dir}/brainstorm-report.md` exists
- Format matches selected template
- Key info complete (topic, idea count, Top proposals)
- Mermaid code correctly embedded
