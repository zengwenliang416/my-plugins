---
name: quality-validator
description: |
  【触发条件】代码生成完成后，验证代码质量和设计还原度
  【核心产出】输出 ${run_dir}/quality-report.md
  【不触发】无代码产物
  【先问什么】variant_id 或 tech_stack 参数缺失时询问
  【🚨 强制】必须使用 codeagent-wrapper gemini 进行代码质量和设计还原度分析
  【依赖】gemini/codeagent-wrapper（参考 skills/gemini-cli/）
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
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

# Quality Validator

## 职责边界

验证生成代码的质量和设计还原度，确保交付标准。

- **输入**: `${run_dir}/code/{tech_stack}/`
- **输出**: `${run_dir}/quality-report.md`
- **核心能力**: 代码质量检查、设计还原度验证、综合评分

---

## 评分体系

| 类别 | 满分 | 检查项 |
|------|------|--------|
| 代码质量 | 5 | 语法、未使用代码、命名、职责单一、复用性 |
| 设计还原度 | 5 | 颜色、字体、间距、响应式、完整性 |
| **合计** | **10** | **10** |

**Gate 通过条件**：总分 ≥ 7.5

> 📚 完整评分体系见 [references/validation-rules.md](references/validation-rules.md#1-评分体系)

---

## 执行流程

### Step 1: 加载检查目标

```
Glob: ${run_dir}/code/{tech_stack}/**/*.{tsx,jsx,ts,js,css}
Read: ${run_dir}/design-{variant_id}.md
```

### Step 2: 代码结构分析（auggie-mcp + LSP）

```
mcp__auggie-mcp__codebase-retrieval({
  information_request: "分析 ${run_dir}/code/${tech_stack}/ 中的组件结构、类型定义、导出模式"
})

for component_file in component_files:
  LSP(operation="documentSymbol", filePath=component_file, line=1, character=1)
  LSP(operation="hover", filePath=component_file, line=10, character=15)
  LSP(operation="findReferences", filePath=component_file, line=3, character=15)
```

### Step 2.5: 🚨 Gemini 代码质量分析（强制）

```bash
~/.claude/bin/codeagent-wrapper gemini --role frontend --prompt "
你是一位资深前端架构师和代码审查专家。请对以下代码进行全面的质量验证：

技术栈：${tech_stack}
设计规格：${design_spec_summary}

请从以下维度进行专业评估：

## 1. 代码质量（5 分制）
- 语法错误检查 (1分)
- 未使用代码检查 (1分)
- 命名规范检查 (1分)
- 组件职责单一性 (1分)
- 代码复用性 (1分)

## 2. 设计还原度（5 分制）
- 颜色值匹配 (1分)
- 字体规格匹配 (1分)
- 间距/圆角匹配 (1分)
- 响应式实现 (1分)
- 组件完整性 (1分)

为每项给出：分数（0/0.5/0.75/1.0）、状态（✅/⚠️/❌）、问题、修复建议
"
```

### Step 3: 代码质量检查（5 项，共 5 分）

| 检查项 | 满分 | 方法 |
|--------|------|------|
| 语法错误 | 1.0 | `npx tsc --noEmit` |
| 未使用代码 | 1.0 | Grep + ESLint |
| 命名规范 | 1.0 | LSP documentSymbol |
| 职责单一 | 1.0 | 行数/函数数/Props数 |
| 代码复用 | 1.0 | 重复类名检测 |

> 📚 详细检查逻辑见 [references/validation-rules.md](references/validation-rules.md#2-代码质量检查5-项)

### Step 4: 设计还原度检查（5 项，共 5 分）

| 检查项 | 满分 | 方法 |
|--------|------|------|
| 颜色匹配 | 1.0 | 对比设计规格与代码色值 |
| 字体匹配 | 1.0 | 检查字体族和字号 |
| 间距/圆角 | 1.0 | 验证 4px 基数 |
| 响应式 | 1.0 | 断点和响应式类使用 |
| 完整性 | 1.0 | 组件清单对比 |

> 📚 详细检查逻辑见 [references/validation-rules.md](references/validation-rules.md#3-设计还原度检查5-项)

### Step 5: 计算总分

```python
code_quality_score = syntax + unused + naming + srp + reuse  # 5 分
design_score = color + font + spacing + responsive + completeness  # 5 分
total_score = code_quality_score + design_score  # 10 分
grade = getGrade(total_score)
```

### Step 6: 生成验证报告

**输出**：`${run_dir}/quality-report.md`

> 📚 报告模板见 [references/validation-rules.md](references/validation-rules.md#4-报告模板)

### Step 7: Gate 检查

**通过条件**：总分 ≥ 7.5 / 10

**失败时**：返回具体修复建议，标记为"需要重构"

---

## 返回值

**成功时**：
```json
{
  "status": "pass",
  "final_score": 8.5,
  "grade": "A (良好)",
  "code_quality_score": 4.5,
  "design_restoration_score": 4.0,
  "output_file": "${run_dir}/quality-report.md",
  "next_phase": { "phase": 10, "name": "delivery", "action": "CONTINUE_IMMEDIATELY" }
}
```

**失败时**：
```json
{
  "status": "fail",
  "final_score": 6.5,
  "grade": "C (勉强)",
  "blocking_issues": ["TypeScript 编译失败", "颜色匹配率 <75%"],
  "output_file": "${run_dir}/quality-report.md"
}
```

---

## ⏩ 强制继续指令

**Skill 完成后必须执行：**

```bash
sed -i '' 's/^current_phase: .*/current_phase: 10/' .claude/ccg-workflow.local.md
echo "✅ Phase 9 完成，进入 Phase 10: 交付..."
```

**执行 Phase 10 交付：**
1. 输出完成摘要（包含所有产物路径）
2. 删除状态文件：`rm -f .claude/ccg-workflow.local.md`
3. 输出 `<promise>ui-design 工作流完成</promise>`

**⛔ 禁止停止！必须继续执行 Phase 10 交付！**

---

## 约束

- 客观评分，严格按照评分标准
- 所有问题必须指向具体文件和行号
- 允许合理小误差（色值 ±5%）
- 7.5 分即可交付
- auggie-mcp 优先用于代码结构分析
- LSP 用于类型定义和符号结构验证
