## ADDED Requirements

### Requirement: Pathless wrapper invocation
All active wrapper scripts SHALL resolve external wrapper binaries without hardcoded `~/.claude/bin` absolute paths.

#### Scenario: Resolve wrapper binary
- **WHEN** a wrapper script starts
- **THEN** it first checks `CODEAGENT_WRAPPER`
- **AND** falls back to `codeagent-wrapper` from `PATH`

### Requirement: Active docs avoid legacy absolute wrapper path
Active plugin docs and operational guides SHALL not instruct users to call `~/.claude/bin/codeagent-wrapper` directly.

#### Scenario: Recipe and guide examples
- **WHEN** a user follows a documented command example
- **THEN** the example uses pathless invocation (or script entrypoints)
- **AND** does not require a hardcoded user-home executable path
