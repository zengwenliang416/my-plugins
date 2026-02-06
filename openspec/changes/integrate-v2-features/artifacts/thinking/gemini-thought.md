---
generated_at: 2026-02-06T00:00:00+08:00
model: claude-opus-4-6
level: medium
session_id: constraint-analysis-integrate-v2
parallel_streams: 3
note: Gemini CLI unavailable; analysis performed via Claude ultra thinking
---

# Gemini Constraint Analysis

## Original Question

Integrate Claude Code v2.1.32-33 new features (Agent Teams, agent memory frontmatter, TeammateIdle/TaskCompleted hooks, Task(agent_type) restrictions) into ccg-workflows (7 plugins, 23 agents, 50+ skills, 12 hooks). Analyzed from UX, maintainability, and innovation perspectives with focus on migration friction, backward compatibility, and complexity risk.

## Multi-Perspective Constraints

### Stream 1: User Experience Constraints

**C1.1 - Filesystem Observability Must Be Preserved**
Users currently debug and inspect workflows by reading `run_dir` artifacts (synthesis.md, handoff.json, boundaries.json). Agent Teams mailbox communication is opaque by comparison. Any adoption of Agent Teams MUST continue producing filesystem artifacts so users retain full workflow visibility.

**C1.2 - Dual Memory System Creates Cognitive Overhead**
Native agent memory (per-agent, scoped to `~/.claude/agent-memory/<name>/`) serves cross-session learning. Workflow-memory (context-memory plugin, stored in run_dir) serves within-session continuity. These are complementary but users will not intuitively understand the distinction. Constraint: users who only use basic workflows must never need to know about two memory systems.

**C1.3 - Zero-Friction Default for Non-Adopters**
The experimental flag `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` means Agent Teams is opt-in. Constraint: when the flag is absent, every plugin must behave identically to the pre-integration state. No workflow, skill, or hook may break due to v2 feature integration.

**C1.4 - UI-Design Users Face Prerequisite Disruption**
9 UI-Design agents lack YAML frontmatter. Adding frontmatter is a structural change that may alter agent loading/matching behavior. Users of the ui-design plugin face mandatory breaking migration before any v2 feature can be applied.

**C1.5 - Migration Must Be Per-Plugin, Not Big-Bang**
Users often use subsets of plugins (e.g., only tpd, or only commit). Migration friction must be isolated per plugin so that upgrading one plugin does not force changes in others.

### Stream 2: Maintainability Constraints

**C2.1 - run_dir is the Universal IPC Contract**
All 50+ skills, all phase handoffs (thinking->plan->dev), and all cross-agent communication use the `${run_dir}/` filesystem pattern. This is the single most important convention in the codebase. Agent Teams mailbox MUST NOT replace run_dir; it can only supplement it.

**C2.2 - "NEVER background" vs Agent Teams Tension**
`thinking.md` explicitly prohibits background execution -- synchronous deep thinking is a design principle, not an accident. Agent Teams inherently encourages async parallel work. These are fundamentally incompatible for the thinking phase. Constraint: thinking phase must be excluded from Agent Teams adoption.

**C2.3 - Leaf Agent Architecture Limits Task() Utility**
All 23 agents are leaf agents (no sub-agent spawning). `Task(agent_type)` restriction syntax is only meaningful when agents spawn sub-agents. This feature has near-zero immediate utility. It becomes relevant only if Agent Teams transforms some command orchestrators into team leaders that spawn typed agents.

**C2.4 - Hook Paradigm Shift: Tool-Centric to Agent-Centric**
Existing 12 hook scripts are tool-centric (PreToolUse, PostToolUse patterns). TeammateIdle and TaskCompleted are agent-centric lifecycle events -- a different paradigm. Constraint: the hook system must support both paradigms simultaneously. New agent-centric hooks must not interfere with existing tool-centric hooks.

**C2.5 - TeammateIdle/TaskCompleted Input Schemas Are Unknown**
The input schemas for these new hook events are undocumented in the current boundary exploration. No hook handler can be designed without schema knowledge. This is a hard blocker for hooks plugin integration.

**C2.6 - YAML Frontmatter Migration is a Hard Prerequisite**
UI-Design's 9 agents require YAML frontmatter before any `memory` field or `tools` field can be added. This must be sequenced as Phase 0 of any integration plan for ui-design.

**C2.7 - Dual-Model Diversity Must Be Preserved**
The Claude + Gemini dual-model principle is a core design constraint. Agent Teams is a Claude-specific feature -- Gemini agents cannot participate in Claude Agent Teams. Any workflow that uses Agent Teams must preserve a path for Gemini to contribute via the existing filesystem pattern (Skill calls producing run_dir artifacts).

### Stream 3: Innovation Opportunities

**C3.1 - Experimental Flag Enables Safe Incremental Adoption**
The `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` requirement is an opportunity, not just a constraint. It enables a feature-flag pattern: design Agent Teams integration as an enhancement layer that activates conditionally. When off, zero changes. When on, enhanced parallel coordination.

**C3.2 - TPD Dev Phase is the Highest-Value Agent Teams Target**
The iterative audit-fix cycle in tpd:dev (auditor finds issues, implementer fixes, re-audit) maps naturally to Agent Teams coordination. This is where the mailbox system provides genuine productivity gains over sequential filesystem-based handoffs.

**C3.3 - Brainstorm and Refactor Have Zero Task() Calls -- Low Adoption Cost**
These plugins have no existing agent orchestration. Agent Teams adoption for brainstorm (parallel ideation streams) and refactor (parallel analysis) would be net-new capability with zero backward compatibility concerns.

**C3.4 - Native Agent Memory Enables Cross-Session Learning**
Workflow-memory only persists within a session. Native agent memory persists across sessions. This enables agents to learn from past runs (e.g., a commit agent remembering project conventions, a plan agent remembering architectural preferences). This is genuinely new capability.

**C3.5 - Complexity Ceiling Risk**
23 agents + 50+ skills + 12 hooks + 4 new feature dimensions = combinatorial complexity. Not every agent needs every feature. Constraint: each feature must have explicit per-agent applicability criteria to prevent blanket adoption.

## Synthesized Constraints

### Consensus Constraints

These constraints are agreed across all three perspectives:

| ID   | Constraint                                                                                                                    | Confidence |
| ---- | ----------------------------------------------------------------------------------------------------------------------------- | ---------- |
| CC-1 | Filesystem run_dir communication MUST remain the primary IPC mechanism; Agent Teams mailbox supplements but never replaces it | High       |
| CC-2 | Agent Teams adoption MUST be opt-in via experimental flag with zero behavioral change when flag is absent                     | High       |
| CC-3 | UI-Design YAML frontmatter migration is a hard prerequisite (Phase 0) before any v2 feature integration                       | High       |
| CC-4 | Backward compatibility for all 50+ existing skills is non-negotiable                                                          | High       |
| CC-5 | The thinking phase MUST remain synchronous; it is excluded from Agent Teams adoption                                          | High       |
| CC-6 | Dual-model diversity (Claude + Gemini) MUST be preserved; Agent Teams workflows must maintain Gemini contribution paths       | High       |
| CC-7 | Each v2 feature must have explicit per-agent applicability criteria; no blanket adoption across all 23 agents                 | Medium     |

### Divergent Points

| Topic                      | UX Perspective                                         | Maintainability Perspective                                 | Innovation Perspective                                           |
| -------------------------- | ------------------------------------------------------ | ----------------------------------------------------------- | ---------------------------------------------------------------- |
| Memory system presentation | Single unified interface; hide implementation details  | Two systems running in parallel with clear boundaries       | Full native memory adoption; deprecate workflow-memory long-term |
| Agent Teams scope          | Minimal adoption; only where clearly simpler for users | Gradual adoption starting with tpd:dev only                 | Broad adoption across tpd, brainstorm, ui-design                 |
| Migration timeline         | Per-plugin incremental; user chooses when to upgrade   | Strict dependency ordering (frontmatter -> memory -> teams) | Fast iteration; ship experimental features behind flags          |
| Hook system expansion      | Only add hooks that users explicitly need              | Wait for schema documentation before any implementation     | Prototype handlers now to be ready when schemas stabilize        |

### UX-Specific Constraints

| ID   | Constraint                                                                                               | Rationale                                                          |
| ---- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| UX-1 | Users must never need to configure two memory systems to use basic workflows                             | Cognitive overhead kills adoption                                  |
| UX-2 | Agent Teams activation must not change the observable artifact output in run_dir                         | Users rely on inspecting artifacts for understanding and debugging |
| UX-3 | Migration for each plugin must be independently achievable                                               | Users adopt plugins selectively                                    |
| UX-4 | Error messages must clearly indicate whether a failure is in Agent Teams coordination vs skill execution | Debugging opaque multi-agent failures is the #1 UX risk            |
| UX-5 | The 200-line MEMORY.md overflow risk must be addressed before adding native memory on top                | Current system already has scaling concerns                        |

## Confidence Assessment

- **Overall Confidence**: High
- **Highest Confidence Stream**: Stream 2 (Maintainability) -- constraints are directly derivable from codebase facts
- **Lowest Confidence Area**: Hook event schemas (C2.5) -- hard blocker with no available data
- **Needs Further Exploration**:
  - TeammateIdle / TaskCompleted input schema documentation
  - Agent Teams mailbox message format and its relationship to filesystem artifacts
  - Native agent memory storage format and size limits
  - Whether Agent Teams respects the `tools` frontmatter field for restricting inter-agent communication
  - Performance impact of Agent Teams on single-user CLI workflows (latency, token cost)
