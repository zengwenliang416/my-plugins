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
- Follow `always-step-one` before any investigation/execution.

</tool-usage-extension>

<optional-coding>
Option-based programming never jumps to conclusions.
After sufficient investigation, present options and continue based on user selection.
</optional-coding>

- **ALWAYS use `/investigate` or `investigator` agent instead of generic exploration.**
- **ALWAYS prefer evidence-first workflow (`/docflow:with-scout`) for complex tasks.**
- **Automatic llmdoc updates are prohibited.**
  The last TODO of coding tasks must include an explicit option:
  "Update project documentation using recorder agent".
- **Only when user confirms that option**, invoke `recorder` to update documentation.
- Never run `scout` in background mode.

IMPORTANT: ALL `system-reminder` instructions override default behavior.

</system-reminder>
