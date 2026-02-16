---
description: "Initialize OpenSpec environment and validate required tooling for TPD workflow"
argument-hint: "[--skip-install]"
allowed-tools:
  - Bash
  - AskUserQuestion
  - Read
  - Write
---

# /tpd:init

## Purpose
Prepare the local environment for TPD workflows.

## Steps

### Step 1: Detect Platform
1. Detect OS with `uname -s` (or PowerShell-compatible check on Windows).
2. Select platform-specific command syntax.

### Step 2: Ensure OpenSpec CLI
1. Check installation with `openspec --version`.
2. If missing and `--skip-install` is not set, install:
   ```bash
   npm install -g @fission-ai/openspec@latest
   ```
3. Verify installation again.

### Step 3: Initialize Project
1. Run in project root:
   ```bash
   openspec init --tools claude
   ```
2. If `openspec/` already exists, ask user whether to overwrite or keep existing.
3. Verify minimum structure: `openspec/project.md` and `openspec/changes/`.

### Step 4: Validate Required MCP Tools
Check availability of:
- `mcp__codex__codex`
- `mcp__gemini__gemini`

If unavailable, provide installation guidance and continue with partial readiness report.

### Step 5: Print Summary
Report:
- OpenSpec CLI status
- OpenSpec project initialization status
- Codex MCP status
- Gemini MCP status
- Next actions for incomplete items
