# Design Variant Specs Reference

本文档包含设计规格生成的模板、示例和 Gemini 提示词。

---

## 1. Gemini 提示词模板

用于生成详细设计规格的提示词：

```
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
```

---

## 2. 设计文档模板

`${run_dir}/design-{variant_id}.md` 使用以下结构：

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

## 组件样式规格

{详细组件规格...}

## 色值系统

{色值表...}

## 字体规格

{字体表...}

## 间距系统

{间距规范...}

## 响应式策略

{响应式断点...}

## Tailwind 配置

{配置代码...}

## 实施建议

{优先级和建议...}
```

---

## 3. 组件样式模板

### 3.1 Button 组件

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

---

## 4. 色值系统模板

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

---

## 5. 字体规格模板

| 层级    | Font Family       | Size  | Weight | Line Height | Letter Spacing |
| ------- | ----------------- | ----- | ------ | ----------- | -------------- |
| H1      | Plus Jakarta Sans | 48px  | 700    | 1.2         | -0.02em        |
| H2      | Plus Jakarta Sans | 36px  | 700    | 1.3         | -0.01em        |
| H3      | Plus Jakarta Sans | 24px  | 600    | 1.4         | 0              |
| H4      | Plus Jakarta Sans | 20px  | 600    | 1.5         | 0              |
| Body    | Plus Jakarta Sans | 16px  | 400    | 1.6         | 0              |
| Small   | Plus Jakarta Sans | 14px  | 400    | 1.5         | 0              |
| Caption | Plus Jakarta Sans | 12px  | 400    | 1.4         | 0.01em         |

---

## 6. 间距系统模板

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

---

## 7. 圆角系统模板

```
rounded-sm = 4px   // 小元素（badge, tag）
rounded = 8px      // 默认（button, input）
rounded-lg = 12px  // 中等（card）
rounded-xl = 16px  // 大（modal, panel）
rounded-2xl = 24px // 特大（hero card）
```

---

## 8. 阴影系统模板

```css
/* Tailwind 配置 */
shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.15);
```

---

## 9. 动画系统模板

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

---

## 10. 响应式策略模板

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

---

## 11. Tailwind 配置模板

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
