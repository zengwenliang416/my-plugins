---
argument-hint: <type> <name> [--template=<template>] [--dry-run]
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, mcp__auggie-mcp__codebase-retrieval, AskUserQuestion
description: 脚手架生成 - 快速创建项目结构、模块模板、CRUD 骨架
---

# /ccg:scaffold - 脚手架生成

## Usage

```bash
/ccg:scaffold <type> <name> [--template=<template>] [--dry-run]
```

## Context

- **Type**: $1（必填，见下方类型表）
- **Name**: $2（必填，模块/组件/项目名称）
- **Template**: `--template` 指定模板（可选）
- **Dry Run**: `--dry-run` 仅预览，不实际创建

## 脚手架类型

### 项目级别

| Type            | Default Template     | Command                   |
| --------------- | -------------------- | ------------------------- |
| `project:next`  | `next-boilerplate`   | `npx degit ...`           |
| `project:react` | `vite-react`         | `npx create-vite ...`     |
| `project:vue`   | `vitesse`            | `npx degit ...`           |
| `project:nest`  | `nestjs-boilerplate` | `npx degit ...`           |
| `project:go`    | `go-gin-clean`       | `git clone --depth 1 ...` |
| `project:java`  | `ruoyi-vue-plus`     | `git clone --depth 1 ...` |
| `project:t3`    | `t3-turbo`           | `npx create-t3-turbo`     |

### 模块级别

| Type     | Output                                | Route |
| -------- | ------------------------------------- | ----- |
| `module` | Service + Controller + DTO            | Codex |
| `crud`   | Full CRUD (Create/Read/Update/Delete) | Codex |
| `api`    | API Endpoint + Types                  | Codex |

### 组件级别

| Type        | Output                    | Route  |
| ----------- | ------------------------- | ------ |
| `component` | Component + Styles + Test | Gemini |
| `page`      | Page + Route Config       | Gemini |
| `hook`      | Custom Hook + Test        | Auto   |

## 执行流程

### Phase 1: 类型识别

```bash
TYPE=$(echo "$1" | cut -d: -f1)   # project, module, component
SUBTYPE=$(echo "$1" | cut -d: -f2) # next, react, go
NAME="$2"
```

### Phase 2: 项目级别 - 模板克隆

**必须执行的步骤**:

1. **Clone**: `npx degit <repo> <name>` 或 `git clone --depth 1`
2. **Clean**: `rm -rf <name>/.git <name>/.gitee`
3. **Update**: 修改 package.json / pom.xml / go.mod 中的项目名
4. **Init**: `git init && git add . && git commit -m "chore: init"`
5. **Install**: 询问用户后安装依赖

### Phase 3: 模块/组件级别 - 模式分析

1. 使用 `mcp__auggie-mcp__codebase-retrieval` 分析项目模式
2. 智能路由到 Codex (后端) 或 Gemini (前端)
3. Claude 重构外部模型输出

### Phase 4: 预览确认

**Hard Stop**: 展示将创建的文件，等待确认

```markdown
## 即将创建:

📁 src/modules/user/
├── user.controller.ts (60 lines)
├── user.service.ts (45 lines)
├── user.dto.ts (15 lines)
└── user.test.ts (80 lines)

确认创建？[y/N]
```

### Phase 5: 生成与验证

1. 生成代码文件
2. 运行类型检查: `npx tsc --noEmit` 或 `go build ./...`

## 使用示例

```bash
# 项目级别
/ccg:scaffold project:next my-app
/ccg:scaffold project:go my-api
/ccg:scaffold project:java my-erp

# 模块级别
/ccg:scaffold crud User
/ccg:scaffold module Payment

# 组件级别
/ccg:scaffold component Button
/ccg:scaffold page Dashboard

# 预览模式
/ccg:scaffold module Order --dry-run
```

## 模板选择策略

```
用户需求 → 技术栈识别 → 模板匹配

"企业后台管理系统" → project:java (ruoyi-vue-plus)
"微服务架构" → project:java --template=ruoyi-cloud-plus
"电商网站" → project:next (next-enterprise)
"高性能 API" → project:go (go-fiber-clean)
"SaaS 产品" → project:monorepo (next-forge)
```

## 模板继承规则

生成代码时自动继承项目约定：

| Convention     | Detection      | Apply                |
| -------------- | -------------- | -------------------- |
| Naming         | Analyze files  | PascalCase/camelCase |
| Directory      | Scan src/      | Module location      |
| Import Style   | Analyze import | Absolute/Relative    |
| Test Framework | package.json   | Jest/Vitest/Mocha    |
| CSS Solution   | Detect deps    | Tailwind/Styled/CSS  |

## 安全检查

生成前自动检查：

- [ ] 目标路径不存在（避免覆盖）
- [ ] 命名符合项目约定
- [ ] 无循环依赖风险
- [ ] 模板来源可信

## 模板参考

完整的模板仓库列表和代码模板结构请参考：

- `commands/ccg/references/scaffold-templates.md`
