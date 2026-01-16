---
name: code-reviewer
description: |
  【触发条件】当用户需要审查 PR、检查代码质量、进行安全审计时使用。
  【核心产出】输出：代码审查报告、问题清单、改进建议、安全漏洞分析。
  【不触发】不用于：Bug 调试（改用 bug-hunter）、测试编写（改用 test-generator）。
  【先问什么】若缺少：审查范围（文件/PR）、关注重点（质量/安全/性能），先提问补齐。
allowed-tools: Skill
---

# Code Reviewer - 代码审查助手

这是一个轻量级入口，委托给 `reviewing/review-orchestrator` 执行。

## 使用方式

```
/code-reviewer [代码路径或 PR 链接]
```

## 执行流程

1. 调用 `reviewing:review-orchestrator` 技能
2. 传入审查目标
3. 由编排器协调原子技能完成审查

## 实际执行

**立即调用**:

```
Skill: reviewing:review-orchestrator
参数:
  path: $ARGUMENTS
  mode: full
```

## 工作流阶段

| 阶段    | 原子技能          | 产出文件                                 |
| ------- | ----------------- | ---------------------------------------- |
| 1. 安全 | security-scanner  | .claude/reviewing/security-findings.json |
| 2. 质量 | quality-analyzer  | .claude/reviewing/quality-findings.json  |
| 3. 外部 | codeagent-wrapper | .claude/reviewing/external-reviews.json  |
| 4. 报告 | report-generator  | .claude/reviewing/report.md              |

## 原子技能

| 技能                | 职责           | 调用方式                       |
| ------------------- | -------------- | ------------------------------ |
| security-scanner    | 安全漏洞扫描   | /reviewing:security-scanner    |
| quality-analyzer    | 代码质量分析   | /reviewing:quality-analyzer    |
| report-generator    | 报告生成       | /reviewing:report-generator    |
| review-orchestrator | 编排完整工作流 | /reviewing:review-orchestrator |

## 审查模式

| 模式          | 说明       | 用法                                |
| ------------- | ---------- | ----------------------------------- |
| full          | 完整审查   | `/code-reviewer mode=full`          |
| security-only | 仅安全扫描 | `/code-reviewer mode=security-only` |
| quality-only  | 仅质量分析 | `/code-reviewer mode=quality-only`  |
| quick         | 快速审查   | `/code-reviewer mode=quick`         |

## 严重程度

| 级别 | 标识        | 处理     |
| ---- | ----------- | -------- |
| P0   | 🔴 CRITICAL | 阻塞合并 |
| P1   | 🟡 WARNING  | 建议修复 |
| P2   | 🔵 INFO     | 可选改进 |

## 状态恢复

如果工作流中断，重新运行命令会自动从 `.claude/reviewing.local.md` 恢复状态。

## 参考文档

原子技能复用以下检查清单：

- `checklist-security.md` - 安全检查清单
- `checklist-quality.md` - 质量检查清单
- `checklist-performance.md` - 性能检查清单
- `patterns-antipatterns.md` - 反模式识别
- `report-template.md` - 报告模板

## 历史记录

- v2.0: 重构为原子技能组合模式
- v1.0: 单体技能模式（已归档）
