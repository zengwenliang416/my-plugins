# Dependency Analysis Reference

## 依赖追踪

### 追踪方向

| 方向 | 说明         | 用途             |
| ---- | ------------ | ---------------- |
| 向下 | 该模块依赖谁 | 理解模块需要什么 |
| 向上 | 谁依赖该模块 | 理解模块影响范围 |
| 双向 | 完整依赖图   | 全面文档覆盖     |

### 深度控制

```
depth = 1: 仅直接依赖
depth = 2: 直接 + 间接一层
depth = 3: 完整依赖链（推荐）
```

## 依赖分类

### 内部依赖

```json
{
  "path": "src/utils/jwt.ts",
  "type": "internal",
  "usage": ["signToken", "verifyToken"]
}
```

### 外部依赖

```json
{
  "path": "jsonwebtoken",
  "type": "external",
  "usage": ["sign", "verify"]
}
```

## 文档范围决策

### 必须生成

1. 入口模块文档
2. 直接依赖的内部模块
3. 直接依赖者的模块

### 可选生成

1. 间接依赖 (depth > 1)
2. 外部依赖说明
3. 测试文档 (--include_tests)

### 跳过

1. node_modules 内容
2. 类型定义文件 (\*.d.ts)
3. 配置文件
4. 已有最新文档的模块

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

## 关联链接

### 文档内链接

```markdown
## Dependencies

- [JWT Utilities](./dependencies/jwt.md)
- [User Model](./dependencies/user-model.md)

## Usage

- [Auth Routes](./usage/auth-routes.md)
```

### 跨文档引用

```markdown
For details, see [Auth Service](../auth.md).
```
