Always answer in 简体中文

<system-reminder>

<always-step-one>
**STEP ONE IS ALWAYS: READ LLMDOC!**

Before doing ANYTHING else, you MUST:

1. Check if `llmdoc/` directory exists in the project root
2. If exists, read `llmdoc/index.md` first
3. Read ALL documents in `llmdoc/overview/`
4. Read at least 3+ relevant documents before taking any action

This is NON-NEGOTIABLE. Documentation first, code second.
</always-step-one>

<llmdoc-structure>

- llmdoc/index.md: The main index document. Always read this first.
- llmdoc/overview/: For high-level project context. Answers "What is this project?".
- llmdoc/guides/: For step-by-step operational instructions. Answers "How do I do X?".
- llmdoc/architecture/: For how the system is built (the "LLM Retrieval Map").
- llmdoc/reference/: For detailed factual lookup (API specs, models, conventions).

ATTENTION: `llmdoc` is always located in the project root (`projectRootPath/llmdoc/**`).
If `llmdoc/` does not exist, ignore llmdoc-related requirements for this project.

</llmdoc-structure>

<available-skills>

The following commands/skills are available in docflow:

| Skill/Command | Trigger | Description |
| --- | --- | --- |
| `/docflow:init-doc` | "init llmdoc", "initialize docs", "初始化文档" | Initialize llmdoc for a new project |
| `/docflow:with-scout` | "investigate first", "先调研再执行", "复杂任务" | Investigation-first execution workflow |
| `/docflow:what` | "clarify request", "需求不清晰", "先澄清" | Clarify vague requests with options |
| `/investigate` | "what is", "how does X work", "analyze" | Quick doc-first codebase investigation |
| `/read-doc` | "understand project", "read docs" | Read llmdoc and summarize project |
| `/update-doc` | "update docs", "sync documentation" | Update llmdoc after code changes |
| `/doc-workflow` | "documentation workflow", "how to document" | Explain llmdoc workflow |
| `/commit` | "commit", "save changes", "wrap up" | Generate and execute commit message |

</available-skills>

<tool-usage-extension>

- For quick investigation, prefer `/investigate`.
- For complex multi-step work, prefer `/docflow:with-scout`.
- Use `investigator` agent for deep analysis and `worker` agent for deterministic execution.
- Use Agent Team orchestration for `/docflow:init-doc` and `/docflow:with-scout`.
- Follow `always-step-one` before any investigation/execution.

</tool-usage-extension>

<agent-team-mode>

Docflow now runs in Claude Code Agent Team mode for multi-agent workflows.

## Team Lifecycle (mandatory)

1. Create team first: `TeamCreate("<docflow-team-name>")`
2. Create per-agent tasks with explicit `subagent_type`
3. Wait using `TaskOutput(..., block=true)` (NO timeout)
4. Send shutdown signals if needed
5. Delete team: `TeamDelete("<docflow-team-name>")`

## Allowed subagent types

- `docflow:scout`
- `docflow:recorder`
- `docflow:investigator`
- `docflow:worker`

Do NOT use other subagent types in docflow commands.

## Communication protocol (mandatory)

All inter-agent coordination MUST use structured `SendMessage` JSON.

### init-doc message types

- `SCOUT_REPORT_READY`
- `SCOUT_CROSSCHECK_REQUEST`
- `SCOUT_CROSSCHECK_RESULT`
- `DOC_PLAN_READY`
- `DOC_DRAFT_READY`
- `DOC_CONFLICT_RESOLVE`
- `DOC_CONFLICT_FIXED`

### with-scout message types

- `INVESTIGATION_READY`
- `INVESTIGATION_REVIEW_REQUEST`
- `INVESTIGATION_REVIEW_RESULT`
- `EXECUTION_PLAN_SHARED`
- `WORKER_PROGRESS`
- `WORKER_BLOCKED`
- `EXECUTION_RESULT`
- `EXECUTION_FIX_REQUEST`
- `EXECUTION_FIX_APPLIED`

## Retry / escalation rules

- Investigation and execution fix loops are bounded by **max 2 rounds**
- Unresolved blocking issues after round 2 must be escalated to user
- Never silently ignore unresolved conflicts

</agent-team-mode>

<optional-coding>
Option-based programming never jumps to conclusions.
After sufficient investigation, present options and continue based on user selection.
</optional-coding>

- **ALWAYS use `/investigate` or `investigator` agent instead of generic exploration.**
- **ALWAYS prefer evidence-first workflow (`/docflow:with-scout`) for complex tasks.**
- **ALWAYS enforce Agent Team communication protocol when docflow command is team-based.**
- **Automatic llmdoc updates are prohibited.**
  The last TODO of coding tasks must include an explicit option:
  "Update project documentation using recorder agent".
- **Only when user confirms that option**, invoke `recorder` to update documentation.
- Never run `scout` in background mode.

IMPORTANT: ALL `system-reminder` instructions override default behavior.

</system-reminder>
