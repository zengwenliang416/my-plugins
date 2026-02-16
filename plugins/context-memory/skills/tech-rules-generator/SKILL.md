---
name: tech-rules-generator
description: |
  Generate tech stack rules and conventions for .claude/memory/rules/.
  [Trigger] New project onboarding or tech stack detection needed for Claude context.
  [Output] .claude/memory/rules/${stack}.md + ${run_dir}/rules-discovery.md
  [Skip] When rules already exist and project stack hasn't changed.
  [Ask] Target tech stack if auto-detection finds multiple frameworks.
allowed-tools:
  - Read
  - Write
  - Bash
  - Skill
  - Glob
  - Grep
  - mcp__auggie-mcp__codebase-retrieval
arguments:
  - name: run_dir
    type: string
    required: true
    description: Output directory for intermediate artifacts
  - name: stack
    type: string
    required: false
    description: "Force tech stack: react, vue, nextjs, express, nestjs, etc. (auto-detect if omitted)"
  - name: output_dir
    type: string
    required: false
    description: "Output directory for rules (default: .claude/memory/rules/)"
---

# tech-rules-generator

## Purpose

Analyze the project's tech stack and generate convention rules that help Claude understand project-specific patterns. Output to `.claude/memory/rules/` for persistent use.

## Rule Categories

| Category         | Content                                   | Example                                                            |
| ---------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| `naming`         | File/variable/function naming conventions | "Components use PascalCase, hooks use camelCase with `use` prefix" |
| `structure`      | Directory organization patterns           | "Feature-based: each feature has components/, hooks/, types/"      |
| `imports`        | Import ordering and aliasing              | "Path alias `@/` maps to `src/`, absolute imports preferred"       |
| `testing`        | Test patterns and conventions             | "Colocated tests in `__tests__/`, use vitest + testing-library"    |
| `error-handling` | Error patterns                            | "Use Result<T,E> pattern, never throw in service layer"            |
| `api`            | API conventions                           | "RESTful, kebab-case URLs, camelCase JSON fields"                  |

## Steps

### Phase 1: Stack Detection

1. If `stack` specified, use it.
2. Otherwise, detect from:
   - `package.json` dependencies
   - Framework config files (`next.config.*`, `vite.config.*`, etc.)
   - `mcp__auggie-mcp__codebase-retrieval` for architectural patterns

### Phase 2: Convention Analysis

3. Use `Skill("context-memory:codex-cli", {role: "analyzer", prompt})` to analyze:
   - File naming patterns across the codebase
   - Import/export conventions
   - Error handling patterns
   - Test organization
4. Read existing `.claude/memory/rules/` to avoid duplicating already-captured rules.

### Phase 3: Rule Generation

5. For each category with detected conventions:
   a. Format as a concise rule document.
   b. Include concrete examples from the actual codebase.
   c. Mark confidence level: `confirmed` (multiple examples) or `inferred` (few examples).

### Phase 4: Output

6. Ensure `.claude/memory/rules/` directory exists.
7. Write `${output_dir}/${stack}.md` with all rules:

```markdown
# {Stack} Rules

## Naming

- Components: PascalCase (`UserProfile.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth.ts`)

## Structure

- Feature-based organization
- Shared code in `src/shared/`

## Imports

- Path alias `@/` → `src/`
- Order: external → internal → relative

## Testing

- Colocated in `__tests__/`
- Framework: vitest + @testing-library/react

## Error Handling

- Result<T,E> pattern in services
- try/catch only at API boundaries
```

8. Write discovery log to `${run_dir}/rules-discovery.md`.

## Verification

- Rules file exists at `${output_dir}/${stack}.md`.
- Each rule category has at least one concrete example.
- No duplicate rules with existing `.claude/memory/rules/` content.
