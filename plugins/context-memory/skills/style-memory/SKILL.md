---
name: style-memory
description: |
  Extract and persist design tokens, style patterns, and UI conventions.
  [Trigger] UI work needs consistent style tokens or new project has unextracted styles.
  [Output] .claude/memory/styles/${package}.json + ${run_dir}/style-analysis.md
  [Skip] When style memory already exists and design system hasn't changed.
  [Ask] Which package/module to analyze if project has multiple UI packages.
allowed-tools:
  - Read
  - Write
  - Bash
  - Skill
  - Glob
  - Grep
  - mcp__auggie-mcp__codebase-retrieval
arguments:
  - name: run_dir
    type: string
    required: true
    description: Output directory for analysis artifacts
  - name: package
    type: string
    required: false
    description: Specific package/module to analyze (default: scan all UI-related modules)
---

# style-memory

## Purpose

Extract design tokens, style patterns, and UI conventions from a project and persist them to `.claude/memory/styles/` for consistent future generation.

## What Gets Extracted

| Category    | Examples                                                           |
| ----------- | ------------------------------------------------------------------ |
| Colors      | Primary, secondary, accent, semantic (error, warning, success)     |
| Typography  | Font families, sizes, weights, line heights                        |
| Spacing     | Base unit, scale, common margins/paddings                          |
| Breakpoints | Mobile, tablet, desktop, wide breakpoints                          |
| Components  | Button variants, card patterns, form styles                        |
| Tokens      | CSS custom properties, Tailwind theme values, design system tokens |

## Steps

### Phase 1: Source Detection

1. Use `Glob` to find style sources:
   - CSS/SCSS/Less files: `**/*.{css,scss,less}`
   - Tailwind config: `tailwind.config.*`
   - Theme files: `**/theme.*`, `**/tokens.*`
   - Styled-components/emotion: `**/*.styled.*`
2. If `package` specified, scope search to that path.

### Phase 2: Token Extraction

3. Use `Skill("context-memory:gemini-cli", {role: "style-analyzer", prompt})` to analyze:
   - CSS custom properties (`--color-primary`, `--spacing-base`)
   - Tailwind theme extensions
   - Design token JSON/JS exports
   - Component style patterns
4. If Gemini fails, use codebase-retrieval + Grep for direct extraction.

### Phase 3: Pattern Analysis

5. Identify recurring patterns:
   - Color usage frequency
   - Spacing consistency
   - Typography hierarchy
   - Component composition patterns

### Phase 4: Output

6. Ensure `.claude/memory/styles/` directory exists.
7. Write style memory to `.claude/memory/styles/${package}.json`:

```json
{
  "package": "main",
  "extracted_at": "ISO-8601",
  "tokens": {
    "colors": { "primary": "#3B82F6", "secondary": "#10B981" },
    "typography": { "font-family": "Inter, sans-serif", "base-size": "16px" },
    "spacing": { "base": "4px", "scale": [4, 8, 12, 16, 24, 32, 48, 64] },
    "breakpoints": { "sm": "640px", "md": "768px", "lg": "1024px" }
  },
  "patterns": [
    {
      "name": "button-primary",
      "description": "Blue bg, white text, rounded-lg, px-4 py-2"
    }
  ],
  "source_files": ["src/styles/globals.css", "tailwind.config.ts"]
}
```

8. Write analysis report to `${run_dir}/style-analysis.md`.

## Verification

- Style JSON exists at `.claude/memory/styles/${package}.json`.
- At least one token category (colors, typography, or spacing) is populated.
- Source files are accurately referenced.
