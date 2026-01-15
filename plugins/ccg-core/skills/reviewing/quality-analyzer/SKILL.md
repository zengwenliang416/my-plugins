---
name: quality-analyzer
description: |
  【触发条件】代码审查第二步：分析代码质量。
  【核心产出】输出 ${run_dir}/quality-findings.json。
  【不触发】安全扫描（用 security-scanner）、报告生成（用 report-generator）。
allowed-tools: Read, Grep, Glob, Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
---

# Quality Analyzer - 代码质量分析原子技能

## 职责边界

- **输入**: `${run_dir}/target.txt` 或代码路径
- **输出**: `${run_dir}/quality-findings.json`
- **单一职责**: 只做质量分析，不做安全扫描

## 分析维度

### 1. 命名规范

```bash
Grep pattern="(var|let|const)\s+(data|temp|tmp|x|y|result|value)\s*=" glob="*.{ts,js}"
```

检查项：

- 变量名是否表达含义
- 函数名是否为动词短语
- 命名风格是否一致

### 2. 函数设计

检查项：

- 函数长度（建议 < 50 行）
- 参数数量（建议 ≤ 4）
- 嵌套深度（建议 ≤ 3）
- 单一职责

### 3. 重复代码

检查项：

- 复制粘贴代码
- 相似逻辑未抽象
- 魔法数字

### 4. 错误处理

```bash
# 空 catch 块
Grep pattern="catch\s*\([^)]*\)\s*\{\s*\}" glob="*.{ts,js,java}"

# 裸 except（Python）
Grep pattern="except:\s*$" glob="*.py"
```

检查项：

- 异常是否正确处理
- 无空 catch 块
- 错误信息是否有意义

### 5. 类型安全

```bash
Grep pattern=": any" glob="*.ts"
```

检查项：

- 类型定义完整
- 无 `any` 滥用
- 空值安全处理

### 6. 代码组织

检查项：

- 文件职责单一
- 文件长度（建议 < 500 行）
- 导入顺序规范
- 无循环依赖

## 输出格式

```json
{
  "scan_type": "quality",
  "target": "分析路径",
  "timestamp": "ISO时间戳",
  "findings": [
    {
      "id": "QLT-001",
      "severity": "major | minor | suggestion",
      "category": "NAMING | FUNCTION_DESIGN | DRY | ERROR_HANDLING | TYPE_SAFETY | ORGANIZATION",
      "location": "file.ts:100",
      "description": "问题描述",
      "evidence": "相关代码片段",
      "recommendation": "改进建议"
    }
  ],
  "metrics": {
    "files_analyzed": 10,
    "avg_file_length": 150,
    "avg_function_length": 25,
    "any_type_count": 5
  },
  "summary": {
    "major": 0,
    "minor": 0,
    "suggestion": 0,
    "total": 0
  }
}
```

## 严重程度定义

| 级别       | 触发条件            | 示例                         |
| ---------- | ------------------- | ---------------------------- |
| major      | 影响可维护性/可读性 | 函数过长、深层嵌套、空 catch |
| minor      | 代码风格问题        | 命名不规范、魔法数字         |
| suggestion | 改进建议            | 可提取的重复代码、注释缺失   |

## 忽略规则

跳过以下：

- `node_modules/`, `vendor/`
- `dist/`, `build/`
- `*.min.js`, `*.d.ts`
- 生成的代码

## 返回值

```
质量分析完成。
输出文件: ${run_dir}/quality-findings.json

发现问题:
- Major: X
- Minor: X
- Suggestion: X

代码指标:
- 文件数: X
- 平均文件长度: X 行
- any 类型使用: X 处

下一步: 使用 /reviewing:report-generator 生成报告
```

## 约束

- 不做安全扫描（交给 security-scanner）
- 不生成报告（交给 report-generator）
- 输出文件路径固定
