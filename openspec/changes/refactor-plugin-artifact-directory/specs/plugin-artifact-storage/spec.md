## ADDED Requirements

### Requirement: Plugin Run Artifact Directory Convention

All non-TPD plugin commands SHALL write ephemeral run artifacts to `.claude/runs/${PLUGIN}-${YYYYMMDD-HHMMSS}/` instead of `openspec/changes/`.

#### Scenario: Plugin writes artifacts to .claude/runs/

- **WHEN** a non-TPD plugin command (e.g., `/code-review:review`, `/security-audit:audit`) generates run artifacts
- **THEN** the artifacts SHALL be written to `.claude/runs/${plugin-name}-${timestamp}/` and NOT to `openspec/changes/`

#### Scenario: TPD plugin retains openspec/changes/ usage

- **WHEN** the TPD plugin creates a change proposal via `/tpd:thinking` or `/tpd:plan`
- **THEN** artifacts SHALL be written to `openspec/changes/${proposal_id}/` as before, since TPD creates actual OpenSpec change proposals

#### Scenario: Run ID follows standardized format

- **WHEN** a plugin generates a run directory ID
- **THEN** the ID SHALL follow the format `${plugin-name}-${YYYYMMDD-HHMMSS}` (e.g., `review-20260222-141638`, `audit-20260222-150000`)

### Requirement: OpenSpec Changes Directory Integrity

The `openspec/changes/` directory SHALL contain only valid OpenSpec change proposals with `proposal.md`, `tasks.md`, and `specs/` subdirectory.

#### Scenario: openspec list shows only real proposals

- **WHEN** `openspec list` is executed
- **THEN** only directories containing valid change proposals (with `proposal.md`) SHALL appear in the listing

#### Scenario: openspec validate passes on all listed changes

- **WHEN** `openspec validate --strict --no-interactive` is executed against any directory in `openspec/changes/`
- **THEN** validation SHALL pass because all directories follow the required OpenSpec structure
