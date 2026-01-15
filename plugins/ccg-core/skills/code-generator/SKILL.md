---
name: code-generator
description: |
  【触发条件】设计方案通过 UX 检查后，生成代码（双模型协作）
  【核心产出】输出 ${run_dir}/code/{tech_stack}/
  【不触发】设计方案不存在或 UX 检查未通过
  【双模型协作】Step 1: Gemini 生成原型 → Step 2: Claude 重构精简
allowed-tools: Read, Write, Bash, Skill
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
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

双模型协作生成代码：Gemini 快速原型 + Claude 精简重构。

- **输入**:
  - `${run_dir}/design-{variant}.md`
  - `tech_stack` 参数 (react-tailwind / vue-tailwind)
- **输出**: `${run_dir}/code/{tech_stack}/`
- **核心能力**: 双模型协作、代码生成、重构精简

## 执行流程

### Step 1: Gemini 生成原型

使用 gemini-cli skill 快速生成代码原型。

**操作**：

```typescript
// 读取设计规格
Read: ${run_dir}/design-{variant}.md

// 构建 Gemini 提示词
const prompt = `
根据以下设计规格，生成 ${tech_stack} 代码：

设计规格：
${design_spec_content}

要求：
1. 生成完整可运行的组件代码
2. 使用 Tailwind CSS
3. 包含：Button, Card, Input, Header, Hero 等组件
4. 严格遵守设计规格中的颜色、字体、间距
5. 添加 TypeScript 类型定义
6. 包含基本交互（hover, focus, active）

输出目录：${run_dir}/code/gemini-raw/
`;

// 调用 Gemini
Skill("gemini-cli", args=prompt)
```

**Gemini 输出**：

```
${run_dir}/code/gemini-raw/
├── components/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Header.tsx
│   └── Hero.tsx
├── pages/
│   └── index.tsx
├── styles/
│   ├── globals.css
│   └── theme.ts
└── package.json
```

### Step 2: Claude 重构精简

Claude 读取 Gemini 输出，执行重构清单。

**重构检查清单**：

1. **移除无意义 wrapper div**

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

2. **合并重复样式类**

   ```tsx
   // ❌ Gemini 可能生成
   <div className="flex items-center justify-center w-full h-full bg-white rounded-lg shadow-md border border-gray-200 p-4 m-4">

   // ✅ Claude 提取为
   <div className="card">  // 在 globals.css 定义 .card
   ```

3. **提取魔法数字为常量**

   ```typescript
   // ❌ Gemini 可能生成
   const Button = () => (
     <button style={{ padding: '12px 24px', borderRadius: '8px' }}>
       Click
     </button>
   )

   // ✅ Claude 提取常量
   const SPACING = { sm: '8px', md: '12px', lg: '24px' }
   const RADIUS = { default: '8px', lg: '12px' }
   ```

4. **统一命名规范**

   ```typescript
   // ❌ Gemini 可能混用
   const my_button = ...
   const MyCard = ...
   const input_field = ...

   // ✅ Claude 统一为 PascalCase（组件）/ camelCase（函数）
   const Button = ...
   const Card = ...
   const InputField = ...
   ```

5. **移除多余注释**

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

6. **确保 TypeScript 类型完整**

   ```typescript
   // ❌ Gemini 可能遗漏类型
   const Button = ({ onClick, children }) => ...

   // ✅ Claude 补全类型
   interface ButtonProps {
     onClick?: () => void;
     children: React.ReactNode;
     variant?: 'primary' | 'secondary' | 'ghost';
   }
   const Button: React.FC<ButtonProps> = ({ onClick, children, variant = 'primary' }) => ...
   ```

7. **检查无障碍属性**

   ```tsx
   // ❌ Gemini 可能遗漏
   <button onClick={handleClick}>
     <Icon />
   </button>

   // ✅ Claude 补充
   <button onClick={handleClick} aria-label="Close dialog">
     <Icon aria-hidden="true" />
   </button>
   ```

**重构操作**：

```typescript
// 对于 gemini-raw/ 中的每个文件
for (file in gemini_raw_files) {
  Read: file

  // 应用重构清单
  refactored_code = applyRefactoringChecklist(file_content)

  // 写入最终目录
  Write: ${run_dir}/code/${tech_stack}/${file_name}
}
```

### Step 3: 生成配置文件

补充必要的配置文件。

**生成文件**：

**tailwind.config.js**:

```javascript
// 基于设计规格生成
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
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
    },
  },
};
```

**package.json**:

```json
{
  "name": "ui-ux-design-output",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "react": "^18.2.0",
    "next": "^14.0.0",
    "tailwindcss": "^3.4.0"
  }
}
```

**README.md**:

```markdown
# UI/UX 设计实现

基于设计规格 design-{variant}.md 生成的代码。

## 安装

\`\`\`bash
npm install
\`\`\`

## 运行

\`\`\`bash
npm run dev
\`\`\`

## 组件清单

- Button (Primary / Secondary / Ghost)
- Card
- Input
- Header
- Hero

## 设计 Token

详见 `tailwind.config.js`
```

### Step 4: Gate 检查

**检查项**：

- [ ] 无语法错误（TypeScript 编译通过）
- [ ] 文件结构完整
- [ ] 组件命名规范
- [ ] 无未使用变量/导入

**验证方法**：

```bash
cd ${run_dir}/code/${tech_stack}
npx tsc --noEmit  # TypeScript 类型检查
```

## 返回值

```json
{
  "status": "success",
  "tech_stack": "react-tailwind",
  "output_dir": "${run_dir}/code/react-tailwind/",
  "components": ["Button", "Card", "Input", "Header", "Hero"],
  "gemini_raw_lines": 1250,
  "claude_refactored_lines": 890,
  "reduction_rate": "28.8%"
}
```

## 注意事项

1. **Gemini 输出视为"脏原型"**：必须经 Claude 重构才能交付
2. **保留 gemini-raw/ 目录**：便于对比和调试
3. **重构不改变功能**：只做代码质量优化，不添加新功能
4. **类型安全**：确保所有 TypeScript 类型定义完整
