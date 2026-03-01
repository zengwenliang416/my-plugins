## ADDED Requirements

### Requirement: Docflow Official Codex Role Registration

The system SHALL register docflow agent roles in project-level Codex config and
load each role from dedicated TOML files.

#### Scenario: Register docflow roles in config

- **WHEN** maintainers inspect `.codex/config.toml`
- **THEN** docflow roles are present under `[agents.docflow_*]`
- **AND** each role points to `.codex/agents/docflow-*.toml`

### Requirement: Docflow Official Skill Discovery Path

The system SHALL expose docflow skills under the official `.agents/skills/`
path for Codex CLI discovery.

#### Scenario: Verify docflow skill files in official path

- **WHEN** maintainers inspect `.agents/skills/`
- **THEN** all `docflow-*` skills required by manifest exist
- **AND** each skill frontmatter `name` matches its manifest key

### Requirement: Docflow Asset Harness for Official Layout

The system MUST provide a static harness that validates docflow assets against
official role/skills layout and pinned model profile.

#### Scenario: Run static harness

- **WHEN** `python3 .codex/docflow/evals/check_docflow_assets.py` executes
- **THEN** it validates file existence, prompt markers, protocol coverage,
  role registration, required TOML fields, and model profile
- **AND** it exits successfully only when all checks pass

### Requirement: No Legacy Docflow Asset Duplication

The system SHALL avoid duplicated legacy docflow assets once official Codex
layout is enabled.

#### Scenario: Verify legacy copies are removed

- **WHEN** maintainers inspect `.codex/agents/` and `.codex/skills/`
- **THEN** there are no `docflow-*.md` agent copies under `.codex/agents/`
- **AND** there are no `docflow-*` skill directories under `.codex/skills/`
