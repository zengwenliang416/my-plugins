---
generated_at: 2026-02-01T00:00:00Z
synthesizer_version: "1.0"
boundaries_integrated:
  ["core-config", "agent-system", "skill-knowledge", "automation-infra"]
models_used: ["codex", "gemini"]
depth: deep
---

# Constraint Synthesis Report

## Synthesis Overview

- **Participating Boundaries**: core-config, agent-system, skill-knowledge, automation-infra
- **Thinking Depth**: deep
- **Synthesis Method**: Structured constraint synthesis with multi-model supplementation

## Constraint Set

### Hard Constraints

| ID  | Constraint                              | Source                                  | Impact                                               |
| --- | --------------------------------------- | --------------------------------------- | ---------------------------------------------------- |
| H1  | NO hooks field in plugin.json           | All 4 boundaries, Issues #29, #52, #103 | Causes duplicate detection error in v2.1+            |
| H2  | Minimum Claude Code CLI v2.1.0          | core-config, agent-system               | Hooks auto-loading behavior requires this version    |
| H3  | YAML frontmatter required               | All boundaries                          | Agents, Skills, Commands must have valid frontmatter |
| H4  | Agents limited to declared tools        | agent-system                            | Agents can ONLY use tools in their `tools` array     |
| H5  | Rules cannot be distributed via plugins | core-config, skill-knowledge            | Upstream limitation - must copy manually             |
| H6  | ${CLAUDE_PLUGIN_ROOT} for hook paths    | automation-infra                        | Required environment variable for script paths       |
| H7  | Node.js for all hook scripts            | automation-infra                        | Cross-platform compatibility requirement             |
| H8  | Exit codes: 0=continue, 1=block         | automation-infra                        | Hook behavior control mechanism                      |

### Soft Constraints

| ID  | Constraint                    | Recommendation                   | Flexibility                                 |
| --- | ----------------------------- | -------------------------------- | ------------------------------------------- |
| S1  | MCP count limit               | <10 MCPs per project, <80 tools  | Performance degradation but no hard failure |
| S2  | Test coverage                 | 80%+ for TDD workflow            | Not enforced by system                      |
| S3  | Iterative retrieval cycles    | Max 3 cycles                     | Recommendation for efficiency               |
| S4  | Context window reserve        | Avoid last 20% for complex tasks | Performance optimization                    |
| S5  | Instinct confidence threshold | 0.7+ for auto-approval           | Configurable                                |
| S6  | Hook timeout                  | 3-30 seconds typical             | Adjustable per hook                         |

## Dependencies & Risks

### Dependencies

| Dependency                           | Required         | Purpose                           | Source                        |
| ------------------------------------ | ---------------- | --------------------------------- | ----------------------------- |
| Claude Code CLI v2.1.0+              | Yes              | Plugin system, hooks auto-loading | All boundaries                |
| Node.js                              | Yes              | All hook scripts and utilities    | core-config, automation-infra |
| Git CLI                              | Optional         | skill-create from history         | agent-system                  |
| Prettier                             | Optional         | Auto-format hook                  | skill-knowledge               |
| TypeScript/tsc                       | Optional         | Type checking hook                | skill-knowledge               |
| Package managers (npm/pnpm/yarn/bun) | Auto-detected    | Build/test commands               | automation-infra              |
| External CLI tools                   | Agent-specific   | npm, go, playwright, knip, etc.   | agent-system                  |
| **External Guides**                  | **Learning req** | Shorthand + Longform guides       | gemini-thought                |

### Risks

**High Risk:**

1. **Hooks duplicate detection** - 3 documented regression cycles (#29, #52, #103)
2. **Context window exhaustion** - 200k shrinks to 70k with too many MCPs
3. **Version compatibility drift** - Behavior changes between Claude Code versions

**Medium Risk:** 4. Cross-platform script issues - OS-specific edge cases possible 5. Package manager detection complexity - 6-level fallback cascade 6. Hook timeout sensitivity - 30s max may be insufficient 7. Tool availability assumptions - Agents may fail if CLIs not installed 8. Skill firing probabilistic - 50-80% vs hooks 100%

**Low Risk:** 9. Session file collisions with concurrent sessions 10. Large agent files impacting context (>500 lines)

## Success Criteria (Hints)

### Phase 1 - Foundation Understanding

- [ ] Read and understand README.md project structure
- [ ] Understand plugin.json manifest structure
- [ ] Grasp component hierarchy: rules → skills → agents → commands → hooks
- [ ] Read external Shorthand Guide ("Read this first")

### Phase 2 - Core Concepts Mastery

- [ ] Examine agents/planner.md as agent template
- [ ] Understand YAML frontmatter format (name, description, tools, model)
- [ ] Examine skills/tdd-workflow/SKILL.md as skill template
- [ ] Understand hook mechanics via hooks/hooks.json
- [ ] Know WHY hooks field must NOT be in plugin.json

### Phase 3 - Integration Patterns

- [ ] Trace SessionStart → SessionEnd hook lifecycle
- [ ] Examine scripts/hooks/session-start.js implementation
- [ ] Understand scripts/lib/utils.js utilities
- [ ] Understand tool restrictions per agent

### Phase 4 - Practical Usage

- [ ] Install plugin via marketplace
- [ ] Verify slash commands registered
- [ ] Configure package manager
- [ ] Test suite passes: `node tests/run-all.js`

### Phase 5 - Advanced (Optional)

- [ ] Understand continuous-learning-v2 instinct system
- [ ] Explore iterative-retrieval pattern
- [ ] Learn MCP configuration

## Open Questions

**High Priority:**

1. How is the external Shorthand Guide accessed? (Twitter thread URL)
2. How do SubagentStop/SubagentStart events work?
3. What triggers agent invocation - command, orchestrator, or manual?
4. How does inter-agent delegation work without Task tool in agents?

**Medium Priority:** 5. Formal JSON schema for plugin.json? 6. Exact version compatibility matrix? 7. How are plugin updates propagated via marketplace? 8. How do inherited instincts interact with personal ones?

**Documentation Gaps:**

- No quickstart for complete beginners
- No visual architecture diagram
- No glossary of key terms
- No troubleshooting guide

## Multi-Model Supplements

### Codex Supplement

- Recommended learning path: Foundation → Core → Integration → Advanced
- Prerequisites: Claude Code basics, Markdown+YAML, Node.js, JSON Schema
- 3 regression cycles documented for hooks issue (#29, #52, #103)
- File format templates provided for agents, skills, commands

### Gemini Supplement

- Component hierarchy critical: rules(passive) → skills(knowledge) → agents(delegation) → commands(triggers) → hooks(automation)
- Skills are "probabilistic" (~50-80%), hooks are "deterministic" (100%)
- 5 common pitfalls identified for beginners
- Beginner trade-off: start with rules + commands only

## Boundary Contributions

| Boundary         | Key Findings                                       | Key Constraints                                |
| ---------------- | -------------------------------------------------- | ---------------------------------------------- |
| core-config      | Plugin manifest structure, marketplace integration | No hooks in plugin.json, v2.1+ required        |
| agent-system     | 12 agents, frontmatter format, tool restrictions   | Agents limited to declared tools, no Task tool |
| skill-knowledge  | 12+ skills, commands, rules, contexts              | 80% coverage, rules need manual copy           |
| automation-infra | 7 hook events, cross-platform scripts, tests       | Node.js required, exit codes control           |

## Confidence Assessment

| Area                  | Confidence | Notes                                  |
| --------------------- | ---------- | -------------------------------------- |
| Hard Constraints      | High       | Well-documented in README and issues   |
| File Formats          | High       | Multiple examples available            |
| Hook System           | High       | Comprehensive hooks.json with comments |
| Learning Path         | Medium     | Based on analysis, not user testing    |
| External Guides       | Medium     | Content not directly accessible        |
| Version Compatibility | Medium     | Only v2.1+ tested                      |

**Overall Confidence**: Medium-High
