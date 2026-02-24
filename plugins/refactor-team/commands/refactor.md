---
description: "Team-based refactoring pipeline with code smell detection, safe refactoring, and regression validation"
argument-hint: "<target> [--dead-code] [--duplicates] [--complexity]"
allowed-tools:
  [
    "Task",
    "Read",
    "Write",
    "Edit",
    "Bash",
    "Glob",
    "Grep",
    "TeamCreate",
    "TeamDelete",
    "TaskCreate",
    "TaskUpdate",
    "TaskList",
    "TaskGet",
    "TaskOutput",
    "SendMessage",
    "AskUserQuestion",
    "mcp__auggie-mcp__codebase-retrieval",
  ]
---

# Refactor Team Command

You are the **Lead** orchestrating a team-based refactoring pipeline with safety validation.

## Agent Type Restrictions

**CRITICAL**: You MUST ONLY invoke these agent types. Any other type is FORBIDDEN:

| Agent Name      | subagent_type                 | Purpose               |
| --------------- | ----------------------------- | --------------------- |
| smell-detector  | refactor-team:smell-detector  | Code smell detection  |
| refactorer      | refactor-team:refactorer      | Safe code refactoring |
| safety-reviewer | refactor-team:safety-reviewer | Regression validation |

## Workflow Phases

### Phase 1: Init (Lead)

1. Create run directory:

   ```bash
   # Derive CHANGE_ID: kebab-case from refactor target
   # Examples: "refactor-auth-dead-code", "refactor-utils-duplicates"
   # Fallback: "refactor-$(date +%Y%m%d-%H%M%S)"
   CHANGE_ID="refactor-${slug_from_target}"
   run_dir="openspec/changes/${CHANGE_ID}"
   mkdir -p ${run_dir}
   ```

**OpenSpec scaffold** — write immediately after `mkdir`:

- `${run_dir}/proposal.md`: `# Change:` title, `## Why` (refactoring purpose), `## What Changes` (refactoring scope), `## Impact`
- `${run_dir}/tasks.md`: one numbered section per phase (Init, Analysis, Batched Refactoring, Validation, Delivery) with `- [ ]` items

Mark items `[x]` as each phase completes.

2. Parse arguments:
   - Extract `<target>` (file, directory, module name)
   - Parse flags: `--dead-code`, `--duplicates`, `--complexity`
   - Default scope: all code smells if no flags provided

3. Write `${run_dir}/input.md`:

   ```markdown
   # Refactoring Request

   **Target**: [parsed target]
   **Scope**: [code smells to detect]
   **Flags**: [provided flags]
   **Timestamp**: [ISO timestamp]
   ```

### Phase 2: Analysis (Task — NOT Team)

**CRITICAL**: Spawn smell-detector as a **Task**, NOT a Team.

1. Create detection task:

   ```
   TaskCreate(
     type="refactor-team:smell-detector",
     objective="Detect code smells in ${target} with scope: ${scope}",
     context={
       target: [parsed target],
       scope: [dead-code|duplicates|complexity|all],
       run_dir: ${run_dir}
     },
     instructions="
       1. Run detection tools (knip, depcheck, ts-prune as applicable)
       2. Categorize findings by risk: SAFE, CAREFUL, RISKY
       3. Write ${run_dir}/smells-report.md with:
          - Summary of findings
          - Risk-categorized smell list
          - Evidence for each finding
       4. Format:
          ## SAFE (Low Risk)
          - [Finding with evidence]

          ## CAREFUL (Medium Risk)
          - [Finding with evidence]

          ## RISKY (High Risk)
          - [Finding with evidence]
     "
   )
   ```

2. Wait for completion:

   ```
   output = TaskOutput(task_id, block=true)
   ```

3. Read `${run_dir}/smells-report.md`

4. **HARD STOP**: Ask user for confirmation:

   ```
   AskUserQuestion(
     question="Detected ${count} code smells. Review ${run_dir}/smells-report.md.
              Which categories should be fixed? (SAFE/CAREFUL/RISKY, or specific items)",
     context=[summary of findings]
   )
   ```

5. Parse user response and create refactoring batches based on confirmed scope.

### Phase 3: Refactoring Pipeline Team

**CRITICAL**: Use TeamCreate and inline orchestration (NOT supervisor pattern).

1. **Create team**:

   ```
   team_id = TeamCreate("refactor-pipeline")
   ```

2. **Create batched tasks** (example for 3 batches):

   Batch by risk level: SAFE first, then CAREFUL, then RISKY.

   ```
   task_1 = TaskCreate(
     type="refactor-team:refactorer",
     objective="Refactor batch 1: SAFE category",
     context={
       batch_id: 1,
       risk_level: "SAFE",
       smells: [list of SAFE findings],
       run_dir: ${run_dir}
     },
     instructions="
       1. Apply refactoring for each smell in batch
       2. Safety protocol:
          - grep for references before removal
          - check dynamic imports
          - review git history
       3. Track changes in ${run_dir}/changes-log.md
       4. Handle REFACTOR_ISSUE messages (max 2 rounds)
       5. Format changes as:
          ## Batch 1 (SAFE)
          - File: [path]
            - Action: [removed/modified]
            - Reason: [smell type]
            - LOC: [lines of code removed]
     "
   )

   task_2 = TaskCreate(
     type="refactor-team:safety-reviewer",
     objective="Validate batch 1: SAFE category",
     context={
       batch_id: 1,
       risk_level: "SAFE",
       run_dir: ${run_dir}
     },
     depends_on=[task_1],
     instructions="
       1. Run tests: npm test (or project test command)
       2. Check TypeScript: tsc --noEmit
       3. Verify no broken imports: grep -r 'Cannot find module'
       4. Write ${run_dir}/validation-log.md
       5. If issues found:
          - SendMessage to refactorer:
            {type: 'REFACTOR_ISSUE', batch: 1, issue: '...', affected_file: '...', round: 1}
          - Wait for REFACTOR_FIXED response
          - Re-validate (max 2 rounds)
       6. If 2 rounds fail: ROLLBACK batch (git restore)
       7. If all pass: Approve batch
     "
   )

   task_3 = TaskCreate(
     type="refactor-team:refactorer",
     objective="Refactor batch 2: CAREFUL category",
     context={
       batch_id: 2,
       risk_level: "CAREFUL",
       smells: [list of CAREFUL findings],
       run_dir: ${run_dir}
     },
     depends_on=[task_2],
     instructions=[same as task_1, adjusted for batch 2]
   )

   task_4 = TaskCreate(
     type="refactor-team:safety-reviewer",
     objective="Validate batch 2: CAREFUL category",
     context={
       batch_id: 2,
       risk_level: "CAREFUL",
       run_dir: ${run_dir}
     },
     depends_on=[task_3],
     instructions=[same as task_2, adjusted for batch 2]
   )

   # ... continue for RISKY batch if user approved
   ```

3. **Structured fix loop protocol**:

   When safety-reviewer finds regressions:

   ```json
   {
     "type": "REFACTOR_ISSUE",
     "batch": 1,
     "issue": "Test auth.test.ts now fails: Cannot find module 'auth'",
     "affected_file": "src/auth.ts",
     "round": 1
   }
   ```

   Refactorer responds:

   ```json
   {
     "type": "REFACTOR_FIXED",
     "batch": 1,
     "fix": "Restored export of authenticate function",
     "round": 1
   }
   ```

   **Rollback policy**: If round 2 also fails, rollback entire batch.

4. **Monitor pipeline**:

   ```
   while pipeline_running:
     status = TaskList(team_id)
     if any task failed:
       handle_failure()
     if all tasks completed:
       break
   ```

5. **Shutdown team**:
   ```
   TeamDelete(team_id)
   ```

### Phase 4: Delivery (Lead)

1. **Compile DELETION_LOG**:

   Read `${run_dir}/changes-log.md` and create:

   ```markdown
   # Deletion Log

   **Run ID**: ${RUN_ID}
   **Target**: [target]
   **Date**: [ISO timestamp]

   ## Summary

   - Files deleted: X
   - Lines of code removed: Y
   - Exports cleaned: Z
   - Dependencies removed: W

   ## Files Deleted

   - path/to/file1.ts (Reason: unused, LOC: 45)
   - path/to/file2.ts (Reason: duplicate, LOC: 23)

   ## Exports Removed

   - src/auth.ts: `unusedHelper()` (Reason: no references)

   ## Dependencies Removed

   - lodash (Reason: unused, replaced with native methods)

   ## Modified Files

   - src/index.ts: Removed 3 unused imports
   ```

   Write to `${run_dir}/DELETION_LOG.md`

2. **Verify tests**:

   ```bash
   npm test
   # MUST pass with no new failures
   ```

3. **Write refactor report**:

   ```markdown
   # Refactor Report

   **Run ID**: ${RUN_ID}
   **Status**: SUCCESS | PARTIAL | FAILED
   **Target**: [target]
   **Date**: [ISO timestamp]

   ## Batches Completed

   1. Batch 1 (SAFE): X smells fixed, 0 regressions
   2. Batch 2 (CAREFUL): Y smells fixed, 1 regression fixed in round 1
   3. Batch 3 (RISKY): Skipped (user declined)

   ## Quality Gates

   - ✅ All tests pass
   - ✅ No new TypeScript errors
   - ✅ No broken imports
   - ✅ DELETION_LOG complete

   ## Artifacts

   - Input: ${run_dir}/input.md
   - Smells: ${run_dir}/smells-report.md
   - Changes: ${run_dir}/changes-log.md
   - Validation: ${run_dir}/validation-log.md
   - Deletions: ${run_dir}/DELETION_LOG.md

   ## Recommendations

   - Review DELETION_LOG before merging
   - Run integration tests
   - Update documentation if public APIs changed
   ```

   Write to `${run_dir}/refactor-report.md`

4. **Output summary to user**:

   ```
   Refactoring complete!

   Run ID: ${RUN_ID}
   Batches: X completed, Y rolled back
   Files deleted: Z
   LOC removed: W

   Review: ${run_dir}/refactor-report.md
   Deletions: ${run_dir}/DELETION_LOG.md

   Next steps:
   1. Review DELETION_LOG
   2. Run integration tests
   3. Commit changes
   ```

## Constraints

**MUST NOT**:

- Invoke agent types outside the restriction table
- Skip user confirmation after smell detection
- Proceed to next batch if validation fails 2 rounds
- Delete files without grep-based reference checks
- Mix batches (SAFE and RISKY in same batch)

**MUST**:

- Batch refactoring by risk level (SAFE → CAREFUL → RISKY)
- Validate after each batch before proceeding
- Create DELETION_LOG.md for all removals
- Use TaskOutput(block=true) — no timeout
- Rollback batch if 2 fix rounds fail
- Create backup branch before RISKY changes

## Error Handling

- **Smell detection fails**: Report to user, provide manual check guidance
- **Batch validation fails 2 rounds**: Rollback batch, continue to next batch
- **Tests fail after all batches**: Rollback all changes, report failure
- **User cancels during confirmation**: Clean up run directory, exit gracefully
