# UX Guidelines Reference

本文档包含 UX 准则检查的详细规则、检查逻辑和报告模板。

---

## 1. UX 准则检查清单

### 1.1 可访问性检查 (Accessibility)

**UI-A-001: 对比度符合 WCAG AA**

```python
# 提取 (文本色, 背景色) 组合
color_pairs = [
  {text: "#111827", bg: "#FFFFFF"},   # 主文本 on 主背景
  {text: "#4B5563", bg: "#FFFFFF"},   # 辅助文本 on 主背景
  {text: "#FFFFFF", bg: "#000000"},   # 白字 on 主按钮
]

# 计算对比度（WCAG 2.1 相对亮度公式）
for pair in color_pairs:
  ratio = calculateContrast(pair.text, pair.bg)
  if ratio < 4.5:  # WCAG AA 标准
    issues.push({
      guideline_id: "UI-A-001",
      severity: "high",
      description: f"对比度不足: {pair.text} on {pair.bg} = {ratio}:1 (需要 ≥ 4.5:1)",
      fix: f"建议将 {pair.text} 改为更深的颜色"
    })
```

**UI-A-002: 交互元素可键盘访问**

```python
keywords = ["tabindex", "keyboard", "focus", "keydown", "keypress"]
has_keyboard_support = any(kw in design_doc for kw in keywords)

if not has_keyboard_support:
  issues.push({
    guideline_id: "UI-A-002",
    severity: "medium",
    description: "设计文档未说明键盘导航支持",
    fix: "补充 Tab 键导航顺序、焦点样式说明"
  })
```

**UI-A-003: 焦点状态可见**

```python
has_focus_style = ":focus" in design_doc or "focus:" in design_doc

if not has_focus_style:
  issues.push({
    guideline_id: "UI-A-003",
    severity: "high",
    description: "未定义焦点状态样式",
    fix: "为所有交互元素添加 focus:outline-2 focus:outline-primary"
  })
```

### 1.2 可用性检查 (Usability)

**UI-U-001: 按钮尺寸符合最小点击区域**

```python
# 最小点击区域: 44x44px (移动端) / 32x32px (桌面端)
button_padding = extractButtonPadding(design_doc)
v_padding, h_padding = parsePadding(button_padding)

if v_padding < 12:
  issues.push({
    guideline_id: "UI-U-001",
    severity: "medium",
    description: f"按钮垂直内边距 {v_padding}px 可能导致点击区域不足",
    fix: "建议 padding-y ≥ 12px"
  })
```

**UI-U-002: 加载状态定义**

```python
has_loading_state = "loading" in design_doc or "spinner" in design_doc

if not has_loading_state:
  warnings.push({
    guideline_id: "UI-U-002",
    severity: "low",
    description: "未定义加载状态样式",
    fix: "补充 Button loading 变体、Skeleton 加载组件"
  })
```

### 1.3 一致性检查 (Consistency)

**UI-C-001: 间距符合 4px 基数**

```python
spacing_values = extractAllSpacing(design_doc)
non_standard = [v for v in spacing_values if v % 4 != 0]

if non_standard:
  issues.push({
    guideline_id: "UI-C-001",
    severity: "high",
    description: f"发现非标准间距值: {non_standard}",
    fix: f"统一使用 4px 基数: {[round(v/4)*4 for v in non_standard]}"
  })
```

**UI-C-002: 颜色使用统一**

```python
color_tokens = extractDefinedColors(design_doc)
used_colors = extractUsedColors(design_doc)
undefined_colors = [c for c in used_colors if c not in color_tokens.values()]

if undefined_colors:
  issues.push({
    guideline_id: "UI-C-002",
    severity: "medium",
    description: f"使用了未定义的颜色: {undefined_colors}",
    fix: "将颜色添加到色值系统或使用现有 Token"
  })
```

### 1.4 性能检查 (Performance)

**UI-P-001: 动画时长合理**

```python
durations = extractAnimationDurations(design_doc)
slow_animations = [d for d in durations if d > 300]

if slow_animations:
  warnings.push({
    guideline_id: "UI-P-001",
    severity: "low",
    description: f"存在较慢的动画: {slow_animations}ms",
    fix: "建议交互动画 ≤ 300ms"
  })
```

**UI-P-002: 使用硬件加速属性**

```python
has_gpu_friendly = "transform" in design_doc or "opacity" in design_doc

if not has_gpu_friendly:
  warnings.push({
    guideline_id: "UI-P-002",
    severity: "low",
    description: "动画未使用 GPU 加速属性",
    fix: "优先使用 transform/opacity 而非 left/top/width"
  })
```

### 1.5 响应式检查 (Responsive)

**UI-R-001: 定义完整断点**

```python
breakpoints = extractBreakpoints(design_doc)
required_breakpoints = ["mobile", "tablet", "desktop"]
missing = [b for b in required_breakpoints if b not in breakpoints]

if missing:
  issues.push({
    guideline_id: "UI-R-001",
    severity: "high",
    description: f"缺少断点定义: {missing}",
    fix: "补充 Mobile(<640px), Tablet(640-1024px), Desktop(>1024px)"
  })
```

**UI-R-002: 字号响应式缩放**

```python
has_font_scaling = "移动端" in design_doc and ("字号" in design_doc or "font-size" in design_doc)

if not has_font_scaling:
  issues.push({
    guideline_id: "UI-R-002",
    severity: "medium",
    description: "移动端字号缩放策略未定义",
    fix: "建议移动端字号缩小 10-15%"
  })
```

---

## 2. 修复建议 JSON 格式

```json
{
  "fixes": [
    {
      "type": "color_contrast",
      "token": "text-muted",
      "current_value": "#6B7280",
      "suggested_value": "#4B5563",
      "reason": "提高对比度从 3.9:1 到 5.2:1"
    },
    {
      "type": "spacing",
      "value": 17,
      "suggested_value": 16,
      "reason": "统一为 4px 基数"
    },
    {
      "type": "font_size",
      "element": "body-mobile",
      "current_value": "16px",
      "suggested_value": "14px",
      "reason": "移动端字号缩放"
    }
  ]
}
```

---

## 3. 报告模板

`${run_dir}/ux-check-report.md` 使用以下结构：

```markdown
---
checked_at: "{ISO 8601 时间戳}"
checker_version: "2.0"
target_design: "${run_dir}/design-{variant_id}.md"
variant_id: "{A/B/C}"
---

# UX 准则检查报告

## 检查概览

**检查项目**: 25 条核心 UX 准则
**通过项**: {20}
**警告项**: {3}
**失败项**: {2}
**通过率**: {80%}
**评分**: {8.0 / 10}

## 高优先级问题 ({N})

### ❌ UI-A-001: 对比度不符合 WCAG AA

- **严重级别**: 高
- **描述**: 辅助文本对比度不足 (#6B7280 on #FFFFFF = 3.9:1，需要 ≥ 4.5:1)
- **建议修复**: 将辅助文本色改为 #4B5563 (对比度 5.2:1)

### ❌ UI-C-001: 间距不符合 4px 基数

- **严重级别**: 高
- **描述**: 发现非标准间距值: 17px, 22px
- **建议修复**: 统一使用 4px 基数: 16px, 24px

## 中优先级警告 ({N})

### ⚠️ UI-A-002: 键盘导航支持未说明

- **严重级别**: 中
- **描述**: 设计文档未明确说明键盘导航支持
- **建议修复**: 补充 Tab 键导航顺序、焦点样式说明

## 通过的准则 ({N})

✅ UI-A-003: 焦点状态可见
✅ UI-U-002: 加载状态定义
✅ UI-C-002: 颜色使用统一
...

## Gate 判定

**判定标准**: 通过率 ≥ 80% 且高优先级问题 = 0

**当前状态**:
- 通过率: 80% ✅
- 高优先级问题: 2 个 ❌

**结论**: ❌ **未通过** - 需要修复高优先级问题后重新检查

## 修复建议（JSON 格式，供重试使用）

\`\`\`json
{
  "fixes": [...]
}
\`\`\`
```

---

## 4. Gate 判定标准

| 条件 | 要求 |
|------|------|
| 通过率 | ≥ 80% |
| 高优先级问题 | = 0 |

**通过**：满足所有条件，继续下一阶段
**失败**：返回修复建议，调用 design-variant-generator 修复
