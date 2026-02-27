---
description: "Database schema design with Debate pattern — schema designer vs query optimizer for balanced design"
argument-hint: "<requirements> [--optimize] [--db=postgres|mysql] [--orm=prisma|drizzle|raw]"
allowed-tools:
  [
    "Task",
    "Read",
    "Write",
    "Bash",
    "Glob",
    "Grep",
    "TeamCreate",
    "TeamDelete",
    "TaskCreate",
    "TaskUpdate",
    "TaskList",
    "SendMessage",
    "AskUserQuestion",
    "mcp__auggie-mcp__codebase-retrieval",
  ]
---

# Database Design Command (Debate Pattern)

You are the **Lead Orchestrator** for database schema design using the **Debate/Consensus pattern**.

## Objective

Generate production-ready database schema through structured debate between:

- **schema-designer**: Data integrity, normalization, constraints
- **query-optimizer**: Performance, indexing, query patterns

## Architecture

```
Lead (you) receives requirements
    ↓
Create independent proposals:
  - schema-designer: Schema with constraints/RLS
  - query-optimizer: Performance analysis + index strategy
    ↓
Structured debate (challenge/response protocol):
  Round 1: Optimizer challenges → Designer responds
  Round 2: Final positions documented
    ↓
Lead synthesizes with conflict resolution
    ↓
Final schema + migration SQL
```

## Execution Protocol

## Task Result Handling

Each `Task` call **blocks** until the teammate finishes and returns the result directly in the call response.

**FORBIDDEN — never do this:**
- MUST NOT call `TaskOutput` — this tool does not exist
- MUST NOT manually construct task IDs (e.g., `agent-name@worktree-id`)

**CORRECT — always use direct return:**
- The result comes from the `Task` call itself, no extra step needed

### Phase 1: Initialization (Lead)

1. Create run directory:

```bash
# Derive CHANGE_ID: kebab-case from design requirements
# Examples: "design-db-user-management", "design-db-ecommerce-catalog"
# Fallback: "design-db-$(date +%Y%m%d-%H%M%S)"
CHANGE_ID="design-db-${slug_from_requirements}"
RUN_DIR="openspec/changes/${CHANGE_ID}"
mkdir -p "$RUN_DIR"
```

**OpenSpec scaffold** — write immediately after `mkdir`:

- `${RUN_DIR}/proposal.md`: `# Change:` title, `## Why` (schema design purpose), `## What Changes` (schema + migration deliverables), `## Impact`
- `${RUN_DIR}/tasks.md`: one numbered section per phase (Init, Independent Proposals, Debate, Synthesis, Migration) with `- [ ]` items

Mark items `[x]` as each phase completes.

2. Parse requirements:
   - Extract entities, relationships, constraints
   - Detect database type (default: postgres)
   - Detect ORM preference (default: raw)
   - Identify query patterns

3. If `--optimize` flag present:
   - Use `mcp__auggie-mcp__codebase-retrieval` to scan existing schema files
   - Search for: `*.prisma`, `*.sql`, migration files, ORM models
   - Extract current schema structure

4. Write `${RUN_DIR}/input.md`:

```markdown
# Design Requirements

## Entities

[List entities with attributes]

## Relationships

[Foreign keys, cardinality]

## Query Patterns

[Expected queries, access patterns]

## Constraints

- Database: ${DB_TYPE}
- ORM: ${ORM}
- Performance targets: [if specified]

## Existing Schema

[If --optimize flag used]
```

### Phase 2: Independent Design (Lead Orchestration)

1. Create team:

```
TeamCreate("database-design-team")
```

2. Create tasks with dependencies:

**Task 1: Schema Proposal** (schema-designer)

```markdown
## Task: Schema Proposal

**Agent**: schema-designer
**Input**: ${RUN_DIR}/input.md

### Objectives

1. Design normalized schema with:
   - Proper data types (bigint IDs, text strings, timestamptz)
   - Constraints (NOT NULL, UNIQUE, CHECK, FK)
   - RLS policies for multi-tenant scenarios
2. Write CREATE TABLE statements
3. Document normalization decisions

### Output

Write ${RUN_DIR}/schema-proposal.md with:

- Complete CREATE TABLE statements
- Constraint definitions
- RLS policy proposals
- Normalization rationale

### Format

Use standard SQL with comments explaining design decisions.
```

**Task 2: Performance Analysis** (query-optimizer)

```markdown
## Task: Performance Analysis

**Agent**: query-optimizer
**Input**: ${RUN_DIR}/input.md

### Objectives

1. Analyze query patterns from requirements
2. Design index strategy:
   - B-tree for equality/range queries
   - GIN for JSONB/full-text
   - Composite indexes for multi-column queries
3. Identify performance anti-patterns
4. Estimate query costs

### Output

Write ${RUN_DIR}/performance-analysis.md with:

- Query pattern analysis
- Index recommendations (CREATE INDEX statements)
- Anti-pattern warnings
- Performance estimates

### Format

Include EXPLAIN ANALYZE examples for key queries.
```

**Task 3: Debate Round 1 - Challenges** (query-optimizer, blocked by Task 1 & 2)

````markdown
## Task: Debate Round 1 - Send Challenges

**Agent**: query-optimizer
**Inputs**:

- ${RUN_DIR}/schema-proposal.md
- ${RUN_DIR}/performance-analysis.md

### Objectives

Review schema-designer's proposal and send SCHEMA_CHALLENGE messages for:

- Missing indexes on foreign keys
- Unindexed RLS policy columns
- Data type choices impacting performance (random UUIDs, varchar vs text)
- Missing composite indexes for common query patterns
- N+1 query risks

### Challenge Format

Send messages with structure:

```json
{
  "type": "SCHEMA_CHALLENGE",
  "item": "users table",
  "issue": "Missing index on email column",
  "severity": "HIGH|MEDIUM|LOW",
  "impact": "Full table scan on login (10k rows = 500ms)",
  "suggestion": "CREATE INDEX idx_users_email ON users(email)",
  "evidence": "Query pattern analysis shows email lookup in 80% of requests"
}
```
````

### Output

Write ${RUN_DIR}/challenges-round1.md documenting all challenges sent.

````

**Task 4: Debate Round 1 - Responses** (schema-designer, blocked by Task 3)
```markdown
## Task: Debate Round 1 - Respond to Challenges

**Agent**: schema-designer
**Inputs**:
- ${RUN_DIR}/schema-proposal.md
- ${RUN_DIR}/challenges-round1.md
- SCHEMA_CHALLENGE messages

### Objectives
For each SCHEMA_CHALLENGE, respond with:
- **ACCEPT**: Adopt the suggestion, update schema
- **DEFEND**: Provide data integrity rationale for rejecting

### Response Format
```json
{
  "type": "SCHEMA_RESPONSE",
  "item": "users table",
  "challenge_id": "email_index",
  "action": "ACCEPT|DEFEND",
  "change": "[If ACCEPT] Added index: CREATE INDEX idx_users_email ON users(email)",
  "rationale": "[If DEFEND] Email uniqueness constraint already creates index automatically"
}
````

### Output

Write ${RUN_DIR}/responses-round1.md with:

- All responses
- Updated schema (if changes accepted)
- Rationale for defended positions

````

**Task 5: Debate Round 2 - Final Positions** (both agents, blocked by Task 4)
```markdown
## Task: Debate Round 2 - Final Review

**Agents**: schema-designer, query-optimizer

### Objectives
- query-optimizer reviews defended positions from Round 1
- Identify remaining conflicts (HIGH severity only)
- Document final positions

### Output
Each agent writes to ${RUN_DIR}/final-position-{agent}.md:
- Accepted changes summary
- Remaining conflicts (with evidence)
- Recommended resolution strategy
````

3. Spawn agents using Task tool (launch independent tasks in a single message for concurrent execution):

```
# Task 1 + Task 2: Independent proposals — launch in parallel
Task(
  name="schema-designer",
  subagent_type="database-design:design:schema-designer",
  team_name="database-design-team",
  prompt="[Task 1 prompt: Schema Proposal — see above]"
)
Task(
  name="query-optimizer",
  subagent_type="database-design:design:query-optimizer",
  team_name="database-design-team",
  prompt="[Task 2 prompt: Performance Analysis — see above]"
)

# Task 3: Debate Round 1 - Challenges (after proposals complete)
Task(
  name="query-optimizer",
  subagent_type="database-design:design:query-optimizer",
  team_name="database-design-team",
  prompt="[Task 3 prompt: Debate Round 1 - Send Challenges — see above]"
)

# Task 4: Debate Round 1 - Responses (after challenges)
Task(
  name="schema-designer",
  subagent_type="database-design:design:schema-designer",
  team_name="database-design-team",
  prompt="[Task 4 prompt: Debate Round 1 - Respond to Challenges — see above]"
)

# Task 5: Debate Round 2 - Final Review (after responses)
# Launch both agents in parallel for final positions
Task(
  name="schema-designer",
  subagent_type="database-design:design:schema-designer",
  team_name="database-design-team",
  prompt="[Task 5a prompt: Final position for schema-designer — see above]"
)
Task(
  name="query-optimizer",
  subagent_type="database-design:design:query-optimizer",
  team_name="database-design-team",
  prompt="[Task 5b prompt: Final position for query-optimizer — see above]"
)
```

# Task call blocks until the teammate finishes.

# Results are returned directly — no TaskOutput needed.

### Phase 3: Debate Protocol Validation (Lead)

1. Read debate artifacts:
   - `${RUN_DIR}/challenges-round1.md`
   - `${RUN_DIR}/responses-round1.md`
   - `${RUN_DIR}/final-position-schema-designer.md`
   - `${RUN_DIR}/final-position-query-optimizer.md`

2. Verify debate quality:
   - At least 1 SCHEMA_CHALLENGE sent
   - All HIGH severity challenges addressed
   - No circular arguments (same issue debated >2 rounds)

3. If debate incomplete:
   - Create additional TaskCreate for unresolved issues
   - Repeat until consensus or explicit conflict remains

4. Shutdown team:

```
TeamDelete("database-design-team")
```

### Phase 4: Synthesis (Lead)

1. **Conflict Resolution Protocol**:

For each remaining conflict:

**Data Integrity Conflict** (schema-designer priority 2x):

- Examples: Normalization level, constraint definitions, NULL vs NOT NULL
- Decision: Favor schema-designer unless optimizer shows >50% performance degradation

**Performance Conflict** (query-optimizer priority 2x):

- Examples: Index strategy, data type choices for query efficiency
- Decision: Favor query-optimizer unless designer shows data corruption risk

**Mutual Agreement**:

- If both agents agree after debate: adopt immediately
- If both agents disagree with user requirement: escalate with AskUserQuestion

2. **Merge Schema**:
   - Start with schema-proposal.md
   - Apply all ACCEPTED changes from responses
   - Apply Lead-resolved conflicts
   - Integrate index strategy from performance-analysis.md

3. Write `${RUN_DIR}/schema-final.md`:

```sql
-- Final Schema: Database Design with Debate Pattern
-- Generated: ${TIMESTAMP}
-- Database: ${DB_TYPE}
-- ORM: ${ORM}

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE users (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Primary indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Composite indexes for common queries
CREATE INDEX idx_users_active_created ON users(is_active, created_at) WHERE is_active = true;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_policy ON users
  FOR SELECT USING (auth.uid() = id OR is_public = true);

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Phase 5: Migration Generation (Lead)

1. Generate migration SQL for `${RUN_DIR}/migration.sql`:

**New Schema**:

```sql
-- Migration: Initial Schema
-- Generated: ${TIMESTAMP}

BEGIN;

-- Create tables
[Copy from schema-final.md]

-- Create indexes
[Copy from schema-final.md]

-- Create RLS policies
[Copy from schema-final.md]

-- Create triggers
[Copy from schema-final.md]

COMMIT;
```

**Existing Schema** (if --optimize):

```sql
-- Migration: Schema Optimization
-- Generated: ${TIMESTAMP}

BEGIN;

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

-- Alter data types
ALTER TABLE users ALTER COLUMN id TYPE BIGINT;

-- Add constraints
ALTER TABLE users ADD CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Rollback strategy
-- DROP INDEX CONCURRENTLY idx_users_email;
-- ALTER TABLE users ALTER COLUMN id TYPE INTEGER;
-- ALTER TABLE users DROP CONSTRAINT users_email_check;

COMMIT;
```

2. Include rollback statements as comments

### Phase 6: Report (Lead)

Write `${RUN_DIR}/design-report.md`:

```markdown
# Database Design Report

**Generated**: ${TIMESTAMP}
**Database**: ${DB_TYPE}
**ORM**: ${ORM}
**Run ID**: ${RUN_ID}

## Executive Summary

[2-3 sentences summarizing design decisions]

## Schema Overview

### Entities

| Table | Purpose       | Key Constraints       |
| ----- | ------------- | --------------------- |
| users | User accounts | UNIQUE email, FK auth |
| posts | User content  | FK user_id, NOT NULL  |

### Relationships
```

users (1) ──< (N) posts
posts (1) ──< (N) comments

```

## Debate Summary

### Round 1: Initial Challenges
- **Total Challenges**: ${COUNT}
- **Accepted**: ${ACCEPTED_COUNT}
- **Defended**: ${DEFENDED_COUNT}

#### Key Challenges
1. **Missing email index** (HIGH)
   - Challenger: query-optimizer
   - Response: ACCEPT
   - Change: Added CREATE INDEX idx_users_email

2. **VARCHAR vs TEXT** (MEDIUM)
   - Challenger: query-optimizer
   - Response: DEFEND
   - Rationale: TEXT has no performance penalty in Postgres, simplifies schema

### Round 2: Final Consensus
[Summary of remaining conflicts and resolutions]

## Index Strategy

### Primary Indexes
- `idx_users_email` (B-tree): Login queries
- `idx_posts_user_id` (B-tree): Foreign key, user posts lookup

### Composite Indexes
- `idx_posts_user_created` (user_id, created_at): User timeline queries
- `idx_posts_published` (is_published, created_at): Public feed

### Performance Estimates
| Query | Before | After | Improvement |
|---|---|---|---|
| Login by email | 500ms (seq scan) | 2ms (index) | 250x |
| User posts | 200ms (seq scan) | 5ms (index) | 40x |

## RLS Policies

### Multi-Tenant Isolation
- `users`: Users can only SELECT own record or public profiles
- `posts`: Users can CRUD own posts, SELECT published posts

### Policy Index Coverage
✅ All RLS policy columns indexed (user_id, is_published)

## Anti-Patterns Avoided

- ❌ Random UUIDs → ✅ BIGINT with IDENTITY
- ❌ VARCHAR(255) → ✅ TEXT
- ❌ Missing FK indexes → ✅ All FKs indexed
- ❌ OFFSET pagination → ✅ Cursor pagination supported (id + created_at index)

## Migration Plan

### Execution Steps
1. Run `migration.sql` in transaction
2. Verify with `EXPLAIN ANALYZE` on key queries
3. Monitor index usage with `pg_stat_user_indexes`
4. Rollback if query performance degrades

### Rollback Strategy
See commented rollback statements in `migration.sql`

## Quality Checklist

- [x] All foreign keys indexed
- [x] RLS policy columns indexed
- [x] No random UUIDs
- [x] Cursor pagination supported
- [x] Data types optimized (bigint, text, timestamptz)
- [x] Constraints enforce data integrity
- [x] Migration includes rollback plan
- [x] At least 1 debate round completed
- [x] All HIGH severity challenges addressed

## Files Generated

- `schema-final.md`: Complete schema with indexes and RLS
- `migration.sql`: Executable migration with rollback
- `design-report.md`: This document

## Next Steps

1. Review schema-final.md for business logic accuracy
2. Test migration.sql in staging environment
3. Run EXPLAIN ANALYZE on production query samples
4. Monitor index usage after deployment
5. Consider materialized views for complex reports
```

### Phase 7: User Output (Lead)

Display report to user:

```
Database design completed with ${CHALLENGE_COUNT} challenges debated.

📊 Schema: ${TABLE_COUNT} tables, ${INDEX_COUNT} indexes
🔒 RLS: ${POLICY_COUNT} policies defined
⚡ Performance: ${IMPROVEMENT_SUMMARY}

📁 Output directory: ${RUN_DIR}

Key files:
- schema-final.md: Production-ready schema
- migration.sql: Executable migration
- design-report.md: Full analysis

Quality gates: [X] All passed

Run migration:
  psql -f ${RUN_DIR}/migration.sql

Review debate:
  cat ${RUN_DIR}/challenges-round1.md
  cat ${RUN_DIR}/responses-round1.md
```

## Agent Type Restrictions

**CRITICAL**: Only invoke these agent types:

| Agent Name      | subagent_type                          | Purpose                                             |
| --------------- | -------------------------------------- | --------------------------------------------------- |
| schema-designer | database-design:design:schema-designer | Schema design, data integrity, constraints, RLS     |
| query-optimizer | database-design:design:query-optimizer | Query performance, indexing, anti-pattern detection |

**Forbidden**:

- DO NOT invoke any other agent types
- DO NOT use generic agent types
- DO NOT bypass debate protocol

## Constraints

1. **Debate Protocol**:
   - MUST use SCHEMA_CHALLENGE/SCHEMA_RESPONSE message format
   - MUST have at least 1 debate round
   - MUST address all HIGH severity challenges

2. **Task Execution**:
   - MUST spawn teammates using Task tool with team_name parameter
   - MUST launch parallel teammates in a single message for concurrent execution
   - MUST shutdown team after completion

3. **Output Quality**:
   - MUST generate migration.sql with rollback plan
   - MUST validate all indexes cover query patterns
   - MUST check RLS policies for multi-tenant scenarios

4. **Conflict Resolution**:
   - Data integrity: schema-designer priority (2x weight)
   - Performance: query-optimizer priority (2x weight)
   - Mutual agreement: adopt immediately
   - Unresolvable: escalate to user

## Error Handling

**Agent timeout**:

- Review agent outputs for partial results
- Spawn new teammate via Task tool to complete work

**Debate stalemate** (>5 rounds on same issue):

- Apply conflict resolution weights
- Document Lead decision in design-report.md
- Escalate to user if both severity HIGH

**Missing codebase context** (--optimize):

- Verify auggie-mcp connection
- Fall back to manual schema specification
- Ask user for schema files path

## ORM Integration

### Prisma

```prisma
model User {
  id        BigInt   @id @default(autoincrement())
  email     String   @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([email])
  @@map("users")
}
```

### Drizzle

```typescript
export const users = pgTable(
  "users",
  {
    id: bigint("id", { mode: "bigint" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    email: text("email").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailIdx: index("idx_users_email").on(table.email),
  }),
);
```

## Execution Checklist

Before proceeding to next phase:

**Phase 1**:

- [ ] Run directory created
- [ ] input.md written with all requirements
- [ ] Database type detected
- [ ] Existing schema scanned (if --optimize)

**Phase 2**:

- [ ] Team created
- [ ] 5 tasks defined with dependencies
- [ ] Agents spawned via Task tool with team_name parameter
- [ ] Task tool blocks until teammate completion

**Phase 3**:

- [ ] All debate artifacts read
- [ ] At least 1 SCHEMA_CHALLENGE sent
- [ ] All HIGH severity challenges addressed
- [ ] Team deleted

**Phase 4**:

- [ ] Conflict resolution applied
- [ ] schema-final.md written with indexes and RLS

**Phase 5**:

- [ ] migration.sql generated
- [ ] Rollback statements included

**Phase 6**:

- [ ] design-report.md comprehensive
- [ ] Quality checklist completed

**Phase 7**:

- [ ] User output displayed
- [ ] File paths absolute
- [ ] Next steps clear

Begin execution with Phase 1.
