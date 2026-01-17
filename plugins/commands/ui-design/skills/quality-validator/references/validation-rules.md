# Quality Validation Rules Reference

本文档包含质量验证的详细规则、检查逻辑和报告模板。

---

## 1. 评分体系

**总分 10 分**：

| 类别       | 满分 | 检查项 |
|------------|------|--------|
| 代码质量   | 5    | 语法、未使用代码、命名、职责单一、复用性 |
| 设计还原度 | 5    | 颜色、字体、间距、响应式、完整性 |

**等级判定**：

| 分数 | 等级 | 说明 |
|------|------|------|
| ≥ 9.0 | A+ | 优秀 |
| 8.0-8.9 | A | 良好 |
| 7.5-7.9 | B+ | 合格（可交付）|
| 7.0-7.4 | B | 及格 |
| 6.0-6.9 | C | 勉强 |
| < 6.0 | D | 不合格 |

**Gate 通过条件**：总分 ≥ 7.5

---

## 2. 代码质量检查（5 项）

### 2.1 语法错误检查 (1.0 分)

```bash
cd ${run_dir}/code/${tech_stack}
npx tsc --noEmit --skipLibCheck 2>&1

# 评分
if [ $? -eq 0 ]; then score=1.0; else score=0.0; fi
```

### 2.2 未使用变量/导入检查 (1.0 分)

```python
# 使用 Grep 或 ESLint
unused_count = countUnusedImports(code_files)

if unused_count == 0: score = 1.0
elif unused_count <= 3: score = 0.5
else: score = 0.0
```

### 2.3 命名规范检查 (1.0 分)

```python
# 使用 LSP documentSymbol
violations = []
for symbol in all_symbols:
  if symbol.kind == "class" and not isPascalCase(symbol.name):
    violations.append(symbol)
  elif symbol.kind == "function" and not isCamelCase(symbol.name):
    violations.append(symbol)

if len(violations) == 0: score = 1.0
elif len(violations) <= 3: score = 0.5
else: score = 0.0
```

### 2.4 组件职责单一性检查 (1.0 分)

```python
for file in component_files:
  line_count = countLines(file)
  function_count = countFunctions(file)
  props_count = countProps(file)

  is_compliant = (line_count <= 150 and function_count <= 5 and props_count <= 8)

compliance_rate = compliant_count / total_count
if compliance_rate >= 1.0: score = 1.0
elif compliance_rate >= 0.8: score = 0.75
elif compliance_rate >= 0.6: score = 0.5
else: score = 0.0
```

### 2.5 代码复用性检查 (1.0 分)

```python
# 使用 Grep 查找重复类名
classnames = extractClassNames(grep_results)
frequency = countFrequency(classnames)
duplicates = [c for c in frequency if c.count >= 3 and len(c.value) > 50]

if len(duplicates) == 0: score = 1.0
elif len(duplicates) <= 2: score = 0.5
else: score = 0.0
```

---

## 3. 设计还原度检查（5 项）

### 3.1 颜色值匹配检查 (1.0 分)

```python
design_colors = extractColorTokens(design_spec)
code_colors = extractTailwindColors(tailwind_config)

mismatches = []
for token, expected in design_colors.items():
  actual = code_colors.get(token)
  if not colorMatches(expected, actual, tolerance=0.05):
    mismatches.append({token, expected, actual})

match_rate = (len(design_colors) - len(mismatches)) / len(design_colors)
if match_rate >= 0.95: score = 1.0
elif match_rate >= 0.85: score = 0.75
elif match_rate >= 0.75: score = 0.5
else: score = 0.0
```

### 3.2 字体规格匹配检查 (1.0 分)

```python
design_fonts = {"family": "Plus Jakarta Sans", "sizes": {...}}
code_font_config = extractFontConfig(tailwind_config)

family_match = design_fonts["family"] in code_font_config["family"]
size_coverage = countMatchingSizes(code_font_config["sizes"], design_fonts["sizes"])

if family_match and size_coverage >= 0.9: score = 1.0
elif family_match and size_coverage >= 0.75: score = 0.75
elif size_coverage >= 0.6: score = 0.5
else: score = 0.0
```

### 3.3 间距/圆角匹配检查 (1.0 分)

```python
design_spacing = [4, 8, 12, 16, 24, 32, 48, 64, 96]  # 4px 基数
non_standard = [v for v in spacing_values if v % 4 != 0]

spacing_ok = len(non_standard) == 0
radius_ok = compareRadius(code_radius, design_radius)

if spacing_ok and radius_ok: score = 1.0
elif spacing_ok or radius_ok: score = 0.5
else: score = 0.0
```

### 3.4 响应式断点检查 (1.0 分)

```python
design_breakpoints = {"mobile": "<640px", "tablet": "640-1024px", "desktop": ">1024px"}
code_breakpoints = extractBreakpoints(tailwind_config)

breakpoint_match = compareBreakpoints(code_breakpoints, design_breakpoints)
has_responsive_impl = responsive_usage_count > 10

if breakpoint_match and has_responsive_impl: score = 1.0
elif breakpoint_match or has_responsive_impl: score = 0.5
else: score = 0.0
```

### 3.5 组件完整性检查 (1.0 分)

```python
design_components = extractComponentList(design_spec)
code_components = [basename(f) for f in glob_results]

missing = [c for c in design_components if c not in code_components]
completeness = (len(design_components) - len(missing)) / len(design_components)

if completeness == 1.0: score = 1.0
elif completeness >= 0.9: score = 0.75
elif completeness >= 0.75: score = 0.5
else: score = 0.0
```

---

## 4. 报告模板

`${run_dir}/quality-report.md` 使用以下结构：

```markdown
---
validated_at: "{ISO 8601 时间戳}"
validator_version: "2.0"
tech_stack: "{react-tailwind}"
target_dir: "${run_dir}/code/{tech_stack}/"
design_spec: "${run_dir}/design-{variant_id}.md"
---

# 质量验证报告

## 评分概览

**总分**: {8.5} / 10
**等级**: {A (良好)}
**Gate 判定**: {✅ 通过}

---

## 代码质量 ({4.5} / 5)

### ✅ 语法错误检查 (1.0 / 1.0)
**状态**: 通过
**说明**: TypeScript 编译无错误

### ⚠️ 未使用变量/导入检查 (0.5 / 1.0)
**状态**: 部分通过
**说明**: 发现 2 个未使用的导入
**问题列表**：
1. `src/components/Button.tsx:3` - `import { useState } from 'react'`
**建议**: 移除未使用的导入

### ✅ 命名规范检查 (1.0 / 1.0)
### ⚠️ 组件职责单一性检查 (0.75 / 1.0)
### ✅ 代码复用性检查 (1.0 / 1.0)

---

## 设计还原度 ({4.0} / 5)

### ✅ 颜色值匹配检查 (1.0 / 1.0)
**匹配率**: 100%
| Token | 设计规格 | 实际代码 | 状态 |
|-------|----------|----------|------|
| primary | #000000 | #000000 | ✓ |

### ⚠️ 字体规格匹配检查 (0.75 / 1.0)
### ✅ 间距/圆角匹配检查 (1.0 / 1.0)
### ⚠️ 响应式断点检查 (0.5 / 1.0)
### ✅ 组件完整性检查 (1.0 / 1.0)

---

## 改进建议

### 高优先级 (必须修复)
无

### 中优先级 (建议修复)
1. 移除未使用的导入
2. 重构超标组件
3. 补充缺失字号
4. 响应式适配

---

## Gate 检查

**通过条件**: 总分 ≥ 7.5/10
**当前分数**: {8.5} / 10
**判定结果**: ✅ **通过**
```

---

## 5. 返回值格式

**成功**：
```json
{
  "status": "pass",
  "final_score": 8.5,
  "grade": "A (良好)",
  "code_quality_score": 4.5,
  "design_restoration_score": 4.0,
  "details": {...},
  "recommendations": [...],
  "output_file": "${run_dir}/quality-report.md"
}
```

**失败**：
```json
{
  "status": "fail",
  "final_score": 6.5,
  "grade": "C (勉强)",
  "blocking_issues": ["TypeScript 编译失败", "颜色匹配率 <75%"],
  "output_file": "${run_dir}/quality-report.md"
}
```
