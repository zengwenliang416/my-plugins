---
name: module-discovery
description: |
  【触发条件】claude-full 命令执行时，扫描项目目录结构
  【核心产出】modules.json（按 Layer 分组的模块列表）
  【专属用途】
    - 扫描目录树
    - 计算模块 depth
    - 智能过滤（tests/build/config）
    - 按 Layer 分组（3→2→1）
  【强制工具】auggie-mcp, sequential-thinking
  【不触发】增量更新（用 change-detector）
allowed-tools:
  - Bash
  - Glob
  - Read
arguments:
  - name: path
    type: string
    required: false
    default: "."
    description: 扫描的根目录路径
  - name: exclude_patterns
    type: array
    required: false
    description: 排除的目录模式 (默认排除 node_modules, dist, build, coverage, __pycache__)
---

# Module Discovery Skill

## 核心概念

### Layer 分层

| Layer | Depth | 策略         | 上下文                         |
| ----- | ----- | ------------ | ------------------------------ |
| 3     | ≥3    | multi-layer  | `@**/*` 所有文件               |
| 2     | 1-2   | single-layer | `@*/CLAUDE.md @*.{ts,tsx,...}` |
| 1     | 0     | single-layer | `@*/CLAUDE.md`                 |

**执行顺序**: Layer 3 → Layer 2 → Layer 1（自底向上）

### 模块类型

| 类型       | 判断条件                     | 说明               |
| ---------- | ---------------------------- | ------------------ |
| code       | 包含 .ts/.tsx/.js/.py 等文件 | 需要生成 CLAUDE.md |
| navigation | 仅包含子目录，无代码文件     | 仅引用子模块       |
| skip       | tests/config/build 目录      | 跳过处理           |

## MCP 工具集成

| MCP 工具              | 用途                 | 触发条件        |
| --------------------- | -------------------- | --------------- |
| `sequential-thinking` | 结构化目录扫描策略   | 🚨 每次执行必用 |
| `auggie-mcp`          | 语义检索识别模块类型 | 智能过滤时      |

## 执行流程

```
Step 0: sequential-thinking 规划
│   mcp__sequential-thinking__sequentialthinking({
│     thought: "规划目录扫描策略：
│       1) 使用 Glob 扫描目录树
│       2) 计算每个目录的 depth
│       3) 使用 auggie-mcp 智能识别模块类型
│       4) 按 Layer 分组输出",
│     thoughtNumber: 1,
│     totalThoughts: 4,
│     nextThoughtNeeded: true
│   })
│
├── Step 1: auggie-mcp 识别项目类型
│   mcp__auggie-mcp__codebase-retrieval({
│     information_request: "识别项目类型和技术栈，确定：
│       1. 主要编程语言
│       2. 项目结构模式（monorepo/单模块）
│       3. 需要过滤的目录（tests/build/config）"
│   })
│
├── Step 2: 扫描目录结构
│   Glob: */         → 一级目录
│   Glob: **/*/      → 所有子目录
│   计算每个目录的 depth（相对于 root）
│
├── Step 3: 分类模块类型
│   For each directory:
│     ├── 检查是否有代码文件 → code
│     ├── 检查是否只有子目录 → navigation
│     └── 检查是否应跳过 → skip
│
├── Step 4: 按 Layer 分组
│   Layer 3: depth >= 3
│   Layer 2: depth 1-2
│   Layer 1: depth 0
│
└── Step 5: 输出 modules.json
```

## 智能过滤规则

### 默认排除

```
node_modules/
dist/
build/
coverage/
.git/
__pycache__/
.next/
.nuxt/
.cache/
```

### 条件过滤（通过 auggie-mcp 识别）

```
tests/              → 除非项目是测试框架
__tests__/          → 除非项目是测试框架
*.test.ts           → 测试文件
*.spec.ts           → 测试文件
e2e/                → E2E 测试目录
fixtures/           → 测试固件
mocks/              → Mock 数据
```

## 输出格式

### modules.json

```json
{
  "root": "/path/to/project",
  "scan_time": "2024-01-20T10:30:00Z",
  "summary": {
    "total_modules": 25,
    "by_layer": {
      "layer_3": 10,
      "layer_2": 12,
      "layer_1": 3
    },
    "by_type": {
      "code": 20,
      "navigation": 5,
      "skip": 8
    }
  },
  "layers": {
    "3": [
      {
        "path": "src/auth/handlers/oauth",
        "depth": 3,
        "type": "code",
        "strategy": "multi-layer",
        "file_count": 5,
        "has_claude_md": false
      }
    ],
    "2": [
      {
        "path": "src/auth",
        "depth": 1,
        "type": "code",
        "strategy": "single-layer",
        "file_count": 8,
        "has_claude_md": true
      }
    ],
    "1": [
      {
        "path": "src",
        "depth": 0,
        "type": "navigation",
        "strategy": "single-layer",
        "file_count": 0,
        "has_claude_md": true
      }
    ]
  },
  "execution_plan": {
    "parallel_limit": 4,
    "estimated_modules": 25,
    "strategy": "layer-by-layer"
  }
}
```

## 使用示例

```
# 扫描当前项目
Skill("context-memory:module-discovery")

# 扫描指定目录
Skill("context-memory:module-discovery", path="src/")

# 自定义排除
Skill("context-memory:module-discovery",
  path=".",
  exclude_patterns=["vendor/", "generated/"]
)
```

## 验证清单

- [ ] sequential-thinking 规划已执行
- [ ] auggie-mcp 识别了项目类型
- [ ] 所有目录都计算了 depth
- [ ] 模块类型分类准确
- [ ] Layer 分组正确（3→2→1）
- [ ] modules.json 已生成
