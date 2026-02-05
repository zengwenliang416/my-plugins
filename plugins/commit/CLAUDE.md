# Commit Plugin

<!-- Machine-readable metadata for unified-eval.sh -->
<available-skills>

| Skill     | Trigger                                                 | Description                                     |
| --------- | ------------------------------------------------------- | ----------------------------------------------- |
| `/commit` | "commit", "提交", "save changes", "wrap up", "保存变更" | Commit workflow with parallel semantic analysis |

</available-skills>

## Overview

规范提交工作流：调查变更 → 并行分析 → 合成 → 分支 → 消息 → 提交。

特点：

- **并行分析**: 同时运行语义分析和符号分析，更快更准确
- **智能分支**: 自动创建 feature/fix/chore 分支
- **Conventional Commits**: 自动生成规范提交消息
- **Changelog**: 自动更新 CHANGELOG.md

## Quick Start

```bash
# 基本提交
/commit

# 跳过 git hooks
/commit --no-verify

# 修改上次提交
/commit --amend

# 指定类型和范围
/commit --type feat --scope auth

# 跳过 CHANGELOG
/commit --no-changelog

# 使用当前分支（不创建新分支）
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

运行目录: `.claude/committing/runs/${TIMESTAMP}/`

| Artifact                   | Description      |
| -------------------------- | ---------------- |
| `changes-raw.json`         | 原始变更数据     |
| `investigation-summary.md` | 调查摘要         |
| `semantic-analysis.json`   | 语义分析结果     |
| `symbol-analysis.json`     | 符号分析结果     |
| `changes-analysis.json`    | 合成后的分析结果 |
| `branch-info.json`         | 分支信息         |
| `commit-message.md`        | 生成的提交消息   |
| `changelog-entry.md`       | CHANGELOG 条目   |

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

| Agent               | Purpose                  |
| ------------------- | ------------------------ |
| change-investigator | 快速调查 git 变更        |
| semantic-analyzer   | 语义分析（意图理解）     |
| symbol-analyzer     | 符号分析（LSP 精确定位） |
| commit-worker       | 执行 git commit 操作     |

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
