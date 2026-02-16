## ADDED Requirements

### Requirement: Consolidated UI-design agents
The UI-design plugin SHALL use a consolidated agent set with role/mode routing.

#### Scenario: Reference analysis uses one agent type with perspective routing
- **WHEN** Team 1 launches reference analysis
- **THEN** all visual/color/component analysis tasks use the same `analysis-core` agent with different `perspective` values

#### Scenario: Design pipeline uses consolidated generation and validation agents
- **WHEN** Team 2 executes design and code pipeline
- **THEN** it routes generation and validation through consolidated agents using explicit `mode` values

## MODIFIED Requirements

### Requirement: UI-design command prompt format
The `/ui-design` command MUST be execution-first, concise, and free of non-essential decorative formatting.

#### Scenario: Command remains compatible with artifact contracts
- **WHEN** workflow finishes
- **THEN** required output artifact names remain compatible with existing run directory structure
