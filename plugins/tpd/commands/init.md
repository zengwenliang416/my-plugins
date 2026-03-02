---
description: "Initialize OpenSpec environment and validate TPD prerequisites"
argument-hint: ""
allowed-tools:
  - Bash
  - AskUserQuestion
  - Read
  - Write
---

# /tpd:init

## Purpose

Prepare OpenSpec baseline and report environment readiness.

## Parameter Policy

- No parameter is required.
- Installation behavior is decided interactively when prerequisites are missing.

## Steps

### Step 1: Runtime Check

1. Check `node`, `npm`, and `openspec --version`.
2. If OpenSpec missing, ask user whether to install.

### Step 2: OpenSpec Project Check

1. If `openspec/` does not exist, run:
   ```bash
   openspec init --tools claude
   ```
2. If `openspec/` exists: **HARD STOP** and ask whether to keep or reinitialize.

### Step 3: MCP Readiness

1. Check availability of:
   - `mcp__codex__codex`
   - `mcp__gemini__gemini`
2. Missing MCP should be reported with action hints (do not abort all checks).

### Step 4: Summary

Output a compact readiness report:

- OpenSpec status
- Project structure status
- Codex MCP status
- Gemini MCP status
- Next actions

## Verification

- Report includes all status fields above.
- Hard stop is enforced before overwriting existing OpenSpec data.
