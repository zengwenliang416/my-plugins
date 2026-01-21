# Context-Memory 插件重构计划

## 功能范围

参考实现包含 **两类独立功能**，需要全部实现：

### 功能 A: CLAUDE.md 更新（Claude Code 上下文）

**参考文件**: `update-full.md`, `update-related.md`

**目的**: 为每个模块生成/更新 CLAUDE.md，供 Claude Code 读取作为项目上下文

**输出位置**: 各模块目录下的 `CLAUDE.md` 文件

```
src/
├── CLAUDE.md          ← 模块上下文
├── auth/
│   ├── CLAUDE.md      ← 模块上下文
│   └── handlers/
│       └── CLAUDE.md  ← 模块上下文
└── utils/
    └── CLAUDE.md      ← 模块上下文
```

### 功能 B: 传统项目文档（API 文档、README）

**参考文件**: `docs-full-cli.md`

**目的**: 生成项目文档到独立目录，供人类阅读

**输出位置**: `.claude/memory/docs/{project}/`

```
.claude/memory/docs/{project}/
├── src/
│   ├── auth/
│   │   ├── API.md
│   │   └── README.md
│   └── utils/
│       └── README.md
├── README.md
├── ARCHITECTURE.md
└── EXAMPLES.md
```

---

## 问题诊断

### 当前实现问题

1. **直接启动大量并行任务** - 无用户确认步骤
2. **缺少分层处理** - 没有 Layer 3→2→1 的依赖顺序
3. **混淆两类功能** - 没有区分 CLAUDE.md 更新和项目文档生成
4. **缺少多模型协作 skill** - 参考实现通过 `ccw tool exec update_module_claude` 调用外部模型

### 参考实现的模型调用方式

参考实现使用 `update-module-claude.js` 封装了三种 CLI 工具：

```javascript
// 工具调用命令
gemini: `cat prompt.txt | gemini -m "gemini-2.5-flash" --yolo`;
qwen: `cat prompt.txt | qwen --yolo`;
codex: `codex --full-auto exec "$(cat prompt.txt)" -m "gpt5-codex" -s danger-full-access`;
```

**核心逻辑**：

1. 扫描目录结构，生成 prompt
2. 创建临时 prompt 文件
3. 管道传递给 CLI 工具
4. 在目标目录执行

---

## 共用核心架构

### 3-Layer 分层执行

| Layer          | Depth | 策略         | 上下文                         |
| -------------- | ----- | ------------ | ------------------------------ |
| Layer 3 (最深) | ≥3    | multi-layer  | `@**/*` 所有文件               |
| Layer 2 (中层) | 1-2   | single-layer | `@*/CLAUDE.md @*.{ts,tsx,...}` |
| Layer 1 (顶层) | 0     | single-layer | `@*/CLAUDE.md`                 |

**执行顺序**: Layer 3 → Layer 2 → Layer 1（自底向上）

### 工作流阶段

```
Phase 1: Discovery
├── 扫描目录结构
├── 分类模块类型 (code/navigation)
└── 智能过滤 (tests/build/config)
         ↓
Phase 2: Plan Presentation
├── 展示模块列表和层级分布
├── 显示执行策略 (<20: 直接并行 / ≥20: Agent 批处理)
└── 等待用户确认 (y/n)
         ↓
Phase 3: Layer-based Execution
├── 每层内部并行（最多 4 个）
└── 工具降级: gemini → codex
         ↓
Phase 4: Verification
└── 统计结果 + 显示结构
```

---

## 架构设计原则

### 🚨 核心原则：一个入口 + Skills 组合

1. **只有一个入口 command** (`memory.md`)，通过 `AskUserQuestion` 选择功能
2. **Skills 调用 MCP 工具**（auggie-mcp、LSP、sequential-thinking）
3. **Skills 可以调用其他 Skills**（组合模式）
4. **不新建额外的 command 文件**

### Skills 调用层次

```
memory.md (唯一入口 command)
    │
    ├── AskUserQuestion: 选择操作
    │
    ├── update-full 选项 ──→ Skill("context-memory:module-discovery")
    │                              ↓
    │                        Skill("context-memory:claude-updater") × N
    │
    ├── update-related 选项 ──→ Skill("context-memory:change-detector")
    │                              ↓
    │                        Skill("context-memory:claude-updater") × N
    │
    └── docs-full 选项 ──→ Skill("context-memory:doc-full-generator")
```

### MCP 工具集成（强制使用）

| MCP 工具              | 用途             | 使用场景                  |
| --------------------- | ---------------- | ------------------------- |
| `sequential-thinking` | 结构化分析和规划 | 🚨 每个 Skill 必用        |
| `auggie-mcp`          | 语义检索代码库   | 🚨 分析模块结构和依赖关系 |
| `LSP`                 | 符号级精准分析   | 获取函数/类/接口定义      |

---

## 实施计划

### 第一步：创建 module-discovery skill

**新建文件**: `plugins/context-memory/skills/module-discovery/SKILL.md`

**功能**: 扫描项目目录结构，按 Layer 分组模块

**MCP 工具集成**:

```markdown
## MCP 工具集成

| MCP 工具              | 用途                 | 触发条件        |
| --------------------- | -------------------- | --------------- |
| `sequential-thinking` | 结构化目录扫描策略   | 🚨 每次执行必用 |
| `auggie-mcp`          | 语义检索识别模块类型 | 智能过滤时      |

## 执行流程

### Step 0: sequential-thinking 规划

mcp**sequential-thinking**sequentialthinking({
thought: "规划目录扫描策略：1) 扫描目录树 2) 计算 depth 3) 智能过滤 4) 按 Layer 分组",
thoughtNumber: 1,
totalThoughts: 4,
nextThoughtNeeded: true
})

### Step 1: auggie-mcp 识别项目类型

mcp**auggie-mcp**codebase-retrieval(
information_request="识别项目类型和技术栈，确定需要过滤的目录（tests/build/config）"
)

### Step 2: 扫描目录结构

Glob + 计算 depth → 输出模块列表

### Step 3: 按 Layer 分组

- Layer 3: depth ≥ 3
- Layer 2: depth 1-2
- Layer 1: depth 0
```

**输出**: `${run_dir}/modules.json`

### 第二步：创建 change-detector skill

**新建文件**: `plugins/context-memory/skills/change-detector/SKILL.md`

**功能**: 检测 git 变更，识别需要更新的模块

**MCP 工具集成**:

```markdown
## MCP 工具集成

| MCP 工具              | 用途                   | 触发条件        |
| --------------------- | ---------------------- | --------------- |
| `sequential-thinking` | 结构化变更检测策略     | 🚨 每次执行必用 |
| `auggie-mcp`          | 语义分析变更影响范围   | 🚨 必须使用     |
| `LSP`                 | 获取变更文件的符号结构 | 代码文件变更时  |

## 执行流程

### Step 0: sequential-thinking 规划

mcp**sequential-thinking**sequentialthinking({
thought: "规划变更检测策略：1) git diff 获取变更 2) auggie-mcp 分析影响 3) LSP 获取符号 4) 识别父模块",
...
})

### Step 1: git diff 检测变更文件

Bash: git diff --name-only

### Step 2: auggie-mcp 分析变更影响

mcp**auggie-mcp**codebase-retrieval(
information_request="分析以下变更文件的影响范围：${changed_files}。识别受影响的模块和父模块。"
)

### Step 3: LSP 获取符号结构

LSP(operation="documentSymbol", filePath="${file}", ...)

### Step 4: 输出变更模块列表
```

**输出**: `${run_dir}/changed-modules.json`

### 第三步：创建 gemini-cli skill

**新建文件**: `plugins/context-memory/skills/gemini-cli/SKILL.md`

**功能**: 封装 `codeagent-wrapper gemini` 调用

**参考**: `plugins/ui-design/skills/gemini-cli/SKILL.md`

```markdown
## 参数

- module_path: 目标模块路径
- strategy: single-layer | multi-layer
- context: auggie-mcp 提供的代码结构分析

## 执行命令

~/.claude/bin/codeagent-wrapper gemini --role documentation --prompt "${prompt}"

## 与 ui-design/gemini-cli 的区别

| 维度   | ui-design/gemini-cli | context-memory/gemini-cli |
| ------ | -------------------- | ------------------------- |
| 用途   | UI 设计图片分析      | CLAUDE.md 文档生成        |
| 角色   | frontend/analyzer    | documentation             |
| 上下文 | 设计规格             | 代码结构（auggie-mcp）    |
```

### 第四步：创建 codex-cli skill

**新建文件**: `plugins/context-memory/skills/codex-cli/SKILL.md`

**功能**: Gemini 失败时的降级选项

```markdown
## 触发条件

- Gemini 调用失败（非零退出码）
- Gemini 输出为空

## 执行命令

~/.claude/bin/codeagent-wrapper codex --role documentation --prompt "${prompt}"
```

### 第五步：创建 claude-updater skill（编排层）

**新建文件**: `plugins/context-memory/skills/claude-updater/SKILL.md`

**功能**: 编排 gemini-cli / codex-cli + MCP 工具，生成单个模块的 CLAUDE.md

**🚨 核心设计**（MCP 工具集成）:

```markdown
## MCP 工具集成

| MCP 工具              | 用途                 | 触发条件        |
| --------------------- | -------------------- | --------------- |
| `sequential-thinking` | 结构化文档生成策略   | 🚨 每次执行必用 |
| `auggie-mcp`          | 语义检索模块代码结构 | 🚨 必须使用     |
| `LSP`                 | 获取符号定义和引用   | 发现代码文件时  |

## 执行流程

### Step 0: sequential-thinking 规划

mcp**sequential-thinking**sequentialthinking({
thought: "规划 CLAUDE.md 生成策略：1) auggie-mcp 分析代码结构 2) LSP 获取符号 3) 构建 prompt 4) 调用 Gemini/Codex 5) Claude 审查重构 6) 写入文件",
thoughtNumber: 1,
totalThoughts: 6,
nextThoughtNeeded: true
})

### Step 1: 🚨 auggie-mcp 分析模块结构

mcp**auggie-mcp**codebase-retrieval(
information_request="分析 ${module_path} 目录的代码结构：

1. 主要功能和职责
2. 导出的 API/接口
3. 依赖关系
4. 关键实现细节"
   )

### Step 2: 🚨 LSP 获取符号信息

对每个代码文件调用：
LSP(operation="documentSymbol", filePath="${file}", line=1, character=1)

### Step 3: 构建 prompt

基于 auggie-mcp 和 LSP 结果构建 prompt

### Step 4: 调用 Skill("context-memory:gemini-cli")

如果失败 → Skill("context-memory:codex-cli")

### Step 5: Claude 审查并重构输出

### Step 6: Write 写入 CLAUDE.md

## 降级链

gemini → codex
```

### 第六步：重构 doc-full-generator skill

**修改文件**: `plugins/context-memory/skills/doc-full-generator/SKILL.md`

**改动**:

- 添加 `sequential-thinking` 规划
- 添加 `auggie-mcp` 代码结构分析
- 添加 Phase 2 用户确认步骤
- 添加 3-Layer 分层执行
- 🚨 调用 `Skill("context-memory:gemini-cli")` 而非直接 Bash

### 第七步：更新 memory.md 入口

**修改文件**: `plugins/context-memory/commands/memory.md`

**改动**: 添加新选项到交互式选择，新选项通过调用对应 Skills 实现

```markdown
## 交互式选择

AskUserQuestion({
questions: [{
question: "请选择要执行的记忆管理操作：",
header: "操作类型",
options: [
{ label: "load - 加载上下文", description: "加载项目上下文" },
{ label: "compact - 压缩会话", description: "压缩当前会话" },
{ label: "code-map - 代码地图", description: "生成代码结构地图" },
{ label: "update-full - 全量更新 CLAUDE.md", description: "更新所有模块的 CLAUDE.md" }, ← 新增
{ label: "update-related - 增量更新 CLAUDE.md", description: "仅更新变更模块" }, ← 新增
{ label: "docs - 项目文档", description: "生成项目文档" }
]
}]
})

## 路由逻辑

### update-full

1. Skill("context-memory:module-discovery") # 扫描模块
2. AskUserQuestion: 确认执行计划
3. For each layer (3→2→1):
   For each module in layer:
   Skill("context-memory:claude-updater", module_path, strategy)
4. 验证结果

### update-related

1. Skill("context-memory:change-detector") # 检测变更
2. AskUserQuestion: 确认执行计划
3. For each changed module:
   Skill("context-memory:claude-updater", module_path, strategy)
4. 验证结果

### docs-full

1. Skill("context-memory:doc-full-generator")
```

---

## 关键文件清单

| 文件                                 | 操作     | 说明                            |
| ------------------------------------ | -------- | ------------------------------- |
| `skills/module-discovery/SKILL.md`   | **新建** | 目录扫描 + Layer 分组           |
| `skills/change-detector/SKILL.md`    | **新建** | Git 变更检测 + 影响分析         |
| `skills/gemini-cli/SKILL.md`         | **重写** | Gemini CLI 封装（文档生成专用） |
| `skills/codex-cli/SKILL.md`          | **重写** | Codex CLI 封装（降级）          |
| `skills/claude-updater/SKILL.md`     | **新建** | 编排层（MCP + Skills 组合）     |
| `skills/doc-full-generator/SKILL.md` | **重写** | 集成 MCP 工具                   |
| `commands/memory.md`                 | **修改** | 添加 update-full/update-related |

**不新建**：

- ~~commands/update-full.md~~ → 在 memory.md 中通过 Skills 实现
- ~~commands/update-related.md~~ → 在 memory.md 中通过 Skills 实现
- ~~scripts/\*.sh~~ → 用 MCP 工具替代

---

## 验证步骤

### 功能 A 验证 (CLAUDE.md 更新)

1. 执行 `/memory`
2. 选择 "update-full - 全量更新 CLAUDE.md"
3. 确认显示模块列表和层级分布（来自 module-discovery skill）
4. 确认提示用户确认 (y/n)
5. 确认按 Layer 3→2→1 顺序执行
6. 确认使用了 auggie-mcp 和 LSP 进行分析
7. 确认各模块目录下生成了 CLAUDE.md

### 功能 B 验证 (项目文档生成)

1. 执行 `/memory`
2. 选择 "docs - 项目文档"
3. 确认显示规划和确认步骤
4. 确认使用了 auggie-mcp 分析代码结构
5. 确认输出到 `.claude/memory/docs/{project}/`
