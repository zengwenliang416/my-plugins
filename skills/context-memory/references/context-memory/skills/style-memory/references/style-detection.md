# Style Detection Reference

## 检测源

### 配置文件优先

| 文件          | 检测内容          |
| ------------- | ----------------- |
| .prettierrc   | 格式化规则        |
| .eslintrc     | 代码规范          |
| tsconfig.json | TypeScript 配置   |
| .editorconfig | 编辑器配置        |
| package.json  | scripts/lint 配置 |

### 代码分析

```
统计样本:
├── 取最近修改的 10 个文件
├── 分析模式频率
└── 计算置信度
```

## 风格维度

### 代码格式

```typescript
// 检测项
interface CodeStyle {
  indent: "spaces" | "tabs";
  indentSize: 2 | 4;
  quotes: "single" | "double";
  semicolons: boolean;
  trailingComma: "none" | "es5" | "all";
  bracketSpacing: boolean;
  arrowParens: "avoid" | "always";
}
```

### 命名约定

| 元素 | 常见风格    | 检测正则                          |
| ---- | ----------- | --------------------------------- |
| 文件 | kebab-case  | `/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/` |
| 函数 | camelCase   | `/^[a-z][a-zA-Z0-9]*$/`           |
| 类   | PascalCase  | `/^[A-Z][a-zA-Z0-9]*$/`           |
| 常量 | UPPER_SNAKE | `/^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/` |

### 代码模式

```typescript
// 错误处理
type ErrorPattern = "try-catch" | "result-type" | "callback" | "promise-catch";

// 异步风格
type AsyncPattern = "async-await" | "promise-then" | "callback";

// 导入风格
type ImportStyle = "named" | "default" | "namespace" | "mixed";
```

## 学习机制

### 用户反馈

```
用户修改 Claude 生成的代码时:
1. 检测修改类型
2. 提取风格偏好
3. 更新 style-memory
4. 应用到后续生成
```

### 置信度计算

```
置信度 = (匹配文件数 / 总文件数) * 100

阈值:
├── > 80%: 高置信度，自动应用
├── 50-80%: 中置信度，建议应用
└── < 50%: 低置信度，询问用户
```

## 应用风格

### 代码生成时

```typescript
function applyStyle(code: string, style: CodeStyle): string {
  // 1. 格式化
  // 2. 命名调整
  // 3. 模式适配
  return formattedCode;
}
```

### 冲突解决

```
优先级:
1. 用户明确指定
2. 配置文件 (.prettierrc 等)
3. 检测到的项目风格
4. 默认规范
```
