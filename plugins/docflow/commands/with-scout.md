---
description: "Handle complex tasks with investigate → synthesize → execute workflow"
argument-hint: "[A complex goal or task]"
allowed-tools: [Task, Read, Glob, Grep, Bash, Write, Edit, AskUserQuestion]
---

# /with-scout

For complex requests, run investigation first, then execute with evidence.

## Actions

1. **Step 1: Deconstruct goal**
   - Split the request into independently investigable questions.

2. **Step 2: Parallel investigation**
   - Launch multiple `investigator` agents via `Task`.
   - Each investigator returns a focused markdown report.

3. **Step 3: Synthesize findings**
   - Merge findings, identify conflicts/gaps, and form a coherent system view.

4. **Step 4: Decide iterate or execute**
   - If evidence insufficient: ask a narrower next-round investigation.
   - If evidence sufficient: proceed to execution plan.

5. **Step 5: Execute with worker**
   - Use `worker` agents to implement the final action.

6. **Step 6: Final report**
   - Summarize investigation path, key evidence, and execution results.
