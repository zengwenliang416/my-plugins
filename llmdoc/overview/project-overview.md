# CCG Workflows

## 1. Identity

- **What it is:** A modular plugin system for Claude Code CLI that provides automated, multi-phase workflows for software development tasks.
- **Purpose:** Orchestrates complex development workflows (commit, planning, UI design, refactoring) through a standardized plugin architecture with multi-model AI collaboration.

## 2. High-Level Description

CCG Workflows implements a 4-layer plugin architecture for Claude Code, enabling automated workflows that combine multiple AI models (Claude, Codex, Gemini) with MCP tools for code analysis and generation. The system provides 7 specialized plugins distributed through a local marketplace, each containing commands (entry points), agents (sub-tasks), skills (reusable components), and hooks (automation). Workflows execute in isolated run directories with state tracking, supporting parallel execution, user confirmation checkpoints, and session resumption.

## 3. Key Components (7 Plugins)

| Plugin             | Version | Purpose                                                            |
| ------------------ | ------- | ------------------------------------------------------------------ |
| **commit**         | v2.0.0  | Parallel analysis commit workflow with semantic/symbol analyzers   |
| **tpd**            | v2.0.0  | Thinking-Plan-Dev workflow with OpenSpec integration               |
| **ui-design**      | v2.0.0  | UI/UX design with parallel variants and dual-model code generation |
| **brainstorm**     | v1.1.0  | Multi-model brainstorming and ideation                             |
| **context-memory** | v1.0.0  | Intelligent context management and session compression             |
| **refactor**       | v1.0.0  | Code smell detection and safe refactoring                          |
| **hooks**          | v1.0.0  | Universal automation hooks (security, optimization, logging)       |

## 4. Tech Stack

- **Languages:** Bash (hooks, scripts), TypeScript (utilities, API clients)
- **Runtime:** Claude Code CLI with plugin system
- **MCP Tools:** auggie-mcp (semantic retrieval), sequential-thinking, codex, gemini
- **External CLI:** `codeagent-wrapper` (Codex/Gemini integration), `grok-search` (web search)
- **Dependencies:** tsx, yaml, esbuild

## 5. Architecture Overview (4-Layer Pattern)

```
Commands Layer     Entry points (*.md with YAML frontmatter)
      |            Orchestrate multi-phase workflows
      v
Agents Layer       Sub-task workers (23 agents across plugins)
      |            Parallel execution via Task tool
      v
Skills Layer       Reusable components (55 skills)
      |            Atomic operations with defined I/O contracts
      v
Hooks Layer        Automation (12 hook scripts)
                   Security, optimization, logging, permissions
```

**Execution Pattern:**

- Commands invoke Agents via `Task(run_in_background=true)` for parallel execution
- Agents call Skills via `Skill("name", "args")` for atomic operations
- All workflows write to `.claude/<plugin>/runs/<timestamp>/` for state isolation
- Hard stops via `AskUserQuestion` for user confirmation at critical points

## 6. Quick Start

```bash
# Add local marketplace
claude plugin marketplace add /path/to/ccg-workflows

# Install a plugin
claude plugin install commit@ccg-workflows

# Or sync all plugins to Claude cache
./scripts/sync-plugins.sh --install
```

## 7. Source of Truth

- **Plugin Registry:** `.claude-plugin/marketplace.json`
- **Plugin Metadata:** `plugins/<name>/.claude-plugin/plugin.json`
- **Sync Script:** `scripts/sync-plugins.sh`
