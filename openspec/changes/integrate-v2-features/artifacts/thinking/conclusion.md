---
generated_at: "2026-02-06T00:20:00Z"
generator_version: "1.0"
confidence: medium-high
reasoning_steps: 7
---

# Deep Thinking Conclusion

## Question Review

**Original Question**:
Integrate Claude Code v2.1.32-33 new features (Agent Teams, Agent Memory, TeammateIdle/TaskCompleted Hooks, Task(agent_type) restrictions) into ccg-workflows plugins system.

**Question Essence**:
How to create a detailed plan that maps 4 platform features to 7 plugins with 23 agents, maximizing benefit while preserving backward compatibility and architectural invariants.

---

## Reasoning Chain

### Step 1: Feature-Plugin Applicability Analysis

**Reasoning**: Not every feature benefits every plugin. We need an applicability matrix to avoid blanket adoption (complexity ceiling risk: 23 agents × 4 features = 92 potential integration points).

**Basis**:

- Boundary exploration found 3 distinct orchestration patterns (typed subagent, general-purpose, skill-only)
- brainstorm/refactor use zero Task() calls — Agent Teams has no integration surface
- commit is an atomic fast-path — Agent Teams overhead is counterproductive
- All 23 agents are leaf agents — Task(agent_type) has near-zero utility at agent level

**Conclusion**: Only 3 of 4 features have broad applicability. Agent Teams is narrowly applicable (tpd:dev primary, ui-design secondary). Task(agent_type) applies at command level only.

---

### Step 2: Prerequisite Identification

**Reasoning**: Before any v2 feature can be applied, structural prerequisites must be satisfied. The most critical blocker is UI-Design's 9 agents lacking YAML frontmatter.

**Basis**:

- Agent memory requires `memory` field in YAML frontmatter — impossible without frontmatter
- Task(agent_type) requires `tools` field in YAML — impossible without frontmatter
- UI-Design uses informal markdown `## Required Tools` sections instead of YAML

**Conclusion**: UI-Design frontmatter migration (9 files) is a hard Phase 0 prerequisite. It blocks all v2 features for 39% of agents (9/23).

---

### Step 3: Backward Compatibility Strategy

**Reasoning**: The plugin system serves multiple users who may run different Claude Code versions. Adding new frontmatter fields must not break existing behavior.

**Basis**:

- User confirmed working assumption: old CLI ignores unknown frontmatter fields (to be verified)
- Agent Teams requires experimental env flag — built-in feature gate
- Existing 50+ skills and 12 hooks must not change behavior (HC-12)
- Both Codex and Gemini analyses independently concluded: zero-change default behavior is non-negotiable

**Conclusion**: Two-layer protection: (1) unknown fields silently ignored by old CLI, (2) Agent Teams behind experimental flag with conditional fallback in command files. All changes are additive, never replacing.

---

### Step 4: Memory System Architecture Decision

**Reasoning**: Native agent memory and existing workflow-memory serve different abstraction levels. They must coexist, not compete.

**Basis**:

- Native memory: per-agent, auto-maintained, 200-line MEMORY.md, cross-session learnings
- Workflow-memory: per-workflow, explicitly triggered, arbitrarily large JSON, within-session state
- Session-compactor: recovery snapshots with structured task lists and file manifests
- context-memory plugin has zero agents — native memory doesn't directly apply to it

**Conclusion**: Three-tier memory architecture with clear ownership:

| Layer | System              | Scope               | Lifecycle                    | Example                                |
| ----- | ------------------- | ------------------- | ---------------------------- | -------------------------------------- |
| Hot   | Native agent memory | Per-agent learnings | Persistent, auto-maintained  | "This project uses monorepo with pnpm" |
| Warm  | Workflow-memory     | Per-workflow state  | Session-bound, explicit save | Phase artifacts, checkpoint data       |
| Cold  | Session-compactor   | Recovery snapshots  | Time-limited (7d/3d/1d)      | Full session recovery points           |

---

### Step 5: Agent Teams Scoping Decision

**Reasoning**: Agent Teams is the highest-effort, highest-risk feature. Must be scoped to the highest-value target first, then expanded incrementally.

**Basis**:

- tpd:dev iterative cycle (prototype → audit → fix → re-audit) is the natural Agent Teams use case — direct agent communication reduces orchestrator round-trips
- thinking phase explicitly forbids background execution (HC-3) — incompatible with Agent Teams async model
- Commit workflow is atomic fast-path — overhead unwanted
- brainstorm/refactor have zero Task() calls — no integration surface
- ui-design needs typed agent migration first (general-purpose → typed) — multi-step prerequisite

**Conclusion**: Agent Teams adoption follows strict scoping: tpd:dev first (Phase 3), ui-design deferred (Phase 4), thinking/plan/commit/brainstorm/refactor excluded.

---

### Step 6: Hook System Extension Strategy

**Reasoning**: TeammateIdle/TaskCompleted represent a paradigm shift from tool-centric to agent-centric hooks. The hook system must support both paradigms.

**Basis**:

- 5 current lifecycle events are all tool-centric (PreToolUse, PostToolUse, etc.)
- TeammateIdle/TaskCompleted input schemas are unknown (HC-10)
- User chose "defensive parsing, verify later" approach
- Existing bash+jq convention (stdin JSON, stderr logging, stdout output) should be preserved

**Conclusion**: Add two new top-level keys to hooks.json with defensive scripts. Create `scripts/orchestration/` directory. Scripts log raw input for schema discovery and dispatch notifications. Iterate once actual event data is available.

---

### Step 7: Implementation Ordering Synthesis

**Reasoning**: Combining all constraints and dependencies yields a clear 5-phase implementation plan with well-defined parallelism opportunities.

**Comprehensive Basis**:

- From boundary exploration: UI-Design prerequisite, leaf agent architecture, filesystem IPC
- From Codex analysis: 4-phase ordering with critical path SP-1 → SP-2/3/4 → SP-6 → SP-5
- From Gemini analysis: per-plugin incremental migration, complexity ceiling prevention
- From user clarification: skip P0 verification, proceed with defensive assumptions

**Final Conclusion**: The integration plan has 5 phases with Phase 1 fully parallelizable, yielding an estimated 14+23+5+2 = 44 file modifications across all phases.

---

## Core Conclusion

### Direct Answer

The 4 v2.1.32-33 features can be integrated into ccg-workflows through a **5-phase plan** with clear dependency ordering:

1. **Phase 0** (prerequisite): Migrate 9 UI-Design agents to YAML frontmatter
2. **Phase 1** (foundation, 3 parallel tracks): Add memory fields (23 agents) + Task restrictions (5 commands) + Hook events (2 scripts)
3. **Phase 2** (documentation): Memory system coexistence strategy
4. **Phase 3** (enhancement): Agent Teams for tpd:dev behind experimental flag
5. **Phase 4** (deferred): Agent Teams for ui-design after typed agent migration

Three plugins are explicitly excluded from Agent Teams: commit (atomic fast-path), brainstorm (skill-only), refactor (sequential skill chain).

### Key Points

1. **"Add, never replace"**: All changes are additive. Native memory supplements workflow-memory. Agent Teams supplements Task(). New hooks supplement existing hooks. No existing behavior changes.

2. **"Feature gate everything"**: Agent Teams behind experimental flag. Memory fields silently ignored by old CLI. Hook scripts defensively parse unknown schemas. Zero-change default for all users.

3. **"Scope narrowly, expand later"**: Agent Teams starts with tpd:dev only (highest value). Memory starts with recommended scopes (8 user / 15 project). Hooks start with logging/notification. Each can be expanded independently.

4. **"UI-Design is the gating factor"**: 39% of agents (9/23) are blocked by the frontmatter migration prerequisite. This is the single most critical path item.

5. **"Three-tier memory, clear ownership"**: Native memory = agent learnings (auto). Workflow-memory = structured state (explicit). Session-compactor = recovery (timed). Users never need to think about two systems for basic workflows.

---

## Confidence Analysis

### Overall Confidence: Medium-High

**Confidence Explanation**:
High confidence on constraint mapping and implementation ordering (derived from exhaustive codebase exploration). Medium confidence on Agent Teams specifics (experimental feature with incomplete documentation) and hook event schemas (unknown input format).

### Confidence Breakdown

| Dimension              | Score (1-10) | Notes                                                                                           |
| ---------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| Evidence Sufficiency   | 8            | 4 boundary explorations + 2 model analyses cover all 7 plugins comprehensively                  |
| Reasoning Rigor        | 8            | Clear dependency chain with critical path analysis; each step has explicit basis                |
| Model Consensus        | 7            | Codex and Gemini agree on 7 consensus constraints; diverge on memory system long-term strategy  |
| Assumption Reliability | 6            | 3 unverified assumptions (frontmatter backward compat, hook schemas, Agent Teams sync behavior) |
| **Weighted Total**     | **7.3**      |                                                                                                 |

---

## Key Assumptions

### Assumption List

| #   | Assumption                                                                    | Reliability | Impact if Wrong                                                       |
| --- | ----------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------- |
| 1   | Old Claude Code silently ignores unknown frontmatter fields like `memory`     | Medium      | Need version gate; delay Phase 1a until verified                      |
| 2   | TeammateIdle/TaskCompleted follow standard hook input pattern (JSON on stdin) | High        | Script restructuring needed if different                              |
| 3   | Agent Teams works with typed subagent_type (not only general-purpose)         | Medium      | tpd:dev Agent Teams design needs revision if typed agents unsupported |
| 4   | Agent Teams can be incrementally adopted per-command                          | High        | Platform feature; unlikely to require all-or-nothing                  |
| 5   | MEMORY.md 200-line overflow truncates silently (newest content lost)          | Low         | Need rotation strategy regardless, but urgency varies                 |

### Assumption Risks

If assumption #1 fails: Phase 1a must add `memory` field only for v2.1.32+ users (via documentation/CI check), or wrap in a version-conditional block.

If assumption #3 fails: tpd:dev Agent Teams design must use general-purpose teammates with embedded agent instructions in prompts, similar to current ui-design pattern.

---

## Limitations & Improvements

### Current Limitations

1. **Agent Teams documentation gap**: The experimental feature lacks complete documentation. Hook event schemas, mailbox message format, and sync-vs-async behavior are all unconfirmed.
2. **No runtime testing**: All analysis is static (codebase exploration + reasoning). No actual runtime verification of feature interactions.
3. **Single-user perspective**: Analysis assumes solo developer workflow. Multi-user team scenarios (mixed CLI versions, shared Agent Teams sessions) are not explored.

### Scope of Applicability

- **Applicable**: ccg-workflows plugins on Claude Code v2.1.32+ with single-user workflow
- **Not Applicable**: Multi-user collaborative Agent Teams scenarios; pre-v2.1.32 environments; plugins outside ccg-workflows

### Further Exploration Directions

- Runtime testing of memory field backward compatibility on pre-v2.1.32 CLI
- Agent Teams prototype on tpd:dev to validate benefit hypothesis
- TeammateIdle/TaskCompleted schema discovery through runtime event logging

---

## Summary

**One-Sentence Conclusion**:
Integrate v2.1.32-33 features through a 5-phase additive plan: UI-Design frontmatter migration → parallel foundation (memory + restrictions + hooks) → memory coexistence docs → Agent Teams for tpd:dev → deferred expansion; excluding Agent Teams from commit/brainstorm/refactor.

**Reasoning Chain Summary**:
Feature applicability analysis → Prerequisite identification (UI-Design frontmatter) → Backward compat strategy (additive, feature-gated) → Memory architecture (three-tier) → Agent Teams scoping (tpd:dev first) → Hook extension (defensive parsing) → 5-phase implementation ordering

**Confidence**: Medium-High | **Reasoning Steps**: 7
