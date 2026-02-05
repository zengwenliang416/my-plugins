---
name: analysis-synthesizer
description: |
  【触发】Commit 工作流 Phase 4：合并并行分析结果
  【输出】${run_dir}/changes-analysis.json
  【询问】如果分析冲突，询问用户解决
---

# Analysis Synthesizer

## 输入/输出

| 项目    | 值                                                                     |
| ------- | ---------------------------------------------------------------------- |
| 输入    | `${run_dir}/semantic-analysis.json`, `${run_dir}/symbol-analysis.json` |
| 输出    | `${run_dir}/changes-analysis.json`                                     |
| 🚨 必需 | 两个并行分析文件必须存在                                               |

## 参数

- **run_dir** (必需): 运行目录（包含 semantic-analysis.json 和 symbol-analysis.json）

## 执行

### 1. 读取并行分析结果

使用 Read 工具加载两个 JSON 文件：

- `semantic-analysis.json` - 来自 semantic-analyzer 智能体
- `symbol-analysis.json` - 来自 symbol-analyzer 智能体

### 2. 合并语义组与符号 scope

对于每个语义组：

1. 匹配文件与符号分析结果
2. 如果置信度高，使用符号派生的 scope
3. 否则回退到语义派生的 scope

Scope 优先级：

1. LSP 符号 (高置信度) → 如 `AuthService` → `auth-service`
2. 语义分析 → 如功能模块名
3. 路径回退 → 如 `src/components/X` → `components`

### 3. 解决冲突

如果语义分析和符号分析建议不同的 type/scope：

解决规则：

- Type: 优先语义分析（理解变更目的）
- Scope: 如果置信度高则优先符号分析

### 4. 计算复杂度

| 级别   | 条件                             |
| ------ | -------------------------------- |
| low    | ≤3 文件, ≤50 行, 单一 scope      |
| medium | ≤10 文件, ≤300 行, ≤2 scopes     |
| high   | >10 文件 或 >300 行 或 >2 scopes |

### 5. 确定拆分建议

| 条件               | 建议     |
| ------------------ | -------- |
| 2+ 个独立语义组    | split    |
| >10 文件或 >300 行 | split    |
| 混合 feat+fix 类型 | optional |
| 检测到跨模块变更   | split    |

### 6. 构建统一输出

```json
{
  "timestamp": "ISO8601",
  "analyzed_files": "number",
  "primary_type": "feat|fix|refactor|docs|test|chore",
  "primary_scope": "string",
  "complexity": "low|medium|high",
  "should_split": "boolean",
  "split_recommendation": {
    "commits": [
      {
        "type": "string",
        "scope": "string",
        "emoji": "string",
        "files": ["paths"],
        "message": "type(scope): emoji description",
        "body": "Description with file list"
      }
    ]
  },
  "commit_strategy": {
    "suggested_type": "string",
    "suggested_scope": "string",
    "confidence": "high|medium|low"
  },
  "synthesis_metadata": {
    "semantic_groups_count": "number",
    "symbol_scopes_count": "number",
    "conflicts_resolved": "number"
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

## 返回

```
📊 分析已合成
Type: ${type} | Scope: ${scope} | Complexity: ${level} | Split: ${yes/no}
Output: ${run_dir}/changes-analysis.json
```
