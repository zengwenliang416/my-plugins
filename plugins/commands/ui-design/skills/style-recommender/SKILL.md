---
name: style-recommender
description: |
  【触发条件】需求分析完成后，根据需求推荐设计方案
  【核心产出】输出 ${run_dir}/style-recommendations.md，包含 2-3 套样式方案
  【不触发】用户已明确指定设计方案（如"就用 Glassmorphism"）
  【先问什么】requirements.md 不存在时，先调用 requirement-analyzer
  【🚨 强制】必须使用 codeagent-wrapper gemini 生成创意配色和样式方案
  【依赖】gemini/codeagent-wrapper（参考 skills/gemini-cli/）
allowed-tools:
  - Read
  - Write
  - Bash
  - mcp__auggie-mcp__codebase-retrieval
  - mcp__sequential-thinking__sequentialthinking
  - LSP
  - WebSearch
  - WebFetch
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 command 传入）
---

# Style Recommender

## 职责边界

根据产品类型、目标用户、设计偏好推荐 2-3 套差异化风格方案。

- **输入**: `${run_dir}/requirements.md`
- **输出**: `${run_dir}/style-recommendations.md`
- **核心能力**: 风格匹配、方案组合、多变体推荐

---

## MCP 工具集成

| MCP 工具              | 用途                               | 触发条件        |
| --------------------- | ---------------------------------- | --------------- |
| `sequential-thinking` | 结构化样式推荐策略，确保方案多样性 | 🚨 每次执行必用 |
| `auggie-mcp`          | 语义检索现有样式系统               | 有现有代码时    |

## 执行流程

### Step 0: 结构化样式推荐规划（sequential-thinking）

🚨 **必须首先使用 sequential-thinking 规划推荐策略**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "规划样式推荐策略。需要：1) 理解需求文档 2) 分析现有样式 3) 匹配风格库 4) 生成差异化方案 5) 创建预览页面",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**思考步骤**：

1. **需求文档理解**：从 requirements.md 提取产品类型和设计偏好
2. **现有样式分析**：使用 auggie-mcp 分析现有样式系统
3. **风格库匹配**：根据需求匹配合适的设计风格
4. **差异化方案生成**：生成 3 套差异化设计方案（稳妥/创意/混合）
5. **预览页面创建**：生成 HTML 预览页面供用户选择

---

## 🚨 强制工具使用规则

### ⛔ 禁止行为

| 步骤         | ❌ 禁止使用            | ✅ 必须使用                           |
| ------------ | ---------------------- | ------------------------------------- |
| 创意方案生成 | 自己编写方案、复制模板 | `codeagent-wrapper gemini --prompt`   |
| 样式系统分析 | Glob, Grep, Search     | `mcp__auggie-mcp__codebase-retrieval` |
| 配置文件分析 | Read 直接读            | `LSP` (documentSymbol, hover)         |

### ✅ 必须执行的工具调用

1. **Step 1.5**: `codeagent-wrapper gemini` - 生成 3 套创意方案，**不可跳过**
2. **Step 2**: `mcp__auggie-mcp__codebase-retrieval` - 分析现有样式系统
3. **Step 2**: `LSP` - 分析 tailwind.config.js 符号

**⛔ 如果没有执行 codeagent-wrapper gemini 生成方案，此 Skill 视为失败！**

---

## 执行流程

### Step 1: 读取需求文档和图片分析

```
Read: ${run_dir}/requirements.md
Read: ${run_dir}/image-analysis.md  # 如果存在
```

**提取字段**：`product_type`, `core_functions`, `target_users`, `design_preference`, `tech_stack`, `existing_components`

**🚨 如果存在 image-analysis.md**：从中提取配色系统、字体规格、组件样式，优先级高于默认推荐。

**容错**：requirements.md 不存在 → 返回错误，提示先运行 `requirement-analyzer`

### Step 1.2: 加载共享设计资源库

```bash
SKILL_ROOT="${CLAUDE_PLUGIN_ROOT}/plugins/commands/ui-design/skills"
Read: ${SKILL_ROOT}/_shared/index.json
```

**用户偏好匹配**：

| 关键词     | 推荐风格                       |
| ---------- | ------------------------------ |
| 现代、简约 | minimalist-swiss, clean-modern |
| 玻璃、高端 | glassmorphism                  |
| 大胆、创意 | neubrutalism, bold-expressive  |
| 专业、商务 | corporate-professional         |

**加载匹配的资源文件**作为 Gemini 的参考上下文。

### Step 1.5: 🚨 Gemini 创意方案生成（强制）

> **⛔ 禁止跳过此步骤！**

```bash
~/.claude/bin/codeagent-wrapper gemini --role frontend --prompt "
你是一位顶级 UI/UX 设计师。请根据以下需求生成 3 套差异化的设计方案：

## 需求信息
产品类型：${product_type}
目标用户：${target_users}
核心功能：${core_functions}
设计偏好：${design_preference}

## 参考资源
${matched_style_yaml}
${matched_color_yaml}
${matched_typography_yaml}

请为每套方案提供：配色系统（HEX）、字体系统、风格关键词

## 方案 A：稳妥专业型
## 方案 B：创意大胆型
## 方案 C：混合平衡型
"
```

**强制验证**：

- [ ] 已执行 `codeagent-wrapper gemini` 命令
- [ ] 收到 Gemini 返回的 3 套设计方案
- [ ] 保存到 `${run_dir}/gemini-style-recommendations.md`

### Step 2: 🚨 分析现有样式系统（auggie-mcp + LSP）

**如果 `has_existing_code: true`，必须执行**

```
mcp__auggie-mcp__codebase-retrieval(
  information_request="查找项目的 Tailwind 配置、CSS 变量、设计 Token 和主题定义。"
)
```

**如果发现 tailwind.config.js**：

```
LSP(operation="documentSymbol", filePath="tailwind.config.js", line=1, character=1)
LSP(operation="hover", filePath="tailwind.config.js", line=5, character=10)
```

**产出**：`existing_colors`, `existing_fonts`, `existing_spacing`, `existing_effects`

### Step 3: 构建推荐策略

基于需求和现有约束确定推荐方向。

> 📚 详细策略矩阵见 [references/style-library.md](references/style-library.md#1-推荐策略矩阵)

### Step 4: 搜索设计灵感（可选）

```
WebSearch({ query: "${product_type} ${design_preference} UI design trends 2026" })
```

### Step 5: 生成三套方案

| 方案         | 目标                 | 样式选择       | 配色选择      |
| ------------ | -------------------- | -------------- | ------------- |
| A 稳妥专业型 | 快速上线，降低风险   | 成熟、广泛使用 | 中性色调      |
| B 创意大胆型 | 差异化，吸引年轻用户 | 视觉冲击力强   | 高对比度/撞色 |
| C 混合平衡型 | 兼顾专业与个性       | 混合两种风格   | 渐变色/双色调 |

### Step 6: 生成推荐文档

**输出**：`${run_dir}/style-recommendations.md`

> 📚 完整模板见 [references/style-library.md](references/style-library.md#2-方案输出模板)

文档须包含：

- YAML frontmatter（时间戳、版本、来源）
- 需求摘要
- 每套方案的完整设计组合（样式 + 配色 + 字体 + Tailwind 示例）
- 推荐理由对比表
- 下一步建议

### Step 7: 🚨 生成静态 HTML 预览页面（强制）

**❌ 禁止**：跳过 HTML 生成、生成完整项目结构

**✅ 必须**：生成 4 个静态 HTML 文件

```bash
mkdir -p ${run_dir}/previews
```

**输出文件**：
| 文件 | 内容 |
|------|------|
| `preview-A.html` | 方案 A (Glassmorphism + Vercel Dark) |
| `preview-B.html` | 方案 B (Neubrutalism + 黄黑撞色) |
| `preview-C.html` | 方案 C (Dark Mode + Linear Purple) |
| `index.html` | Tab 切换对比页 |

> 📚 HTML 模板见 [references/style-library.md](references/style-library.md#3-html-预览模板)

**验证检查点**：

```bash
ls -la ${run_dir}/previews/
# 必须看到：index.html, preview-A.html, preview-B.html, preview-C.html
```

### Step 8: Gate 检查

- [ ] 至少生成 2 套方案
- [ ] 每套方案包含：样式 + 配色 + 字体
- [ ] 推荐理由充分（基于需求）
- [ ] 提供了代码示例
- [ ] **生成了 HTML 预览页面**

---

## 返回值

```json
{
  "status": "success",
  "output_file": "${run_dir}/style-recommendations.md",
  "preview_dir": "${run_dir}/previews/",
  "preview_index": "${run_dir}/previews/index.html",
  "variant_count": 3,
  "recommendations": [
    {
      "variant_id": "A",
      "style": "Glassmorphism 2.0",
      "color": "Vercel Dark",
      "typography": "Plus Jakarta Sans"
    },
    {
      "variant_id": "B",
      "style": "Neubrutalism",
      "color": "黄+黑撞色",
      "typography": "Clash Display + Manrope"
    },
    {
      "variant_id": "C",
      "style": "Dark Mode First + Bento Grid",
      "color": "Linear Purple",
      "typography": "Geist Sans + Geist Mono"
    }
  ],
  "next_phase": {
    "phase": 5,
    "name": "variant-selection",
    "action": "ASK_USER_QUESTION"
  }
}
```

---

## ⏩ 强制继续指令

**🚨 Skill 完成后必须立即执行：**

```bash
sed -i '' 's/^current_phase: .*/current_phase: 5/' .claude/ccg-workflow.local.md
echo "✅ Phase 4 完成，进入 Phase 5: 方案选择..."
```

**然后**：

1. 提示用户打开 `${run_dir}/previews/index.html`
2. 使用 AskUserQuestion 询问用户选择哪个方案

**⛔ 硬停止点，必须等待用户选择！**

---

## 约束

- 🚨 有现有代码时必须调用 auggie-mcp 分析样式系统
- 🚨 发现 tailwind.config.js 时必须调用 LSP
- 🚨 必须生成 4 个静态 HTML 预览文件
- 多样性：3 个方案必须有明显差异
- 对齐需求：推荐理由必须引用 requirements.md
- 代码实用性：示例必须可直接使用

## 工具降级策略

如果 auggie-mcp 或 LSP 不可用：

1. 跳过现有样式分析
2. 在推荐文档中标记"未分析现有样式"
3. 推荐通用方案
