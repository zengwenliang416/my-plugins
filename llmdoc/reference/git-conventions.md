# Git Conventions

## 1. Core Summary

All commits follow the format `type(scope): emoji description` with Chinese descriptions. Branch names follow `<type>/<scope>-<description>` pattern. Emojis are mandatory and mapped to specific commit types.

## 2. Commit Message Format

**Pattern:** `type(scope): emoji description`

**Example:** `feat(components): ✨ 新增 Button 组件`

**Breaking Change:** `feat(api)!: ✨ breaking change`

**Constraints:**

- Title must be ≤72 characters
- Description must be in Chinese
- Emoji is mandatory

## 3. Type-Emoji Mappings

| Type     | Emoji | Description       |
| -------- | ----- | ----------------- |
| feat     | ✨    | New feature       |
| fix      | 🐛    | Bug fix           |
| docs     | 📝    | Documentation     |
| style    | 💄    | Code style/format |
| refactor | ♻️    | Code refactoring  |
| perf     | ⚡    | Performance       |
| test     | ✅    | Tests             |
| build    | 📦    | Build system      |
| ci       | 👷    | CI configuration  |
| chore    | 🔧    | Maintenance tasks |
| revert   | ⏪    | Revert changes    |

## 4. Branch Naming Convention

**Pattern:** `<type>/<scope>-<description>`

**Examples:**

- `feat/auth-add-login`
- `fix/button-style-issue`
- `docs/readme-update-guide`

**Rules:**

- Lowercase only
- Use hyphens as separators
- Maximum 50 characters
- Alphanumeric characters only

## 5. Source of Truth

- **Commit Format:** `plugins/commit/skills/message-generator/SKILL.md`
- **Branch Naming:** `plugins/commit/skills/branch-creator/SKILL.md`
