# Property-Based Testing Properties

## PBT-1: Path Isolation

**Invariant**: tech-rules-generator output and Auto Memory output never share the same directory.
**Formal**: `∀ file ∈ tech_rules_output: path(file) ∉ .claude/rules/`
**Falsification Strategy**: Run `/memory tech-rules typescript` and verify output lands exclusively in `.claude/memory/rules/`, not `.claude/rules/`.
**Boundary Conditions**: Empty output, multiple stacks, concurrent execution.

## PBT-2: Backward Compatibility

**Invariant**: All 7 plugins produce identical results with and without v2.1.33 env vars.
**Formal**: `∀ plugin ∈ [7 plugins]: result(plugin, v2133=off) = result(plugin, v2133=on) ∧ no_error(plugin, v2133=off)`
**Falsification Strategy**: Execute each plugin's primary command with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` unset, then set. Compare outputs.
**Boundary Conditions**: Feature flag set to "0" vs unset vs "1", invalid values.

## PBT-3: Hook Timeout Compliance

**Invariant**: All hook scripts complete within 5s wall-clock time.
**Formal**: `∀ hook ∈ [14 scripts]: wall_time(hook, any_input) ≤ 5000ms`
**Falsification Strategy**: Pipe maximum-size valid JSON input, malformed JSON, empty input, and binary data into each hook script. Measure wall time.
**Boundary Conditions**: Empty stdin, 1MB JSON, malformed JSON, no jq installed.

## PBT-4: Hook Fail-Open

**Invariant**: No hook script blocks workflow on error.
**Formal**: `∀ hook, ∀ input (including invalid): exit_code(hook, input) = 0`
**Falsification Strategy**: Pipe invalid JSON, empty input, missing fields, and null values into each hook. Verify exit code is always 0.
**Boundary Conditions**: jq not installed, /dev/null as stdin, partial JSON.

## PBT-5: Documentation Consistency

**Invariant**: All documentation files reference the same lifecycle event count and hook script count.
**Formal**: `∀ doc ∈ [hooks-system.md, hook-scripts.md, how-to-create.md]: count_events(doc) = 7 ∧ count_scripts(doc) ≥ 13`
**Falsification Strategy**: Grep all documentation files for lifecycle/event counts. Verify consistency.
**Boundary Conditions**: New hooks added after docs updated, docs with "5" still present.

## PBT-6: Agent Teams State Machine Completeness

**Invariant**: Agent Teams state machine always reaches a terminal state (COMPLETE or FALLBACK).
**Formal**: `∀ execution ∈ team_mode: final_state ∈ {COMPLETE, FALLBACK}`
**Falsification Strategy**: Simulate all state transitions: happy path (DETECT→INIT→PROTOTYPE→AUDIT→COMPLETE), max iterations (→ITERATE→ITERATE→FALLBACK), API error (→FALLBACK), flag unset (→FALLBACK).
**Boundary Conditions**: team-state.json corruption, concurrent writes, mid-execution crash.

## PBT-7: Memory Ownership Exclusivity

**Invariant**: No file is written by both context-memory and Auto Memory systems.
**Formal**: `writers(CLAUDE.md) = {context-memory} ∧ writers(MEMORY.md) = {auto-memory} ∧ writers(.claude/rules/) = {auto-memory} ∧ writers(.claude/memory/rules/) = {tech-rules-generator}`
**Falsification Strategy**: Run context-memory and Auto Memory concurrently. Check for overlapping writes.
**Boundary Conditions**: Race conditions, partial writes, system crash during write.

## PBT-8: Hook Output Schema Compliance

**Invariant**: All hook scripts produce valid JSON output.
**Formal**: `∀ hook, ∀ valid_input: output(hook, valid_input) | jq empty = success`
**Falsification Strategy**: Pipe various valid inputs into each hook. Parse output with `jq empty`.
**Boundary Conditions**: Empty output (valid: `{}`), multi-line output, trailing newlines.
