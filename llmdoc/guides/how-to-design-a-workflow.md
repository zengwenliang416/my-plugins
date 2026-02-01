# How to Design a Workflow

A step-by-step guide for creating multi-phase workflow commands in ccg-workflows.

1. **Create Command File:** Add `plugins/{plugin}/commands/{name}.md` with YAML frontmatter:

   ```yaml
   ---
   description: "Brief workflow description"
   argument-hint: "[--flags] <required-args>"
   allowed-tools: [Task, Skill, AskUserQuestion, Read, Bash]
   ---
   ```

2. **Define Phase Flow:** Document phases as a visual flow diagram. Mark parallel phases with symbols and hard stops with `⏸️`:

   ```
   1   Initialize      → mkdir RUN_DIR
   2   Investigate     → Task("agent-a")
   3   Parallel Analyze                      PARALLEL
       ├─ Task("agent-b", run_in_background)
       └─ Task("agent-c", run_in_background)
   4   Synthesize      → Skill("synthesizer")
   5   Confirm         → AskUserQuestion ⏸️ HARD STOP
   ```

3. **Implement Run Directory:** Initialize with timestamp-based isolation:

   ```bash
   RUN_DIR=".claude/{plugin}/runs/$(date -u +%Y%m%dT%H%M%SZ)"
   mkdir -p ${RUN_DIR}
   ```

   Reference: `plugins/commit/commands/commit.md:62-64`

4. **Define Phase Details:** For each phase, specify:
   - **Tool call:** `Task(...)` for agents, `Skill(...)` for skills
   - **Input:** What artifacts it reads from `${RUN_DIR}`
   - **Output:** What artifacts it writes to `${RUN_DIR}`
   - **Execution:** Sequential vs `run_in_background=true` for parallel

5. **Add Hard Stops:** Insert `AskUserQuestion` at critical decision points:
   - After analysis completion (confirm approach)
   - Before destructive operations (confirm execution)
   - At workflow end (next action selection)
     Reference: `plugins/commit/commands/commit.md:121-124` - Phase 6 confirmation.

6. **Enable Resume Capability:** Support `--run-id` parameter to continue interrupted runs:
   - Check if `RUN_DIR` exists
   - Read `state.json` for completed phases
   - Skip to first pending phase
     Reference: `/llmdoc/architecture/workflow-orchestration.md` Section 5.

7. **Verify:** Test workflow execution:
   - Run full workflow to completion
   - Interrupt and resume with `--run-id`
   - Verify artifacts in `${RUN_DIR}`
