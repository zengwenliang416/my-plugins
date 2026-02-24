## ADDED Requirements

### Requirement: Agent Memory Scoping for TPD Plugin

Agent definitions in TPD, commit, and ui-design plugins SHALL use `memory: project` or `memory: user` frontmatter to scope persistent state correctly.

#### Scenario: Agent memory isolation per project

- **WHEN** an agent with `memory: project` runs across different projects
- **THEN** each project SHALL have isolated memory context without cross-contamination

### Requirement: Agent Teams Integration for TPD Dev Phase

The `/tpd:dev` command SHALL support Agent Teams orchestration for parallel implementation and audit cycles, gated by environment variable with fallback to standalone Task execution.

#### Scenario: Agent Teams enabled

- **WHEN** Agent Teams is enabled and `/tpd:dev` is executed
- **THEN** the system SHALL create a team, dispatch parallel implementer and auditor tasks, and use SendMessage for iterative fix cycles

#### Scenario: Agent Teams disabled fallback

- **WHEN** Agent Teams is not available and `/tpd:dev` is executed
- **THEN** the system SHALL fall back to standalone Task calls with identical artifact outputs

### Requirement: Auto Memory Path Separation

Auto Memory (`.claude/rules/`) and context-memory tech-rules output (`.claude/memory/rules/`) SHALL use separate directory paths to prevent dual-write corruption.

#### Scenario: No file overlap between Auto Memory and tech-rules

- **WHEN** both Auto Memory and context-memory tech-rules-generator write rule files
- **THEN** Auto Memory SHALL write to `.claude/rules/` and tech-rules SHALL write to `.claude/memory/rules/` with zero path overlap

## MODIFIED Requirements

### Requirement: Hook System Lifecycle Events

The hooks system SHALL support 7 lifecycle events (UserPromptSubmit, PreToolUse, PostToolUse, Notification, Stop, WorktreeCreate, WorktreeRemove) with strict 5-second timeout enforcement.

#### Scenario: Hook timeout enforcement

- **WHEN** a hook script exceeds 5 seconds execution time
- **THEN** the system SHALL terminate the hook and continue operation without blocking

#### Scenario: Hook scripts follow safety patterns

- **WHEN** a hook script is defined
- **THEN** it SHALL include `set -euo pipefail` and validate input schema before processing
