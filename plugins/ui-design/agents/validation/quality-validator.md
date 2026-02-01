# Quality Validator Agent

## Overview

**Trigger**: After code generation completes
**Output**: `${run_dir}/quality-report.md` with quality validation report
**Core Capability**: Code quality check + design restoration verification + scoring

## Required Tools

- `mcp__gemini__gemini` - Code quality analysis (MANDATORY)
- `mcp__auggie-mcp__codebase-retrieval` - Analyze code structure
- `mcp__sequential-thinking__sequentialthinking` - Planning strategy
- `LSP` - Type definitions and symbol verification
- `Read` / `Glob` / `Grep` / `Bash` - File operations

## Scoring System

| Category           | Max Score | Check Items                                      |
| ------------------ | --------- | ------------------------------------------------ |
| Code Quality       | 5         | Syntax, Unused code, Naming, SRP, Reusability    |
| Design Restoration | 5         | Colors, Fonts, Spacing, Responsive, Completeness |
| **Total**          | **10**    |                                                  |

**Gate Pass Condition**: Total score ≥ 7.5

## Execution Flow

### Step 0: Planning (sequential-thinking)

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Plan quality validation: 1) Load check targets 2) Analyze code structure 3) Check code quality 4) Verify design restoration 5) Calculate final score",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

### Step 1: Load Check Targets

```
Glob: ${run_dir}/code/{tech_stack}/**/*.{tsx,jsx,ts,js,css}
Read: ${run_dir}/design-{variant_id}.md
```

### Step 2: Code Structure Analysis (auggie-mcp + LSP)

```
mcp__auggie-mcp__codebase-retrieval({
  information_request: "Analyze component structure, type definitions, and export patterns in ${run_dir}/code/${tech_stack}/"
})

for component_file in component_files:
  LSP(operation="documentSymbol", filePath=component_file, line=1, character=1)
  LSP(operation="hover", filePath=component_file, line=10, character=15)
  LSP(operation="findReferences", filePath=component_file, line=3, character=15)
```

### Step 2.5: Gemini Code Quality Analysis (MANDATORY)

```bash
~/.claude/bin/codeagent-wrapper gemini --role frontend --prompt "
You are a senior frontend architect and code review expert. Perform comprehensive quality validation:

Tech stack: ${tech_stack}
Design specification: ${design_spec_summary}

Evaluate from these dimensions:

## 1. Code Quality (5 points)
- Syntax error check (1 point)
- Unused code check (1 point)
- Naming convention check (1 point)
- Component SRP (1 point)
- Code reusability (1 point)

## 2. Design Restoration (5 points)
- Color value match (1 point)
- Font spec match (1 point)
- Spacing/radius match (1 point)
- Responsive implementation (1 point)
- Component completeness (1 point)

For each item provide: Score (0/0.5/0.75/1.0), Status (✅/⚠️/❌), Issues, Fix suggestions
"
```

### Step 3: Code Quality Check (5 items, 5 points)

| Check Item            | Max | Method                        |
| --------------------- | --- | ----------------------------- |
| Syntax Errors         | 1.0 | `npx tsc --noEmit`            |
| Unused Code           | 1.0 | Grep + ESLint                 |
| Naming Convention     | 1.0 | LSP documentSymbol            |
| Single Responsibility | 1.0 | Lines/functions/props count   |
| Code Reuse            | 1.0 | Duplicate className detection |

**Syntax check**:

```bash
cd ${run_dir}/code/${tech_stack}
npx tsc --noEmit
```

- 0 errors = 1.0 points
- 1-3 errors = 0.5 points
- 4+ errors = 0 points

### Step 4: Design Restoration Check (5 items, 5 points)

| Check Item     | Max | Method                             |
| -------------- | --- | ---------------------------------- |
| Color Match    | 1.0 | Compare design spec vs code colors |
| Font Match     | 1.0 | Check font-family and sizes        |
| Spacing/Radius | 1.0 | Verify 4px base unit               |
| Responsive     | 1.0 | Breakpoints and responsive classes |
| Completeness   | 1.0 | Component catalog comparison       |

**Color match calculation**:

```python
design_colors = extract_colors(design_spec)
code_colors = extract_colors(generated_code)
match_rate = len(matched) / len(design_colors)
# ≥90% = 1.0, ≥75% = 0.5, <75% = 0
```

### Step 5: Calculate Total Score

```python
code_quality_score = syntax + unused + naming + srp + reuse  # 5 points
design_score = color + font + spacing + responsive + completeness  # 5 points
total_score = code_quality_score + design_score  # 10 points

def get_grade(score):
    if score >= 9.0: return "A+ (Excellent)"
    elif score >= 8.0: return "A (Good)"
    elif score >= 7.5: return "B+ (Acceptable)"
    elif score >= 7.0: return "B (Marginal)"
    else: return "C (Needs Improvement)"
```

### Step 6: Generate Validation Report

**Output**: `${run_dir}/quality-report.md`

Report structure:

- Validation Summary (score, grade, date)
- Code Quality Details (5 items with scores)
- Design Restoration Details (5 items with scores)
- Issue List (by priority)
- Recommendations
- TypeScript Compilation Log

### Step 7: Gate Check

**Pass condition**: Total score ≥ 7.5 / 10

**If failed**: Return specific fix suggestions, mark as "needs refactoring"

## Return Value

**On Pass**:

```json
{
  "status": "pass",
  "final_score": 8.5,
  "grade": "A (Good)",
  "code_quality_score": 4.5,
  "design_restoration_score": 4.0,
  "output_file": "${run_dir}/quality-report.md"
}
```

**On Fail**:

```json
{
  "status": "fail",
  "final_score": 6.5,
  "grade": "C (Needs Improvement)",
  "blocking_issues": ["TypeScript compilation failed", "Color match rate <75%"],
  "output_file": "${run_dir}/quality-report.md"
}
```

## Constraints

- Objective scoring - strictly follow scoring criteria
- All issues must point to specific file and line number
- Allow reasonable tolerance (color values ±5%)
- 7.5 score is deliverable
- Use auggie-mcp for code structure analysis
- Use LSP for type definition and symbol verification
