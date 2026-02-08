# Risk Assessment

## Metadata

- Proposal: integrate-cc-v2133-features
- Generated: 2026-02-06
- Artifacts consumed: synthesis.md, architecture.md, constraints.md, pbt.md, context.md, tasks.md
- Risk count: 12

## Risk Matrix

| ID   | Risk                                        | Severity | Probability | Impact                                      | Mitigation                                | PBT Coverage |
| ---- | ------------------------------------------- | -------- | ----------- | ------------------------------------------- | ----------------------------------------- | ------------ |
| R-1  | Hook return values observation-only         | HIGH     | High        | Orchestration directives silently ignored   | Logging-first design (SC-6)               | PBT-8        |
| R-2  | Agent Teams Research Preview breaking       | HIGH     | High        | team() API changes break /tpd:dev           | Fallback to Task() mode (HC-3)            | PBT-6        |
| R-3  | Hook timeout exceeded (5s)                  | MEDIUM   | Low         | Hook killed mid-execution, partial log      | 220ms budget with 4780ms headroom (HC-4)  | PBT-3        |
| R-4  | Input schema mismatch for orchestration     | HIGH     | Medium      | Field extraction returns empty, dead logic  | jq empty + fail-open (HC-9)               | PBT-4, PBT-8 |
| R-5  | Path collision with future platform updates | MEDIUM   | Medium      | .claude/memory/rules/ claimed by platform   | Ownership table in memory-architecture.md | PBT-1, PBT-7 |
| R-6  | team-state.json corruption                  | MEDIUM   | Low         | State machine stuck, no terminal state      | FALLBACK state on parse failure (ADR-003) | PBT-6        |
| R-7  | Documentation cross-reference drift         | MEDIUM   | Medium      | Docs cite stale counts after partial update | Cross-reference integrity matrix (ST-2)   | PBT-5        |
| R-8  | Backward compatibility regression           | CRITICAL | Low         | Non-v2.1.33 users experience broken flows   | Event-existence gate + dual-mode testing  | PBT-2        |
| R-9  | Wave ordering violation                     | HIGH     | Low         | Hook scripts built on stale documentation   | DAG enforcement in task dependencies      | PBT-5        |
| R-10 | jq unavailability on target system          | MEDIUM   | Low         | All hook input parsing fails                | fail-open: echo '{}' + exit 0 (HC-9)      | PBT-4        |
| R-11 | Orphaned files in .claude/rules/            | LOW      | High        | Stale tech-rules coexist with Auto Memory   | No migration script; regeneration clears  | PBT-1        |
| R-12 | Log file unbounded growth                   | LOW      | Medium      | Disk exhaustion on long-running sessions    | 10k line rotation with tail 5k (HC-11)    | PBT-3        |

---

## Risk Details

### R-1: Hook Return Values Observation-Only

**Severity**: HIGH
**Probability**: High
**Impact**: If TeammateIdle/TaskCompleted hooks are observation-only (no actionable return processing by the platform), any `hookSpecificOutput.orchestrationDirective` fields in stdout are silently discarded. The enhanced hook scripts would produce structured JSON that nothing consumes, resulting in dead code in the output pipeline. The logging and metrics portions remain functional, but the orchestration value proposition is lost.
**Mitigation**: SC-6 mandates logging-first design. The architecture already treats orchestration directives as optional enrichment over the baseline logging behavior. The `hookSpecificOutput` schema is structured so that removing orchestration fields leaves a valid pass-through response (`{}`). If platform confirms observation-only semantics, strip orchestration fields in a follow-up task without affecting logging.
**Detection**: After ST-3 implementation, invoke a hook with a valid orchestration directive in its output. Observe whether Claude Code processes the directive or ignores it. Check platform changelog for v2.1.33+ hook return semantics documentation.
**PBT**: PBT-8 (hook output schema compliance) ensures output is always valid JSON regardless of whether the platform consumes it.

---

### R-2: Agent Teams Research Preview Breaking Changes

**Severity**: HIGH
**Probability**: High
**Impact**: The Agent Teams API is explicitly labeled "Research Preview" (HC-3). Any of the following could break: `team()` invocation syntax, agent discovery mechanism, iteration control, TeammateIdle/TaskCompleted event payloads, or the env var name itself. A breaking change renders the 7-state state machine (ADR-003) and the entire ST-4 section of dev.md non-functional.
**Mitigation**: Three-layer defense:

1. **Feature flag gate**: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` must be explicitly set. Default behavior (flag unset) uses proven Task() subagent mode with zero regression.
2. **FALLBACK terminal state**: State machine transitions to FALLBACK on any unrecoverable error, including API mismatch.
3. **API syntax documented as TBD** (SC-8): dev.md uses pseudo-code for team dispatch, making it adaptable to API changes without structural rewrite.

**Detection**: Monitor Claude Code release notes for Agent Teams API changes. The DETECT state in the state machine validates env var presence before attempting team initialization.
**PBT**: PBT-6 (state machine completeness) guarantees every execution reaches COMPLETE or FALLBACK, including API error scenarios.

---

### R-3: Hook Timeout Exceeded (5s Ceiling)

**Severity**: MEDIUM
**Probability**: Low
**Impact**: Platform kills the hook process after 5000ms (HC-4). Partial JSONL log entry may be written (file corruption). No stdout returned to platform, which may interpret as pass-through or error depending on implementation. Workflow continues (hooks are non-blocking) but telemetry data is lost for that event.
**Mitigation**: Performance budget analysis shows 220ms total execution time with 4780ms headroom (architecture.md). The budget breakdown:

- JSON parse+validate: 50ms
- Field extraction: 10ms
- JSONL logging: 100ms (async append, no fsync)
- Log rotation check: 50ms
- Output generation: 10ms

No synchronous network calls permitted. The smart-notify.sh pattern (async dispatch via `&` + `disown`) is the reference for any future network operations.
**Detection**: Wrap hook execution in `time` during testing. Add a timing field to the JSONL log entry (`"elapsed_ms"`) for production monitoring.
**PBT**: PBT-3 (hook timeout compliance) falsifies by piping maximum-size JSON, malformed JSON, and binary data into each hook and measuring wall time.

---

### R-4: Input Schema Mismatch for TeammateIdle/TaskCompleted

**Severity**: HIGH
**Probability**: Medium
**Impact**: Current scripts assume specific field names: `teammate_name` and `idle_since` for TeammateIdle; `task_id` and `status` for TaskCompleted (context.md Section 4). These field names are unverified against the actual v2.1.33 payload (OQ-BLOCK-2 remains unresolved). If the platform sends different field names (e.g., `agent_name` instead of `teammate_name`, or nests fields under a `data` key), all `jq -r` extractions return empty strings. Logging captures raw input but structured fields are blank, degrading the value of telemetry.
**Mitigation**: Two-phase defense:

1. **Input validation at entry**: `jq empty` check rejects non-JSON. Missing required fields trigger `log_warn` + graceful degradation to raw-only logging.
2. **Raw payload capture**: Every log entry includes the full raw input (`"raw": $(echo "$INPUT" | jq -c '. // {}')`), preserving data even when field extraction fails.
3. **Schema adaptation**: Field names are extracted via `jq -r '.field // empty'`, not hardcoded into control flow. Changing field names requires editing 2-3 `jq` expressions per script, not structural refactoring.

**Detection**: First invocation after deployment will reveal schema mismatch via empty structured fields in JSONL logs while raw payload shows the actual schema. Compare raw vs structured fields in `~/.claude/logs/hook-events/teammate-idle.jsonl`.
**PBT**: PBT-4 (hook fail-open) ensures exit 0 regardless of input shape. PBT-8 (output schema compliance) ensures valid JSON output even with empty extractions.

---

### R-5: Path Collision with Future Platform Updates

**Severity**: MEDIUM
**Probability**: Medium
**Impact**: The migration target `.claude/memory/rules/` is not a platform-defined path today. A future Claude Code release could claim `.claude/memory/` as a platform-managed directory (similar to how `.claude/rules/` was claimed by Auto Memory). This would recreate the HC-1 namespace collision problem that ST-1 is designed to solve.
**Mitigation**:

1. **Ownership documentation**: memory-architecture.md will explicitly document `.claude/memory/rules/` as tech-rules-generator exclusive territory, creating a clear record for future collision detection.
2. **Prefix convention**: All plugin-managed paths use `.claude/memory/<purpose>/` pattern, distinguishing them from platform paths (`.claude/rules/`, `.claude/agent-memory/`).
3. **Stateless regeneration**: tech-rules-generator output is regenerated on demand (ADR-002). If a future collision occurs, another path migration requires only updating 4 lines in SKILL.md.

**Detection**: Monitor Claude Code release notes for any `.claude/memory/` directory claims. Verify ownership table in memory-architecture.md against platform documentation on each major release.
**PBT**: PBT-1 (path isolation) and PBT-7 (memory ownership exclusivity) detect violations through concurrent execution tests.

---

### R-6: team-state.json Corruption

**Severity**: MEDIUM
**Probability**: Low
**Impact**: The 7-state state machine (ADR-003) persists state to `team-state.json`. Corruption scenarios: partial write during crash, concurrent agent writes, invalid JSON from truncation, or missing file. A corrupted state file could cause the state machine to hang in a non-terminal state (violating PBT-6) or misread iteration count (allowing >2 iterations, violating HC-10).
**Mitigation**:

1. **FALLBACK on parse failure**: Any `jq` parse error on team-state.json triggers immediate transition to FALLBACK terminal state.
2. **Atomic write pattern**: Write to temp file + rename (not in-place edit) prevents partial writes.
3. **Iteration ceiling enforcement**: Iteration count is checked BEFORE incrementing. If `iteration >= max_iterations`, transition to FALLBACK regardless of state file contents.
4. **Missing file = fresh start**: Absence of team-state.json is treated as DETECT state, not an error.

**Detection**: PBT-6 falsification includes team-state.json corruption as a boundary condition. Inject malformed JSON, truncated files, and missing files during state machine testing.
**PBT**: PBT-6 (state machine completeness) directly covers this risk.

---

### R-7: Documentation Cross-Reference Drift

**Severity**: MEDIUM
**Probability**: Medium
**Impact**: ST-2 updates 4 documentation files (hooks-system.md, hook-scripts.md, how-to-create-a-hook.md, hooks CLAUDE.md). These files cross-reference each other's counts and categories (see cross-reference integrity matrix in architecture.md). A partial update (e.g., updating hooks-system.md to say "7 events" but leaving hook-scripts.md at "5 lifecycle points") creates a new form of documentation drift. Additionally, two files outside ST-2 scope (project-overview.md line 97, plugin-system.md line 15) reference "5 lifecycle points" and may be missed.
**Mitigation**:

1. **Wave 2 ordering**: ST-2a (hooks-system.md, canonical reference) must complete before ST-2b (hook-scripts.md) and ST-2c (how-to-create-a-hook.md). ST-2d (hooks CLAUDE.md) depends on both ST-2a and ST-2b.
2. **Grep verification**: After all ST-2 sub-tasks complete, grep all documentation for stale counts: `grep -rn "5 lifecycle\|11 hooks\|11 scripts\|6 categories" llmdoc/ plugins/`.
3. **Context.md section 11** identifies 7 specific documents with drift. All must be checked.

**Detection**: PBT-5 (documentation consistency) falsifies by grepping all doc files for lifecycle/event/script counts and verifying they match hooks.json reality (7 events, 14 scripts).
**PBT**: PBT-5 (documentation consistency).

---

### R-8: Backward Compatibility Regression

**Severity**: CRITICAL
**Probability**: Low
**Impact**: If any of the 5 sub-tasks introduces a hard dependency on v2.1.33 features, users on older Claude Code versions experience broken workflows. This is the most severe risk because it affects ALL users, not just early adopters. Regression vectors: (a) tech-rules output at new path but consumer still reads old path, (b) hook script uses v2.1.33-only jq features, (c) dev.md Agent Teams section executes unconditionally, (d) documentation references features as "required" instead of "optional".
**Mitigation**:

1. **Event-existence gate** (ADR-004): TeammateIdle/TaskCompleted events only fire on v2.1.33+. Scripts are inert on older versions because they are never invoked.
2. **Env var gate**: Agent Teams mode requires explicit `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. Default path is unchanged Task() mode.
3. **Path migration is additive**: SKILL.md changes output path, but existing `.claude/rules/` files are not deleted. Old consumers continue to work until next regeneration cycle.
4. **Dual-mode testing**: Every plugin must be tested with env vars both set and unset.

**Detection**: Run all 7 plugins' primary commands with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` unset and verify identical behavior to pre-migration baseline. Regression test checklist per plugin.
**PBT**: PBT-2 (backward compatibility) is the primary coverage. Falsification: execute each plugin with v2.1.33 vars on vs off, compare outputs.

---

### R-9: Wave Ordering Violation

**Severity**: HIGH
**Probability**: Low
**Impact**: The 5-wave execution order (ADR-005) enforces SC-5 (documentation-first). If a developer executes ST-3 (hook scripts) before ST-2 (documentation), they build enhanced hooks against stale documentation, potentially implementing incorrect event counts or wrong field names in code comments. If ST-5 (memory docs) executes before ST-1 (path migration), the documentation describes a path structure that does not yet exist.
**Mitigation**:

1. **Dependency DAG in tasks.md**: Each sub-task declares explicit dependencies (ST-2 depends on ST-1; ST-3 and ST-4 depend on ST-2; ST-5 depends on ST-1, ST-3, ST-4).
2. **Wave gates**: Conductor can enforce wave ordering by checking previous wave completion before starting next wave.
3. **Idempotent sub-tasks**: Each sub-task can be safely re-executed if ordering is violated, since all changes are to text files (markdown, bash, JSON).

**Detection**: Task orchestrator validates dependency graph before execution. Any sub-task that starts without its predecessors completed triggers a warning.
**PBT**: PBT-5 (documentation consistency) would catch documentation/implementation mismatches caused by ordering violations.

---

### R-10: jq Unavailability on Target System

**Severity**: MEDIUM
**Probability**: Low
**Impact**: All hook scripts depend on `jq` for JSON parsing (D-2 in synthesis.md). If jq is not installed, every `jq` invocation fails. With `set -euo pipefail`, the script exits immediately on the first jq failure. Without the fail-open wrapper, this could produce a non-zero exit code, potentially blocking the workflow (violating HC-9).
**Mitigation**:

1. **Fail-open wrapper**: The input validation pattern wraps jq calls in conditional checks (`if ! echo "$input" | jq empty 2>/dev/null`). The `2>/dev/null` suppresses jq-not-found errors.
2. **Fallback output**: On any jq failure (including missing binary), scripts output `{}` and exit 0.
3. **Existing precedent**: All 12 existing hook scripts already depend on jq. This is not a new dependency introduced by the integration.

**Detection**: Test hook scripts in an environment without jq. Verify exit code is 0 and output is `{}`.
**PBT**: PBT-4 (hook fail-open) covers this scenario: `exit_code(hook, any_input) = 0` must hold even when jq is absent.

---

### R-11: Orphaned Files in .claude/rules/ After Migration

**Severity**: LOW
**Probability**: High
**Impact**: ST-1 changes the output path in SKILL.md but does not delete existing files in `.claude/rules/`. Users who previously ran tech-rules-generator have stale `{stack}.md` and `index.json` files in `.claude/rules/`. These files coexist with Auto Memory's files, creating visual clutter and potential confusion (Auto Memory may read and surface stale tech-rules as active rules). No data corruption occurs, but user experience degrades.
**Mitigation**:

1. **Intentional design** (ADR-002): No migration script. tech-rules-generator is stateless. Next invocation writes to new path. Old files are inert.
2. **Documentation**: ST-5 memory architecture docs will note that orphaned files in `.claude/rules/` from pre-migration runs can be safely deleted.
3. **Auto Memory behavior**: Auto Memory reads `.claude/rules/*.md` files. Stale tech-rules are generic coding guidelines, not harmful if surfaced.

**Detection**: After migration, check `.claude/rules/` for files matching tech-rules naming patterns (`{stack}.md`, `index.json`).
**PBT**: PBT-1 (path isolation) verifies that NEW tech-rules output lands in `.claude/memory/rules/`, not `.claude/rules/`. Does not cover cleanup of pre-existing files.

---

### R-12: Log File Unbounded Growth

**Severity**: LOW
**Probability**: Medium
**Impact**: Orchestration hooks append to `~/.claude/logs/hook-events/teammate-idle.jsonl` and `task-completed.jsonl`. In long-running Agent Teams sessions with frequent idle/completion events, these files grow without bound. On systems with limited disk space, this could cause write failures in other hooks or Claude Code itself.
**Mitigation**:

1. **Log rotation** (HC-11): Tail-based rotation at 10,000 entries, keeping most recent 5,000. Rotation runs as part of the hook execution pipeline.
2. **Fail-open on rotation error**: If `wc -l` or `tail` fails during rotation, hook continues without rotation (logging degrades gracefully, not fatally).
3. **Performance budget**: Log rotation check costs 50ms, within the 5s budget.

**Detection**: Monitor log file size during Agent Teams testing sessions. Verify rotation triggers after 10,000 entries.
**PBT**: PBT-3 (hook timeout compliance) indirectly covers this: if rotation adds significant latency, it would surface as a timeout violation.

---

## Dependency Risks

| ID  | Dependency                   | Risk if Unavailable                                               | Fallback                                 |
| --- | ---------------------------- | ----------------------------------------------------------------- | ---------------------------------------- |
| D-1 | Claude Code v2.1.33+ runtime | TeammateIdle/TaskCompleted events never fire                      | Scripts exist but are never invoked      |
| D-2 | jq binary                    | All JSON parsing fails in hooks                                   | fail-open: echo '{}' + exit 0            |
| D-3 | Agent Teams env var          | team() mode unavailable                                           | Task() subagent mode (proven path)       |
| D-5 | smart-notify.sh patterns     | No async dispatch reference for future network hooks              | Inline implementation                    |
| D-6 | llmdoc/ documentation system | Documentation updates have no standard structure to follow        | Free-form markdown (lower quality)       |
| D-7 | Three-layer memory model     | Memory architecture docs lack integration context for Auto Memory | Document Auto Memory as standalone layer |

## Execution Risks

### Wave Dependency Chain

The 5-wave execution creates a critical path: ST-1 -> ST-2 -> ST-3/ST-4 -> ST-5. Any delay or failure in an upstream wave blocks all downstream waves.

**Longest critical path**: ST-1 -> ST-2a -> ST-2b -> ST-2d -> ST-3 -> ST-5 (6 sequential steps).

**Parallel opportunities**: ST-3 and ST-4 can execute in parallel after Wave 2 completes. ST-2b and ST-2c can execute in parallel after ST-2a completes.

### Sub-Task Boundary Leakage

ST-2 (documentation) and ST-4 (Agent Teams) both modify `plugins/hooks/CLAUDE.md`. This creates a merge conflict risk if ST-2d and ST-4 execute in parallel. Mitigation: ST-2d completes in Wave 2 before ST-4 starts in Wave 4, per the dependency DAG.

### Documentation-Code Desync Window

Between Wave 2 completion (docs updated to reflect 7 events / 14 scripts with enhanced orchestration hooks) and Wave 3 completion (scripts actually enhanced), documentation describes capabilities that do not yet exist. This window is acceptable because the documentation describes the target state, and the scripts already exist in skeleton form.

## Residual Risks

These risks cannot be fully mitigated within the scope of this proposal.

### RR-1: Platform Semantics Opacity

**Description**: The exact behavior of Claude Code when processing hook return values for TeammateIdle/TaskCompleted events is undocumented (OQ-BLOCK-1, OQ-BLOCK-2). All hook output design is based on inference from PreToolUse/PostToolUse patterns. The platform may treat orchestration event returns entirely differently.
**Acceptance**: SC-6 (logging-first) ensures the baseline value (structured telemetry) is delivered regardless of platform return handling. Orchestration directives are additive upside, not required functionality.

### RR-2: Agent Teams API Surface Instability

**Description**: "Research Preview" features carry no stability guarantees. The `team()` API, env var name, iteration semantics, and agent discovery mechanism could all change in a minor release. The state machine and dev.md pseudo-code may require rewriting.
**Acceptance**: HC-3 mandates fallback to Task() mode. The Task() path is the proven, stable path. Agent Teams is opt-in experimental enrichment. The state machine design is structured to be adaptable (states map to concepts, not API calls).

### RR-3: Cross-Platform jq Behavior Variance

**Description**: jq versions differ across macOS (Homebrew), Linux (apt/yum), and CI environments. Edge cases in JSON parsing (unicode handling, large number precision, null coalescing) may behave differently across jq versions.
**Acceptance**: Hook scripts use basic jq operations (`empty`, `-r`, `//`, `-c`) that are stable across all jq 1.5+ versions. No advanced jq features (reduce, foreach, try-catch) are used.

### RR-4: Undiscovered Documentation References

**Description**: Context.md identifies 7 documentation files with drift (Section 11), but additional files outside the llmdoc/ and plugins/ directories may reference stale hook counts (e.g., README.md, CONTRIBUTING.md, external wikis). A comprehensive grep may miss references that use different phrasing (e.g., "five lifecycle hooks" vs "5 lifecycle points").
**Acceptance**: PBT-5 uses numeric grep patterns. Natural-language references require manual review. The risk impact is low (documentation inaccuracy in non-primary files).
