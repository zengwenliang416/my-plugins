# Style Recommender Agent

## Overview

**Trigger**: After requirement analysis completes
**Output**: `${run_dir}/style-recommendations.md` + `${run_dir}/previews/` HTML files
**Core Capability**: Style matching + variant generation + HTML preview creation

## Required Tools

- `mcp__gemini__gemini` - Creative style generation (MANDATORY)
- `mcp__auggie-mcp__codebase-retrieval` - Analyze existing style system
- `LSP` - Analyze tailwind.config.js symbols
- `Read` / `Write` / `Bash` - File operations

## Execution Flow


```
  thought: "Plan style recommendation: 1) Read requirements 2) Analyze existing styles 3) Match style library 4) Generate 3 variants 5) Create HTML previews",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

### Step 1: Read Requirements and Image Analysis

```
Read: ${run_dir}/requirements.md
Read: ${run_dir}/image-analysis.md  # if exists
```

Extract: `product_type`, `core_functions`, `target_users`, `design_preference`, `tech_stack`, `existing_components`

**If image-analysis.md exists**: Extract color system, font specs, component styles - these take priority over default recommendations.

### Step 1.2: Load Shared Design Resources

```bash
SKILL_ROOT="${CLAUDE_PLUGIN_ROOT}/plugins/ui-design/skills"
Read: ${SKILL_ROOT}/_shared/index.json
```

**User preference matching**:
| Keywords | Recommended Styles |
|----------|-------------------|
| Modern, Minimal | minimalist-swiss, clean-modern |
| Glass, Premium | glassmorphism |
| Bold, Creative | neubrutalism, bold-expressive |
| Professional, Business | corporate-professional |

### Step 1.5: Gemini Creative Scheme Generation (MANDATORY)

**CANNOT skip this step**:

```bash
~/.claude/bin/codeagent-wrapper gemini --role frontend --prompt "
You are a top-tier UI/UX designer. Generate 3 differentiated design schemes:

## Requirements
Product type: ${product_type}
Target users: ${target_users}
Core functions: ${core_functions}
Design preference: ${design_preference}

## Reference Resources
${matched_style_yaml}
${matched_color_yaml}
${matched_typography_yaml}

Provide for each scheme: Color system (HEX), Typography system, Style keywords

## Scheme A: Conservative Professional
## Scheme B: Creative Bold
## Scheme C: Balanced Hybrid
"
```

**Validation checkpoint**:

- [ ] Executed `codeagent-wrapper gemini` command
- [ ] Received 3 design schemes from Gemini
- [ ] Saved to `${run_dir}/gemini-style-recommendations.md`

### Step 2: Analyze Existing Style System (auggie-mcp + LSP)

**If has_existing_code: true, MUST execute**:

```
mcp__auggie-mcp__codebase-retrieval({
  information_request: "Find Tailwind config, CSS variables, design tokens, and theme definitions."
})
```

**If tailwind.config.js found**:

```
LSP(operation="documentSymbol", filePath="tailwind.config.js", line=1, character=1)
LSP(operation="hover", filePath="tailwind.config.js", line=5, character=10)
```

### Step 3: Build Recommendation Strategy

| Scheme         | Goal                                 | Style Choice        | Color Choice        |
| -------------- | ------------------------------------ | ------------------- | ------------------- |
| A Conservative | Quick launch, low risk               | Mature, widely used | Neutral tones       |
| B Creative     | Differentiation, attract young users | High visual impact  | High contrast/clash |
| C Balanced     | Balance professional and personality | Mixed styles        | Gradient/duotone    |

### Step 4: Generate Three Schemes

Each scheme includes:

- Style name and description
- Color system (Primary, Secondary, Accent, Semantic colors - HEX values)
- Typography (Font family, sizes, weights)
- Tailwind CSS examples
- Use case recommendations

### Step 5: Generate Recommendation Document

**Output**: `${run_dir}/style-recommendations.md`

Document includes:

- YAML frontmatter (timestamp, version, sources)
- Requirements summary
- Complete design combination per scheme
- Comparison table with recommendations
- Next steps

### Step 6: Generate Static HTML Previews (MANDATORY)

**MUST generate 4 HTML files**:

```bash
mkdir -p ${run_dir}/previews
```

| File             | Content                                              |
| ---------------- | ---------------------------------------------------- |
| `preview-A.html` | Scheme A preview (e.g., Glassmorphism + Vercel Dark) |
| `preview-B.html` | Scheme B preview (e.g., Neubrutalism + Yellow/Black) |
| `preview-C.html` | Scheme C preview (e.g., Dark Mode + Linear Purple)   |
| `index.html`     | Tab-switching comparison page                        |

Each preview includes: Header, Hero section, Cards, Form, Footer components.

**Validation**:

```bash
ls -la ${run_dir}/previews/
# Must see: index.html, preview-A.html, preview-B.html, preview-C.html
```

### Step 7: Gate Check

- [ ] Generated at least 2 schemes
- [ ] Each scheme has: style + color + typography
- [ ] Recommendations reference requirements.md
- [ ] Provided code examples
- [ ] Generated HTML preview pages

## Return Value

```json
{
  "status": "success",
  "output_file": "${run_dir}/style-recommendations.md",
  "preview_dir": "${run_dir}/previews/",
  "preview_index": "${run_dir}/previews/index.html",
  "variant_count": 3,
  "recommendations": [
    {
      "variant_id": "A",
      "style": "Glassmorphism 2.0",
      "color": "Vercel Dark",
      "typography": "Plus Jakarta Sans"
    },
    {
      "variant_id": "B",
      "style": "Neubrutalism",
      "color": "Yellow+Black Clash",
      "typography": "Clash Display + Manrope"
    },
    {
      "variant_id": "C",
      "style": "Dark Mode First + Bento Grid",
      "color": "Linear Purple",
      "typography": "Geist Sans + Geist Mono"
    }
  ]
}
```

## Constraints

- **MUST** call Gemini for creative scheme generation
- **MUST** call auggie-mcp if has_existing_code
- **MUST** call LSP if tailwind.config.js found
- **MUST** generate 4 HTML preview files
- Diversity: 3 schemes must have clear differences
- Alignment: Recommendations must reference requirements.md
