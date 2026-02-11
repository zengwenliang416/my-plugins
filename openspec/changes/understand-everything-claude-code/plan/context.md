# Context Analysis: everything-claude-code

## Project Identity

- **Name**: everything-claude-code
- **Version**: 1.2.0
- **Author**: Affaan Mustafa (Anthropic hackathon winner)
- **License**: MIT
- **Path**: `/Users/wenliang_zeng/workspace/open_sources/ccg-workflows/git-repos/everything-claude-code`
- **Type**: Claude Code Plugin/Extension Project
- **Source**: https://github.com/affaan-m/everything-claude-code

## Project Purpose

A production-ready Claude Code plugin containing battle-tested configurations evolved over 10+ months of intensive daily use. Provides complete collection of agents, skills, hooks, commands, rules, and MCP configurations for enhancing Claude Code workflows.

---

## Project Structure Overview

```
everything-claude-code/
|-- .claude-plugin/           # Plugin manifests
|   |-- plugin.json           # Plugin metadata and component paths
|   |-- marketplace.json      # Marketplace catalog for installation
|
|-- agents/                   # Specialized subagents (12 agents)
|   |-- planner.md            # Feature implementation planning
|   |-- architect.md          # System design decisions
|   |-- tdd-guide.md          # Test-driven development
|   |-- code-reviewer.md      # Quality and security review
|   |-- security-reviewer.md  # Vulnerability analysis
|   |-- build-error-resolver.md
|   |-- e2e-runner.md         # Playwright E2E testing
|   |-- refactor-cleaner.md   # Dead code cleanup
|   |-- doc-updater.md        # Documentation sync
|   |-- database-reviewer.md  # Database review
|   |-- go-reviewer.md        # Go code review
|   |-- go-build-resolver.md  # Go build error resolution
|
|-- skills/                   # Workflow definitions (12+ skills)
|   |-- coding-standards/     # Language best practices
|   |-- backend-patterns/     # API, database, caching patterns
|   |-- frontend-patterns/    # React, Next.js patterns
|   |-- tdd-workflow/         # TDD methodology
|   |-- security-review/      # Security checklist
|   |-- continuous-learning/  # Auto-extract patterns (v1)
|   |-- continuous-learning-v2/  # Instinct-based learning
|   |-- iterative-retrieval/  # Progressive context refinement
|   |-- strategic-compact/    # Manual compaction suggestions
|   |-- eval-harness/         # Verification loop evaluation
|   |-- verification-loop/    # Continuous verification
|   |-- golang-patterns/      # Go idioms
|   |-- golang-testing/       # Go testing patterns
|
|-- commands/                 # Slash commands (18+ commands)
|   |-- tdd.md                # /tdd - Test-driven development
|   |-- plan.md               # /plan - Implementation planning
|   |-- e2e.md                # /e2e - E2E test generation
|   |-- code-review.md        # /code-review - Quality review
|   |-- build-fix.md          # /build-fix - Fix build errors
|   |-- refactor-clean.md     # /refactor-clean - Dead code removal
|   |-- learn.md              # /learn - Extract patterns
|   |-- checkpoint.md         # /checkpoint - Save verification state
|   |-- verify.md             # /verify - Run verification loop
|   |-- setup-pm.md           # /setup-pm - Configure package manager
|   |-- go-review.md          # /go-review - Go code review
|   |-- go-test.md            # /go-test - Go TDD workflow
|   |-- go-build.md           # /go-build - Fix Go build errors
|   |-- skill-create.md       # /skill-create - Generate skills from git
|   |-- instinct-status.md    # /instinct-status - View instincts
|   |-- instinct-import.md    # /instinct-import - Import instincts
|   |-- instinct-export.md    # /instinct-export - Export instincts
|   |-- evolve.md             # /evolve - Cluster instincts into skills
|
|-- rules/                    # Always-follow guidelines (6 rules)
|   |-- security.md           # Mandatory security checks
|   |-- coding-style.md       # Immutability, file organization
|   |-- testing.md            # TDD, 80% coverage requirement
|   |-- git-workflow.md       # Commit format, PR process
|   |-- agents.md             # When to delegate to subagents
|   |-- performance.md        # Model selection, context management
|
|-- hooks/                    # Trigger-based automations
|   |-- hooks.json            # All hooks config
|   |-- memory-persistence/   # Session lifecycle hooks
|   |-- strategic-compact/    # Compaction suggestions
|
|-- scripts/                  # Cross-platform Node.js scripts
|   |-- lib/
|   |   |-- utils.js          # Cross-platform utilities
|   |   |-- package-manager.js # PM detection and selection
|   |-- hooks/
|   |   |-- session-start.js  # Load context on session start
|   |   |-- session-end.js    # Save state on session end
|   |   |-- pre-compact.js    # Pre-compaction state saving
|   |   |-- suggest-compact.js # Strategic compaction suggestions
|   |   |-- evaluate-session.js # Extract patterns
|   |-- setup-package-manager.js
|
|-- tests/                    # Test suite
|   |-- lib/                  # Library tests
|   |-- hooks/                # Hook tests
|   |-- run-all.js            # Test runner
|
|-- contexts/                 # Dynamic system prompt contexts
|   |-- dev.md                # Development mode
|   |-- review.md             # Code review mode
|   |-- research.md           # Research mode
|
|-- examples/                 # Example configurations
|   |-- CLAUDE.md             # Project-level config example
|   |-- user-CLAUDE.md        # User-level config example
|
|-- mcp-configs/              # MCP server configurations
|   |-- mcp-servers.json      # GitHub, Supabase, Vercel, etc.
```

---

## Key Files and Their Purposes

### Core Configuration Files

| File                              | Purpose                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------ |
| `.claude-plugin/plugin.json`      | Plugin metadata: name, version, description, agents list, skills paths               |
| `.claude-plugin/marketplace.json` | Marketplace registry for installation via `/plugin marketplace add`                  |
| `hooks/hooks.json`                | Lifecycle hooks: PreToolUse, PostToolUse, PreCompact, SessionStart, SessionEnd, Stop |
| `mcp-configs/mcp-servers.json`    | MCP server configurations (GitHub, Supabase, Vercel, etc.)                           |

### Entry Points

| Entry Point     | Type    | Description                               |
| --------------- | ------- | ----------------------------------------- |
| `/tdd`          | Command | Test-driven development workflow          |
| `/plan`         | Command | Implementation planning via planner agent |
| `/code-review`  | Command | Quality review via code-reviewer agent    |
| `/skill-create` | Command | Generate skills from git history          |
| `/evolve`       | Command | Cluster instincts into skills/commands    |

### Critical Scripts

| Script                              | Purpose                                                |
| ----------------------------------- | ------------------------------------------------------ |
| `scripts/lib/utils.js`              | Cross-platform utilities (file ops, git ops, hook I/O) |
| `scripts/lib/package-manager.js`    | Package manager detection (npm/pnpm/yarn/bun)          |
| `scripts/hooks/session-start.js`    | Load previous context on new session                   |
| `scripts/hooks/session-end.js`      | Persist session state                                  |
| `scripts/hooks/evaluate-session.js` | Extract patterns from sessions                         |

---

## Component Relationships

### Layer Hierarchy (Bottom-Up)

```
Layer 5: Hooks (Deterministic)
    |-- Fires 100% of the time on triggers
    |-- Intercepts tool calls: PreToolUse, PostToolUse
    |-- Manages session lifecycle: SessionStart, SessionEnd
    |
Layer 4: Rules (Always Active)
    |-- Always-follow guidelines
    |-- Loaded to context automatically
    |-- Cannot be distributed via plugins (manual copy required)
    |
Layer 3: Skills (Probabilistic ~50-80%)
    |-- Reusable workflow definitions
    |-- Claude decides when to activate based on context
    |-- Domain knowledge and patterns
    |
Layer 2: Agents (Delegated Tasks)
    |-- Specialized subagents with limited tools
    |-- Invoked via Task tool with background=true
    |-- Each has defined model and tools array
    |
Layer 1: Commands (Entry Points)
    |-- Slash commands users invoke directly
    |-- Orchestrate workflows using agents/skills
    |-- Define user-facing interface
```

### Component Dependencies

```
Commands ────> invoke ────> Agents
    |                         |
    |                         v
    +──> reference ──> Skills <──── use
                         ^
                         |
Hooks ─────> observe ────+
```

### Data Flow

```
User Input
    |
    v
Commands (Entry Point)
    |
    +--> Agents (Delegated Work)
    |        |
    |        v
    |    Skills (Domain Knowledge)
    |
    v
Hooks (Pre/Post Interception)
    |
    v
Tool Execution
    |
    v
Hooks (Post Processing)
    |
    v
Output to User
```

---

## Critical Code Paths for Learning

### 1. Plugin Loading Path

```
1. Claude Code CLI reads .claude-plugin/marketplace.json
2. Plugin metadata loaded from .claude-plugin/plugin.json
3. Commands registered from commands/*.md (YAML frontmatter)
4. Agents loaded from agents/*.md (listed in plugin.json)
5. Skills loaded from skills/**/SKILL.md
6. Hooks auto-loaded from hooks/hooks.json (Claude Code v2.1+ convention)
```

### 2. TDD Workflow Path (Example)

```
1. User: /tdd "implement user authentication"
2. Command: commands/tdd.md
3. Agent: agents/tdd-guide.md (model: opus, tools: Read, Grep, Glob, Bash)
4. Skill: skills/tdd-workflow/SKILL.md
5. Workflow: RED -> GREEN -> REFACTOR -> verify 80% coverage
```

### 3. Continuous Learning Path (v2)

```
1. Hooks capture prompts + tool use (100% reliable)
2. observations.jsonl stores raw data
3. Observer agent (Haiku, background) detects patterns
4. Creates atomic instincts with confidence scoring
5. /evolve clusters related instincts into skills/commands/agents
```

### 4. Session Lifecycle Path

```
SessionStart:
  1. session-start.js hook fires
  2. Load recent session files (7 days)
  3. Detect package manager
  4. Report learned skills available

SessionEnd:
  1. session-end.js hook fires
  2. Persist session state
  3. evaluate-session.js extracts patterns
```

---

## Tech Stack

| Category         | Technologies                                          |
| ---------------- | ----------------------------------------------------- |
| Languages        | JavaScript (Node.js), Markdown (YAML frontmatter), Go |
| Runtime          | Claude Code CLI v2.1.0+                               |
| Package Managers | npm, pnpm, yarn, bun (auto-detected)                  |
| Testing          | Jest/Vitest (unit), Playwright (E2E)                  |
| MCP Servers      | GitHub, Supabase, Vercel, Railway, Cloudflare, etc.   |

---

## Key Constraints

### Hard Constraints

1. **NO hooks field in plugin.json** - Causes duplicate detection error in Claude Code v2.1+
2. **Minimum Claude Code CLI v2.1.0** required
3. **YAML frontmatter required** for agents/skills/commands
4. **Agents limited** to declared tools array
5. **Rules cannot be distributed via plugins** - Must copy manually to ~/.claude/rules/
6. **${CLAUDE_PLUGIN_ROOT}** required for hook script paths
7. **Node.js required** for all hook scripts (cross-platform)
8. **Exit codes for hooks**: 0=continue, 1=block

### Soft Constraints

1. Keep under 10 MCPs enabled per project, under 80 tools active
2. 80% test coverage for TDD workflow
3. Context window: 200k shrinks to ~70k with too many MCPs
4. Instinct confidence 0.7+ for auto-approval

---

## Learning Priority Order

### Phase 1: Foundation (Day 1)

- README.md - Project overview, installation
- .claude-plugin/plugin.json - Plugin manifest structure
- .claude-plugin/marketplace.json - Marketplace mechanism

### Phase 2: Core Concepts (Day 2-3)

- rules/\*.md - Always-follow guidelines format
- hooks/hooks.json - Hook event types and matchers
- One agent example (agents/code-reviewer.md)
- One skill example (skills/tdd-workflow/SKILL.md)

### Phase 3: Integration Patterns (Day 4-5)

- commands/tdd.md - How commands invoke agents
- skills/continuous-learning-v2/SKILL.md - Advanced learning system
- scripts/lib/utils.js - Cross-platform utilities

### Phase 4: Practice (Day 6-7)

- Install plugin and run commands
- Trace /tdd execution flow
- Observe hook lifecycle

### Phase 5: Advanced (Week 2+)

- mcp-configs/mcp-servers.json - MCP integration
- contexts/\*.md - Dynamic prompt injection
- Create custom skills and agents

---

## Common Pitfalls to Avoid

1. **Adding hooks to plugin.json** - Will cause duplicate detection error
2. **Enabling too many MCPs** - Context window shrinks dramatically
3. **Expecting rules to install via plugin** - Must copy manually
4. **Using bash scripts on Windows** - All scripts must be Node.js
5. **Forgetting YAML frontmatter** - Required for all agents/skills/commands
6. **Running dev servers outside tmux** - Hook blocks this for log access
