# TDD Plugin

Test-Driven Development pipeline enforcing write-tests-first methodology with Agent Team orchestration.

## Available Skills

- **Command**: `/tdd:tdd`
- **Triggers**: "tdd", "test first", "测试驱动"
- **Purpose**: Implement features using RED → GREEN → REFACTOR cycle with automated coverage validation

## Quick Start

```bash
/tdd Add search functionality with tests
/tdd Fix bug #123 with regression test
/tdd Implement user authentication --coverage=90
/tdd Add payment processing --framework=jest
```

## Architecture

**Pipeline Pattern**: Sequential agent execution with quality gates

```
test-writer (RED) → implementer (GREEN) → coverage-validator → Delivery
     ↓                    ↓                        ↓
  Write failing     Minimal code to       Verify 80%+ coverage
     tests            pass tests           & test quality
```

### TDD Cycle

1. **RED**: Write failing tests that define expected behavior
2. **GREEN**: Write minimal code to make tests pass
3. **REFACTOR**: Improve code while keeping tests green
4. **VALIDATE**: Ensure coverage thresholds and test quality

## Agent Types

| Agent              | Type                   | Responsibility                                          |
| ------------------ | ---------------------- | ------------------------------------------------------- |
| test-writer        | tdd:test-writer        | Write comprehensive failing tests before implementation |
| implementer        | tdd:implementer        | Write minimal code to pass tests, then refactor         |
| coverage-validator | tdd:coverage-validator | Verify coverage >= 80%, detect test smells              |

## Output Structure

```
.claude/runs/${RUN_ID}/
├── input.md                 # Feature/bug description
├── interfaces.md            # API surface design
├── test-plan.md            # Test strategy (by test-writer)
├── implementation-log.md   # Implementation notes (by implementer)
├── coverage-report.md      # Coverage analysis (by coverage-validator)
└── tdd-report.md          # Final delivery summary
```

## Quality Gates

### Mandatory Requirements

- ✅ All tests MUST fail in RED phase
- ✅ All tests MUST pass in GREEN phase
- ✅ Coverage >= 80% (branches, functions, lines, statements)
- ✅ Critical code (auth, financial) requires 100% coverage
- ✅ No test smells (implementation testing, brittle selectors, interdependence)

### Structured Fix Loop

When coverage falls below threshold:

```
coverage-validator → COVERAGE_FIX_REQUEST
  {type: "COVERAGE_FIX_REQUEST", uncovered: [...], current_coverage: 72}

test-writer → adds missing tests → COVERAGE_FIX_APPLIED
  {type: "COVERAGE_FIX_APPLIED", new_tests: [...], round: 1}

→ Max 2 rounds, then escalate to user
```

## Framework Support

- **Jest**: Node.js projects, React
- **Vitest**: Vite-based projects
- **Playwright**: E2E tests

Auto-detected from `package.json`, or specify with `--framework=<name>`

## Best Practices

### Test Coverage Strategy

1. **Unit Tests** (mandatory): Test individual functions/methods
2. **Integration Tests** (mandatory for APIs): Test component interactions
3. **E2E Tests** (critical flows): Test user journeys

### Edge Cases Checklist

- ⬜ Null/undefined inputs
- ⬜ Empty strings/arrays/objects
- ⬜ Invalid types
- ⬜ Boundary values (min/max)
- ⬜ Error conditions
- ⬜ Race conditions (async code)

### Mocking Patterns

- **External APIs**: Mock HTTP requests (MSW, nock)
- **Database**: Mock Supabase/Prisma queries
- **Third-party services**: Mock OpenAI, Stripe, etc.
- **File system**: Mock fs operations

## Examples

### Feature Implementation

```bash
/tdd Add user registration with email validation
```

Output:

- Tests for valid/invalid email formats
- Tests for duplicate email detection
- Tests for password strength requirements
- Minimal implementation
- 85% coverage report

### Bug Fix with Regression Test

```bash
/tdd Fix bug: users can't login with special characters in password
```

Output:

- Regression test reproducing the bug
- Test verifies special characters work
- Minimal fix to authentication logic
- Coverage maintained at 80%+

## Workflow Phases

### Phase 1: Initialization

Lead agent creates run directory and analyzes target code structure.

### Phase 2: Interface Design

Lead defines API surface and confirms with user (HARD STOP).

### Phase 3: TDD Pipeline

Agent Team executes RED → GREEN → REFACTOR cycle with automated validation.

### Phase 4: Delivery

Lead verifies quality gates and generates summary report.

## Constraints

- ❌ MUST NOT write implementation before tests exist
- ❌ MUST NOT skip RED phase verification
- ❌ MUST NOT skip GREEN phase verification
- ❌ MUST NOT invoke agent types outside restrictions
- ✅ MUST use TaskOutput(block=true) for pipeline execution
