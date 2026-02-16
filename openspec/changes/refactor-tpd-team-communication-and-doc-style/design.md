## Context
TPD currently uses a mix of standalone Task orchestration and a partial experimental team mode in Dev. Prompt files have high formatting noise that is not essential for execution.

## Goals
- Team-first orchestration in Thinking/Plan/Dev.
- Explicit inter-agent communication contract.
- Minimal prompt style focused on inputs, outputs, steps, verification.

## Non-Goals
- No semantic redesign of OpenSpec artifact schema.
- No runtime script changes outside TPD command/agent/skill markdown unless strictly required.

## Decisions
- Commands will define Team lifecycle explicitly: TeamCreate -> TaskCreate/TaskOutput -> SendMessage -> TeamDelete.
- Message contract will include `type`, `from`, `to`, `payload`, `task_id`, `requires_ack`.
- All TPD docs in scope will avoid decorative emojis/box drawings and avoid non-essential tables.

## Risks / Trade-offs
- Simplifying prompts may remove explanatory context; mitigation: preserve required invariants and output contracts.
- Team communication introduces more orchestration logic; mitigation: keep deterministic fallback rules.

## Verification Plan
- Static check: command frontmatter includes Team tools.
- Static check: no decorative emoji/box drawing chars in changed files.
- Flow check: each phase documents communication path and fallback behavior.
