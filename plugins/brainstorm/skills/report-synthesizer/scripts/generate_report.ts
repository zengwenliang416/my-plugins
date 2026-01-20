#!/usr/bin/env npx tsx
/**
 * Generate brainstorm report from all phase outputs
 * Usage: npx tsx generate_report.ts --run-dir ./run --format detailed|brief --output report.md
 */

interface ReportConfig {
  format: "brief" | "detailed";
  runDir: string;
  outputFile: string;
}

interface ResearchBrief {
  topic: string;
  core_problem: string;
  keywords: string[];
  trends: string[];
  cases: Array<{ name: string; source: string; insight: string }>;
}

interface IdeasPool {
  total_ideas: number;
  sources: { codex: number; gemini: number };
  ideas: Array<{
    id: string;
    title: string;
    description: string;
    source: string;
  }>;
}

interface Evaluation {
  top_5: Array<{
    id: string;
    title: string;
    scores: { total: number };
  }>;
  statistics: {
    avg_score: number;
  };
}

function generateBriefReport(
  topic: string,
  evaluation: Evaluation,
  ideasPool: IdeasPool
): string {
  const top3 = evaluation.top_5.slice(0, 3);
  const date = new Date().toISOString().split("T")[0];

  return `# ${topic} - 头脑风暴报告

**日期**: ${date}
**参与模型**: Codex, Gemini
**总创意数**: ${ideasPool.total_ideas}

## 🎯 核心洞察

基于 ${ideasPool.total_ideas} 个创意的分析，筛选出 Top 3 最具价值的方案。

## 🏆 Top 3 方案

${top3
  .map(
    (idea, i) => `### ${i + 1}. ${idea.title}
- **综合评分**: ${idea.scores.total.toFixed(2)}
- **下一步**: 待定义`
  )
  .join("\n\n")}

## 📋 下一步行动

- [ ] 深入评估 Top 3 方案的实施细节
- [ ] 确定优先级和资源分配
- [ ] 制定实施计划
`;
}

function generateDetailedReport(
  research: ResearchBrief,
  ideasPool: IdeasPool,
  evaluation: Evaluation
): string {
  const date = new Date().toISOString().split("T")[0];
  const top5 = evaluation.top_5;

  return `---
generated_at: ${new Date().toISOString()}
topic: "${research.topic}"
total_ideas: ${ideasPool.total_ideas}
top_ideas: 5
---

# ${research.topic} - 头脑风暴完整报告

## 1. 执行概要

### 1.1 问题定义
${research.core_problem}

### 1.2 关键词
${research.keywords.join(", ")}

### 1.3 成果概览
- 研究发现: ${research.trends.length} 条趋势
- 生成创意: ${ideasPool.total_ideas} 个
- 筛选方案: Top 5

## 2. 研究发现

### 2.1 市场趋势
${research.trends.map((t) => `- ${t}`).join("\n")}

### 2.2 案例分析
| 案例 | 来源 | 关键洞察 |
|------|------|----------|
${research.cases.map((c) => `| ${c.name} | ${c.source} | ${c.insight} |`).join("\n")}

## 3. 创意概览

### 3.1 来源分布
| 来源 | 数量 | 占比 |
|------|------|------|
| Codex | ${ideasPool.sources.codex} | ${((ideasPool.sources.codex / ideasPool.total_ideas) * 100).toFixed(0)}% |
| Gemini | ${ideasPool.sources.gemini} | ${((ideasPool.sources.gemini / ideasPool.total_ideas) * 100).toFixed(0)}% |
| **总计** | **${ideasPool.total_ideas}** | **100%** |

## 4. Top 5 方案详解

${top5
  .map(
    (idea, i) => `### 4.${i + 1} 方案${i + 1}：${idea.title}

**综合评分**: ${idea.scores.total.toFixed(2)} / 5.0

**下一步行动**:
- [ ] 详细可行性分析
- [ ] 资源需求评估
- [ ] 风险评估`
  )
  .join("\n\n")}

## 5. 下一步行动

### 5.1 立即行动（本周）
- [ ] 确认 Top 3 方案的优先级
- [ ] 分配负责人

### 5.2 短期计划（1个月内）
- [ ] 完成 Top 方案的详细设计
- [ ] 启动原型验证

---

*报告生成时间: ${date}*
`;
}

async function main() {
  const args = process.argv.slice(2);
  let runDir = ".";
  let format: "brief" | "detailed" = "detailed";
  let outputFile = "brainstorm-report.md";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--run-dir") runDir = args[++i];
    if (args[i] === "--format") format = args[++i] as "brief" | "detailed";
    if (args[i] === "--output") outputFile = args[++i];
  }

  const fs = await import("fs/promises");
  const path = await import("path");

  // Read phase outputs
  const researchPath = path.join(runDir, "research-brief.json");
  const ideasPath = path.join(runDir, "ideas-pool.json");
  const evalPath = path.join(runDir, "evaluation.json");

  const research: ResearchBrief = JSON.parse(await fs.readFile(researchPath, "utf-8"));
  const ideasPool: IdeasPool = JSON.parse(await fs.readFile(ideasPath, "utf-8"));
  const evaluation: Evaluation = JSON.parse(await fs.readFile(evalPath, "utf-8"));

  let report: string;
  if (format === "brief") {
    report = generateBriefReport(research.topic, evaluation, ideasPool);
  } else {
    report = generateDetailedReport(research, ideasPool, evaluation);
  }

  await fs.writeFile(path.join(runDir, outputFile), report);
  console.log(`Report generated: ${outputFile}`);
}

main().catch(console.error);
