# User Clarifications

## OQ-BLOCK-1: Hook Return Semantics

**Decision**: Assume actionable (假设可执行)

- Design hooks as if Claude Code consumes return values (e.g., task assignment, workflow triggers)
- If platform turns out to be observation-only, degrade gracefully to logging+metrics
- Hook scripts should output structured JSON responses with `hookSpecificOutput` containing orchestration directives

## OQ-BLOCK-3: .claude/rules/ Path Collision

**Decision**: Migrate tech-rules (迁移 tech-rules)

- Relocate tech-rules-generator output from `.claude/rules/` to `.claude/memory/rules/`
- `.claude/rules/` is now exclusively owned by Claude Code Auto Memory
- Update tech-rules-generator skill to write to new path
- Update any consumers that read from `.claude/rules/{stack}.md` to read from new location
- Update index.json path reference accordingly

## OQ-DESIGN-2: CLAUDE.md Ownership

**Decision**: Layered coexistence (分层共存)

- **context-memory** retains ownership of structured CLAUDE.md generation (per-module analysis pipeline)
- **Auto Memory** manages agent MEMORY.md files (per-agent persistent learning)
- Neither system writes to the other's domain
- Boundary: CLAUDE.md = curated project instructions; MEMORY.md = learned agent patterns
- Three-layer architecture (Hot/Warm/Cold) remains, with Auto Memory mapped to Hot layer naturally
