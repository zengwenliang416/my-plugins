---
name: requirement-analyzer
description: |
  【触发条件】UI/UX 设计工作流的第一步，分析用户需求并提取设计关键要素
  【核心产出】输出 ${run_dir}/requirements.md，包含结构化需求分析
  【不触发】已有明确设计规格文档的场景
  【先问什么】缺少需求描述时，询问：产品类型、核心功能、目标用户、设计偏好
  【🚨 强制】必须使用 codeagent-wrapper gemini 协助分析需求
  【依赖】gemini/codeagent-wrapper（参考 skills/gemini-cli/）
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
  - mcp__auggie-mcp__codebase-retrieval
  - LSP
  - WebSearch
  - WebFetch
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 command 传入）
  - name: description
    type: string
    required: true
    description: 用户设计需求描述
---

# Requirement Analyzer

## 职责边界

分析设计需求，提取关键要素，为后续设计阶段提供明确的输入。

- **输入**: 用户自然语言描述 + 可选参考文件/链接
- **输出**: `${run_dir}/requirements.md`
- **核心能力**: NLP 提取、代码库分析、需求结构化

---

## 🚨🚨🚨 强制工具使用规则（违反则 Skill 失败）

### ⛔ 禁止行为

| 步骤 | ❌ 禁止使用 | ✅ 必须使用 |
|------|------------|------------|
| 代码库分析 | Glob, Grep, Search, Read 直接读文件 | `mcp__auggie-mcp__codebase-retrieval` |
| 需求分析 | 自己分析、直接写文档 | `codeagent-wrapper gemini --prompt` |
| 符号分析 | Read 读代码 | `LSP` (documentSymbol, hover) |

### ✅ 必须执行的工具调用

1. **Step 1**: `mcp__auggie-mcp__codebase-retrieval` - 不可用 Glob/Search 替代
2. **Step 2**: `LSP` documentSymbol + hover - 不可用 Read 替代
3. **Step 2.5**: `codeagent-wrapper gemini` - 必须执行，不可跳过

**⛔ 如果使用了禁止的工具替代必须的工具，此 Skill 视为失败！**

---

## 执行流程

### Step 1: 🚨🚨🚨 强制代码库上下文检索（auggie-mcp）

> **⛔ 禁止使用 Glob/Search/Read 替代！必须使用 auggie-mcp！**

**必须调用 `mcp__auggie-mcp__codebase-retrieval`**，不可跳过：

```
mcp__auggie-mcp__codebase-retrieval(
  information_request="查找项目中现有的 UI 组件、页面结构、样式系统和设计 Token。

  请回答：
  1. 有哪些 UI 组件？列出文件路径
  2. 使用什么样式框架（Tailwind/CSS Modules/Styled Components）？
  3. 有哪些设计 Token（颜色、字体、间距）？
  4. 主要页面的路由结构是什么？"
)
```

**产出**：
- `existing_components`: 现有组件列表和文件路径
- `style_framework`: 样式框架类型
- `design_tokens`: 设计 Token（颜色、字体、间距）
- `page_routes`: 页面路由结构

**❌ 禁止跳过此步骤，即使是新项目也要执行（会返回空结果）**

### Step 2: 🚨 强制符号分析（LSP）

**如果 Step 1 发现了组件文件，必须对代码文件调用 LSP**：

```
LSP(operation="documentSymbol", filePath="${component_file_path}", line=1, character=1)
```

**跳过条件**（仅以下情况可跳过）：
- auggie-mcp 返回空结果（新项目，无现有代码）
- LSP 返回错误

**必须执行的 LSP 操作**（如果有组件）：

```
# 1. 获取组件文件的符号结构（必须）
LSP(operation="documentSymbol", filePath="src/components/Button.tsx", line=1, character=1)
LSP(operation="documentSymbol", filePath="src/components/Card.tsx", line=1, character=1)

# 2. 查看组件导出的类型定义（必须）
LSP(operation="hover", filePath="src/components/Button.tsx", line=1, character=15)

# 3. 查找组件的使用位置（可选）
LSP(operation="findReferences", filePath="src/components/Button.tsx", line=10, character=15)
```

**产出**：
- `component_symbols`: 组件的函数/类/接口定义
- `component_props`: 组件 Props 结构
- `usage_count`: 组件使用次数

**验证检查点**：
- [ ] 如果有组件，至少对 2 个组件执行了 `documentSymbol`
- [ ] 如果有组件，至少执行了 1 次 `hover` 查看类型信息
- [ ] 记录了组件的 Props 结构到 requirements.md

### Step 2.5: 🚨🚨🚨 Gemini 需求分析（强制 - 不可跳过）

> **⛔ 禁止跳过此步骤！必须执行 codeagent-wrapper gemini 命令并等待结果！**

**使用 codeagent-wrapper gemini 协助分析用户需求**：

```bash
# 🚨 必须执行此命令！
~/.claude/bin/codeagent-wrapper gemini --role analyzer --prompt "
你是一位资深产品经理和 UI/UX 设计师。请分析以下设计需求：

用户描述：${description}

请提取并结构化以下信息：

## 1. 产品定位
- 产品类型：SaaS / 电商 / 社交 / 工具 / 内容平台 / 企业内部 / 营销网站？
- 目标用户：企业客户 / 个人用户 / 开发者 / 创作者 / 普通消费者？
- 核心价值主张：一句话描述产品解决什么问题

## 2. 功能需求
- 核心功能列表（按优先级排序）
- 每个功能的简短描述
- 预期的用户交互流程

## 3. 设计方向建议
- 推荐的设计风格：简约 / 专业 / 创意 / 科技感 / 高端？
- 情感基调：信任 / 活力 / 专业 / 亲和？
- 参考竞品或灵感来源（如果能推断）

## 4. 技术考量
- 推荐的技术栈
- 响应式策略
- 性能关注点

请给出详细、可执行的分析结果。
"
```

**🚨 强制验证检查点**：
- [ ] ✅ 已执行 `codeagent-wrapper gemini` 命令
- [ ] ✅ 收到 Gemini 返回结果
- [ ] ✅ 将 Gemini 分析结果保存到 `${run_dir}/gemini-requirement-analysis.md`

**⛔ 如果没有执行 codeagent-wrapper gemini，此 Skill 视为失败！**

```bash
# 保存 Gemini 分析结果（必须执行）
Write: ${run_dir}/gemini-requirement-analysis.md
```

### Step 3: 提取需求维度

从用户输入和上下文中提取设计需求。

**信息来源优先级**：

1. 用户明确提供的需求描述
2. **图片分析结果**（如果存在 `${run_dir}/image-analysis.md`）
3. auggie-mcp 检索到的代码上下文
4. LSP 分析的组件结构
5. 引用的文件内容（使用 Read）
6. 补充提问（使用 AskUserQuestion）

**🚨 如果存在 image-analysis.md：**
```
# 读取图片分析结果
Read("${run_dir}/image-analysis.md")

# 从中提取：
- 配色方案 → 设计偏好
- 组件清单 → 核心功能
- 设计风格 → 产品类型
```

**必须提取的维度**：

| 维度       | 关键字                                                                          | 默认值             |
| ---------- | ------------------------------------------------------------------------------- | ------------------ |
| 产品类型   | SaaS, 电商, 社交, 工具, 内容平台, 企业内部系统, 营销网站                        | "未明确"           |
| 核心功能   | Dashboard, Landing Page, Form, Data Visualization, User Profile, Settings, etc. | []                 |
| 目标用户   | 企业客户, 个人用户, 开发者, 创作者, 设计师, 普通消费者                          | "通用"             |
| 设计偏好   | 简约, 创意, 专业, 年轻, 科技感, 传统, 高端, 亲和                                | "现代简约"         |
| 技术栈     | React, Vue, Angular, Vanilla JS, etc.                                           | "React + Tailwind" |
| 响应式要求 | Mobile-first, Desktop-first, 全响应式                                           | "全响应式"         |
| 现有约束   | 必须兼容现有组件、保持风格一致、特定颜色要求                                    | []                 |

**提取策略**：

```
如果用户输入包含：
  - "仪表盘" | "Dashboard" | "数据可视化" → 核心功能 = Dashboard
  - "着陆页" | "Landing Page" | "官网" → 核心功能 = Landing Page
  - "表单" | "Form" | "注册" | "登录" → 核心功能 = Form
  - "SaaS" | "B2B" | "企业级" → 产品类型 = SaaS
  - "电商" | "商城" | "购物" → 产品类型 = 电商
  - "开发者" | "程序员" | "技术人员" → 目标用户 = 开发者
  - "简约" | "极简" | "Minimal" → 设计偏好 = 简约
  - "大胆" | "创意" | "个性" → 设计偏好 = 创意
```

### Step 4: 补充提问（如需要）

如果关键信息缺失，使用 AskUserQuestion 收集。

**触发条件**：
- 产品类型为 "未明确"
- 核心功能为空数组
- 设计偏好过于模糊

**示例问题**：

```
问题 1: 产品类型是什么？
选项:
  - SaaS / 企业工具
  - 电商平台
  - 内容/社交平台
  - 营销网站/着陆页

问题 2: 主要包含哪些核心功能？（可多选）
选项:
  - Dashboard / 数据展示
  - Landing Page / 首页
  - 用户登录/注册表单
  - 产品展示/目录
```

### Step 5: 搜索参考案例（可选）

如果用户提供了参考链接或希望寻找灵感，使用 WebSearch 搜索类似案例。

**触发条件**：
- 用户提供了参考网站 URL
- 用户描述中包含 "类似 XXX" 或 "参考 XXX"
- 设计偏好明确且适合搜索（如 "Stripe 风格"）

**搜索策略**：

```
WebSearch({
  query: "${产品类型} ${设计偏好} UI design inspiration 2026"
})
```

### Step 6: 生成需求文档

将提取的信息结构化输出为 Markdown 文档。

**输出路径**：`${run_dir}/requirements.md`

**文档模板**：

```markdown
---
generated_at: {ISO 8601 时间戳}
analyzer_version: "2.0"
confidence: {high | medium | low}
has_existing_code: {true | false}
---

# UI/UX 设计需求分析

## 项目概述

**产品类型**: {SaaS / 电商 / ...}
**目标用户**: {企业客户 / 个人用户 / ...}
**核心价值**: {一句话描述产品核心价值}

## 核心功能

{功能列表，每个功能一行，包含简短描述}

1. **{功能名称}**: {功能描述}
2. **{功能名称}**: {功能描述}
   ...

## 设计偏好

- **整体风格**: {简约 / 创意 / 专业 / ...}
- **目标情感**: {信任感 / 活力 / 专业 / ...}
- **差异化方向**: {与竞品的差异点}

## 技术约束

- **技术栈**: {React + Tailwind / Vue + Tailwind}
- **响应式**: {Mobile-first / Desktop-first / 全响应式}
- **浏览器支持**: {默认：现代浏览器}

## 现有代码分析（如适用）

### 现有组件

{从 auggie-mcp 和 LSP 分析提取}

| 组件名 | 位置 | Props | 使用次数 |
|--------|------|-------|----------|
| Button | src/components/Button.tsx | variant, size, onClick | 45 |
| Card   | src/components/Card.tsx   | title, children | 23 |

### 现有样式系统

- **框架**: {Tailwind / CSS Modules / ...}
- **主题色**: {#primary, #secondary, ...}
- **字体**: {Inter, ...}

### 约束条件

- {必须兼容现有组件}
- {保持与现有页面风格一致}
- {特定颜色/品牌要求}

## 参考案例

{如果搜索到参考案例}

1. **{案例名称}** - [{URL}]({URL})
   - 设计特点: {特点描述}
   - 可借鉴点: {借鉴要素}

## 补充说明

{用户原始需求的重要细节}
```

### Step 7: Gate 检查

验证需求文档是否完整。

**检查项**：
- [ ] 产品类型已明确（非 "未明确"）
- [ ] 至少有 1 个核心功能
- [ ] 目标用户已明确（非 "通用"）
- [ ] 设计偏好已明确

**通过标准**：至少 3 项检查通过

**如果失败**：
1. 标记低置信度字段
2. 返回警告信息，建议用户补充
3. 仍然输出文档（允许后续人工补充）

---

## 返回值

成功时返回：

```json
{
  "status": "success",
  "output_file": "${run_dir}/requirements.md",
  "confidence": "high",
  "has_existing_code": true,
  "extracted_info": {
    "product_type": "SaaS",
    "core_functions": ["Dashboard", "User Profile"],
    "target_users": "企业客户",
    "design_preference": "专业简约",
    "existing_components": ["Button", "Card", "Input"]
  },
  "gate_check": {
    "passed": true,
    "score": "4/4"
  },
  "next_phase": {
    "phase": 4,
    "name": "style-recommender",
    "action": "CONTINUE_IMMEDIATELY"
  }
}
```

---

## ⏩ 强制继续指令（Skill 完成后必须执行）

**🚨🚨🚨 Skill 执行完成后，你必须立即执行以下操作：**

```bash
# 1. 更新 workflow-loop 状态
sed -i '' 's/^current_phase: .*/current_phase: 4/' .claude/ccg-workflow.local.md

# 2. 输出进度
echo "✅ Phase 3 完成，进入 Phase 4: 样式推荐..."
```

**然后立即调用下一个 Skill：**
```
Skill(skill="style-recommender", args="run_dir=${run_dir}")
```

**⛔ 禁止在此停止！必须继续执行 Phase 4！**
```

---

## 约束

- **🚨 必须调用 auggie-mcp 进行代码库分析**（Step 1）
- **🚨 如果发现组件文件，必须调用 LSP 获取符号**（Step 2）
- 仅当工具返回错误时才可降级
- 不做主观判断：只提取用户明确表达的需求
- 保持中立：不推荐具体设计方案（那是 style-recommender 的职责）
- 容错性：即使信息不完整也输出文档，标记 confidence="low"

## 工具使用策略

### auggie-mcp 优先场景

- 了解项目整体代码结构
- 查找现有 UI 组件和样式系统
- 理解页面路由和功能模块

### LSP 优先场景

- 获取组件文件的符号结构（函数、类、接口）
- 查看组件 Props 类型定义
- 查找组件在项目中的使用位置

### 降级策略

如果 auggie-mcp 或 LSP 不可用：
1. 跳过代码分析，仅使用用户输入
2. 在 requirements.md 中标记 `has_existing_code: false`
3. 在结果中标记 `"analysis_mode": "basic"`
