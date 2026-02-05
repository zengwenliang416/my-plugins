---
name: change-detector
description: |
  【触发条件】claude-related 命令执行时，检测 git 变更
  【核心产出】changed-modules.json（需要更新的模块列表）
  【专属用途】
    - 检测 git 变更文件
    - 分析变更影响范围
    - 识别受影响的父模块
    - 确定更新策略
  【不触发】全量更新（用 module-discovery）
allowed-tools:
  - Bash
  - Glob
  - Read
  - LSP
arguments:
  - name: base_ref
    type: string
    required: false
    default: "HEAD~1"
    description: 比较的基准引用（默认上一次提交）
  - name: include_staged
    type: boolean
    required: false
    default: true
    description: 是否包含暂存的变更
  - name: include_unstaged
    type: boolean
    required: false
    default: true
    description: 是否包含未暂存的变更
---

# Change Detector Skill

## 核心概念

### 变更传播规则

```
文件变更 → 所属模块 → 父模块链
   │          │          │
   ▼          ▼          ▼
src/auth/handlers/login.ts
   → src/auth/handlers/  (直接模块)
   → src/auth/           (父模块)
   → src/                (顶层模块)
```

### 变更类型影响

| 变更类型   | 影响范围     | 更新策略   |
| ---------- | ------------ | ---------- |
| 新增文件   | 所属模块     | 重新生成   |
| 修改文件   | 所属模块     | 增量更新   |
| 删除文件   | 所属模块     | 重新生成   |
| 重命名文件 | 新旧所属模块 | 两者都更新 |
| 目录新增   | 父模块       | 更新引用   |
| 目录删除   | 父模块       | 移除引用   |

## MCP 工具集成

| MCP 工具              | 用途                   | 触发条件        |
| --------------------- | ---------------------- | --------------- |
| `auggie-mcp`          | 语义分析变更影响范围   | 🚨 必须使用     |
| `LSP`                 | 获取变更文件的符号结构 | 代码文件变更时  |

## 执行流程

```
│     thought: "规划变更检测策略：
│       1) git diff 获取变更文件列表
│       2) auggie-mcp 分析变更文件的模块归属
│       3) LSP 获取变更文件的符号结构
│       4) 识别受影响的父模块链
│       5) 去重并确定更新策略",
│     thoughtNumber: 1,
│     totalThoughts: 5,
│     nextThoughtNeeded: true
│   })
│
├── Step 1: git diff 检测变更文件
│   Bash: git diff --name-only ${base_ref}
│   Bash: git diff --cached --name-only  (if include_staged)
│   Bash: git diff --name-only           (if include_unstaged)
│   合并去重 → changed_files[]
│
├── Step 2: auggie-mcp 分析变更影响
│   mcp__auggie-mcp__codebase-retrieval({
│     information_request: "分析以下变更文件的影响范围：
│       ${changed_files}
│
│       请识别：
│       1. 每个文件所属的模块
│       2. 模块之间的依赖关系
│       3. 变更可能影响的其他模块"
│   })
│
├── Step 3: LSP 获取符号结构（仅代码文件）
│   For each code_file in changed_files:
│     LSP(operation="documentSymbol", filePath=code_file, line=1, character=1)
│     → 获取导出的函数/类/接口
│
│   For each exported_symbol:
│     LSP(operation="findReferences", ...)
│     → 找到使用该符号的模块
│
├── Step 4: 构建变更模块列表
│   For each changed_file:
│     ├── 计算所属模块路径
│     ├── 计算 depth
│     └── 添加父模块链
│
├── Step 5: 去重并确定策略
│   For each module:
│     ├── depth >= 3 → multi-layer
│     └── depth < 3  → single-layer
│
└── Step 6: 输出 changed-modules.json
```

## 输出格式

### changed-modules.json

```json
{
  "base_ref": "HEAD~1",
  "scan_time": "2024-01-20T10:30:00Z",
  "changed_files": {
    "total": 5,
    "files": [
      {
        "path": "src/auth/handlers/login.ts",
        "status": "modified",
        "additions": 10,
        "deletions": 3
      }
    ]
  },
  "affected_modules": [
    {
      "path": "src/auth/handlers",
      "depth": 2,
      "type": "code",
      "strategy": "single-layer",
      "reason": "直接变更",
      "changed_files": ["login.ts"],
      "has_claude_md": true,
      "claude_md_outdated": true
    },
    {
      "path": "src/auth",
      "depth": 1,
      "type": "navigation",
      "strategy": "single-layer",
      "reason": "子模块变更",
      "changed_files": [],
      "has_claude_md": true,
      "claude_md_outdated": true
    }
  ],
  "summary": {
    "direct_changes": 2,
    "propagated_changes": 1,
    "total_modules_to_update": 3
  },
  "execution_plan": {
    "order": ["src/auth/handlers", "src/auth", "src"],
    "parallel_safe": ["src/auth/handlers"]
  }
}
```

## 使用示例

```
# 检测最近一次提交的变更
Skill("context-memory:change-detector")

# 检测与特定分支的差异
Skill("context-memory:change-detector", base_ref="main")

# 仅检测暂存的变更
Skill("context-memory:change-detector",
  include_staged=true,
  include_unstaged=false
)
```

## 边界情况处理

### 无变更

```json
{
  "changed_files": { "total": 0, "files": [] },
  "affected_modules": [],
  "summary": {
    "message": "No changes detected since HEAD~1"
  }
}
```

### 大量变更（>50 文件）

```
建议: 变更文件过多 (${count} 个)
推荐使用 claude-full 全量更新，而非 claude-related 增量更新
```

### 新项目（无 git 历史）

```
Error: Not a git repository or no commits yet
建议: 使用 claude-full 进行初始生成
```

## 验证清单

- [ ] git diff 命令执行成功
- [ ] auggie-mcp 分析了影响范围
- [ ] LSP 获取了符号结构（如适用）
- [ ] 父模块链已识别
- [ ] 更新策略已确定
- [ ] changed-modules.json 已生成
