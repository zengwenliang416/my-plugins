---
name: api-designer
description: |
  【触发条件】当用户要求设计 RESTful API、生成 OpenAPI 文档、创建接口代码时使用。
  【核心产出】输出：OpenAPI 3.0 规范文档、API 代码骨架、接口设计文档。
  【不触发】不用于：前端开发（改用 frontend-design）、数据库设计（改用 db-migration-helper）。
  【先问什么】若缺少：API 用途、资源模型、技术栈框架，先提问补齐。
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, mcp__serena__find_symbol, mcp__serena__get_symbols_overview, mcp__serena__search_for_pattern, mcp__serena__list_dir, mcp__context7__resolve-library-id, mcp__context7__get-library-docs, mcp__codex__codex, mcp__exa__get_code_context_exa
---

# API Designer - RESTful API 设计助手

## 能力概述

- 设计符合 RESTful 规范的 API
- 生成 OpenAPI 3.0 规范文档
- 根据不同框架生成 API 代码
- 验证 API 设计合规性

## 可用脚本

### 1. OpenAPI 生成器

```bash
# 从模板生成 OpenAPI 规范
python ~/.claude/skills/api-designer/scripts/openapi-generator.py \
  --resource users \
  --operations list,get,create,update,delete \
  --output ./api/openapi.yaml

# 分析现有代码生成规范
python ~/.claude/skills/api-designer/scripts/openapi-generator.py \
  --scan ./src/routes \
  --framework express \
  --output ./api/openapi.yaml
```

### 2. API 代码脚手架

```bash
# 生成 Express 路由
bash ~/.claude/skills/api-designer/scripts/route-scaffold.sh \
  --resource products \
  --framework express \
  --output ./src/routes

# 生成 FastAPI 路由
bash ~/.claude/skills/api-designer/scripts/route-scaffold.sh \
  --resource products \
  --framework fastapi \
  --output ./src/api
```

### 3. API 验证器

```bash
# 验证 OpenAPI 规范
python ~/.claude/skills/api-designer/scripts/validate-api.py \
  --spec ./api/openapi.yaml

# 检查实现与规范一致性
python ~/.claude/skills/api-designer/scripts/validate-api.py \
  --spec ./api/openapi.yaml \
  --impl ./src/routes
```

## MCP 工具使用

### serena 工具

- `find_symbol`: 查找现有 API 处理函数
- `get_symbols_overview`: 分析路由文件结构
- `search_for_pattern`: 搜索 API 端点定义

### context7 工具

- 查询 Express/NestJS/FastAPI 官方文档
- 获取 OpenAPI 规范说明

### codex 工具

- 协作设计复杂 API
- 审查 API 设计决策

## 参考文档

- `restful-conventions.md` - RESTful 设计规范
- `error-codes.md` - 标准错误码定义
- `openapi-template.yaml` - OpenAPI 模板

## 工作流程

### 1. 需求分析

确定 API 目标：

- 资源定义（名词复数）
- 操作类型 (CRUD/自定义操作)
- 认证需求 (JWT/OAuth/API Key)
- 分页/过滤/排序需求
- 特殊业务逻辑

### 2. 设计阶段

- 定义资源 URL 结构
- 设计请求/响应格式
- 规划错误处理
- 编写 OpenAPI 规范

### 3. 代码生成

根据项目技术栈生成：

- 路由/Controller 代码
- DTO/Schema 定义
- 验证中间件
- 错误处理器

### 4. 验证交付

- 检查 OpenAPI 规范有效性
- 验证代码与规范一致性
- 生成 API 文档

## RESTful 速查

| 方法   | 路径           | 用途     | 响应码  |
| ------ | -------------- | -------- | ------- |
| GET    | /resources     | 列表     | 200     |
| GET    | /resources/:id | 详情     | 200/404 |
| POST   | /resources     | 创建     | 201/400 |
| PUT    | /resources/:id | 完整更新 | 200/404 |
| PATCH  | /resources/:id | 部分更新 | 200/404 |
| DELETE | /resources/:id | 删除     | 204/404 |

## 命名约定

- URL: kebab-case (`/user-profiles`)
- Query: camelCase (`?pageSize=10`)
- Body: camelCase (`{ "firstName": "John" }`)
- Header: Train-Case (`X-Request-Id`)
