## Context
Multiple plugins duplicate wrapper resolution logic and some docs still show legacy absolute paths.

## Goals
- Eliminate hardcoded user-home wrapper paths.
- Keep invocation behavior stable via env override + PATH lookup.
- Minimize diff and avoid changing command semantics.

## Non-Goals
- No migration of historical generated artifacts under past OpenSpec thinking outputs.
- No redesign of wrapper CLI arguments.

## Decisions
- Resolver order: `CODEAGENT_WRAPPER` -> `codeagent-wrapper`.
- Keep existing error handling and spawn strategy unchanged.
- Limit doc updates to active plugin/llmdoc guidance.

## Risks
- Environments without PATH registration may fail if `CODEAGENT_WRAPPER` not set.
- Some old docs may intentionally preserve history; these are excluded.

## Verification
- `rg` shows no `~/.claude/bin/codeagent-wrapper` in active plugin runtime/docs targets.
- `./scripts/validate-skills.sh` passes.
