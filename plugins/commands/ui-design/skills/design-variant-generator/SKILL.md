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

- **输入**:
  - `${run_dir}/requirements.md`
  - `${run_dir}/style-recommendations.md`
  - `variant_id` 参数 (A / B / C)
  - `fixes` 参数（可选，用于重试时的修复）
- **输出**: `${run_dir}/design-{variant}.md`
- **核心能力**: 设计规格生成、细节补全、并行支持

---

## 🚨🚨🚨 强制执行规则（不可跳过）

**禁止行为（违反则 Skill 失败）：**

- ❌ 跳过 auggie-mcp 代码分析（如果是优化现有项目）
- ❌ 跳过 LSP 符号分析（如果发现组件文件）
- ❌ 用 Read 读文件然后自己写设计规格（而不是系统性分析）
- ❌ 说 "我来生成设计" 然后自己写

**✅ 唯一正确做法**：按照下面的 Step 顺序执行

---

## 执行流程

### Step 1: 读取输入文件

加载需求和推荐方案。

```
Read: ${run_dir}/requirements.md
Read: ${run_dir}/style-recommendations.md
```

**提取 variant_id 对应的方案**：
- 样式名称
- 配色方案
- 字体配置
- 使用建议

### Step 2: 🚨 强制分析现有组件结构（auggie-mcp + LSP）

**🚨 如果是优化现有项目（requirements.md 显示 has_existing_code: true），此步骤必须执行**

**必须调用 `mcp__auggie-mcp__codebase-retrieval`**：

```
mcp__auggie-mcp__codebase-retrieval(
  information_request="查找项目中所有 UI 组件的结构、Props 接口和样式实现。

  请回答：
  1. 有哪些 UI 组件？列出文件路径
  2. 组件的 Props 接口是什么？
  3. 现有变体（variants）有哪些？
  4. 样式是如何实现的？"
)
```

**如果 auggie-mcp 发现了组件文件，必须调用 LSP**：

```
# 获取组件文件的符号结构（必须）
LSP(operation="documentSymbol", filePath="src/components/Button.tsx", line=1, character=1)

# 查看组件 Props 类型（必须）
LSP(operation="hover", filePath="src/components/Button.tsx", line=10, character=15)
```

**产出**：
- `component_props`: 组件 Props 结构
- `existing_variants`: 现有变体（variants）
- `style_implementation`: 样式实现方式
- `constraints`: 需要兼容的约束

**验证检查点**：
- [ ] 如果是优化场景，执行了 auggie-mcp 检索
- [ ] 如果发现组件文件，至少执行了 1 次 LSP documentSymbol
- [ ] 如果发现组件文件，至少执行了 1 次 LSP hover

**跳过条件**（仅以下情况可跳过）：
- 全新项目（from_scratch 场景），无现有代码
- auggie-mcp 返回空结果

### Step 2.5: 🚨 Gemini 设计规格生成（强制）

**使用 codeagent-wrapper gemini 生成详细的设计规格**：

```bash
~/.claude/bin/codeagent-wrapper gemini --role frontend --prompt "
你是一位顶级 UI/UX 设计师和前端架构师。请根据以下推荐方案生成完整的设计规格文档：

设计方案：${variant_id}
风格名称：${style_name}
配色方案：${color_scheme}
字体配置：${typography}

请生成以下详细规格：

## 1. 布局结构
- Header 结构（高度、背景、布局）
- Hero Section（如适用）
- Main Content Area（栅格系统、间距）
- Sidebar（如适用，宽度、展开/收起状态）
- Footer（结构、链接分组）

## 2. 组件样式规格
为每个组件提供详细的 CSS 规格和 Tailwind 类名：

### Button
- 变体：primary / secondary / ghost / danger
- 尺寸：sm / md / lg
- 状态：default / hover / focus / disabled
- 具体样式值（padding, border-radius, font-weight, transition）

### Card
- 背景色、边框、圆角、阴影
- 内边距、头部/内容/底部分区

### Input
- 高度、边框颜色、圆角
- placeholder 样式
- focus/error/disabled 状态

### Select / Dropdown
- 下拉箭头样式
- 选项列表样式

### Modal / Dialog
- 遮罩层样式
- 对话框位置、动画
- 头部/内容/底部布局

### Toast / Alert
- success / warning / error / info 变体
- 位置、动画

## 3. 动画系统
- transition duration（fast: 150ms, default: 200ms, slow: 300ms）
- easing functions
- 常用动画（fadeIn, slideUp, scale）

## 4. 深色模式规格（如适用）
- 背景色调整
- 文本色调整
- 边框/阴影调整

请给出完整、可直接实施的设计规格。
"
```

**记录 Gemini 分析结果**：保存到变量 `gemini_design_specs`

### Step 3: 生成详细设计规格

将推荐方案扩展为可实施的设计文档。

**核心章节**：

1. **布局结构**（Layout Structure）
   - Header: Logo + Navigation + User Menu
   - Hero Section（如适用）
   - Main Content Area
   - Sidebar（如适用）
   - Footer

2. **组件清单**（Component Inventory）
   - Button (primary / secondary / ghost)
   - Card
   - Input / Textarea
   - Select / Dropdown
   - Modal / Dialog
   - Toast / Alert
   - Table
   - Chart（如适用）

3. **详细样式**（Detailed Styling）
   - Border radius: 8px / 12px / 16px
   - Spacing system: 4px 基数（4, 8, 12, 16, 24, 32, 48）
   - Shadow levels: sm / md / lg / xl
   - Animation: transition durations, easing

4. **色值映射**（Color Mapping）
   - Primary: 主操作按钮、链接、强调
   - Secondary: 次要操作、辅助信息
   - Accent: Call-to-action、重点提示
   - Success / Warning / Error: 状态提示
   - Background / Surface / Border: 层次划分

5. **字体规格**（Typography Specs）
   - H1-H6: font-size / font-weight / line-height
   - Body / Small / Caption
   - Code / Monospace
   - Letter-spacing / Text-transform

6. **响应式断点**（Responsive Breakpoints）
   - Mobile: < 640px
   - Tablet: 640px - 1024px
   - Desktop: > 1024px
   - 每个断点的布局调整策略

### Step 4: 处理修复建议（如有）

如果传入了 `fixes` 参数（来自 UX 检查失败的修复建议），需要：

```
if fixes:
    # 解析修复建议
    fix_items = JSON.parse(fixes)

    # 应用修复
    for fix in fix_items:
        if fix.type == "color_contrast":
            # 调整颜色值以提高对比度
            adjust_color(fix.token, fix.suggested_value)
        elif fix.type == "font_size":
            # 调整字号
            adjust_font_size(fix.element, fix.suggested_size)
        elif fix.type == "spacing":
            # 调整间距符合 4px 基数
            adjust_spacing(fix.value, round_to_4px(fix.value))
```

### Step 5: 生成设计文档

**输出路径**：`${run_dir}/design-{variant_id}.md`

**文档模板**：

```markdown
---
variant_id: "{A/B/C}"
generated_at: "{时间戳}"
based_on_requirements: "${run_dir}/requirements.md"
based_on_recommendation: "${run_dir}/style-recommendations.md"
is_retry: {true/false}
---

# 设计规格 - 方案 {variant_id}

## 设计定位

**风格**: {Glassmorphism 2.0}
**配色**: {Vercel Dark}
**字体**: {Plus Jakarta Sans}
**特点**: {专业、现代、信任感}

## 布局结构

```
┌─────────────────────────────────────────┐
│ Header: Logo + Nav + User Menu          │
├─────────────────────────────────────────┤
│ Hero Section (Optional)                 │
│   - Main Heading                        │
│   - Subheading                          │
│   - CTA Buttons                         │
├─────────────────────────────────────────┤
│ Main Content                            │
│ ┌──────────┬────────────────────────┐   │
│ │ Sidebar  │ Content Area           │   │
│ │          │                        │   │
│ └──────────┴────────────────────────┘   │
├─────────────────────────────────────────┤
│ Footer                                  │
└─────────────────────────────────────────┘
```

## 组件样式规格

### Button

**变体**：primary / secondary / ghost / danger

```css
/* Primary Button */
padding: 12px 24px;
background: var(--primary);
color: #FFFFFF;
border-radius: 8px;
font-weight: 600;
transition: all 0.2s;

:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.4);
}

:focus {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Tailwind**:
```html
<button class="px-6 py-3 bg-primary text-white rounded-lg font-semibold
               hover:bg-primary-dark hover:-translate-y-0.5
               focus:outline-2 focus:outline-primary focus:outline-offset-2
               disabled:opacity-50 disabled:cursor-not-allowed
               transition-all">
  Click Me
</button>
```

### Card

{样式规格...}

### Input

{样式规格...}

{其他组件...}

## 色值系统

| 用途           | Token       | Hex Value | RGB                | 对比度 |
| -------------- | ----------- | --------- | ------------------ | ------ |
| Primary        | primary     | #000000   | 0, 0, 0            | -      |
| Primary Dark   | primary-dark| #1a1a1a   | 26, 26, 26         | -      |
| Secondary      | secondary   | #0070F3   | 0, 112, 243        | -      |
| Accent         | accent      | #7928CA   | 121, 40, 202       | -      |
| Background     | bg          | #FFFFFF   | 255, 255, 255      | -      |
| Surface        | surface     | #F9FAFB   | 249, 250, 251      | -      |
| Text           | text        | #111827   | 17, 24, 39         | 15.4:1 |
| Text Secondary | text-muted  | #4B5563   | 75, 85, 99         | 7.5:1  |
| Border         | border      | #E5E7EB   | 229, 231, 235      | -      |
| Success        | success     | #10B981   | 16, 185, 129       | -      |
| Warning        | warning     | #F59E0B   | 245, 158, 11       | -      |
| Error          | error       | #EF4444   | 239, 68, 68        | -      |

**对比度说明**：文本色与背景色的对比度符合 WCAG AA 标准（≥4.5:1）

## 字体规格

| 层级    | Font Family       | Size  | Weight | Line Height | Letter Spacing |
| ------- | ----------------- | ----- | ------ | ----------- | -------------- |
| H1      | Plus Jakarta Sans | 48px  | 700    | 1.2         | -0.02em        |
| H2      | Plus Jakarta Sans | 36px  | 700    | 1.3         | -0.01em        |
| H3      | Plus Jakarta Sans | 24px  | 600    | 1.4         | 0              |
| H4      | Plus Jakarta Sans | 20px  | 600    | 1.5         | 0              |
| Body    | Plus Jakarta Sans | 16px  | 400    | 1.6         | 0              |
| Small   | Plus Jakarta Sans | 14px  | 400    | 1.5         | 0              |
| Caption | Plus Jakarta Sans | 12px  | 400    | 1.4         | 0.01em         |

## 间距系统

使用 4px 基数：

```
4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px
```

**Tailwind 映射**：
```
p-1 = 4px    m-1 = 4px    gap-1 = 4px
p-2 = 8px    m-2 = 8px    gap-2 = 8px
p-3 = 12px   m-3 = 12px   gap-3 = 12px
p-4 = 16px   m-4 = 16px   gap-4 = 16px
p-6 = 24px   m-6 = 24px   gap-6 = 24px
p-8 = 32px   m-8 = 32px   gap-8 = 32px
p-12 = 48px  m-12 = 48px  gap-12 = 48px
```

## 圆角系统

```
rounded-sm = 4px   // 小元素（badge, tag）
rounded = 8px      // 默认（button, input）
rounded-lg = 12px  // 中等（card）
rounded-xl = 16px  // 大（modal, panel）
rounded-2xl = 24px // 特大（hero card）
```

## 阴影系统

```css
/* Tailwind 配置 */
shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.15);
```

## 动画系统

```css
/* 过渡时长 */
duration-fast: 150ms;
duration-default: 200ms;
duration-slow: 300ms;

/* 缓动函数 */
ease-default: cubic-bezier(0.4, 0, 0.2, 1);
ease-in: cubic-bezier(0.4, 0, 1, 1);
ease-out: cubic-bezier(0, 0, 0.2, 1);
ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

## 响应式策略

### Mobile (< 640px)

- 单列布局
- 折叠导航（汉堡菜单）
- 字号缩小 10-15%
- 间距减半

### Tablet (640px - 1024px)

- 双列布局（部分区域）
- 展开导航
- 标准字号
- 标准间距

### Desktop (> 1024px)

- 多列布局
- 完整导航 + Sidebar
- 最大宽度限制: 1280px
- 居中对齐

## Tailwind 配置

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#000000',
          dark: '#1a1a1a',
        },
        secondary: '#0070F3',
        accent: '#7928CA',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 2px 8px rgba(0, 0, 0, 0.1)',
        lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
    },
  },
}
```

## 实施建议

1. **优先级**: Header → Main Content → Footer
2. **原子组件**: 先实现 Button, Input, Card 等基础组件
3. **主题系统**: 使用 CSS Variables 或 Tailwind Theme
4. **暗色模式**: 添加 dark: 前缀类名
5. **可访问性**: 确保对比度符合 WCAG AA 标准
```

### Step 6: Gate 检查

**检查项**：
- [ ] 设计定位明确
- [ ] 布局结构完整
- [ ] 至少包含 5 个组件规格
- [ ] 色值系统完整（含对比度）
- [ ] 字体规格完整
- [ ] 响应式策略明确
- [ ] Tailwind 配置可用

**通过标准**：所有检查项通过

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
  }
}
```

---

## 并行支持

此 skill 设计为**并行安全**：

- 每个实例操作独立的输出文件（design-A.md / design-B.md / design-C.md）
- 无共享状态
- 无写入冲突

**调用示例**：

```
# 主编排器可同时启动 3 个实例
Task(design-variant-generator, variant_id="A") &
Task(design-variant-generator, variant_id="B") &
Task(design-variant-generator, variant_id="C")

wait_all()
```

---

## 注意事项

1. **variant_id 必须是参数**：不能从文件推断，确保并行安全
2. **auggie-mcp 优先**：理解现有代码时优先使用语义检索
3. **LSP 精确定位**：分析组件 Props 和类型时使用 LSP
4. **对比度计算**：色值系统必须包含对比度验证
5. **修复应用**：如果有 fixes 参数，必须应用修复建议

---

## 约束

- **🚨 如果是优化场景（has_existing_code: true），必须调用 auggie-mcp 分析现有组件**（Step 2）
- **🚨 如果发现组件文件，必须调用 LSP 获取组件结构**（Step 2）
- 仅当工具返回错误或全新项目时才可跳过
- 必须生成 `${run_dir}/design-{variant_id}.md`
- 设计规格必须包含完整的色值系统和对比度验证

## 工具使用策略

### auggie-mcp 必用场景

- 查找现有 UI 组件结构
- 了解现有 Props 接口
- 查找样式实现方式

### LSP 必用场景

- 获取组件 Props 类型定义
- 分析组件符号结构
- 查看组件变体定义

### 降级策略

**仅当工具返回错误时才可降级**：

1. auggie-mcp 错误 → 使用 Glob + Grep 查找组件
2. LSP 错误 → 使用 Read 读取组件文件
3. 全新项目 → 跳过现有代码分析
