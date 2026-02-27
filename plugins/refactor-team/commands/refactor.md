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
    "SendMessage",
    "AskUserQuestion",
    "mcp__auggie-mcp__codebase-retrieval",
  ]
---

# Refactor Team Command

You are the **Lead** orchestrating a team-based refactoring pipeline with safety validation.

## Agent Type Restrictions

**CRITICAL**: You MUST ONLY invoke these agent types. Any other type is FORBIDDEN:

| Agent Name      | subagent_type                            | Purpose               |
| --------------- | ---------------------------------------- | --------------------- |
| smell-detector  | refactor-team:analysis:smell-detector    | Code smell detection  |
| refactorer      | refactor-team:execution:refactorer       | Safe code refactoring |
| safety-reviewer | refactor-team:validation:safety-reviewer | Regression validation |

## Workflow Phases

## Task Result Handling

Each `Task` call **blocks** until the teammate finishes and returns the result directly in the call response.

**FORBIDDEN — never do this:**
- MUST NOT call `TaskOutput` — this tool does not exist
- MUST NOT manually construct task IDs (e.g., `agent-name@worktree-id`)

**CORRECT — always use direct return:**
- The result comes from the `Task` call itself, no extra step needed

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

1. Spawn smell-detector:

   ```
   Task(
     name: "smell-detector",
     subagent_type: "refactor-team:analysis:smell-detector",
     prompt: "You are smell-detector analyzing code smells.

   ## Target
   ${target} with scope: ${scope}

   ## Instructions
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

   When done, output your findings summary."
   )
   ```

   The Task call blocks until smell-detector finishes. The result is returned directly.

2. Read `${run_dir}/smells-report.md`

3. **HARD STOP**: Ask user for confirmation:

   ```
   AskUserQuestion(
     question="Detected ${count} code smells. Review ${run_dir}/smells-report.md.
              Which categories should be fixed? (SAFE/CAREFUL/RISKY, or specific items)",
     context=[summary of findings]
   )
   ```

4. Parse user response and create refactoring batches based on confirmed scope.

### Phase 3: Refactoring Pipeline Team

**CRITICAL**: Use TeamCreate and inline orchestration (NOT supervisor pattern).

1. **Create team**:

   ```
   TeamCreate(
     team_name: "refactor-pipeline",
     description: "Batched refactoring pipeline for ${target}"
   )
   ```

2. **Execute batched refactoring** sequentially by risk level: SAFE first, then CAREFUL, then RISKY.

   Each batch consists of a refactorer followed by a safety-reviewer. Each `Task` call blocks until the teammate finishes, so the next step starts only after the previous completes.

   **Batch 1: SAFE — Refactor**

   ```
   Task(
     name: "refactorer-batch-1",
     subagent_type: "refactor-team:execution:refactorer",
     team_name: "refactor-pipeline",
     prompt: "You are refactorer-batch-1 on team refactor-pipeline.

   Your task: Refactor batch 1 (SAFE category).

   ## Smells to Fix
   {list_of_SAFE_findings}

   ## Safety Protocol
   - grep for references before removal
   - check dynamic imports
   - review git history

   ## Output
   Track changes in ${run_dir}/changes-log.md with format:
   ## Batch 1 (SAFE)
   - File: [path]
     - Action: [removed/modified]
     - Reason: [smell type]
     - LOC: [lines of code removed]

   ## Fix Loop Protocol
   If you receive a REFACTOR_ISSUE message:
   1. Parse the JSON
   2. Apply fix
   3. Send REFACTOR_FIXED response (max 2 rounds)

   When done, send a message to lead with your batch 1 summary."
   )
   ```

   **Batch 1: SAFE — Validate**

   ```
   Task(
     name: "safety-reviewer-batch-1",
     subagent_type: "refactor-team:validation:safety-reviewer",
     team_name: "refactor-pipeline",
     prompt: "You are safety-reviewer-batch-1 on team refactor-pipeline.

   Your task: Validate batch 1 (SAFE category) refactoring.

   ## Validation Steps
   1. Run tests: npm test (or project test command)
   2. Check TypeScript: tsc --noEmit
   3. Verify no broken imports

   ## Output
   Write to ${run_dir}/validation-log.md

   ## If Issues Found
   Send REFACTOR_ISSUE to refactorer-batch-1:
   {\"type\": \"REFACTOR_ISSUE\", \"batch\": 1, \"issue\": \"...\", \"affected_file\": \"...\", \"round\": 1}
   Wait for REFACTOR_FIXED response, then re-validate (max 2 rounds).

   ## Rollback Policy
   If 2 rounds fail: ROLLBACK batch (git restore) and report failure.

   When done, send a message to lead with validation results."
   )
   ```

   **Batch 2: CAREFUL — Refactor** (starts only after Batch 1 validation completes)

   ```
   Task(
     name: "refactorer-batch-2",
     subagent_type: "refactor-team:execution:refactorer",
     team_name: "refactor-pipeline",
     prompt: "You are refactorer-batch-2 on team refactor-pipeline.

   Your task: Refactor batch 2 (CAREFUL category).

   ## Smells to Fix
   {list_of_CAREFUL_findings}

   [same safety protocol and output format as batch 1, adjusted for batch 2]

   When done, send a message to lead with your batch 2 summary."
   )
   ```

   **Batch 2: CAREFUL — Validate**

   ```
   Task(
     name: "safety-reviewer-batch-2",
     subagent_type: "refactor-team:validation:safety-reviewer",
     team_name: "refactor-pipeline",
     prompt: "You are safety-reviewer-batch-2 on team refactor-pipeline.

   Your task: Validate batch 2 (CAREFUL category) refactoring.

   [same validation steps as batch 1, adjusted for batch 2]

   When done, send a message to lead with validation results."
   )
   ```

   Continue the same pattern for RISKY batch if user approved.

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

   Since each Task call blocks, the Lead naturally monitors progress between steps. If any batch validation fails after 2 rounds of fixes, skip that batch (rollback) and proceed to the next.

5. **Shutdown team**:
   ```
   TeamDelete()
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

   - All tests pass
   - No new TypeScript errors
   - No broken imports
   - DELETION_LOG complete

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
- Spawn teammates using Task tool with team_name parameter
- Rollback batch if 2 fix rounds fail
- Create backup branch before RISKY changes

## Error Handling

- **Smell detection fails**: Report to user, provide manual check guidance
- **Batch validation fails 2 rounds**: Rollback batch, continue to next batch
- **Tests fail after all batches**: Rollback all changes, report failure
- **User cancels during confirmation**: Clean up run directory, exit gracefully
