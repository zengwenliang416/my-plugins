---
name: code-generator
description: |
  【触发条件】设计方案通过 UX 检查后，生成代码（双模型协作）
  【核心产出】输出 ${run_dir}/code/{tech_stack}/
  【不触发】设计方案不存在或 UX 检查未通过
  【双模型协作】Gemini 生成原型 → Claude 重构精简
  【先问什么】tech_stack 参数缺失时，询问技术栈偏好
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
    description: 选定的设计变体标识（A/B/C）
  - name: tech_stack
    type: string
    required: false
    description: 技术栈（react-tailwind / vue-tailwind），默认 react-tailwind
---

# Code Generator

## 职责边界

**双模型协作**生成前端代码：Gemini 快速原型 + Claude 精简重构。

- **输入**:
  - `${run_dir}/design-{variant}.md`
  - `tech_stack` 参数 (react-tailwind / vue-tailwind)
- **输出**: `${run_dir}/code/{tech_stack}/`
- **核心能力**: 多模型协作、代码生成、重构精简、类型补全

---

## 多模型协作架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Code Generator                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Step 1    │    │   Step 2    │    │   Step 3    │     │
│  │   Gemini    │───▶│   Claude    │───▶│   Claude    │     │
│  │   原型生成   │    │   重构精简   │    │   类型补全   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│        │                  │                  │              │
│        ▼                  ▼                  ▼              │
│  gemini-raw/        refactored/         final/             │
│  (脏原型)           (精简版)            (生产级)            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**模型分工**：

| 阶段 | 模型   | 职责                           | 产出质量 |
|------|--------|--------------------------------|----------|
| 1    | Gemini | 快速生成完整代码结构           | 70%      |
| 2    | Claude | 移除冗余、统一命名、精简代码   | 85%      |
| 3    | Claude | 补全 TypeScript 类型、可访问性 | 95%      |

---

## 🚨🚨🚨 强制执行规则（不可跳过）

**禁止行为（违反则 Skill 失败）：**

- ❌ 跳过 Gemini，自己直接写代码
- ❌ 跳过 auggie-mcp 代码分析（如果有现有代码）
- ❌ 跳过 LSP 符号分析（如果发现组件文件）
- ❌ 用 Read 读文件然后自己写代码（而不是调用 Gemini）
- ❌ 说 "我来生成代码" 然后自己写

**✅ 唯一正确做法**：按照下面的 Step 顺序执行，必须使用 Gemini 生成原型

---

## 执行流程

### Step 0: 🚨 强制分析现有代码结构（auggie-mcp + LSP）

**🚨 此步骤必须执行**（即使是新项目也要执行，会返回空结果）

**必须调用 `mcp__auggie-mcp__codebase-retrieval`**，不可跳过：

```
mcp__auggie-mcp__codebase-retrieval(
  information_request="查找项目中现有的 UI 组件实现、样式系统、类型定义和导出结构。

  请回答：
  1. 有哪些 UI 组件？列出文件路径
  2. 使用什么样式框架（Tailwind/CSS Modules/Styled Components）？
  3. 现有组件的 Props 结构是什么？
  4. 导出/导入模式是什么？"
)
```

**如果 auggie-mcp 发现了组件文件，必须调用 LSP**：

```
# 获取组件文件的符号结构（必须）
LSP(operation="documentSymbol", filePath="src/components/index.ts", line=1, character=1)

# 查看组件 Props 类型（必须）
LSP(operation="hover", filePath="src/components/Button.tsx", line=10, character=15)
```

**产出**：
- `existing_components`: 现有组件列表
- `style_framework`: 样式框架
- `component_props`: 组件 Props 结构
- `export_patterns`: 导出模式

**验证检查点**：
- [ ] 执行了 auggie-mcp 代码检索
- [ ] 如果发现组件文件，至少执行了 1 次 LSP documentSymbol
- [ ] 如果发现组件文件，至少执行了 1 次 LSP hover

**❌ 禁止跳过此步骤**

### Step 1: 🚨🚨🚨 强制执行 - 必须使用 Gemini 生成原型

**🚨 此步骤必须使用 Gemini，不可跳过，不可自己写代码！**

使用 Gemini 快速生成代码原型。

**读取设计规格**：

```
Read: ${run_dir}/design-{variant_id}.md
```

**构建 Gemini 提示词**：

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
   │   ├── Input.tsx
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

**🚨🚨🚨 必须调用 Gemini（不可跳过）**：

```bash
# 使用 codeagent-wrapper gemini 生成代码
~/.claude/bin/codeagent-wrapper gemini --model gemini-2.5-flash --prompt "${prompt}"
```

**❌ 禁止行为：**
- ❌ 跳过 codeagent-wrapper gemini 调用
- ❌ 自己直接写代码（而不是用 Gemini 生成）
- ❌ 说 "Gemini 不可用" 然后自己写（必须先尝试调用）

**验证检查点**：
- [ ] 执行了 `codeagent-wrapper gemini` 命令
- [ ] `${run_dir}/code/gemini-raw/` 目录已创建
- [ ] gemini-raw/ 目录包含组件文件

**Gemini 产出**：`${run_dir}/code/gemini-raw/`

### Step 2: Claude 重构精简

Claude 读取 Gemini 输出，执行重构检查清单。

**重构检查清单**：

#### 2.1 移除无意义 wrapper div

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

#### 2.2 合并重复样式类

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

#### 2.3 提取魔法数字为常量

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

#### 2.4 统一命名规范

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

#### 2.5 移除多余注释

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

**重构操作**：

```typescript
// 对于 gemini-raw/ 中的每个文件
for (file in gemini_raw_files) {
  Read: file

  // 应用重构清单
  refactored_code = applyRefactoringChecklist(file_content)

  // 写入重构目录
  Write: ${run_dir}/code/refactored/${file_name}
}
```

**Claude 产出**：`${run_dir}/code/refactored/`

### Step 3: Claude 类型补全与可访问性

确保代码达到生产级质量。

#### 3.1 补全 TypeScript 类型

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

#### 3.2 添加可访问性属性

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

#### 3.3 添加 JSDoc 文档

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

**Claude 产出**：`${run_dir}/code/${tech_stack}/`（最终版本）

### Step 4: 生成配置文件

**tailwind.config.js**（基于设计规格生成）：

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

**package.json**：

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

**tsconfig.json**：

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

### Step 5: 目录结构验证

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

### Step 6: Gate 检查

**验证方法**：

```bash
cd ${run_dir}/code/${tech_stack}

# TypeScript 类型检查
npx tsc --noEmit

# 检查结果
if [ $? -eq 0 ]; then
  echo "✅ TypeScript 检查通过"
else
  echo "❌ TypeScript 检查失败"
fi
```

**检查项**：
- [ ] TypeScript 编译无错误
- [ ] 所有组件都已生成
- [ ] 文件结构完整
- [ ] 配置文件齐全

---

## 返回值

```json
{
  "status": "success",
  "variant_id": "A",
  "tech_stack": "react-tailwind",
  "output_dir": "${run_dir}/code/react-tailwind/",
  "components": ["Button", "Card", "Input", "Select", "Modal", "Header", "Hero", "Footer"],
  "model_collaboration": {
    "gemini_raw_lines": 1250,
    "claude_refactored_lines": 890,
    "claude_final_lines": 920,
    "reduction_rate": "26.4%"
  },
  "typescript_check": "pass",
  "file_count": 15,
  "next_phase": {
    "phase": 9,
    "name": "quality-validator",
    "action": "CONTINUE_IMMEDIATELY"
  }
}
```

---

## ⏩ 强制继续指令（Skill 完成后必须执行）

**🚨🚨🚨 Skill 执行完成后，你必须立即执行以下操作：**

```bash
# 1. 更新 workflow-loop 状态
sed -i '' 's/^current_phase: .*/current_phase: 9/' .claude/ccg-workflow.local.md

# 2. 输出进度
echo "✅ Phase 8 完成，进入 Phase 9: 质量验证..."
```

**然后立即调用下一个 Skill：**
```
Skill(skill="quality-validator", args="run_dir=${run_dir} variant_id=${variant_id} tech_stack=${tech_stack}")
```

**⛔ 禁止在此停止！必须继续执行 Phase 9！**

---

## 注意事项

1. **Gemini 输出视为"脏原型"**：必须经 Claude 重构才能交付
2. **保留 gemini-raw/ 目录**：便于对比和调试
3. **重构不改变功能**：只做代码质量优化，不添加新功能
4. **类型安全**：确保所有 TypeScript 类型定义完整
5. **可访问性**：所有交互元素必须有 ARIA 属性
6. **auggie-mcp 优先**：分析现有代码时使用语义检索
7. **LSP 精确定位**：检查现有组件类型时使用 LSP

---

## 约束

- **🚨 必须调用 auggie-mcp 进行代码库分析**（Step 0）
- **🚨 如果发现组件文件，必须调用 LSP 获取符号**（Step 0）
- **🚨🚨🚨 必须调用 codeagent-wrapper gemini 生成原型**（Step 1）
- 仅当工具返回错误时才可降级（但必须先尝试）
- 不直接写代码：所有代码由 Gemini 生成，Claude 只负责重构
- 保留 gemini-raw/ 目录：用于对比和调试

## 工具使用策略

### auggie-mcp 必用场景

- 了解现有代码结构
- 查找现有组件实现
- 确定样式系统类型

### LSP 必用场景

- 获取组件 Props 类型定义
- 查看组件文件符号结构
- 分析导出模式

### Gemini 必用场景

- 生成代码原型（**所有代码必须由 Gemini 首先生成**）
- 快速产出完整组件结构
- 产出的代码由 Claude 重构精简

### 降级策略

**仅当工具返回错误时才可降级**：

1. auggie-mcp 错误 → 使用 Glob + Grep 查找组件
2. LSP 错误 → 使用 Read 读取文件内容
3. codeagent-wrapper gemini 错误 → **报告错误，询问用户如何处理**（不可自己写代码替代）
