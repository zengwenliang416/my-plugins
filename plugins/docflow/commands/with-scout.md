---
description: "Handle complex tasks with Agent Team workflow (investigate → synthesize → execute)"
argument-hint: "[A complex goal or task]"
allowed-tools:
  - Task
  - TeamCreate
  - TeamDelete
  - TaskCreate
  - TaskOutput
  - TaskList
  - TaskGet
  - TaskUpdate
  - SendMessage
  - Read
  - Glob
  - Grep
  - Bash
  - Write
  - Edit
  - AskUserQuestion
---

# /with-scout

For complex requests, run investigation first, then execute with evidence.

## Agent Type Restrictions

You MUST ONLY invoke these agent types in this command.

| Agent Name   | subagent_type        | Purpose                                     |
| ------------ | -------------------- | ------------------------------------------- |
| investigator | docflow:investigator | Multi-angle evidence gathering and analysis |
| worker       | docflow:worker       | Deterministic execution from approved plan  |

## Team Communication Protocol

All team collaboration MUST use structured `SendMessage` payloads.

1. `INVESTIGATION_READY` (investigator -> lead)
   ```json
   {
     "type": "INVESTIGATION_READY",
     "question_id": "q1",
     "question": "How auth works end-to-end?",
     "evidence": ["src/auth/service.ts:12", "llmdoc/architecture/auth.md"],
     "conclusion": "JWT validation in middleware",
     "confidence": 0.86,
     "gaps": []
   }
   ```
2. `INVESTIGATION_REVIEW_REQUEST` (lead -> investigator)
   - Ask investigator A to verify investigator B's finding.
3. `INVESTIGATION_REVIEW_RESULT` (investigator -> lead)
   ```json
   {
     "type": "INVESTIGATION_REVIEW_RESULT",
     "question_id": "q1",
     "review_target": "q2",
     "status": "confirm|challenge",
     "notes": ["missing cache invalidation path"]
   }
   ```
4. `EXECUTION_PLAN_SHARED` (lead -> worker)
   - Provide objective, context bundle, and ordered steps.
5. `EXECUTION_RESULT` (worker -> lead)
   ```json
   {
     "type": "EXECUTION_RESULT",
     "status": "COMPLETED|FAILED",
     "summary": "Applied patch and ran tests",
     "artifacts": ["src/service.ts", "tests/service.test.ts"],
     "blocking_issues": []
   }
   ```
6. `EXECUTION_FIX_REQUEST` / `EXECUTION_FIX_APPLIED`
   - Used for bounded correction loop after lead validation.
   - Max 2 rounds, unresolved issues escalate to user.

## Actions

1. **Step 1: Deconstruct goal**
   - Split the request into independently investigable questions.

2. **Step 2: Create Agent Team**
   - Create one team for this workflow:
     ```
     TeamCreate("docflow-scout-team")
     ```

3. **Step 3: Parallel investigation**
   - Launch multiple `TaskCreate` tasks using `subagent_type: "docflow:investigator"`.
   - One task should own one focused question.
   - Each investigator returns a focused markdown report.
   - Each investigator MUST send `INVESTIGATION_READY` to lead after report completion.
   - Wait for all investigation tasks:
     ```
     TaskOutput(task_id, block=true)  # no timeout
     ```

4. **Step 4: Investigation cross-validation**
   - Use `INVESTIGATION_REVIEW_REQUEST` to assign peer verification for key findings.
   - Collect `INVESTIGATION_REVIEW_RESULT` from all reviewers.
   - Resolve direct conflicts before synthesis.

5. **Step 5: Synthesize findings**
   - Merge findings, identify conflicts/gaps, and form a coherent system view.

6. **Step 6: Decide iterate or execute**
   - If evidence insufficient: ask a narrower next-round investigation.
   - Additional rounds must still use `docflow:investigator` tasks in the same team.
   - If evidence sufficient: proceed to execution plan.

7. **Step 7: Execute with worker**
   - Share execution package with `EXECUTION_PLAN_SHARED`.
   - Create one or more execution tasks via `TaskCreate` using `subagent_type: "docflow:worker"`.
   - Each worker must receive:
     - objective
     - context
     - ordered execution steps
   - Require `EXECUTION_RESULT` from each worker.
   - Wait for all worker tasks with `TaskOutput(..., block=true)`.

8. **Step 8: Execution fix loop (if needed)**
   - If lead detects blocking issues, send `EXECUTION_FIX_REQUEST` with exact deltas.
   - Worker replies with `EXECUTION_FIX_APPLIED`.
   - Max 2 rounds. If still unresolved, escalate to user with explicit options.

9. **Step 9: Final report**
   - Summarize investigation path, key evidence, and execution results.

10. **Step 10: Shutdown Team**
   - Optionally send `shutdown_request` to active teammates.
   - Tear down team resources:
     ```
     TeamDelete("docflow-scout-team")
     ```
