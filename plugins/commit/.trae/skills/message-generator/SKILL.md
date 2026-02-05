---
name: message-generator
description: |
  【触发】Commit 工作流步骤 3：生成提交消息
  【输出】${run_dir}/commit-message.md
  【询问】如果分析缺失，询问是否先运行分析器
---

# Message Generator

## 🚨 强制规则

| ❌ 禁止    | ✅ 必须                                |
| ---------- | -------------------------------------- |
| 没有 emoji | 格式: `type(scope): emoji description` |
| 英文描述   | 中文描述                               |
| 自定义格式 | 使用下表中的 emoji                     |

**示例:** `feat(components): ✨ 新增 Button 组件`

## 输入/输出

| 项目 | 值                                           |
| ---- | -------------------------------------------- |
| 输入 | `${run_dir}/changes-analysis.json` + options |
| 输出 | `${run_dir}/commit-message.md`               |

## 参数

- **run_dir** (必需): 运行目录（包含 changes-analysis.json）
- **options** (可选): JSON 选项 `{"emoji": true, "type": "feat", "scope": "api"}`

## Emoji 表

| Type     | Emoji | Type   | Emoji |
| -------- | ----- | ------ | ----- |
| feat     | ✨    | test   | ✅    |
| fix      | 🐛    | build  | 📦    |
| docs     | 📝    | ci     | 👷    |
| style    | 💄    | chore  | 🔧    |
| refactor | ♻️    | revert | ⏪    |
| perf     | ⚡    |        |       |

## 执行

### 1. 读取分析

从 changes-analysis.json: primary_type, primary_scope, commit_strategy

### 2. 解析选项

| 选项     | 默认          |
| -------- | ------------- |
| emoji    | true          |
| type     | from analysis |
| scope    | from analysis |
| breaking | false         |
| issue    | -             |

### 3. 生成标题

格式: `type(scope): emoji description` (≤72 字符)

Breaking: `feat(api)!: ✨ breaking change`

### 4. 生成正文

```
简要描述变更意图。

变更文件:
- path/file.ts: 说明

统计: N 个文件，+X/-Y 行
```

### 5. 生成脚注

- `Closes #123` (如果有 issue)
- `BREAKING CHANGE: description` (如果是 breaking)

### 6. 写入输出

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

## 返回

```
📝 消息已生成
Title: ${title}
Output: ${run_dir}/commit-message.md
```

## 验证

- [ ] 有 emoji (✨🐛📝💄♻️⚡✅📦👷🔧⏪)
- [ ] 中文描述
- [ ] 格式: type(scope): emoji description
