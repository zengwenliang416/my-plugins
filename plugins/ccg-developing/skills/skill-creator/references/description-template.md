# Description 4句式模板

## 核心原则

`description` 是技能的**路由器**，决定何时触发。必须包含：

1. **触发条件**：用户意图 + 输入形态 + 关键词
2. **核心产出**：明确的交付物
3. **不触发**：边界情况和替代技能
4. **先问什么**：缺失信息时的提问策略

## 标准模板

```yaml
---
name: skill-name
description: |
  【触发条件】当用户要求 X/Y/Z（含关键词 keyword1/keyword2/keyword3）时使用。
  【核心产出】输出：A + B + C（具体交付物描述）。
  【不触发】不用于：场景 X（改用 skill-a）、场景 Y（改用 skill-b）。
  【先问什么】若缺少：输入类型、上下文信息、期望格式，先提问补齐。
---
```

## 各类技能示例

### 代码审查类

```yaml
name: code-reviewer
description: |
  当用户要求审查 PR/提交/diff/代码片段（含 review/audit/security/perf/质量）时使用。
  输出：按严重级别的问题清单 + 可直接应用的修改建议/补丁 + 验证步骤（测试/命令）。
  不用于：定位运行时错误（改用 bug-hunter）、追踪问题根因（改用 root-cause-tracing）。
  若缺少：变更范围、运行方式/测试命令、风险偏好（安全优先/性能优先），先提问补齐。
```

### 文档处理类

```yaml
name: pdf-processor
description: |
  当用户要求处理 PDF 文件（含提取/合并/拆分/转换/表格/OCR/表单）时使用。
  输出：处理后的 PDF 文件 或 提取的文本/表格数据（CSV/JSON）。
  不用于：创建全新 PDF 文档（改用 reportlab 直接编码）、编辑 Word 文档（改用 docx-processor）。
  若缺少：PDF 文件路径、具体处理需求（提取什么/如何合并）、输出格式偏好，先提问补齐。
```

### 调试诊断类

```yaml
name: bug-hunter
description: |
  当用户报告运行时错误、异常行为、偶发问题需要定位原因时使用。
  输出：问题根因分析 + 复现步骤 + 修复方案 + 验证方法。
  不用于：代码质量审查（改用 code-reviewer）、架构层面问题分析（改用 root-cause-tracing）。
  若缺少：错误信息/日志、复现条件、环境信息（OS/版本/依赖），先提问补齐。
```

### API 设计类

```yaml
name: api-designer
description: |
  当用户要求设计 REST API、生成 OpenAPI 文档、创建接口代码时使用。
  输出：OpenAPI 3.0 规范文档 + 端点实现代码 + 错误处理规范。
  不用于：已有 API 的调用/集成（直接编码）、GraphQL 设计（需单独处理）。
  若缺少：业务实体定义、认证方式偏好、版本策略、错误码规范，先提问补齐。
```

### 测试生成类

```yaml
name: test-generator
description: |
  当用户要求为代码生成测试（含单元测试/集成测试/E2E/覆盖率）时使用。
  输出：可直接运行的测试文件 + Mock 配置 + 运行命令。
  不用于：测试执行和调试（直接运行）、性能测试设计（需专门工具）。
  若缺少：目标代码路径、测试框架偏好（Jest/Pytest/Go）、覆盖范围要求，先提问补齐。
```

### ML 训练类

```yaml
name: training-debugger
description: |
  当用户遇到训练问题（含 loss 异常/NaN/Inf/不收敛/OOM/梯度爆炸/消失）时使用。
  输出：问题诊断报告 + 调试脚本 + 修复建议 + 监控方案。
  不用于：模型架构设计（改用 ml-paper-reader）、模型部署问题（改用 model-server）。
  若缺少：训练日志、loss 曲线、模型配置、硬件信息（GPU/内存），先提问补齐。
```

## 关键词收集指南

### 同义词覆盖

确保 description 包含用户可能使用的各种表达：

| 意图     | 关键词示例                                       |
| -------- | ------------------------------------------------ |
| 审查代码 | review, audit, check, inspect, 审查, 检查        |
| 修复问题 | fix, debug, solve, 修复, 调试, 解决              |
| 生成测试 | test, spec, coverage, 测试, 覆盖                 |
| 处理文档 | extract, convert, merge, split, 提取, 转换, 合并 |

### 输入形态标注

说明用户会提供什么：

- 文件路径：`path/to/file.pdf`
- PR 链接：`github.com/org/repo/pull/123`
- 代码片段：直接粘贴的代码
- 错误日志：堆栈跟踪、错误信息
- 需求描述：自然语言描述

## 避免的问题

### 过于简短

```yaml
# 不好
description: 代码审查助手。审查代码时使用。

# 好
description: |
  当用户要求审查 PR/提交/diff/代码片段时使用。
  输出：问题清单 + 修复建议。
  不用于：运行时错误定位。
```

### 缺少边界

```yaml
# 不好 - 与 bug-hunter 重叠
description: 当用户遇到代码问题时使用。

# 好 - 明确边界
description: |
  ...
  不用于：定位运行时错误（改用 bug-hunter）。
```

### 触发条件模糊

```yaml
# 不好
description: 帮助处理各种文档。

# 好
description: |
  当用户要求处理 PDF 文件（含提取/合并/拆分/表格/OCR）时使用。
```
