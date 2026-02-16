# Subtask 5 Plan

## Objective
Add progress visibility and heartbeat rules to main TPD commands and agents, and align with TeammateIdle/TaskCompleted hook signals.

## Inputs
- `plugins/tpd/commands/thinking.md`
- `plugins/tpd/commands/plan.md`
- `plugins/tpd/commands/dev.md`
- `plugins/tpd/agents/**/*.md`
- Hook logs produced by `plugins/hooks/scripts/orchestration/*.sh`

## Outputs
- Commands include mandatory phase start/end markers and error reporting format.
- Team heartbeat and hook snapshot artifacts are defined in run directories.
- Agents include progress heartbeat and error message expectations.

## Execution Steps
1. Add visibility policy and heartbeat artifact contract to each TPD command.
2. Define 60-second status polling behavior during long team waits.
3. Add hook snapshot collection guidance for teammate idle and task completed events.
4. Update agents with explicit heartbeat/error reporting requirements.
5. Re-run style checks and skill validation.

## Risks
- Overly strict visibility logging may add runtime verbosity.
- Hook log files may be absent in some environments.

## Verification
- Commands document phase marker format and heartbeat artifacts.
- Commands include fallback behavior when hook logs are unavailable.
- No decorative tables/emojis reintroduced.
