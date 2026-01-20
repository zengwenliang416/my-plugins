# Tech Stack Templates Reference

本文档包含代码生成的详细模板、重构检查清单和配置文件模板。

---

## 1. 重构检查清单

Claude 读取 Gemini 输出后，执行以下重构检查清单。

### 1.1 移除无意义 wrapper div

```tsx
// ❌ Gemini 可能生成
<div className="wrapper">
  <div className="container">
    <div className="inner">
      <button>Click</button>
    </div>
  </div>
</div>

// ✅ Claude 精简为
<button>Click</button>
```

### 1.2 合并重复样式类

```tsx
// ❌ Gemini 可能生成（多处重复）
<div className="flex items-center justify-center w-full h-full bg-white rounded-lg shadow-md border border-gray-200 p-4">
<div className="flex items-center justify-center w-full h-full bg-white rounded-lg shadow-md border border-gray-200 p-4">

// ✅ Claude 提取为组件或 Tailwind @apply
// styles/globals.css
@layer components {
  .card {
    @apply flex items-center justify-center w-full h-full bg-white rounded-lg shadow-md border border-gray-200 p-4;
  }
}
```

### 1.3 提取魔法数字为常量

```typescript
// ❌ Gemini 可能生成
const Button = () => (
  <button style={{ padding: '12px 24px', borderRadius: '8px' }}>
    Click
  </button>
)

// ✅ Claude 使用 Tailwind 或常量
const Button = () => (
  <button className="px-6 py-3 rounded-lg">
    Click
  </button>
)
```

### 1.4 统一命名规范

```typescript
// ❌ Gemini 可能混用
const my_button = ...
const MyCard = ...
const input_field = ...

// ✅ Claude 统一
const Button = ...      // 组件: PascalCase
const Card = ...
const handleClick = ... // 函数: camelCase
const SPACING = ...     // 常量: UPPER_SNAKE
```

### 1.5 移除多余注释

```typescript
// ❌ Gemini 可能过度注释
// This is a button component
// It accepts onClick prop
// Returns a styled button element
const Button = ({ onClick }) => {
  // Handle click event
  return (
    // Button element
    <button onClick={onClick}>
      {/* Button text */}
      Click Me
    </button>
  )
}

// ✅ Claude 移除无意义注释
const Button = ({ onClick }) => (
  <button onClick={onClick}>Click Me</button>
)
```

---

## 2. TypeScript 类型补全模板

### 2.1 完整的 Props 接口定义

```typescript
// ❌ Gemini/重构后可能遗漏
const Button = ({ onClick, children }) => ...

// ✅ Claude 补全完整类型
interface ButtonProps {
  /** 按钮点击回调 */
  onClick?: () => void;
  /** 按钮内容 */
  children: React.ReactNode;
  /** 按钮变体 */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** 按钮尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 禁用状态 */
  disabled?: boolean;
  /** 加载状态 */
  loading?: boolean;
  /** 自定义类名 */
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className,
}) => ...
```

### 2.2 可访问性属性补全

```tsx
// ❌ Gemini 可能遗漏
<button onClick={handleClick}>
  <Icon />
</button>

// ✅ Claude 补充
<button
  onClick={handleClick}
  aria-label="Close dialog"
  aria-disabled={disabled}
>
  <Icon aria-hidden="true" />
</button>
```

### 2.3 JSDoc 文档模板

```typescript
/**
 * 主按钮组件
 *
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleSubmit}>
 *   Submit
 * </Button>
 * ```
 */
export const Button: React.FC<ButtonProps> = (props) => ...
```

---

## 3. 配置文件模板

### 3.1 tailwind.config.js

基于设计规格生成：

```javascript
/** @type {import('tailwindcss').Config} */
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
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
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
  plugins: [],
}
```

### 3.2 package.json

```json
{
  "name": "ui-design-output",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

### 3.3 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

---

## 4. 目录结构规范

**最终输出结构**：

```
${run_dir}/code/
├── gemini-raw/              # Gemini 原型（保留用于对比）
│   ├── components/
│   ├── pages/
│   └── styles/
├── refactored/              # Claude 重构版（中间产物）
│   ├── components/
│   ├── pages/
│   └── styles/
└── react-tailwind/          # 最终版本（生产级）
    ├── components/
    │   ├── Button.tsx
    │   ├── Card.tsx
    │   ├── Input.tsx
    │   ├── Select.tsx
    │   ├── Modal.tsx
    │   ├── Header.tsx
    │   ├── Hero.tsx
    │   ├── Footer.tsx
    │   └── index.ts         # 统一导出
    ├── pages/
    │   └── index.tsx
    ├── styles/
    │   ├── globals.css
    │   └── theme.ts
    ├── types/
    │   └── index.ts         # 公共类型定义
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── package.json
    ├── postcss.config.js
    └── README.md
```

**文件说明**：

| 目录/文件 | 说明 |
|-----------|------|
| gemini-raw/ | Gemini 原型输出，保留用于对比调试 |
| refactored/ | Claude 重构中间产物 |
| react-tailwind/ | 最终生产级代码 |
| components/index.ts | 统一导出所有组件 |
| types/index.ts | 公共 TypeScript 类型定义 |

---

## 5. Gemini 提示词模板

生成代码原型时使用的提示词结构：

```
根据以下设计规格，生成 ${tech_stack} 代码：

## 设计规格

${design_spec_content}

## 生成要求

1. **组件结构**
   - 生成完整可运行的组件代码
   - 每个组件一个独立文件
   - 包含：Button, Card, Input, Select, Modal, Header, Hero, Footer

2. **样式实现**
   - 使用 Tailwind CSS
   - 严格遵守设计规格中的颜色、字体、间距
   - 包含 hover, focus, active, disabled 状态

3. **类型定义**
   - 添加基本 TypeScript 类型
   - Props 接口定义
   - 支持 variant, size, disabled 等常用属性

4. **文件结构**
   ${run_dir}/code/gemini-raw/
   ├── components/
   │   ├── Button.tsx
   │   ├── Card.tsx
   │   └── ...
   ├── pages/
   │   └── index.tsx
   ├── styles/
   │   ├── globals.css
   │   └── theme.ts
   └── package.json

## 设计 Token（必须使用）

颜色：
${color_tokens}

字体：
${typography_tokens}

间距：
${spacing_tokens}
```
