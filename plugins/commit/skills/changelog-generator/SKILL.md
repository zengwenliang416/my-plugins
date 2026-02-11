---
name: changelog-generator
description: |
  【触发条件】Commit workflow Phase 5.5: update CHANGELOG.md.
  【核心产出】Updated CHANGELOG.md + ${run_dir}/changelog-entry.md
  【不触发】用户传入 --no-changelog 或确认跳过更新日志时
  【先问什么】目标版本号、是否写入 Unreleased 区段、是否批量提交模式
  【🚨 Mandatory】Must run unless --no-changelog.
allowed-tools:
  - Bash
  - Read
  - Write
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

## Script Entry

```bash
npx tsx scripts/update-changelog.ts [args]
```

## Resource Usage

- Shared index: `../_shared/references/_index.md`
- Shared taxonomy: `../_shared/references/commit-taxonomy.json`
- Reference docs: `references/changelog-format.md`
- Assets: `assets/changelog-template.md`
- Execution script: `scripts/update-changelog.ts`

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

## 上下文加载策略（方案3：渐进式）

1. 先读 `../_shared/references/_index.md`，确认当前阶段只做 changelog 生成。
2. 先读取 `${run_dir}/changes-analysis.json` 与 `${run_dir}/commit-message.md`。
3. 优先读取 `../_shared/references/commit-taxonomy.json` 的 `changelog_type_by_commit_type`。
4. 仅在版式或段落结构异常时，再读取 `references/changelog-format.md`。
5. 新建文件时优先复用 `assets/changelog-template.md`。

## Type Mapping

优先从 `../_shared/references/commit-taxonomy.json` 的 `changelog_type_by_commit_type` 读取映射：

- `feat -> Added`
- `fix -> Fixed`
- `docs/style/refactor/perf/build -> Changed`
- `revert -> Removed`
- `test/ci/chore -> skip`

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
