---
name: ux-guideline-checker
description: |
  【触发条件】设计方案生成后，检查是否符合 UX 准则
  【核心产出】输出 ${run_dir}/ux-check-report.md
  【不触发】无设计方案文件
  【先问什么】variant_id 参数缺失时，询问检查哪个变体
  【🚨 强制】必须使用 gemini-cli 进行 UX 准则专家分析
  【依赖】gemini-cli（参考 skills/gemini-cli/）
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
    description: 要检查的设计变体标识（A/B/C）
---

# UX Guideline Checker

## 职责边界

检查设计方案是否符合 UX 准则（可访问性、可用性、一致性、性能、响应式）。

- **输入**: `${run_dir}/design-{variant}.md`
- **输出**: `${run_dir}/ux-check-report.md`
- **核心能力**: 规则检查、问题识别、改进建议、修复方案生成

---

## 🚨🚨🚨 强制执行规则（不可跳过）

**禁止行为（违反则 Skill 失败）：**

- ❌ 跳过 auggie-mcp 代码分析（如果是优化现有界面）
- ❌ 跳过 LSP 符号分析（如果发现组件文件）
- ❌ 用 Read 读文件然后自己写检查报告（而不是系统性分析）
- ❌ 说 "我来分析 UX" 然后自己写

**✅ 唯一正确做法**：按照下面的 Step 顺序执行

---

## 执行流程

### Step 1: 读取设计方案

```
Read: ${run_dir}/design-{variant_id}.md
```

**提取关键信息**：
- 色值系统（所有颜色 Token 和 Hex 值）
- 字体规格（字号、字重、行高）
- 间距系统（是否使用 4px 基数）
- 圆角系统
- 组件样式规格
- 响应式策略

### Step 2: 🚨 强制分析现有 UX 实践（auggie-mcp + LSP）

**🚨 如果是优化现有界面，此步骤必须执行**

**必须调用 `mcp__auggie-mcp__codebase-retrieval`**：

```
mcp__auggie-mcp__codebase-retrieval(
  information_request="查找项目中所有可访问性相关的实现：ARIA 标签、键盘导航、焦点管理、屏幕阅读器支持。

  请回答：
  1. 哪些组件有 ARIA 属性？
  2. 键盘导航如何实现？
  3. 焦点状态样式在哪里定义？
  4. 颜色对比度如何处理？"
)
```

**如果 auggie-mcp 发现了组件文件，必须调用 LSP**：

```
# 分析组件的可访问性 Props（必须）
LSP(operation="hover", filePath="src/components/Button.tsx", line=10, character=5)

# 获取组件符号结构（必须）
LSP(operation="documentSymbol", filePath="src/components/Form.tsx", line=1, character=1)
```

**产出**：
- `aria_usage`: 现有 ARIA 属性使用情况
- `keyboard_nav`: 键盘导航实现
- `focus_styles`: 焦点状态样式
- `contrast_handling`: 颜色对比度处理

**验证检查点**：
- [ ] 如果是优化场景，执行了 auggie-mcp 检索
- [ ] 如果发现组件文件，至少执行了 1 次 LSP hover
- [ ] 如果发现组件文件，至少执行了 1 次 LSP documentSymbol

**跳过条件**（仅以下情况可跳过）：
- 全新项目（from_scratch 场景），无现有代码
- auggie-mcp 返回空结果

### Step 2.5: 🚨 Gemini UX 专家分析（强制）

**使用 gemini-cli 进行专业 UX 准则检查**：

```bash
gemini-cli chat --prompt "
你是一位资深 UX 设计师和可访问性专家（WCAG 认证）。请对以下设计方案进行全面的 UX 准则检查：

设计方案内容：
${design_doc_content}

请从以下 5 个维度进行专业评估：

## 1. 可访问性检查 (Accessibility)
- 对比度是否符合 WCAG AA 标准（文本 ≥4.5:1，大文本 ≥3:1）？
- 所有颜色组合的具体对比度值
- 交互元素是否可键盘访问？
- 焦点状态是否明显可见？
- 是否有 ARIA 属性建议？

## 2. 可用性检查 (Usability)
- 按钮/点击区域是否 ≥44x44px（移动端）？
- 是否定义了加载状态、空状态、错误状态？
- 表单验证是否清晰？
- 用户反馈是否及时（Toast、Alert）？

## 3. 一致性检查 (Consistency)
- 间距是否符合 4px/8px 基数？
- 颜色是否统一使用 Design Token？
- 组件样式是否一致？
- 命名是否规范？

## 4. 性能检查 (Performance)
- 动画时长是否合理（≤300ms）？
- 是否使用 GPU 加速属性（transform/opacity）？
- 字体加载策略是否合理？

## 5. 响应式检查 (Responsive)
- 是否定义了完整的断点（Mobile/Tablet/Desktop）？
- 字号是否响应式缩放？
- 布局是否有移动端适配？

请为每个检查项给出：
- 状态：✅ 通过 / ⚠️ 警告 / ❌ 失败
- 严重级别：高 / 中 / 低
- 具体问题描述
- 修复建议（包含具体值）
"
```

**记录 Gemini 分析结果**：保存到变量 `gemini_ux_analysis`

### Step 3: UX 准则检查

对设计方案执行以下 5 大类检查。

#### 3.1 可访问性检查 (Accessibility)

**UI-A-001: 对比度符合 WCAG AA**

```
# 提取设计方案中的 (文本色, 背景色) 组合
color_pairs = [
  {text: "#111827", bg: "#FFFFFF"},   # 主文本 on 主背景
  {text: "#4B5563", bg: "#FFFFFF"},   # 辅助文本 on 主背景
  {text: "#FFFFFF", bg: "#000000"},   # 白字 on 主按钮
  # ...
]

# 计算对比度
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

```
# 检查组件规格中是否提到键盘支持
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

```
# 检查是否定义了 focus 状态样式
has_focus_style = ":focus" in design_doc or "focus:" in design_doc

if not has_focus_style:
  issues.push({
    guideline_id: "UI-A-003",
    severity: "high",
    description: "未定义焦点状态样式",
    fix: "为所有交互元素添加 focus:outline-2 focus:outline-primary"
  })
```

#### 3.2 可用性检查 (Usability)

**UI-U-001: 按钮尺寸符合最小点击区域**

```
# 检查按钮 padding
# 最小点击区域: 44x44px (移动端) / 32x32px (桌面端)

button_padding = extractButtonPadding(design_doc)  # e.g., "12px 24px"
v_padding, h_padding = parsePadding(button_padding)

if v_padding < 12:  # padding-y < 12px 可能导致高度不足
  issues.push({
    guideline_id: "UI-U-001",
    severity: "medium",
    description: f"按钮垂直内边距 {v_padding}px 可能导致点击区域不足",
    fix: "建议 padding-y ≥ 12px"
  })
```

**UI-U-002: 加载状态定义**

```
# 检查是否定义了加载状态
has_loading_state = "loading" in design_doc or "spinner" in design_doc

if not has_loading_state:
  warnings.push({
    guideline_id: "UI-U-002",
    severity: "low",
    description: "未定义加载状态样式",
    fix: "补充 Button loading 变体、Skeleton 加载组件"
  })
```

#### 3.3 一致性检查 (Consistency)

**UI-C-001: 间距符合 4px 基数**

```
# 提取所有间距值
spacing_values = extractAllSpacing(design_doc)  # [4, 8, 12, 16, 17, 24, ...]

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

```
# 检查是否有未定义的颜色（硬编码）
color_tokens = extractDefinedColors(design_doc)  # {primary: "#000", ...}
used_colors = extractUsedColors(design_doc)      # ["#000000", "#0070F3", "#FF0000"]

undefined_colors = [c for c in used_colors if c not in color_tokens.values()]

if undefined_colors:
  issues.push({
    guideline_id: "UI-C-002",
    severity: "medium",
    description: f"使用了未定义的颜色: {undefined_colors}",
    fix: "将颜色添加到色值系统或使用现有 Token"
  })
```

#### 3.4 性能检查 (Performance)

**UI-P-001: 动画时长合理**

```
# 检查动画时长
durations = extractAnimationDurations(design_doc)  # [150, 200, 300, 500, ...]

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

```
# 检查动画是否使用 transform/opacity
has_gpu_friendly = "transform" in design_doc or "opacity" in design_doc

if not has_gpu_friendly:
  warnings.push({
    guideline_id: "UI-P-002",
    severity: "low",
    description: "动画未使用 GPU 加速属性",
    fix: "优先使用 transform/opacity 而非 left/top/width"
  })
```

#### 3.5 响应式检查 (Responsive)

**UI-R-001: 定义完整断点**

```
# 检查是否定义了三个主要断点
breakpoints = extractBreakpoints(design_doc)  # {mobile: 640, tablet: 1024, ...}

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

```
# 检查移动端是否有字号调整策略
has_font_scaling = "移动端" in design_doc and ("字号" in design_doc or "font-size" in design_doc)

if not has_font_scaling:
  issues.push({
    guideline_id: "UI-R-002",
    severity: "medium",
    description: "移动端字号缩放策略未定义",
    fix: "建议移动端字号缩小 10-15%"
  })
```

### Step 4: 汇总检查结果

**分类统计**：

```
passed_count = len([c for c in all_checks if c.status == "pass"])
warning_count = len([c for c in all_checks if c.status == "warning"])
failed_count = len([c for c in all_checks if c.status == "fail"])

pass_rate = passed_count / len(all_checks)

high_priority_issues = [i for i in issues if i.severity == "high"]
```

### Step 5: 生成修复建议

为每个失败项生成可操作的修复建议（JSON 格式，供重试使用）。

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

### Step 6: 生成检查报告

**输出路径**：`${run_dir}/ux-check-report.md`

**文档模板**：

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

## 高优先级问题 ({2})

### ❌ UI-A-001: 对比度不符合 WCAG AA

- **严重级别**: 高
- **描述**: 辅助文本对比度不足 (#6B7280 on #FFFFFF = 3.9:1，需要 ≥ 4.5:1)
- **建议修复**: 将辅助文本色改为 #4B5563 (对比度 5.2:1)

### ❌ UI-C-001: 间距不符合 4px 基数

- **严重级别**: 高
- **描述**: 发现非标准间距值: 17px, 22px
- **建议修复**: 统一使用 4px 基数: 16px, 24px

## 中优先级警告 ({3})

### ⚠️ UI-A-002: 键盘导航支持未说明

- **严重级别**: 中
- **描述**: 设计文档未明确说明键盘导航支持
- **建议修复**: 补充 Tab 键导航顺序、焦点样式说明

### ⚠️ UI-R-002: 移动端字号未缩放

- **严重级别**: 中
- **描述**: Body 字号 16px 在移动端未缩放
- **建议修复**: 移动端使用 14px

### ⚠️ UI-U-001: 按钮点击区域偏小

- **严重级别**: 中
- **描述**: 按钮垂直内边距 10px 可能导致点击区域不足
- **建议修复**: padding-y ≥ 12px

## 通过的准则 ({20})

✅ UI-A-003: 焦点状态可见
✅ UI-U-002: 加载状态定义
✅ UI-C-002: 颜色使用统一
✅ UI-P-001: 动画时长合理
✅ UI-P-002: 使用硬件加速属性
✅ UI-R-001: 定义完整断点
{...}

## Gate 判定

**判定标准**: 通过率 ≥ 80% 且高优先级问题 = 0

**当前状态**:
- 通过率: 80% ✅
- 高优先级问题: 2 个 ❌

**结论**: ❌ **未通过** - 需要修复高优先级问题后重新检查

## 修复建议（供重试使用）

```json
{
  "fixes": [
    {
      "type": "color_contrast",
      "token": "text-muted",
      "current_value": "#6B7280",
      "suggested_value": "#4B5563"
    },
    {
      "type": "spacing",
      "value": 17,
      "suggested_value": 16
    },
    {
      "type": "spacing",
      "value": 22,
      "suggested_value": 24
    }
  ]
}
```
```

### Step 7: Gate 检查

**通过条件**：
- 通过率 ≥ 80%
- 高优先级问题 = 0

**如果失败**：
- 返回失败状态
- 提供 JSON 格式的修复建议
- 建议调用 design-variant-generator 并传入 fixes 参数

---

## 返回值

**通过时**：
```json
{
  "status": "pass",
  "variant_id": "A",
  "pass_rate": 0.92,
  "total_checks": 25,
  "passed": 23,
  "warnings": 2,
  "failures": 0,
  "high_priority_issues": [],
  "output_file": "${run_dir}/ux-check-report.md"
}
```

**失败时**：
```json
{
  "status": "fail",
  "variant_id": "A",
  "pass_rate": 0.80,
  "total_checks": 25,
  "passed": 20,
  "warnings": 3,
  "failures": 2,
  "high_priority_issues": [
    {
      "id": "UI-A-001",
      "title": "对比度不符合 WCAG AA",
      "fix": {
        "type": "color_contrast",
        "token": "text-muted",
        "suggested_value": "#4B5563"
      }
    },
    {
      "id": "UI-C-001",
      "title": "间距不符合 4px 基数",
      "fix": {
        "type": "spacing",
        "values": [{"from": 17, "to": 16}, {"from": 22, "to": 24}]
      }
    }
  ],
  "fixes_json": "{\"fixes\": [...]}",
  "output_file": "${run_dir}/ux-check-report.md"
}
```

---

## 注意事项

1. **对比度计算**: 使用 WCAG 2.1 相对亮度公式
2. **容错性**: 设计文档信息不完整时，标记为 "未检查" 而非 "失败"
3. **修复建议格式**: JSON 格式便于 design-variant-generator 解析和应用
4. **auggie-mcp 使用**: 分析现有项目时优先使用语义检索
5. **LSP 精确定位**: 检查现有组件的可访问性 Props 时使用 LSP

---

## 约束

- **🚨 如果是优化场景，必须调用 auggie-mcp 分析现有 UX 实践**（Step 2）
- **🚨 如果发现组件文件，必须调用 LSP 获取可访问性信息**（Step 2）
- 仅当工具返回错误或全新项目时才可跳过
- 必须生成 `${run_dir}/ux-check-report.md`
- 报告必须包含 JSON 格式的修复建议

## 工具使用策略

### auggie-mcp 必用场景

- 查找现有 ARIA 属性使用
- 查找键盘导航实现
- 查找焦点状态样式定义

### LSP 必用场景

- 获取组件可访问性 Props
- 分析组件符号结构
- 查看焦点事件处理

### 降级策略

**仅当工具返回错误时才可降级**：

1. auggie-mcp 错误 → 使用 Grep 搜索 aria-* 属性
2. LSP 错误 → 使用 Read 读取组件文件
3. 全新项目 → 跳过现有代码分析，只分析设计文档
