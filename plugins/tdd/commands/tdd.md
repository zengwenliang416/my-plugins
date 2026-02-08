---
description: "Test-Driven Development pipeline enforcing write-tests-first methodology"
argument-hint: "<feature-or-bug> [--coverage=80] [--framework=jest|vitest|playwright]"
allowed-tools:
  - Task
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - TeamCreate
  - TeamDelete
  - TaskCreate
  - TaskUpdate
  - TaskList
  - TaskGet
  - TaskOutput
  - SendMessage
  - AskUserQuestion
  - mcp__auggie-mcp__codebase-retrieval
---

# TDD Command

Implement features using Test-Driven Development with Agent Team Pipeline pattern.

## Architecture

```
test-writer (RED) → implementer (GREEN) → coverage-validator → Lead Delivery
     ↓                    ↓                        ↓
  Write failing     Minimal code to       Verify 80%+ coverage
     tests            pass tests           & test quality
```

## Phases

### Phase 1: Initialization (Lead Inline Orchestration)

1. **Create run directory**

   ```bash
   RUN_ID=$(date +%Y%m%d-%H%M%S)
   mkdir -p .claude/tdd/runs/${RUN_ID}
   ```

2. **Parse input**
   - Extract feature/bug description from `${args}`
   - Parse options: `--coverage=<number>` (default: 80), `--framework=<name>` (auto-detect if not provided)
   - Detect test framework from `package.json`:
     - `jest` → Jest
     - `vitest` → Vitest
     - `@playwright/test` → Playwright

3. **Understand target code**
   - Use `mcp__auggie-mcp__codebase-retrieval` to find related files
   - Query: "Find files related to [feature description]"
   - Identify existing patterns (test structure, mocking patterns, naming conventions)

4. **Write input document**
   ```
   ${run_dir}/input.md
   ---
   Feature: ${feature_description}
   Framework: ${detected_framework}
   Coverage Target: ${coverage_threshold}%
   Related Files: [list]
   Existing Patterns: [summary]
   ```

### Phase 2: Interface Design (Lead Inline Orchestration)

1. **Define API surface**
   - Function signatures
   - Type definitions / interfaces
   - Input/output contracts
   - Error conditions

2. **Write interface document**

   ```
   ${run_dir}/interfaces.md
   ---
   ## Public API
   [function signatures]

   ## Types
   [type definitions]

   ## Error Handling
   [error cases]
   ```

3. **HARD STOP: Confirm with user**
   ```
   AskUserQuestion("Please review the proposed interface design in ${run_dir}/interfaces.md. Approve to proceed with TDD pipeline? (yes/no)")
   ```

   - If "no": iterate on interface design
   - If "yes": proceed to Phase 3

### Phase 3: TDD Pipeline Team (Lead Inline Orchestration)

1. **Create Agent Team**

   ```
   TeamCreate({
     team_name: "tdd-pipeline",
     description: "RED → GREEN → REFACTOR pipeline for ${feature_description}"
   })
   ```

2. **Create Pipeline Tasks**

   **Task 1: Write Failing Tests (test-writer)**

   ```
   TaskCreate({
     team_name: "tdd-pipeline",
     task_description: "Write comprehensive test suite for ${feature_description}. Tests MUST fail initially (RED phase). Include unit, integration, and E2E tests. Cover edge cases: null, empty, invalid types, boundaries, errors, race conditions. Write test-plan.md.",
     assigned_to_agent: "test-writer",
     context: "${run_dir}/input.md, ${run_dir}/interfaces.md"
   })
   ```

   **Task 2: Verify Tests Fail — RED Phase (test-writer)**

   ```
   TaskCreate({
     team_name: "tdd-pipeline",
     task_description: "Run test suite and verify ALL tests fail (RED phase). Document failure reasons in test-plan.md.",
     assigned_to_agent: "test-writer",
     blocked_by: [task_1_id],
     context: "Tests from Task 1"
   })
   ```

   **Task 3: Implement Minimal Code — GREEN Phase (implementer)**

   ```
   TaskCreate({
     team_name: "tdd-pipeline",
     task_description: "Write MINIMAL code to make all tests pass (GREEN phase). No over-engineering. Follow existing project patterns. Write implementation-log.md.",
     assigned_to_agent: "implementer",
     blocked_by: [task_2_id],
     context: "${run_dir}/test-plan.md, ${run_dir}/interfaces.md"
   })
   ```

   **Task 4: Verify Tests Pass (implementer)**

   ```
   TaskCreate({
     team_name: "tdd-pipeline",
     task_description: "Run test suite and verify ALL tests pass (GREEN phase). Document results in implementation-log.md.",
     assigned_to_agent: "implementer",
     blocked_by: [task_3_id],
     context: "Implementation from Task 3"
   })
   ```

   **Task 5: Refactor (implementer)**

   ```
   TaskCreate({
     team_name: "tdd-pipeline",
     task_description: "Refactor code for clarity and maintainability while keeping tests green. Run tests after each change. Update implementation-log.md.",
     assigned_to_agent: "implementer",
     blocked_by: [task_4_id],
     context: "Green tests from Task 4"
   })
   ```

   **Task 6: Coverage Validation (coverage-validator)**

   ```
   TaskCreate({
     team_name: "tdd-pipeline",
     task_description: "Run coverage analysis. Verify: branches >= ${coverage_threshold}%, functions >= ${coverage_threshold}%, lines >= ${coverage_threshold}%, statements >= ${coverage_threshold}%. Detect test smells. Write coverage-report.md. If below threshold, send COVERAGE_FIX_REQUEST.",
     assigned_to_agent: "coverage-validator",
     blocked_by: [task_5_id],
     context: "${run_dir}/test-plan.md, ${run_dir}/implementation-log.md"
   })
   ```

3. **Spawn Agents**

   ```
   # Agent restrictions enforced by subagent_type
   test-writer: tdd:test-writer
   implementer: tdd:implementer
   coverage-validator: tdd:coverage-validator
   ```

4. **Execute Pipeline**

   ```
   TaskOutput(task_id: task_6_id, block: true)
   # NO timeout — pipeline must complete
   ```

5. **Structured Fix Loop**

   If `coverage-validator` sends `COVERAGE_FIX_REQUEST`:

   ```json
   {
     "type": "COVERAGE_FIX_REQUEST",
     "uncovered": ["path/to/file.ts:45-52", "path/to/file.ts:78"],
     "current_coverage": 72,
     "target": 80,
     "round": 1
   }
   ```

   Then:
   - **test-writer** adds tests for uncovered paths
   - **implementer** adjusts implementation if needed
   - **coverage-validator** re-validates

   When fixed, `test-writer` sends:

   ```json
   {
     "type": "COVERAGE_FIX_APPLIED",
     "new_tests": ["test file paths"],
     "round": 1
   }
   ```

   **Max 2 rounds**. If still below threshold after round 2, escalate to user.

6. **Shutdown**
   ```
   TeamDelete("tdd-pipeline")
   ```

### Phase 4: Delivery (Lead Inline Orchestration)

1. **Verify Quality Gates**
   - ✅ All tests pass (GREEN phase)
   - ✅ Coverage >= ${coverage_threshold}% (branches, functions, lines, statements)
   - ✅ No test smells detected
   - ✅ Critical code has 100% coverage (if applicable)

2. **Generate Delivery Report**

   ```
   ${run_dir}/tdd-report.md
   ---
   ## Summary
   Feature: ${feature_description}
   Framework: ${framework}

   ## Quality Metrics
   - Tests Written: ${test_count}
   - Tests Passing: ${pass_count}
   - Coverage: ${coverage_percentage}%
   - Test Smells: ${smell_count}

   ## Files Modified
   - Implementation: [list]
   - Tests: [list]

   ## TDD Cycle
   - RED Phase: ✅ Tests failed initially
   - GREEN Phase: ✅ Tests pass after implementation
   - REFACTOR Phase: ✅ Code improved
   - VALIDATE Phase: ✅ Coverage verified

   ## Next Steps
   [recommendations]
   ```

3. **Summary to User**
   Output:
   - Location of run directory: `.claude/tdd/runs/${RUN_ID}/`
   - Quality metrics summary
   - Files modified
   - Next steps

## Agent Type Restrictions

| Agent Name         | subagent_type          | Purpose                              |
| ------------------ | ---------------------- | ------------------------------------ |
| test-writer        | tdd:test-writer        | Write failing tests first            |
| implementer        | tdd:implementer        | Minimal implementation to pass tests |
| coverage-validator | tdd:coverage-validator | Verify coverage thresholds           |

## Constraints

### Mandatory Enforcement

- ❌ MUST NOT write implementation before tests exist
- ❌ MUST NOT skip RED phase verification (tests MUST fail initially)
- ❌ MUST NOT skip GREEN phase verification (tests MUST pass after implementation)
- ❌ MUST NOT invoke agent types outside restrictions table
- ✅ MUST use `TaskOutput(block=true)` — NO timeout
- ✅ MUST verify coverage >= threshold before delivery
- ✅ MUST detect and report test smells

### Test Smells to Detect

1. **Testing Implementation Details**: Tests should test behavior, not internal structure
2. **Interdependent Tests**: Each test should run independently
3. **Brittle Selectors**: E2E tests should use semantic selectors, not fragile CSS
4. **Magic Numbers**: Test data should be clearly explained
5. **Incomplete Mocking**: External dependencies should be properly mocked

### Critical Code Coverage

For code involving:

- Authentication / Authorization
- Payment processing
- Data encryption / Security
- Financial calculations

Require **100% coverage** (override threshold).

## Examples

### Example 1: Feature Implementation

**Input:**

```
/tdd Add user registration with email validation --framework=jest
```

**Output:**

```
✅ TDD Pipeline Completed

Run Directory: .claude/tdd/runs/20260208-143022/

Quality Metrics:
- Tests Written: 12
- Tests Passing: 12/12
- Coverage: 87%
- Test Smells: 0

Files Modified:
- src/auth/register.ts (NEW)
- src/auth/types.ts (MODIFIED)
- tests/auth/register.test.ts (NEW)

TDD Cycle:
✅ RED Phase: 12 tests failed initially
✅ GREEN Phase: Minimal implementation added
✅ REFACTOR Phase: Code improved for readability
✅ VALIDATE Phase: 87% coverage verified

Next Steps:
- Consider adding E2E tests for registration flow
- Review error messages for user-friendliness
```

### Example 2: Bug Fix with Regression Test

**Input:**

```
/tdd Fix bug: users can't login with special characters in password --coverage=90
```

**Output:**

```
✅ TDD Pipeline Completed

Run Directory: .claude/tdd/runs/20260208-151543/

Quality Metrics:
- Tests Written: 3 (1 new regression test)
- Tests Passing: 3/3
- Coverage: 92%
- Test Smells: 0

Files Modified:
- src/auth/login.ts (MODIFIED)
- tests/auth/login.test.ts (MODIFIED)

TDD Cycle:
✅ RED Phase: Regression test reproduced bug
✅ GREEN Phase: Fixed URL encoding in password
✅ REFACTOR Phase: Extracted encoding to helper
✅ VALIDATE Phase: 92% coverage verified

Next Steps:
- Existing auth module coverage maintained at 90%+
- No breaking changes introduced
```
