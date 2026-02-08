<!-- OPENSPEC:START -->

# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:

- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:

- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## Language Rules

- **Plugin content** (agent definitions, commands, skill files, CLAUDE.md per plugin): **English only**
- **User-facing conversation**: **Chinese (简体中文)**

## Multi-Phase Workflow Design Rules

When designing or modifying multi-phase workflows (e.g., TPD: thinking → plan → dev), **MUST ensure data continuity between phases**:

### Mandatory Checks

1. **Every phase MUST check for previous phase artifacts** before starting work
2. **Copy relevant artifacts** with prefixed names (e.g., `thinking-synthesis.md`, `plan-constraints.md`)
3. **Skip redundant operations** when prior data exists
4. **Only ask NEW questions** not already answered in previous phases

### Data Flow Pattern

```
THINKING → handoff.json, synthesis.md, clarifications.md, boundaries.json
    ↓ (PLAN must read these)
PLAN → architecture.md, constraints.md, pbt.md, risks.md, context.md, tasks.md
    ↓ (DEV must read these)
DEV → implements using all above artifacts
```

### Anti-Pattern Checklist

Before completing any workflow phase design, verify:

- [ ] Does the phase check for `${PREV_PHASE_DIR}/` existence?
- [ ] Does it load prior constraints/clarifications?
- [ ] Does it skip re-asking questions already answered?
- [ ] Is `handoff.json` actually consumed by next phase?

### Task Splitting Rule

When a task modifies/generates **>3 files**, MUST split into sub-tasks with:

- Maximum 3 files per sub-task
- Explicit `[TEST]` section with test requirements
- Clear success criteria

### Memory Ownership Boundaries

- **`CLAUDE.md`** is managed by the context-memory plugin
- **`MEMORY.md`** is managed by Auto Memory (platform)
- **`.claude/rules/`** is exclusively owned by Auto Memory
- **`.claude/memory/rules/`** is the output path for `tech-rules-generator`
