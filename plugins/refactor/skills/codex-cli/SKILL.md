---
name: codex-cli
description: |
  [Trigger] When refactor workflow needs backend code analysis, smell detection, patch generation, or safety review.
  [Output] Read-only sandbox analysis -> unified diff patch -> Claude review then apply.
  [Skip] For frontend UI/CSS refactoring (use gemini-cli) or simple formatting.
  [Ask] No user input needed; invoked by other skills.
  [Resource Usage] Use references/, assets/, and scripts/ (`scripts/invoke-codex.ts`).
allowed-tools:
  - Bash
  - Read
  - Task
---

# Codex CLI - Refactor Backend Expert

Backend refactoring expert via `scripts/invoke-codex.ts`. **Read-only sandbox** -> smell detection + unified diff patches -> Claude review & apply.

## Script Entry

```bash
npx tsx scripts/invoke-codex.ts --role "<role>" --prompt "<prompt>" [--workdir "<path>"] [--sandbox "read-only"]
```

## Resource Usage

- Role prompts: `references/roles/{role}.md`
- Execution script: `scripts/invoke-codex.ts`

## Roles

| Role               | Purpose                  | CLI Flag                    |
| ------------------ | ------------------------ | --------------------------- |
| smell-detector     | Code smell detection     | `--role smell-detector`     |
| refactoring-expert | Refactoring plan/patch   | `--role refactoring-expert` |
| impact-analyst     | Impact scope analysis    | `--role impact-analyst`     |
| safety-reviewer    | Refactoring safety audit | `--role safety-reviewer`    |

---

## Prompt Templates

### Scenario 1: Code Smell Detection

```bash
npx tsx scripts/invoke-codex.ts \
  --role smell-detector \
  --prompt "
## Task
Analyze the following files for code smells.

## Target Files
${file_list}

## Detection Dimensions
1. Long Method (>50 lines)
2. God Class (>10 methods or >300 lines)
3. Long Parameter List (>5 parameters)
4. Duplicated Code (>80% similarity)
5. Feature Envy (more external calls than internal)
6. Data Clumps (repeated parameter groups)
7. Shotgun Surgery (changes scattered across files)
8. Tight Coupling (excessive dependencies)

## Output Format
JSON array, each smell contains:
- type: smell type
- severity: critical/high/medium/low
- location: {file, line, symbol}
- metrics: measurement data
- suggestion: improvement recommendation
" \
  --sandbox read-only
```

### Scenario 2: Extract Method

```bash
npx tsx scripts/invoke-codex.ts \
  --role refactoring-expert \
  --prompt "
## Task
Perform Extract Method refactoring.

## Target
- File: ${target_file}
- Function: ${target_method}
- Line range: ${line_range}

## Requirements
1. Extract an independent sub-method
2. Maintain function signature compatibility
3. Add necessary parameter passing
4. Keep error handling consistent

## Output Format
Unified diff only:
--- a/${file}
+++ b/${file}
@@ ... @@
...
" \
  --sandbox read-only
```

### Scenario 3: Extract Class

```bash
npx tsx scripts/invoke-codex.ts \
  --role refactoring-expert \
  --prompt "
## Task
Perform Extract Class refactoring.

## Target
- File: ${target_file}
- Class: ${target_class}

## Responsibilities to Extract
${responsibilities_to_extract}

## Requirements
1. Create new class for separated responsibilities
2. Establish appropriate dependencies
3. Update all references
4. Maintain public API compatibility

## Output Format
Multiple unified diffs (new files and modified files)
" \
  --sandbox read-only
```

### Scenario 4: Move Method

```bash
npx tsx scripts/invoke-codex.ts \
  --role refactoring-expert \
  --prompt "
## Task
Perform Move Method refactoring.

## Target
- Source file: ${source_file}
- Target file: ${target_file}
- Method: ${method_name}

## Requirements
1. Move method to target class
2. Update all call sites
3. Handle dependencies
4. Maintain interface compatibility

## Output Format
Unified diff
" \
  --sandbox read-only
```

### Scenario 5: Introduce Parameter Object

```bash
npx tsx scripts/invoke-codex.ts \
  --role refactoring-expert \
  --prompt "
## Task
Perform Introduce Parameter Object refactoring.

## Target
- File: ${target_file}
- Function: ${target_method}
- Parameter list: ${parameters}

## Requirements
1. Create parameter object class/interface
2. Update function signature
3. Update all call sites
4. Add type definitions

## Output Format
Unified diff
" \
  --sandbox read-only
```

### Scenario 6: Safety Review

```bash
npx tsx scripts/invoke-codex.ts \
  --role safety-reviewer \
  --prompt "
## Task
Review refactoring safety.

## Refactoring Plan
${refactoring_plan}

## Review Dimensions
1. Behavior preservation: is post-refactoring behavior consistent?
2. Boundary conditions: are all edge cases handled?
3. Error handling: is exception handling complete?
4. Concurrency safety: are race conditions introduced?
5. Backward compatibility: is the public API compatible?

## Output Format
JSON:
{
  \"safe\": boolean,
  \"risk_level\": \"low/medium/high/critical\",
  \"issues\": [...],
  \"recommendations\": [...]
}
" \
  --sandbox read-only
```

---

## MUST: Collaboration Workflow

### Step 1: Codex Analyze/Generate

```bash
npx tsx scripts/invoke-codex.ts \
  --role refactoring-expert \
  --prompt "$REFACTOR_PROMPT" \
  --sandbox read-only
```

### Step 2: Claude Review

1. Parse unified diff returned by Codex
2. Verify refactoring logic correctness
3. Check compliance with project conventions
4. Optimize naming and structure

### Step 3: Apply Changes

Use the Edit tool to apply reviewed modifications.

### Step 4: Verify

```bash
npx tsx scripts/invoke-codex.ts \
  --role safety-reviewer \
  --prompt "Verify refactoring results: [change summary]" \
  --sandbox read-only
```

---

## MUST: Constraints

| Required                                | Forbidden                             |
| --------------------------------------- | ------------------------------------- |
| Use `--sandbox read-only`               | Apply patches without Claude review   |
| Patch MUST be reviewed by Claude        | Skip safety verification              |
| Use Task tool for background execution  | Use `--yolo` or write sandbox mode    |
| Verify behavior consistency after apply | Blindly trust Codex output            |
| Terminate background tasks arbitrarily  | Send entire codebase in single prompt |
