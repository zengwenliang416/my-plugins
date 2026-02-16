# Change: Refactor UI-Design Plugin with Consolidated Agents and Minimal Prompts

## Why
The current `ui-design` plugin has many specialized agent files and verbose command/agent prompts with heavy decorative formatting. This increases maintenance cost and makes orchestration harder to reason about.

## What Changes
- Consolidate UI-design agents from many role-specific files into a small set of role-routed core agents.
- Refactor `/ui-design` command into concise execution-first instructions while preserving phase behavior and artifact contracts.
- Keep Team-based orchestration and inter-agent messaging, but simplify task routing through `mode`/`perspective` parameters.
- Simplify `plugins/ui-design/skills/gemini-cli/SKILL.md` to minimal actionable format.
- Preserve existing output artifact names under `openspec/changes/<change_id>/` for compatibility.

## Impact
- Affected plugin: `plugins/ui-design`
- Affected files: `commands/ui-design.md`, `agents/**/*.md`, `skills/gemini-cli/SKILL.md`, `CLAUDE.md`
- Runtime behavior: same phase-level workflow, fewer agent types, simpler routing model.
