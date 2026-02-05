# How to Use the Commit Workflow

## Basic Usage

1. **Stage your changes:** `git add <files>` (or let the workflow handle unstaged changes).
2. **Run the command:** `/commit`
3. **Wait for analysis:** Phases 1-5 execute automatically without interruption.
4. **Confirm at Phase 6:** Review type, scope, files, and complexity. Choose: accept / customize / cancel / split.
5. **Review message at Phase 7:** Auto-generated commit message presented for confirmation.
6. **Receive summary at Phase 10:** Get commit hash, branch info, and next action options.

## Command Options

| Flag              | Description               | Example                            |
| ----------------- | ------------------------- | ---------------------------------- |
| `--scope <name>`  | Override inferred scope   | `/commit --scope auth`             |
| `--type <type>`   | Force commit type         | `/commit --type fix`               |
| `--no-changelog`  | Skip CHANGELOG.md update  | `/commit --no-changelog`           |
| `--no-verify`     | Skip git pre-commit hooks | `/commit --no-verify`              |
| `--amend`         | Amend the previous commit | `/commit --amend`                  |
| `--skip-branch`   | Stay on current branch    | `/commit --skip-branch`            |
| `--branch <name>` | Custom branch name        | `/commit --branch feat/my-feature` |

## Hard Stop Points

The workflow pauses only at two phases for user input:

- **Phase 6 (Confirm):** Review analysis results and choose action.
- **Phase 10 (Deliver):** Review summary and select next action (push, PR, etc.).

All other phases (1-5, 7-9) execute automatically without interruption.

## Split Commit Handling

When the analysis detects changes should be split (2+ scopes, >10 files, mixed types):

1. **Choose "split"** at Phase 6 confirmation.
2. **Review split plan:** Each sub-commit with type, scope, and file list.
3. **Execution:** Workflow performs `git reset HEAD`, then stages and commits each group.
4. **Result:** Multiple atomic commits instead of one large commit.

## Commit Message Format

Format: `type(scope): emoji description`

| Type     | Emoji | Type   | Emoji |
| -------- | ----- | ------ | ----- |
| feat     | ✨    | test   | ✅    |
| fix      | 🐛    | build  | 📦    |
| docs     | 📝    | ci     | 👷    |
| style    | 💄    | chore  | 🔧    |
| refactor | ♻️    | revert | ⏪    |
| perf     | ⚡    |        |       |

## Error Recovery

| Error                  | Solution                                  |
| ---------------------- | ----------------------------------------- |
| No staged files        | Workflow suggests `git add`               |
| Pre-commit hook failed | Fix issues or use `--no-verify`           |
| Branch conflict        | Choose: switch / rename / delete / cancel |

## Related Documents

- Architecture: `/llmdoc/architecture/commit-workflow.md`
- Source: `plugins/commit/commands/commit.md`
