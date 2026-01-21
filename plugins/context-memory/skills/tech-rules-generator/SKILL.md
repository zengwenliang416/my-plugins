---
name: tech-rules-generator
description: |
  【触发条件】/memory tech-rules <stack> 或需要生成技术规则时
  【核心产出】.claude/rules/{stack}.md - 技术栈专属规则文件
  【专属用途】
    - 搜索最佳实践 (exa)
    - 分析项目现有规范
    - 生成技术栈规则文档
    - 集成到 Claude 上下文
  【强制工具】Skill(exa), Skill(codex-cli)
  【不触发】规则已存在且最新时
allowed-tools:
  - Skill
  - Read
  - Write
  - Glob
arguments:
  - name: stack
    type: string
    required: true
    description: 技术栈标识 (如 typescript, react, nestjs)
  - name: include_project
    type: boolean
    default: true
    description: 是否包含项目现有规范分析
  - name: regenerate
    type: boolean
    default: false
    description: 强制重新生成
---

# Tech Rules Generator - 技术规则生成器

## 执行流程

```
1. 解析技术栈
   - 单一: "typescript"
   - 组合: "react+typescript"
   - 框架: "nestjs" (隐含 typescript)
       │
       ▼
2. 搜索最佳实践 (exa)
   Skill("memory:exa", category="best-practices")
   - 官方文档
   - 社区最佳实践
   - 2024 年趋势
       │
       ▼
3. 分析项目现有规范 (可选)
   Skill("memory:codex-cli", prompt="project_conventions")
   - 代码风格
   - 命名约定
   - 目录结构
       │
       ▼
4. 生成规则文档
   - 合并外部最佳实践
   - 整合项目现有规范
   - 结构化 Markdown
       │
       ▼
5. 输出到 .claude/rules/
```

## 技术栈映射

### 单一技术栈

```
typescript → TypeScript 编码规则
javascript → JavaScript 编码规则
python     → Python 编码规则
go         → Go 编码规则
rust       → Rust 编码规则
```

### 框架技术栈

```
react      → React + JavaScript/TypeScript
vue        → Vue.js + JavaScript/TypeScript
angular    → Angular + TypeScript
nextjs     → Next.js + React + TypeScript
nestjs     → NestJS + TypeScript
express    → Express + Node.js
fastapi    → FastAPI + Python
```

### 组合技术栈

```
"react+typescript"     → React 规则 + TypeScript 规则
"nestjs+postgresql"    → NestJS 规则 + PostgreSQL 规则
"nextjs+prisma+trpc"   → Next.js + Prisma + tRPC 规则
```

## Exa 搜索策略

### 搜索查询模板

```
技术栈: typescript

查询 1: "TypeScript best practices 2024 production"
查询 2: "TypeScript coding standards enterprise"
查询 3: "TypeScript style guide official"
```

### 信息提取

```
从搜索结果提取:
├── 命名约定
├── 文件组织
├── 类型使用
├── 错误处理
├── 性能优化
├── 安全实践
└── 测试规范
```

## 输出格式

### .claude/rules/{stack}.md

```markdown
---
name: typescript-rules
version: 1.0.0
generated: 2024-01-20T08:00:00Z
stack: typescript
sources:
  - official: https://www.typescriptlang.org/docs/
  - community: https://typescript-eslint.io/
---

# TypeScript 编码规则

## 概述

本规则文件定义了 TypeScript 项目的编码规范和最佳实践。

## 类型系统

### 严格模式

始终启用严格模式:

\`\`\`json
{
"compilerOptions": {
"strict": true,
"noImplicitAny": true,
"strictNullChecks": true
}
}
\`\`\`

### 类型声明

**推荐:**

\`\`\`typescript
// 明确的类型声明
interface User {
id: string;
name: string;
email: string;
}

// 使用 type 用于联合类型
type Status = "pending" | "active" | "inactive";

// 使用 interface 用于对象结构
interface ApiResponse<T> {
data: T;
error?: string;
}
\`\`\`

**避免:**

\`\`\`typescript
// ❌ 避免 any
const data: any = fetchData();

// ❌ 避免隐式 any
function process(item) {
return item.value;
}
\`\`\`

## 命名约定

| 类型     | 约定        | 示例                       |
| -------- | ----------- | -------------------------- |
| 类       | PascalCase  | UserService, AuthGuard     |
| 接口     | PascalCase  | UserRepository, ILogger    |
| 函数     | camelCase   | getUserById, validateInput |
| 变量     | camelCase   | userName, isActive         |
| 常量     | UPPER_SNAKE | MAX_RETRY, API_BASE_URL    |
| 枚举     | PascalCase  | UserRole, HttpStatus       |
| 枚举成员 | PascalCase  | UserRole.Admin             |
| 文件     | kebab-case  | user-service.ts            |
| 目录     | kebab-case  | auth-module/               |

## 文件组织

\`\`\`
src/
├── modules/ # 业务模块
│ ├── user/
│ │ ├── user.service.ts
│ │ ├── user.controller.ts
│ │ ├── user.repository.ts
│ │ ├── user.dto.ts
│ │ └── user.types.ts
│ └── auth/
├── shared/ # 共享代码
│ ├── utils/
│ ├── types/
│ └── constants/
├── config/ # 配置
└── index.ts # 入口
\`\`\`

## 错误处理

\`\`\`typescript
// 自定义错误类
class AppError extends Error {
constructor(
public code: string,
message: string,
public statusCode: number = 500
) {
super(message);
this.name = "AppError";
}
}

// 使用 Result 类型
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

function parseJson<T>(json: string): Result<T> {
try {
return { ok: true, value: JSON.parse(json) };
} catch (e) {
return { ok: false, error: e as Error };
}
}
\`\`\`

## 异步处理

\`\`\`typescript
// ✅ 使用 async/await
async function fetchUser(id: string): Promise<User> {
const response = await fetch(\`/api/users/\${id}\`);
if (!response.ok) {
throw new AppError("FETCH_FAILED", "Failed to fetch user", response.status);
}
return response.json();
}

// ✅ 并行请求
const [users, roles] = await Promise.all([fetchUsers(), fetchRoles()]);
\`\`\`

## 项目特定规范

<!-- 以下内容基于项目代码分析生成 -->

### 现有约定

{PROJECT_CONVENTIONS}

### 推荐调整

{RECOMMENDATIONS}
```

## 项目规范分析

### Codex CLI 分析提示

```
分析项目代码，识别以下规范:

1. 命名约定
   - 文件命名模式
   - 变量/函数命名风格
   - 类/接口命名风格

2. 代码组织
   - 目录结构模式
   - 模块划分方式
   - 导入/导出风格

3. 代码风格
   - 缩进 (spaces/tabs)
   - 引号风格 (single/double)
   - 分号使用

4. 模式使用
   - 设计模式
   - 错误处理模式
   - 状态管理模式

输出格式: Markdown 章节
```

## 使用示例

```bash
# 生成 TypeScript 规则
/memory tech-rules typescript

# 生成组合技术栈规则
/memory tech-rules "react+typescript"

# 不包含项目分析
/memory tech-rules nestjs --no-include-project

# 强制重新生成
/memory tech-rules typescript --regenerate
```

## 输出位置

```
.claude/rules/
├── typescript.md
├── react.md
├── nestjs.md
└── index.json         # 规则索引
```

## 规则索引

```json
// .claude/rules/index.json
{
  "rules": [
    {
      "stack": "typescript",
      "path": "typescript.md",
      "generated": "2024-01-20T08:00:00Z",
      "sources": ["official", "eslint-config"]
    },
    {
      "stack": "react",
      "path": "react.md",
      "generated": "2024-01-19T10:00:00Z",
      "sources": ["official", "react-typescript-cheatsheet"]
    }
  ],
  "last_updated": "2024-01-20T08:00:00Z"
}
```

## 降级策略

```
exa 搜索失败:
├── 使用内置规则模板
├── 仅基于项目分析生成
└── 标记需要补充外部资源

codex-cli 分析失败:
├── 跳过项目规范部分
├── 仅使用外部最佳实践
└── 标记需要手动补充
```

## 与其他 Skills 的关系

```
tech-rules-generator
    │
    ├── 使用 exa 搜索最佳实践
    ├── 使用 codex-cli 分析项目
    │
    └── 输出规则供 Claude 会话使用
        └── 可被 skill-loader 加载到上下文
```
