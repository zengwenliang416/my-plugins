---
name: style-memory
description: |
  【触发条件】/memory style <package> 或需要记忆项目样式时
  【核心产出】.claude/memory/styles/{package}.json - 样式记忆文件
  【专属用途】
    - 分析项目设计系统
    - 提取颜色/字体/间距/组件规范
    - 持久化样式 token
    - 供 UI 生成时参考
  【强制工具】Skill(gemini-cli), Read, Glob
  【不触发】非前端项目时
  【先问什么】默认先确认输入范围、输出格式与约束条件
  [Resource Usage] Use references/, assets/, scripts/ (entry: `scripts/detect-style.ts`).
allowed-tools:
  - Skill
  - Read
  - Write
  - Glob
arguments:
  - name: package
    type: string
    required: true
    description: 设计系统包名或路径
  - name: action
    type: string
    default: "analyze"
    description: 操作 (analyze|load|update|export)
  - name: format
    type: string
    default: "json"
    description: 输出格式 (json|css|scss|tailwind)
---

# Style Memory - 样式记忆系统

## Script Entry

```bash
npx tsx scripts/detect-style.ts [args]
```

## Resource Usage

- Reference docs: `references/style-detection.md`
- Assets: `assets/style-schema.json`
- Execution script: `scripts/detect-style.ts`

## 执行流程

### analyze 操作

```
1. 定位样式源
   - 搜索 design-system/
   - 搜索 theme/
   - 搜索 styles/tokens/
       │
       ▼
2. 使用 gemini-cli 分析
   Skill("memory:gemini-cli", prompt="design_tokens")
   - 提取颜色系统
   - 提取字体系统
   - 提取间距系统
   - 提取组件变体
       │
       ▼
3. 结构化存储
   - 写入 .claude/memory/styles/{package}.json
       │
       ▼
4. 生成摘要报告
```

### load 操作

```
1. 读取样式记忆
   - 从 .claude/memory/styles/{package}.json
       │
       ▼
2. 验证有效性
   - 检查版本
   - 检查过期
       │
       ▼
3. 返回样式 tokens
```

### update 操作

```
1. 检测样式变更
   - 比对源文件 hash
       │
       ▼
2. 增量分析
   - 仅分析变更部分
       │
       ▼
3. 合并更新
```

### export 操作

```
1. 加载样式记忆
       │
       ▼
2. 转换格式
   - json → css variables
   - json → scss variables
   - json → tailwind config
       │
       ▼
3. 输出到指定位置
```

## 样式 Token 结构

```json
{
  "package": "design-system",
  "version": "1.0.0",
  "generated": "2024-01-20T08:00:00Z",
  "source_hash": "abc123...",
  "tokens": {
    "colors": {
      "primary": {
        "50": "#eff6ff",
        "100": "#dbeafe",
        "500": "#3b82f6",
        "900": "#1e3a8a"
      },
      "secondary": {
        "50": "#f5f3ff",
        "500": "#8b5cf6"
      },
      "semantic": {
        "success": "#10b981",
        "warning": "#f59e0b",
        "error": "#ef4444",
        "info": "#3b82f6"
      }
    },
    "typography": {
      "fontFamily": {
        "sans": "Inter, system-ui, sans-serif",
        "mono": "JetBrains Mono, monospace"
      },
      "fontSize": {
        "xs": "0.75rem",
        "sm": "0.875rem",
        "base": "1rem",
        "lg": "1.125rem",
        "xl": "1.25rem",
        "2xl": "1.5rem"
      },
      "fontWeight": {
        "normal": 400,
        "medium": 500,
        "semibold": 600,
        "bold": 700
      },
      "lineHeight": {
        "tight": 1.25,
        "normal": 1.5,
        "relaxed": 1.75
      }
    },
    "spacing": {
      "0": "0",
      "1": "0.25rem",
      "2": "0.5rem",
      "4": "1rem",
      "8": "2rem",
      "16": "4rem"
    },
    "borderRadius": {
      "none": "0",
      "sm": "0.125rem",
      "md": "0.375rem",
      "lg": "0.5rem",
      "full": "9999px"
    },
    "shadows": {
      "sm": "0 1px 2px rgba(0,0,0,0.05)",
      "md": "0 4px 6px rgba(0,0,0,0.1)",
      "lg": "0 10px 15px rgba(0,0,0,0.1)"
    }
  },
  "components": {
    "button": {
      "variants": ["primary", "secondary", "ghost", "danger"],
      "sizes": ["sm", "md", "lg"],
      "states": ["default", "hover", "active", "disabled"]
    },
    "input": {
      "variants": ["default", "error", "success"],
      "sizes": ["sm", "md", "lg"]
    }
  },
  "metadata": {
    "framework": "tailwind",
    "css_vars": true,
    "dark_mode": true,
    "source_files": ["src/styles/tokens.ts", "tailwind.config.js"]
  }
}
```

## 样式源识别

### 自动检测路径

```
优先级顺序:
1. {package}/tokens/ 或 {package}/design-tokens/
2. {package}/theme/ 或 {package}/themes/
3. {package}/styles/ 或 {package}/css/
4. tailwind.config.* 或 tailwind.config.ts
5. package.json 中的 style/theme 字段
```

### 支持的框架

```
- Tailwind CSS (tailwind.config.*)
- CSS Variables (*.css with :root)
- SCSS Variables (_variables.scss)
- Style Dictionary (tokens.json)
- Chakra UI (theme/)
- MUI (theme/)
- Ant Design (theme/)
```

## Gemini CLI 分析提示

```
分析设计系统，提取以下信息:

1. 颜色系统
   - 主色调及变体 (50-900)
   - 语义颜色 (success, warning, error)
   - 中性色 (gray scale)

2. 字体系统
   - 字体族 (sans, serif, mono)
   - 字号比例
   - 字重定义

3. 间距系统
   - 基础单位
   - 比例关系

4. 组件规范
   - 变体定义
   - 尺寸定义
   - 状态样式

输出格式: JSON
```

## 导出格式

### CSS Variables

```css
:root {
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  --font-sans: Inter, system-ui, sans-serif;
  --spacing-1: 0.25rem;
  --radius-md: 0.375rem;
}
```

### SCSS Variables

```scss
$color-primary-50: #eff6ff;
$color-primary-500: #3b82f6;
$font-sans: Inter, system-ui, sans-serif;
$spacing-1: 0.25rem;
$radius-md: 0.375rem;
```

### Tailwind Config

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          500: "#3b82f6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
};
```

## 使用示例

```bash
# 分析设计系统
/memory style "design-system"

# 分析指定路径
/memory style "./src/styles"

# 加载已保存的样式
/memory style "design-system" --action load

# 更新样式记忆
/memory style "design-system" --action update

# 导出为 CSS Variables
/memory style "design-system" --action export --format css

# 导出为 Tailwind 配置
/memory style "design-system" --action export --format tailwind
```

## 存储位置

```
.claude/memory/styles/
├── design-system.json
├── component-library.json
└── index.json              # 所有样式包索引
```

## 降级策略

```
gemini-cli 不可用时:
├── 使用正则表达式提取
├── 解析配置文件结构
├── 生成基础 tokens
└── 标记 "partial analysis"
```

## 与 UI 生成的集成

```
UI 组件生成时:
1. 自动加载 style-memory
2. 使用项目 tokens
3. 保持设计一致性

示例:
Skill("ui:component-generator", {
  component: "Button",
  style_package: "design-system"  // 自动引用样式记忆
})
```
