---
name: message-generator
description: |
  【Trigger】Step 3 of the commit workflow: generate Conventional Commit messages.
  【Core Output】Write ${run_dir}/commit-message.md with title, body, and footer.
  【Not Triggered】Analyze changes (use change-analyzer), execute commit (use commit-executor).
  【Ask First】If changes-analysis.json is missing, ask whether to run change analysis first.
allowed-tools:
  - Read
  - Write
  - mcp__sequential-thinking__sequentialthinking
arguments:
  - name: run_dir
    type: string
    required: true
    description: Runtime directory path (contains changes-analysis.json)
  - name: options
    type: string
    required: false
    description: User options JSON (e.g. '{"emoji": true, "type": "feat", "scope": "api"}')
---

# Message Generator - Atomic Commit Message Generation Skill

## MCP Tool Integration

| MCP Tool              | Purpose                                   | Trigger        |
| --------------------- | ----------------------------------------- | -------------- |
| `sequential-thinking` | Structure message generation strategy and ensure consistent format | 🚨 Required every run |

## Execution Flow

### Step 0: Structured Message Plan (sequential-thinking)

🚨 **You must first use sequential-thinking to plan the message strategy.**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Plan the message generation strategy. Need: 1) read analysis results 2) parse user options 3) choose emoji 4) generate title/body/footer 5) write output file",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**Thinking steps**:

1. **Read analysis results**: extract type, scope, strategy from changes-analysis.json
2. **Parse user options**: handle emoji, type, scope, breaking, etc.
3. **Choose emoji**: select emoji by commit type from the mapping table
4. **Generate message**: title (≤72 chars), body, footer
5. **Write results**: write commit-message.md and validate format

---

## 🚨🚨🚨 Mandatory Rules (Must Not Be Skipped)

**The following are forbidden:**

- ❌ Not using emoji
- ❌ Using English descriptions
- ❌ Inventing your own format
- ❌ Skipping the emoji mapping table

**You must obey:**

- ✅ Format must be: `type(scope): emoji short description`
- ✅ Emoji must come from the mapping table below
- ✅ Description must be in Chinese
- ✅ Example: `feat(components): ✨ 新增 Button 组件`

---

## Responsibility Boundaries

- **Input**: `run_dir` (contains `changes-analysis.json`) + `options`
- **Output**: `${run_dir}/commit-message.md`
- **Single responsibility**: only generate commit messages; no analysis or commit execution

---

## Execution Flow

### Step 1: Read analysis results

Read `${run_dir}/changes-analysis.json` and extract:

- `primary_type`
- `primary_scope`
- `commit_strategy`
- `files_by_type`

### Step 2: Parse user options

Parse from `options` (if provided):

| Option      | Description                 | Default      |
| ----------- | --------------------------- | ------------ |
| `emoji`     | Use emoji                   | true         |
| `type`      | Force type                  | from analysis |
| `scope`     | Force scope                 | from analysis |
| `breaking`  | Breaking Change or not      | false        |
| `issue`     | Related issue number        | -            |

### Step 3: Choose Emoji

| Type     | Emoji |
| -------- | ----- |
| feat     | ✨    |
| fix      | 🐛    |
| docs     | 📝    |
| style    | 💄    |
| refactor | ♻️    |
| perf     | ⚡    |
| test     | ✅    |
| build    | 📦    |
| ci       | 👷    |
| chore    | 🔧    |
| revert   | ⏪    |

### Step 4: Generate Title

**Format**: `type(scope): emoji short description`

**Rules**:

- Total length ≤ 72 characters
- Use imperative mood (Add, Fix, Update...)
- Do not end with a period

**Examples**:

```
feat(components): ✨ 新增 Button 组件
fix(api): 🐛 修复用户认证失败问题
docs(readme): 📝 更新安装说明
```

**Breaking Change title**:

```
feat(api)!: ✨ 修改响应数据格式
```

### Step 5: Generate Body

**Content**:

1. Briefly describe the change intent
2. List changed files
3. Change statistics

**Example**:

```markdown
新增可复用的 Button 组件，支持多种样式和尺寸。

变更文件:

- src/components/Button.tsx: 组件实现
- src/components/Button.test.tsx: 单元测试

统计: 2 个文件，+80/-0 行
```

### Step 6: Generate Footer

**Include**:

- `Closes #123` (if related issue)
- `BREAKING CHANGE: description` (if any)

### Step 7: Write results

Use the Write tool to write to `${run_dir}/commit-message.md`:

```markdown
# Commit Message

## Title

feat(components): ✨ 新增 Button 组件

## Body

新增可复用的 Button 组件，支持多种样式和尺寸。

变更文件:

- src/components/Button.tsx: 组件实现
- src/components/Button.test.tsx: 单元测试

统计: 2 个文件，+80/-0 行

## Footer

Closes #123
```

---

## Conventional Commit Specification

### Type definitions

| Type     | Description    | Version impact |
| -------- | -------------- | -------------- |
| feat     | New feature    | minor          |
| fix      | Bug fix        | patch          |
| docs     | Documentation  | -              |
| style    | Code style     | -              |
| refactor | Refactoring    | -              |
| perf     | Performance    | patch          |
| test     | Tests          | -              |
| build    | Build system   | -              |
| ci       | CI config      | -              |
| chore    | Miscellaneous  | -              |
| revert   | Revert         | -              |

### Breaking Change

Add an exclamation mark after the type to indicate a breaking change:

    feat(api)!: 修改响应格式

And describe it in the footer:

    BREAKING CHANGE: 所有 API 响应字段从下划线改为驼峰命名

---

## Return Value

After execution, return:

```
📝 Commit message generated

Title: ${title}
Type: ${type}
Scope: ${scope}
Emoji: ${emoji}

Output: ${run_dir}/commit-message.md
```

---

## Constraints

- Do not analyze changes (handled by change-analyzer)
- Do not execute commits (handled by commit-executor)
- Title length must be ≤ 72 characters
- Follow the Conventional Commits spec
- **🚨 Format must be `type(scope): emoji Chinese description`**
- **🚨 Must use emoji (from the mapping table)**
- **🚨 Description must be in Chinese**

## Verification Checklist

After generating the commit message, self-check:

- [ ] Title contains emoji (one of ✨🐛📝💄♻️⚡✅📦👷🔧⏪)
- [ ] Description is in Chinese
- [ ] Format matches `type(scope): emoji Chinese description`

**If any check fails, you must regenerate!**
