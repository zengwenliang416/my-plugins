---
description: "Refactor workflow: code smell detection → refactor suggestions → impact analysis → safe execution | legacy system modernization"
argument-hint: <target-path> [--mode=analyze|auto|interactive] [--focus=smell|pattern|all] [--legacy] [--source-stack=xxx] [--target-stack=xxx] [--run-id=xxx]
allowed-tools:
  - Skill
  - AskUserQuestion
  - Read
  - LSP
---

# /refactor - Refactor Workflow Command

## Usage

### Standard Refactor Mode

```bash
/refactor src/services/                      # Analyze refactor opportunities
/refactor src/utils/helper.ts --mode=auto    # Auto-execute safe refactors
/refactor --mode=interactive src/            # Interactive step-by-step refactor
/refactor --focus=smell src/                 # Smell detection only
/refactor --run-id=20260115T100000Z          # Resume from checkpoint
```

### Legacy System Modernization Mode

```bash
# Basic: auto-detect tech stack
/refactor --legacy .

# Specify source and target stacks
/refactor --legacy --source-stack="jQuery + PHP + MySQL" --target-stack="React + Node.js + PostgreSQL" .

# Common migration scenarios
/refactor --legacy --source-stack="AngularJS 1.x" --target-stack="Angular 17" src/
/refactor --legacy --source-stack="Java EE + JSP" --target-stack="Spring Boot + React" .
/refactor --legacy --source-stack="COBOL + DB2" --target-stack="Java + PostgreSQL" .
```

## 🚨🚨🚨 MUST FOLLOW RULES 🚨🚨🚨

**You MUST follow the Phase order below and use the Skill tool to invoke each skill.**

**Prohibited behaviors (violations cause workflow failure):**

- ❌ Skip Skill calls and refactor code directly yourself
- ❌ Replace Skill calls with Read/Write/Edit tools
- ❌ Omit any Phase
- ❌ Execute refactoring without impact analysis

**For each Phase you MUST:**

1. Call the specified Skill (using the Skill tool)
2. Wait for Skill execution to complete
3. Verify output files exist
4. Then proceed to the next Phase

---

## Phase 1: Initialization

1. Parse arguments:
   - MODE: analyze (default) | auto | interactive
   - FOCUS: all (default) | smell | pattern
   - TARGET: target path (file or directory)
   - **LEGACY**: false (default) | true (enable legacy system modernization mode)
   - **SOURCE_STACK**: source tech stack description (used in --legacy mode)
   - **TARGET_STACK**: target tech stack description (used in --legacy mode)

2. Generate run directory path:
   - RUN_ID: `refactor-$(date +%Y%m%d-%H%M%S)`
   - RUN_DIR: `.claude/runs/${RUN_ID}`

3. Use AskUserQuestion to confirm execution plan

Run artifacts MUST be consolidated under `.claude/runs/${RUN_ID}/`.

**If LEGACY=true, show legacy modernization plan**:

```
📋 Legacy System Modernization Plan:
┌────┬────────────────────┬──────────────────────┬─────────────┐
│ #  │ Phase              │ Executor             │ Mode        │
├────┼────────────────────┼──────────────────────┼─────────────┤
│ 1  │ Legacy analysis    │ legacy-analyzer      │ background  │
│ 2  │ Smell detection    │ smell-detector       │ background  │
│ 3  │ Migration suggest  │ refactor-suggester   │ background  │
│ 4  │ Impact analysis    │ impact-analyzer      │ background  │
│ 5  │ User confirmation  │ user                 │ hard stop   │
│ 6  │ Safe refactor exec │ refactor-executor    │ background  │
└────┴────────────────────┴──────────────────────┴─────────────┘

Target: ${TARGET}
Mode: ${MODE}
Source stack: ${SOURCE_STACK}
Target stack: ${TARGET_STACK}

Confirm execution? [Y/n]
```

**Standard mode execution plan**:

```
📋 Refactor Execution Plan:
┌────┬────────────────────┬──────────────────────┬─────────────┐
│ #  │ Phase              │ Executor             │ Mode        │
├────┼────────────────────┼──────────────────────┼─────────────┤
│ 1  │ Smell detection    │ smell-detector       │ background  │
│ 2  │ Refactor suggest   │ refactor-suggester   │ background  │
│ 3  │ Impact analysis    │ impact-analyzer      │ background  │
│ 4  │ User confirmation  │ user                 │ hard stop   │
│ 5  │ Safe refactor exec │ refactor-executor    │ background  │
└────┴────────────────────┴──────────────────────┴─────────────┘

Target: ${TARGET}
Mode: ${MODE}

Confirm execution? [Y/n]
```

---

## Phase 1.5: Legacy System Analysis (--legacy mode only)

### 🚨🚨🚨 MUST EXECUTE (if LEGACY=true) 🚨🚨🚨

**Execute this phase only when LEGACY=true**

**Skill call:**

```
Skill(skill="refactor:legacy-analyzer", args="run_dir=${RUN_DIR} source_stack=${SOURCE_STACK} target_stack=${TARGET_STACK}")
```

**Verification**:

- Confirm `${RUN_DIR}/legacy-analysis.md` is generated
- Confirm `${RUN_DIR}/migration-plan.json` is generated

**Legacy system analysis content**:

- Current architecture pattern recognition (monolith/layered/modular)
- Technical debt assessment
- Migration seam identification
- Recommended migration strategy (Strangler Fig / Big Bang / Incremental)
- Risk assessment and timeline

**Output influences subsequent phases**:

- smell-detector will detect legacy-system-specific smells
- refactor-suggester will generate migration-related refactor suggestions
- Execution strategy will account for migration phases

---

## Phase 2: Code Smell Detection

### 🚨🚨🚨 MUST EXECUTE 🚨🚨🚨

**Invoke the Skill tool immediately:**

```
# Standard mode
Skill(skill="refactor:smell-detector", args="run_dir=${RUN_DIR} target=${TARGET}")

# Legacy mode (pass legacy flag to enable legacy smell detection)
Skill(skill="refactor:smell-detector", args="run_dir=${RUN_DIR} target=${TARGET} legacy=true")
```

**Verification**:

- Confirm `${RUN_DIR}/smells.json` is generated
- Confirm `${RUN_DIR}/smells-report.md` is generated

**Code smell types detected**:

- Duplicated Code
- Long Method
- Large Class / God Class
- Long Parameter List
- Shotgun Surgery
- Feature Envy
- Data Clumps
- Tight Coupling

---

## Phase 3: Refactor Suggestion Generation

### 🚨🚨🚨 MUST EXECUTE - DO NOT SKIP 🚨🚨🚨

**❌ Prohibited behaviors:**

- ❌ Generate refactor suggestions yourself
- ❌ Skip the Skill call

**✅ Only correct approach: invoke the Skill tool**

### Execute now

**Skill call:**

```
Skill(skill="refactor:refactor-suggester", args="run_dir=${RUN_DIR}")
```

**Verification**: Confirm `${RUN_DIR}/suggestions.json` is generated

**Generated refactor suggestion types**:

- Extract Method
- Extract Class
- Inline
- Move Method/Field
- Rename
- Introduce Parameter Object
- Replace Conditional with Polymorphism
- Encapsulate Field

---

## Phase 4: Impact Analysis

### 🚨🚨🚨 MUST EXECUTE - DO NOT SKIP 🚨🚨🚨

**❌ Prohibited behaviors (violations cause workflow failure):**

- ❌ Skip impact analysis and refactor directly
- ❌ Guess impact scope yourself

**✅ Only correct approach: invoke the Skill tool**

### Execute now

**Skill call:**

```
Skill(skill="refactor:impact-analyzer", args="run_dir=${RUN_DIR}")
```

**Verification**: Confirm `${RUN_DIR}/impact-analysis.md` is generated

**Impact analysis content**:

- List of affected files
- Affected symbols (functions/classes/variables)
- Call chain relationships
- Test coverage scope
- Risk assessment (low/medium/high/critical)

**⏸️ Hard stop**: Show impact analysis results, continue after user confirmation

---

## Phase 5: Safe Refactor Execution

### 🚨🚨🚨 MUST EXECUTE - DO NOT SKIP 🚨🚨🚨

**❌ Prohibited behaviors (violations cause workflow failure):**

- ❌ Execute refactoring yourself with Write/Edit tools
- ❌ Modify files directly by skipping Skill calls
- ❌ Execute high-risk refactoring without confirmation

**✅ Only correct approach: invoke the Skill tool**

### Execution conditions

| Mode        | Behavior                                           |
| ----------- | -------------------------------------------------- |
| analyze     | Skip this phase, output analysis report only       |
| auto        | Auto-execute low-risk refactors, confirm high-risk |
| interactive | Confirm each refactor operation one by one         |

### Execute now (non-analyze mode)

**Skill call:**

```
Skill(skill="refactor:refactor-executor", args="run_dir=${RUN_DIR} mode=${MODE}")
```

**Verification**:

- Confirm `${RUN_DIR}/changes.md` is generated
- Confirm `${RUN_DIR}/refactor-result.json` is generated

---

## Phase 6: Delivery

Output completion summary:

```
🎉 Refactor task complete!

📋 Target: ${TARGET}
🔀 Mode: ${MODE}

📊 Detection results:
- Code smells: X
- Refactor suggestions: Y
- Executed: Z
- Skipped: W

⚠️ Risk distribution:
- Low risk: A ✅
- Medium risk: B ⚡
- High risk: C 🔶
- Critical risk: D 🔴

📁 Artifacts:
  ${RUN_DIR}/
  ├── smells.json           # Code smell data
  ├── smells-report.md      # Smell detection report
  ├── suggestions.json      # Refactor suggestion data
  ├── impact-analysis.md    # Impact analysis report
  ├── changes.md            # Change list
  └── refactor-result.json  # Execution result

🔄 Next steps:
  - Resume: /refactor --run-id=${RUN_ID}
  - Run tests: npm test
  - View changes: git diff
```

---

## Run Directory Structure

```
.claude/runs/refactor-20260115-100000/
├── state.json              # Workflow state
├── target.txt              # Refactor target
├── smells.json             # Phase 2: code smell data
├── smells-report.md        # Phase 2: smell detection report
├── suggestions.json        # Phase 3: refactor suggestions
├── impact-analysis.md      # Phase 4: impact analysis
├── changes.md              # Phase 5: change list
└── refactor-result.json    # Phase 5: execution result
```

## Refactor Modes

| Mode        | Description    | Flow                                                |
| ----------- | -------------- | --------------------------------------------------- |
| analyze     | Analysis only  | detect → suggest → analyze (no execution)           |
| auto        | Auto execution | detect → suggest → analyze → auto-execute low-risk  |
| interactive | Interactive    | detect → suggest → analyze → confirm each execution |

## Reference Resources

- Skills: `skills/smell-detector/`, `skills/refactor-suggester/`, `skills/impact-analyzer/`, `skills/refactor-executor/`
- Code smell reference: `skills/smell-detector/references/smell-catalog.md`
- Refactor pattern reference: `skills/refactor-suggester/references/refactoring-patterns.md`
