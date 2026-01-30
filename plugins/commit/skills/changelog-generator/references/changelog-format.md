# Changelog Format Reference

Based on the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) specification.

---

## 1. File structure

### 1.1 Basic structure

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-01-15

### Added
- Feature A
- Feature B

### Fixed
- Bug fix C

## [1.0.0] - 2026-01-01

### Added
- Initial release

[Unreleased]: https://github.com/user/repo/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/user/repo/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/user/repo/releases/tag/v1.0.0
```

---

## 2. Change types

### 2.1 Type definitions (in priority order)

| Type | Description | Conventional Commit mapping |
|------|-------------|-----------------------------|
| `Changed` | Changes to existing functionality | `refactor`, `perf`, `style` |
| `Added` | New features | `feat` |
| `Deprecated` | Features to be removed | - |
| `Removed` | Removed features | `feat` (removal) |
| `Fixed` | Bug fixes | `fix` |
| `Security` | Security fixes | `fix` (security) |

### 2.2 Type mapping

| Conventional Commit | Changelog Type |
|---------------------|----------------|
| `feat` | `Added` |
| `fix` | `Fixed` |
| `fix` (security) | `Security` |
| `refactor` | `Changed` |
| `perf` | `Changed` |
| `style` | `Changed` |
| `docs` | - (usually not recorded) |
| `test` | - (usually not recorded) |
| `ci` | - (usually not recorded) |
| `chore` | - (usually not recorded) |
| `revert` | `Removed` |
| `BREAKING CHANGE` | `Changed` (with prefix) |

---

## 3. Entry format

### 3.1 Basic format

```markdown
- Add user authentication with JWT tokens
```

### 3.2 With references

```markdown
- Add user authentication with JWT tokens ([#123](link))
```

### 3.3 Breaking changes

```markdown
- **Breaking:** Change API response format from snake_case to camelCase
```

### 3.4 Imperative verbs

| Type | Recommended verbs |
|------|------------------|
| Added | Add, Introduce, Implement |
| Changed | Change, Update, Refactor, Improve, Optimize |
| Deprecated | Deprecate, Mark as deprecated |
| Removed | Remove, Delete, Drop |
| Fixed | Fix, Resolve, Correct |
| Security | Fix security issue, Patch vulnerability |

---

## 4. Versioning

### 4.1 Semantic Versioning

```
MAJOR.MINOR.PATCH

MAJOR: incompatible API changes
MINOR: backward-compatible feature additions
PATCH: backward-compatible bug fixes
```

### 4.2 Date format

```
YYYY-MM-DD (ISO 8601)

Correct: 2026-01-15
Wrong: 01/15/2026, Jan 15 2026
```

---

## 5. Version links

### 5.1 GitHub format

```markdown
[Unreleased]: https://github.com/user/repo/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/user/repo/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/user/repo/releases/tag/v1.0.0
```

### 5.2 GitLab format

```markdown
[Unreleased]: https://gitlab.com/user/repo/-/compare/v1.1.0...HEAD
[1.1.0]: https://gitlab.com/user/repo/-/compare/v1.0.0...v1.1.0
[1.0.0]: https://gitlab.com/user/repo/-/releases/v1.0.0
```

---

## 6. Update process

### 6.1 Add to Unreleased

```markdown
## [Unreleased]

### Added

- Add new feature X  <!-- new entry -->

### Fixed

- Fix existing bug Y
```

### 6.2 Release a new version

**Before:**
```markdown
## [Unreleased]

### Added
- Add feature X

## [1.0.0] - 2026-01-01
```

**After:**
```markdown
## [Unreleased]

## [1.1.0] - 2026-01-15

### Added
- Add feature X

## [1.0.0] - 2026-01-01
```

---

## 7. Batch mode

### 7.1 Multiple commits summary

When a single changelog update includes multiple commits:

```markdown
### Added

- Add Todo type definitions (types)
- Add localStorage persistence utilities (storage)
- Add Todo state management hooks (hooks)
- Add Todo UI components (components)
- Add app entry and main interface (app)
```

### 7.2 Group by scope

```markdown
### Added

**Core:**
- Add authentication service
- Add token management

**UI:**
- Add login form component
- Add dashboard layout
```

---

## 8. Best practices

### 8.1 Should record

- User-visible changes
- API changes (add/modify/remove)
- Configuration changes
- Important performance improvements
- Security fixes

### 8.2 Should not record

- Internal refactors (unless they affect API)
- Code formatting
- Test changes
- CI/CD changes
- Dependency updates (unless security-related)

### 8.3 Writing guidelines

- Use imperative mood
- Write for users, not developers
- Be concise but complete
- Put important changes first
- Breaking changes must be highlighted
