# Conventional Commits Reference

Conventional Commits 1.0.0 specification and emoji mapping.

---

## 1. Format

### 1.1 Commit message structure

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 1.2 Title line rules

- **Length**: ≤72 characters (recommended ≤50)
- **Case**: lowercase first letter
- **Punctuation**: no trailing period
- **Mood**: imperative (Add, Fix, Update)

---

## 2. Types

### 2.1 Standard types

| Type | Description | SemVer impact |
|------|-------------|---------------|
| `feat` | New feature | MINOR |
| `fix` | Bug fix | PATCH |
| `docs` | Documentation | - |
| `style` | Code style (no logic change) | - |
| `refactor` | Refactoring (non feat/fix) | - |
| `perf` | Performance | PATCH |
| `test` | Tests | - |
| `build` | Build system/deps | - |
| `ci` | CI/CD config | - |
| `chore` | Miscellaneous | - |
| `revert` | Revert commit | - |

### 2.2 Breaking Changes

**Marking methods**:

```
feat!: add new API (breaking)
feat(api)!: change response format

# Or in footer
feat: add new API

BREAKING CHANGE: API response format changed
```

**SemVer impact**: MAJOR

---

## 3. Emoji Mapping

### 3.1 Type emoji

| Type | Emoji | Unicode |
|------|-------|---------|
| `feat` | ✨ | `:sparkles:` |
| `fix` | 🐛 | `:bug:` |
| `docs` | 📝 | `:memo:` |
| `style` | 💄 | `:lipstick:` |
| `refactor` | ♻️ | `:recycle:` |
| `perf` | ⚡️ | `:zap:` |
| `test` | ✅ | `:white_check_mark:` |
| `build` | 📦 | `:package:` |
| `ci` | 👷 | `:construction_worker:` |
| `chore` | 🔧 | `:wrench:` |
| `revert` | ⏪ | `:rewind:` |

### 3.2 Other common emojis

| Scenario | Emoji | Description |
|----------|-------|-------------|
| Breaking Change | 💥 | `:boom:` |
| Security fix | 🔒 | `:lock:` |
| Hotfix | 🚑 | `:ambulance:` |
| WIP | 🚧 | `:construction:` |
| Initialization | 🎉 | `:tada:` |
| Config file | ⚙️ | `:gear:` |
| Database | 🗃️ | `:card_file_box:` |
| Logging | 🔊 | `:loud_sound:` |
| UI/UX | 🎨 | `:art:` |
| i18n | 🌐 | `:globe_with_meridians:` |

---

## 4. Scope

### 4.1 Common scopes

| Scope | Use case |
|-------|----------|
| `api` | API-related changes |
| `auth` | Authentication/authorization |
| `ui` | User interface |
| `db` | Database |
| `config` | Configuration |
| `deps` | Dependency updates |
| `core` | Core module |

### 4.2 Scope naming rules

- Use kebab-case: `user-auth`
- Keep it short: 1-2 words
- Avoid being too specific: use `api` rather than `api-v2-users-endpoint`

---

## 5. Body

### 5.1 Format requirements

- Blank line between title and body
- Each line ≤72 characters
- Explain "why" not just "what"

### 5.2 Example

```
fix(auth): resolve token refresh race condition

The previous implementation could fail when multiple
requests triggered token refresh simultaneously.

This change introduces a mutex lock to ensure only
one refresh operation runs at a time.
```

---

## 6. Footer

### 6.1 Related issues

```
Closes #123
Fixes #456
Refs #789
```

### 6.2 Breaking Changes

```
BREAKING CHANGE: API response format changed from
snake_case to camelCase. All clients need to update
their parsing logic.
```

### 6.3 Co-authors

```
Co-authored-by: Name <email@example.com>
```

---

## 7. Full Examples

### 7.1 Simple commit

```
feat(auth): add JWT token refresh
```

### 7.2 With body

```
fix(api): handle null response from external service

The external payment service occasionally returns null
instead of an error object. Added null check to prevent
runtime crashes.

Fixes #234
```

### 7.3 Breaking change

```
feat(api)!: change response format to camelCase

Migrate all API responses from snake_case to camelCase
for consistency with frontend conventions.

BREAKING CHANGE: All API response keys are now camelCase.
Clients using snake_case keys need to update.

Closes #567
```
