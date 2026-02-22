# D2C + P2C Plugin

Design-to-Code and PRD-to-Code workflow for C-end (consumer-facing) AI coding. Generates semantic, component-based UI code from design screenshots and executable logic code from PRD documents — all from local files, no external data source dependencies.

## Agent Types

| Agent | Color | Model | Role |
|-------|-------|-------|------|
| d2c:design-analyzer | cyan | sonnet | Visual analysis of design screenshots — extract layout, colors, spacing, component hierarchy |
| d2c:ui-generator | blue | sonnet | Generate semantic UI component code adapted to target tech stack (React/Vue) |
| d2c:prd-analyzer | green | sonnet | Parse PRD documents, structure requirements, perform intelligent chunking for complex docs |
| d2c:logic-generator | magenta | sonnet | Generate logic code (interactions, state, routing, API calls) with project context enhancement |
| d2c:prd-generator | yellow | sonnet | Generate structured PRD from design screenshots and/or user natural language descriptions |

## Commands

| Command | Description |
|---------|-------------|
| `/d2c` | Design screenshots → semantic UI component code |
| `/p2c` | PRD documents → logic code with project context |
| `/d2c-full` | Integrated D2C + P2C pipeline (with optional PRD generation) |
| `/gen-prd` | Generate structured PRD from design screenshots and/or user descriptions |

## Workflow Phases

### /d2c (Design to Code)

```
Phase 0: Init — parse args, create run dir
Phase 1: Design Analysis [Hard Stop] — visual analysis, user confirms
Phase 1.5: Image Asset Generation — generate backgrounds/maps via Gemini API (conditional)
Phase 2: UI Code Generation — semantic components for React/Vue
Phase 2.5: Fidelity Check — compare generated code vs original design
Phase 3: Delivery [Hard Stop] — present results, user accepts
```

### /p2c (PRD to Code)

```
Phase 0: Init — parse args, create run dir
Phase 1: PRD Analysis — structure and chunk document
Phase 2: Context Retrieval — extract project API/SDK patterns
Phase 3: Logic Generation — single or multi-agent concurrent
Phase 4: Delivery [Hard Stop] — present results, user accepts
```

### /gen-prd (Generate PRD)

```
Phase 0: Init — determine mode (design-only / description-only / merged)
Phase 1: PRD Generation — infer requirements from screenshots and/or descriptions
Phase 2: User Review [Hard Stop] — present gaps/assumptions, user edits
Phase 3: Delivery — output generated-prd.md for /p2c or /d2c-full
```

### /d2c-full (Integrated Pipeline)

```
Phase 0: Init
Phase 1: Design Analysis [Hard Stop]
Phase 1.5: Image Asset Generation (conditional)
Phase 2: UI Code Generation
Phase 2.5: Fidelity Check
Phase 3: PRD Generation or Analysis
  - If no PRD provided: generate PRD from design screenshots [Hard Stop for review]
  - If PRD provided: parse existing PRD
Phase 4: Context Retrieval
Phase 5: Logic Integration — merge logic into UI components
Phase 6: Delivery [Hard Stop]
```

## Supported Tech Stacks (v1)

- **React**: Functional components, JSX, CSS Modules
- **Vue**: Vue 3 SFC, Composition API, scoped styles

## Skills

| Skill | Description |
|-------|-------------|
| `d2c:tech-stack-adapter` | Route to React/Vue reference conventions |
| `d2c:prd-chunker` | Intelligent PRD document chunking |
| `d2c:image-generator` | Generate 4K image assets via Gemini API (backgrounds, maps, illustrations) |

## Key Design Principles

1. **"Rules + AI" Fusion**: Structured prompts encode layout rules and semantic constraints; AI handles intent understanding and code generation
2. **Project Codebase as Knowledge Base**: Use `codebase-retrieval` to extract real API patterns from the target project — no external knowledge base needed
3. **Incremental Generation**: Users can select specific components for targeted generation
4. **Visual Fidelity Verification**: Compare generated UI against original design to catch deviations
5. **Semantic Code Quality**: Enforce semantic HTML, component decomposition, no div-soup
6. **Pixel-Perfect Gradients**: Extract and reproduce all CSS gradients with precise color stops — never approximate as solid colors
7. **4K Image Asset Generation**: Detect non-code-reproducible visuals (backgrounds, maps) and generate via Gemini API

## Constraints

- All inputs MUST be local files (screenshots, PRD markdown, project code)
- No external API integrations (Figma, Feishu, etc.)
- **Image generation MUST use `d2c:image-generator` skill only** — NEVER call MCP image tools (`mcp__banana-image__*`) directly
- Generated code MUST use semantic HTML elements where appropriate
- Tech stack adapter MUST be applied before code generation
- Hard Stop gates MUST be respected — never skip user confirmation
- Multi-agent chunking threshold: 3+ feature modules or 5000+ characters
