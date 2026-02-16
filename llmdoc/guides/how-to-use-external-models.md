# How to Use External Models (Codex/Gemini)

Invoke external AI models via `codeagent-wrapper` CLI for specialized analysis tasks.

1. **Build the prompt** with role context, task description, and JSON output schema. Reference `plugins/brainstorm/skills/codex-cli/SKILL.md:43-69` for template structure.

2. **Invoke the model** using codeagent-wrapper:

   ```bash
   codeagent-wrapper codex \
     --role brainstorm \
     --prompt "$PROMPT" \
     --sandbox read-only
   ```

   For Gemini, replace `codex` with `gemini`. Omit `--sandbox` for Gemini unless context requires it.

3. **Select the appropriate role** based on task:
   - Codex: `brainstorm`, `analyzer`, `architect`, `planner`
   - Gemini: `brainstorm`, `designer`, `frontend`, `component-analyst`

4. **Use session management** for multi-turn Gemini conversations:

   ```bash
   codeagent-wrapper gemini \
     --role designer \
     --prompt "$PROMPT" \
     --session "$SESSION_ID"
   ```

   Record `SESSION_ID` from response for continuation.

5. **Parse structured output** from the model response. Expect JSON arrays or Unified Diff format. Reference `plugins/brainstorm/skills/codex-cli/SKILL.md:97-109` for JSON schema.

6. **For parallel execution**, use Task tool with background mode:
   ```
   Task(prompt="...", run_in_background=true)
   ```
   Wait for both tasks to complete before calling synthesizer skill.

**Verification:** Model output should be valid JSON or diff. If unstructured text is returned, the prompt requires refinement.
