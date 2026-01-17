---
name: code-generator
description: |
  【触发条件】设计方案通过 UX 检查后，生成代码（双模型协作）
  【核心产出】输出 ${run_dir}/code/{tech_stack}/
  【不触发】设计方案不存在或 UX 检查未通过
  【双模型协作】Gemini 生成原型 → Claude 重构精简
  【先问什么】tech_stack 参数缺失时，询问技术栈偏好
allowed-tools:
  - Read
  - Write
  - Bash
  - mcp__auggie-mcp__codebase-retrieval
  - LSP
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 command 传入）
  - name: variant_id
    type: string
    required: true
    description: 选定的设计变体标识（A/B/C）
  - name: tech_stack
    type: string
    required: false
    description: 技术栈（react-tailwind / vue-tailwind），默认 react-tailwind
---

# Code Generator

## 职责边界

**双模型协作**生成前端代码：Gemini 快速原型 + Claude 精简重构。

- **输入**: `${run_dir}/design-{variant}.md` + `tech_stack` 参数
- **输出**: `${run_dir}/code/{tech_stack}/`
- **核心能力**: 多模型协作、代码生成、重构精简、类型补全

---

## 多模型协作架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Code Generator                          │
├─────────────────────────────────────────────────────────────┤
│  Step 1 (Gemini)  →  Step 2 (Claude)  →  Step 3 (Claude)   │
│  原型生成             重构精简             类型补全          │
│      ↓                   ↓                   ↓              │
│  gemini-raw/        refactored/          final/            │
│  (70% 质量)         (85% 质量)           (95% 质量)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚨 强制执行规则

**禁止行为**：
- ❌ 跳过 Gemini，自己直接写代码
- ❌ 跳过 auggie-mcp 代码分析
- ❌ 跳过 LSP 符号分析（发现组件文件时）

**✅ 必须按照 Step 顺序执行**

---

## 执行流程

### Step 0: 🚨 强制分析现有代码结构（auggie-mcp + LSP）

**必须执行**（即使是新项目也要执行）

```
mcp__auggie-mcp__codebase-retrieval(
  information_request="查找项目中现有的 UI 组件实现、样式系统、类型定义和导出结构。"
)
```

**如果发现组件文件，必须调用 LSP**：

```
LSP(operation="documentSymbol", filePath="src/components/index.ts", line=1, character=1)
LSP(operation="hover", filePath="src/components/Button.tsx", line=10, character=15)
```

**产出**：`existing_components`, `style_framework`, `component_props`, `export_patterns`

### Step 1: 🚨 Gemini 生成原型（强制）

**读取设计规格**：

```
Read: ${run_dir}/design-{variant_id}.md
```

**🚨 必须调用 Gemini**：

```bash
~/.claude/bin/codeagent-wrapper gemini --model gemini-2.5-flash --prompt "${prompt}"
```

> 📚 Gemini 提示词模板见 [references/tech-stack-templates.md](references/tech-stack-templates.md#5-gemini-提示词模板)

**验证检查点**：
- [ ] 执行了 `codeagent-wrapper gemini` 命令
- [ ] `${run_dir}/code/gemini-raw/` 目录已创建

**Gemini 产出**：`${run_dir}/code/gemini-raw/`

### Step 2: Claude 重构精简

Claude 读取 Gemini 输出，执行重构检查清单：

| 检查项 | 说明 |
|--------|------|
| 移除 wrapper div | 去除无意义嵌套 |
| 合并重复样式 | 提取为 @apply 或组件 |
| 提取魔法数字 | 使用 Tailwind 或常量 |
| 统一命名规范 | PascalCase/camelCase/UPPER_SNAKE |
| 移除多余注释 | 保留有意义的注释 |

> 📚 详细重构示例见 [references/tech-stack-templates.md](references/tech-stack-templates.md#1-重构检查清单)

**Claude 产出**：`${run_dir}/code/refactored/`

### Step 3: Claude 类型补全与可访问性

确保代码达到生产级质量：

| 补全项 | 说明 |
|--------|------|
| TypeScript 类型 | 完整的 Props 接口定义 |
| 可访问性属性 | ARIA 标签、键盘支持 |
| JSDoc 文档 | 组件使用示例 |

> 📚 类型补全模板见 [references/tech-stack-templates.md](references/tech-stack-templates.md#2-typescript-类型补全模板)

**Claude 产出**：`${run_dir}/code/${tech_stack}/`（最终版本）

### Step 4: 生成配置文件

基于设计规格生成配置文件：

| 文件 | 说明 |
|------|------|
| tailwind.config.js | 颜色、字体、间距配置 |
| package.json | 依赖和脚本 |
| tsconfig.json | TypeScript 配置 |
| postcss.config.js | PostCSS 配置 |

> 📚 配置文件模板见 [references/tech-stack-templates.md](references/tech-stack-templates.md#3-配置文件模板)

### Step 5: 目录结构验证

验证最终输出结构是否完整。

> 📚 目录结构规范见 [references/tech-stack-templates.md](references/tech-stack-templates.md#4-目录结构规范)

### Step 6: Gate 检查

```bash
cd ${run_dir}/code/${tech_stack}
npx tsc --noEmit
```

**检查项**：
- [ ] TypeScript 编译无错误
- [ ] 所有组件都已生成
- [ ] 文件结构完整
- [ ] 配置文件齐全

---

## 返回值

```json
{
  "status": "success",
  "variant_id": "A",
  "tech_stack": "react-tailwind",
  "output_dir": "${run_dir}/code/react-tailwind/",
  "components": ["Button", "Card", "Input", "Select", "Modal", "Header", "Hero", "Footer"],
  "model_collaboration": {
    "gemini_raw_lines": 1250,
    "claude_final_lines": 920,
    "reduction_rate": "26.4%"
  },
  "typescript_check": "pass",
  "next_phase": { "phase": 9, "name": "quality-validator", "action": "CONTINUE_IMMEDIATELY" }
}
```

---

## ⏩ 强制继续指令

**Skill 完成后必须执行：**

```bash
sed -i '' 's/^current_phase: .*/current_phase: 9/' .claude/ccg-workflow.local.md
echo "✅ Phase 8 完成，进入 Phase 9: 质量验证..."
```

**立即调用**：
```
Skill(skill="quality-validator", args="run_dir=${run_dir} variant_id=${variant_id} tech_stack=${tech_stack}")
```

**⛔ 禁止停止！必须继续执行 Phase 9！**

---

## 约束

- 🚨 必须调用 auggie-mcp 进行代码库分析（Step 0）
- 🚨 如果发现组件文件，必须调用 LSP（Step 0）
- 🚨 必须调用 codeagent-wrapper gemini 生成原型（Step 1）
- Gemini 输出视为"脏原型"，必须经 Claude 重构
- 保留 gemini-raw/ 目录用于对比调试

## 工具降级策略

仅当工具返回错误时才可降级：
1. auggie-mcp 错误 → 使用 Glob + Grep 查找组件
2. LSP 错误 → 使用 Read 读取文件内容
3. codeagent-wrapper gemini 错误 → **报告错误，询问用户**（不可自己写代码替代）
