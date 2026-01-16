---
name: change-analyzer
description: |
  【触发条件】commit 工作流第二步：分析变更类型、作用域、拆分建议。
  【核心产出】输出 ${run_dir}/changes-analysis.json，包含提交策略建议。
  【不触发】收集变更（用 change-collector）、生成消息（用 message-generator）。
allowed-tools:
  - Read
  - Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（包含 changes-raw.json）
---

# Change Analyzer - 变更分析原子技能

## 职责边界

- **输入**: `run_dir`（包含 `changes-raw.json`）
- **输出**: `${run_dir}/changes-analysis.json`
- **单一职责**: 只分析变更，不收集数据，不生成消息

---

## 执行流程

### Step 1: 读取变更数据

读取 `${run_dir}/changes-raw.json`，提取：
- `staged` 数组（已暂存文件列表）
- `diff_stat`（变更统计）

### Step 2: 检查是否有暂存变更

如果 `has_staged=false`，写入错误结果并退出：
```json
{
  "error": "no_staged_changes",
  "message": "没有已暂存的变更"
}
```

### Step 3: 分析变更类型

根据文件变更推断 Conventional Commit 类型：

| 文件变更 | 推断类型 |
|----------|----------|
| 新增文件 | feat |
| 修改代码文件 | fix 或 feat（取决于上下文） |
| 删除文件 | refactor |
| 修改文档 | docs |
| 修改测试 | test |
| 修改配置 | chore |

### Step 4: 提取作用域

从文件路径提取作用域（第二级目录）：
- `src/components/Button.tsx` → `components`
- `docs/README.md` → `docs`
- `package.json` → `root`

### Step 5: 评估是否需要拆分

**拆分规则：**

| 规则 | 触发条件 | 建议 |
|------|----------|------|
| 多作用域 | 涉及 2+ 个不同作用域 | 建议拆分 |
| 大变更 | 文件数 > 10 或变更行数 > 300 | 建议拆分 |
| 混合类型 | 同时有 feat + fix | 可选拆分 |
| 新增+删除 | 同时有新增和删除文件 | 建议拆分 |

### Step 6: 构建分析结果

```json
{
  "timestamp": "2026-01-16T10:30:00Z",
  "analyzed_files": 3,
  "primary_type": "feat",
  "primary_scope": "components",
  "scopes": ["components", "utils"],
  "complexity": "low",
  "should_split": false,
  "split_recommendation": null,
  "commit_strategy": {
    "suggested_type": "feat",
    "suggested_scope": "components",
    "confidence": "high",
    "reason": "3个文件均为新增组件，作用域一致"
  },
  "files_by_type": {
    "feat": [...],
    "fix": [...]
  }
}
```

**拆分建议示例（should_split=true 时）：**

```json
{
  "should_split": true,
  "split_recommendation": {
    "reason": "包含多个独立功能，建议拆分为 2 个提交",
    "commits": [
      {
        "type": "feat",
        "scope": "components",
        "files": ["src/components/Button.tsx"],
        "description": "新增 Button 组件",
        "priority": 1
      },
      {
        "type": "docs",
        "scope": "docs",
        "files": ["docs/README.md"],
        "description": "更新文档",
        "priority": 2
      }
    ]
  }
}
```

### Step 7: 写入结果

使用 Write 工具将 JSON 写入 `${run_dir}/changes-analysis.json`

---

## 复杂度评估

| 复杂度 | 条件 |
|--------|------|
| low | ≤3 文件 且 ≤50 行变更 |
| medium | ≤10 文件 且 ≤300 行变更 |
| high | >10 文件 或 >300 行变更 |

## 置信度评估

| 置信度 | 条件 |
|--------|------|
| high | 单一作用域 + 单一类型 + low 复杂度 |
| medium | 单一作用域 或 medium 复杂度 |
| low | 多作用域 + high 复杂度 |

---

## 返回值

执行完成后，返回：

```
📊 变更分析完成

主要类型: ${primary_type}
主要作用域: ${primary_scope}
文件数: ${analyzed_files}
复杂度: ${complexity}
是否拆分: ${should_split}
置信度: ${confidence}

输出: ${run_dir}/changes-analysis.json
```

---

## 约束

- 不收集变更数据（交给 change-collector）
- 不生成提交消息（交给 message-generator）
- 分析结果仅供参考，用户有最终决定权
