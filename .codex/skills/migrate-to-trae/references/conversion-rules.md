# Claude Code → Trae Conversion Rules

## 1. YAML Front Matter

### Fields to Remove

```yaml
# Remove these fields entirely
allowed-tools: [...]
context: fork
model: claude-3-5-sonnet
disable-model-invocation: true
```

### Fields to Keep

```yaml
# Keep these fields
name: skill-name
description: "Skill description"
```

### Arguments Handling

```yaml
# Claude Code
arguments:
  - name: run_dir
    type: string
    required: true
    description: Runtime directory

# Trae - Remove or convert to inline documentation
# Arguments become part of the skill description
```

---

## 2. Task/Agent Calls

### Single Agent Call

```markdown
<!-- Claude Code -->

Task(
subagent_type="commit:change-investigator",
prompt="Execute investigation. run_dir=${RUN_DIR}",
description="investigate changes"
)

<!-- Trae -->

调用 @change-investigator，参数：

- run_dir: ${RUN_DIR}
```

### Parallel Agent Calls

```markdown
<!-- Claude Code -->

Task(subagent_type="commit:semantic-analyzer", run_in_background=true, ...)
Task(subagent_type="commit:symbol-analyzer", run_in_background=true, ...)

<!-- Trae -->

并行调用以下智能体：

1. @semantic-analyzer，参数：run_dir=${RUN_DIR}
2. @symbol-analyzer，参数：run_dir=${RUN_DIR}
```

### Skill Calls

```markdown
<!-- Claude Code -->

Skill("commit:message-generator", args="run_dir=${RUN_DIR}")

<!-- Trae -->

调用 /message-generator，参数：run_dir=${RUN_DIR}
```

---

## 3. Tool References

| Claude Code Tool                      | Trae Equivalent | Notes                          |
| ------------------------------------- | --------------- | ------------------------------ |
| `Read`                                | Read            | Direct mapping                 |
| `Glob`                                | Read            | Use file search within Read    |
| `Grep`                                | Read            | Use content search within Read |
| `Write`                               | Edit            | -                              |
| `Edit`                                | Edit            | -                              |
| `Bash`                                | Terminal        | -                              |
| `WebSearch`                           | Web Search      | -                              |
| `WebFetch`                            | Web Search      | -                              |
| `AskUserQuestion`                     | Inline question | Format with (a)/(b)/(c)        |
| `mcp__auggie-mcp__codebase-retrieval` | ❌              | Degrade to Read + analysis     |
| `LSP`                                 | ❌              | Degrade to Read + parsing      |

---

## 4. User Interaction

### AskUserQuestion Conversion

```markdown
<!-- Claude Code -->

AskUserQuestion({
question: "How would you like to proceed?",
header: "Action",
options: [
{ label: "Accept", description: "Continue with current" },
{ label: "Modify", description: "Make changes" },
{ label: "Cancel", description: "Stop workflow" }
]
})

<!-- Trae -->

**请选择操作方式：**

- (a) Accept - Continue with current
- (b) Modify - Make changes
- (c) Cancel - Stop workflow
```

---

## 5. Pre-fetched Context

```markdown
<!-- Claude Code -->

context:

- type: file
  path: ./references/rules.json
- type: command
  command: git status

<!-- Trae - Remove context, add explicit commands -->

### 准备工作

1. 读取配置文件 `./references/rules.json`
2. 执行 `git status` 获取状态
```

---

## 6. Agent Definition → UI Config

### Source (agents/\*.md)

```markdown
---
name: semantic-analyzer
description: Semantic analysis of code changes
allowed-tools:
  - Read
  - mcp__auggie-mcp__codebase-retrieval
---

# Semantic Analyzer

You are semantic-analyzer...
```

### Target (.trae/agents/README.md)

```markdown
### semantic-analyzer

| 字段               | 值                |
| ------------------ | ----------------- |
| 名称               | 语义分析器        |
| 英文标识名         | semantic-analyzer |
| 可被其他智能体调用 | ✅ 启用           |
| 工具               | Read              |

**提示词：**
You are semantic-analyzer...
```

---

## 7. Output Directory

| Claude Code                | Trae                         |
| -------------------------- | ---------------------------- |
| `.claude/committing/runs/` | `.trae/runs/`                |
| `.claude/developing/runs/` | `.trae/runs/`                |
| `${run_dir}`               | `${run_dir}` (same variable) |

---

## 8. Unsupported Features

### Hooks

```bash
# Claude Code hooks - NOT SUPPORTED in Trae
hooks/
├── scripts/
│   └── pre-commit.sh
└── hook.json
```

**Migration strategy:** Document in MIGRATION.md, suggest manual alternatives.

### MCP Tools

```markdown
# mcp**auggie-mcp**codebase-retrieval - NOT AVAILABLE

# Degraded alternative:

1. Use Read to scan relevant directories
2. Use Terminal for `grep`/`find` commands
3. Manually analyze code structure
```

### LSP

```markdown
# LSP tools - NOT AVAILABLE

# Degraded alternative:

1. Use Read to load source files
2. Parse code structure manually
3. Extract symbols from file content
```

---

## 9. Naming Conventions

| Claude Code                  | Trae                   |
| ---------------------------- | ---------------------- |
| `commit:change-investigator` | `@change-investigator` |
| `tpd:codex-cli`              | `@codex-cli`           |
| `Skill("commit:xxx")`        | `/xxx`                 |

**Rule:** Remove plugin prefix, use `@` for agents, `/` for skills.
