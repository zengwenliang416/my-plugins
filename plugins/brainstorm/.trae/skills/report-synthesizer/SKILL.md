# Report Synthesizer

整合所有阶段产出，生成结构化的最终头脑风暴报告。

## 参数

| 参数    | 类型   | 必需 | 描述                                     |
| ------- | ------ | ---- | ---------------------------------------- |
| run_dir | string | 是   | 运行目录路径                             |
| format  | string | 否   | 报告格式 (brief/detailed)，默认 detailed |

## 前置条件

1. 验证必需文件存在：
   - `${run_dir}/research-brief.md`（如果 --skip-research 则可选）
   - `${run_dir}/ideas-pool.md`
   - `${run_dir}/evaluation.md`
2. 如果 evaluation.md 缺失，提示用户先运行 @idea-evaluator

## 工作流程

### Step 1: 读取所有产出

```bash
research_brief=$(cat "${run_dir}/research-brief.md" 2>/dev/null || echo "")
ideas_pool=$(cat "${run_dir}/ideas-pool.md")
evaluation=$(cat "${run_dir}/evaluation.md")
```

### Step 2: 提取关键信息

**从 research-brief.md:** 核心问题、关键趋势 (3-5)、重要案例 (3-5)、跨领域洞察
**从 ideas-pool.md:** 总数、来源分布、类别统计
**从 evaluation.md:** Top 5 详情、思维导图代码、四象限图代码、分组统计

### Step 3: 确定报告格式

如果未指定 format 参数，询问用户：

- **brief**: 简洁版（快速分享）
- **detailed**: 完整版（深度分析）

### Step 4: 生成报告

根据选定格式生成报告。

### Step 5: 写入文件

```bash
write "${run_dir}/brainstorm-report.md" "${report_content}"
```

## 输出格式

### brief（简洁版）

约 500-800 字：

- 一段式摘要
- Top 3 方案（简要描述）
- 下一步行动清单

适用于：快速报告、邮件分享、初步讨论

### detailed（完整版）

约 2000-3000 字：

- 执行摘要
- 研究发现
- 创意类别概览
- 详细评估结果
- Top 5 深度分析
- 风险与盲点
- 分阶段行动计划
- 附录（完整数据）

适用于：正式提案、项目启动、深度评审

## 报告模板

```markdown
---
generated_at: { timestamp }
topic: "{topic}"
format: "{format}"
---

# 头脑风暴报告

## 执行摘要

**主题**: {topic}
**日期**: {date}
**创意总数**: {total_ideas}
**Top 方案数**: 5

{一段式核心发现摘要}

## 研究发现

### 行业趋势

{从 research-brief.md 提取的关键趋势}

### 相关案例

{从 research-brief.md 提取的重要案例}

## 创意概览

### 思维导图

{mermaid_mindmap}

### 创意分布

| 类别 | 数量 | 占比 |
| ---- | ---- | ---- |

## 评估结果

### 评估矩阵

{mermaid_quadrant}

### Top 5 排名

| 排名 | ID  | 创意 | 影响力 | 可行性 | 创新度 | 综合分 |
| ---- | --- | ---- | ------ | ------ | ------ | ------ |

## Top 5 详细分析

### #1: {title}

**描述**: {description}
**核心价值**: {value}
**实施建议**: {suggestions}
**潜在风险**: {risks}

## 风险与盲点

{识别的盲点和未覆盖领域}

## 行动计划

### 短期 (1-2 周)

- [ ] {action_1}
- [ ] {action_2}

### 中期 (1-3 月)

- [ ] {action_3}

### 长期 (3-6 月)

- [ ] {action_4}

## 附录

<details>
<summary>完整创意列表</summary>
{full_ideas_table}
</details>

<details>
<summary>完整评估数据</summary>
{full_evaluation_table}
</details>
```

## 输出验证

确认：

- `${run_dir}/brainstorm-report.md` 存在
- 格式符合选定模板
- 关键信息完整（主题、创意数、Top 方案）
- Mermaid 代码正确嵌入
