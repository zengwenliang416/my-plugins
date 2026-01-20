# 重构变更清单

## 执行概览

| 指标     | 值           |
| -------- | ------------ |
| 执行时间 | ${timestamp} |
| 执行模式 | ${mode}      |
| 总建议数 | ${total}     |
| 已执行   | ${executed}  |
| 跳过     | ${skipped}   |
| 失败     | ${failed}    |

---

## 变更列表

### ✅ REF-001: ${refactoring_type} - ${target_symbol}

**状态**: 已完成

**变更文件**:

| 文件         | 操作         | 变更摘要   |
| ------------ | ------------ | ---------- |
| ${file_path} | ${operation} | ${summary} |

**Diff 预览**:

```diff
--- a/${file_path}
+++ b/${file_path}
@@ -${old_start},${old_count} +${new_start},${new_count} @@
${diff_content}
```

**验证结果**:

- ${syntax_check}: 语法检查
- ${type_check}: 类型检查
- ${test_status}: 测试（${test_note}）

---

### ⏭️ REF-002: ${refactoring_type} - ${target_symbol}

**状态**: 跳过

**原因**: ${skip_reason}

---

### ❌ REF-003: ${refactoring_type} - ${target_symbol}

**状态**: 失败

**错误信息**: ${error_message}

**回滚状态**: ${rollback_status}

---

## 执行统计

| 类型           | 已执行            | 跳过             | 失败            |
| -------------- | ----------------- | ---------------- | --------------- |
| Extract Method | ${em_executed}    | ${em_skipped}    | ${em_failed}    |
| Extract Class  | ${ec_executed}    | ${ec_skipped}    | ${ec_failed}    |
| Move Method    | ${mm_executed}    | ${mm_skipped}    | ${mm_failed}    |
| 其他           | ${other_executed} | ${other_skipped} | ${other_failed} |

---

## 后续建议

1. 运行测试验证: `${test_command}`
2. 检查变更: `git diff`
3. 添加新测试用例
4. 更新相关文档

---

## 回滚指南

如需回滚本次重构：

```bash
# 回滚所有变更
git checkout -- ${affected_files}

# 或使用 git stash（如果之前有暂存）
git stash pop
```

---

执行时间: ${timestamp}
执行模型: ${model}
