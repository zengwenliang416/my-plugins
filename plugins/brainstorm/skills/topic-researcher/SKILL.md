---
name: topic-researcher
description: |
  【触发条件】 Brainstorm Phase 1: Parse topic and execute external research
  【核心产出】 ${run_dir}/research-brief.md
  【不触发】 User specifies --skip-research or research-brief.md exists
  【先问什么】 When topic is too broad, ask for specific direction or constraints
  [Resource Usage] Use `scripts/execute_search.ts` for batch search and references/research-brief-template.md for output.
allowed-tools:
  - Read
  - Write
  - Skill
  - Bash
  - AskUserQuestion
  - mcp__auggie-mcp__codebase-retrieval
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---

# Topic Researcher

Parse brainstorm topic and execute external research to provide information foundation for ideation.

## Script Entry

```bash
npx tsx scripts/execute_search.ts [args]
```

## Resource Usage

- Reference docs: `references/research-brief-template.md`
- Assets: `assets/search-strategy.json`
- Execution script: `scripts/execute_search.ts`

## MCP Tool Integration

| Tool                  | Purpose                                         | Required |
| --------------------- | ----------------------------------------------- | -------- |
| `auggie-mcp`          | Retrieve project code context                   | Yes      |
| `context7`            | Query technical docs and best practices         | Yes      |

## Parameters

| Param   | Type    | Required | Description                                      |
| ------- | ------- | -------- | ------------------------------------------------ |
| run_dir | string  | Yes      | Run directory path                               |
| topic   | string  | Yes      | Brainstorm topic                                 |
| deep    | boolean | No       | Enable deep search (more queries), default false |

## Workflow

### Step 1: Create Run Directory

```bash
mkdir -p "${run_dir}"
```


**Required MCP call:**

```
  thought: "Analyze topic: {topic}. Identify core problems, keywords, domain, constraints.",
  thoughtNumber: 1,
  totalThoughts: 4,
  nextThoughtNeeded: true
})
```

**Focus areas:** Topic parsing -> Domain identification -> Search strategy -> Validation

**Extract:**

- Core problem (one sentence)
- Keywords (3-5)
- Domain (product/tech/market/process)
- Constraints (user-provided)

If topic too broad, use AskUserQuestion: target users? constraints? problem to solve?

### Step 2.1: Code Context Retrieval (auggie-mcp)

```
mcp__auggie-mcp__codebase-retrieval({
  information_request: "Code related to {topic}: implementation, architecture, existing features"
})
```

### Step 2.2: Technical Docs Query (context7)

```
mcp__context7__resolve-library-id({
  libraryName: "{technology_name}",
  query: "{topic} best practices and implementation"
})

mcp__context7__query-docs({
  libraryId: "{resolved_library_id}",
  query: "{topic} implementation methods, API usage, common patterns"
})
```

### Step 3: Execute Exa Search

Use exa skill for 3-5 searches:

Optional batch runner:

```bash
npx tsx scripts/execute_search.ts --topic "{topic}" --mode {basic|deep} --output-dir "{run_dir}"
```

**Basic searches (always execute):**

1. **Trends:**

```
Skill(skill="brainstorm:exa", args="search \"{topic} trends 2026\" --content --limit 5")
```

2. **Case studies:**

```
Skill(skill="brainstorm:exa", args="search \"{topic} case study examples\" --content --limit 5")
```

3. **Cross-domain:**

```
Skill(skill="brainstorm:exa", args="search \"{topic} inspiration from other industries\" --content --limit 5")
```

**Deep searches (only when deep=true):**

4. **Problems:**

```
Skill(skill="brainstorm:exa", args="search \"{topic} challenges problems pain points\" --content --limit 5")
```

5. **Opportunities:**

```
Skill(skill="brainstorm:exa", args="search \"{topic} opportunities innovations startups\" --content --limit 5")
```

### Step 4: Generate Research Brief

Generate `${run_dir}/research-brief.md` using template from references/research-brief-template.md.

**Core sections:**

1. Topic Analysis: core problem, keywords, constraints
2. Industry Trends: 3-5 key trends from search
3. Related Cases: 3-5 cases (table format)
4. Cross-domain Insights: inspiration from other industries
5. Divergence Directions: 3-5 suggested directions

### Step 5: Save Raw Results

Append raw search records in appendix using `<details>` collapse.

## Output Validation

Confirm:

- `${run_dir}/research-brief.md` exists
- Contains all required sections
- At least 3 trends, 3 cases
