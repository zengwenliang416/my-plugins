#!/usr/bin/env npx ts-node --esm
/**
 * Run Audit - 执行代码审计
 *
 * 用法: npx ts-node run-audit.ts <file-or-dir> [--focus <security|performance|quality>]
 *
 * 功能: 执行安全、性能、代码质量审计
 */

import * as fs from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

interface AuditIssue {
  severity: "critical" | "high" | "medium" | "low";
  category: "security" | "performance" | "quality";
  file: string;
  line: number;
  rule: string;
  message: string;
  suggestion: string;
}

interface AuditResult {
  timestamp: string;
  target: string;
  focus: string[];
  issues: AuditIssue[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  grade: string;
}

// OWASP Top 10 安全检查规则
const SECURITY_RULES = [
  {
    id: "SEC001",
    name: "SQL Injection",
    pattern: /\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)/i,
    severity: "critical" as const,
    message: "潜在的 SQL 注入漏洞",
    suggestion: "使用参数化查询或 ORM",
  },
  {
    id: "SEC002",
    name: "XSS",
    pattern: /innerHTML\s*=|dangerouslySetInnerHTML/,
    severity: "high" as const,
    message: "潜在的 XSS 漏洞",
    suggestion: "使用 textContent 或 DOMPurify 清理",
  },
  {
    id: "SEC003",
    name: "Hardcoded Secret",
    pattern: /(?:password|secret|api_?key|token)\s*[:=]\s*['"][^'"]+['"]/i,
    severity: "critical" as const,
    message: "硬编码的敏感信息",
    suggestion: "使用环境变量存储敏感信息",
  },
  {
    id: "SEC004",
    name: "Command Injection",
    pattern: /exec\s*\(\s*`[^`]*\$\{/,
    severity: "critical" as const,
    message: "潜在的命令注入漏洞",
    suggestion: "使用 execFile 或参数数组",
  },
  {
    id: "SEC005",
    name: "Insecure Random",
    pattern: /Math\.random\(\)/,
    severity: "medium" as const,
    message: "不安全的随机数生成",
    suggestion: "使用 crypto.randomBytes() 生成安全随机数",
  },
];

// 性能检查规则
const PERFORMANCE_RULES = [
  {
    id: "PERF001",
    name: "N+1 Query",
    pattern: /for\s*\([^)]+\)\s*\{[^}]*await\s+\w+\.(find|query|get)/,
    severity: "high" as const,
    message: "循环中的数据库查询 (N+1 问题)",
    suggestion: "使用批量查询或 include/join",
  },
  {
    id: "PERF002",
    name: "Missing Memo",
    pattern: /function\s+\w+Component[^{]*\{[^}]*(?:map|filter|reduce)\s*\(/,
    severity: "medium" as const,
    message: "组件中的计算可能需要 memo",
    suggestion: "考虑使用 useMemo 缓存计算结果",
  },
  {
    id: "PERF003",
    name: "Sync File Operation",
    pattern: /readFileSync|writeFileSync|existsSync/,
    severity: "medium" as const,
    message: "同步文件操作可能阻塞",
    suggestion: "使用异步版本: readFile, writeFile",
  },
  {
    id: "PERF004",
    name: "Missing Cleanup",
    pattern: /useEffect\s*\([^)]*subscribe|addEventListener[^}]*\}\s*,/,
    severity: "high" as const,
    message: "useEffect 可能缺少清理函数",
    suggestion: "返回清理函数取消订阅",
  },
];

// 代码质量检查规则
const QUALITY_RULES = [
  {
    id: "QUAL001",
    name: "Long Function",
    pattern: null, // 特殊处理
    severity: "medium" as const,
    message: "函数过长",
    suggestion: "拆分为更小的函数",
    lineThreshold: 30,
  },
  {
    id: "QUAL002",
    name: "Deep Nesting",
    pattern: /^\s{16,}[^\s]/m,
    severity: "medium" as const,
    message: "嵌套层级过深",
    suggestion: "提取函数或使用早返回",
  },
  {
    id: "QUAL003",
    name: "Any Type",
    pattern: /:\s*any\b|<any>/,
    severity: "low" as const,
    message: "使用了 any 类型",
    suggestion: "使用具体类型或 unknown",
  },
  {
    id: "QUAL004",
    name: "Empty Catch",
    pattern: /catch\s*\([^)]*\)\s*\{\s*\}/,
    severity: "medium" as const,
    message: "空的 catch 块",
    suggestion: "处理或记录错误",
  },
  {
    id: "QUAL005",
    name: "Magic Number",
    pattern: /[^a-zA-Z0-9_]([2-9]\d{2,}|[1-9]\d{3,})[^a-zA-Z0-9_]/,
    severity: "low" as const,
    message: "魔法数字",
    suggestion: "提取为命名常量",
  },
];

// 分析单个文件
function auditFile(
  filePath: string,
  focus: string[]
): AuditIssue[] {
  const issues: AuditIssue[] = [];

  if (!fs.existsSync(filePath)) return issues;

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  // 安全审计
  if (focus.includes("security")) {
    for (const rule of SECURITY_RULES) {
      for (let i = 0; i < lines.length; i++) {
        if (rule.pattern.test(lines[i])) {
          issues.push({
            severity: rule.severity,
            category: "security",
            file: filePath,
            line: i + 1,
            rule: rule.id,
            message: rule.message,
            suggestion: rule.suggestion,
          });
        }
      }
    }
  }

  // 性能审计
  if (focus.includes("performance")) {
    for (const rule of PERFORMANCE_RULES) {
      for (let i = 0; i < lines.length; i++) {
        if (rule.pattern.test(lines[i])) {
          issues.push({
            severity: rule.severity,
            category: "performance",
            file: filePath,
            line: i + 1,
            rule: rule.id,
            message: rule.message,
            suggestion: rule.suggestion,
          });
        }
      }
    }
  }

  // 代码质量审计
  if (focus.includes("quality")) {
    for (const rule of QUALITY_RULES) {
      if (rule.pattern) {
        for (let i = 0; i < lines.length; i++) {
          if (rule.pattern.test(lines[i])) {
            issues.push({
              severity: rule.severity,
              category: "quality",
              file: filePath,
              line: i + 1,
              rule: rule.id,
              message: rule.message,
              suggestion: rule.suggestion,
            });
          }
        }
      }
    }

    // 检查函数长度
    const funcPattern = /(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)/g;
    let funcMatch;
    while ((funcMatch = funcPattern.exec(content)) !== null) {
      const startLine = content.substring(0, funcMatch.index).split("\n").length;
      // 简化的函数长度检查
      const nextFunc = content.indexOf("function", funcMatch.index + 1);
      const funcEnd = nextFunc === -1 ? content.length : nextFunc;
      const funcLines = content.substring(funcMatch.index, funcEnd).split("\n").length;

      if (funcLines > 30) {
        issues.push({
          severity: "medium",
          category: "quality",
          file: filePath,
          line: startLine,
          rule: "QUAL001",
          message: `函数过长 (${funcLines} 行)`,
          suggestion: "拆分为更小的函数",
        });
      }
    }
  }

  return issues;
}

// 获取目录下的所有代码文件
function getCodeFiles(dir: string): string[] {
  const files: string[] = [];
  const extensions = [".ts", ".tsx", ".js", ".jsx"];

  function walk(currentDir: string) {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = `${currentDir}/${item}`;
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith(".") && item !== "node_modules") {
        walk(fullPath);
      } else if (stat.isFile() && extensions.some((ext) => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  if (fs.statSync(dir).isDirectory()) {
    walk(dir);
  } else {
    files.push(dir);
  }

  return files;
}

// 计算评分
function calculateGrade(summary: AuditResult["summary"]): string {
  const score =
    100 -
    summary.critical * 25 -
    summary.high * 10 -
    summary.medium * 5 -
    summary.low * 1;

  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

// 主审计函数
function runAudit(
  target: string,
  focus: string[] = ["security", "performance", "quality"]
): AuditResult {
  const files = getCodeFiles(target);
  const allIssues: AuditIssue[] = [];

  for (const file of files) {
    const issues = auditFile(file, focus);
    allIssues.push(...issues);
  }

  // 按严重性排序
  allIssues.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });

  const summary = {
    critical: allIssues.filter((i) => i.severity === "critical").length,
    high: allIssues.filter((i) => i.severity === "high").length,
    medium: allIssues.filter((i) => i.severity === "medium").length,
    low: allIssues.filter((i) => i.severity === "low").length,
    total: allIssues.length,
  };

  return {
    timestamp: new Date().toISOString(),
    target,
    focus,
    issues: allIssues,
    summary,
    grade: calculateGrade(summary),
  };
}

// 格式化结果
function formatResult(result: AuditResult): string {
  const lines: string[] = [];

  lines.push(`🔍 代码审计报告`);
  lines.push(`目标: ${result.target}`);
  lines.push(`审计范围: ${result.focus.join(", ")}`);
  lines.push(`时间: ${result.timestamp}`);
  lines.push("");

  lines.push(`## 评分: ${result.grade}`);
  lines.push("");
  lines.push(`🔴 Critical: ${result.summary.critical}`);
  lines.push(`🟠 High: ${result.summary.high}`);
  lines.push(`🟡 Medium: ${result.summary.medium}`);
  lines.push(`🟢 Low: ${result.summary.low}`);
  lines.push(`📊 Total: ${result.summary.total}`);
  lines.push("");

  if (result.issues.length > 0) {
    lines.push(`## 发现的问题`);
    lines.push("");

    const byCategory: Record<string, AuditIssue[]> = {};
    for (const issue of result.issues) {
      if (!byCategory[issue.category]) byCategory[issue.category] = [];
      byCategory[issue.category].push(issue);
    }

    for (const [category, issues] of Object.entries(byCategory)) {
      lines.push(`### ${category.toUpperCase()} (${issues.length})`);
      lines.push("");

      for (const issue of issues) {
        const icon =
          issue.severity === "critical"
            ? "🔴"
            : issue.severity === "high"
            ? "🟠"
            : issue.severity === "medium"
            ? "🟡"
            : "🟢";

        lines.push(`${icon} **${issue.rule}**: ${issue.message}`);
        lines.push(`   位置: ${issue.file}:${issue.line}`);
        lines.push(`   建议: ${issue.suggestion}`);
        lines.push("");
      }
    }
  } else {
    lines.push("✅ 未发现问题");
  }

  return lines.join("\n");
}

// CLI 入口
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const focusIdx = args.indexOf("--focus");
  const focus = focusIdx !== -1 ? args[focusIdx + 1].split(",") : ["security", "performance", "quality"];
  const target = args.filter((a) => !a.startsWith("--") && (focusIdx === -1 || args.indexOf(a) !== focusIdx + 1))[0];

  if (!target) {
    console.error("Usage: npx ts-node run-audit.ts <file-or-dir> [--focus <security,performance,quality>]");
    process.exit(1);
  }

  if (!fs.existsSync(target)) {
    console.error(`Error: Target not found: ${target}`);
    process.exit(1);
  }

  const result = runAudit(target, focus);
  console.log(formatResult(result));

  if (args.includes("--json")) {
    console.log("\n📦 JSON:");
    console.log(JSON.stringify(result, null, 2));
  }

  // 如果有 critical 或 high 问题，返回非零退出码
  if (result.summary.critical > 0 || result.summary.high > 0) {
    process.exit(1);
  }
}

export { runAudit, auditFile };
export type { AuditResult, AuditIssue };
