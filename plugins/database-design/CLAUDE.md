# Database Design Plugin

Enterprise-grade database schema design using Agent Team Debate pattern.

## Architecture

**Pattern**: Debate/Consensus with specialized agents

```
Lead receives requirements →
  schema-designer: Data integrity, normalization, constraints
  query-optimizer: Performance, indexing, query patterns
→ Structured debate (challenge/response protocol)
→ Lead synthesis with conflict resolution
→ Final schema + migration plan
```

## Available Skills

- `/database-design:design` - Database schema design with debate pattern
  - **Triggered by**: "schema", "database", "数据库设计"
  - **Auto-activates when**: User mentions table design, migrations, or query optimization

## Quick Start

### New Schema Design

```
/database-design Design user management schema with authentication
```

### Optimize Existing Schema

```
/database-design --optimize Review and optimize current database schema
```

### With Specific Database/ORM

```
/database-design --db=postgres --orm=prisma Design e-commerce product catalog
```

## Agent Types

| Agent           | Type                            | Focus                                      |
| --------------- | ------------------------------- | ------------------------------------------ |
| schema-designer | database-design:schema-designer | Data integrity, constraints, normalization |
| query-optimizer | database-design:query-optimizer | Performance, indexes, query patterns       |

## Debate Protocol

**Round 1**: Initial proposals and challenges

- schema-designer creates schema proposal
- query-optimizer sends SCHEMA_CHALLENGE messages for performance issues
- schema-designer responds with ACCEPT or DEFEND

**Round 2**: Final positions

- Remaining challenges reviewed
- Final consensus documented

**Conflict Resolution** (by Lead):

- Data integrity conflicts: schema-designer priority (2x weight)
- Performance conflicts: query-optimizer priority (2x weight)
- Mutual agreement: adopt immediately

## Output Structure

```
openspec/changes/${CHANGE_ID}/
├── input.md                    # Parsed requirements
├── schema-proposal.md          # Designer's initial proposal
├── performance-analysis.md     # Optimizer's analysis
├── debate-log.md               # Challenge/response records
├── schema-final.md             # Final balanced schema
├── migration.sql               # Migration SQL statements
└── design-report.md            # Comprehensive report
```

## Quality Gates

Before completion, verify:

- [ ] No anti-patterns detected (missing FK indexes, unindexed RLS columns, random UUIDs)
- [ ] All query patterns have corresponding indexes
- [ ] RLS policies defined for multi-tenant tables
- [ ] Migration plan includes rollback strategy
- [ ] At least 1 debate round completed
- [ ] All HIGH severity challenges addressed

## Supported Databases

- PostgreSQL (default)
- MySQL
- SQLite (basic support)

## Supported ORMs

- Prisma
- Drizzle
- Raw SQL

## Example Outputs

### Schema Proposal

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### Performance Analysis

```
Challenge: users.email index missing for login queries
Severity: HIGH
Impact: Full table scan on every login (10k rows = 500ms)
Recommendation: CREATE INDEX idx_users_email ON users(email)
```

## Best Practices

### Schema Designer Focus

- Use `bigint` for IDs (never `serial` or `integer`)
- Use `text` for strings (not `varchar`)
- Use `timestamptz` for timestamps
- Use `numeric` for money/precision decimals
- Define NOT NULL constraints for required fields
- Add CHECK constraints for validation
- Foreign keys with ON DELETE/UPDATE policies

### Query Optimizer Focus

- Index all foreign keys
- Index all RLS policy columns
- Use composite indexes for multi-column queries
- Avoid random UUIDs (use UUIDv7 or bigint)
- Use cursor pagination (not OFFSET)
- Batch operations for bulk inserts
- EXPLAIN ANALYZE for query verification

## Common Commands

```bash
# New schema design
/database-design Design blog platform with posts, comments, users

# Optimize existing schema
/database-design --optimize Review current schema performance

# Specific database type
/database-design --db=mysql Design inventory management system

# With ORM integration
/database-design --orm=drizzle Design multi-tenant SaaS schema
```

## Troubleshooting

**Issue**: Agents timeout during debate
**Solution**: Use `TaskOutput(block=true)` - no timeout parameter

**Issue**: Conflicting recommendations
**Solution**: Lead applies conflict resolution with domain-specific weights

**Issue**: Missing context for existing schema
**Solution**: Use `--optimize` flag to scan codebase with auggie-mcp

## Integration

This plugin works well with:

- `tpd` plugin for implementation planning
- `openspec` for architecture proposals
- `context-memory` for schema evolution tracking
