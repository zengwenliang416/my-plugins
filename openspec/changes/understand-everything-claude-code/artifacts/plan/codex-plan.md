# Backend Architecture Technical Planning: everything-claude-code

## Metadata

- Proposal ID: understand-everything-claude-code
- Created: 2026-02-02
- Planner: Codex Architect Agent
- Focus: backend, api, data, plugin-structure

---

## 1. Requirement Understanding

### 1.1 Functionality Boundaries

| Boundary                | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| Plugin System           | Understand how plugins are registered, loaded, and managed |
| Hook Lifecycle          | Master the 6 hook event types and their execution model    |
| Script Execution        | Learn the Node.js cross-platform script architecture       |
| Configuration           | Understand YAML frontmatter and JSON config formats        |
| Component Communication | Map the data flow between Commands, Agents, Skills, Hooks  |

### 1.2 Technical Constraints

| ID  | Constraint                              | Technical Impact                                   |
| --- | --------------------------------------- | -------------------------------------------------- |
| H1  | NO hooks field in plugin.json           | Claude Code v2.1+ auto-loads from hooks/hooks.json |
| H2  | Minimum CLI v2.1.0                      | Required for hook auto-discovery behavior          |
| H3  | YAML frontmatter required               | All agents/skills/commands must have frontmatter   |
| H4  | Agents limited to declared tools        | tools array restricts agent capabilities           |
| H5  | Rules cannot be distributed via plugins | Must copy manually to ~/.claude/rules/             |
| H6  | ${CLAUDE_PLUGIN_ROOT} for hook paths    | Environment variable for script resolution         |
| H7  | Node.js required for scripts            | Cross-platform compatibility requirement           |
| H8  | Exit codes for hooks                    | 0=continue, 1=block execution                      |

### 1.3 Questions to Clarify

- [ ] How does Claude Code discover and load multiple plugins?
- [ ] What is the exact sequence when multiple hooks match the same event?
- [ ] How do agents delegate to other agents without Task tool access?
- [ ] What is the instinct confidence threshold for auto-approval?

---

## 2. Codebase Context

### 2.1 Related Modules

```
everything-claude-code/
|-- .claude-plugin/           # Plugin registration layer
|   |-- plugin.json           # Metadata + component paths
|   |-- marketplace.json      # Discovery registry
|
|-- hooks/                    # Deterministic automation layer
|   |-- hooks.json            # Event configuration
|
|-- scripts/                  # Execution engine layer
|   |-- lib/                  # Shared utilities
|   |   |-- utils.js          # Cross-platform core
|   |   |-- package-manager.js # PM detection
|   |-- hooks/                # Hook implementations
|       |-- session-start.js
|       |-- session-end.js
|       |-- pre-compact.js
|       |-- suggest-compact.js
|       |-- evaluate-session.js
|       |-- check-console-log.js
|
|-- agents/                   # Delegated task layer (12 agents)
|-- skills/                   # Domain knowledge layer (12+ skills)
|-- commands/                 # Entry point layer (18+ commands)
|-- rules/                    # Always-active guidelines (6 rules)
|-- contexts/                 # Dynamic prompt injection
```

### 2.2 Existing Patterns

#### Pattern 1: Plugin Manifest (plugin.json)

```json
{
  "name": "everything-claude-code",
  "version": "1.2.0",
  "description": "...",
  "skills": ["./skills/", "./commands/"],
  "agents": ["./agents/architect.md", "./agents/code-reviewer.md"]
}
```

**Key Observations**:

- `skills` uses directory paths (auto-discovers SKILL.md)
- `agents` uses explicit file paths
- NO hooks field (auto-loaded separately)

#### Pattern 2: Hook Configuration (hooks.json)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "tool == \"Bash\" && tool_input.command matches \"pattern\"",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/script.js\""
          }
        ],
        "description": "Hook purpose"
      }
    ]
  }
}
```

**Key Observations**:

- 6 event types: PreToolUse, PostToolUse, PreCompact, SessionStart, SessionEnd, Stop
- Matcher uses expression syntax with tool/tool_input variables
- Scripts receive JSON via stdin, output JSON to stdout

#### Pattern 3: Agent Definition (YAML Frontmatter)

```yaml
---
name: code-reviewer
description: Expert code review specialist...
tools: ["Read", "Grep", "Glob", "Bash"]
model: opus
---
System prompt content here...
```

**Key Observations**:

- `tools` array limits agent capabilities
- `model` specifies which Claude model to use
- Body contains the system prompt

#### Pattern 4: Skill Definition (YAML Frontmatter)

```yaml
---
name: tdd-workflow
description: Use this skill when writing new features...
---
# Skill Content

Activation criteria and workflow details...
```

**Key Observations**:

- Probabilistic activation (~50-80%)
- Claude decides when to use based on context
- No tools restriction (uses parent context)

#### Pattern 5: Command Definition (YAML Frontmatter)

```yaml
---
description: Command purpose...
---
# Command Content

Invokes specific agent and references skills...
```

**Key Observations**:

- Entry point for user invocation via `/command`
- Orchestrates agents and skills
- Lighter frontmatter than agents

### 2.3 Dependencies

```
Component Dependency Graph (Top-Down):

User Input
    |
    v
Commands (/tdd, /plan, /code-review)
    |
    +--> invoke --> Agents (tdd-guide, planner, code-reviewer)
    |                  |
    |                  v
    |              Skills (tdd-workflow, backend-patterns)
    |
    v
Hooks (PreToolUse, PostToolUse)
    |
    v
Scripts (utils.js, package-manager.js)
    |
    v
Tool Execution (Bash, Read, Write)
```

---

## 3. Architecture Solution

### 3.1 Solution Comparison

#### Solution A: Bottom-Up Learning (Foundation First)

| Aspect   | Description                                                 |
| -------- | ----------------------------------------------------------- |
| Approach | Start from scripts/lib -> hooks -> agents -> commands       |
| Pros     | Deep understanding of execution model; builds incrementally |
| Cons     | Slower to see user-facing results; may lose motivation      |
| Effort   | 7-10 days for full comprehension                            |
| Risk     | May get stuck in implementation details                     |

#### Solution B: Top-Down Learning (User Flow First)

| Aspect   | Description                                              |
| -------- | -------------------------------------------------------- |
| Approach | Start from commands -> agents -> skills -> hooks         |
| Pros     | Quick wins; see working features early; maintain context |
| Cons     | May miss underlying patterns; need backtrack later       |
| Effort   | 5-7 days for functional understanding                    |
| Risk     | Shallow understanding of hook system                     |

#### Solution C: Hybrid Learning (Layered Approach)

| Aspect   | Description                                       |
| -------- | ------------------------------------------------- |
| Approach | Learn each layer completely before moving to next |
| Pros     | Balanced depth and breadth; clear progression     |
| Cons     | More structured; less flexible                    |
| Effort   | 7 days with clear milestones                      |
| Risk     | May need to revisit previous layers               |

### 3.2 Recommended Solution

**Solution C: Hybrid Learning (Layered Approach)**

Rationale:

1. Matches the project's explicit 5-layer architecture
2. Each layer has clear boundaries and verification points
3. Dependencies flow naturally from Layer 5 (Hooks) to Layer 1 (Commands)
4. Allows verification checkpoints at each layer transition

### 3.3 Decision Rationale

The project explicitly defines a 5-layer hierarchy:

```
Layer 5: Hooks (Deterministic, 100% fire rate)
    |
Layer 4: Rules (Always active, loaded to context)
    |
Layer 3: Skills (Probabilistic ~50-80%)
    |
Layer 2: Agents (Delegated tasks, limited tools)
    |
Layer 1: Commands (Entry points, user-facing)
```

Learning should follow this hierarchy to understand:

1. How deterministic behaviors (hooks) guarantee execution
2. How rules enforce constraints always
3. How skills provide domain knowledge probabilistically
4. How agents execute specialized tasks
5. How commands orchestrate everything

---

## 4. Technical Specs

### 4.1 API Design (Plugin System)

#### Plugin Registration API

| Endpoint         | Method | Description                           |
| ---------------- | ------ | ------------------------------------- |
| plugin.json      | Static | Plugin manifest loaded by Claude Code |
| marketplace.json | Static | Discovery catalog for marketplace     |
| hooks/hooks.json | Static | Hook configuration (auto-loaded)      |

#### Plugin Manifest Schema

```typescript
interface PluginManifest {
  name: string; // Plugin identifier
  version: string; // Semantic version
  description: string; // Human-readable description
  author?: {
    name: string;
    url?: string;
  };
  homepage?: string;
  repository?: string;
  license?: string;
  keywords?: string[];
  skills?: string[]; // Paths to skill directories
  agents?: string[]; // Paths to agent files
  // NOTE: NO hooks field - auto-loaded from hooks/hooks.json
}
```

#### Hook Configuration Schema

```typescript
interface HookConfig {
  hooks: {
    PreToolUse?: HookEntry[];
    PostToolUse?: HookEntry[];
    PreCompact?: HookEntry[];
    SessionStart?: HookEntry[];
    SessionEnd?: HookEntry[];
    Stop?: HookEntry[];
  };
}

interface HookEntry {
  matcher: string; // Expression syntax
  hooks: HookAction[];
  description?: string;
}

interface HookAction {
  type: "command";
  command: string; // Node.js script path
  async?: boolean; // Non-blocking execution
  timeout?: number; // Timeout in seconds
}
```

### 4.2 Data Model

#### Hook Event Data Flow

```
stdin (JSON) --> Hook Script --> stdout (JSON)
                     |
                     v
                stderr (User Messages)

Exit Code: 0 = continue, 1 = block
```

#### Hook Input Schema (PreToolUse/PostToolUse)

```typescript
interface HookInput {
  tool: string; // Tool name: "Bash", "Read", "Write", "Edit"
  tool_input: {
    command?: string; // For Bash
    file_path?: string; // For Read/Write/Edit
    content?: string; // For Write
  };
  tool_output?: {
    // Only for PostToolUse
    output?: string;
    error?: string;
  };
}
```

#### Session State Schema

```typescript
interface SessionState {
  date: string; // YYYY-MM-DD
  started: string; // HH:MM
  lastUpdated: string; // HH:MM
  completed: string[]; // Completed tasks
  inProgress: string[]; // Current tasks
  notes: string[]; // Notes for next session
  contextToLoad: string[]; // Files to load
}
```

### 4.3 Security Strategy

| Security Aspect    | Implementation                                 |
| ------------------ | ---------------------------------------------- |
| Script Sandboxing  | Node.js scripts run with standard permissions  |
| Command Validation | Hooks use matcher expressions to filter        |
| Secret Detection   | security.md rule enforces no hardcoded secrets |
| Exit Code Control  | Hooks can block dangerous operations (exit 1)  |
| Path Traversal     | ${CLAUDE_PLUGIN_ROOT} scopes script paths      |

### 4.4 Performance

| Aspect              | Strategy                                       |
| ------------------- | ---------------------------------------------- |
| Hook Execution      | Synchronous by default, async option available |
| Timeout Control     | Configurable per-hook (default: no timeout)    |
| Context Window      | <10 MCPs enabled, <80 tools active             |
| Session Persistence | JSON files in ~/.claude/sessions/              |

---

## 5. Implementation Path

### 5.1 Phases

#### Phase 1: Foundation (Day 1)

| Task                       | File                            | Checkpoint                  |
| -------------------------- | ------------------------------- | --------------------------- |
| Read project overview      | README.md                       | Explain project purpose     |
| Understand plugin manifest | .claude-plugin/plugin.json      | Describe manifest fields    |
| Explore marketplace format | .claude-plugin/marketplace.json | Explain discovery mechanism |

**Verification**: Can explain how plugins are registered and discovered.

#### Phase 2: Core Concepts (Day 2-3)

| Task                     | File                           | Checkpoint               |
| ------------------------ | ------------------------------ | ------------------------ |
| Study hook configuration | hooks/hooks.json               | List all 6 event types   |
| Analyze matcher syntax   | hooks.json matchers            | Write custom matcher     |
| Learn script utilities   | scripts/lib/utils.js           | Use 3+ utility functions |
| Understand PM detection  | scripts/lib/package-manager.js | Explain detection chain  |

**Verification**: Can trace hook execution from trigger to script completion.

#### Phase 3: Component Patterns (Day 4-5)

| Task                  | File                         | Checkpoint                     |
| --------------------- | ---------------------------- | ------------------------------ |
| Agent anatomy         | agents/code-reviewer.md      | Identify frontmatter fields    |
| Skill structure       | skills/tdd-workflow/SKILL.md | Compare to agent format        |
| Command orchestration | commands/tdd.md              | Map command->agent->skill      |
| Rules format          | rules/security.md            | Explain always-active behavior |

**Verification**: Can create minimal agent, skill, command, and rule.

#### Phase 4: Integration Patterns (Day 6)

| Task                | File                              | Checkpoint                    |
| ------------------- | --------------------------------- | ----------------------------- |
| Session lifecycle   | scripts/hooks/session-start.js    | Trace session start flow      |
| State persistence   | scripts/hooks/session-end.js      | Understand state saving       |
| Pattern extraction  | scripts/hooks/evaluate-session.js | Explain learning loop         |
| Compaction handling | scripts/hooks/pre-compact.js      | Understand context management |

**Verification**: Can explain complete session lifecycle with state persistence.

#### Phase 5: Advanced Features (Day 7+)

| Task                   | File                                   | Checkpoint                  |
| ---------------------- | -------------------------------------- | --------------------------- |
| Continuous learning v2 | skills/continuous-learning-v2/SKILL.md | Explain instinct system     |
| MCP integration        | mcp-configs/mcp-servers.json           | Configure one MCP server    |
| Dynamic contexts       | contexts/dev.md                        | Understand prompt injection |

**Verification**: Can extend plugin with custom learning workflow.

### 5.2 Tasks

```
Task Dependency Graph:

[Day 1]
  T1: Read README.md
  T2: Analyze plugin.json --> depends on T1
  T3: Analyze marketplace.json --> depends on T1

[Day 2-3]
  T4: Study hooks.json --> depends on T2
  T5: Master matcher syntax --> depends on T4
  T6: Learn utils.js --> depends on T4
  T7: Learn package-manager.js --> depends on T6

[Day 4-5]
  T8: Analyze agent format --> depends on T2
  T9: Analyze skill format --> depends on T8
  T10: Analyze command format --> depends on T9
  T11: Analyze rules format --> depends on T8

[Day 6]
  T12: Trace session-start.js --> depends on T6, T4
  T13: Trace session-end.js --> depends on T12
  T14: Trace evaluate-session.js --> depends on T13
  T15: Understand continuous learning --> depends on T14

[Day 7+]
  T16: Configure MCP integration --> depends on T2
  T17: Create custom skill --> depends on T9, T15
  T18: Create custom agent --> depends on T8, T17
```

### 5.3 Critical Path

```
T1 --> T2 --> T4 --> T6 --> T12 --> T13 --> T14 --> T15
                |
                +--> T8 --> T9 --> T10 --> T17 --> T18
```

---

## 6. Risks and Mitigation

| Level  | Risk                            | Impact                             | Mitigation                               |
| ------ | ------------------------------- | ---------------------------------- | ---------------------------------------- |
| HIGH   | Hook configuration errors       | Duplicate detection error in v2.1+ | Never add hooks field to plugin.json     |
| HIGH   | Missing Node.js runtime         | All scripts fail                   | Verify Node.js installed before starting |
| MEDIUM | Outdated CLI version            | Hooks not auto-loaded              | Require Claude Code CLI v2.1.0+          |
| MEDIUM | Context window exhaustion       | MCPs reduce available context      | Keep <10 MCPs enabled                    |
| MEDIUM | Rules not distributed           | Security rules not applied         | Copy manually to ~/.claude/rules/        |
| LOW    | Package manager detection fails | Wrong commands used                | Set CLAUDE_PACKAGE_MANAGER env var       |
| LOW    | Session state corruption        | Lost context between sessions      | Backup ~/.claude/sessions/               |

---

## 7. Key Integration Points

### 7.1 Plugin Loading Sequence

```
1. Claude Code CLI starts
2. Reads .claude-plugin/marketplace.json (if present)
3. Loads .claude-plugin/plugin.json
4. Registers commands from commands/*.md (YAML frontmatter)
5. Loads agents from agents/*.md (listed in plugin.json)
6. Discovers skills from skills/**/SKILL.md
7. Auto-loads hooks from hooks/hooks.json (v2.1+ convention)
8. Copies rules to context (if manually installed)
```

### 7.2 Hook Execution Sequence

```
1. User invokes tool (e.g., Bash command)
2. PreToolUse hooks evaluated
   a. Each matcher expression checked
   b. Matching hooks execute in order
   c. Exit code 1 blocks tool execution
3. Tool executes (if not blocked)
4. PostToolUse hooks evaluated
   a. Receives tool_output in stdin
   b. Can log, transform, or warn
5. Response returned to Claude
```

### 7.3 Session Lifecycle Sequence

```
SessionStart:
  1. session-start.js hook fires
  2. Load recent session files (7 days)
  3. Check for learned skills
  4. Detect and report package manager
  5. Show selection prompt if needed

During Session:
  1. PreToolUse hooks on Edit/Write
  2. suggest-compact.js tracks edit count
  3. Suggests manual compaction at intervals

SessionEnd:
  1. session-end.js creates/updates session file
  2. evaluate-session.js extracts patterns
  3. Updates observations.jsonl (continuous learning)

Stop (After Each Response):
  1. check-console-log.js warns about debug statements
```

### 7.4 Component Communication Pattern

```
User: /tdd "implement feature"
    |
    v
Command: commands/tdd.md
    |
    +--> References tdd-guide agent
    |
    v
Agent: agents/tdd-guide.md (model: opus)
    |
    +--> Limited to tools: Read, Grep, Glob, Bash
    +--> References tdd-workflow skill
    |
    v
Skill: skills/tdd-workflow/SKILL.md
    |
    +--> Provides TDD methodology
    +--> Activation probability ~50-80%
    |
    v
Hooks: PreToolUse, PostToolUse
    |
    +--> Intercept tool calls
    +--> Run Node.js scripts
    +--> Can block or transform
```

---

## 8. Learning Sequence Recommendations

### For Backend Understanding

1. **Start with scripts/lib/utils.js**
   - Core utility functions
   - Cross-platform patterns
   - Hook I/O (readStdinJson, log, output)

2. **Then scripts/lib/package-manager.js**
   - Detection chain pattern
   - Configuration layering
   - Environment variable handling

3. **Then hooks/hooks.json**
   - Event types and matchers
   - Script path resolution
   - Exit code semantics

4. **Then scripts/hooks/\*.js**
   - Session lifecycle implementation
   - State persistence patterns
   - Pattern extraction logic

5. **Finally plugin configuration**
   - plugin.json structure
   - marketplace.json format
   - Component path resolution

### Key Files to Master

| Priority | File                           | Reason                     |
| -------- | ------------------------------ | -------------------------- |
| P1       | scripts/lib/utils.js           | Foundation for all scripts |
| P1       | hooks/hooks.json               | Defines all automation     |
| P1       | .claude-plugin/plugin.json     | Entry point for plugin     |
| P2       | scripts/hooks/session-start.js | Session initialization     |
| P2       | scripts/hooks/session-end.js   | State persistence          |
| P2       | agents/code-reviewer.md        | Agent pattern example      |
| P3       | skills/tdd-workflow/SKILL.md   | Skill pattern example      |
| P3       | commands/tdd.md                | Command orchestration      |
| P3       | rules/security.md              | Rule format example        |

---

## 9. Architecture Diagrams

### 9.1 Component Layer Architecture

```
+------------------------------------------------------------------+
|                      User Interface Layer                         |
|   /tdd    /plan    /code-review    /learn    /evolve    ...     |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                      Command Layer (18+)                          |
|   commands/tdd.md    commands/plan.md    commands/code-review.md |
|   - Entry points for user invocation                              |
|   - Orchestrate agents and skills                                 |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                      Agent Layer (12)                             |
|   tdd-guide    planner    code-reviewer    architect    ...      |
|   - Specialized task execution                                    |
|   - Limited to declared tools array                               |
|   - Specific model assignment                                     |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                      Skill Layer (12+)                            |
|   tdd-workflow    backend-patterns    security-review    ...     |
|   - Domain knowledge and patterns                                 |
|   - Probabilistic activation (~50-80%)                            |
|   - Claude decides when to apply                                  |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                      Rule Layer (6)                               |
|   security.md    coding-style.md    testing.md    git-workflow.md|
|   - Always active guidelines                                      |
|   - Loaded to context automatically                               |
|   - Cannot be distributed via plugins                             |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                      Hook Layer (Deterministic)                   |
|   PreToolUse    PostToolUse    PreCompact    SessionStart/End    |
|   - 100% fire rate on matching triggers                           |
|   - Intercept and control tool execution                          |
|   - Node.js scripts via ${CLAUDE_PLUGIN_ROOT}                     |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                      Script Execution Layer                       |
|   utils.js    package-manager.js    session-*.js    evaluate-*.js|
|   - Cross-platform Node.js implementations                        |
|   - stdin/stdout JSON communication                               |
|   - stderr for user-visible messages                              |
+------------------------------------------------------------------+
```

### 9.2 Data Flow Diagram

```
+------------+     +------------+     +------------+
|   User     |     |  Claude    |     |   Tools    |
|  Command   | --> |   Code     | --> |  (Bash,    |
|            |     |   CLI      |     |  Read...)  |
+------------+     +------------+     +------------+
                        |                   |
                        v                   v
               +------------------+  +------------------+
               |  PreToolUse     |  |  PostToolUse     |
               |  Hooks          |  |  Hooks           |
               +------------------+  +------------------+
                        |                   |
                        v                   v
               +------------------+  +------------------+
               |  Hook Scripts   |  |  Hook Scripts    |
               |  (Node.js)      |  |  (Node.js)       |
               +------------------+  +------------------+
                        |                   |
                        v                   v
               +----------------------------------------+
               |           Session State                |
               |  ~/.claude/sessions/YYYY-MM-DD-*.tmp  |
               +----------------------------------------+
                        |
                        v
               +----------------------------------------+
               |        Learned Skills                  |
               |  ~/.claude/skills/learned/*.md        |
               +----------------------------------------+
```

### 9.3 Hook Event Flow

```
Tool Invocation
      |
      v
+---------------------+
| PreToolUse Hooks    |
| - Block dev server  |
| - tmux reminder     |
| - git push review   |
| - Block .md files   |
| - Suggest compact   |
+---------------------+
      |
      | exit 0 = continue
      | exit 1 = block
      v
+---------------------+
| Tool Execution      |
| (Bash, Read, Write) |
+---------------------+
      |
      v
+---------------------+
| PostToolUse Hooks   |
| - PR URL logging    |
| - Async build       |
| - Auto format       |
| - TypeScript check  |
| - console.log warn  |
+---------------------+
      |
      v
Response to Claude
```

---

## 10. Conclusion

The everything-claude-code project implements a sophisticated 5-layer plugin architecture:

1. **Deterministic Layer (Hooks)**: Guarantees execution on tool calls
2. **Constraint Layer (Rules)**: Enforces guidelines always
3. **Knowledge Layer (Skills)**: Provides domain expertise probabilistically
4. **Execution Layer (Agents)**: Handles specialized tasks with limited tools
5. **Interface Layer (Commands)**: Exposes user-facing entry points

Key learning priorities for backend understanding:

- Master the hook system first (100% deterministic)
- Understand script utilities for cross-platform patterns
- Learn component formats (YAML frontmatter conventions)
- Trace complete workflows from command to tool execution

The recommended 7-day learning path follows the layer hierarchy, with clear verification checkpoints at each phase transition.
