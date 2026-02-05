---
name: change-analyzer
description: |
  【触发】Commit 工作流步骤 2：分析变更
  【输出】${run_dir}/changes-analysis.json
  【询问】如果没有暂存变更，询问是否分析未暂存的
---

# Change Analyzer

## 输入/输出

| 项目    | 值                                   |
| ------- | ------------------------------------ |
| 输入    | `${run_dir}/changes-raw.json`        |
| 输出    | `${run_dir}/changes-analysis.json`   |
| 🚨 依赖 | 语义检索 (代码理解), Read (符号分析) |

## 参数

- **run_dir** (必需): 运行目录（包含 changes-raw.json）

## 执行

### 1. 读取 changes-raw.json

提取: staged, unstaged, untracked, diff_stat

### 1.5 🚨 检查暂存状态

**如果 `has_staged=false` 但有 unstaged/untracked 文件:**

询问用户：

- (a) 分析 unstaged - 分析所有 unstaged + untracked 变更，然后帮你分功能提交
- (b) 取消 - 你可以先手动 git add 需要的文件

- 如果用户选择"分析 unstaged" → 继续分析 unstaged + untracked 文件
- 如果用户选择"取消" → 退出 skill，提前返回

### 2. 🚨 语义分析

使用代码语义检索分析文件列表，获取：

1. 文件职责
2. 依赖关系
3. 功能分组
4. 提交类型建议

### 3. 🚨 符号分析

对于每个代码文件，使用 Read 读取并分析符号结构：

- 类、函数、方法、接口
- 导出符号
- 符号层级

跳过: 配置文件、文本文件

### 4. 类型推断

| 变更类型 | Type     |
| -------- | -------- |
| 新文件   | feat     |
| 代码修改 | fix/feat |
| 删除     | refactor |
| 文档     | docs     |
| 测试     | test     |
| 配置     | chore    |

### 5. Scope 提取（优先级）

1. 符号分析 (AuthService → auth-service)
2. 语义分析 (功能模块)
3. 路径 (src/components/X → components)

### 6. 拆分评估

| 条件               | 建议     |
| ------------------ | -------- |
| 2+ scopes          | split    |
| >10 文件或 >300 行 | split    |
| 混合 feat+fix      | optional |
| 不相关的语义       | split    |

### 7. 构建输出

```json
{
  "timestamp": "ISO8601",
  "analyzed_files": 3,
  "primary_type": "feat",
  "primary_scope": "auth-service",
  "complexity": "low|medium|high",
  "should_split": false,
  "split_recommendation": {
    "commits": [
      {
        "type": "feat",
        "scope": "auth",
        "emoji": "✨",
        "files": ["..."],
        "message": "feat(auth): ✨ description",
        "body": "Description\n\n变更文件:\n- file: purpose"
      }
    ]
  },
  "commit_strategy": {
    "suggested_type": "feat",
    "suggested_scope": "auth",
    "confidence": "high"
  }
}
```

## Emoji 表

| Type     | Emoji | Type   | Emoji |
| -------- | ----- | ------ | ----- |
| feat     | ✨    | test   | ✅    |
| fix      | 🐛    | build  | 📦    |
| docs     | 📝    | ci     | 👷    |
| style    | 💄    | chore  | 🔧    |
| refactor | ♻️    | revert | ⏪    |
| perf     | ⚡    |        |       |

## 复杂度

| 级别   | 条件               |
| ------ | ------------------ |
| low    | ≤3 文件, ≤50 行    |
| medium | ≤10 文件, ≤300 行  |
| high   | >10 文件或 >300 行 |

## 返回

```
📊 分析完成
Type: ${type} | Scope: ${scope} | Files: ${n} | Split: ${yes/no}
Output: ${run_dir}/changes-analysis.json
```
