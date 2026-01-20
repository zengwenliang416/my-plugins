---
name: design-variant-generator
description: |
  【触发条件】样式推荐完成后，根据推荐方案生成详细设计规格
  【核心产出】输出 ${run_dir}/design-{variant}.md，包含完整设计规格
  【不触发】无推荐方案文件
  【先问什么】variant_id 参数缺失时，询问生成哪个变体 (A/B/C)
  【并行支持】✅ 可同时启动多个实例生成 design-A/B/C.md
  【🚨 强制】必须使用 codeagent-wrapper gemini 生成设计规格详情
  【依赖】gemini/codeagent-wrapper（参考 skills/gemini-cli/）
allowed-tools:
  - Read
  - Write
  - Bash
  - mcp__auggie-mcp__codebase-retrieval
  - mcp__sequential-thinking__sequentialthinking
  - LSP
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 command 传入）
  - name: variant_id
    type: string
    required: true
    description: 变体标识（A/B/C）
  - name: fixes
    type: string
    required: false
    description: UX 检查失败后的修复建议（JSON 格式）
---

# Design Variant Generator

## 职责边界

根据样式推荐方案，生成详细的设计规格文档。**支持并行执行**。

- **输入**: `${run_dir}/requirements.md` + `${run_dir}/style-recommendations.md` + `variant_id`
- **输出**: `${run_dir}/design-{variant}.md`
- **核心能力**: 设计规格生成、细节补全、并行支持

---

## MCP 工具集成

| MCP 工具              | 用途                   | 触发条件        |
| --------------------- | ---------------------- | --------------- |
| `sequential-thinking` | 结构化设计规格生成策略 | 🚨 每次执行必用 |
| `auggie-mcp`          | 语义检索现有组件结构   | 优化现有项目时  |

## 执行流程

### Step 0: 结构化设计规格规划（sequential-thinking）

🚨 **必须首先使用 sequential-thinking 规划设计规格生成策略**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "规划设计规格生成策略。需要：1) 解析推荐方案 2) 分析现有组件 3) 定义布局结构 4) 生成组件规格 5) 完善响应式策略",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**思考步骤**：

1. **推荐方案解析**：从 style-recommendations.md 提取选定方案的详细信息
2. **现有组件分析**：使用 auggie-mcp + LSP 分析现有组件结构
3. **布局结构定义**：定义 Header、Hero、Main、Footer 等布局
4. **组件规格生成**：为 Button、Card、Input 等组件生成详细规格
5. **响应式策略完善**：定义断点和响应式适配方案

---

## 🚨 强制执行规则

**禁止行为**：

- ❌ 跳过 auggie-mcp 代码分析（优化现有项目时）
- ❌ 跳过 LSP 符号分析（发现组件文件时）
- ❌ 自己直接写设计规格而不使用 Gemini

**✅ 必须按照 Step 顺序执行**

---

## 执行流程（续）

### Step 1: 读取输入文件

```
Read: ${run_dir}/requirements.md
Read: ${run_dir}/style-recommendations.md
```

**提取 variant_id 对应的方案**：样式名称、配色方案、字体配置、使用建议

### Step 1.5: 加载共享设计资源

```bash
SKILL_ROOT="${CLAUDE_PLUGIN_ROOT}/plugins/commands/ui-design/skills"
Read: ${SKILL_ROOT}/_shared/styles/${style_name}.yaml
Read: ${SKILL_ROOT}/_shared/colors/${color_scheme}.yaml
Read: ${SKILL_ROOT}/_shared/typography/${typography_name}.yaml
```

### Step 2: 🚨 强制分析现有组件结构（auggie-mcp + LSP）

**如果是优化现有项目（has_existing_code: true），必须执行**

```
mcp__auggie-mcp__codebase-retrieval(
  information_request="查找项目中所有 UI 组件的结构、Props 接口和样式实现。"
)
```

**如果发现组件文件，必须调用 LSP**：

```
LSP(operation="documentSymbol", filePath="src/components/Button.tsx", line=1, character=1)
LSP(operation="hover", filePath="src/components/Button.tsx", line=10, character=15)
```

**产出**：`component_props`, `existing_variants`, `style_implementation`, `constraints`

**跳过条件**：全新项目或 auggie-mcp 返回空结果

### Step 2.5: 🚨 Gemini 设计规格生成（强制）

```bash
~/.claude/bin/codeagent-wrapper gemini --role frontend --prompt "${prompt}"
```

> 📚 Gemini 提示词模板见 [references/variant-specs.md](references/variant-specs.md#1-gemini-提示词模板)

**记录 Gemini 分析结果**：保存到变量 `gemini_design_specs`

### Step 3: 生成详细设计规格

将推荐方案扩展为可实施的设计文档。

**核心章节**：

| 章节       | 内容                                              |
| ---------- | ------------------------------------------------- |
| 布局结构   | Header, Hero, Main, Sidebar, Footer               |
| 组件清单   | Button, Card, Input, Select, Modal, Toast 等      |
| 详细样式   | Border radius, Spacing, Shadow, Animation         |
| 色值映射   | Primary, Secondary, Accent, Success/Warning/Error |
| 字体规格   | H1-H6, Body, Small, Caption                       |
| 响应式断点 | Mobile, Tablet, Desktop                           |

> 📚 完整模板见 [references/variant-specs.md](references/variant-specs.md#2-设计文档模板)

### Step 4: 处理修复建议（如有）

如果传入了 `fixes` 参数（来自 UX 检查失败）：

```python
for fix in fix_items:
    if fix.type == "color_contrast":
        adjust_color(fix.token, fix.suggested_value)
    elif fix.type == "font_size":
        adjust_font_size(fix.element, fix.suggested_size)
    elif fix.type == "spacing":
        adjust_spacing(fix.value, round_to_4px(fix.value))
```

### Step 5: 生成设计文档

**输出**：`${run_dir}/design-{variant_id}.md`

> 📚 完整文档模板见 [references/variant-specs.md](references/variant-specs.md#2-设计文档模板)
>
> 📚 组件样式模板见 [references/variant-specs.md](references/variant-specs.md#3-组件样式模板)
>
> 📚 系统模板（色值/字体/间距/圆角/阴影/动画）见 [references/variant-specs.md](references/variant-specs.md#4-色值系统模板)

### Step 6: Gate 检查

**检查项**：

- [ ] 设计定位明确
- [ ] 布局结构完整
- [ ] 至少包含 5 个组件规格
- [ ] 色值系统完整（含对比度）
- [ ] 字体规格完整
- [ ] 响应式策略明确
- [ ] Tailwind 配置可用

---

## 返回值

```json
{
  "status": "success",
  "variant_id": "A",
  "output_file": "${run_dir}/design-A.md",
  "is_retry": false,
  "summary": {
    "style": "Glassmorphism 2.0",
    "color": "Vercel Dark",
    "typography": "Plus Jakarta Sans",
    "component_count": 8,
    "contrast_compliant": true
  },
  "next_phase": {
    "phase": 7,
    "name": "ux-guideline-checker",
    "action": "CONTINUE_IMMEDIATELY"
  }
}
```

---

## ⏩ 强制继续指令

**所有设计变体生成完成后必须执行：**

```bash
sed -i '' 's/^current_phase: .*/current_phase: 7/' .claude/ccg-workflow.local.md
echo "✅ Phase 6 完成，进入 Phase 7: UX 检查..."
```

**立即调用**：

```
for variant in selected_variants:
    Skill(skill="ux-guideline-checker", args="run_dir=${run_dir} variant_id=${variant}")
```

**⛔ 禁止停止！必须继续执行 Phase 7！**

---

## 并行支持

此 skill 设计为**并行安全**：

- 每个实例操作独立的输出文件（design-A.md / design-B.md / design-C.md）
- 无共享状态、无写入冲突

**调用示例**：

```
Task(design-variant-generator, variant_id="A") &
Task(design-variant-generator, variant_id="B") &
Task(design-variant-generator, variant_id="C")
wait_all()
```

---

## 约束

- 🚨 优化场景（has_existing_code: true）必须调用 auggie-mcp（Step 2）
- 🚨 发现组件文件必须调用 LSP（Step 2）
- variant_id 必须是参数，确保并行安全
- 设计规格必须包含完整的色值系统和对比度验证

## 工具降级策略

仅当工具返回错误时才可降级：

1. auggie-mcp 错误 → 使用 Glob + Grep 查找组件
2. LSP 错误 → 使用 Read 读取组件文件
3. 全新项目 → 跳过现有代码分析
