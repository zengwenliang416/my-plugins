---
name: changelog-generator
description: |
  【触发】Commit 工作流 Phase 5.5：更新 CHANGELOG.md
  【输出】更新后的 CHANGELOG.md + ${run_dir}/changelog-entry.md
  【🚨 强制】除非 --no-changelog 否则必须运行
---

# Changelog Generator

## 🚨 强制规则

| ❌ 禁止                 | ✅ 必须                     |
| ----------------------- | --------------------------- |
| 跳过此 skill            | 如果缺失则创建 CHANGELOG.md |
| 忘记 changelog-entry.md | 在 [Unreleased] 下添加条目  |

## 输入/输出

| 项目 | 值                                                       |
| ---- | -------------------------------------------------------- |
| 输入 | `${run_dir}/changes-analysis.json` + `commit-message.md` |
| 输出 | `CHANGELOG.md` + `${run_dir}/changelog-entry.md`         |

## 参数

- **run_dir** (必需): 运行目录（包含 changes-analysis.json, commit-message.md）
- **version** (可选): 版本号（省略则用 Unreleased）
- **commits** (可选): 批量模式：提交的 JSON 数组

## 类型映射

| Commit Type                    | Changelog Type               |
| ------------------------------ | ---------------------------- |
| feat                           | Added                        |
| fix                            | Fixed                        |
| docs/style/refactor/perf/build | Changed                      |
| revert                         | Removed                      |
| test/ci/chore                  | (不记录)                     |
| BREAKING                       | Changed (**Breaking:** 前缀) |

## 执行

### 1. 确定模式

- `commits` 参数存在 → 批量模式
- 否则 → 单一模式（从 run_dir 读取）

### 2. 检查 CHANGELOG.md

如果缺失，创建：

```markdown
# Changelog

All notable changes documented here.

Based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]
```

### 3. 生成条目

格式: `- Description (scope)`

**单一:**

```markdown
### Added

- Add Button component with multiple styles
```

**批量:**

```markdown
### Added

- Add Todo types (types)
- Add state hooks (hooks)

### Fixed

- Fix auth failure (api)
```

### 4. 更新 CHANGELOG.md

在 `## [Unreleased]` 下插入或创建版本 `## [X.Y.Z] - YYYY-MM-DD`

### 5. 写入 changelog-entry.md

```markdown
# Changelog Entry

Type: Added
Content: - Add Button component
Target: [Unreleased]
```

## 返回

```
📋 Changelog 已更新
Type: ${type} | Target: ${section}
Output: CHANGELOG.md, ${run_dir}/changelog-entry.md
```
