# Design: D2C + P2C Plugin Architecture

## Context

Inspired by Qunar's C-end AI Coding practice, this plugin implements a "rules + AI" fusion pattern for design-to-code conversion and a "chunking + knowledge enhancement" pattern for PRD-to-logic-code generation. The key constraint is **no external data source dependencies** — all inputs are local files and project codebase.

### Stakeholders
- Frontend developers working on C-end (consumer-facing) applications
- Teams with pixel-perfect UI reproduction requirements
- Teams needing logic code generation from requirement documents

## Goals / Non-Goals

### Goals
- Generate semantic, component-based UI code from design screenshots with high visual fidelity
- Generate executable logic code from PRD documents using project-real APIs (no hallucination)
- Support multiple tech stacks (React, React Native, Vue, Taro, etc.)
- Leverage project codebase as knowledge base to eliminate API hallucination
- Handle complex/long PRD documents via intelligent chunking and multi-agent concurrency

### Non-Goals
- Figma API integration or any external design tool API
- Feishu/Lark document integration or any external document platform
- IDE plugin development (out of scope for ccg-workflows)
- Pixel-perfect validation (automated visual regression testing)
- Runtime code execution or preview server

## Decisions

### Decision 1: New plugin rather than extending ui-design

**Choice**: Create `plugins/d2c/` as an independent plugin.

**Rationale**:
- ui-design's workflow is design *creation* (from scratch/optimize); D2C is design *reproduction*
- Agent roles are fundamentally different (designer vs code generator)
- Validation criteria differ (UX guidelines vs pixel fidelity + code quality)
- Resource libraries are incompatible (design styles vs tech stack templates)
- Independent evolution paths — D2C+P2C may adopt different model strategies

**Alternatives considered**:
- Extend ui-design with new phases: Rejected — would bloat ui-design and create confused user mental model
- Fork ui-design: Rejected — unnecessary duplication, better to start clean and reuse patterns

### Decision 2: AI vision replaces Figma data parsing

**Choice**: Use model multimodal (vision) capability to analyze design screenshots directly.

**Rationale**:
- No external API dependency (Figma, Sketch, etc.)
- Modern vision models can understand layout, spacing, colors, component hierarchy from screenshots
- Prompt engineering serves as the "rule system" — structured prompts encode the same constraints that Qunar implements as code rules (semantic tags, component splitting, layout optimization)
- Lower barrier to entry — any screenshot works, not just Figma exports

**Trade-offs**:
- Lower precision than Figma JSON parsing for exact pixel values (mitigated by structured prompts requiring CSS values)
- Cannot extract design tokens automatically (mitigated by user-provided design system config)

### Decision 3: Project codebase as knowledge base (replaces RAG)

**Choice**: Use `codebase-retrieval` MCP to extract real API patterns, SDK usage, and component conventions from the target project.

**Rationale**:
- Aligns with Qunar's finding: RAG is overkill when SDK docs are bounded
- Project code IS the ground truth — import paths, function signatures, parameter patterns
- No infrastructure overhead (vector DB, embedding pipeline)
- Always up-to-date (reads live codebase)

**How it works**:
1. Before logic code generation, retrieve: existing API call patterns, SDK imports, route definitions, state management patterns
2. Inject retrieved context into generation prompt as "project conventions"
3. Generated code follows real patterns, not hallucinated APIs

### Decision 4: Multi-agent chunking for P2C

**Choice**: Dynamically split long PRDs into semantic chunks, assign each to a sub-agent for parallel generation.

**Rationale**:
- Long PRDs exceed effective context window for detailed code generation
- Single-pass generation loses details in complex multi-page requirements
- Parallel generation reduces total time
- Each sub-agent focuses on one module, producing deeper, more accurate code

**Chunking strategy**:
- By document structure (headings, tables = natural boundaries)
- By business module (page/feature groupings)
- Configurable threshold: documents below threshold use single-agent mode

## Architecture

### Plugin Structure

```
plugins/d2c/
├── .claude-plugin/
│   └── plugin.json
├── CLAUDE.md
├── commands/
│   ├── d2c.md              # Design screenshots → UI code
│   ├── p2c.md              # PRD document → logic code
│   └── full.md             # D2C + P2C integrated pipeline
├── agents/
│   ├── design-analyzer.md  # Visual analysis + layout extraction
│   ├── ui-generator.md     # Semantic UI code generation
│   ├── prd-analyzer.md     # PRD parsing + intelligent chunking
│   └── logic-generator.md  # Logic code generation with context enhancement
└── skills/
    ├── tech-stack-adapter/
    │   ├── SKILL.md
    │   └── references/
    │       ├── react.md
    │       ├── react-native.md
    │       ├── vue.md
    │       └── taro.md
    └── prd-chunker/
        └── SKILL.md
```

### Workflow Phases

#### /d2c Command (Design to UI Code)

```
Phase 0: Init
  Parse args (screenshots, tech stack, output dir)
  Write input.md

Phase 1: Design Analysis [Hard Stop]
  Agent: design-analyzer
  Input: screenshot images
  Output: visual-analysis.md (layout structure, colors, spacing, component hierarchy)
  User confirms analysis accuracy

Phase 2: UI Code Generation
  Agent: ui-generator
  Input: visual-analysis.md + tech-stack template
  Process:
    - Apply tech-stack-adapter skill for framework-specific rules
    - Generate semantic, component-based code
    - Process image/icon references (describe as placeholders)
  Output: generated-code/ directory with component files

Phase 3: Delivery [Hard Stop]
  Present generated code summary
  User reviews and accepts
```

#### /p2c Command (PRD to Logic Code)

```
Phase 0: Init
  Parse args (PRD files, target project path)
  Write input.md

Phase 1: PRD Analysis
  Agent: prd-analyzer
  Input: local PRD files (markdown/text)
  Output: structured-requirements.md + chunks.json (if complex)

Phase 2: Context Retrieval
  Use codebase-retrieval MCP on target project
  Extract: API patterns, SDK usage, route patterns, state management
  Output: project-context.md

Phase 3: Logic Generation [parallel if chunked]
  Agent: logic-generator (multiple instances if chunked)
  Input: structured-requirements + project-context
  Output: logic-code/ directory

Phase 4: Delivery [Hard Stop]
  Present generated logic code summary
  User reviews and accepts
```

#### /d2c-full Command (Design + PRD to Complete Code)

```
Phase 0: Init
Phase 1: Design Analysis [Hard Stop]     <- from /d2c
Phase 2: UI Code Generation               <- from /d2c
Phase 3: PRD Analysis                      <- from /p2c
Phase 4: Context Retrieval                 <- from /p2c
Phase 5: Logic Integration
  Agent: logic-generator
  Input: generated UI code + structured requirements + project context
  Process: Add interactions, state, routing, API calls to UI components
  Output: integrated-code/ directory
Phase 6: Delivery [Hard Stop]
```

### Agent Roles

| Agent | Color | Model | Purpose |
|-------|-------|-------|---------|
| design-analyzer | cyan | sonnet | Extract visual structure from screenshots |
| ui-generator | blue | sonnet | Generate semantic UI component code |
| prd-analyzer | green | sonnet | Parse and chunk PRD documents |
| logic-generator | magenta | sonnet | Generate logic code with project context |

### Data Flow

```
Screenshots --> [design-analyzer] --> visual-analysis.md
                                            |
Tech Stack Config --> [tech-stack-adapter] --+
                                            v
                                    [ui-generator] --> generated-code/
                                            |
PRD Files --> [prd-analyzer] --> structured-requirements.md
                                  + chunks.json
                                            |
Project Code --> [codebase-retrieval] --> project-context.md
                                            |
                                            v
                                    [logic-generator] --> logic-code/
                                            |
                                            v (full mode only)
                                    [logic-generator] --> integrated-code/
```

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| Vision-based analysis less precise than Figma JSON | Medium | Structured prompts with explicit CSS value requirements; user can provide design specs manually |
| Long PRD chunking may split related requirements | Medium | Semantic chunking preserves module boundaries; cross-reference injection between chunks |
| Generated code quality varies by model capability | High | Tech stack adapter enforces framework-specific best practices; post-generation lint/format |
| Project context retrieval may miss relevant patterns | Low | User can supplement with explicit context files; iterative retrieval with expanding scope |

## Resolved Questions

1. **Incremental generation**: YES — the plugin SHALL support generating code for one component at a time, allowing the user to select specific components from the visual analysis for targeted generation.
2. **Visual diff/comparison**: YES — after UI code generation, the plugin SHALL provide a visual comparison mechanism between the original design screenshot and the generated UI to verify fidelity.
3. **V1 tech stack templates**: React and Vue only. React Native and Taro deferred to v2.
