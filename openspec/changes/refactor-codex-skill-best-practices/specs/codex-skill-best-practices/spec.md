## ADDED Requirements

### Requirement: Skill Frontmatter Quality

The system SHALL enforce skill frontmatter quality for all codex preview skills.

#### Scenario: Validate frontmatter semantics

- **WHEN** maintainers inspect `codex/.agents/skills/*/SKILL.md`
- **THEN** `name` matches directory name exactly
- **AND** `description` uses third-person wording and includes inapplicable scenarios

### Requirement: Progressive Disclosure Structure

The system SHALL keep SKILL.md minimal and defer detail to local references.

#### Scenario: Validate progressive disclosure layout

- **WHEN** maintainers inspect each skill directory
- **THEN** each skill contains `SKILL.md`, `scripts/`, and `references/`
- **AND** `SKILL.md` references local files via relative forward-slash paths

### Requirement: TypeScript Script Enforcement

The system MUST ensure all newly introduced skill scripts use TypeScript.

#### Scenario: Validate script extensions

- **WHEN** maintainers inspect `codex/.agents/skills/*/scripts/`
- **THEN** every executable script filename ends with `.ts`
- **AND** scripts emit explicit success/failure signals

### Requirement: Skill Best-Practice Validation Loop

The system MUST provide a repeatable validation harness for skill best practices.

#### Scenario: Run best-practice eval script

- **WHEN** `python3 codex/.codex/skills/evals/check_skill_best_practices.py` executes
- **THEN** it validates frontmatter, directory layout, numbered flow, decision tree, and script extensions
- **AND** it exits non-zero when any check fails
