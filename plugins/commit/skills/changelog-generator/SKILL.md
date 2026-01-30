---
name: changelog-generator
description: |
  【Trigger】Commit workflow Phase 5.5: update CHANGELOG.md.
  【Output】Updated CHANGELOG.md + ${run_dir}/changelog-entry.md
  【🚨 Mandatory】Must run unless --no-changelog.
allowed-tools: [Read, Write, Bash, mcp__sequential-thinking__sequentialthinking]
arguments:
  - name: run_dir
    type: string
    required: true
    description: Runtime directory (contains changes-analysis.json, commit-message.md)
  - name: version
    type: string
    required: false
    description: Version number (omit for Unreleased)
  - name: commits
    type: string
    required: false
    description: "Batch mode: JSON array of commits"
---

# Changelog Generator

## 🚨 Mandatory Rules

| ❌ Forbidden              | ✅ Required                    |
| ------------------------- | ------------------------------ |
| Skip this skill           | Create CHANGELOG.md if missing |
| Forget changelog-entry.md | Add entries under [Unreleased] |

## Input/Output

| Item   | Value                                                    |
| ------ | -------------------------------------------------------- |
| Input  | `${run_dir}/changes-analysis.json` + `commit-message.md` |
| Output | `CHANGELOG.md` + `${run_dir}/changelog-entry.md`         |

## Type Mapping

| Commit Type                    | Changelog Type                 |
| ------------------------------ | ------------------------------ |
| feat                           | Added                          |
| fix                            | Fixed                          |
| docs/style/refactor/perf/build | Changed                        |
| revert                         | Removed                        |
| test/ci/chore                  | (not recorded)                 |
| BREAKING                       | Changed (**Breaking:** prefix) |

## Execution

### 1. Determine mode

- `commits` param exists → Batch mode
- Otherwise → Single mode (read from run_dir)

### 2. Check CHANGELOG.md

If missing, create:

```markdown
# Changelog

All notable changes documented here.

Based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]
```

### 3. Generate entries

Format: `- Description (scope)`

**Single:**

```markdown
### Added

- Add Button component with multiple styles
```

**Batch:**

```markdown
### Added

- Add Todo types (types)
- Add state hooks (hooks)

### Fixed

- Fix auth failure (api)
```

### 4. Update CHANGELOG.md

Insert under `## [Unreleased]` or create version `## [X.Y.Z] - YYYY-MM-DD`

### 5. Write changelog-entry.md

```markdown
# Changelog Entry

Type: Added
Content: - Add Button component
Target: [Unreleased]
```

## Return

```
📋 Changelog updated
Type: ${type} | Target: ${section}
Output: CHANGELOG.md, ${run_dir}/changelog-entry.md
```
