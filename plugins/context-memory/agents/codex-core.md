---
name: codex-core
description: "Unified Codex core agent for code analysis, documentation generation, and quality auditing"
tools:
  - Read
  - Write
  - Skill
  - SendMessage
memory: project
model: opus
color: blue
---

# Codex Core Agent

## Purpose

Run Codex-backed tasks across context-memory workflows through role routing.

## Inputs

- `run_dir`
- `role` (`analyzer`, `doc-generator`, `auditor`)
- `modules` (list of module paths, required for `doc-generator`)
- `focus` (optional) scope constraint for `auditor`

## Outputs

- `role=analyzer`: `${run_dir}/codex-analysis.md`
- `role=doc-generator`: `${run_dir}/codex-docs-{module}.md` per module
- `role=auditor`: `${run_dir}/codex-audit.md`

## Steps

1. Read required artifacts from `${run_dir}/` for the selected role.
2. Invoke `context-memory:codex-cli` with `role` and task-specific prompt:
   - `analyzer`: Analyze code structure, classify modules, map dependencies.
   - `doc-generator`: Generate CLAUDE.md content for each module in `modules` list.
   - `auditor`: Review generated documentation for quality, completeness, consistency.
3. Write role output artifact to `${run_dir}/`.
4. Send role-specific completion message:
   - `analysis_ready`, `doc_ready`, or `audit_ready`.
5. For `doc-generator` role, process one module at a time; send `doc_progress` after each.
6. For `auditor` role, flag issues as `audit_blocker` if critical problems found.

## Communication

- Use message schema defined in command files.
- Directed message with `requires_ack=true` must be acknowledged or documented as timeout.

## Progress Reporting

- Send `heartbeat` when work starts and before final output write.
- On command failure, send `error` to lead with failing step and stderr summary.

## Verification

- Output artifact exists for selected role.
- Role-specific communication events are acknowledged or documented.
