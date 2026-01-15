---
name: ux-guideline-checker
description: |
  【触发条件】设计方案生成后，检查是否符合 UX 准则
  【核心产出】输出 ${run_dir}/ux-check-report.md
  【不触发】无设计方案文件
allowed-tools: Read, Write, Bash
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
  - name: variant_id
    type: string
    required: true
    description: 要检查的设计变体标识（A/B/C）
---

# UX Guideline Checker

## 职责边界

检查设计方案是否符合 98 条 UX 准则（可访问性、可用性、一致性、性能、响应式）。

- **输入**: `${run_dir}/design-{variant}.md`
- **输出**: `${run_dir}/ux-check-report.md`
- **核心能力**: 规则检查、问题识别、改进建议

## 执行流程

### Step 1: 加载 UX 准则库

读取所有 UX 准则文件。

```bash
Read: ~/.claude/skills/ui-ux/_shared/ux-guidelines/accessibility.yaml
Read: ~/.claude/skills/ui-ux/_shared/ux-guidelines/usability.yaml
Read: ~/.claude/skills/ui-ux/_shared/ux-guidelines/consistency.yaml
Read: ~/.claude/skills/ui-ux/_shared/ux-guidelines/performance.yaml
Read: ~/.claude/skills/ui-ux/_shared/ux-guidelines/responsive.yaml
```

**提取字段**：

- guideline_id (如 UI-A-001)
- title
- description
- priority (高/中/低)
- check_method
- example

### Step 2: 读取设计方案

```typescript
Read: ${run_dir}/design-{variant}.md

// 提取关键信息：
- 色值系统
- 字体规格
- 组件样式
- 响应式策略
- 交互说明
```

### Step 3: 逐条检查准则

对每条准则执行检查。

**检查示例**：

**UI-A-001: 对比度符合 WCAG AA**

```typescript
// 提取设计方案中的 (文本色, 背景色) 组合
const colorPairs = [
  { text: "#111827", bg: "#FFFFFF" },
  { text: "#6B7280", bg: "#FFFFFF" },
  // ...
];

// 计算对比度
for (pair in colorPairs) {
  ratio = calculateContrast(pair.text, pair.bg);
  if (ratio < 4.5) {
    issues.push({
      guideline_id: "UI-A-001",
      severity: "high",
      description: `对比度不足: ${pair.text} on ${pair.bg} = ${ratio}:1 (需要 ≥ 4.5:1)`,
    });
  }
}
```

**UI-A-002: 交互元素可键盘访问**

```typescript
// 检查组件规格中是否提到键盘支持
const hasKeyboardSupport =
  design_doc.includes("tabindex") ||
  design_doc.includes("keyboard") ||
  design_doc.includes("focus");

if (!hasKeyboardSupport) {
  warnings.push({
    guideline_id: "UI-A-002",
    severity: "medium",
    description: "设计文档未说明键盘导航支持",
  });
}
```

**检查分类**：

1. **可访问性 (20 条)**
   - 对比度、alt 文本、键盘导航、ARIA 标签、焦点状态

2. **可用性 (25 条)**
   - 按钮尺寸、点击区域、加载状态、错误提示、操作反馈

3. **一致性 (18 条)**
   - 间距系统、颜色使用、字体规格、组件样式、命名规范

4. **性能 (15 条)**
   - 图片优化、代码分割、缓存策略、动画性能

5. **响应式 (20 条)**
   - 断点设置、布局适配、字号缩放、触摸友好

### Step 4: 生成检查报告

**输出路径**：`${run_dir}/ux-check-report.md`

**文档模板**：

```markdown
---
checked_at: "{时间戳}"
checker_version: "1.0"
target_design: "${run_dir}/design-{variant}.md"
---

# UX 准则检查报告

## 检查概览

**检查项目**: 98 条 UX 准则
**通过项**: {85}
**警告项**: {10}
**失败项**: {3}
**通过率**: {86.7%}

**评分**: {8.5 / 10}

## 高优先级问题 ({3})

### ❌ UI-A-001: 对比度不符合 WCAG AA

- **描述**: 辅助文本对比度不足 (#6B7280 on #FFFFFF = 3.9:1，需要 ≥ 4.5:1)
- **建议**: 将辅助文本色改为 #4B5563 (对比度 5.2:1)

### ❌ UI-R-015: 移动端字号过小

- **描述**: Body 字号 16px 在移动端未缩放
- **建议**: 移动端使用 14px 或添加 viewport meta

### ❌ UI-C-008: 间距不符合 4px 基数

- **描述**: 发现非标准间距值: 17px, 22px
- **建议**: 统一使用 4px 基数: 16px, 24px

## 中优先级警告 ({10})

### ⚠️ UI-A-002: 键盘导航支持未说明

- **描述**: 设计文档未明确说明键盘导航支持
- **建议**: 补充 Tab 键导航顺序、焦点样式说明

{其他警告...}

## 通过的准则 ({85})

✅ UI-A-003: 图片提供替代文本说明
✅ UI-U-001: 按钮尺寸符合最小点击区域
✅ UI-C-001: 使用统一的配色系统
{...}

## 改进建议

### 立即修复（高优先级）

1. 调整辅助文本颜色以提高对比度
2. 添加移动端字号缩放策略
3. 统一间距系统，移除非标准值

### 后续优化（中优先级）

1. 补充键盘导航说明
2. 添加加载状态设计
3. 完善错误提示样式

### Gate 判定

**是否通过**: { ✅ 通过 / ❌ 失败 }
**判定标准**: 通过率 ≥ 80% 且高优先级问题 = 0
**当前状态**: 通过率 86.7%，但存在 3 个高优先级问题
**结论**: ❌ 需要修复高优先级问题后重新检查
```

### Step 5: Gate 检查

**通过条件**：

- 通过率 ≥ 80%
- 高优先级问题 = 0

**如果失败**：

- 返回失败状态
- 提供具体修复建议
- 建议修正设计方案并重新生成

## 返回值

```json
{
  "status": "pass / fail",
  "pass_rate": 0.867,
  "total_guidelines": 98,
  "passed": 85,
  "warnings": 10,
  "failures": 3,
  "high_priority_issues": [
    {
      "id": "UI-A-001",
      "title": "对比度不符合 WCAG AA",
      "fix": "将辅助文本色改为 #4B5563"
    }
  ]
}
```

## 注意事项

1. **对比度计算**: 使用 WCAG 2.1 公式
2. **容错性**: 设计文档信息不完整时，标记为 "未检查" 而非 "失败"
3. **实用性**: 只检查设计文档中明确说明的部分
