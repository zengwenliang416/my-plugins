# Git Conventions

## 1. Core Summary

This project uses **Conventional Commits** with emoji prefixes. Commits follow the pattern `type(scope): emoji message`. The main branch is `main`, with feature branches named `feat/*` or `docs/*`.

## 2. Branch Strategy

| Branch Type | Pattern               | Purpose               |
| ----------- | --------------------- | --------------------- |
| Main        | `main`                | Production-ready code |
| Feature     | `feat/<feature-name>` | New features          |
| Docs        | `docs/<topic>`        | Documentation updates |

## 3. Commit Message Format

```
type(scope): emoji message
```

- **type**: Category of change (see below)
- **scope**: Plugin or module name (e.g., `commit`, `brainstorm`, `scripts`)
- **emoji**: Visual indicator matching the type
- **message**: Concise description in lowercase

## 4. Commit Types and Emojis

| Type       | Emoji | Usage                        |
| ---------- | ----- | ---------------------------- |
| `feat`     | ✨    | New features or capabilities |
| `fix`      | 🐛    | Bug fixes                    |
| `docs`     | 📝    | Documentation changes        |
| `refactor` | ♻️    | Code refactoring             |
| `style`    | 💄    | Formatting, styling          |
| `test`     | ✅    | Adding or updating tests     |
| `chore`    | 🔧    | Maintenance tasks            |

## 5. Source of Truth

- **Commit History:** `git log --oneline -30` - View recent commits to match style
- **Branch List:** `git branch -a` - Check existing branch patterns

## 6. Real Examples

```
feat(commit): ✨ upgrade workflow to v2.0 with parallel analysis
docs(commit): 📝 add CLAUDE.md example for skill integration
feat(grok-search): ✨ 新增 grok-search 搜索技能
fix(hooks): 🐛 移除通知钩子的 async 属性
feat(scripts): ✨ sync-plugins 新增交互选择和 dry-run 模式
```
