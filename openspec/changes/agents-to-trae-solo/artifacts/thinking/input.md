# Thinking Input

## Question

Convert `/Users/wenliang_zeng/workspace/open_sources/ccg-workflows/git-repos/cc-plugin/agents` to Trae IDE SOLO Coder intelligent agent document format (as shown in the provided screenshot).

## Target Format (from screenshot)

Trae IDE "Create Agent" form fields:

1. **Name** (required, max 20 chars)
2. **Prompt** (max 10000 chars) - agent's role, tone, workflow, tool preferences, rules
3. **Callable by other agents** (SOLO Only toggle):
   - **English identifier** (required, max 50 chars, e.g., `project-analyzer`)
   - **When to invoke** (required, max 5000 chars) - describe appropriate scenarios
4. **Tools** - MCP tools (exa, banana-image, auggie-mcp, gemini, codex) and built-in tools (Read, Edit, Terminal, Preview, Web search)

## Source Files

- `agents/investigator.md` - rapid codebase analysis
- `agents/recorder.md` - LLM-optimized documentation
- `agents/scout.md` - deep investigation (INTERNAL)
- `agents/worker.md` - task execution

## Existing Conversion Attempt

`agents/solo-coder/` directory contains partial conversion with README.md explaining the mapping.

## Key Constraints

- Name field max 20 characters
- Prompt field max 10000 characters
- When to invoke max 5000 characters
- Tool mapping: Read/Glob/Grep → Read, Write/Edit → Edit, Bash → Terminal, WebSearch/WebFetch → Web search
