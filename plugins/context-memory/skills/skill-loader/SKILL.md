---
name: skill-loader
description: |
  Load and activate SKILL packages from .claude/skills/ into the current session.
  [Trigger] Starting a task where pre-indexed module knowledge would help.
  [Output] SKILL content loaded into conversation context + .claude/memory/sessions/skill-loads.json
  [Skip] When working on a simple task that doesn't need module-specific knowledge.
  [Ask] Which skill to load if mode=manual, or confirm auto-detected skills.
allowed-tools:
  - Read
  - Write
  - Glob
arguments:
  - name: skill_name
    type: string
    required: false
    description: Specific skill to load (loads all if omitted)
  - name: mode
    type: string
    required: false
    description: "auto-detect, manual, or list (default: auto-detect)"
---

# skill-loader

## Purpose

Discover and load SKILL packages from `.claude/skills/` into the current session context, making module knowledge available for task execution.

## Loading Modes

| Mode          | Behavior                                                      |
| ------------- | ------------------------------------------------------------- |
| `auto-detect` | Scan current task context, load relevant skills automatically |
| `manual`      | Load specific skill by name                                   |
| `list`        | List available skills without loading                         |

## Steps

### Phase 1: Discovery

1. Scan `.claude/skills/*/SKILL.md` using `Glob`.
2. For each found SKILL, extract:
   - Name (from frontmatter)
   - Description
   - File size (as quality proxy)

### Phase 2: Mode Routing

**mode=list:** 3. Present available skills as formatted table and exit.

**mode=manual:** 3. Read `.claude/skills/${skill_name}/SKILL.md`. 4. If not found, search by partial name match. 5. Output the SKILL content as context.

**mode=auto-detect:** 3. Analyze the current task description (from conversation context). 4. Match task keywords against skill descriptions. 5. Load top 3 most relevant skills. 6. Report what was loaded and why.

### Phase 3: Activation

7. For loaded skills, read and output their content so it enters the conversation context.
8. Write activation log to `.claude/memory/sessions/skill-loads.json`:

```json
{
  "timestamp": "ISO-8601",
  "loaded": ["auth", "api-client"],
  "mode": "auto-detect",
  "trigger": "implement login endpoint"
}
```

## Verification

- Requested skill(s) found and loaded.
- auto-detect mode loads at least 1 skill (warn if 0 matches).
- Activation log updated.
