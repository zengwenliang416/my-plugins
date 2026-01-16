---
name: changelog-generator
description: |
  【触发条件】commit 工作流可选步骤：生成/更新 CHANGELOG.md 条目。
  【核心产出】更新项目根目录的 CHANGELOG.md，添加新的变更条目。
  【不触发】生成提交消息（用 message-generator）、执行提交（用 commit-executor）。
allowed-tools:
  - Read
  - Write
  - Bash
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（包含 changes-analysis.json 和 commit-message.md）
  - name: version
    type: string
    required: false
    description: 版本号（如 "1.2.0"），不传则添加到 Unreleased 部分
---

# Changelog Generator - 变更日志生成原子技能

## 职责边界

- **输入**: `run_dir`（包含 `changes-analysis.json`、`commit-message.md`）+ `version`
- **输出**: 更新 `CHANGELOG.md`
- **单一职责**: 只更新变更日志，不做分析，不执行提交

---

## 规范参考

基于 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) 和 [Common Changelog](https://common-changelog.org/) 最佳实践。

### 变更类型映射

| Conventional Commit | Changelog 类型 |
|---------------------|----------------|
| feat                | Added          |
| fix                 | Fixed          |
| docs                | Changed        |
| style               | Changed        |
| refactor            | Changed        |
| perf                | Changed        |
| test                | -（通常不记录） |
| build               | Changed        |
| ci                  | -（通常不记录） |
| chore               | -（通常不记录） |
| revert              | Removed        |
| BREAKING CHANGE     | Changed（带 **Breaking:** 前缀） |

### Changelog 类型优先级

1. **Changed** - 功能变更（最先列出）
2. **Added** - 新增功能
3. **Deprecated** - 即将移除的功能
4. **Removed** - 已移除的功能
5. **Fixed** - Bug 修复
6. **Security** - 安全修复

---

## 执行流程

### Step 1: 读取分析结果

读取 `${run_dir}/changes-analysis.json` 和 `${run_dir}/commit-message.md`，提取：
- `primary_type`（从 analysis）
- `commit_message_title`（从 message）
- `files_by_type`（从 analysis）

### Step 2: 检查现有 CHANGELOG.md

```bash
# 检查项目根目录是否存在 CHANGELOG.md
ls CHANGELOG.md 2>/dev/null
```

**如果不存在**，创建初始结构：

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

```

### Step 3: 确定变更类型

根据 `primary_type` 映射到 Changelog 类型：

```
feat      → Added
fix       → Fixed
refactor  → Changed
perf      → Changed
docs      → Changed
BREAKING  → Changed（带 **Breaking:** 前缀）
```

### Step 4: 生成条目内容

**格式规范**：
- 使用祈使语气（Add, Fix, Update, Remove）
- 每行以 `- ` 开头
- Breaking changes 用 `**Breaking:**` 前缀
- 包含相关引用（如有）：`([#123](link))`

**示例**：
```markdown
### Added

- Add Button component with multiple styles and sizes

### Changed

- **Breaking:** Change API response format from snake_case to camelCase

### Fixed

- Fix user authentication failure on expired tokens
```

### Step 5: 更新 CHANGELOG.md

**读取现有文件**，找到 `## [Unreleased]` 部分，在对应类型下添加新条目。

**如果版本号已指定**：
- 创建新版本部分：`## [X.Y.Z] - YYYY-MM-DD`
- 将 Unreleased 内容移至新版本
- 在文件底部添加版本链接

### Step 6: 写入结果

使用 Write 工具更新 `CHANGELOG.md`。

同时写入 `${run_dir}/changelog-entry.md` 记录本次添加的条目：

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

## CHANGELOG.md 结构规范

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

## 返回值

执行完成后，返回：

```
📋 Changelog 更新完成

类型: ${changelog_type}
条目: ${entry_content}
目标: ${target_section}

文件: CHANGELOG.md
记录: ${run_dir}/changelog-entry.md
```

---

## 约束

- 不做变更分析（交给 change-analyzer）
- 不生成提交消息（交给 message-generator）
- 遵循 Keep a Changelog 规范
- 日期格式：YYYY-MM-DD (ISO 8601)
- 使用祈使语气描述变更
- test/ci/chore 类型通常不记录到 changelog
