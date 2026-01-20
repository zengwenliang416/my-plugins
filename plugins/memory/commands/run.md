---
name: memory
description: |
  项目记忆管理系统 - 支持上下文加载、会话压缩、代码地图、技能记忆、文档管理和技术规则生成
arguments:
  - name: subcommand
    type: string
    required: true
    description: |
      子命令:
        load <task>         - 加载项目上下文
        compact             - 压缩当前会话
        code-map <feature>  - 生成代码地图
        skill-index [path]  - 生成 SKILL 索引
        skill-load [name]   - 加载技能文档
        workflow <id|all>   - 工作流记忆
        style <package>     - 样式记忆
        docs [path]         - 文档规划
        docs-full [path]    - 完整文档生成
        docs-related [path] - 相关文档生成
        update-full [path]  - 全量更新
        update-related      - 增量更新
        swagger [path]      - API 文档生成
        tech-rules <stack>  - 技术规则生成
  - name: --tool
    type: string
    required: false
    description: 指定 AI 工具 (gemini|codex)
  - name: --regenerate
    type: boolean
    required: false
    description: 强制重新生成
  - name: --mode
    type: string
    required: false
    description: 执行模式 (full|partial)
---

# Memory - 项目记忆管理

## 命令路由

根据子命令调用对应的 Skill。

### 上下文管理

```
load <task>  →  Skill("memory:context-loader", task="$task")
compact      →  Skill("memory:session-compactor")
```

### 代码地图

```
code-map <feature>  →  Skill("memory:code-map-generator", feature="$feature")
```

### 技能记忆

```
skill-index [path]     →  Skill("memory:skill-indexer", path="$path")
skill-load [name]      →  Skill("memory:skill-loader", name="$name")
workflow <id|all>      →  Skill("memory:workflow-memory", session="$id")
style <package>        →  Skill("memory:style-memory", package="$package")
```

### 文档管理

```
docs [path]          →  Skill("memory:doc-planner", path="$path")
docs-full [path]     →  Skill("memory:doc-full-generator", path="$path")
docs-related [path]  →  Skill("memory:doc-related-generator", path="$path")
update-full [path]   →  Skill("memory:doc-full-updater", path="$path")
update-related       →  Skill("memory:doc-incremental-updater")
```

### API/规则

```
swagger [path]       →  Skill("memory:swagger-generator", path="$path")
tech-rules <stack>   →  Skill("memory:tech-rules-generator", stack="$stack")
```

## 执行流程

```
1. 解析子命令和参数
       │
       ▼
2. 验证参数有效性
       │
       ▼
3. 路由到对应 Skill
   ┌───────────────────────────────────────┐
   │ load       → context-loader           │
   │ compact    → session-compactor        │
   │ code-map   → code-map-generator       │
   │ skill-*    → skill-indexer/loader     │
   │ workflow   → workflow-memory          │
   │ style      → style-memory             │
   │ docs*      → doc-* generators         │
   │ update-*   → doc-* updaters           │
   │ swagger    → swagger-generator        │
   │ tech-rules → tech-rules-generator     │
   └───────────────────────────────────────┘
       │
       ▼
4. 传递 --tool 参数 (如指定)
       │
       ▼
5. 返回 Skill 执行结果
```

## 通用参数处理

### --tool 参数

指定底层 AI 工具：

- `gemini` - 使用 Gemini CLI (文档生成优先)
- `codex` - 使用 Codex CLI (代码分析优先)

未指定时根据任务类型自动选择。

### --regenerate 参数

强制重新生成，跳过缓存和已存在检查。

### --mode 参数

- `full` - 完整执行，处理所有内容
- `partial` - 部分执行，仅处理变更

## 使用示例

```bash
# 加载项目上下文
/memory load "分析用户认证模块"

# 压缩当前会话
/memory compact

# 生成代码地图
/memory code-map "authentication"

# 生成 SKILL 索引
/memory skill-index plugins/memory/skills/

# 加载技能文档
/memory skill-load "codex-cli"

# 工作流记忆
/memory workflow WFS-20240120
/memory workflow all

# 样式记忆
/memory style "design-system"

# 文档规划
/memory docs src/

# 完整文档生成
/memory docs-full src/

# 相关文档生成
/memory docs-related src/services/

# 全量文档更新
/memory update-full src/

# 增量文档更新
/memory update-related

# API 文档生成
/memory swagger src/api/

# 技术规则生成
/memory tech-rules typescript
/memory tech-rules "react+typescript"
```

## 错误处理

```
1. 未知子命令
   → 显示帮助信息

2. 缺少必需参数
   → 提示缺少的参数

3. Skill 执行失败
   → 显示错误信息
   → 建议降级方案
```

## 多模型协作

部分子命令会触发多模型并行执行：

| 子命令     | 模型组合               |
| ---------- | ---------------------- |
| load       | codex-cli + gemini-cli |
| code-map   | codex-cli              |
| docs-full  | codex-cli + gemini-cli |
| tech-rules | exa + codex-cli        |

详见各 Skill 的 SKILL.md 文档。
