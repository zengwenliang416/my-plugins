# Refactor Team Plugin

A team-based refactoring pipeline that orchestrates code smell detection, safe refactoring execution, and regression validation through a collaborative agent workflow.

## Available Skills

- **Command**: `/refactor-team:refactor`
- **Triggers**: "refactor team", "团队重构"
- **Syntax**: `/refactor-team <target> [--dead-code] [--duplicates] [--complexity]`

## Quick Start

```bash
# Basic refactoring
/refactor-team Refactor the auth module

# Focus on dead code removal
/refactor-team --dead-code Remove unused exports

# Target specific code smells
/refactor-team --duplicates --complexity Clean up user service
```

## Architecture

The plugin implements a multi-phase pipeline with safety validation:

```
Phase 1: Init (Lead)
  ↓
Phase 2: Analysis (Task: smell-detector)
  → Detect code smells, categorize by risk
  → User confirmation checkpoint
  ↓
Phase 3: Refactoring Pipeline (Team)
  → Batched by risk level: SAFE → CAREFUL → RISKY
  → refactorer applies changes
  → safety-reviewer validates (tests + no regressions)
  → Structured fix loop (max 2 rounds per batch)
  ↓
Phase 4: Delivery (Lead)
  → DELETION_LOG compilation
  → Final test verification
  → Refactor report
```

## Agent Types

### smell-detector (analysis)

- **Model**: Sonnet
- **Tools**: Read, Bash, Grep, Glob, Write, codebase-retrieval
- **Purpose**: Code smell detection and risk categorization
- **Output**: `smells-report.md` with risk-categorized findings

### refactorer (execution)

- **Model**: Sonnet
- **Tools**: Read, Write, Edit, Bash, Grep, Glob, SendMessage
- **Purpose**: Safe code refactoring with backup and rollback
- **Protocol**: Handle REFACTOR_ISSUE messages, track changes

### safety-reviewer (validation)

- **Model**: Sonnet
- **Tools**: Read, Bash, Grep, Glob, Write, SendMessage
- **Purpose**: Regression validation after each batch
- **Checks**: Tests pass, no new errors, no broken imports

## Output Structure

All artifacts are stored in:

```
openspec/changes/${CHANGE_ID}/
├── input.md               # Parsed refactoring request
├── smells-report.md       # Risk-categorized code smells
├── changes-log.md         # Refactoring changes by batch
├── validation-log.md      # Validation results per batch
├── DELETION_LOG.md        # Files/LOC/exports removed
└── refactor-report.md     # Final delivery report
```

## Structured Fix Loop

When the safety-reviewer detects regressions:

```json
{
  "type": "REFACTOR_ISSUE",
  "batch": 1,
  "issue": "Test X now fails",
  "affected_file": "auth.ts",
  "round": 1
}
```

The refactorer attempts to fix:

```json
{
  "type": "REFACTOR_FIXED",
  "batch": 1,
  "fix": "Restored missing import",
  "round": 1
}
```

**Rollback policy**: If 2 fix rounds fail, rollback the entire batch.

## Quality Gates

Before final delivery, all gates must pass:

- ✅ All tests pass (no new failures)
- ✅ No new TypeScript/build errors
- ✅ No broken imports or references
- ✅ DELETION_LOG complete and accurate
- ✅ Validation log shows all batches approved

## Safety Features

1. **Risk-based batching**: SAFE changes first, RISKY changes last
2. **Incremental validation**: Test after each batch before proceeding
3. **Backup branches**: Created before risky changes
4. **Rollback capability**: Failed batches are reverted
5. **User confirmation**: Required before applying fixes
6. **Change tracking**: Complete audit trail in DELETION_LOG

## Code Smell Detection

The smell-detector analyzes:

- **Dead code**: Unused files, exports, functions
- **Unused dependencies**: Package.json cleanup opportunities
- **Duplicates**: Copy-pasted code blocks
- **Complexity**: Functions exceeding thresholds
- **Dynamic imports**: Flagged as CAREFUL (may be runtime-referenced)
- **Public APIs**: Flagged as RISKY (may break consumers)

## Best Practices

1. Start with `--dead-code` for low-risk cleanup
2. Review `smells-report.md` carefully before confirming
3. Run on a feature branch, not main
4. Check DELETION_LOG before merging
5. Re-run tests after merge to verify no integration issues
