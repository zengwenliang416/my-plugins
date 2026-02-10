# How to Use Trae Skills and Agents (cc-plugin Profile)

Unified invocation conventions for the Trae profile under `git-repos/cc-plugin/.trae/`.

## 1. Scope

This guide applies to:

- `git-repos/cc-plugin/.trae/skills/`
- `git-repos/cc-plugin/.trae/agents/README.md`
- `git-repos/cc-plugin/.trae/rules/tokenroll-rules.md`
- `git-repos/cc-plugin/.trae/MIGRATION.md`

## 2. Skill Invocation in Trae

Trae supports two skill invocation modes:

1. **Manual invocation:** explicitly name the skill in chat.
2. **Auto invocation:** the model loads a skill based on its trigger conditions (`when_to_use`).

Examples:

- Manual: “Use `with-scout` skill to investigate the login flow.”
- Auto: “Help me investigate this repository and propose a fix plan.”

Notes:

- Do not rely on slash-style skill commands.
- Skill naming should follow the folder name under `.trae/skills/`.

## 3. Agent Invocation in Trae

Use the Trae native agent picker:

1. Type `@` in the chat input (or click `@智能体`).
2. Select the target agent (for example: `scout`, `investigator`, `recorder`, `worker`).
3. Provide task context in plain language (goal, constraints, run directory if needed).

Parallel work pattern:

- Start multiple agent tasks by repeating the `@` selection flow for each task.
- Keep each task prompt scoped and explicit.

## 4. Code Retrieval Standard (Trae Profile)

For this Trae profile, code investigation should use:

- `SearchCodebase` for repository-level retrieval
- `Read` for file-level inspection

The Trae profile documentation in `cc-plugin` is standardized to this retrieval stack.

## 5. Rules Baseline

Project-level Trae rules are centralized in one file:

- `git-repos/cc-plugin/.trae/rules/tokenroll-rules.md`

This rule file defines:

- llmdoc-first behavior
- skill manual/auto invocation semantics
- agent invocation through `@` selection
- prohibition of Claude-style `Task(subagent_type=...)` assumptions

## 6. Quick Consistency Checklist

When adding or updating Trae docs in `cc-plugin`, verify:

- Skill docs describe manual/auto invocation semantics.
- Agent docs describe invocation via `@` selection.
- Code retrieval wording uses `SearchCodebase + Read`.
- Rules references point to `tokenroll-rules.md`.
- Migration text does not present Claude syntax as Trae executable syntax.

## 7. Source of Truth

- `git-repos/cc-plugin/.trae/MIGRATION.md`
- `git-repos/cc-plugin/.trae/rules/tokenroll-rules.md`
- `git-repos/cc-plugin/.trae/agents/README.md`
