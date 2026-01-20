# 代码气味检测报告

## 检测概览

| 指标         | 值               |
| ------------ | ---------------- |
| 检测时间     | ${timestamp}     |
| 目标路径     | ${target}        |
| 扫描文件数   | ${files_scanned} |
| 检测到气味数 | ${total_smells}  |
| 遗留模式     | ${legacy_mode}   |

## 风险分布

| 风险等级    | 数量              | 占比                 |
| ----------- | ----------------- | -------------------- |
| 🟢 Low      | ${low_count}      | ${low_percent}%      |
| 🟡 Medium   | ${medium_count}   | ${medium_percent}%   |
| 🔶 High     | ${high_count}     | ${high_percent}%     |
| 🔴 Critical | ${critical_count} | ${critical_percent}% |

---

## 气味详情

### SMELL-001: ${smell_type}

**位置**: `${file_path}:${line_start}-${line_end}`

**严重程度**: ${severity}

**描述**: ${description}

**代码片段**:

```${language}
${code_snippet}
```

**建议重构**:

- ${suggestion_1}
- ${suggestion_2}

---

### SMELL-002: ${smell_type}

...

---

## 遗留系统气味（仅 --legacy 模式）

### 前端遗留气味

| ID     | 类型                 | 文件    | 行号    | 严重程度    | 迁移建议                |
| ------ | -------------------- | ------- | ------- | ----------- | ----------------------- |
| LS-001 | ${legacy_smell_type} | ${file} | ${line} | ${severity} | ${migration_suggestion} |

### 后端遗留气味

| ID     | 类型                 | 文件    | 行号    | 严重程度    | 迁移建议                |
| ------ | -------------------- | ------- | ------- | ----------- | ----------------------- |
| LS-002 | ${legacy_smell_type} | ${file} | ${line} | ${severity} | ${migration_suggestion} |

---

## 检测方法验证

- [x] auggie-mcp 语义分析
- [x] LSP.documentSymbol 结构分析
- [x] Grep 模式匹配
- [ ] 遗留系统气味检测（仅 --legacy）

---

## 下一步

调用 `refactor-suggester` 生成重构建议

---

检测时间: ${timestamp}
