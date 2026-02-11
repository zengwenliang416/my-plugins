---
generated_at: 2026-02-03T00:00:00Z
synthesizer_version: "1.0"
boundaries_integrated: ["agent-format"]
models_used: []
depth: light
---

# Constraint Synthesis Report (Light Mode)

## Synthesis Overview

- **Participating Boundaries**: agent-format
- **Thinking Depth**: light
- **Note**: Single boundary mode - straightforward format transformation task

## Constraint Set

### Hard Constraints

| ID   | Constraint                                              | Status                                            |
| ---- | ------------------------------------------------------- | ------------------------------------------------- |
| HC-1 | Name field must be <= 20 characters                     | All agents comply (max: investigator at 12 chars) |
| HC-2 | Prompt field must be <= 10000 characters                | All agents comply (max: recorder at ~5500 chars)  |
| HC-3 | English identifier must be <= 50 characters, kebab-case | All agents comply                                 |
| HC-4 | When to invoke must be <= 5000 characters               | Source descriptions are short, expansion safe     |
| HC-5 | AskUserQuestion has no SOLO equivalent                  | worker loses this capability                      |
| HC-6 | Glob/Grep merged into Read                              | Reduced search granularity accepted               |

### Soft Constraints

| ID   | Constraint                 | Recommendation                                     |
| ---- | -------------------------- | -------------------------------------------------- |
| SC-1 | scout marked INTERNAL ONLY | Disable "callable by other agents" toggle          |
| SC-2 | XML-style tags in prompts  | Keep as-is; SOLO Coder treats prompt as plain text |

## Dependencies & Risks

### Dependencies

1. Source files: `git-repos/cc-plugin/agents/*.md`
2. Reference: `git-repos/cc-plugin/agents/solo-coder/` (existing partial conversion)
3. Target: Trae IDE SOLO Coder Create Agent form

### Risks

| Risk                                | Severity | Mitigation                                                |
| ----------------------------------- | -------- | --------------------------------------------------------- |
| R1: recorder prompt length          | MEDIUM   | Full content formats (~5500 chars) well under 10000 limit |
| R2: AskUserQuestion capability loss | LOW      | Accept; no SOLO equivalent exists                         |
| R3: Glob/Grep precision loss        | LOW      | Accept; Read tool sufficient for most use cases           |
| R4: XML tag rendering               | MEDIUM   | Keep XML tags; they serve as structured instructions      |
| R5: When to invoke style variation  | LOW      | Follow existing solo-coder/ format with Chinese scenarios |

## Success Criteria

1. All 4 agents converted with mandatory fields populated
2. Character limits verified: Name <= 20, Prompt <= 10000, Identifier <= 50, When to invoke <= 5000
3. Tool mapping applied correctly:
   - investigator: Read, Terminal, Web search
   - recorder: Read, Edit, Terminal
   - scout: Read, Edit, Terminal, Web search
   - worker: Read, Edit, Terminal, Web search
4. scout has "callable by other agents" disabled; others enabled
5. When to invoke includes English description + Chinese usage scenarios
6. Output format matches existing `solo-coder/*.md` structure

## Open Questions

| Priority | Question                                              | Default Answer                                |
| -------- | ----------------------------------------------------- | --------------------------------------------- |
| LOW      | Q1: Include full ContentFormat templates in recorder? | YES - within limit                            |
| LOW      | Q2: Convert XML tags to markdown?                     | NO - keep as-is                               |
| LOW      | Q3: Handle model field?                               | IGNORE - SOLO Coder manages models separately |
| LOW      | Q4: Enable additional MCP tools?                      | NO - match source capabilities                |
| LOW      | Q5: Handle color field?                               | IGNORE - no SOLO equivalent                   |

## Agent Conversion Summary

| Agent        | Name (chars) | Prompt (chars) | Callable | Tools                            |
| ------------ | ------------ | -------------- | -------- | -------------------------------- |
| investigator | 12           | ~2100          | YES      | Read, Terminal, Web search       |
| recorder     | 8            | ~5500          | YES      | Read, Edit, Terminal             |
| scout        | 5            | ~2800          | NO       | Read, Edit, Terminal, Web search |
| worker       | 6            | ~1200          | YES      | Read, Edit, Terminal, Web search |

## Conclusion

This is a straightforward format transformation task with:

- **No blockers**: All constraints can be satisfied
- **Low risk**: Character limits comfortably met
- **Clear mapping**: Field and tool mappings well-defined
- **Existing reference**: `solo-coder/` directory provides format template

**Overall Confidence**: HIGH

**Recommendation**: Proceed directly to conversion execution without additional clarification.
