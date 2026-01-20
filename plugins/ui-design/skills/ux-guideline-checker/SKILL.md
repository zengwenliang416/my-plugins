---
name: ux-guideline-checker
description: |
  【触发条件】设计方案生成后，检查是否符合 UX 准则
  【核心产出】输出 ${run_dir}/ux-check-report.md
  【不触发】无设计方案文件
  【先问什么】variant_id 参数缺失时，询问检查哪个变体
  【🚨 强制】必须使用 codeagent-wrapper gemini 进行 UX 准则专家分析
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
    description: 要检查的设计变体标识（A/B/C）
---

# UX Guideline Checker

## 职责边界

检查设计方案是否符合 UX 准则（可访问性、可用性、一致性、性能、响应式）。

- **输入**: `${run_dir}/design-{variant}.md`
- **输出**: `${run_dir}/ux-check-report.md`
- **核心能力**: 规则检查、问题识别、改进建议、修复方案生成

---

## MCP 工具集成

| MCP 工具              | 用途                                 | 触发条件        |
| --------------------- | ------------------------------------ | --------------- |
| `sequential-thinking` | 结构化 UX 检查策略，确保覆盖所有维度 | 🚨 每次执行必用 |
| `auggie-mcp`          | 语义检索现有 UX 实践                 | 优化现有界面时  |

## 执行流程

### Step 0: 结构化 UX 检查规划（sequential-thinking）

🚨 **必须首先使用 sequential-thinking 规划 UX 检查策略**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "规划 UX 检查策略。需要：1) 解析设计方案 2) 检查可访问性 3) 验证可用性 4) 评估一致性 5) 检测性能和响应式问题",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**思考步骤**：

1. **设计方案解析**：从 design-{variant}.md 提取色值、字体、组件规格
2. **可访问性检查**：验证对比度、键盘访问、焦点状态、ARIA
3. **可用性验证**：检查点击区域、加载状态、表单验证
4. **一致性评估**：验证间距基数、颜色统一、命名规范
5. **性能和响应式检测**：检查动画时长、断点定义、字号缩放

---

## 🚨 强制执行规则

**禁止行为**：

- ❌ 跳过 auggie-mcp 代码分析（优化现有界面时）
- ❌ 跳过 LSP 符号分析（发现组件文件时）
- ❌ 自己编写检查报告而不进行系统性分析

**✅ 必须按照 Step 顺序执行**

---

## 执行流程（续）

### Step 1: 读取设计方案

```
Read: ${run_dir}/design-{variant_id}.md
```

**提取**：色值系统、字体规格、间距系统、圆角系统、组件样式、响应式策略

### Step 1.5: 加载 UX 准则参考

```bash
SKILL_ROOT="${CLAUDE_PLUGIN_ROOT}/plugins/commands/ui-design/skills"
Read: ${SKILL_ROOT}/_shared/ux-guidelines/accessibility.yaml
Read: ${SKILL_ROOT}/_shared/ux-guidelines/usability.yaml
Read: ${SKILL_ROOT}/_shared/ux-guidelines/consistency.yaml
Read: ${SKILL_ROOT}/_shared/ux-guidelines/performance.yaml
Read: ${SKILL_ROOT}/_shared/ux-guidelines/responsive.yaml
```

### Step 2: 🚨 分析现有 UX 实践（auggie-mcp + LSP）

**优化现有界面时必须执行**

```
mcp__auggie-mcp__codebase-retrieval(
  information_request="查找项目中所有可访问性相关的实现：ARIA 标签、键盘导航、焦点管理、屏幕阅读器支持。"
)
```

**发现组件文件时必须调用 LSP**：

```
LSP(operation="hover", filePath="src/components/Button.tsx", line=10, character=5)
LSP(operation="documentSymbol", filePath="src/components/Form.tsx", line=1, character=1)
```

**产出**：`aria_usage`, `keyboard_nav`, `focus_styles`, `contrast_handling`

**跳过条件**：全新项目或 auggie-mcp 返回空结果

### Step 2.5: 🚨 Gemini UX 专家分析（强制）

```bash
~/.claude/bin/codeagent-wrapper gemini --role frontend --prompt "
你是一位资深 UX 设计师和可访问性专家（WCAG 认证）。请对以下设计方案进行全面的 UX 准则检查：

设计方案内容：
${design_doc_content}

请从以下 5 个维度进行专业评估：
1. 可访问性 - 对比度、键盘访问、焦点状态、ARIA
2. 可用性 - 点击区域、加载状态、表单验证、用户反馈
3. 一致性 - 间距基数、颜色 Token、组件样式、命名规范
4. 性能 - 动画时长、GPU 加速、字体加载
5. 响应式 - 断点定义、字号缩放、布局适配

为每项给出：状态（✅/⚠️/❌）、严重级别、问题描述、修复建议
"
```

### Step 3: UX 准则检查

执行 5 大类检查：

| 类别     | 检查项                                                |
| -------- | ----------------------------------------------------- |
| 可访问性 | UI-A-001 对比度、UI-A-002 键盘访问、UI-A-003 焦点状态 |
| 可用性   | UI-U-001 点击区域、UI-U-002 加载状态                  |
| 一致性   | UI-C-001 间距基数、UI-C-002 颜色统一                  |
| 性能     | UI-P-001 动画时长、UI-P-002 硬件加速                  |
| 响应式   | UI-R-001 断点定义、UI-R-002 字号缩放                  |

> 📚 详细检查逻辑见 [references/ux-guidelines.md](references/ux-guidelines.md#1-ux-准则检查清单)

### Step 4: 汇总检查结果

```python
passed_count = len([c for c in all_checks if c.status == "pass"])
warning_count = len([c for c in all_checks if c.status == "warning"])
failed_count = len([c for c in all_checks if c.status == "fail"])
pass_rate = passed_count / len(all_checks)
high_priority_issues = [i for i in issues if i.severity == "high"]
```

### Step 5: 生成修复建议

为每个失败项生成 JSON 格式修复建议。

> 📚 JSON 格式见 [references/ux-guidelines.md](references/ux-guidelines.md#2-修复建议-json-格式)

### Step 6: 生成检查报告

**输出**：`${run_dir}/ux-check-report.md`

> 📚 报告模板见 [references/ux-guidelines.md](references/ux-guidelines.md#3-报告模板)

### Step 7: Gate 检查

| 条件         | 要求  |
| ------------ | ----- |
| 通过率       | ≥ 80% |
| 高优先级问题 | = 0   |

**失败时**：返回修复建议，调用 design-variant-generator 传入 fixes 参数

---

## 返回值

**通过时**：

```json
{
  "status": "pass",
  "variant_id": "A",
  "pass_rate": 0.92,
  "output_file": "${run_dir}/ux-check-report.md",
  "next_phase": {
    "phase": 8,
    "name": "code-generator",
    "action": "CONTINUE_IMMEDIATELY"
  }
}
```

**失败时**：

```json
{
  "status": "fail",
  "variant_id": "A",
  "pass_rate": 0.80,
  "high_priority_issues": [...],
  "fixes_json": "{\"fixes\": [...]}",
  "output_file": "${run_dir}/ux-check-report.md",
  "next_action": { "action": "RETRY_DESIGN", "target_skill": "design-variant-generator" }
}
```

---

## ⏩ 强制继续指令

### 通过时（status: pass）

```bash
sed -i '' 's/^current_phase: .*/current_phase: 8/' .claude/ccg-workflow.local.md
echo "✅ Phase 7 完成（UX 检查通过），进入 Phase 8: 代码生成..."
```

**立即调用**：

```
Skill(skill="code-generator", args="run_dir=${run_dir} variant_id=${variant_id} tech_stack=${tech_stack}")
```

### 失败时（status: fail）

```bash
echo "❌ Phase 7 UX 检查失败，需要修复设计方案..."
```

**回退调用**：

```
Skill(skill="design-variant-generator", args="run_dir=${run_dir} variant_id=${variant_id} fixes=${fixes_json}")
```

**⛔ 禁止停止！必须继续执行下一步！**

---

## 约束

- 🚨 优化场景必须调用 auggie-mcp 分析现有 UX 实践
- 🚨 发现组件文件必须调用 LSP 获取可访问性信息
- 必须生成 `${run_dir}/ux-check-report.md`
- 报告必须包含 JSON 格式修复建议

## 工具降级策略

仅当工具返回错误时才可降级：

1. auggie-mcp 错误 → 使用 Grep 搜索 aria-\* 属性
2. LSP 错误 → 使用 Read 读取组件文件
3. 全新项目 → 跳过现有代码分析
