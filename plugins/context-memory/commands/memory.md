---
name: memory
description: |
  项目记忆管理系统 - 支持上下文加载、会话压缩、代码地图、技能记忆、文档管理和技术规则生成
arguments:
  - name: subcommand
    type: string
    required: false
    description: 子命令 (可选，不提供时交互式选择)
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

## 🚨 交互式入口（无参数时）

**如果用户未提供子命令，必须使用 AskUserQuestion 询问：**

```
AskUserQuestion({
  questions: [{
    question: "请选择要执行的记忆管理操作：",
    header: "操作类型",
    options: [
      { label: "load - 加载上下文", description: "加载项目上下文，支持任务描述" },
      { label: "compact - 压缩会话", description: "压缩当前会话，保留关键信息" },
      { label: "code-map - 代码地图", description: "生成代码结构和依赖关系地图" },
      { label: "claude-update - CLAUDE.md 更新", description: "为模块生成/更新 CLAUDE.md 上下文文件" },
      { label: "docs - 文档管理", description: "项目文档规划、生成和更新" }
    ],
    multiSelect: false
  }]
})
```

**如果用户选择 "claude-update - CLAUDE.md 更新"，继续询问：**

```
AskUserQuestion({
  questions: [{
    question: "请选择 CLAUDE.md 更新方式：",
    header: "更新方式",
    options: [
      { label: "claude-full - 全量更新", description: "更新所有模块的 CLAUDE.md (Layer 3→2→1)" },
      { label: "claude-related - 增量更新", description: "仅更新 git 变更相关的模块" }
    ],
    multiSelect: false
  }]
})
```

**如果用户选择 "docs - 文档管理"，继续询问：**

```
AskUserQuestion({
  questions: [{
    question: "请选择文档操作类型：",
    header: "文档操作",
    options: [
      { label: "docs - 文档规划", description: "分析并规划需要的文档" },
      { label: "docs-full - 完整生成", description: "生成完整的项目文档" },
      { label: "docs-related - 相关生成", description: "生成指定模块的相关文档" },
      { label: "docs-update-full - 全量更新", description: "更新所有项目文档" },
      { label: "docs-update-related - 增量更新", description: "仅更新变更相关的文档" },
      { label: "swagger - API 文档", description: "生成 OpenAPI/Swagger 文档" }
    ],
    multiSelect: false
  }]
})
```

**如果操作需要参数（如 load、code-map），继续询问参数值。**

---

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

### CLAUDE.md 更新（模块上下文）

```
claude-full [path]   →  执行以下流程:
                        1. Skill("context-memory:module-discovery", path="$path")
                           → 输出 modules.json (按 Layer 分组)
                        2. AskUserQuestion: 确认执行计划
                        3. For layer in [3, 2, 1]:
                             For module in layer:
                               Skill("context-memory:claude-updater",
                                     module_path=module.path,
                                     strategy=module.strategy)
                        4. 验证结果

claude-related       →  执行以下流程:
                        1. Skill("context-memory:change-detector")
                           → 输出 changed-modules.json
                        2. AskUserQuestion: 确认执行计划
                        3. For module in changed_modules:
                             Skill("context-memory:claude-updater",
                                   module_path=module.path,
                                   strategy=module.strategy)
                        4. 验证结果
```

### 项目文档管理

```
docs [path]               →  Skill("memory:doc-planner", path="$path")
docs-full [path]          →  Skill("memory:doc-full-generator", path="$path")
docs-related [path]       →  Skill("memory:doc-related-generator", path="$path")
docs-update-full [path]   →  Skill("memory:doc-full-updater", path="$path")
docs-update-related       →  Skill("memory:doc-incremental-updater")
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
   │ load         → context-loader         │
   │ compact      → session-compactor      │
   │ code-map     → code-map-generator     │
   │ claude-full  → module-discovery       │
   │                + claude-updater × N   │
   │ claude-related → change-detector      │
   │                  + claude-updater × N │
   │ skill-*      → skill-indexer/loader   │
   │ workflow     → workflow-memory        │
   │ style        → style-memory           │
   │ docs*        → doc-* generators       │
   │ swagger      → swagger-generator      │
   │ tech-rules   → tech-rules-generator   │
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

# 全量更新 CLAUDE.md (所有模块)
/memory claude-full src/

# 增量更新 CLAUDE.md (仅 git 变更)
/memory claude-related

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

| 子命令         | 模型组合                     |
| -------------- | ---------------------------- |
| load           | codex-cli + gemini-cli       |
| code-map       | codex-cli                    |
| claude-full    | gemini-cli (降级: codex-cli) |
| claude-related | gemini-cli (降级: codex-cli) |
| docs-full      | codex-cli + gemini-cli       |
| tech-rules     | context7/WebSearch + codex-cli |

详见各 Skill 的 SKILL.md 文档。
