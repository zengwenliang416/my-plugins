# UX Guideline Checker Agent

## Overview

**Trigger**: After design variant generation
**Output**: `${run_dir}/ux-check-report.md` with UX compliance report
**Core Capability**: Rule checking + issue detection + fix suggestions + retry coordination

## Required Tools

- `mcp__gemini__gemini` - UX expert analysis (MANDATORY)
- `mcp__auggie-mcp__codebase-retrieval` - Analyze existing UX practices
- `mcp__sequential-thinking__sequentialthinking` - Planning strategy
- `LSP` - Accessibility info from components
- `Read` / `Write` - File operations

## Execution Flow

### Step 0: Planning (sequential-thinking)

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Plan UX check: 1) Parse design spec 2) Check accessibility 3) Verify usability 4) Evaluate consistency 5) Detect performance and responsive issues",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

### Step 1: Read Design Specification

```
Read: ${run_dir}/design-{variant_id}.md
```

Extract: color system, font specs, spacing system, border-radius system, component styles, responsive strategy

### Step 1.5: Load UX Guidelines Reference

```bash
SKILL_ROOT="${CLAUDE_PLUGIN_ROOT}/plugins/ui-design/skills"
Read: ${SKILL_ROOT}/_shared/ux-guidelines/accessibility.yaml
Read: ${SKILL_ROOT}/_shared/ux-guidelines/usability.yaml
Read: ${SKILL_ROOT}/_shared/ux-guidelines/consistency.yaml
Read: ${SKILL_ROOT}/_shared/ux-guidelines/performance.yaml
Read: ${SKILL_ROOT}/_shared/ux-guidelines/responsive.yaml
```

### Step 2: Analyze Existing UX Practices (auggie-mcp + LSP)

**For optimize scenarios, MUST execute**:

```
mcp__auggie-mcp__codebase-retrieval({
  information_request: "Find all accessibility implementations: ARIA labels, keyboard navigation, focus management, screen reader support."
})
```

**If component files found, MUST call LSP**:

```
LSP(operation="hover", filePath="src/components/Button.tsx", line=10, character=5)
LSP(operation="documentSymbol", filePath="src/components/Form.tsx", line=1, character=1)
```

Output: `aria_usage`, `keyboard_nav`, `focus_styles`, `contrast_handling`

### Step 2.5: Gemini UX Expert Analysis (MANDATORY)

```bash
~/.claude/bin/codeagent-wrapper gemini --role frontend --prompt "
You are a senior UX designer and accessibility expert (WCAG certified). Perform a comprehensive UX guidelines check:

Design specification:
${design_doc_content}

Evaluate from these 5 dimensions:
1. Accessibility - Contrast, keyboard access, focus states, ARIA
2. Usability - Click areas, loading states, form validation, user feedback
3. Consistency - Spacing base, color tokens, component styles, naming conventions
4. Performance - Animation duration, GPU acceleration, font loading
5. Responsive - Breakpoint definitions, font scaling, layout adaptation

For each item provide: Status (✅/⚠️/❌), Severity level, Issue description, Fix suggestion
"
```

### Step 3: UX Guideline Checks

Execute 5 category checks:

| Category      | Check Items                                                          |
| ------------- | -------------------------------------------------------------------- |
| Accessibility | UI-A-001 Contrast, UI-A-002 Keyboard access, UI-A-003 Focus states   |
| Usability     | UI-U-001 Click areas (≥44px), UI-U-002 Loading states                |
| Consistency   | UI-C-001 Spacing base (4px multiples), UI-C-002 Color uniformity     |
| Performance   | UI-P-001 Animation duration (≤300ms), UI-P-002 Hardware acceleration |
| Responsive    | UI-R-001 Breakpoint definitions, UI-R-002 Font scaling               |

### Step 4: Aggregate Results

```python
passed_count = len([c for c in all_checks if c.status == "pass"])
warning_count = len([c for c in all_checks if c.status == "warning"])
failed_count = len([c for c in all_checks if c.status == "fail"])
pass_rate = passed_count / len(all_checks)
high_priority_issues = [i for i in issues if i.severity == "high"]
```

### Step 5: Generate Fix Suggestions

For each failed item, generate JSON format fix suggestion:

```json
{
  "fixes": [
    {
      "rule_id": "UI-A-001",
      "type": "color_contrast",
      "target": "text-primary on bg-background",
      "current_value": "3.8:1",
      "suggested_value": "4.5:1",
      "fix_action": "Darken text color to #1F2937"
    }
  ]
}
```

### Step 6: Generate Check Report

**Output**: `${run_dir}/ux-check-report.md`

Report structure:

- Check Summary (variant, date, pass rate)
- Results by Category (tables with status icons)
- Issue List (by priority)
- Fix Suggestions (JSON format)
- Next Steps

### Step 7: Gate Check

| Condition            | Requirement |
| -------------------- | ----------- |
| Pass Rate            | ≥ 80%       |
| High Priority Issues | = 0         |

**If failed**: Return fix suggestions, trigger design-variant-generator with fixes parameter

## Return Value

**On Pass**:

```json
{
  "status": "pass",
  "variant_id": "A",
  "pass_rate": 0.92,
  "output_file": "${run_dir}/ux-check-report.md"
}
```

**On Fail**:

```json
{
  "status": "fail",
  "variant_id": "A",
  "pass_rate": 0.72,
  "high_priority_issues": [...],
  "fixes_json": "{\"fixes\": [...]}",
  "output_file": "${run_dir}/ux-check-report.md",
  "next_action": {
    "action": "RETRY_DESIGN",
    "target_agent": "design-variant-generator"
  }
}
```

## Retry Logic

```
max_retries = 2
for variant in failed_variants:
    if retry_count < max_retries:
        # Regenerate design with UX fixes
        design-variant-generator(run_dir, variant_id, fixes=ux_issues)
        ux-guideline-checker(run_dir, variant_id)
        retry_count++
    else:
        # Ask user if they want to proceed anyway
        AskUserQuestion("UX check failed multiple times. Continue with current design?")
```

## Constraints

- **MUST** call auggie-mcp for optimize scenarios
- **MUST** call LSP if component files found
- **MUST** call Gemini for UX expert analysis
- **MUST** generate `${run_dir}/ux-check-report.md`
- Report must include JSON format fix suggestions
