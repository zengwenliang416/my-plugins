# Change: Refactor TPD for Team Communication and Minimal Prompt Style

## Why
The current TPD command/agent/skill prompts are verbose and contain heavy decorative formatting (tables, emojis, box drawing), which increases noise and weakens execution clarity. In addition, Team-based agent communication is only partially documented and not consistently enforced across Thinking/Plan/Dev.

## What Changes
- Refactor `plugins/tpd/commands/{thinking,plan,dev}.md` into minimal, execution-first instructions.
- Make Agent Team orchestration first-class in all three phases.
- Require explicit inter-agent communication using `SendMessage` with ACK + timeout fallback policy.
- Add Team tools to command frontmatter (`TeamCreate`, `TaskCreate`, `TaskOutput`, `SendMessage`, `TeamDelete`, etc.).
- Simplify `plugins/tpd/agents/**/*.md` and `plugins/tpd/skills/*/SKILL.md` by removing decorative tables/emojis and keeping only actionable sections.
- Keep artifact paths and file contracts backward-compatible with current OpenSpec directory structure.

## Impact
- Affected area: `tpd` plugin command prompts, agent prompts, skill prompts.
- Affected files: `plugins/tpd/commands/*.md`, `plugins/tpd/agents/**/*.md`, `plugins/tpd/skills/*/SKILL.md`.
- Behavior: clearer orchestration, explicit communication protocol, reduced prompt noise.
- Compatibility: preserve existing artifact names and directory layout under `openspec/changes/<proposal_id>/`.
