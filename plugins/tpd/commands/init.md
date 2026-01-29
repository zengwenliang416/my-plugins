---
description: "OpenSpec Initialization: Detect system → Install openspec → Initialize project → Validate MCP tools"
argument-hint: "[--skip-install]"
allowed-tools:
  - Bash
  - AskUserQuestion
  - Read
  - Write
---

# /tpd:init - OpenSpec Initialization

## 🚨 Execution Rules

- Must first detect the operating system and adjust commands accordingly
- Proceed to the next step only after each step succeeds
- Do not overwrite existing configuration; ask the user first if necessary
- Provide clear, actionable fix suggestions on failure

---

## Step 1: Detect Operating System

- Use `uname -s` (Linux/macOS) or environment variables to detect Windows
- Inform the user of the detected system type
- If Windows, use PowerShell syntax for subsequent commands

---

## Step 2: Check and Install OpenSpec

1. Check if already installed:
   - Linux/macOS: `command -v openspec` or `openspec --version`
   - Windows: `where openspec` or `openspec --version`

2. If not installed and `--skip-install` not passed, execute:

```bash
npm install -g @fission-ai/openspec@latest
```

3. After installation, run `openspec --version` again to verify

---

## Step 3: Initialize OpenSpec

Execute in project root directory:

```bash
openspec init --tools claude
```

- If `openspec/` already exists: ask whether to overwrite or skip
- Verify directory structure exists: `openspec/project.md`, `openspec/changes/`

---

## Step 4: Validate MCP Tool Availability

Check if the following MCP tools are available:

- `mcp__codex__codex`
- `mcp__gemini__gemini`

If unavailable, prompt installation sources:

- Codex MCP: https://github.com/GuDaStudio/codexmcp
- Gemini MCP: https://github.com/GuDaStudio/geminimcp

Note: These MCPs will be used in /tpd:plan and /tpd:dev.

---

## Step 5: Output Initialization Summary

Output check results:

- OpenSpec installed: ✓ / ✗
- Project initialized: ✓ / ✗
- Codex MCP: ✓ / ✗
- Gemini MCP: ✓ / ✗

If there are incomplete items, list the next steps.
