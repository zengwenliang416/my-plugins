---
name: report-synthesizer
description: |
  【触发条件】brainstorm 工作流 Phase 4：生成最终报告
  【核心产出】输出 ${run_dir}/brainstorm-report.md
  【不触发】evaluation.md 不存在
  【先问什么】报告格式偏好 (brief/detailed)
allowed-tools:
  - Read
  - Write
  - AskUserQuestion
  - mcp__sequential-thinking__sequentialthinking
  - mcp__auggie-mcp__codebase-retrieval
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---

# Report Synthesizer

汇总所有阶段产物，生成结构化的头脑风暴最终报告。

## MCP 工具集成

| MCP 工具 | 用途 | 触发条件 |
|----------|------|----------|
| `sequential-thinking` | 结构化组织报告内容，确保逻辑连贯 | 🚨 每次执行必用 |
| `auggie-mcp` | 验证技术方案与代码库的兼容性 | 🚨 每次执行必用 |
| `context7` | 补充技术实现的最佳实践建议 | 🚨 每次执行必用 |

## 参数

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| run_dir | string | ✅ | 运行目录路径 |
| format | string | ❌ | 报告格式 (brief/detailed)，默认 detailed |

## 前置检查

1. 验证必需文件存在：
   - `${run_dir}/research-brief.md`（可选，--skip-research 时可能不存在）
   - `${run_dir}/ideas-pool.md`
   - `${run_dir}/evaluation.md`

2. 如果 evaluation.md 不存在，提示用户先执行 idea-evaluator

## 执行流程

### Step 1: 读取所有阶段产物

```bash
# 可选
research_brief=$(cat "${run_dir}/research-brief.md" 2>/dev/null || echo "")

# 必需
ideas_pool=$(cat "${run_dir}/ideas-pool.md")
evaluation=$(cat "${run_dir}/evaluation.md")
```

### Step 2: 提取关键信息

**从 research-brief.md 提取**：
- 核心问题定义
- 关键趋势（3-5 条）
- 重要案例（3-5 个）
- 跨领域灵感

**从 ideas-pool.md 提取**：
- 创意总数
- 来源分布（Codex/Gemini）
- 分类统计

**从 evaluation.md 提取**：
- Top 5 创意详情
- 思维导图代码
- 评估矩阵代码
- 分组统计

### Step 3: 确定报告格式

如果 format 参数缺失，使用 AskUserQuestion 询问：
- **brief**: 简洁版（适合快速分享）
- **detailed**: 详细版（适合深入分析）

### Step 3.1: 结构化报告规划（sequential-thinking）

🚨 **必须执行**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "规划头脑风暴报告。格式：{format}。需要整合研究、创意、评估三个阶段的产出。",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**思考步骤**：
1. **内容盘点**：确认各阶段产物的完整性
2. **核心洞察**：提炼最重要的发现和结论
3. **叙事逻辑**：设计报告的叙事线（问题→发现→创意→方案）
4. **可视化规划**：确定需要包含的图表和思维导图
5. **行动导向**：确保报告以明确的下一步行动结尾

### Step 3.2: 技术方案验证（auggie-mcp）

🚨 **必须执行**

```
mcp__auggie-mcp__codebase-retrieval({
  information_request: "验证 Top 5 技术方案与现有代码库的兼容性：
  方案列表: {top_5_ideas}

  请分析：
  1. 每个方案的技术可行性
  2. 需要修改的现有模块
  3. 潜在的技术风险"
})
```

**用途**：
- 验证方案与现有架构的兼容性
- 识别实施所需的代码变更
- 为报告的"实施建议"部分提供依据

### Step 3.3: 最佳实践补充（context7）

🚨 **必须执行**

```
mcp__context7__resolve-library-id({
  libraryName: "{primary_technology}",
  query: "实施方案的最佳实践"
})

mcp__context7__query-docs({
  libraryId: "{resolved_library_id}",
  query: "{top_idea} 实现的最佳实践、推荐模式、注意事项"
})
```

**用途**：
- 为 Top 方案补充最佳实践建议
- 添加技术实现的参考资料链接
- 丰富报告的"资源参考"部分

### Step 4: 生成报告

根据选择的格式，使用 references/report-template.md 中的对应模板生成报告。

### Step 5: 写入文件

```bash
write "${run_dir}/brainstorm-report.md" "${report_content}"
```

## 输出格式

### brief（简洁版）

约 500-800 字，包含：
- 一段话总结
- Top 3 方案（简要描述）
- 下一步行动清单

适用于：
- 快速汇报
- 邮件分享
- 初步讨论

### detailed（详细版）

约 2000-3000 字，包含：
- 完整执行概要
- 研究发现汇总
- 创意分类概览
- 详细评估结果
- Top 5 方案深度分析
- 风险与盲点识别
- 分阶段行动计划
- 附录（完整数据）

适用于：
- 正式提案
- 项目立项
- 深度复盘

## 输出验证

确认：
- `${run_dir}/brainstorm-report.md` 存在
- 文件格式符合选择的模板
- 关键信息完整（主题、创意数、Top 方案）
- Mermaid 代码正确嵌入

## 参考文档

- 报告模板: references/report-template.md
