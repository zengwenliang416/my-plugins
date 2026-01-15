---
name: quality-validator
description: |
  【触发条件】代码生成完成后，验证代码质量和设计还原度
  【核心产出】输出 ${run_dir}/quality-report.md
  【不触发】无代码产物
allowed-tools: Read, Write, Bash, Grep, Glob
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

# Quality Validator

## 职责边界

验证生成代码的质量和设计还原度，确保交付标准。

- **输入**: `${run_dir}/code/{tech_stack}/`
- **输出**: `${run_dir}/quality-report.md`
- **核心能力**: 代码质量检查、设计还原度验证、综合评分

## 执行流程

### Step 1: 加载检查目标

读取代码目录和原始设计规格。

```typescript
// 读取代码目录结构
Glob: ${run_dir}/code/{tech_stack}/**/*.{tsx,jsx,ts,js,css}

// 读取设计规格（用于对比）
Read: ${run_dir}/design-{selected_variant}.md

// 识别技术栈
const tech_stack = determineFromPath() // react-tailwind / vue-tailwind
```

### Step 2: 代码质量检查（5 项）

#### 2.1 语法错误检查

**检查方法**：

```bash
cd ${run_dir}/code/{tech_stack}

# TypeScript 类型检查
npx tsc --noEmit --skipLibCheck

# 记录输出
if exit_code == 0:
  quality_checks.syntax_errors = "✅ 通过"
else:
  quality_checks.syntax_errors = "❌ 失败: {错误信息}"
```

**评分标准**：

- 无错误：2 分
- 有错误：0 分

#### 2.2 未使用变量/导入检查

**检查方法**：

```typescript
// 使用 Grep 查找常见模式
Grep: import.*from.*(?!.*\n.*\1)  // 未使用的导入
Grep: (const|let|var)\s+\w+\s*=.*(?!.*\1)  // 未使用的变量

// 或使用 ESLint
Bash: npx eslint . --rule 'no-unused-vars: error'
```

**评分标准**：

- 0 个未使用项：2 分
- 1-3 个：1 分
- 4+ 个：0 分

#### 2.3 命名规范检查

**检查规则**：

| 类型     | 规范        | 正则表达式          |
| -------- | ----------- | ------------------- |
| 组件     | PascalCase  | `^[A-Z][a-zA-Z0-9]` |
| 函数     | camelCase   | `^[a-z][a-zA-Z0-9]` |
| 常量     | UPPER_SNAKE | `^[A-Z][A-Z0-9_]`   |
| 接口     | PascalCase  | `^I?[A-Z][a-zA-Z]`  |
| 类型别名 | PascalCase  | `^[A-Z][a-zA-Z]`    |

**检查方法**：

```typescript
// 提取所有定义
Grep: (function|const|let|var|class|interface|type)\s+(\w+)

// 对每个定义，验证命名是否符合规范
violations = []
for (type, name) in definitions:
  if !matchesConvention(type, name):
    violations.push({type, name})

// 评分
score = violations.length == 0 ? 2 :
        violations.length <= 3 ? 1 : 0
```

**评分标准**：

- 0 个违规：2 分
- 1-3 个：1 分
- 4+ 个：0 分

#### 2.4 组件职责单一性检查

**检查指标**：

- 组件行数：≤ 150 行为优秀，≤ 250 行为合格
- 函数个数：组件内函数 ≤ 5 个
- Props 个数：≤ 8 个

**检查方法**：

```typescript
// 对每个组件文件
for (file in component_files) {
  Read: file

  // 统计行数
  line_count = file_content.split('\n').length

  // 统计函数定义
  function_count = countMatches(file_content, /function\s+\w+|const\s+\w+\s*=\s*\(/)

  // 统计 Props
  props_count = extractPropsCount(file_content)

  // 判定
  if (line_count <= 150 && function_count <= 5 && props_count <= 8):
    score += 1
}

final_score = (score / total_components) * 2  // 归一化到 2 分
```

**评分标准**：

- 所有组件符合：2 分
- 80% 符合：1.5 分
- 60% 符合：1 分
- <60%：0 分

#### 2.5 代码复用性检查

**检查指标**：

- 样式提取：是否有重复的 Tailwind 类组合（> 3 次出现）
- 逻辑提取：是否有重复的代码块（> 20 行相似）

**检查方法**：

```typescript
// 样式复用检查
Grep: className=[\"'](.*?)[\"']

// 提取所有 className 值
classNames = extractedMatches.map(m => m.group(1))

// 统计重复
frequency = countFrequency(classNames)
duplicates = frequency.filter(f => f.count >= 3 && f.value.length > 50)

// 逻辑复用检查（简化版：查找相似函数）
// 实际可使用 AST 工具
similar_blocks = findSimilarCodeBlocks(component_files)

// 评分
if (duplicates.length == 0 && similar_blocks.length == 0):
  score = 2
elif (duplicates.length <= 2 || similar_blocks.length <= 1):
  score = 1
else:
  score = 0
```

**评分标准**：

- 无明显重复：2 分
- 少量重复（1-2 处）：1 分
- 大量重复（3+ 处）：0 分

### Step 3: 设计还原度检查（5 项）

#### 3.1 颜色值匹配检查

**检查方法**：

```typescript
// 从设计规格提取色值
Read: design-{variant}.md
design_colors = extractColorTokens(design_spec)
// 例如: {primary: '#000000', secondary: '#0070F3', ...}

// 从代码提取色值
Grep: (#[0-9A-Fa-f]{6}|rgb\(.*?\)|rgba\(.*?\))
code_colors = extractedMatches

// 对比
mismatches = []
for (token, expected_color) in design_colors:
  actual_usage = findColorUsage(code_files, token)
  if (!colorMatches(actual_usage, expected_color, tolerance=0.05)):
    mismatches.push({token, expected, actual})

// 评分
match_rate = (design_colors.length - mismatches.length) / design_colors.length
score = match_rate >= 0.95 ? 2 :
        match_rate >= 0.85 ? 1.5 :
        match_rate >= 0.75 ? 1 : 0
```

**容差标准**：

- RGB 色值允许 ±5% 误差
- 例如：`#000000` vs `#0A0A0A` 算匹配

**评分标准**：

- 匹配率 ≥ 95%：2 分
- 匹配率 85-95%：1.5 分
- 匹配率 75-85%：1 分
- 匹配率 <75%：0 分

#### 3.2 字体规格匹配检查

**检查项**：

- font-family 是否匹配
- 字号阶梯是否完整（H1-H6, body, small）
- font-weight 是否正确

**检查方法**：

```typescript
// 设计规格中的字体
design_fonts = {
  primary: 'Plus Jakarta Sans',
  sizes: {H1: '48px', H2: '36px', ...}
}

// 代码中的字体配置
Read: tailwind.config.js
code_font_config = extractFontConfig(tailwind_config)

// 或从 CSS 提取
Grep: font-family:|font-size:|font-weight:

// 对比
font_family_match = code_font_config.family == design_fonts.primary
size_coverage = countMatchingSizes(code_font_config.sizes, design_fonts.sizes)

// 评分
score = font_family_match && size_coverage >= 0.9 ? 2 :
        font_family_match && size_coverage >= 0.75 ? 1.5 :
        size_coverage >= 0.6 ? 1 : 0
```

**评分标准**：

- 字体族 + 90% 字号：2 分
- 字体族 + 75% 字号：1.5 分
- 60% 字号：1 分
- <60%：0 分

#### 3.3 间距/圆角匹配检查

**检查项**：

- 间距系统是否使用 4px 基数
- border-radius 是否符合设计规格

**检查方法**：

```typescript
// 设计规格
design_spacing = [4, 8, 12, 16, 24, 32, 48, 64, 96]  // 4px 基数
design_radius = {default: '8px', lg: '12px', xl: '16px'}

// 提取代码中的间距值
Grep: (padding|margin|gap):\s*(\d+)px
Grep: p-(\d+)|m-(\d+)|gap-(\d+)  // Tailwind

spacing_values = extractedValues.map(v => parseInt(v))

// 检查是否符合 4px 基数
non_standard_spacing = spacing_values.filter(v => v % 4 !== 0)

// 提取圆角值
Grep: border-radius:\s*(\d+)px
Grep: rounded-(\w+)

// 评分
spacing_compliance = non_standard_spacing.length == 0
radius_match = compareRadius(code_radius, design_radius)

score = spacing_compliance && radius_match ? 2 :
        spacing_compliance || radius_match ? 1 : 0
```

**评分标准**：

- 间距 + 圆角都符合：2 分
- 其中一项符合：1 分
- 都不符合：0 分

#### 3.4 响应式断点检查

**检查项**：

- 是否有 mobile / tablet / desktop 断点
- 断点值是否正确（640px, 1024px）
- 是否有响应式布局实现

**检查方法**：

```typescript
// 设计规格
design_breakpoints = {
  mobile: '<640px',
  tablet: '640px-1024px',
  desktop: '>1024px'
}

// Tailwind 配置
Read: tailwind.config.js
code_breakpoints = extractBreakpoints(tailwind_config)

// 代码中的响应式类
Grep: (sm:|md:|lg:|xl:|2xl:)
Grep: @media\s*\(.*?(min-width|max-width)

// 检查
breakpoint_match = compareBreakpoints(code_breakpoints, design_breakpoints)
has_responsive_impl = responsive_classes.length > 0

// 评分
score = breakpoint_match && has_responsive_impl ? 2 :
        breakpoint_match || has_responsive_impl ? 1 : 0
```

**评分标准**：

- 断点 + 实现都正确：2 分
- 其中一项正确：1 分
- 都不正确：0 分

#### 3.5 组件完整性检查

**检查项**：

设计规格中列出的所有组件是否都已实现。

**检查方法**：

```typescript
// 从设计规格提取组件清单
design_components = extractComponentList(design_spec)
// 例如: ['Button', 'Card', 'Input', 'Header', 'Hero']

// 从代码目录提取组件文件
Glob: ${run_dir}/code/{tech_stack}/components/*.{tsx,jsx,vue}
code_component_files = extractedFiles.map(f => basename(f))

// 对比
missing_components = design_components.filter(c =>
  !code_component_files.includes(`${c}.tsx`) &&
  !code_component_files.includes(`${c}.jsx`) &&
  !code_component_files.includes(`${c}.vue`)
)

// 评分
completeness = (design_components.length - missing_components.length) / design_components.length

score = completeness == 1.0 ? 2 :
        completeness >= 0.9 ? 1.5 :
        completeness >= 0.75 ? 1 : 0
```

**评分标准**：

- 100% 完整：2 分
- 90-99% 完整：1.5 分
- 75-89% 完整：1 分
- <75%：0 分

### Step 4: 计算总分

**评分矩阵**：

| 类别           | 检查项          | 满分 |
| -------------- | --------------- | ---- |
| **代码质量**   | 语法错误        | 2    |
|                | 未使用变量/导入 | 2    |
|                | 命名规范        | 2    |
|                | 组件职责单一性  | 2    |
|                | 代码复用性      | 2    |
| **设计还原度** | 颜色值匹配      | 2    |
|                | 字体规格匹配    | 2    |
|                | 间距/圆角匹配   | 2    |
|                | 响应式断点      | 2    |
|                | 组件完整性      | 2    |
| **总分**       |                 | 20   |

**归一化到 10 分**：

```typescript
final_score = total_score / 2; // 20 分制 → 10 分制

// 等级判定
grade =
  final_score >= 9.0
    ? "A+ (优秀)"
    : final_score >= 8.0
      ? "A (良好)"
      : final_score >= 7.5
        ? "B+ (合格)"
        : final_score >= 7.0
          ? "B (及格)"
          : final_score >= 6.0
            ? "C (勉强)"
            : "D (不合格)";
```

### Step 5: 生成验证报告

**输出路径**：`${run_dir}/quality-report.md`

**文档模板**：

````markdown
---
validated_at: "{ISO 8601 时间戳}"
validator_version: "1.0"
tech_stack: "{react-tailwind / vue-tailwind}"
target_dir: "${run_dir}/code/{tech_stack}/"
design_spec: "${run_dir}/design-{variant}.md"
---

# 质量验证报告

## 评分概览

**总分**: {8.5} / 10
**等级**: {A (良好)}
**Gate 判定**: {✅ 通过 / ❌ 失败}

---

## 代码质量 ({4.5} / 5)

### ✅ 语法错误检查 (2.0 / 2.0)

**状态**: 通过
**说明**: TypeScript 编译无错误

```bash
$ npx tsc --noEmit
✓ 编译通过，无类型错误
```
````

### ⚠️ 未使用变量/导入检查 (1.0 / 2.0)

**状态**: 部分通过
**说明**: 发现 2 个未使用的导入

**问题列表**：

1. `src/components/Button.tsx:3` - `import { useState } from 'react'` 未使用
2. `src/components/Card.tsx:5` - `import styles from './Card.module.css'` 未使用

**建议**: 移除未使用的导入

### ✅ 命名规范检查 (2.0 / 2.0)

**状态**: 通过
**说明**: 所有命名符合规范

- 组件: PascalCase ✓
- 函数: camelCase ✓
- 常量: UPPER_SNAKE_CASE ✓

### ⚠️ 组件职责单一性检查 (1.5 / 2.0)

**状态**: 部分通过
**说明**: 1 个组件超过行数限制

**超标组件**：

- `Header.tsx`: 178 行（建议 ≤ 150 行）

**建议**: 将 UserMenu 逻辑提取为独立组件

### ✅ 代码复用性检查 (2.0 / 2.0)

**状态**: 通过
**说明**: 无明显重复代码

---

## 设计还原度 ({4.0} / 5)

### ✅ 颜色值匹配检查 (2.0 / 2.0)

**状态**: 通过
**匹配率**: 100%

**色值对比**：
| Token | 设计规格 | 实际代码 | 状态 |
| --------- | --------- | --------- | ---- |
| primary | #000000 | #000000 | ✓ |
| secondary | #0070F3 | #0070F3 | ✓ |
| accent | #7928CA | #7928CA | ✓ |
| text | #111827 | #111827 | ✓ |
| border | #E5E7EB | #E5E7EB | ✓ |

### ⚠️ 字体规格匹配检查 (1.5 / 2.0)

**状态**: 部分通过
**匹配率**: 87.5% (7/8)

**字体族**: ✓ Plus Jakarta Sans
**字号覆盖**: 7/8

**缺失字号**：

- Caption (12px) - 未在代码中使用

**建议**: 补充 Caption 样式类

### ✅ 间距/圆角匹配检查 (2.0 / 2.0)

**状态**: 通过
**说明**:

- 间距系统: ✓ 符合 4px 基数
- 圆角值: ✓ default(8px), lg(12px), xl(16px)

### ⚠️ 响应式断点检查 (1.5 / 2.0)

**状态**: 部分通过
**说明**: 断点值正确，但部分组件缺少响应式实现

**断点配置**: ✓ 正确 (640px, 1024px)
**响应式实现**: ⚠️ 部分（Hero 组件缺少移动端适配）

**建议**: 为 Hero 组件添加 `sm:` 前缀类

### ✅ 组件完整性检查 (2.0 / 2.0)

**状态**: 通过
**完整率**: 100% (5/5)

**设计清单**：

- ✓ Button
- ✓ Card
- ✓ Input
- ✓ Header
- ✓ Hero

---

## 改进建议

### 高优先级 (必须修复)

无

### 中优先级 (建议修复)

1. **移除未使用的导入** (2 处)
   - 位置: Button.tsx:3, Card.tsx:5
   - 影响: 代码清晰度

2. **重构 Header 组件** (178 行 → ≤ 150 行)
   - 建议: 提取 UserMenu 为独立组件
   - 影响: 可维护性

3. **补充 Caption 字号** (12px)
   - 位置: globals.css 或 Tailwind 配置
   - 影响: 设计完整性

4. **Hero 组件响应式适配**
   - 建议: 添加 `sm:text-3xl sm:py-12` 等
   - 影响: 移动端体验

### 低优先级 (可选优化)

无

---

## Gate 检查

**通过条件**: 总分 ≥ 7.5/10

**当前分数**: {8.5} / 10
**判定结果**: ✅ **通过**

**结论**: 代码质量良好，设计还原度高，可以交付。建议修复中优先级问题以提升质量。

---

## 附录：检查详情

### 文件统计

- 总文件数: 12
- 组件文件: 5
- 页面文件: 1
- 样式文件: 2
- 配置文件: 4

### 代码行数

- 总代码行数: 856 行
- 平均组件行数: 128 行
- 最大组件: Header.tsx (178 行)
- 最小组件: Button.tsx (45 行)

### 依赖分析

- react: ^18.2.0
- next: ^14.0.0
- tailwindcss: ^3.4.0

### 检查执行时间

- 代码质量检查: 2.3 秒
- 设计还原度检查: 1.8 秒
- 总耗时: 4.1 秒

````

### Step 6: Gate 检查

**通过条件**：

- 总分 ≥ 7.5 / 10

**如果失败**：

- 返回失败状态
- 提供具体修复建议
- 标记为"需要重构"

## 返回值

**成功时**：

```json
{
  "status": "pass",
  "final_score": 8.5,
  "grade": "A (良好)",
  "code_quality_score": 4.5,
  "design_restoration_score": 4.0,
  "issues": {
    "high_priority": 0,
    "medium_priority": 4,
    "low_priority": 0
  },
  "recommendations": [
    "移除未使用的导入",
    "重构 Header 组件",
    "补充 Caption 字号",
    "Hero 组件响应式适配"
  ]
}
````

**失败时**：

```json
{
  "status": "fail",
  "final_score": 6.5,
  "grade": "C (勉强)",
  "code_quality_score": 3.0,
  "design_restoration_score": 3.5,
  "issues": {
    "high_priority": 3,
    "medium_priority": 5,
    "low_priority": 2
  },
  "blocking_issues": [
    "TypeScript 编译失败",
    "颜色值匹配率 <75%",
    "组件完整性 <75%"
  ]
}
```

## 注意事项

1. **客观评分**：严格按照评分标准，不主观臆断
2. **可追溯**：所有问题必须指向具体文件和行号
3. **容错机制**：允许合理的小误差（如色值 ±5%）
4. **实用性优先**：不追求完美主义，7.5 分即可交付
5. **TypeScript 优先**：语法检查使用 tsc，比 ESLint 更严格

## 错误处理

- **代码目录不存在**：返回错误，提示先运行 code-generator
- **设计规格文件不存在**：返回错误，无法进行对比
- **TypeScript 编译失败**：记录错误但继续检查其他项
- **工具不可用**（如 tsc）：降级为纯文本检查

## 使用示例

**场景：验证 React + Tailwind 代码**

```
输入:
  - 代码目录: ${run_dir}/code/react-tailwind/
  - 设计规格: ${run_dir}/design-A.md

执行流程:
  1. TypeScript 编译检查: ✅ 通过
  2. 未使用变量: ⚠️ 发现 2 个
  3. 命名规范: ✅ 通过
  4. 组件职责: ⚠️ 1 个超标
  5. 代码复用: ✅ 通过
  6. 颜色匹配: ✅ 100%
  7. 字体匹配: ⚠️ 87.5%
  8. 间距匹配: ✅ 通过
  9. 响应式: ⚠️ 部分实现
  10. 组件完整性: ✅ 100%

结果:
  - 总分: 8.5/10 (A 级)
  - Gate: ✅ 通过
  - 建议: 4 个中优先级改进项
```
