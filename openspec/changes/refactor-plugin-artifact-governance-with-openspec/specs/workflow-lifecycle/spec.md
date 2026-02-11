## ADDED Requirements

### Requirement: Hard Cutover Runtime Policy
After cutover, the system SHALL execute workflows using OpenSpec change workspaces only and SHALL NOT support runtime fallback to historical `.claude/*/runs/*` artifacts or independent runtime roots.

#### Scenario: Historical run is provided after cutover
- **WHEN** a command receives input that points to legacy `.claude/*/runs/*` artifacts
- **THEN** the command fails fast with a migration guidance message
- **AND** it does not attempt fallback reads from legacy directories

### Requirement: Fail-Fast Prerequisite Enforcement
A phase SHALL fail immediately if required upstream manifests or artifacts are missing.

#### Scenario: Dev phase missing plan manifest
- **WHEN** dev phase starts without required plan manifest/artifacts
- **THEN** dev phase exits with explicit error and remediation steps
- **AND** no partial execution proceeds

### Requirement: One-Time Legacy Artifact Cleanup
The migration SHALL define and execute a one-time archive/cleanup process for legacy `.claude/*/runs/*` artifacts.

#### Scenario: Cleanup execution completes
- **WHEN** cleanup is run in execute mode
- **THEN** all targeted legacy run directories are archived or removed per policy
- **AND** a cleanup report records before/after counts and reclaimed disk usage

### Requirement: Lifecycle Auditability
The system SHALL persist lifecycle audit records for migration and post-cutover operations.

#### Scenario: Migration summary generated
- **WHEN** migration validation completes
- **THEN** a summary artifact is produced containing migrated commands, validation checks, and unresolved items
- **AND** summary is stored under the OpenSpec change workspace
