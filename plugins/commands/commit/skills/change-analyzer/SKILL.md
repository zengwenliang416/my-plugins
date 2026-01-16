---
name: change-analyzer
description: |
  【触发条件】commit 工作流第二步：分析变更类型、作用域、拆分建议。
  【核心产出】输出 ${run_dir}/changes-analysis.json，包含提交策略建议。
  【不触发】收集变更（用 change-collector）、生成消息（用 message-generator）。
allowed-tools:
  - Read
  - Write
  - LSP
  - mcp__auggie-mcp__codebase-retrieval
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
- `unstaged` 数组（未暂存文件列表）
- `untracked` 数组（未跟踪文件列表）
- `diff_stat`（变更统计）

### Step 2: 确定分析目标

**根据变更状态确定分析目标**：

| 情况 | 分析目标 | 模式 |
|------|----------|------|
| `has_staged=true` | `staged` 文件 | 正常提交模式 |
| `has_staged=false` 但有 `unstaged/untracked` | `unstaged` + `untracked` | 智能暂存模式 |
| 全部为空 | 无 | 报错退出 |

**智能暂存模式**：
- 分析所有未暂存/未跟踪文件
- 使用 LSP + auggie-mcp 按功能模块分组
- 生成分批暂存建议

### Step 3: 🚨 强制语义分析（auggie-mcp）

**必须调用 `mcp__auggie-mcp__codebase-retrieval`**，不可跳过：

```
mcp__auggie-mcp__codebase-retrieval(
  information_request="分析以下文件的功能和关系，按功能模块分组：
  文件列表: ${file_list}

  请回答：
  1. 每个文件的主要职责
  2. 文件之间的依赖关系
  3. 按功能模块分组建议
  4. 每个模块的 commit type (feat/fix/chore/docs)"
)
```

**产出**：
- `semantic_groups`: 按功能模块分组的文件
- `semantic_summary`: 变更的语义摘要
- `affected_features`: 影响的功能列表

### Step 4: 🚨 强制符号分析（LSP）

**对每个代码文件（.ts/.tsx/.js/.jsx/.py/.go 等）必须调用 LSP**：

```
LSP(operation="documentSymbol", filePath="${file_path}", line=1, character=1)
```

**跳过条件**（仅以下情况可跳过）：
- 配置文件（.json, .yaml, .toml 等）
- 纯文本文件（.md, .txt 等）
- LSP 返回错误

**提取**：
- 变更涉及的函数/类/方法名
- 主要符号的类型（function, class, interface, variable）

**示例**：
```json
{
  "symbols": [
    {"name": "validateToken", "kind": "function", "line": 42},
    {"name": "AuthService", "kind": "class", "line": 10}
  ]
}
```

### Step 5: 基础类型分析

根据文件变更推断 Conventional Commit 类型（作为 auggie-mcp 的补充）：

| 文件变更 | 推断类型 |
|----------|----------|
| 新增文件 | feat |
| 修改代码文件 | fix 或 feat（取决于上下文） |
| 删除文件 | refactor |
| 修改文档 | docs |
| 修改测试 | test |
| 修改配置 | chore |

### Step 6: 智能作用域提取（基于 LSP + auggie-mcp 结果）

**优先级**（从高到低）：

1. **LSP 符号**：如果变更集中在单个类/模块
   - `AuthService` → scope: `auth-service`
   - `validateToken` → scope: `auth/validate`

2. **语义分析**：如果 auggie-mcp 识别出明确功能
   - "用户认证流程" → scope: `auth`

3. **路径推断**（降级）：
   - `src/components/Button.tsx` → scope: `components`
   - `docs/README.md` → scope: `docs`
   - `package.json` → scope: `root`

### Step 7: 评估是否需要拆分

**拆分规则：**

| 规则 | 触发条件 | 建议 |
|------|----------|------|
| 多作用域 | 涉及 2+ 个不同作用域 | 建议拆分 |
| 大变更 | 文件数 > 10 或变更行数 > 300 | 建议拆分 |
| 混合类型 | 同时有 feat + fix | 可选拆分 |
| 新增+删除 | 同时有新增和删除文件 | 建议拆分 |
| 语义不相关 | auggie-mcp 判断变更语义不相关 | 建议拆分 |

### Step 8: 构建分析结果

```json
{
  "timestamp": "2026-01-16T10:30:00Z",
  "analyzed_files": 3,
  "primary_type": "feat",
  "primary_scope": "auth-service",
  "scopes": ["auth-service", "utils"],
  "complexity": "low",
  "should_split": false,
  "split_recommendation": null,
  "commit_strategy": {
    "suggested_type": "feat",
    "suggested_scope": "auth-service",
    "confidence": "high",
    "reason": "3个文件均修改 AuthService 类，语义一致"
  },
  "semantic_analysis": {
    "summary": "新增 token 刷新功能，支持自动续期",
    "affected_features": ["用户认证", "会话管理"],
    "type_confidence": "high"
  },
  "symbol_analysis": {
    "primary_symbols": ["AuthService", "refreshToken"],
    "symbol_types": {"AuthService": "class", "refreshToken": "function"}
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
        "scope": "auth-service",
        "files": ["src/auth/AuthService.ts"],
        "description": "新增 token 刷新功能",
        "symbols": ["refreshToken", "TokenManager"],
        "priority": 1
      },
      {
        "type": "docs",
        "scope": "docs",
        "files": ["docs/README.md"],
        "description": "更新认证文档",
        "priority": 2
      }
    ]
  }
}
```

### Step 9: 写入结果

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
| high | 单一作用域 + 单一类型 + low 复杂度 + 语义一致 |
| medium | 单一作用域 或 medium 复杂度 |
| low | 多作用域 + high 复杂度 + 语义不一致 |

---

## 工具使用策略

### auggie-mcp 优先场景

- 需要理解变更的业务语义
- 判断是新功能还是 bug 修复
- 识别变更影响的功能模块

### LSP 优先场景

- 获取变更文件的符号结构
- 识别修改的函数/类名
- 提取精确的作用域

### 降级策略

如果 auggie-mcp 或 LSP 不可用：
1. 跳过语义分析，使用基础类型推断
2. 跳过符号分析，使用路径推断作用域
3. 在结果中标记 `"analysis_mode": "basic"`

---

## 返回值

执行完成后，返回：

```
📊 变更分析完成

主要类型: ${primary_type}
主要作用域: ${primary_scope}
核心符号: ${primary_symbols}
语义摘要: ${semantic_summary}
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
- **🚨 必须调用 auggie-mcp 进行语义分析**
- **🚨 必须对代码文件调用 LSP 获取符号**
- 仅当工具返回错误时才可降级
