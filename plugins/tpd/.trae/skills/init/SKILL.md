---
name: init
description: "OpenSpec Initialization: Detect system → Install openspec → Initialize project → Validate Trae toolchain"
---

# /init - OpenSpec Initialization

## 🚨 Execution Rules

- Must first detect the operating system and adjust commands accordingly
- Proceed to the next step only after each step succeeds
- Do not overwrite existing configuration; ask the user first if necessary
- Provide clear, actionable fix suggestions on failure

---

## Step 1: Detect Operating System

- Use terminal command `uname -s` (Linux/macOS) or environment variables to detect Windows
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

Execute in project root directory via terminal:

```bash
openspec init --tools claude
```

- If `openspec/` already exists: ask whether to overwrite or skip
- Verify directory structure exists: `openspec/project.md`, `openspec/changes/`

---

## Step 4: Validate Trae Toolchain Availability

Check the following runtime capabilities:

1. **Trae native retrieval**
   - `SearchCodebase` can be used in skills/agents
   - `Read`/`Edit` permissions are correctly configured

2. **External model wrappers**
   - `codeagent-wrapper codex --help` can run
   - `codeagent-wrapper gemini --help` can run

If wrapper is unavailable, suggest installation/configuration of `codeagent-wrapper` and login/auth setup.

---

## Step 5: Output Initialization Summary

Output check results:

- OpenSpec installed: ✓ / ✗
- Project initialized: ✓ / ✗
- SearchCodebase available: ✓ / ✗
- Codex wrapper available: ✓ / ✗
- Gemini wrapper available: ✓ / ✗

If there are incomplete items, list concrete next steps.
