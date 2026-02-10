---
name: context-loader
description: |
  【触发条件】/memory load <task> 或需要加载项目上下文时
  【核心产出】${run_dir}/context.json - 结构化项目上下文
  【专属用途】
    - 分析任务描述提取关键词
    - 使用 auggie-mcp 语义检索相关代码
    - 调用 codex-cli/gemini-cli 深度分析
    - 生成结构化上下文 JSON
  【强制工具】auggie-mcp, Skill(codex-cli), Skill(gemini-cli)
  【不触发】已有有效上下文时
  【先问什么】默认先确认输入范围、输出格式与约束条件
  [Resource Usage] Use references/, assets/, scripts/ (`references/priority-rules.md`, `assets/context-schema.json`, `scripts/load-context.ts`).
allowed-tools:
  - mcp__auggie-mcp__codebase-retrieval
  - Skill
  - Write
  - Read
  - Glob
arguments:
  - name: task
    type: string
    required: true
    description: 任务描述
  - name: depth
    type: string
    default: "normal"
    description: 分析深度 (quick|normal|deep)
---

# Context Loader - 项目上下文加载

## Script Entry

```bash
npx tsx scripts/load-context.ts [output-file] [max-tokens]
```

## Resource Usage

- Retrieval rules: `references/priority-rules.md`
- Output schema: `assets/context-schema.json`
- Execution script: `scripts/load-context.ts`

## 执行流程

```
1. 接收任务描述
       │
       ▼
2. 提取关键词
   - 技术术语
   - 功能模块名
   - 文件/类/函数名
       │
       ▼
3. 语义检索 (auggie-mcp)
   mcp__auggie-mcp__codebase-retrieval
   - 输入: 关键词组合查询
   - 输出: 相关代码片段
       │
       ▼
4. 深度分析 (并行)
   ┌─────────────────────────────────────┐
   │ Skill("memory:codex-cli")           │
   │   → 代码结构分析                     │
   │   → 依赖关系图                       │
   ├─────────────────────────────────────┤
   │ Skill("memory:gemini-cli")          │
   │   → 功能摘要生成                     │
   │   → 使用建议                         │
   └─────────────────────────────────────┘
       │
       ▼
5. 合并输出
   - 结构化 JSON
   - 保存到 ${run_dir}/context.json
```

## 输出格式

```json
{
  "task": "原始任务描述",
  "keywords": ["keyword1", "keyword2"],
  "timestamp": "2024-01-20T08:00:00Z",
  "context": {
    "relevant_files": [
      {
        "path": "src/services/auth.ts",
        "relevance": 0.95,
        "summary": "用户认证服务"
      }
    ],
    "code_snippets": [
      {
        "file": "src/services/auth.ts",
        "start_line": 10,
        "end_line": 50,
        "content": "...",
        "purpose": "登录验证逻辑"
      }
    ],
    "dependencies": {
      "internal": ["src/utils/crypto.ts"],
      "external": ["jsonwebtoken", "bcrypt"]
    },
    "architecture": {
      "modules": ["auth", "user", "session"],
      "data_flow": "User → AuthService → SessionStore"
    }
  },
  "analysis": {
    "structure_summary": "...",
    "usage_suggestions": ["..."],
    "potential_issues": ["..."]
  },
  "metadata": {
    "depth": "normal",
    "files_scanned": 15,
    "analysis_time_ms": 3500
  }
}
```

## 分析深度

### quick (快速)

```
- 仅关键词匹配
- 前 5 个相关文件
- 无深度分析
- 适用: 简单查询
```

### normal (标准)

```
- 语义检索
- 前 10 个相关文件
- 单模型分析
- 适用: 一般任务
```

### deep (深度)

```
- 语义检索 + 结构分析
- 所有相关文件
- 双模型并行分析
- 适用: 复杂任务
```

## 关键词提取策略

```
任务描述: "修复用户登录时的 JWT token 过期处理"

提取结果:
- 技术术语: JWT, token, 过期
- 功能模块: 登录, 用户
- 动作: 修复, 处理

组合查询:
1. "JWT token 过期处理"
2. "用户登录验证"
3. "token refresh"
```

## 降级策略

```
auggie-mcp 不可用时:
├── 降级到 Grep + Glob
├── 使用关键词直接搜索
└── 输出质量警告

codex-cli/gemini-cli 不可用时:
├── 跳过深度分析
├── 仅返回检索结果
└── 标记 analysis 为 null
```

## 使用示例

```
# 标准加载
/memory load "分析用户认证模块"

# 快速加载
/memory load "查找 API 路由" --mode partial

# 深度加载
/memory load "重构支付系统" --mode full
```
