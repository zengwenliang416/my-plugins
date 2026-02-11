## ADDED Requirements

### Requirement: Unified OpenSpec Artifact Root
The system SHALL store plugin workflow runtime state only under the OpenSpec change workspace root:
`openspec/changes/<change-id>/`.

#### Scenario: New workflow run writes to OpenSpec root
- **WHEN** any plugin command initializes a new run
- **THEN** it writes state and outputs under `openspec/changes/<change-id>/`
- **AND** it does not create a `.claude/*/runs/*` runtime directory

### Requirement: Manifest-Driven Stage Contract
Each workflow phase SHALL generate and maintain `artifact-manifest.json` describing produced artifacts, phase status, and dependencies.

#### Scenario: Phase completion updates manifest
- **WHEN** a phase checkpoint is completed
- **THEN** the phase updates `artifact-manifest.json` with generated artifact entries and status
- **AND** downstream phases can resolve required inputs from manifest metadata

### Requirement: Lineage-Based Cross-Phase Integration
Cross-phase data reuse SHALL be modeled through lineage references, not by copying upstream artifacts into downstream phase directories.

#### Scenario: Plan reads thinking outputs without copy
- **WHEN** plan phase consumes thinking results
- **THEN** plan resolves thinking artifacts from lineage/manifest references
- **AND** no duplicate `thinking-*` files are copied into plan phase directories

### Requirement: Legacy Runtime Path Prohibition
Plugin command definitions SHALL NOT contain legacy or independent runtime paths matching `.claude/*/runs/*`, `.runtime/*`, or `openspec/changes/*/artifacts/*`.

#### Scenario: Command validation rejects legacy run path
- **WHEN** command files are validated in CI/local checks
- **THEN** any prohibited runtime path reference triggers a validation failure
