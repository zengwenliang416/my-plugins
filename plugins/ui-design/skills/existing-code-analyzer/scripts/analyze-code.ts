#!/usr/bin/env npx ts-node --esm
/**
 * Analyze Code - 分析现有代码的设计和 UX 问题
 *
 * 用法: npx ts-node analyze-code.ts <file-or-dir> [--output <file>]
 *
 * 功能: 检查现有代码中的设计和 UX 问题
 */

import * as fs from "fs";
import { fileURLToPath } from "url";

interface CodeAnalysisResult {
  timestamp: string;
  target: string;
  filesAnalyzed: number;
  issues: CodeIssue[];
  designPatterns: DesignPattern[];
  uxIssues: UXIssue[];
  recommendations: Recommendation[];
  summary: AnalysisSummary;
}

interface CodeIssue {
  category: "design" | "ux" | "a11y" | "perf" | "consistency";
  severity: "error" | "warning" | "info";
  file: string;
  line: number;
  message: string;
  suggestion: string;
}

interface DesignPattern {
  name: string;
  count: number;
  files: string[];
  consistent: boolean;
}

interface UXIssue {
  type: string;
  description: string;
  impact: "high" | "medium" | "low";
  files: string[];
}

interface Recommendation {
  priority: number;
  category: string;
  title: string;
  description: string;
  effort: "low" | "medium" | "high";
}

interface AnalysisSummary {
  totalIssues: number;
  errors: number;
  warnings: number;
  info: number;
  score: number;
}

// 设计问题检查规则
const DESIGN_RULES = [
  {
    id: "D001",
    name: "Inline Styles",
    pattern: /style=\{\{/g,
    message: "内联样式影响可维护性",
    suggestion: "提取到 CSS 类或 styled-components",
  },
  {
    id: "D002",
    name: "Magic Colors",
    pattern: /#[0-9A-Fa-f]{3,8}(?!.*(?:theme|color|var))/g,
    message: "硬编码颜色值",
    suggestion: "使用设计 token 或 CSS 变量",
  },
  {
    id: "D003",
    name: "Magic Numbers",
    pattern: /(?:width|height|margin|padding):\s*\d+px/g,
    message: "硬编码间距值",
    suggestion: "使用间距系统（如 4px 基准）",
  },
  {
    id: "D004",
    name: "Mixed Styling",
    pattern: /className.*style=|style=.*className/g,
    message: "混合使用 className 和 style",
    suggestion: "统一使用一种样式方案",
  },
  {
    id: "D005",
    name: "Z-Index Chaos",
    pattern: /z-index:\s*(\d{3,})/g,
    message: "过大的 z-index 值",
    suggestion: "建立 z-index 层级系统",
  },
];

// UX 问题检查规则
const UX_RULES = [
  {
    id: "U001",
    name: "Missing Loading State",
    pattern: /async|await|fetch|axios/g,
    antiPattern: /loading|isLoading|pending|spinner/gi,
    message: "异步操作可能缺少加载状态",
    impact: "high" as const,
  },
  {
    id: "U002",
    name: "Missing Error Handling",
    pattern: /catch\s*\([^)]*\)\s*\{[\s\S]*?\}/g,
    antiPattern: /setError|showError|toast|alert|notification/gi,
    message: "错误处理可能缺少用户反馈",
    impact: "high" as const,
  },
  {
    id: "U003",
    name: "No Empty State",
    pattern: /\.length\s*===?\s*0|isEmpty/g,
    antiPattern: /empty.*state|no.*data|EmptyState/gi,
    message: "列表可能缺少空状态处理",
    impact: "medium" as const,
  },
  {
    id: "U004",
    name: "Missing Confirmation",
    pattern: /delete|remove|destroy/gi,
    antiPattern: /confirm|modal|dialog/gi,
    message: "危险操作可能缺少确认提示",
    impact: "high" as const,
  },
];

// 可访问性检查规则
const A11Y_RULES = [
  {
    id: "A001",
    name: "Missing Alt",
    pattern: /<img[^>]*(?!alt=)[^>]*>/gi,
    message: "图片缺少 alt 属性",
  },
  {
    id: "A002",
    name: "Click on Div",
    pattern: /<div[^>]*onClick/gi,
    message: "非交互元素添加了点击事件",
    suggestion: "使用 <button> 或添加 role 和键盘事件",
  },
  {
    id: "A003",
    name: "Missing Label",
    pattern: /<input[^>]*(?!aria-label|id)[^>]*>/gi,
    message: "输入框缺少可访问标签",
  },
  {
    id: "A004",
    name: "Color Only Feedback",
    pattern: /color:\s*(?:red|green)|text-(?:red|green)/gi,
    message: "仅用颜色传达信息",
    suggestion: "添加图标或文字说明",
  },
];

// 分析单个文件
function analyzeFile(filePath: string): CodeIssue[] {
  const issues: CodeIssue[] = [];

  if (!fs.existsSync(filePath)) return issues;

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  // 设计问题检查
  for (const rule of DESIGN_RULES) {
    for (let i = 0; i < lines.length; i++) {
      if (rule.pattern.test(lines[i])) {
        issues.push({
          category: "design",
          severity: "warning",
          file: filePath,
          line: i + 1,
          message: rule.message,
          suggestion: rule.suggestion,
        });
      }
      rule.pattern.lastIndex = 0;
    }
  }

  // UX 问题检查
  for (const rule of UX_RULES) {
    const hasPattern = rule.pattern.test(content);
    const hasAntiPattern = rule.antiPattern.test(content);
    rule.pattern.lastIndex = 0;
    rule.antiPattern.lastIndex = 0;

    if (hasPattern && !hasAntiPattern) {
      issues.push({
        category: "ux",
        severity: rule.impact === "high" ? "error" : "warning",
        file: filePath,
        line: 0,
        message: rule.message,
        suggestion: `添加 ${rule.antiPattern.source.split("|")[0]} 相关处理`,
      });
    }
  }

  // 可访问性检查
  for (const rule of A11Y_RULES) {
    for (let i = 0; i < lines.length; i++) {
      if (rule.pattern.test(lines[i])) {
        issues.push({
          category: "a11y",
          severity: "error",
          file: filePath,
          line: i + 1,
          message: rule.message,
          suggestion: rule.suggestion || "参考 WCAG 2.1 指南",
        });
      }
      rule.pattern.lastIndex = 0;
    }
  }

  return issues;
}

// 检测设计模式
function detectDesignPatterns(files: string[]): DesignPattern[] {
  const patterns: Record<string, { count: number; files: string[] }> = {
    tailwind: { count: 0, files: [] },
    cssModules: { count: 0, files: [] },
    styledComponents: { count: 0, files: [] },
    inlineStyles: { count: 0, files: [] },
    cssVariables: { count: 0, files: [] },
  };

  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, "utf-8");

    if (/className=["'][^"']*(?:flex|grid|p-|m-|bg-|text-)/.test(content)) {
      patterns.tailwind.count++;
      patterns.tailwind.files.push(file);
    }
    if (/import\s+styles\s+from/.test(content)) {
      patterns.cssModules.count++;
      patterns.cssModules.files.push(file);
    }
    if (/styled\.\w+`/.test(content)) {
      patterns.styledComponents.count++;
      patterns.styledComponents.files.push(file);
    }
    if (/style=\{\{/.test(content)) {
      patterns.inlineStyles.count++;
      patterns.inlineStyles.files.push(file);
    }
    if (/var\(--/.test(content)) {
      patterns.cssVariables.count++;
      patterns.cssVariables.files.push(file);
    }
  }

  // 检测一致性
  const usedPatterns = Object.entries(patterns).filter(([, v]) => v.count > 0);
  const primaryPattern = usedPatterns.sort((a, b) => b[1].count - a[1].count)[0];

  return Object.entries(patterns)
    .filter(([, v]) => v.count > 0)
    .map(([name, data]) => ({
      name,
      count: data.count,
      files: data.files,
      consistent: !primaryPattern || data.count === primaryPattern[1].count || data.count === 0,
    }));
}

// 生成建议
function generateRecommendations(
  issues: CodeIssue[],
  patterns: DesignPattern[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // 基于问题数量生成建议
  const issuesByCategory = issues.reduce((acc, issue) => {
    acc[issue.category] = (acc[issue.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (issuesByCategory.design > 5) {
    recommendations.push({
      priority: 1,
      category: "design",
      title: "建立设计系统",
      description: "创建 design tokens 管理颜色、间距、字体等设计变量",
      effort: "medium",
    });
  }

  if (issuesByCategory.ux > 3) {
    recommendations.push({
      priority: 2,
      category: "ux",
      title: "完善交互反馈",
      description: "添加加载状态、错误处理、空状态等用户反馈机制",
      effort: "medium",
    });
  }

  if (issuesByCategory.a11y > 0) {
    recommendations.push({
      priority: 1,
      category: "a11y",
      title: "修复可访问性问题",
      description: "确保符合 WCAG 2.1 AA 级标准",
      effort: "low",
    });
  }

  // 基于模式一致性生成建议
  const inconsistentPatterns = patterns.filter(p => !p.consistent);
  if (inconsistentPatterns.length > 1) {
    recommendations.push({
      priority: 2,
      category: "consistency",
      title: "统一样式方案",
      description: `项目混用了 ${inconsistentPatterns.map(p => p.name).join("、")}，建议统一`,
      effort: "high",
    });
  }

  return recommendations.sort((a, b) => a.priority - b.priority);
}

// 获取代码文件
function getCodeFiles(target: string): string[] {
  const files: string[] = [];
  const extensions = [".tsx", ".jsx", ".ts", ".js", ".vue"];

  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = `${dir}/${item}`;
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith(".") && item !== "node_modules") {
        walk(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  if (fs.statSync(target).isDirectory()) {
    walk(target);
  } else {
    files.push(target);
  }

  return files;
}

// 主分析函数
function analyzeCode(target: string): CodeAnalysisResult {
  const files = getCodeFiles(target);
  const allIssues: CodeIssue[] = [];

  for (const file of files) {
    const issues = analyzeFile(file);
    allIssues.push(...issues);
  }

  const patterns = detectDesignPatterns(files);
  const recommendations = generateRecommendations(allIssues, patterns);

  // UX 问题汇总
  const uxIssues: UXIssue[] = UX_RULES
    .filter(rule => allIssues.some(i => i.message === rule.message))
    .map(rule => ({
      type: rule.name,
      description: rule.message,
      impact: rule.impact,
      files: allIssues.filter(i => i.message === rule.message).map(i => i.file),
    }));

  const summary: AnalysisSummary = {
    totalIssues: allIssues.length,
    errors: allIssues.filter(i => i.severity === "error").length,
    warnings: allIssues.filter(i => i.severity === "warning").length,
    info: allIssues.filter(i => i.severity === "info").length,
    score: Math.max(0, 100 - allIssues.length * 2),
  };

  return {
    timestamp: new Date().toISOString(),
    target,
    filesAnalyzed: files.length,
    issues: allIssues,
    designPatterns: patterns,
    uxIssues,
    recommendations,
    summary,
  };
}

// 格式化结果
function formatResult(result: CodeAnalysisResult): string {
  const lines: string[] = [];

  lines.push(`# 代码设计分析报告`);
  lines.push(``);
  lines.push(`**目标**: ${result.target}`);
  lines.push(`**分析文件数**: ${result.filesAnalyzed}`);
  lines.push(`**健康分数**: ${result.summary.score}/100`);
  lines.push(``);

  lines.push(`## 问题统计`);
  lines.push(``);
  lines.push(`- ❌ 错误: ${result.summary.errors}`);
  lines.push(`- ⚠️ 警告: ${result.summary.warnings}`);
  lines.push(`- ℹ️ 提示: ${result.summary.info}`);
  lines.push(``);

  if (result.designPatterns.length > 0) {
    lines.push(`## 设计模式检测`);
    lines.push(``);
    lines.push(`| 模式 | 使用次数 | 一致性 |`);
    lines.push(`|------|----------|--------|`);
    for (const pattern of result.designPatterns) {
      lines.push(`| ${pattern.name} | ${pattern.count} | ${pattern.consistent ? "✅" : "⚠️"} |`);
    }
    lines.push(``);
  }

  if (result.uxIssues.length > 0) {
    lines.push(`## UX 问题`);
    lines.push(``);
    for (const issue of result.uxIssues) {
      const icon = issue.impact === "high" ? "🔴" : issue.impact === "medium" ? "🟡" : "🟢";
      lines.push(`${icon} **${issue.type}**: ${issue.description}`);
      lines.push(`   影响文件: ${issue.files.slice(0, 3).join(", ")}${issue.files.length > 3 ? "..." : ""}`);
      lines.push(``);
    }
  }

  if (result.recommendations.length > 0) {
    lines.push(`## 优化建议`);
    lines.push(``);
    for (const rec of result.recommendations) {
      lines.push(`### ${rec.priority}. ${rec.title}`);
      lines.push(``);
      lines.push(`- **类别**: ${rec.category}`);
      lines.push(`- **描述**: ${rec.description}`);
      lines.push(`- **工作量**: ${rec.effort}`);
      lines.push(``);
    }
  }

  if (result.issues.length > 0) {
    lines.push(`## 详细问题列表`);
    lines.push(``);
    for (const issue of result.issues.slice(0, 20)) {
      const icon = issue.severity === "error" ? "❌" : issue.severity === "warning" ? "⚠️" : "ℹ️";
      lines.push(`${icon} [${issue.category}] ${issue.message}`);
      lines.push(`   ${issue.file}${issue.line > 0 ? `:${issue.line}` : ""}`);
      lines.push(`   建议: ${issue.suggestion}`);
      lines.push(``);
    }
    if (result.issues.length > 20) {
      lines.push(`... 还有 ${result.issues.length - 20} 个问题`);
    }
  }

  return lines.join("\n");
}

// CLI 入口
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);

  const outputIdx = args.indexOf("--output");
  const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : null;

  const target = args.filter((a: string) => !a.startsWith("--") && a !== outputFile)[0];

  if (!target) {
    console.error("Usage: npx ts-node analyze-code.ts <file-or-dir> [--output <file>]");
    process.exit(1);
  }

  if (!fs.existsSync(target)) {
    console.error(`Error: Target not found: ${target}`);
    process.exit(1);
  }

  const result = analyzeCode(target);
  const formatted = formatResult(result);

  if (outputFile) {
    fs.writeFileSync(outputFile, formatted);
    console.log(`✅ 分析报告已写入 ${outputFile}`);
  } else {
    console.log(formatted);
  }

  if (args.includes("--json")) {
    console.log("\n📦 JSON:");
    console.log(JSON.stringify(result, null, 2));
  }

  process.exit(result.summary.errors > 0 ? 1 : 0);
}

export { analyzeCode };
export type { CodeAnalysisResult, CodeIssue };
