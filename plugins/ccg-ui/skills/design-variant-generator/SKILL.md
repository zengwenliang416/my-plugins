---
name: design-variant-generator
description: |
  【触发条件】样式推荐完成后，根据推荐方案生成详细设计规格
  【核心产出】输出 ${run_dir}/design-{variant}.md，包含完整设计规格
  【不触发】无推荐方案文件
  【先问什么】variant_id 参数缺失时，询问生成哪个变体 (A/B/C)
  【并行支持】✅ 可同时启动多个实例生成 design-A/B/C.md
allowed-tools: Read, Write, Task
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
  - name: variant_id
    type: string
    required: true
    description: 变体标识（A/B/C）
  - name: style
    type: string
    required: false
    description: 指定设计风格（可选）
---

# Design Variant Generator

## 职责边界

根据样式推荐方案，生成详细的设计规格文档。**支持并行执行**。

- **输入**:
  - `${run_dir}/requirements.md`
  - `${run_dir}/style-recommendations.md`
  - `variant_id` 参数 (A / B / C)
- **输出**: `${run_dir}/design-{variant}.md`
- **核心能力**: 设计规格生成、细节补全、并行支持

## 执行流程

### Step 1: 读取输入文件

加载需求和推荐方案。

```typescript
Read: ${run_dir}/requirements.md
Read: ${run_dir}/style-recommendations.md

// 提取 variant_id 对应的方案
const selectedVariant = recommendations.variants.find(v => v.id === variant_id)
```

### Step 2: 生成详细设计规格

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

### Step 3: 读取原始资源文件

补充资源库中的详细信息。

```typescript
// 读取样式资源
Read: ~/.claude/ikllss / ui - ux / _shared / styles / { selected_style }.yaml;

// 读取配色资源
Read: ~/.claude/ikllss / ui - ux / _shared / colors / { selected_color }.yaml;

// 读取字体资源
Read: ~/.claude/ikllss / ui -
  ux / _shared / typography / { selected_typography }.yaml;

// 提取：CSS 代码、Tailwind 示例、使用技巧
```

### Step 4: 生成设计文档

输出结构化 Markdown 文档。

**输出路径**：`${run_dir}/design-{variant_id}.md`

**文档模板**（精简版）：

```markdown
---
variant_id: "{A/B/C}"
generated_at: "{时间戳}"
based_on_requirements: "${run_dir}/requirements.md"
based_on_recommendation: "${run_dir}/style-recommendations.md"
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
│ Header: Logo + Nav + User Menu │
├─────────────────────────────────────────┤
│ Hero Section (Optional) │
│ - Main Heading │
│ - Subheading │
│ - CTA Buttons │
├─────────────────────────────────────────┤
│ Main Content │
│ ┌──────────┬────────────────────────┐ │
│ │ Sidebar │ Content Area │ │
│ │ │ │ │
│ └──────────┴────────────────────────┘ │
├─────────────────────────────────────────┤
│ Footer │
└─────────────────────────────────────────┘

````

## 组件样式规格

### Button
```css
/* Primary Button */
padding: 12px 24px;
background: {primary_color};
color: #FFFFFF;
border-radius: 8px;
font-weight: 600;
transition: all 0.2s;

hover {
  background: {darken primary_color 10%};
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba({primary_color}, 0.4);
}
````

**Tailwind**:

```html
<button
  class="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark hover:-translate-y-0.5 transition-all"
>
  Click Me
</button>
```

### Card

{样式规格}

### Input

{样式规格}

{其他组件...}

## 色值系统

| 用途           | Color Token | Hex Value | Usage        |
| -------------- | ----------- | --------- | ------------ |
| Primary        | primary     | #000000   | 主按钮、链接 |
| Secondary      | secondary   | #0070F3   | 次要操作     |
| Accent         | accent      | #7928CA   | 强调、CTA    |
| Background     | bg          | #FFFFFF   | 主背景       |
| Surface        | surface     | #F9FAFB   | 卡片背景     |
| Text           | text        | #111827   | 主文本       |
| Text Secondary | text-muted  | #6B7280   | 辅助文本     |
| Border         | border      | #E5E7EB   | 边框         |
| Success        | success     | #10B981   | 成功提示     |
| Warning        | warning     | #F59E0B   | 警告         |
| Error          | error       | #EF4444   | 错误         |

## 字体规格

| 层级    | Font Family       | Size | Weight | Line Height |
| ------- | ----------------- | ---- | ------ | ----------- |
| H1      | Plus Jakarta Sans | 48px | 700    | 1.2         |
| H2      | Plus Jakarta Sans | 36px | 700    | 1.3         |
| H3      | Plus Jakarta Sans | 24px | 600    | 1.4         |
| H4      | Plus Jakarta Sans | 20px | 600    | 1.5         |
| Body    | Plus Jakarta Sans | 16px | 400    | 1.6         |
| Small   | Plus Jakarta Sans | 14px | 400    | 1.5         |
| Caption | Plus Jakarta Sans | 12px | 400    | 1.4         |

## 间距系统

使用 4px 基数：

```
4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px
```

**Tailwind 映射**：

```
p-1 = 4px
p-2 = 8px
p-3 = 12px
p-4 = 16px
p-6 = 24px
p-8 = 32px
p-12 = 48px
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
  theme: {
    extend: {
      colors: {
        primary: "#000000",
        secondary: "#0070F3",
        accent: "#7928CA",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.05)",
        DEFAULT: "0 2px 8px rgba(0,0,0,0.1)",
        lg: "0 8px 24px rgba(0,0,0,0.12)",
      },
    },
  },
};
```

## 实施建议

1. **优先级**: Header → Main Content → Footer
2. **原子组件**: 先实现 Button, Input, Card 等基础组件
3. **主题系统**: 使用 CSS Variables 或 Tailwind Theme
4. **暗色模式**: {如适用} 添加 dark: 前缀类名
5. **可访问性**: 确保对比度符合 WCAG AA 标准

````

### Step 5: Gate 检查

**检查项**：
- [ ] 设计定位明确
- [ ] 布局结构完整
- [ ] 至少包含 5 个组件规格
- [ ] 色值系统完整
- [ ] 字体规格完整
- [ ] 响应式策略明确

**通过标准**：所有检查项通过

## 返回值

```json
{
  "status": "success",
  "variant_id": "A",
  "output_file": "${run_dir}/design-A.md",
  "summary": {
    "style": "Glassmorphism 2.0",
    "color": "Vercel Dark",
    "typography": "Plus Jakarta Sans",
    "component_count": 8
  }
}
````

## 并行支持

此 skill 设计为**并行安全**：

- 每个实例操作独立的输出文件（design-A.md / design-B.md / design-C.md）
- 无共享状态
- 无写入冲突

**调用示例**：

```typescript
// 主编排器可同时启动 3 个实例
Task(design - variant - generator, (variant_id = "A")) &
  Task(design - variant - generator, (variant_id = "B")) &
  Task(design - variant - generator, (variant_id = "C"));

wait_all();
```

## 注意事项

1. **variant_id 必须是参数**：不能从文件推断，确保并行安全
2. **资源文件路径**：使用绝对路径，避免并发冲突
3. **输出文件唯一性**：文件名包含 variant_id
