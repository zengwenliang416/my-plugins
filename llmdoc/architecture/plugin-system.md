# Plugin System Architecture

## 1. Identity

- **What it is:** A 4-layer modular architecture for Claude Code workflow extensions.
- **Purpose:** Enables composable, discoverable workflow automation with parallel execution support.

## 2. Core Components

- `.claude-plugin/marketplace.json` (PluginRegistry): Defines the local marketplace with all available plugins (name, description, source, version).
- `plugins/<name>/.claude-plugin/plugin.json` (PluginMetadata): Individual plugin identity (name, description, version).
- `plugins/<name>/commands/*.md` (CommandDefinition): Slash command entry points with YAML frontmatter.
- `plugins/<name>/agents/*.md` (AgentDefinition): Sub-task worker definitions invoked via Task tool.
- `plugins/<name>/skills/*/SKILL.md` (SkillDefinition): Atomic reusable components with I/O contracts.
- `plugins/<name>/hooks/hooks.json` (HookRegistry): Cross-cutting automation at 5 lifecycle points.
- `scripts/sync-plugins.sh:1-659` (SyncScript): Plugin discovery, validation, and installation orchestrator.
- `scripts/validate-skills.sh:1-233` (ValidationScript): SKILL.md frontmatter and structure validator.

## 3. Execution Flow (LLM Retrieval Map)

### 3.1 Plugin Discovery

- **1. Registry Read:** System reads `.claude-plugin/marketplace.json:7-50` to enumerate plugins.
- **2. Metadata Load:** For each plugin, reads `plugins/<name>/.claude-plugin/plugin.json`.
- **3. Command Registration:** Scans `plugins/<name>/commands/*.md` to register slash commands.

### 3.2 Command Execution

- **1. Entry:** User invokes `/command` (e.g., `/commit`).
- **2. Command Parse:** Reads frontmatter from `plugins/<name>/commands/<command>.md:1-5`.
- **3. Agent Dispatch:** Command orchestrates agents via `Task(subagent_type, prompt, run_in_background)`.
- **4. Skill Invocation:** Agents/commands call atomic skills via `Skill("<name>", "args")`.
- **5. Hook Intercept:** Hooks trigger at lifecycle points (UserPromptSubmit, PreToolUse, etc.).

### 3.3 4-Layer Architecture

| Layer    | Location            | Invocation Method           | Purpose             |
| -------- | ------------------- | --------------------------- | ------------------- |
| Commands | `commands/*.md`     | Slash command (`/commit`)   | Workflow entry      |
| Agents   | `agents/*.md`       | `Task(run_in_background)`   | Parallel sub-tasks  |
| Skills   | `skills/*/SKILL.md` | `Skill("<name>", "args")`   | Atomic operations   |
| Hooks    | `hooks/hooks.json`  | Auto-triggered at lifecycle | Cross-cutting logic |

## 4. Design Rationale

- **Separation of Concerns:** Commands orchestrate, Agents parallelize, Skills atomize, Hooks intercept.
- **Parallel-First:** Agents support `run_in_background=true` for concurrent execution.
- **Run Directory Isolation:** Each workflow execution uses `.claude/<plugin>/runs/<timestamp>/` for state.
- **Matcher Patterns:** Hooks use regex patterns (e.g., `Write|Edit|MultiEdit`, `mcp__.*`) for precise targeting.
- **Timeout Enforcement:** All hooks have configurable timeouts (3-30s) to prevent blocking.
