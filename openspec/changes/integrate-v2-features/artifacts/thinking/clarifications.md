# Clarifications

## User Decision on P0 Open Questions

**Decision**: 先跳过，后续验证

**Working Assumptions**:

1. **OQ-1 (frontmatter backward compat)**: Assume old Claude Code versions silently ignore unknown frontmatter fields like `memory`. Verify during implementation by testing on a pre-v2.1.32 version if available.
2. **OQ-2/3 (hook event schemas)**: Use defensive `jq '// empty'` parsing for all fields. Design hook scripts to log raw input for schema discovery. Iterate once actual event data is available.

**Implication**: All 3 Phase 1 work items (memory, task restrictions, hook events) can proceed in parallel. Hook scripts will be "best-effort" implementations with defensive parsing, refined when schemas are confirmed.
