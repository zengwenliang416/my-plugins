# Change: Refactor Wrapper Invocation to Pathless Standard

## Why
The repository still contains legacy `~/.claude/bin/codeagent-wrapper` references and wrapper scripts that hardcode `~/.claude/bin` fallback paths. This path style is deprecated and causes environment coupling.

## What Changes
- Remove hardcoded `~/.claude/bin/codeagent-wrapper` fallback from wrapper scripts.
- Standardize invocation to:
  - `CODEAGENT_WRAPPER` env override, or
  - `codeagent-wrapper` from `PATH`.
- Replace legacy absolute-path examples in active plugin documentation and recipes.
- Keep behavior otherwise backward-compatible.

## Impact
- Affected areas: wrapper scripts and active docs under `plugins/*/skills/**` and selected `llmdoc/` files.
- Not in scope: historical OpenSpec thinking artifacts and archived records.
