## ADDED Requirements

### Requirement: Agent Memory Frontmatter

The system SHALL support `memory` field in agent YAML frontmatter with scope values `user`, `project`, or `local`.

#### Scenario: Agent accumulates cross-session learnings

- **WHEN** an agent with `memory: project` executes across multiple sessions
- **THEN** the agent's MEMORY.md at `.claude/agent-memory/<name>/MEMORY.md` persists project-specific learnings

#### Scenario: Memory scope isolation

- **WHEN** an agent has `memory: user` scope
- **THEN** its learnings persist at `~/.claude/agent-memory/<name>/` and are available across all projects

### Requirement: Task(agent_type) Command Restrictions

The system SHALL support `Task(agent_type)` syntax in command `allowed-tools` frontmatter to restrict which sub-agents can be spawned.

#### Scenario: Command restricts agent spawning

- **WHEN** thinking.md declares `Task(tpd:investigation:boundary-explorer)` in allowed-tools
- **THEN** only boundary-explorer agents can be spawned during thinking phase execution

### Requirement: TeammateIdle Hook Event

The system SHALL fire `TeammateIdle` hook events when Agent Teams teammates become idle.

#### Scenario: Idle teammate triggers notification

- **WHEN** a teammate in an Agent Teams session becomes idle
- **THEN** the hook script in `scripts/orchestration/teammate-idle.sh` receives the event and dispatches notification

### Requirement: TaskCompleted Hook Event

The system SHALL fire `TaskCompleted` hook events when Agent Teams tasks complete.

#### Scenario: Completed task triggers logging

- **WHEN** a task in an Agent Teams session completes
- **THEN** the hook script in `scripts/orchestration/task-completed.sh` logs completion metadata

### Requirement: Agent Teams for tpd:dev

The system SHALL support Agent Teams orchestration in tpd:dev behind the `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` flag.

#### Scenario: Agent Teams enabled

- **WHEN** the experimental flag is set and tpd:dev executes
- **THEN** the audit-fix cycle uses Agent Teams direct messaging between implementers and auditors

#### Scenario: Agent Teams disabled (fallback)

- **WHEN** the experimental flag is NOT set
- **THEN** tpd:dev executes using the existing Task() subagent pattern with identical artifact output

## MODIFIED Requirements

### Requirement: UI-Design Agent Definitions

The 9 UI-Design agents SHALL be migrated from informal markdown tool declarations to standard YAML frontmatter format, preserving exact tool lists.

#### Scenario: Frontmatter migration preserves behavior

- **WHEN** a UI-Design agent is loaded after frontmatter migration
- **THEN** its available tools match the pre-migration informal `## Required Tools` declaration exactly

## REMOVED Requirements

None.
