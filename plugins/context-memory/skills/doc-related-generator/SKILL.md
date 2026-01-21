---
name: doc-related-generator
description: |
  【触发条件】/memory docs-related [path] 或需要生成关联文档时
  【核心产出】指定模块的相关文档
  【专属用途】
    - 分析指定文件/模块的依赖
    - 生成相关联的文档集
    - 保持文档间引用一致性
  【强制工具】Skill(codex-cli), Skill(gemini-cli)
  【不触发】指定路径无效时
allowed-tools:
  - Skill
  - Read
  - Write
  - Glob
arguments:
  - name: path
    type: string
    required: true
    description: 源文件或目录路径
  - name: depth
    type: number
    default: 2
    description: 依赖追踪深度
  - name: include_tests
    type: boolean
    default: false
    description: 是否包含测试文档
---

# Doc Related Generator - 关联文档生成器

## 执行流程

```
1. 分析入口文件
   Read(path)
   - 识别模块类型
   - 提取导入/导出
       │
       ▼
2. 依赖追踪
   Skill("memory:codex-cli", prompt="dependency_trace")
   - 向上追踪: 被谁依赖
   - 向下追踪: 依赖谁
   - 深度: depth 层
       │
       ▼
3. 构建文档图
   ┌─────────────────────────────────┐
   │         [目标模块]              │
   │              │                  │
   │    ┌─────────┼─────────┐       │
   │    ▼         ▼         ▼       │
   │ [依赖1]  [依赖2]  [依赖3]      │
   │    │         │                  │
   │    ▼         ▼                  │
   │ [间接1]  [间接2]               │
   └─────────────────────────────────┘
       │
       ▼
4. 确定文档范围
   - 核心模块文档 (必须)
   - 直接依赖文档 (必须)
   - 间接依赖文档 (可选)
       │
       ▼
5. 生成文档集
   - 按依赖顺序生成
   - 保持引用一致性
   - 添加关联链接
```

## 依赖分析输出

```json
{
  "entry": "src/services/auth.ts",
  "module_type": "service",
  "dependencies": {
    "direct": [
      {
        "path": "src/utils/jwt.ts",
        "type": "internal",
        "usage": ["signToken", "verifyToken"]
      },
      {
        "path": "src/models/user.ts",
        "type": "internal",
        "usage": ["User", "UserSchema"]
      },
      {
        "path": "jsonwebtoken",
        "type": "external",
        "usage": ["sign", "verify"]
      }
    ],
    "indirect": [
      {
        "path": "src/config/index.ts",
        "depth": 2,
        "via": "src/utils/jwt.ts"
      }
    ]
  },
  "dependents": {
    "direct": [
      {
        "path": "src/routes/auth.ts",
        "usage": ["login", "logout", "refresh"]
      },
      {
        "path": "src/middleware/auth.ts",
        "usage": ["authenticateToken"]
      }
    ]
  }
}
```

## 文档范围决策

### 必须生成

```
1. 入口模块文档
2. 直接依赖的内部模块
3. 直接依赖者的模块
```

### 可选生成

```
1. 间接依赖 (depth > 1)
2. 外部依赖说明
3. 测试文档 (--include_tests)
```

### 跳过

```
1. node_modules 内容
2. 类型定义文件 (*.d.ts)
3. 配置文件
4. 已有最新文档的模块
```

## 输出结构

```
docs/related/{module_name}/
├── README.md           # 模块概述
├── {module}.md         # 主文档
├── dependencies/
│   ├── jwt.md
│   └── user-model.md
├── usage/
│   ├── auth-routes.md
│   └── auth-middleware.md
└── index.json          # 文档索引
```

## 关联链接生成

### 文档内链接

```markdown
## Dependencies

This module depends on:

- [JWT Utilities](./dependencies/jwt.md) - Token signing and verification
- [User Model](./dependencies/user-model.md) - User data structure

## Usage

This module is used by:

- [Auth Routes](./usage/auth-routes.md) - HTTP endpoints
- [Auth Middleware](./usage/auth-middleware.md) - Request authentication
```

### 跨文档引用

```markdown
<!-- In auth-routes.md -->

For authentication logic details, see [Auth Service](../auth.md).
```

## 使用示例

```bash
# 生成单文件相关文档
/memory docs-related src/services/auth.ts

# 生成目录相关文档
/memory docs-related src/services/

# 增加依赖深度
/memory docs-related src/services/auth.ts --depth 3

# 包含测试文档
/memory docs-related src/services/auth.ts --include-tests
```

## 增量更新支持

```
检测变更:
1. 比对源文件 hash
2. 识别新增/删除依赖
3. 仅更新受影响文档
4. 更新关联链接
```

## 与其他 Skills 的关系

```
doc-planner → 全局规划
                  │
                  ▼
doc-related-generator → 局部文档集
                  │
                  ├── 为 doc-full-generator 提供依赖信息
                  │
                  └── 触发 doc-incremental-updater 更新关联
```

## 降级策略

```
codex-cli 依赖分析失败:
├── 使用静态导入分析
├── 正则匹配 import/require
└── 生成简化依赖图

gemini-cli 文档生成失败:
├── 使用 codex-cli 降级
├── 生成技术性文档
└── 标记需要润色
```
