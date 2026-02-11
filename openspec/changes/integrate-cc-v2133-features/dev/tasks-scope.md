# Dev Phase - Wave 1 Scope

## Selected Tasks

### T-1: Migrate tech-rules-generator Output Path

**Files** (1):

1. `plugins/context-memory/skills/tech-rules-generator/SKILL.md` -- Replace `.claude/rules/` → `.claude/memory/rules/` at 4 locations

**Acceptance Criteria**:

- [ ] All `.claude/rules/` references replaced with `.claude/memory/rules/`
- [ ] Output directory structure: `.claude/memory/rules/{stack}.md` and `.claude/memory/rules/index.json`
- [ ] Index schema `path` field examples reflect new base directory
- [ ] No other files reference the old path

## Relevant Constraints

| ID   | Constraint                                                                                                  |
| ---- | ----------------------------------------------------------------------------------------------------------- |
| HC-1 | `.claude/rules/` exclusively owned by Auto Memory. tech-rules-generator migrates to `.claude/memory/rules/` |

## Test Requirements (from PBT)

- **PBT-1 (Path Isolation)**: `∀ file ∈ tech_rules_output: path(file) ∉ .claude/rules/`
  - Grep SKILL.md for `.claude/rules/` → expect 0 matches
  - Grep SKILL.md for `.claude/memory/rules/` → expect >= 4 matches

## Known Risks

- Low risk: path-only migration, no runtime logic changes
- ADR-002: No migration script needed (skill is stateless)
