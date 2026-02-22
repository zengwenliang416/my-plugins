---
name: prd-chunker
description: "Assess PRD document complexity and perform intelligent semantic chunking for multi-agent parallel processing"
allowed-tools:
  - Read
  - Bash
arguments:
  - name: prd_path
    type: string
    required: true
    description: "Path to the PRD file to analyze for chunking"
  - name: threshold_modules
    type: number
    required: false
    description: "Module count threshold for triggering chunking (default: 3)"
  - name: threshold_chars
    type: number
    required: false
    description: "Character count threshold for triggering chunking (default: 5000)"
---

# PRD Chunker

Analyzes PRD document complexity and splits it into semantic chunks suitable for parallel multi-agent code generation.

## Usage

```
Skill(skill="d2c:prd-chunker", args="prd_path=./requirements.md")
```

## Behavior

1. Read the PRD document
2. Assess complexity:
   - Count distinct feature modules (H2/H3 sections)
   - Count total characters of requirement content
   - Count tables with 5+ rows
3. If below ALL thresholds → return `{ "chunking_triggered": false }`
4. If ANY threshold exceeded → perform semantic chunking:
   - Split by heading structure (H2 as primary, H3 as secondary boundaries)
   - Keep related tables within the same chunk
   - Record cross-chunk dependencies
   - Output `chunks.json` with module-to-chunk mapping

## Thresholds

| Metric | Default | Triggers chunking when exceeded |
|--------|---------|-------------------------------|
| Feature modules | 3 | 3+ distinct H2/H3 sections |
| Content length | 5000 chars | 5000+ characters of requirement text |
| Large tables | 3 | 3+ tables with 5+ rows each |

## Output Format

See `prd-analyzer` agent documentation for `chunks.json` schema.
