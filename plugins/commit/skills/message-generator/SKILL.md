---
name: message-generator
description: |
  【Trigger】Commit workflow step 3: generate commit message.
  【Output】${run_dir}/commit-message.md
  【Ask】If analysis missing, ask to run analyzer first.
allowed-tools: [Read, Write, mcp__sequential-thinking__sequentialthinking]
arguments:
  - name: run_dir
    type: string
    required: true
    description: Runtime directory (contains changes-analysis.json)
  - name: options
    type: string
    required: false
    description: 'JSON options: {"emoji": true, "type": "feat", "scope": "api"}'
---

# Message Generator

## 🚨 Mandatory Rules

| ❌ Forbidden        | ✅ Required                              |
| ------------------- | ---------------------------------------- |
| No emoji            | Format: `type(scope): emoji description` |
| English description | Chinese description                      |
| Custom format       | Use emoji from table below               |

**Example:** `feat(components): ✨ 新增 Button 组件`

## Input/Output

| Item   | Value                                        |
| ------ | -------------------------------------------- |
| Input  | `${run_dir}/changes-analysis.json` + options |
| Output | `${run_dir}/commit-message.md`               |

## Emoji Table

| Type     | Emoji | Type   | Emoji |
| -------- | ----- | ------ | ----- |
| feat     | ✨    | test   | ✅    |
| fix      | 🐛    | build  | 📦    |
| docs     | 📝    | ci     | 👷    |
| style    | 💄    | chore  | 🔧    |
| refactor | ♻️    | revert | ⏪    |
| perf     | ⚡    |        |       |

## Execution

### 1. Read analysis

From changes-analysis.json: primary_type, primary_scope, commit_strategy

### 2. Parse options

| Option   | Default       |
| -------- | ------------- |
| emoji    | true          |
| type     | from analysis |
| scope    | from analysis |
| breaking | false         |
| issue    | -             |

### 3. Generate title

Format: `type(scope): emoji description` (≤72 chars)

Breaking: `feat(api)!: ✨ breaking change`

### 4. Generate body

```
简要描述变更意图。

变更文件:
- path/file.ts: 说明

统计: N 个文件，+X/-Y 行
```

### 5. Generate footer

- `Closes #123` (if issue)
- `BREAKING CHANGE: description` (if breaking)

### 6. Write output

```markdown
# Commit Message

## Title

feat(components): ✨ 新增 Button 组件

## Body

新增可复用的 Button 组件。

变更文件:

- src/components/Button.tsx: 组件实现

统计: 1 个文件，+80/-0 行

## Footer

Closes #123
```

## Return

```
📝 Message generated
Title: ${title}
Output: ${run_dir}/commit-message.md
```

## Verification

- [ ] Has emoji (✨🐛📝💄♻️⚡✅📦👷🔧⏪)
- [ ] Chinese description
- [ ] Format: type(scope): emoji description
