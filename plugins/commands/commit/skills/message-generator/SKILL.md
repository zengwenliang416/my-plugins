---
name: message-generator
description: |
  【触发条件】commit 工作流第三步：生成 Conventional Commit 提交信息。
  【核心产出】输出 ${run_dir}/commit-message.md，包含标题、正文、footer。
  【不触发】分析变更（用 change-analyzer）、执行提交（用 commit-executor）。
allowed-tools:
  - Read
  - Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（包含 changes-analysis.json）
  - name: options
    type: string
    required: false
    description: 用户选项 JSON（如 '{"type": "feat", "scope": "api"}'）
---

# Message Generator - 提交信息生成原子技能

## 职责边界

- **输入**: `run_dir`（包含 `changes-analysis.json`）+ `options`
- **输出**: `${run_dir}/commit-message.md`
- **单一职责**: 只生成提交信息，不做分析，不执行提交

---

## 执行流程

### Step 1: 读取分析结果

读取 `${run_dir}/changes-analysis.json`，提取：
- `primary_type`
- `primary_scope`
- `commit_strategy`
- `files_by_type`

### Step 2: 解析用户选项

从 `options` 参数解析（如有）：

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `type` | 强制指定类型 | 来自分析 |
| `scope` | 强制指定作用域 | 来自分析 |
| `breaking` | 是否为 Breaking Change | false |
| `issue` | 关联的 issue 编号 | - |

### Step 3: 生成标题

**格式**：`type(scope): 简短描述`

**规则**：
- 总长度 ≤ 72 字符
- 使用祈使语气（add, fix, update...）
- 首字母小写
- 不以句号结尾
- 不使用 emoji

**示例**：
```
feat(components): add Button component
fix(api): fix user authentication failure
docs(readme): update installation guide
style(app): apply dark theme layout
chore(tailwind): add dark theme config
```

**Breaking Change 标题**：
```
feat(api)!: change response data format
```

### Step 4: 生成正文

**内容**：
1. 简要说明变更目的
2. 列出变更文件清单
3. 变更统计

**示例**：
```markdown
add reusable Button component with multiple styles and sizes

Changes:
- src/components/Button.tsx: component implementation
- src/components/Button.test.tsx: unit tests

Stats: 2 files, +80/-0 lines
```

### Step 5: 生成 Footer

**包含**：
- `Closes #123`（如有关联 issue）
- `BREAKING CHANGE: 描述`（如有）

### Step 6: 写入结果

使用 Write 工具将结果写入 `${run_dir}/commit-message.md`：

```markdown
# Commit Message

## 标题

feat(components): add Button component

## 正文

add reusable Button component with multiple styles and sizes

Changes:
- src/components/Button.tsx: component implementation
- src/components/Button.test.tsx: unit tests

Stats: 2 files, +80/-0 lines

## Footer

Closes #123
```

---

## Conventional Commit 规范

### 类型定义

| 类型 | 说明 | 版本影响 |
|------|------|----------|
| feat | 新功能 | minor |
| fix | Bug 修复 | patch |
| docs | 文档变更 | - |
| style | 代码格式 | - |
| refactor | 重构 | - |
| perf | 性能优化 | patch |
| test | 测试 | - |
| build | 构建系统 | - |
| ci | CI 配置 | - |
| chore | 杂项 | - |
| revert | 回滚 | - |

### Breaking Change

在类型后加感叹号表示破坏性变更：

    feat(api)!: 修改响应格式

并在 Footer 中详细说明：

    BREAKING CHANGE: 所有 API 响应字段从下划线改为驼峰命名

---

## 返回值

执行完成后，返回：

```
提交信息生成完成

标题: ${title}
类型: ${type}
作用域: ${scope}

输出: ${run_dir}/commit-message.md
```

---

## 约束

- 不做变更分析（交给 change-analyzer）
- 不执行提交（交给 commit-executor）
- 标题长度必须 ≤ 72 字符
- 遵循 Conventional Commits 规范
