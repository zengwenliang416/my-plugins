---
generated_at: 2026-02-01T12:00:00+08:00
model: codex-constraint-analysis
level: medium
session_id: manual-analysis-ecc-001
---

# Codex Constraint Analysis

## Original Question

Create a comprehensive learning plan for the `/Users/wenliang_zeng/workspace/open_sources/ccg-workflows/git-repos/everything-claude-code` project (Claude Code Plugin/Extension Project).

Key questions:

1. What are the core functionalities and purposes?
2. How is the architecture and module structure organized?
3. What are the dependencies between modules?
4. How to effectively learn and understand this project?
5. What best practices and design patterns are used?

## Constraints Discovered

### Hard Constraints

| Constraint                                  | Source                                      | Impact                                                                                                             |
| ------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **No "hooks" field in plugin.json**         | Documented regression issues #29, #52, #103 | Claude Code v2.1+ auto-loads hooks/hooks.json by convention; explicit declaration causes duplicate detection error |
| **Minimum Claude Code v2.1.0**              | README.md Requirements section              | Hooks auto-loading behavior changed in this version                                                                |
| **Agent tools declaration**                 | Agent frontmatter format                    | Agents can ONLY use tools explicitly listed in their `tools` array                                                 |
| **Hook matcher DSL syntax**                 | hooks.json schema                           | Limited to: `tool == "X"`, `tool_input.field matches "regex"`, boolean operators                                   |
| **Rules cannot be distributed via plugins** | Upstream Claude Code limitation             | Users must manually copy rules from repo to ~/.claude/rules/                                                       |
| **${CLAUDE_PLUGIN_ROOT} variable**          | Scripts dependency                          | Hook scripts require this environment variable for path resolution                                                 |
| **YAML frontmatter required**               | File format conventions                     | Agents, Skills, Commands must have valid YAML frontmatter with specific fields                                     |

### Soft Constraints

| Constraint            | Recommendation                  | Flexibility                                 |
| --------------------- | ------------------------------- | ------------------------------------------- |
| 80%+ test coverage    | Strongly recommended            | Not enforced by system                      |
| Console.log removal   | Warning hooks exist             | Non-blocking warnings only                  |
| Tmux for dev server   | Hook suggests but allows bypass | User can ignore                             |
| MCP tool count limit  | Keep under 80 active tools      | Performance degradation but no hard failure |
| Context window budget | 10 MCPs enabled per project     | Recommendation, not enforced                |

### File Format Conventions

**Agent Format** (`agents/*.md`):

```yaml
---
name: agent-name
description: What this agent does
tools: ["Read", "Grep", "Glob", "Bash"]
model: opus | sonnet | haiku
---
Markdown body with agent instructions...
```

**Skill Format** (`skills/*/SKILL.md`):

```yaml
---
name: skill-name
description: When to use this skill
---
# Skill Title
Workflow and domain knowledge content...
```

**Command Format** (`commands/*.md`):

```yaml
---
description: What this command does
---
# Command Documentation
Usage instructions and examples...
```

**Hook Matcher DSL**:

```
tool == "Bash" && tool_input.command matches "(npm|pnpm|yarn) (install|test)"
tool == "Write" && tool_input.file_path matches "\\.(ts|tsx)$"
```

## Risk Points

### High Risk

| Risk                          | Description                                   | Historical Evidence                             |
| ----------------------------- | --------------------------------------------- | ----------------------------------------------- |
| **Hooks duplicate detection** | Adding "hooks" to plugin.json causes failure  | 3 fix/revert cycles documented (#29, #52, #103) |
| **Version compatibility**     | Behavior changes between Claude Code versions | Hooks loading behavior changed between versions |
| **Context window exhaustion** | Too many MCPs shrink 200k to 70k context      | Documented in README Important Notes            |

### Medium Risk

| Risk                          | Description                                   | Mitigation                            |
| ----------------------------- | --------------------------------------------- | ------------------------------------- |
| **Cross-platform scripts**    | Node.js scripts may have OS-specific issues   | Test suite exists in tests/ directory |
| **Package manager detection** | Complex detection logic with 6-level fallback | Well-documented priority order        |
| **Hook timeout**              | Async hooks have 30s timeout                  | Document timeout configuration        |

### Low Risk

| Risk                 | Description                                   |
| -------------------- | --------------------------------------------- |
| Hook execution order | Multiple hooks on same event run sequentially |
| Session file format  | Old and new formats both supported            |

## Dependency Constraints

### External Dependencies

| Dependency            | Required | Purpose                     |
| --------------------- | -------- | --------------------------- |
| Node.js               | Yes      | All scripts and hooks       |
| Claude Code CLI v2.1+ | Yes      | Plugin system compatibility |
| Git                   | Optional | Skill creator from history  |
| Prettier              | Optional | Auto-format hook            |
| TypeScript            | Optional | Type checking hook          |

### Component Dependencies

```
plugin.json
    |
    +-- agents/*.md (independent)
    |
    +-- skills/ + commands/ (referenced in plugin.json arrays)
    |
    +-- hooks/hooks.json (auto-loaded by convention)
            |
            +-- scripts/hooks/*.js (executed by hooks)
                    |
                    +-- scripts/lib/utils.js
                    +-- scripts/lib/package-manager.js
```

### Optional vs Required

| Component        | Required               | Notes                 |
| ---------------- | ---------------------- | --------------------- |
| plugin.json      | Yes                    | Plugin manifest       |
| hooks/hooks.json | No                     | Auto-loaded if exists |
| agents/          | No                     | Subagent delegation   |
| skills/          | No                     | Workflow knowledge    |
| commands/        | No                     | Slash commands        |
| rules/           | No                     | Manual copy required  |
| scripts/         | Only if hooks use them | Hook implementations  |

## Security Considerations

### Enforced Patterns

1. **No hardcoded secrets** - rules/security.md enforces secret scanning
2. **Pre-push review** - Hook reminds before git push
3. **console.log warnings** - Detection and warning for debug statements
4. **Documentation blocking** - Prevents random .md file creation (consolidation)

### Sandbox Restrictions

1. Hooks execute with user permissions (no elevated privileges)
2. Hook output goes to stderr (does not modify tool behavior by default)
3. Exit code 1 can block tool execution (PreToolUse hooks)
4. Async hooks run in background without blocking (timeout: 30s)

### Data Flow Controls

1. Hook input: JSON via stdin (tool_input, tool_output)
2. Hook output: stderr for messages, stdout for passthrough
3. Session data: ~/.claude/sessions/ directory
4. Learned skills: ~/.claude/skills/learned/ directory

## Success Criteria Hints

### For Learning the Project

1. [ ] Understand plugin.json manifest structure
2. [ ] Create a simple agent with frontmatter
3. [ ] Write a skill SKILL.md file
4. [ ] Understand hook matcher DSL syntax
5. [ ] Trace SessionStart -> SessionEnd lifecycle
6. [ ] Understand tools restriction per agent
7. [ ] Know why hooks field must not be in plugin.json

### For Using the Project

1. [ ] Install via plugin system or manual copy
2. [ ] Configure package manager preference
3. [ ] Enable desired commands and agents
4. [ ] Limit active MCPs to avoid context exhaustion
5. [ ] Copy rules manually if needed

### For Contributing

1. [ ] Run test suite successfully
2. [ ] Understand regression test for hooks field
3. [ ] Follow cross-platform Node.js patterns
4. [ ] Document changes appropriately

## Learning Path Constraints

### Prerequisites (Must Know First)

1. **Claude Code basics** - How to use Claude Code CLI
2. **Markdown + YAML frontmatter** - File format foundation
3. **Basic Node.js** - For understanding hook scripts
4. **JSON Schema** - For hooks.json structure

### Recommended Learning Order

```
Phase 1: Foundation
  1. README.md - Project overview and structure
  2. plugin.json - Plugin manifest understanding
  3. agents/planner.md - Simple agent example

Phase 2: Core Concepts
  4. hooks/hooks.json - Hook system mechanics
  5. skills/tdd-workflow/SKILL.md - Skill format
  6. commands/tdd.md - Command format

Phase 3: Integration
  7. scripts/hooks/session-start.js - Hook implementation
  8. scripts/lib/utils.js - Shared utilities
  9. rules/security.md - Rule format

Phase 4: Advanced
  10. skills/continuous-learning-v2/ - Complex skill
  11. skills/iterative-retrieval/ - Subagent patterns
  12. mcp-configs/ - MCP integration
```

### Concept Dependencies

```
Plugin System
    |
    +-- Manifest (plugin.json)
    |       |
    |       +-- Agents
    |       +-- Skills
    |       +-- Commands
    |
    +-- Hooks (auto-loaded)
            |
            +-- Matcher DSL
            +-- Event Types (PreToolUse, PostToolUse, etc.)
            +-- Script Execution
```

## Confidence Assessment

| Area                    | Confidence | Uncertainty Points                             |
| ----------------------- | ---------- | ---------------------------------------------- |
| Hard Constraints        | **High**   | Well-documented in README and issues           |
| File Formats            | **High**   | Multiple examples available                    |
| Hook System             | **High**   | Comprehensive hooks.json with comments         |
| Version Compatibility   | **Medium** | Only v2.1+ tested, older versions unknown      |
| Security Patterns       | **Medium** | Rules exist but enforcement varies             |
| Performance Constraints | **Medium** | Context window limits are empirical            |
| Learning Path           | **Medium** | Based on dependency analysis, not user testing |

**Overall Confidence**: Medium-High

The project is well-documented with clear patterns, but some constraints (especially version compatibility and performance limits) are based on empirical observation rather than formal specification.
