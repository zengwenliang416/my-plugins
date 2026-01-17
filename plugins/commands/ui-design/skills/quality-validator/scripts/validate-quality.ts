#!/usr/bin/env npx ts-node --esm
/**
 * Validate Quality - 验证代码质量和设计还原度
 *
 * 用法: npx ts-node validate-quality.ts <code-dir> <design-spec> [--output <file>]
 *
 * 功能: 检查代码实现是否符合设计规格
 */

import * as fs from "fs";
import { fileURLToPath } from "url";

interface QualityResult {
  timestamp: string;
  codeDir: string;
  designSpec: string;
  score: number;
  grade: string;
  checks: QualityCheck[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
  };
}

interface QualityCheck {
  category: "design" | "code" | "a11y" | "perf";
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
  details?: string;
}

// 设计还原度检查规则
const DESIGN_CHECKS = [
  {
    name: "Color Consistency",
    check: (code: string, spec: any) => {
      const specColors = spec.colors || [];
      const codeColors = code.match(/#[0-9A-Fa-f]{3,8}/g) || [];
      const unknownColors = codeColors.filter(
        (c: string) => !specColors.some((sc: string) => sc.toLowerCase() === c.toLowerCase())
      );
      return {
        status: unknownColors.length === 0 ? "pass" : unknownColors.length < 3 ? "warn" : "fail",
        message: unknownColors.length === 0
          ? "所有颜色符合设计规格"
          : `发现 ${unknownColors.length} 个非规格颜色`,
        details: unknownColors.length > 0 ? unknownColors.slice(0, 5).join(", ") : undefined,
      };
    },
  },
  {
    name: "Spacing System",
    check: (code: string, spec: any) => {
      const spacingPattern = /(?:margin|padding|gap):\s*(\d+)px/g;
      const invalidSpacing: number[] = [];
      const validSpacing = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64];

      let match;
      while ((match = spacingPattern.exec(code)) !== null) {
        const value = parseInt(match[1]);
        if (!validSpacing.includes(value)) {
          invalidSpacing.push(value);
        }
      }

      return {
        status: invalidSpacing.length === 0 ? "pass" : "warn",
        message: invalidSpacing.length === 0
          ? "间距系统符合 4px 基准"
          : `${invalidSpacing.length} 个间距值不在系统内`,
        details: invalidSpacing.length > 0 ? invalidSpacing.slice(0, 5).join("px, ") + "px" : undefined,
      };
    },
  },
  {
    name: "Typography Scale",
    check: (code: string, spec: any) => {
      const fontSizes = code.match(/font-size:\s*(\d+(?:\.\d+)?)(px|rem)/g) || [];
      const validSizes = [12, 14, 16, 18, 20, 24, 30, 36, 48, 60];
      const invalidSizes = fontSizes.filter((fs: string) => {
        const match = fs.match(/(\d+(?:\.\d+)?)(px|rem)/);
        if (!match) return false;
        const value = parseFloat(match[1]);
        const unit = match[2];
        const pxValue = unit === "rem" ? value * 16 : value;
        return !validSizes.some(vs => Math.abs(vs - pxValue) < 1);
      });

      return {
        status: invalidSizes.length === 0 ? "pass" : "warn",
        message: invalidSizes.length === 0
          ? "字体大小符合类型比例"
          : `${invalidSizes.length} 个字号不在比例系统内`,
      };
    },
  },
];

// 代码质量检查规则
const CODE_CHECKS = [
  {
    name: "Component Structure",
    check: (code: string) => {
      const hasDefaultExport = /export default/.test(code);
      const hasPropsInterface = /interface\s+\w+Props/.test(code);

      return {
        status: hasDefaultExport && hasPropsInterface ? "pass" : "warn",
        message: hasDefaultExport && hasPropsInterface
          ? "组件结构规范"
          : "缺少 Props 接口或默认导出",
      };
    },
  },
  {
    name: "CSS-in-JS Pattern",
    check: (code: string) => {
      const hasTailwind = /className=/.test(code);
      const hasInlineStyle = /style=\{\{/.test(code);
      const hasStyledComponents = /styled\.\w+/.test(code);

      const patterns = [hasTailwind, hasInlineStyle, hasStyledComponents].filter(Boolean).length;

      return {
        status: patterns === 1 ? "pass" : patterns > 1 ? "warn" : "fail",
        message: patterns === 1
          ? "样式方案一致"
          : patterns > 1
          ? "混用多种样式方案"
          : "未检测到样式实现",
      };
    },
  },
  {
    name: "Responsive Design",
    check: (code: string) => {
      const hasMediaQuery = /@media|useMediaQuery/.test(code);
      const hasResponsiveClass = /sm:|md:|lg:|xl:|2xl:/.test(code);
      const hasFlexGrid = /flex|grid/.test(code);

      return {
        status: (hasMediaQuery || hasResponsiveClass) && hasFlexGrid ? "pass" : "warn",
        message: (hasMediaQuery || hasResponsiveClass)
          ? "包含响应式设计"
          : "缺少响应式断点处理",
      };
    },
  },
];

// 可访问性检查
const A11Y_CHECKS = [
  {
    name: "Semantic HTML",
    check: (code: string) => {
      const semanticTags = /<(header|nav|main|footer|article|section|aside)/g;
      const matches = code.match(semanticTags) || [];

      return {
        status: matches.length >= 2 ? "pass" : matches.length >= 1 ? "warn" : "fail",
        message: matches.length >= 2
          ? "使用语义化标签"
          : "应增加语义化标签使用",
      };
    },
  },
  {
    name: "Alt Text",
    check: (code: string) => {
      const imgs = code.match(/<img[^>]*>/g) || [];
      const imgsWithAlt = imgs.filter((img: string) => /alt=/.test(img));

      return {
        status: imgs.length === 0 || imgs.length === imgsWithAlt.length ? "pass" : "fail",
        message: imgs.length === imgsWithAlt.length
          ? "所有图片有 alt 属性"
          : `${imgs.length - imgsWithAlt.length} 个图片缺少 alt`,
      };
    },
  },
  {
    name: "Focus Management",
    check: (code: string) => {
      const hasOutlineNone = /outline:\s*none/.test(code);
      const hasFocusStyle = /:focus|focus:/.test(code);

      return {
        status: !hasOutlineNone && hasFocusStyle ? "pass" : hasOutlineNone ? "fail" : "warn",
        message: hasOutlineNone
          ? "移除了焦点样式"
          : hasFocusStyle
          ? "包含焦点状态样式"
          : "建议添加焦点状态",
      };
    },
  },
];

// 性能检查
const PERF_CHECKS = [
  {
    name: "Image Optimization",
    check: (code: string) => {
      const hasNextImage = /next\/image|Image\s+from/.test(code);
      const hasLazyLoading = /loading="lazy"|lazy/.test(code);

      return {
        status: hasNextImage || hasLazyLoading ? "pass" : "warn",
        message: hasNextImage
          ? "使用优化的图片组件"
          : hasLazyLoading
          ? "启用懒加载"
          : "建议使用图片优化",
      };
    },
  },
  {
    name: "Memoization",
    check: (code: string) => {
      const hasMemo = /React\.memo|useMemo|useCallback/.test(code);
      const hasExpensiveOps = /\.map\s*\(|\.filter\s*\(|\.reduce\s*\(/.test(code);

      return {
        status: !hasExpensiveOps || hasMemo ? "pass" : "warn",
        message: hasMemo
          ? "使用了 memoization"
          : hasExpensiveOps
          ? "有计算操作，建议 memoization"
          : "无需 memoization",
      };
    },
  },
];

// 读取设计规格
function loadDesignSpec(specPath: string): any {
  if (!fs.existsSync(specPath)) {
    return {};
  }

  const content = fs.readFileSync(specPath, "utf-8");

  if (specPath.endsWith(".json")) {
    return JSON.parse(content);
  }

  // 从 markdown 提取颜色和规格
  const colors = content.match(/#[0-9A-Fa-f]{3,8}/g) || [];
  return { colors: [...new Set(colors)] };
}

// 读取代码文件
function loadCodeFiles(dir: string): string {
  const extensions = [".tsx", ".jsx", ".ts", ".js", ".css", ".scss"];
  let allCode = "";

  function walk(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;

    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = `${currentDir}/${item}`;
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith(".") && item !== "node_modules") {
        walk(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        allCode += fs.readFileSync(fullPath, "utf-8") + "\n";
      }
    }
  }

  if (fs.statSync(dir).isDirectory()) {
    walk(dir);
  } else {
    allCode = fs.readFileSync(dir, "utf-8");
  }

  return allCode;
}

// 执行验证
function validateQuality(codeDir: string, designSpec: string): QualityResult {
  const spec = loadDesignSpec(designSpec);
  const code = loadCodeFiles(codeDir);
  const checks: QualityCheck[] = [];

  // 设计还原度检查
  for (const check of DESIGN_CHECKS) {
    const result = check.check(code, spec);
    checks.push({
      category: "design",
      name: check.name,
      status: result.status as "pass" | "fail" | "warn",
      message: result.message,
      details: result.details,
    });
  }

  // 代码质量检查
  for (const check of CODE_CHECKS) {
    const result = check.check(code);
    checks.push({
      category: "code",
      name: check.name,
      status: result.status as "pass" | "fail" | "warn",
      message: result.message,
    });
  }

  // 可访问性检查
  for (const check of A11Y_CHECKS) {
    const result = check.check(code);
    checks.push({
      category: "a11y",
      name: check.name,
      status: result.status as "pass" | "fail" | "warn",
      message: result.message,
    });
  }

  // 性能检查
  for (const check of PERF_CHECKS) {
    const result = check.check(code);
    checks.push({
      category: "perf",
      name: check.name,
      status: result.status as "pass" | "fail" | "warn",
      message: result.message,
    });
  }

  // 计算统计
  const summary = {
    passed: checks.filter(c => c.status === "pass").length,
    failed: checks.filter(c => c.status === "fail").length,
    warnings: checks.filter(c => c.status === "warn").length,
  };

  // 计算分数
  const score = Math.round(
    (summary.passed * 10 + summary.warnings * 5) / checks.length * 10
  );

  // 评级
  let grade = "F";
  if (score >= 90) grade = "A";
  else if (score >= 80) grade = "B";
  else if (score >= 70) grade = "C";
  else if (score >= 60) grade = "D";

  return {
    timestamp: new Date().toISOString(),
    codeDir,
    designSpec,
    score,
    grade,
    checks,
    summary,
  };
}

// 格式化结果
function formatResult(result: QualityResult): string {
  const lines: string[] = [];

  lines.push(`# 质量验证报告`);
  lines.push(``);
  lines.push(`**代码目录**: ${result.codeDir}`);
  lines.push(`**设计规格**: ${result.designSpec}`);
  lines.push(`**评分**: ${result.score}/100 (${result.grade})`);
  lines.push(``);

  lines.push(`## 统计`);
  lines.push(``);
  lines.push(`- ✅ 通过: ${result.summary.passed}`);
  lines.push(`- ❌ 失败: ${result.summary.failed}`);
  lines.push(`- ⚠️ 警告: ${result.summary.warnings}`);
  lines.push(``);

  const categories = ["design", "code", "a11y", "perf"];
  const categoryNames: Record<string, string> = {
    design: "设计还原度",
    code: "代码质量",
    a11y: "可访问性",
    perf: "性能",
  };

  for (const cat of categories) {
    const catChecks = result.checks.filter(c => c.category === cat);
    if (catChecks.length === 0) continue;

    lines.push(`## ${categoryNames[cat]}`);
    lines.push(``);

    for (const check of catChecks) {
      const icon = check.status === "pass" ? "✅" : check.status === "fail" ? "❌" : "⚠️";
      lines.push(`${icon} **${check.name}**: ${check.message}`);
      if (check.details) {
        lines.push(`   详情: ${check.details}`);
      }
    }
    lines.push(``);
  }

  return lines.join("\n");
}

// CLI 入口
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const outputIdx = args.indexOf("--output");
  const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : null;

  const positional = args.filter((a: string) => !a.startsWith("--") && a !== outputFile);
  const codeDir = positional[0];
  const designSpec = positional[1];

  if (!codeDir || !designSpec) {
    console.error("Usage: npx ts-node validate-quality.ts <code-dir> <design-spec> [--output <file>]");
    process.exit(1);
  }

  if (!fs.existsSync(codeDir)) {
    console.error(`Error: Code directory not found: ${codeDir}`);
    process.exit(1);
  }

  const result = validateQuality(codeDir, designSpec);
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

  process.exit(result.summary.failed > 0 ? 1 : 0);
}

export { validateQuality };
export type { QualityResult, QualityCheck };
