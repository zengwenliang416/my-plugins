# Coding Conventions

## 1. Core Summary

This project uses a plugin-based architecture for Claude Code workflows. All code follows kebab-case naming, ES module TypeScript, and strict shell scripting standards.

## 2. File Naming Conventions

| Type          | Convention                        | Example                             |
| ------------- | --------------------------------- | ----------------------------------- |
| Directories   | `kebab-case`                      | `change-analyzer/`, `ui-design/`    |
| Markdown      | `kebab-case.md` or `UPPERCASE.md` | `SKILL.md`, `coding-conventions.md` |
| TypeScript    | `kebab-case.ts`                   | `analyze-changes.ts`                |
| Shell scripts | `kebab-case.sh`                   | `killshell-guard.sh`                |
| Templates     | `*.template.{md,json,sh,diff}`    | `commit-message.template.md`        |
| Config        | `kebab-case.json`                 | `plugin.json`, `hooks.json`         |

## 3. Directory Structure

### Plugin Layout

```
plugins/{plugin-name}/
  .claude-plugin/
    plugin.json          # Required: name, description, version
    hooks.json           # Optional: hook definitions
  commands/              # Slash command definitions (*.md)
  skills/                # Skill modules
    {skill-name}/
      SKILL.md           # Required: skill definition
      assets/            # Templates, schemas
      references/        # Knowledge files
      scripts/           # Executable scripts
  agents/                # Agent definitions (optional)
  docs/                  # Plugin documentation (optional)
```

### Runtime Directories

- `.claude/{workflow}/runs/{timestamp}/` - Workflow execution artifacts
- `llmdoc/` - LLM documentation (overview, guides, architecture, reference)

## 4. Markdown File Conventions

### SKILL.md Frontmatter

```yaml
---
name: skill-name
description: |
  Trigger: When to use this skill
  Output: What it produces
  Ask: What to ask if missing
allowed-tools: [Read, Write, Bash, ...]
arguments:
  - name: arg_name
    type: string
    required: true
    description: Brief description
---
```

### Command Frontmatter

```yaml
---
description: "Brief workflow description"
argument-hint: "[args] [--flag=value]"
allowed-tools: [Skill, Read, Write, ...]
---
```

### Content Structure

- Use tables for structured data (input/output, mappings, conditions)
- Use code blocks with language hints
- Mark required steps with "Required" or warning icons
- Use "Hard Stop" for user confirmation points

## 5. Shell Script Conventions

### Header Template

```bash
#!/bin/bash
# =============================================================================
# script-name.sh - Brief Description
# =============================================================================
# Purpose: What this script does
# Trigger: When it runs (e.g., PreToolUse)
# Priority: P1/P2/P3
# =============================================================================

set -euo pipefail
```

### Logging Functions

```bash
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[SCRIPT-NAME]${NC} $1" >&2; }
log_warn() { echo -e "${YELLOW}[SCRIPT-NAME]${NC} $1" >&2; }
log_error() { echo -e "${RED}[SCRIPT-NAME]${NC} $1" >&2; }
```

### Input Handling

```bash
input=$(cat)  # Read from stdin
value=$(echo "$input" | jq -r '.field // empty')
```

### Output Format

```bash
echo '{"decision": "allow|block", "reason": "..."}'
```

## 6. TypeScript Conventions

### Module Style

- Use ES modules: `import * as fs from "fs"`
- Use `#!/usr/bin/env npx ts-node --esm` shebang
- Export types and functions explicitly

### Type Definitions

```typescript
interface InputType {
  field: string;
  optional?: number;
}

interface OutputType {
  timestamp: string;
  result: "success" | "failure";
}
```

### CLI Entry Pattern

```typescript
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  // CLI logic
}

export { mainFunction };
export type { OutputType };
```

### Package Configuration

```json
{
  "type": "module",
  "scripts": { "run": "tsx script.ts" },
  "devDependencies": { "tsx": "^4.x", "@types/node": "^20.x" }
}
```

## 7. Documentation Standards

### Comment Policy

- No redundant comments; code should be self-explanatory
- Document only non-obvious behavior or edge cases
- Use JSDoc only for exported public APIs

### Variable Naming

| Scope      | Style                                  | Example                |
| ---------- | -------------------------------------- | ---------------------- |
| Local vars | `snake_case` (shell), `camelCase` (TS) | `run_dir`, `fileCount` |
| Constants  | `UPPER_SNAKE_CASE`                     | `TASK_REGISTRY`        |
| Interfaces | `PascalCase`                           | `AnalysisResult`       |
| Files/dirs | `kebab-case`                           | `change-analyzer`      |

## 8. Source of Truth

- **Plugin config:** `plugins/*/.claude-plugin/plugin.json`
- **SKILL format:** `plugins/*/skills/*/SKILL.md`
- **Shell patterns:** `plugins/hooks/scripts/**/*.sh`
- **TypeScript patterns:** `plugins/*/skills/*/scripts/*.ts`
