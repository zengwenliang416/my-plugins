# 开发准则（历史归档）

> ⚠️ **归档声明**
>
> 本文件为历史参考文档，**不作为规范依据**。
>
> 当前规范请参阅：
>
> - `CLAUDE.md` - 入口索引与硬约束
> - `workflows/mcp-tool-strategy.md` - MCP 工具规范
> - `workflows/multi-model-collaboration.md` - 多模型协作规范
> - `rules/` - 各类编码规则
>
> 本文件保留用于查阅历史上下文，但可能包含过时信息。

## 概览

本文件用于指导在当前仓库内进行的全部开发与文档工作,确保输出遵循强制性标准并保持可审计性。

### CLI 工具上下文协议

- **智能工具策略**(@~/.claude/workflows/intelligent-tools-strategy.md):在调用组合工具前先确认上下文注入顺序与冲突处理方式。
- **上下文搜索命令**(@~/.claude/workflows/context-search-strategy.md):按照既定查询模板管理检索结果,并回写引用来源。
- **MCP 工具策略**(@~/.claude/workflows/mcp-tool-strategy.md):明确每类 MCP 的触发条件、失败补救措施与记录要求。
- **多模型协作策略**(@~/.claude/workflows/multi-model-collaboration.md):明确 Claude+Codex+Gemini 多模型协作的5阶段工作流。

**上下文信息要求**

- 在编码前至少分析 3 个现有实现或模式,识别可复用的接口与约束。
- 绘制依赖与集成点,确认输入输出协议、配置与环境需求。
- 弄清现有测试框架、命名约定和格式化规则,确保输出与代码库保持一致。

## 🔧 MCP 工具集成规范

### 🎯 工具总览

本项目集成以下 MCP 工具和 Claude Code 内置工具,形成完整的开发工具链:

| 工具                    | 主要用途                     | 优先级    | 触发场景                                   |
| ----------------------- | ---------------------------- | --------- | ------------------------------------------ |
| **serena**              | 语义代码分析/编辑/内部检索   | P0 (最高) | 符号检索、代码编辑、架构分析、项目理解     |
| **codex**               | AI协作编码/原型生成/代码审查 | P0 (最高) | 复杂编码任务、需求分析、代码审查、质疑争辩 |
| **context7**            | 第三方库官方文档             | P0 (最高) | 引入/使用外部库时获取API文档               |
| **exa**                 | 外部代码示例和网络信息       | P1 (高)   | 需要代码示例、最佳实践、最新信息           |
| **ddg-search**          | 通用网络搜索                 | P1 (高)   | 最新信息、官方公告、breaking changes       |
| **banana-image**        | AI图像生成与编辑             | P2 (中)   | 图像生成、图像编辑、视觉内容创作           |
| **chrome-devtools**     | 浏览器调试与自动化           | P2 (中)   | 网页调试、DOM检查、性能分析、自动化测试    |
| **sequential-thinking** | 深度问题分析                 | 必须      | 任何需要深度思考的场景                     |
| **TodoWrite**           | 任务管理与进度跟踪           | 必须      | 复杂任务的分解、跟踪、验证                 |

### 📊 工具优先级决策矩阵

**信息检索层次**(按优先级排序):

1. **内部代码/文档** → `serena` (最优先,语义代码分析与检索)
2. **第三方库官方文档** → `context7` (库文档专用,准确性最高)
3. **代码示例/最佳实践** → `exa get_code_context` (编程任务相关)
4. **实时网络信息** → `exa web_search` / `ddg-search` (通用研究和最新动态)

**AI协作编码**:

- **codex**: 复杂编码任务的需求分析、原型生成、代码审查、质疑争辩(必须只读模式)

**问题分析与任务管理**:

- **sequential-thinking**: 任何需要深度分析的场景(必须最早使用)
- **TodoWrite**: 复杂任务的分解、跟踪和验证

### 🔄 标准工具链执行流程

```
┌─────────────────────────────────────────────────────┐
│ 1. sequential-thinking 深度分析问题                  │
│    └─ 识别关键疑问、风险点、技术选型                  │
└─────────────────┬───────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────┐
│ 2. 信息收集阶段(并行执行)                            │
│    ├─ serena: 检索内部代码/文档/模式(语义分析)       │
│    ├─ context7: 获取第三方库官方文档                 │
│    └─ exa/ddg-search: 补充外部代码示例和最新信息     │
└─────────────────┬───────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────┐
│ 3. codex 协作分析(复杂编码任务必须)                  │
│    ├─ 需求分析协同: 完善需求和实施计划               │
│    ├─ 代码原型索取: 获取 unified diff patch(只读)   │
│    ├─ 批判性重写: 基于原型重写为企业级代码           │
│    └─ 代码审查确认: 质疑争辩,优化改进                │
└─────────────────┬───────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────┐
│ 4. TodoWrite 任务规划与管理                          │
│    └─ 分解任务、跟踪进度、标记完成状态                │
└─────────────────────────────────────────────────────┘
```

### 🎯 工具使用决策树

```
需要深度分析?
  └─ Yes → sequential-thinking (必须)
      └─ 分析完成后,需要什么信息?
          ├─ 内部代码/文档 → serena (语义分析与检索)
          ├─ 第三方库文档 → context7
          ├─ 代码示例/最佳实践 → exa get_code_context
          └─ 最新信息/研究 → exa web_search / ddg-search

复杂编码任务?
  └─ Yes → codex 协作(必须执行4步骤)
      ├─ 步骤1: 需求分析协同
      ├─ 步骤2: 代码原型索取(只读)
      ├─ 步骤3: 批判性重写
      └─ 步骤4: 代码审查确认

复杂任务需要管理?
  └─ Yes → TodoWrite (必须)
```

### 📚 各工具详细使用规范

#### serena (语义代码分析与编辑)

**用途**: 项目内代码语义分析、符号检索、代码编辑、架构理解
**触发条件**:

- 查找内部代码实现和符号定义
- 分析代码结构和依赖关系
- 执行代码编辑和重构
- 理解项目架构

**核心方法**:

```bash
# 获取文件符号概览
mcp__serena__get_symbols_overview(relative_path="src/module.ts")

# 查找符号定义
mcp__serena__find_symbol(name_path_pattern="MyClass/method", include_body=true)

# 搜索代码模式
mcp__serena__search_for_pattern(
  substring_pattern="function.*auth",
  paths_include_glob="*.ts",
  restrict_search_to_code_files=true
)

# 查找符号引用
mcp__serena__find_referencing_symbols(name_path="MyClass", relative_path="src/module.ts")

# 替换符号体
mcp__serena__replace_symbol_body(name_path="MyClass/method", relative_path="src/module.ts", body="新代码")

# 列出目录
mcp__serena__list_dir(relative_path="src", recursive=false)

# 查找文件
mcp__serena__find_file(file_mask="*config*", relative_path=".")
```

**调用策略**:

- **理解阶段**: get_symbols_overview → 快速了解文件结构与顶层符号
- **定位阶段**: find_symbol (支持 name_path/substring_matching/include_kinds) → 精确定位
- **分析阶段**: find_referencing_symbols → 分析依赖关系与调用链
- **搜索阶段**: search_for_pattern (限定 paths_include_glob) → 复杂模式搜索
- **编辑阶段**: 优先符号级操作 (replace*symbol_body/insert*\*\_symbol)

**注意事项**:

- 始终限制 relative_path 到相关目录,避免全项目扫描
- 使用 paths_include_glob/paths_exclude_glob 精准过滤
- 优先于任何外部检索工具使用
- 搜索后调用 think_about_collected_information
- 编辑前调用 think_about_task_adherence

#### codex (AI协作编码与代码审查)

**用途**: AI 辅助的需求分析、代码原型生成、代码审查、质疑争辩
**详细规范**: 参见 @~/.claude/workflows/codex-collaboration-strategy.md

**核心理念**: CodeX 是你的**协作伙伴**而非**代码生成器**,通过相互质疑、共同求真的过程达成统一、全面、精准的意见。

**触发条件**(复杂编码任务):

- 涉及多文件修改的功能实现
- 架构设计和重构任务
- 不确定实现方案,需要方案对比
- 代码完成后的独立审查

**强制执行的4步协作流程**:

1. **需求分析协同**: 将需求和初步思路告知 codex,对比分析差异
2. **代码原型索取**: 强制 `sandbox="read-only"`,仅获取 unified diff patch
3. **批判性重写**: 以原型为参考,重写为企业级代码
4. **代码审查确认**: 编码完成后立即使用 codex 审查

**关键约束**:

- ⚠️ **必须使用** `sandbox="read-only"`,严禁 codex 直接修改代码
- codex 原型仅供逻辑参考,必须重写后才能实施
- 每次调用必须保存 `SESSION_ID` 用于会话追踪

**快速调用示例**:

> ⚠️ **已弃用**：下方 MCP 格式已过时，Codex 已迁移为 Skill。
> 请使用新的 CLI 调用方式，详见 `~/.claude/skills/codex-cli/SKILL.md`

```bash
# 新方式（推荐）
npx tsx ~/.claude/skills/codex-cli/scripts/codex_exec.ts \
  --cd /path/to/project \
  --prompt "[任务描述]"

# 旧方式（已弃用）
# mcp__codex__codex(PROMPT="...", cd="...", sandbox="read-only")
```

#### context7 (第三方库文档)

**用途**: 获取第三方库最新官方文档和 API 规范
**触发条件**:

- 引入新依赖前评估适配性
- 实现特定功能时查询 API 用法
- 升级依赖版本时对比变更
- 遇到库使用问题时查阅文档

**使用流程**(必须按顺序):

1. **库名称解析**: `resolve-library-id` 将库名转换为 Context7 ID
2. **文档获取**: `get-library-docs` 获取文档内容
3. **主题聚焦**(可选): 通过 `topic` 参数指定关注点

**调用规范**:

```bash
# 1. 解析库 ID
mcp__context7__resolve-library-id(libraryName="react")

# 2. 获取文档
mcp__context7__get-library-docs(
  context7CompatibleLibraryID="/facebook/react",
  topic="hooks",  # 可选,聚焦特定主题
  page=1          # 可选,分页参数,默认1
)
```

**强制要求**:

- 必须先调用 `resolve-library-id`,除非用户明确提供 `/org/project` 格式ID
- 获取的文档必须记录到 `.claude/` 目录
- 优先于搜索引擎结果使用官方文档

#### exa (外部代码示例和信息)

**用途**: 获取代码示例、最佳实践和最新网络信息

**两个核心方法**:

1. **get_code_context_exa** (代码示例和模式)
   - **触发条件**: 用户提及 "exa-code" 或需要代码示例
   - **用途**: 获取库/框架的代码示例和最佳实践
   - **tokensNum**: 1000-50000,默认5000

   ```bash
   mcp__exa__get_code_context_exa(
     query="React useState hook examples",
     tokensNum=5000  # 数字类型,1000-50000
   )
   ```

2. **web_search_exa** (实时网络信息)
   - **触发条件**: 需要最新信息、研究、实时动态
   - **用途**: 实时网络搜索并提取内容
   - **参数**:
     - `numResults`: 返回结果数量,默认8
     - `type`: 搜索类型 "auto"(默认)/"fast"/"deep"
     - `livecrawl`: "fallback"(默认)/"preferred"
   ```bash
   mcp__exa__web_search_exa(
     query="latest React 18 features",
     numResults=8,           # 默认8
     type="auto",            # auto/fast/deep
     livecrawl="fallback"    # fallback/preferred
   )
   ```

**优先级规则**:

- Context7 > exa: 第三方库文档优先用 Context7
- exa 用于补充代码示例和最新信息

#### ddg-search (DuckDuckGo 网络搜索)

**用途**: 通用网络搜索和内容获取

**两个核心方法**:

1. **search** (网络搜索)
   - **用途**: 通过 DuckDuckGo 进行网络搜索
   - **参数**: query(必需), max_results(默认10)

   ```bash
   mcp__ddg-search__search(
     query="Node.js best practices 2024",
     max_results=10
   )
   ```

2. **fetch_content** (内容获取)
   - **用途**: 获取并解析网页内容
   - **参数**: url(必需)
   ```bash
   mcp__ddg-search__fetch_content(
     url="https://example.com/article"
   )
   ```

**触发场景**:

- 最新信息、官方公告、breaking changes
- 技术博客、社区讨论
- 当 exa 不可用时的降级选择

#### banana-image (AI图像生成与编辑)

**用途**: 使用 Gemini 2.5 Flash 进行图像生成和编辑
**触发条件**:

- 需要生成新图像
- 需要编辑或修改现有图像
- 视觉内容创作需求

**核心方法**:

1. **generate_image** (图像生成/编辑)

   ```bash
   mcp__banana-image__generate_image(
     prompt="清晰详细的图像描述",
     mode="generate",           # generate 或 edit
     model_tier="pro",          # flash(快速) 或 pro(高质量)
     resolution="4k",           # 4k/2k/1k/high
     aspect_ratio="16:9"        # 支持多种比例
   )
   ```

2. **upload_file** (上传文件用于编辑)
   ```bash
   mcp__banana-image__upload_file(
     path="/path/to/image.png"
   )
   ```

**参数说明**:

- `prompt`: 图像描述,包含主题、构图、风格等
- `model_tier`: "flash"(速度优先,1024px) 或 "pro"(质量优先,最高4K)
- `negative_prompt`: 需要避免的元素
- `n`: 生成数量(1-4)

#### chrome-devtools (浏览器调试与自动化)

**用途**: Chrome浏览器调试、DOM检查、性能分析
**触发条件**:

- 网页调试和问题诊断
- DOM结构检查和修改
- 网络请求监控
- 性能分析和优化
- 自动化测试场景

**使用场景**:

- 前端开发调试
- 网页性能分析
- 自动化测试验证
- 网络请求抓包分析

**安全限制**: 仅限开发测试用途

#### sequential-thinking (深度问题分析)

**用途**: 系统性分析复杂问题,识别风险和关键疑问
**触发条件**(必须):

- 任何需要深度思考的场景
- 复杂需求分析
- 技术方案设计
- 风险识别
- 问题诊断

**使用要求**:

- 必须在任何开发任务开始前使用
- 必须在信息收集前使用以识别关键疑问
- 输出应包含:已知信息、未知疑问、优先级排序

**调用示例**:

```bash
# ⚠️ 重要:参数必须使用驼峰命名,且使用正确的数据类型

# ✅ 正确示例
mcp__sequential-thinking__sequentialthinking(
  thought="分析用户需求:需要实现用户认证功能,涉及密码加密、会话管理和权限控制...",
  thoughtNumber=1,         # ✅ 数字类型,无引号
  totalThoughts=3,         # ✅ 数字类型,无引号
  nextThoughtNeeded=true,  # ✅ 布尔类型,无引号
  stage="Problem Definition"
)

# ❌ 错误示例(会导致 "Invalid thoughtNumber: must be a number" 错误)
mcp__sequential-thinking__sequentialthinking(
  thought="...",
  thought_number="1",        # ❌ 错误:下划线命名 + 字符串类型
  total_thoughts="3",        # ❌ 错误:下划线命名 + 字符串类型
  next_thought_needed="true" # ❌ 错误:下划线命名 + 字符串类型
)
```

**⚠️ 常见错误**:

1. **参数命名错误**: 必须使用驼峰命名 `thoughtNumber`,不能用 `thought_number`
2. **类型错误**: 数字和布尔值不能加引号
   - `thoughtNumber=1` ✅ (不是 `"1"` ❌)
   - `totalThoughts=3` ✅ (不是 `"3"` ❌)
   - `nextThoughtNeeded=true` ✅ (不是 `"true"` ❌)

**典型流程**:

```bash
# 1. 深度分析需求
mcp__sequential-thinking__sequentialthinking(...)
  └─ 输出:关键疑问列表、风险点、技术选型建议

# 2. 根据分析结果收集信息
serena / context7 / exa / ddg-search
  └─ 针对性解答疑问

# 3. 进入任务管理
TodoWrite
```

#### TodoWrite (任务管理与进度跟踪)

**用途**: 任务分解、进度跟踪、状态管理
**触发条件**(必须):

- 复杂多步骤任务(3个以上步骤)
- 非平凡且复杂的任务
- 跨模块或超过 5 个子任务的工作
- 需要维护 TODO 清单的复杂任务

**任务状态管理**:

```bash
# 任务状态
- pending: 待执行
- in_progress: 执行中(同时只能有一个)
- completed: 已完成

# 创建任务清单
TodoWrite(todos=[
  {
    content: "实现用户认证功能",
    activeForm: "实现用户认证功能中",
    status: "pending"
  },
  {
    content: "编写单元测试",
    activeForm: "编写单元测试中",
    status: "pending"
  }
])

# 更新任务状态
TodoWrite(todos=[
  {
    content: "实现用户认证功能",
    activeForm: "实现用户认证功能中",
    status: "in_progress"  # 标记为执行中
  },
  {
    content: "编写单元测试",
    activeForm: "编写单元测试中",
    status: "pending"
  }
])

# 完成任务
TodoWrite(todos=[
  {
    content: "实现用户认证功能",
    activeForm: "实现用户认证功能中",
    status: "completed"  # 标记为完成
  },
  {
    content: "编写单元测试",
    activeForm: "编写单元测试中",
    status: "in_progress"
  }
])
```

**强制要求**:

- 任务描述必须有两种形式:content(祈使句)和 activeForm(进行时)
- 同时只能有一个任务处于 in_progress 状态
- 任务完成后必须立即标记为 completed,不允许批量完成
- 任务必须具有明确的完成标准
- 必须实时更新任务状态,保持进度透明

**任务完成标准**:

- 只有在完全完成时才标记为 completed
- 遇到错误、阻塞或无法完成时保持 in_progress 状态
- 出现阻塞时创建新任务描述需要解决的问题

**任务分解原则**:

- 创建具体可执行的任务项
- 将复杂任务分解为小步骤
- 使用清晰描述性的任务名称
- 提供 content(做什么)和 activeForm(正在做什么)两种形式

### ⚠️ 工具链执行注意事项

**必须遵循**:

1. sequential-thinking 必须最早执行(分析问题)
2. 信息收集阶段可并行执行多个工具
3. TodoWrite 管理整个任务生命周期,实时更新进度
4. 任一环节失败必须记录原因和补救措施

**禁止事项**:

- ❌ 跳过 sequential-thinking 直接收集信息
- ❌ sequential-thinking 使用错误参数格式(下划线命名或字符串类型)
- ❌ 跳过 serena 直接使用外部工具查询内部代码
- ❌ 使用 context7 时跳过 resolve-library-id
- ❌ 复杂任务不使用 TodoWrite 管理
- ❌ 批量完成多个任务,必须逐个标记完成

### 🎛️ MCP 调用约束

**核心策略**:

- **审慎单选**: 优先离线工具,确需外呼时每轮最多 1 个 MCP 服务
- **序贯调用**: 多服务需求时必须串行,明确说明每步理由和产出预期
- **最小范围**: 精确限定查询参数,避免过度抓取和噪声
- **可追溯性**: 答复末尾统一附加"工具调用简报"

**禁用场景**:

- 网络受限且未明确授权
- 查询包含敏感代码/密钥
- 本地工具可充分完成任务

**错误处理与降级**:

- **429 限流**: 退避 20s,降低参数范围
- **5xx/超时**: 单次重试,退避 2s
- **无结果**: 缩小范围或请求澄清
- **降级链路**: Context7 → ddg-search → 请求用户线索 → 保守离线答案

**工具调用简报格式**:

```
【MCP调用简报】
服务: <工具名>
触发: <具体原因>
参数: <关键参数摘要>
结果: <命中数/主要来源>
状态: <成功|重试|降级>
```

**典型调用模式**:

- **代码分析**: get_symbols_overview → find_symbol → find_referencing_symbols
- **文档查询**: resolve-library-id → get-library-docs
- **规划执行**: sequential-thinking → serena 工具链 → 验证测试

## 🔒 强制验证机制

- 必须拒绝一切 CI、远程流水线或人工外包验证,所有验证均由本地 AI 自动执行。
- 每次改动必须提供可重复的本地验证步骤(脚本、指令或推理说明),并在失败时立即终止提交。
- 验证过程中如遇工具缺失或测试覆盖不足,必须在任务文档中记录原因和补偿计划。
- 若存在无法验证的部分,必须先补足验证能力或将任务退回,不允许带缺陷交付。

## 📊 架构优先级

- "标准化 + 生态复用"拥有最高优先级,必须首先查找并复用官方 SDK、社区成熟方案或既有模块。
- 禁止新增或维护自研方案,除非已有实践无法满足需求且获得记录在案的特例批准。
- 在引入外部能力时,必须验证其与项目标准兼容,并编写复用指引。
- 对现有自研或偏离标准的实现,必须规划替换或下线时间表,确保维护成本持续下降。

## 🛡️ 安全性原则

- 安全性是代码质量的核心组成部分,必须在设计和实现阶段同步考虑。
- 禁止硬编码敏感信息(密钥、密码、令牌等),必须使用环境变量或安全的密钥管理方案。
- 用户输入必须经过验证和清理,防止注入攻击(SQL注入、XSS、命令注入等)。
- 认证和鉴权逻辑必须遵循最小权限原则,敏感操作需要适当的访问控制。
- 引入外部依赖前必须评估其安全性,定期更新依赖以修复已知漏洞。
- 敏感数据传输必须使用加密通道(HTTPS/TLS),存储时考虑加密需求。

## ✅ 代码质量强制标准

### 📝 注释规范

- 所有文档与必要代码注释必须使用简体中文,描述意图、约束与使用方式。
- 禁止编写"修改说明"式注释,所有变更信息应由版本控制和日志承担。
- 当模块依赖复杂或行为非显而易见时,必须补充中文注释解释设计理由。

### 🧪 测试规范

- 每次实现必须提供可自动运行的单元测试或等效验证脚本,由本地 AI 执行。
- 缺失测试的情况必须在验证文档中列为风险,并给出补测计划与截止时间。
- 测试需覆盖正常流程、边界条件与错误恢复,确保破坏性变更不会遗漏关键分支。

### 🏗️ 设计原则

- 严格遵循 SOLID、DRY 与关注点分离,任何共享逻辑都应抽象为复用组件。
- 依赖倒置与接口隔离优先,禁止临时绑死实现细节。
- 遇到复杂逻辑时必须先拆分职责,再进入编码。

### 💻 实现标准

- 绝对禁止 MVP、最小实现或占位符;提交前必须完成全量功能与数据路径。
- 必须主动删除过时、重复或逃生式代码,保持实现整洁。
- 对破坏性改动不做向后兼容处理,同时提供迁移步骤或回滚方案。

### ⚡ 性能意识

- 设计时必须评估时间复杂度、内存占用与 I/O 影响,避免无谓消耗。
- 识别潜在瓶颈后应提供监测或优化建议,确保可持续迭代。
- 禁止引入未经评估的昂贵依赖或阻塞操作。

### 🧩 测试思维

- 在编码前编制可验证的验收条件,并在验证文档中回填执行结果。
- 对预期失败场景提供处理策略,保证服务可控降级。
- 连续三次验证失败必须暂停实现,回到需求和设计阶段复盘。

## 🚀 强制工作流程

### ⚡ 总原则(必须遵循)

- 任何时候必须首先进行深度思考分析需求,使用 sequential-thinking 工具梳理问题。
- 不是必要的问题,不要询问用户,必须自动连续执行,不能中断流程。
- 问题驱动优先于流程驱动,追求充分性而非完整性,动态调整而非僵化执行。

### 📋 标准工作流 6 步骤(必须执行)

1. **分析需求**: 使用 sequential-thinking 深度分析
2. **获取上下文**: 使用 code-index/context7/exa 收集信息
3. **规划任务**: 使用 TodoWrite 分解任务并创建清单
4. **执行任务**: 按任务清单执行,实时更新状态
5. **验证质量**: 运行测试和验证脚本
6. **存储知识**: 记录到 `.claude/` 目录

### 🔄 研究-计划-实施模式 5 阶段(必须遵循)

1. **研究**: 阅读材料、厘清约束,禁止编码
2. **计划**: 制定详细计划与成功标准
3. **实施**: 根据计划执行并保持小步提交
4. **验证**: 运行测试或验证脚本,记录结果
5. **提交**: 准备交付文档与迁移/回滚方案

### ✋ 任务开始前强制检查(必须执行)

- [ ] 运行 sequential-thinking 梳理问题、识别风险
- [ ] 运行 serena 检索相关代码或文档,确认复用路径
- [ ] 确认日志文件(coding-log 与 operations-log)可写并准备记录
- [ ] 若需要外部信息,确定使用 context7 还是 exa
- [ ] 复杂任务使用 TodoWrite 创建任务清单并跟踪进度

### 🔄 渐进式上下文收集流程(必须)

#### 核心哲学

- **问题驱动**: 基于关键疑问收集,而非机械执行固定流程
- **充分性优先**: 追求"足以支撑决策和规划",而非"信息100%完整"
- **动态调整**: 根据实际需要决定深挖次数(建议≤3次),避免过度收集
- **成本意识**: 每次深挖都要明确"为什么需要"和"解决什么疑问"

#### 步骤1: 结构化快速扫描(必须)

使用 serena、Glob、Read 等工具进行框架式收集,输出到 `.claude/context-initial.json`:

- 位置: 功能在哪个模块/文件?
- 现状: 现在如何实现?找到1-2个相似案例
- 技术栈: 使用的框架、语言、关键依赖
- 测试: 现有测试文件和验证方式
- **观察报告**: 记录发现的异常、信息不足之处和建议深入的方向

#### 步骤2: 识别关键疑问(必须)

使用 sequential-thinking 分析初步收集和观察报告,识别关键疑问:

- 我理解了什么?(已知)
- 还有哪些疑问影响规划?(未知)
- 这些疑问的优先级如何?(高/中/低)
- 输出: 优先级排序的疑问列表

#### 步骤3: 针对性深挖(按需,建议≤3次)

仅针对高优先级疑问,使用适当工具深挖:

- 聚焦单个疑问,不发散
- 提供代码片段证据,而非猜测
- 输出到 `.claude/context-question-N.json`
- **成本提醒**: 第3次深挖时提醒"评估成本",第4次及以上警告"建议停止,避免过度收集"

**工具选择**:

- 内部代码疑问 → serena
- 第三方库用法 → context7
- 代码示例/最佳实践 → exa get_code_context
- 最新信息/研究 → exa web_search / ddg-search

#### 步骤4: 充分性检查(必须)

在进入任务规划前,必须回答充分性检查清单:

- □ 我能定义清晰的接口契约吗?(知道输入输出、参数约束、返回值类型)
- □ 我理解关键技术选型的理由吗?(为什么用这个方案?为什么有多种实现?)
- □ 我识别了主要风险点吗?(并发、边界条件、性能瓶颈)
- □ 我知道如何验证实现吗?(测试框架、验证方式、覆盖标准)

**决策**:

- ✓ 全部打勾 → 收集完成,进入任务规划和实施
- ✗ 有未打勾 → 列出缺失信息,补充1次针对性深挖

#### 回溯补充机制

允许"先规划→发现不足→补充上下文→完善实现"的迭代:

- 如果在规划或实施阶段发现信息缺口,记录到 `operations-log.md`
- 补充1次针对性收集,更新相关 context 文件
- 避免"一步错、步步错"的僵化流程

#### 禁止事项

- ❌ 跳过步骤1(结构化快速扫描)或步骤2(识别关键疑问)
- ❌ 跳过步骤4(充分性检查),在信息不足时强行规划
- ❌ 深挖时不说明"为什么需要"和"解决什么疑问"
- ❌ 上下文文件写入错误路径(必须是 `.claude/` 而非 `~/.claude/`)

## 💡 开发哲学(强制遵循)

- 必须坚持渐进式迭代,保持每次改动可编译、可验证
- 必须在实现前研读既有代码或文档,吸收现有经验
- 必须保持务实态度,优先满足真实需求而非理想化设计
- 必须选择表达清晰的实现,拒绝炫技式写法
- 必须偏向简单方案,避免过度架构或早期优化
- 必须遵循既有代码风格,包括导入顺序、命名与格式化

### 简单性定义

- 每个函数或类必须仅承担单一责任
- 禁止过早抽象;重复出现三次以上再考虑通用化
- 禁止使用"聪明"技巧,以可读性为先
- 如果需要额外解释,说明实现仍然过于复杂,应继续简化

## 🔧 项目集成规则

### 学习代码库

- 必须寻找至少 3 个相似特性或组件,理解其设计与复用方式
- 必须识别项目中通用模式与约定,并在新实现中沿用
- 必须优先使用既有库、工具或辅助函数
- 必须遵循既有测试编排,沿用断言与夹具结构

### 工具

- 必须使用项目现有构建系统,不得私自新增脚本
- 必须使用项目既定的测试框架与运行方式
- 必须使用项目的格式化/静态检查设置
- 若确有新增工具需求,必须提供充分论证并获得记录在案的批准

## ⚠️ 重要提醒

**绝对禁止**:

- 在缺乏证据的情况下做出假设,所有结论都必须援引现有代码或文档

**必须做到**:

- 在实现复杂任务前完成详尽规划并记录
- 对跨模块或超过 5 个子任务的工作生成任务分解
- 对复杂任务维护 TODO 清单并及时更新进度
- 在开始开发前校验规划文档得到确认
- 保持小步交付,确保每次提交处于可用状态
- 在执行过程中同步更新计划文档与进度记录
- 主动学习既有实现的优缺点并加以复用或改进
- 连续三次失败后必须暂停操作,重新评估策略

## 🎯 内容唯一性规则

- 每一层级必须自洽掌握自身抽象范围,禁止跨层混用内容
- 必须引用其他层的资料而非复制粘贴,保持信息唯一来源
- 每一层级必须站在对应视角描述系统,避免越位细节
- 禁止在高层文档中堆叠实现细节,确保架构与实现边界清晰

## 迭代开发工作流

每次开发迭代必须遵循以下4阶段流程：

1. **理解阶段**: 审阅代码/文档,掌握架构和业务逻辑,识别改进点
2. **规划阶段**: 定义任务范围和预期成果,优先考虑简洁高效的方案
3. **执行阶段**: 拆解为可操作步骤,每步说明如何体现 KISS/YAGNI/DRY/SOLID 原则
4. **汇报阶段**: 提供结构化总结,包含完成成果、原则应用、挑战克服、后续计划

---

## Communication & Language

- Default language: Simplified Chinese for issues, PRs, and assistant replies, unless a thread explicitly requests English.
- Keep code identifiers, CLI commands, logs, and error messages in their original language; add concise Chinese explanations when helpful.
- To switch languages, state it clearly in the conversation or PR description.

## File Encoding

When modifying or adding any code files, the following coding requirements must be adhered to:

- Encoding should be unified to UTF-8 (without BOM). It is strictly prohibited to use other local encodings such as GBK/ANSI, and it is strictly prohibited to submit content containing unreadable characters.
- When modifying or adding files, be sure to save them in UTF-8 format; if you find any files that are not in UTF-8 format before submitting, please convert them to UTF-8 before submitting.
