# Commit Plugin

<!-- Machine-readable metadata for unified-eval.sh -->
<available-skills>

| Skill     | Trigger                                                 | Description                                     |
| --------- | ------------------------------------------------------- | ----------------------------------------------- |
| `/commit` | "commit", "提交", "save changes", "wrap up", "保存变更" | Commit workflow with parallel semantic analysis |

</available-skills>

## Overview

Structured commit workflow: investigate changes → parallel analysis → synthesize → branch → message → commit.

Features:

- **Parallel analysis**: Runs semantic and symbol analysis simultaneously for speed and accuracy
- **Smart branching**: Auto-creates feature/fix/chore branches
- **Conventional Commits**: Auto-generates standardized commit messages
- **Changelog**: Auto-updates CHANGELOG.md

## Quick Start

```bash
# Basic commit
/commit

# Skip git hooks
/commit --no-verify

# Amend last commit
/commit --amend

# Specify type and scope
/commit --type feat --scope auth

# Skip CHANGELOG
/commit --no-changelog

# Use current branch (no new branch)
/commit --skip-branch
```

## Workflow Phases

```
1   Initialize      → mkdir RUN_DIR
2   Investigate     → Task("change-investigator")    ─┐
3   Parallel Analyze                                   │
    ├─ Task("semantic-analyzer", run_in_background)    │ PARALLEL
    └─ Task("symbol-analyzer", run_in_background)     ─┤
4   Synthesize      → Skill("analysis-synthesizer")  ─┘
5   Branch          → Skill("branch-creator")
6   Confirm         → AskUserQuestion ⏸️ HARD STOP
7   Message         → Skill("message-generator")
8   Changelog       → Skill("changelog-generator")
9   Execute         → Task("commit-worker")
10  Deliver         → Summary + Next action ⏸️ HARD STOP
```

## Key Artifacts

Run directory: `openspec/changes/${CHANGE_ID}/`

| Artifact                   | Description              |
| -------------------------- | ------------------------ |
| `changes-raw.json`         | Raw change data          |
| `investigation-summary.md` | Investigation summary    |
| `semantic-analysis.json`   | Semantic analysis result |
| `symbol-analysis.json`     | Symbol analysis result   |
| `changes-analysis.json`    | Synthesized analysis     |
| `branch-info.json`         | Branch information       |
| `commit-message.md`        | Generated commit message |
| `changelog-entry.md`       | CHANGELOG entry          |

## Commit Types

| Type     | Emoji | Description   |
| -------- | ----- | ------------- |
| feat     | ✨    | New feature   |
| fix      | 🐛    | Bug fix       |
| docs     | 📝    | Documentation |
| style    | 💄    | Code style    |
| refactor | ♻️    | Refactoring   |
| perf     | ⚡    | Performance   |
| test     | ✅    | Tests         |
| build    | 📦    | Build system  |
| ci       | 👷    | CI/CD         |
| chore    | 🔧    | Chores        |
| revert   | ⏪    | Revert commit |

## Agent Types

| Agent               | Purpose                                  |
| ------------------- | ---------------------------------------- |
| change-investigator | Quickly investigate git changes          |
| semantic-analyzer   | Semantic analysis (intent understanding) |
| symbol-analyzer     | Symbol analysis (LSP precise location)   |
| commit-worker       | Execute git commit operations            |

---

## Recommended CLAUDE.md Configuration

Copy the following to your project's `.claude/CLAUDE.md`:

```markdown
<system-reminder>

## Commit Workflow Rules

<commit-rules>

### Automatic Workflow

- For commit operations, prefer `/commit` skill which uses parallel analysis
- The workflow automatically handles: change collection → parallel semantic/symbol analysis → branch creation → message generation → commit execution
- Hard stops only at Phase 6 (confirm) and Phase 10 (deliver)

### Conventional Commits

- Format: `type(scope): emoji title`
- Always use emojis from the type table
- Keep title under 50 characters
- Body explains "why" not "what"

</commit-rules>

</system-reminder>
```
