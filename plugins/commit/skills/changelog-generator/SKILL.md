---
name: changelog-generator
description: |
  【Trigger】Commit workflow Phase 5.5: must run to update CHANGELOG.md.
  【Core Output】Update CHANGELOG.md at project root with new change entries.
  【Not Triggered】Generate commit message (use message-generator), execute commit (use commit-executor).
  【Ask First】When releasing a version, ask for the version number (if not provided, add to Unreleased).
  【🚨 Mandatory】Must run unless user specifies --no-changelog.
allowed-tools:
  - Read
  - Write
  - Bash
  - mcp__sequential-thinking__sequentialthinking
arguments:
  - name: run_dir
    type: string
    required: true
    description: Runtime directory path (contains changes-analysis.json and commit-message.md)
  - name: version
    type: string
    required: false
    description: Version number (e.g. "1.2.0"); if omitted, add to Unreleased
  - name: commits
    type: string
    required: false
    description: Batch commit mode - JSON list of commits, e.g. '[{"type":"feat","scope":"api","description":"..."}]'
---

# Changelog Generator - Atomic Changelog Update Skill

## MCP Tool Integration

| MCP Tool              | Purpose                                    | Trigger        |
| --------------------- | ------------------------------------------ | -------------- |
| `sequential-thinking` | Structure Changelog update strategy and ensure format compliance | 🚨 Required every run |

## Execution Flow

### Step 0: Structured Changelog Plan (sequential-thinking)

🚨 **You must first use sequential-thinking to plan the Changelog update strategy.**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Plan the Changelog update strategy. Need: 1) determine mode (single/batch) 2) check existing CHANGELOG.md 3) map change types 4) generate entry content 5) update file and write record",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**Thinking steps**:

1. **Mode detection**: check commits parameter to determine single or batch
2. **File check**: check whether CHANGELOG.md exists; create if necessary
3. **Type mapping**: map Conventional Commit types to Changelog types
4. **Entry generation**: generate entries compliant with Keep a Changelog
5. **File update**: update CHANGELOG.md and write changelog-entry.md record

---

## 🚨🚨🚨 Mandatory Rules (Must Not Be Skipped)

**This Skill is required in the commit workflow (Phase 5.5).**

**The following are forbidden:**

- ❌ Skip this Skill (unless user specifies --no-changelog)
- ❌ Do not create CHANGELOG.md (if it does not exist)
- ❌ Do not update CHANGELOG.md (if it exists)
- ❌ Forget to write the changelog-entry.md record

**You must obey:**

- ✅ Read changes-analysis.json and commit-message.md
- ✅ Create CHANGELOG.md if it does not exist
- ✅ Add entries under [Unreleased]
- ✅ Write ${run_dir}/changelog-entry.md

---

## Responsibility Boundaries

- **Input**: `run_dir` (contains `changes-analysis.json`, `commit-message.md`) + `version`
- **Output**: Updated `CHANGELOG.md`
- **Single responsibility**: only update changelog; no analysis, no commit execution

---

## References

Based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Common Changelog](https://common-changelog.org/) best practices.

### Change Type Mapping

| Conventional Commit | Changelog Type                       |
| ------------------- | ------------------------------------ |
| feat                | Added                                |
| fix                 | Fixed                                |
| docs                | Changed                              |
| style               | Changed                              |
| refactor            | Changed                              |
| perf                | Changed                              |
| test                | - (usually not recorded)             |
| build               | Changed                              |
| ci                  | - (usually not recorded)             |
| chore               | - (usually not recorded)             |
| revert              | Removed                              |
| BREAKING CHANGE     | Changed (with **Breaking:** prefix)  |

### Changelog Type Priority

1. **Changed** - functional changes (listed first)
2. **Added** - new features
3. **Deprecated** - features to be removed
4. **Removed** - removed features
5. **Fixed** - bug fixes
6. **Security** - security fixes

---

## Execution Flow

### Step 1: Determine mode

**Check `commits` parameter**:

- If `commits` exists → **Batch mode**: parse commit list from parameter
- If not → **Single mode**: read analysis results from `run_dir`

### Step 1A: Single mode - read analysis results

Read `${run_dir}/changes-analysis.json` and `${run_dir}/commit-message.md`, extract:

- `primary_type` (from analysis)
- `commit_message_title` (from message)
- `files_by_type` (from analysis)

### Step 1B: Batch mode - parse commit list

Parse JSON from `commits` parameter:

```json
[
  { "type": "chore", "scope": "project", "description": "Initialize project scaffold" },
  { "type": "feat", "scope": "types", "description": "Add Todo type definitions" },
  { "type": "feat", "scope": "hooks", "description": "Add state management hook" }
]
```

### Step 2: Check existing CHANGELOG.md

```bash
# Check whether CHANGELOG.md exists at project root
ls CHANGELOG.md 2>/dev/null
```

**If it does not exist**, create initial structure:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
```

### Step 3: Determine change type

Map `primary_type` to Changelog type:

```
feat      → Added
fix       → Fixed
refactor  → Changed
perf      → Changed
docs      → Changed
BREAKING  → Changed (with **Breaking:** prefix)
```

### Step 4: Generate entry content

**Format rules**:

- Use imperative mood (Add, Fix, Update, Remove)
- Each line starts with `- `
- Breaking changes use `**Breaking:**` prefix
- Include references if any: `([#123](link))`

**Single mode example**:

```markdown
### Added

- Add Button component with multiple styles and sizes
```

**Batch mode example** (multiple commits summary):

```markdown
### Added

- Add Todo type definitions (types)
- Add local storage persistence utilities (storage)
- Add Todo state management hooks (hooks)
- Add Todo UI components (components)
- Add app entry and main interface (app)

### Changed

- **Breaking:** Change API response format from snake_case to camelCase

### Fixed

- Fix user authentication failure on expired tokens
```

**Batch mode rules**:

- Group by Changelog type (Added, Changed, Fixed, etc.)
- One line per commit
- Append scope after description: `(scope)`

### Step 5: Update CHANGELOG.md

**Read existing file**, find `## [Unreleased]`, and append new entries under the correct type.

**If a version is specified**:

- Create new version section: `## [X.Y.Z] - YYYY-MM-DD`
- Move Unreleased content into the new version
- Add version links at the bottom

### Step 6: Write results

Use the Write tool to update `CHANGELOG.md`.

Also write `${run_dir}/changelog-entry.md` to record the entries added:

```markdown
# Changelog Entry

## Type

Added

## Content

- Add Button component with multiple styles and sizes

## Target

[Unreleased] / [1.2.0]
```

---

## CHANGELOG.md Structure Guidelines

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Add new feature X

### Changed

- **Breaking:** Change API format

### Fixed

- Fix bug Y

## [1.1.0] - 2026-01-15

### Added

- Add feature A
- Add feature B

### Fixed

- Fix issue C

## [1.0.0] - 2026-01-01

### Added

- Initial release

[Unreleased]: https://github.com/user/repo/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/user/repo/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/user/repo/releases/tag/v1.0.0
```

---

## Return Value

After execution, return:

```
📋 Changelog update completed

Type: ${changelog_type}
Entry: ${entry_content}
Target: ${target_section}

File: CHANGELOG.md
Record: ${run_dir}/changelog-entry.md
```

---

## Constraints

- Do not analyze changes (handled by change-analyzer)
- Do not generate commit messages (handled by message-generator)
- Follow Keep a Changelog
- Date format: YYYY-MM-DD (ISO 8601)
- Use imperative mood for entries
- test/ci/chore types are usually not recorded in changelog
- **🚨 Must run this Skill (unless --no-changelog)**
- **🚨 Must create/update CHANGELOG.md**

## Verification Checklist

After execution, self-check:

- [ ] CHANGELOG.md exists at project root
- [ ] [Unreleased] contains new entries
- [ ] ${run_dir}/changelog-entry.md is written

**If any check fails, you must re-run!**
