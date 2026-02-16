## ADDED Requirements

### Requirement: Team-first orchestration across TPD phases
The TPD workflow SHALL define Team lifecycle orchestration for Thinking, Plan, and Dev phases.

#### Scenario: Thinking phase starts with Team lifecycle
- **WHEN** `/tpd:thinking` is executed
- **THEN** it creates a team and dispatches boundary and constraint tasks within the team context

#### Scenario: Plan phase starts with Team lifecycle
- **WHEN** `/tpd:plan` is executed
- **THEN** it creates a team and dispatches context, architecture, and synthesis tasks with explicit dependencies

#### Scenario: Dev phase starts with Team lifecycle
- **WHEN** `/tpd:dev` is executed
- **THEN** it creates a team and dispatches implementation and audit tasks in iterative loops with bounded retries

### Requirement: Sub-agent communication contract
TPD agents SHALL communicate through explicit messages with acknowledgment and timeout fallback.

#### Scenario: Directed message requires acknowledgment
- **WHEN** an agent sends a blocking message to another agent
- **THEN** the recipient acknowledges it or the lead falls back after timeout

#### Scenario: Broadcast message is logged
- **WHEN** lead broadcasts phase transition
- **THEN** all active agents receive the message and it is persisted to run artifacts

## MODIFIED Requirements

### Requirement: Prompt style is execution-first and minimal
TPD command, agent, and skill prompts MUST avoid decorative formatting and keep only actionable content.

#### Scenario: Prompt contains only required sections
- **WHEN** a TPD markdown prompt file is reviewed
- **THEN** it contains concise sections for purpose, inputs, outputs, execution steps, and verification
