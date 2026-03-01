## ADDED Requirements

### Requirement: TPD Codex Workflow Asset Mapping

The system SHALL provide Codex-side workflow assets for TPD by mapping command,
agent, and skill definitions into official Codex directories with stable names.

#### Scenario: Generate TPD Codex workflow entries

- **WHEN** a maintainer migrates `plugins/tpd` to Codex workflow assets
- **THEN** the repository contains `.codex/prompts/tpd-*.md`,
  `.codex/agents/tpd-*.toml`, and `.agents/skills/tpd-*/SKILL.md`
- **AND** each migrated skill frontmatter `name` matches the manifest key
- **AND** each migrated agent role is registered in `.codex/config.toml`

### Requirement: TPD Asset Contract Validation

The system MUST include a static evaluation harness for TPD assets.

#### Scenario: Validate TPD manifest and protocol completeness

- **WHEN** `python3 .codex/tpd/evals/check_tpd_assets.py` is executed
- **THEN** the script validates file existence, prompt markers, protocol coverage,
  retry-bound policy, and naming consistency
- **AND** the script exits successfully only when all checks pass

### Requirement: No Legacy TPD Asset Duplication

The system SHALL avoid duplicated legacy TPD assets once official Codex layout
is enabled.

#### Scenario: Verify legacy copies are removed

- **WHEN** maintainers inspect `.codex/agents/` and `.codex/skills/`
- **THEN** there are no `tpd-*.md` agent copies under `.codex/agents/`
- **AND** there are no `tpd-*` skill directories under `.codex/skills/`
