#!/usr/bin/env npx ts-node --esm
/**
 * Check Accessibility - 检查可访问性
 *
 * 用法: npx ts-node check-accessibility.ts <file> [--level <A|AA|AAA>]
 *
 * 功能: 检查代码是否符合 WCAG 可访问性标准
 */

import * as fs from "fs";
import { fileURLToPath } from "url";

interface AccessibilityIssue {
  rule: string;
  level: "A" | "AA" | "AAA";
  line: number;
  element: string;
  message: string;
  fix: string;
}

interface AccessibilityResult {
  timestamp: string;
  file: string;
  targetLevel: string;
  issues: AccessibilityIssue[];
  passed: boolean;
  summary: {
    levelA: { passed: number; failed: number };
    levelAA: { passed: number; failed: number };
    levelAAA: { passed: number; failed: number };
  };
}

// WCAG 规则
const WCAG_RULES = [
  // Level A
  {
    id: "1.1.1",
    level: "A" as const,
    name: "Non-text Content",
    pattern: /<img[^>]*(?!alt=)[^>]*>/gi,
    message: "图片缺少 alt 属性",
    fix: "添加描述性的 alt 属性",
  },
  {
    id: "1.3.1",
    level: "A" as const,
    name: "Info and Relationships",
    pattern: /<(?:div|span)[^>]*onClick/gi,
    message: "可点击元素应使用语义化标签",
    fix: "使用 <button> 或 <a> 替代",
  },
  {
    id: "2.1.1",
    level: "A" as const,
    name: "Keyboard",
    pattern: /<div[^>]*onClick[^>]*(?!tabIndex)[^>]*>/gi,
    message: "可交互元素缺少键盘访问",
    fix: "添加 tabIndex 和 onKeyDown",
  },
  {
    id: "2.4.1",
    level: "A" as const,
    name: "Bypass Blocks",
    pattern: null, // 特殊检查
    message: "缺少跳过导航的机制",
    fix: "添加 Skip to main content 链接",
  },
  {
    id: "4.1.1",
    level: "A" as const,
    name: "Parsing",
    pattern: /id="([^"]+)"[^]*id="\1"/gi,
    message: "重复的 ID 属性",
    fix: "确保所有 ID 唯一",
  },
  {
    id: "4.1.2",
    level: "A" as const,
    name: "Name, Role, Value",
    pattern: /<input[^>]*(?!aria-label|aria-labelledby|id)[^>]*>/gi,
    message: "表单控件缺少可访问名称",
    fix: "添加 aria-label 或关联 label",
  },

  // Level AA
  {
    id: "1.4.3",
    level: "AA" as const,
    name: "Contrast (Minimum)",
    pattern: /color:\s*#(?:fff|ffffff|000|000000)/gi,
    message: "检查颜色对比度是否符合 4.5:1",
    fix: "使用对比度检查工具验证",
  },
  {
    id: "1.4.4",
    level: "AA" as const,
    name: "Resize Text",
    pattern: /font-size:\s*\d+px/gi,
    message: "使用固定像素字号可能影响缩放",
    fix: "考虑使用 rem 或 em 单位",
  },
  {
    id: "2.4.6",
    level: "AA" as const,
    name: "Headings and Labels",
    pattern: /<h[1-6][^>]*>\s*<\/h[1-6]>/gi,
    message: "空的标题元素",
    fix: "添加描述性标题内容",
  },
  {
    id: "2.4.7",
    level: "AA" as const,
    name: "Focus Visible",
    pattern: /outline:\s*(?:none|0)/gi,
    message: "移除了焦点轮廓",
    fix: "保留或自定义焦点样式",
  },
  {
    id: "3.1.2",
    level: "AA" as const,
    name: "Language of Parts",
    pattern: null, // 特殊检查
    message: "不同语言的内容应标注 lang 属性",
    fix: "添加 lang 属性标识语言",
  },
  {
    id: "3.3.1",
    level: "AA" as const,
    name: "Error Identification",
    pattern: /<input[^>]*required[^>]*>/gi,
    message: "必填字段应有错误提示机制",
    fix: "添加验证和错误消息",
  },

  // Level AAA
  {
    id: "1.4.6",
    level: "AAA" as const,
    name: "Contrast (Enhanced)",
    pattern: null, // 需要计算
    message: "增强对比度要求 7:1",
    fix: "使用更高对比度的颜色",
  },
  {
    id: "2.2.3",
    level: "AAA" as const,
    name: "No Timing",
    pattern: /setTimeout|setInterval/gi,
    message: "时间限制可能影响可访问性",
    fix: "提供延长或取消时间限制的选项",
  },
  {
    id: "2.4.9",
    level: "AAA" as const,
    name: "Link Purpose (Link Only)",
    pattern: />(?:click here|read more|learn more)</gi,
    message: "链接文本不够描述性",
    fix: "使用描述性链接文本",
  },
];

// 检查单个文件
function checkAccessibility(
  filePath: string,
  targetLevel: "A" | "AA" | "AAA" = "AA"
): AccessibilityResult {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const issues: AccessibilityIssue[] = [];

  // 确定要检查的级别
  const levels: ("A" | "AA" | "AAA")[] = ["A"];
  if (targetLevel === "AA" || targetLevel === "AAA") levels.push("AA");
  if (targetLevel === "AAA") levels.push("AAA");

  // 应用规则
  for (const rule of WCAG_RULES) {
    if (!levels.includes(rule.level)) continue;
    if (!rule.pattern) continue;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      rule.pattern.lastIndex = 0; // Reset regex

      if (rule.pattern.test(line)) {
        issues.push({
          rule: rule.id,
          level: rule.level,
          line: i + 1,
          element: line.trim().substring(0, 50),
          message: rule.message,
          fix: rule.fix,
        });
      }
    }
  }

  // 特殊检查：Skip Link
  if (!content.includes("skip") && !content.includes("main-content")) {
    issues.push({
      rule: "2.4.1",
      level: "A",
      line: 1,
      element: "<body>",
      message: "缺少跳过导航的机制",
      fix: "添加 Skip to main content 链接",
    });
  }

  // 特殊检查：lang 属性
  if (!content.includes('lang="') && !content.includes("lang='")) {
    issues.push({
      rule: "3.1.1",
      level: "A",
      line: 1,
      element: "<html>",
      message: "缺少 lang 属性",
      fix: "添加 lang 属性，如 lang=\"zh-CN\"",
    });
  }

  // 计算统计
  const summary = {
    levelA: {
      passed: WCAG_RULES.filter((r) => r.level === "A").length -
        issues.filter((i) => i.level === "A").length,
      failed: issues.filter((i) => i.level === "A").length,
    },
    levelAA: {
      passed: WCAG_RULES.filter((r) => r.level === "AA").length -
        issues.filter((i) => i.level === "AA").length,
      failed: issues.filter((i) => i.level === "AA").length,
    },
    levelAAA: {
      passed: WCAG_RULES.filter((r) => r.level === "AAA").length -
        issues.filter((i) => i.level === "AAA").length,
      failed: issues.filter((i) => i.level === "AAA").length,
    },
  };

  // 判断是否通过
  let passed = true;
  if (levels.includes("A") && summary.levelA.failed > 0) passed = false;
  if (levels.includes("AA") && summary.levelAA.failed > 0) passed = false;
  if (levels.includes("AAA") && summary.levelAAA.failed > 0) passed = false;

  return {
    timestamp: new Date().toISOString(),
    file: filePath,
    targetLevel,
    issues,
    passed,
    summary,
  };
}

// 格式化结果
function formatResult(result: AccessibilityResult): string {
  const lines: string[] = [];

  lines.push(`# 可访问性检查报告`);
  lines.push("");
  lines.push(`**文件**: ${result.file}`);
  lines.push(`**目标级别**: WCAG 2.1 ${result.targetLevel}`);
  lines.push(`**结果**: ${result.passed ? "✅ 通过" : "❌ 未通过"}`);
  lines.push("");

  lines.push(`## 统计`);
  lines.push("");
  lines.push(`| 级别 | 通过 | 失败 |`);
  lines.push(`|------|------|------|`);
  lines.push(`| A | ${result.summary.levelA.passed} | ${result.summary.levelA.failed} |`);
  lines.push(`| AA | ${result.summary.levelAA.passed} | ${result.summary.levelAA.failed} |`);
  lines.push(`| AAA | ${result.summary.levelAAA.passed} | ${result.summary.levelAAA.failed} |`);
  lines.push("");

  if (result.issues.length > 0) {
    lines.push(`## 问题详情 (${result.issues.length})`);
    lines.push("");

    const byLevel = {
      A: result.issues.filter((i) => i.level === "A"),
      AA: result.issues.filter((i) => i.level === "AA"),
      AAA: result.issues.filter((i) => i.level === "AAA"),
    };

    for (const [level, levelIssues] of Object.entries(byLevel)) {
      if (levelIssues.length === 0) continue;

      lines.push(`### Level ${level} (${levelIssues.length})`);
      lines.push("");

      for (const issue of levelIssues) {
        lines.push(`#### ${issue.rule}: ${issue.message}`);
        lines.push("");
        lines.push(`- **行号**: ${issue.line}`);
        lines.push(`- **元素**: \`${issue.element}...\``);
        lines.push(`- **修复**: ${issue.fix}`);
        lines.push("");
      }
    }
  } else {
    lines.push(`## ✅ 未发现问题`);
  }

  return lines.join("\n");
}

// CLI 入口
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const levelIdx = args.indexOf("--level");
  const level = (levelIdx !== -1 ? args[levelIdx + 1] : "AA") as "A" | "AA" | "AAA";
  const outputIdx = args.indexOf("--output");
  const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : null;

  const file = args.filter(
    (a) => !a.startsWith("--") && a !== level && a !== outputFile
  )[0];

  if (!file) {
    console.error("Usage: npx ts-node check-accessibility.ts <file> [--level <A|AA|AAA>]");
    process.exit(1);
  }

  if (!fs.existsSync(file)) {
    console.error(`Error: File not found: ${file}`);
    process.exit(1);
  }

  const result = checkAccessibility(file, level);
  const formatted = formatResult(result);

  if (outputFile) {
    fs.writeFileSync(outputFile, formatted);
    console.log(`✅ 报告已写入 ${outputFile}`);
  } else {
    console.log(formatted);
  }

  if (args.includes("--json")) {
    console.log("\n📦 JSON:");
    console.log(JSON.stringify(result, null, 2));
  }

  process.exit(result.passed ? 0 : 1);
}

export { checkAccessibility };
export type { AccessibilityResult, AccessibilityIssue };
