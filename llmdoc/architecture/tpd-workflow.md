# Architecture of TPD Workflow

## 1. Identity

- **What it is:** A three-phase development workflow (Thinking → Plan → Dev) with multi-model collaboration.
- **Purpose:** Transform ambiguous requirements into zero-decision executable plans and iteratively implement minimal verifiable phases.
- **Execution Profiles:** Supports both Claude native orchestration (10-agent split) and Trae orchestration (dual-core `codex`/`gemini` + `role` routing).

## 2. Core Components

- `plugins/tpd/commands/thinking.md` (`/tpd:thinking`): Deep thinking workflow with complexity-based depth routing (light/deep/ultra).
- `plugins/tpd/commands/plan.md` (`/tpd:plan`): OpenSpec planning with multi-model architecture analysis and PBT property extraction.
- `plugins/tpd/commands/dev.md` (`/tpd:dev`): Iterative development with prototype → refactor → audit flow.
- `plugins/tpd/commands/init.md` (`/tpd:init`): System initialization for OpenSpec and MCP tool validation.
- `plugins/tpd/skills/codex-cli/SKILL.md` (`tpd:codex-cli`): Backend analysis wrapper using `codeagent-wrapper codex`.
- `plugins/tpd/skills/gemini-cli/SKILL.md` (`tpd:gemini-cli`): Frontend analysis wrapper using `codeagent-wrapper gemini`.
- `plugins/tpd/.trae/agents/README.md`: Trae dual-core agent profile (`codex` + `gemini`) with `role=constraint|architect|implementer|auditor`.
- `plugins/tpd/.trae/skills/{thinking,plan,dev}/SKILL.md`: Trae role-based invocation examples and checkpoints.

## 3. Execution Flow (LLM Retrieval Map)

```mermaid
graph TD
    subgraph Phase1[Thinking Phase]
        T1[complexity-analyzer] --> T2[boundary-explorer x4]
        T2 --> T3[codex + gemini role=constraint]
        T3 --> T4[thought-synthesizer]
        T4 --> T5[conclusion-generator]
        T5 --> T6[handoff-generator]
    end

    subgraph Phase2[Plan Phase]
        P1[context-analyzer + requirement-parser] --> P2[codex + gemini role=architect]
        P2 --> P3[Ambiguity Resolution]
        P3 --> P4[architecture-analyzer]
        P4 --> P5[task-decomposer]
        P5 --> P6[risk-assessor]
        P6 --> P7[plan-synthesizer]
    end

    subgraph Phase3[Dev Phase]
        D1[context-retriever + codex role=implementer mode=analyze] --> D2[codex + gemini role=implementer mode=prototype]
        D2 --> D3[code-implementer refactor]
        D3 --> D4[Side-effect Review]
        D4 --> D5[codex + gemini role=auditor]
        D5 --> D6{All Tasks Done?}
        D6 -->|No| D1
        D6 -->|Yes| D7[openspec archive]
    end

    Phase1 -->|handoff.json| Phase2
    Phase2 -->|plan.md + tasks.md| Phase3
```

### 3.1 Thinking Phase

- **1. Complexity Assessment:** `plugins/tpd/skills/complexity-analyzer/SKILL.md` evaluates problem (1-10 score → light/deep/ultra).
- **2. Boundary Exploration:** `plugins/tpd/agents/investigation/boundary-explorer.md` explores context boundaries via `mcp__auggie-mcp__codebase-retrieval`.
- **3. Constraint Analysis (Claude Profile):** `plugins/tpd/agents/reasoning/codex-constraint.md` and `gemini-constraint.md` analyze constraints from backend/frontend perspectives.
- **3. Constraint Analysis (Trae Profile):** `@codex` + `@gemini` with `role=constraint` produce `codex-thought.md` and `gemini-thought.md`.
- **4. Synthesis:** `plugins/tpd/skills/thought-synthesizer/SKILL.md` aggregates constraints into unified set.
- **5. Handoff:** `plugins/tpd/skills/handoff-generator/SKILL.md` produces `handoff.json` for Plan phase.

### 3.2 Plan Phase

- **1. Context Retrieval:** `plugins/tpd/agents/investigation/context-analyzer.md` retrieves codebase context.
- **2. Multi-Model Architecture (Claude Profile):** `plugins/tpd/agents/planning/codex-architect.md` (backend) and `gemini-architect.md` (frontend) generate architecture plans.
- **2. Multi-Model Architecture (Trae Profile):** `@codex(role=architect)` and `@gemini(role=architect)` generate `codex-plan.md` and `gemini-plan.md`.
- **3. Ambiguity Resolution:** MCP direct calls to identify and resolve all decision points.
- **4. Integration:** Sequential skills: `architecture-analyzer` → `task-decomposer` → `risk-assessor` → `plan-synthesizer`.
- **5. Validation:** Execute `openspec validate --strict`.

### 3.3 Dev Phase

- **1. Prototype Generation (Claude Profile):** `plugins/tpd/agents/execution/codex-implementer.md` and `gemini-implementer.md` produce Unified Diff patches.
- **1. Prototype Generation (Trae Profile):** `@codex(role=implementer, mode=prototype)` and `@gemini(role=implementer, mode=prototype)` produce Unified Diff patches.
- **2. Refactor:** `plugins/tpd/skills/code-implementer/SKILL.md` refactors prototypes (includes LSP impact analysis).
- **3. Audit (Claude Profile):** `plugins/tpd/agents/execution/codex-auditor.md` (security/performance) and `gemini-auditor.md` (UX/accessibility).
- **3. Audit (Trae Profile):** `@codex(role=auditor)` and `@gemini(role=auditor)` produce `audit-codex.md` and `audit-gemini.md`.

## 4. Parallel Execution Constraints

| Phase    | Step                   | Max Agents | Claude Profile Agent Types                | Trae Profile Agent Types |
| -------- | ---------------------- | ---------- | ----------------------------------------- | ------------------------ |
| Thinking | Boundary Exploration   | 4          | `boundary-explorer`                       | `boundary-explorer` |
| Thinking | Constraint Analysis    | 2          | `codex-constraint`, `gemini-constraint`   | `@codex(role=constraint)`, `@gemini(role=constraint)` |
| Plan     | Context + Requirements | 2          | `context-analyzer`, `requirement-parser`  | `context-analyzer`, `requirement-parser` |
| Plan     | Architecture           | 2          | `codex-architect`, `gemini-architect`     | `@codex(role=architect)`, `@gemini(role=architect)` |
| Dev      | Context + Analysis     | 2          | `context-retriever`, `codex-implementer`  | `context-retriever`, `@codex(role=implementer,mode=analyze)` |
| Dev      | Prototype              | 2          | `codex-implementer`, `gemini-implementer` | `@codex(role=implementer,mode=prototype)`, `@gemini(role=implementer,mode=prototype)` |
| Dev      | Audit                  | 2          | `codex-auditor`, `gemini-auditor`         | `@codex(role=auditor)`, `@gemini(role=auditor)` |

## 5. Artifact Directory Structure

```
openspec/changes/${PROPOSAL_ID}/
├── artifacts/
│   ├── thinking/
│   │   ├── complexity-analysis.md
│   │   ├── boundaries.json
│   │   ├── explore-*.json
│   │   ├── codex-thought.md
│   │   ├── gemini-thought.md
│   │   ├── synthesis.md
│   │   ├── conclusion.md
│   │   └── handoff.json
│   ├── plan/
│   │   ├── context.md
│   │   ├── requirements.md
│   │   ├── codex-plan.md
│   │   ├── gemini-plan.md
│   │   ├── architecture.md
│   │   ├── tasks.md
│   │   └── plan.md
│   └── dev/
│       ├── context.md
│       ├── prototype-codex.diff
│       ├── prototype-gemini.diff
│       ├── changes.md
│       ├── audit-codex.md
│       └── audit-gemini.md
└── tasks.md
```

## 6. Design Rationale

- **Boundary-Based Exploration:** Agents split by context boundaries (module/directory/domain), not roles. Ensures comprehensive constraint discovery.
- **Sandbox Safety:** All external model calls use `--sandbox read-only`. Claude reviews and refactors all code before applying.
- **Constraint-First Philosophy:** Thinking outputs constraints (not solutions), Plan eliminates ambiguities (not assumptions), Dev implements minimal phases (not complete features).
