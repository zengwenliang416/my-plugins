# How to Use Docflow in Codex

Use docflow through Codex prompt entries with the `docflow-*` naming convention.

## 1. Entry Commands

Use the following commands as the primary entry points:

| Command | Purpose |
| --- | --- |
| `/prompts:docflow-what` | Clarify ambiguous requests with option-style questions |
| `/prompts:docflow-with-scout <goal>` | Investigation-first execution for complex tasks |
| `/prompts:docflow-init-doc` | Initialize or rebuild `llmdoc/` |

Legacy `/docflow:*` commands are compatibility references only.

## 2. Recommended Execution Flow

1. **Clarify first:** Run `/prompts:docflow-what` when the request is ambiguous.
2. **Investigate before execution:** Run `/prompts:docflow-with-scout <goal>` for implementation tasks.
3. **Initialize docs when needed:** Run `/prompts:docflow-init-doc` to create or rebuild `llmdoc`.
4. **Keep docs in sync:** Use `docflow-update-doc` after meaningful code changes.

## 3. Skill and Agent Naming

- **Skills:** `docflow-read-doc`, `docflow-investigate`, `docflow-update-doc`, `docflow-doc-workflow`, `docflow-commit`
- **Agents:** `docflow-scout`, `docflow-recorder`, `docflow-investigator`, `docflow-worker`

## 4. Message Contracts (Must Keep)

- **init-doc flow:** `SCOUT_REPORT_READY`, `SCOUT_CROSSCHECK_REQUEST`, `SCOUT_CROSSCHECK_RESULT`, `DOC_PLAN_READY`, `DOC_DRAFT_READY`, `DOC_CONFLICT_RESOLVE`, `DOC_CONFLICT_FIXED`
- **with-scout flow:** `INVESTIGATION_READY`, `INVESTIGATION_REVIEW_REQUEST`, `INVESTIGATION_REVIEW_RESULT`, `EXECUTION_PLAN_SHARED`, `WORKER_PROGRESS`, `WORKER_BLOCKED`, `EXECUTION_RESULT`, `EXECUTION_FIX_REQUEST`, `EXECUTION_FIX_APPLIED`

## 5. Quality Gate (Static Eval Harness)

Run the docflow static checks from repo root:

```bash
python3 .codex/docflow/evals/check_docflow_assets.py
```

Passing criteria:

- Output contains `PASS`
- `checks_failed = 0`

If checks fail, use `.codex/docflow/manifest.yaml` and `.codex/docflow/evals/cases.yaml` to locate missing assets or constraints.

## 6. Source of Truth

- Adapter mapping: `plugins/docflow/CODEX-ADAPTER.md`
- Codex rule set: `plugins/docflow/AGENTS.md`
- Prompt assets: `.codex/prompts/docflow-*.md`
- Skills and agents: `.codex/skills/docflow-*/SKILL.md`, `.codex/agents/docflow-*.md`
