---
name: codebase-navigator
description: |
  【触发条件】当用户需要理解陌生代码库、接手新项目、定位特定功能、理解系统架构时使用。
  【核心产出】输出：项目结构图、技术栈分析、核心模块说明、数据流图。
  【不触发】不用于：代码修改（先理解后实现）、Bug 定位（改用 bug-hunter）。
  【先问什么】若缺少：项目路径、关注的模块或功能，先提问补齐。
allowed-tools: Read, Grep, Glob, Bash, mcp__serena__list_dir, mcp__serena__find_file, mcp__serena__get_symbols_overview, mcp__serena__find_symbol, mcp__serena__find_referencing_symbols, mcp__serena__search_for_pattern
---

# Codebase Navigator - 代码库导航器

## 概述

帮助快速建立对陌生代码库的认知地图，理解项目结构、技术栈、核心模块和数据流向。

## 分析框架

### 1. 项目识别

首先识别项目类型和技术栈：

| 标识文件                          | 项目类型           |
| --------------------------------- | ------------------ |
| package.json                      | Node.js / 前端项目 |
| requirements.txt / pyproject.toml | Python 项目        |
| go.mod                            | Go 项目            |
| Cargo.toml                        | Rust 项目          |
| pom.xml / build.gradle            | Java 项目          |
| Gemfile                           | Ruby 项目          |

### 2. 目录结构分析

**标准 Web 应用结构**

```
project/
├── src/                    # 源代码
│   ├── components/         # UI 组件
│   ├── pages/ or routes/   # 页面/路由
│   ├── services/           # 业务逻辑
│   ├── models/             # 数据模型
│   ├── utils/              # 工具函数
│   └── config/             # 配置
├── tests/                  # 测试
├── public/ or static/      # 静态资源
└── docs/                   # 文档
```

**标准 ML 项目结构**

```
project/
├── src/
│   ├── data/               # 数据加载
│   ├── models/             # 模型定义
│   ├── training/           # 训练逻辑
│   └── evaluation/         # 评估
├── configs/                # 配置文件
├── scripts/                # 脚本
├── notebooks/              # Jupyter notebooks
└── experiments/            # 实验结果
```

### 3. 入口点定位

**常见入口文件**

- `main.{ts,js,py,go}` - 主入口
- `index.{ts,js}` - 模块入口
- `app.{ts,js,py}` - 应用入口
- `server.{ts,js,py}` - 服务入口
- `__main__.py` - Python 包入口

**配置入口**

- `.env` / `.env.example` - 环境变量
- `config/` 目录 - 配置文件
- `settings.{py,json,yaml}` - 设置

### 4. 核心模块识别

**识别关键词**

- `controller` / `handler` - 请求处理
- `service` - 业务逻辑
- `repository` / `dao` - 数据访问
- `model` / `entity` - 数据模型
- `middleware` - 中间件
- `util` / `helper` - 工具函数

### 5. 数据流追踪

```
请求 → 路由 → 中间件 → 控制器 → 服务 → 数据访问 → 数据库
                              ↓
                            响应
```

## 分析步骤

### 步骤 1：快速扫描

```bash
# 查看根目录结构
ls -la

# 查看 src 目录结构
find src -type f -name "*.ts" | head -20

# 查找入口文件
find . -name "main.*" -o -name "index.*" -o -name "app.*"
```

### 步骤 2：依赖分析

```bash
# Node.js
cat package.json | jq '.dependencies, .devDependencies'

# Python
cat requirements.txt
cat pyproject.toml
```

### 步骤 3：核心代码定位

```bash
# 查找路由定义
grep -r "router\|route\|@Get\|@Post" --include="*.ts"

# 查找服务类
grep -r "class.*Service" --include="*.ts"

# 查找模型定义
grep -r "class.*Model\|interface.*Entity" --include="*.ts"
```

### 步骤 4：调用链追踪

从入口开始，逐层追踪：

1. 路由 → 哪个 Controller 处理？
2. Controller → 调用哪些 Service？
3. Service → 访问哪些数据？

## 输出格式

```markdown
## 项目分析报告

### 基本信息

- **项目名称**：
- **技术栈**：
- **项目类型**：[Web应用/API服务/CLI工具/库/ML项目]

### 目录结构
```

[目录树]

```

### 核心模块
| 模块 | 路径 | 职责 |
|-----|------|-----|
| ... | ... | ... |

### 入口点
- **主入口**：
- **配置入口**：
- **路由入口**：

### 核心数据流
```

[数据流图]

```

### 外部依赖
- **数据库**：
- **缓存**：
- **第三方服务**：

### 关键文件清单
| 文件 | 说明 |
|-----|------|
| ... | ... |

### 建议阅读顺序
1. [文件1] - 理解入口
2. [文件2] - 理解核心逻辑
3. ...
```

## 使用示例

```
分析这个项目的整体架构，我刚接手需要快速上手。

用户登录功能的完整调用链是什么？从前端到数据库。

这个项目中处理订单的代码在哪里？

帮我绘制这个项目的模块依赖关系图。
```

## 常见框架结构参考

### Next.js

- `pages/` 或 `app/` - 路由
- `components/` - 组件
- `lib/` 或 `utils/` - 工具
- `api/` - API 路由

### NestJS

- `*.module.ts` - 模块定义
- `*.controller.ts` - 控制器
- `*.service.ts` - 服务
- `*.entity.ts` - 实体

### FastAPI

- `routers/` - 路由
- `services/` - 业务逻辑
- `models/` - Pydantic 模型
- `crud/` - 数据库操作

### PyTorch 项目

- `models/` - 模型定义
- `data/` - 数据集
- `train.py` - 训练脚本
- `configs/` - 配置
