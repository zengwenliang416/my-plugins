---
name: report-generator
description: |
  【触发条件】代码审查最后一步：汇总结果生成报告。
  【核心产出】输出 ${run_dir}/report.md。
  【不触发】安全扫描、质量分析。
allowed-tools: Read, Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
---

# Report Generator - 报告生成原子技能

## 职责边界

- **输入**: `${run_dir}/*.json` (扫描结果文件)
- **输出**: `${run_dir}/report.md`
- **单一职责**: 只做报告生成，不做扫描分析

## 输入文件

```
${run_dir}/
├── security-findings.json   # 安全扫描结果
├── quality-findings.json    # 质量分析结果
├── review-codex.md          # Codex 审查结果
├── review-gemini.md         # Gemini 审查结果
└── external-reviews.json    # 合并后的外部审查（可选）
```

## 报告结构

```markdown
# Code Review 报告

## 审查信息

| 项目     | 内容                  |
| -------- | --------------------- |
| 审查范围 | [目标路径]            |
| 审查时间 | [时间戳]              |
| 风险等级 | 🟢 低 / 🟡 中 / 🔴 高 |

## 执行的检查

- [x] 安全扫描 (security-scanner)
- [x] 质量分析 (quality-analyzer)
- [ ] 外部模型审查 (可选)

---

## 🔴 Critical (P0) - 阻塞合并

> 以下问题必须在合并前修复

### SEC-001: [问题标题]

- **位置**: `file.ts:42`
- **类型**: SQL_INJECTION
- **描述**: 问题描述
- **建议**: 修复方案

---

## 🟡 Warning (P1) - 建议修复

### QLT-001: [问题标题]

- **位置**: `file.ts:100`
- **类型**: FUNCTION_DESIGN
- **描述**: 问题描述
- **建议**: 改进方案

---

## 🔵 Info (P2) - 可选改进

### QLT-002: [问题标题]

- **位置**: `file.ts:150`
- **建议**: 改进方案

---

## 统计摘要

| 类别 | Critical | High | Medium | Low | 合计 |
| ---- | -------- | ---- | ------ | --- | ---- |
| 安全 | X        | X    | X      | X   | X    |
| 质量 | -        | X    | X      | X   | X    |
| 总计 | X        | X    | X      | X   | X    |

---

## 审查结论

| 结论               | 说明                   |
| ------------------ | ---------------------- |
| ✅ APPROVE         | 代码质量良好，可以合并 |
| 🔄 REQUEST_CHANGES | 需要修改后重新审查     |
| 💬 COMMENT         | 仅提供建议，不阻塞合并 |

**本次结论**: [根据 Critical 数量自动判定]
```

## 结论判定规则

| 条件                  | 结论               |
| --------------------- | ------------------ |
| Critical > 0          | 🔄 REQUEST_CHANGES |
| High > 3 或 Major > 5 | 🔄 REQUEST_CHANGES |
| 仅有 Minor/Suggestion | ✅ APPROVE         |
| 无任何问题            | ✅ APPROVE         |

## 执行流程

1. 读取所有 `${run_dir}/*.json` 文件
2. 按严重程度排序合并
3. 去重（相同位置的问题）
4. 生成 Markdown 报告
5. 计算结论

## 返回值

```
报告生成完成。
输出文件: ${run_dir}/report.md

统计:
- Critical: X
- High/Major: X
- Medium/Minor: X
- Low/Suggestion: X

结论: ✅ APPROVE / 🔄 REQUEST_CHANGES / 💬 COMMENT
```

## 约束

- 不做扫描分析（只读取结果文件）
- 输出文件路径固定
- 报告格式统一
