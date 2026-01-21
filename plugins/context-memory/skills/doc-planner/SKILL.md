---
name: doc-planner
description: |
  【触发条件】/memory docs [path] 或需要规划文档结构时
  【核心产出】.claude/memory/docs/plan.json - 文档规划文件
  【专属用途】
    - 分析代码结构确定文档需求
    - 生成文档大纲和优先级
    - 识别缺失文档
    - 规划文档生成顺序
  【强制工具】Skill(codex-cli), Glob
  【不触发】已有完整文档规划时
allowed-tools:
  - Skill
  - Glob
  - Read
  - Write
arguments:
  - name: path
    type: string
    required: false
    default: "."
    description: 分析目录路径
  - name: scope
    type: string
    default: "full"
    description: 规划范围 (full|api|components|guides)
---

# Doc Planner - 文档规划器

## 执行流程

```
1. 扫描代码结构
   Glob("**/*.{ts,js,py,go,java}")
   - 识别模块边界
   - 识别公共接口
       │
       ▼
2. 分析现有文档
   Glob("**/*.md", "**/docs/**")
   - 识别已有文档
   - 检测过时文档
       │
       ▼
3. 使用 codex-cli 分析
   Skill("memory:codex-cli", prompt="doc_needs")
   - 评估代码复杂度
   - 识别文档需求
   - 确定优先级
       │
       ▼
4. 生成文档规划
   - 文档树结构
   - 生成顺序
   - 依赖关系
       │
       ▼
5. 输出规划文件
   .claude/memory/docs/plan.json
```

## 输出格式

### plan.json

```json
{
  "version": "1.0",
  "generated": "2024-01-20T08:00:00Z",
  "project_root": "/path/to/project",
  "scope": "full",
  "summary": {
    "total_files": 150,
    "documented": 45,
    "needs_doc": 105,
    "outdated": 12,
    "coverage": "30%"
  },
  "documents": [
    {
      "id": "doc-001",
      "type": "api",
      "path": "docs/api/auth.md",
      "title": "认证 API 文档",
      "source_files": ["src/services/auth.ts", "src/routes/auth.ts"],
      "priority": "high",
      "status": "missing",
      "estimated_sections": ["Overview", "Endpoints", "Examples", "Errors"],
      "dependencies": [],
      "complexity": "medium"
    },
    {
      "id": "doc-002",
      "type": "guide",
      "path": "docs/guides/getting-started.md",
      "title": "快速开始指南",
      "source_files": [],
      "priority": "high",
      "status": "outdated",
      "estimated_sections": ["Installation", "Configuration", "First Steps"],
      "dependencies": ["doc-001"],
      "complexity": "low"
    }
  ],
  "structure": {
    "docs/": {
      "api/": ["auth.md", "users.md", "orders.md"],
      "guides/": ["getting-started.md", "deployment.md"],
      "reference/": ["config.md", "errors.md"],
      "README.md": null
    }
  },
  "generation_order": ["doc-001", "doc-003", "doc-002", "doc-004"],
  "metadata": {
    "analysis_time_ms": 2500,
    "files_scanned": 150,
    "existing_docs": 8
  }
}
```

## 文档类型识别

### API 文档

```
触发条件:
├── 文件包含路由定义 (router, controller)
├── 文件导出 REST endpoints
├── 文件包含 @api 或 @route 注释
└── 文件名匹配 *api*, *route*, *endpoint*

输出结构:
├── Overview
├── Authentication
├── Endpoints
│   ├── GET /resource
│   ├── POST /resource
│   └── ...
├── Request/Response Examples
└── Error Codes
```

### 组件文档

```
触发条件:
├── React/Vue/Angular 组件文件
├── 文件导出 UI 组件
├── 文件包含 props/state 定义
└── 文件名匹配 *.component.*, *.tsx

输出结构:
├── Overview
├── Props/API
├── Usage Examples
├── Variants
└── Accessibility
```

### 指南文档

```
触发条件:
├── 复杂业务逻辑模块
├── 集成点 (第三方服务)
├── 配置系统
└── 工作流/流程

输出结构:
├── Introduction
├── Prerequisites
├── Step-by-Step Guide
├── Troubleshooting
└── FAQ
```

## 优先级评估

### 评分维度

```
1. 代码复杂度 (1-5)
   - 函数数量
   - 依赖数量
   - 圈复杂度

2. 使用频率 (1-5)
   - 被引用次数
   - 公共接口数量

3. 变更频率 (1-5)
   - 最近提交次数
   - 作者数量

4. 现有文档状态 (1-5)
   - 缺失: 5
   - 过时: 4
   - 不完整: 3
   - 完整: 1
```

### 优先级计算

```javascript
function calculatePriority(doc) {
  const score =
    doc.complexity * 0.3 +
    doc.usage * 0.3 +
    doc.change_freq * 0.2 +
    doc.doc_status * 0.2;

  if (score > 4) return "critical";
  if (score > 3) return "high";
  if (score > 2) return "medium";
  return "low";
}
```

## 依赖分析

```
文档依赖关系:
├── API 文档 → 无依赖 (可独立生成)
├── 组件文档 → 可能依赖 API 文档
├── 指南文档 → 依赖相关 API/组件文档
└── 架构文档 → 依赖所有基础文档
```

## 生成顺序算法

```javascript
function calculateOrder(documents) {
  // 拓扑排序 + 优先级
  const sorted = topologicalSort(documents);
  return sorted.sort((a, b) => {
    // 同层级按优先级排序
    if (a.depth === b.depth) {
      return priorityValue(b.priority) - priorityValue(a.priority);
    }
    return a.depth - b.depth;
  });
}
```

## 使用示例

```bash
# 完整规划
/memory docs

# 指定目录
/memory docs src/

# 仅 API 文档
/memory docs --scope api

# 仅组件文档
/memory docs --scope components

# 仅指南
/memory docs --scope guides
```

## 输出位置

```
.claude/memory/docs/
├── plan.json           # 主规划文件
├── plan.backup.json    # 备份
└── analysis/
    ├── api-analysis.json
    ├── components-analysis.json
    └── coverage-report.md
```

## 与其他 Skills 的关系

```
doc-planner → plan.json
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
doc-full    doc-related   doc-incremental
generator   generator     updater

使用规划执行具体文档生成
```

## 降级策略

```
codex-cli 不可用时:
├── 使用静态分析
├── 基于文件名和目录结构推断
├── 生成基础规划
└── 标记 "simplified analysis"
```
