#!/usr/bin/env npx ts-node --esm
/**
 * Apply Diff - 应用 Unified Diff 到代码库
 *
 * 用法: npx ts-node apply-diff.ts <diff-file> [--dry-run] [--refactor]
 *
 * 功能: 验证并应用 diff，可选择重构优化
 */

import * as fs from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

interface ApplyResult {
  success: boolean;
  filesModified: string[];
  errors: string[];
  warnings: string[];
  refactorSuggestions: RefactorSuggestion[];
}

interface RefactorSuggestion {
  file: string;
  line: number;
  type: string;
  original: string;
  suggested: string;
  reason: string;
}

// 执行 shell 命令
function exec(cmd: string): { stdout: string; stderr: string; code: number } {
  try {
    const stdout = execSync(cmd, { encoding: "utf-8" }).trim();
    return { stdout, stderr: "", code: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout?.toString() || "",
      stderr: error.stderr?.toString() || "",
      code: error.status || 1,
    };
  }
}

// 检查 diff 是否可以应用
function checkDiff(diffFile: string): { canApply: boolean; errors: string[] } {
  const result = exec(`git apply --check "${diffFile}" 2>&1`);

  if (result.code === 0) {
    return { canApply: true, errors: [] };
  }

  const errors = result.stderr
    .split("\n")
    .filter((line) => line.includes("error:") || line.includes("patch"));

  return { canApply: false, errors };
}

// 应用 diff
function applyDiff(
  diffFile: string,
  options: { dryRun?: boolean; threeWay?: boolean } = {}
): { success: boolean; output: string } {
  const flags: string[] = [];

  if (options.dryRun) {
    flags.push("--stat");
  }

  if (options.threeWay) {
    flags.push("--3way");
  }

  const cmd = `git apply ${flags.join(" ")} "${diffFile}" 2>&1`;
  const result = exec(cmd);

  return {
    success: result.code === 0,
    output: result.stdout || result.stderr,
  };
}

// 获取 diff 中的文件列表
function getFilesFromDiff(diffFile: string): string[] {
  const content = fs.readFileSync(diffFile, "utf-8");
  const files: string[] = [];

  const regex = /^\+\+\+ b\/(.+)$/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match[1] !== "/dev/null") {
      files.push(match[1]);
    }
  }

  return files;
}

// 分析代码质量问题
function analyzeCodeQuality(file: string): RefactorSuggestion[] {
  const suggestions: RefactorSuggestion[] = [];

  if (!fs.existsSync(file)) return suggestions;

  const content = fs.readFileSync(file, "utf-8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // 检查：过长的行
    if (line.length > 120) {
      suggestions.push({
        file,
        line: lineNum,
        type: "line-length",
        original: line.substring(0, 50) + "...",
        suggested: "拆分为多行",
        reason: `行长度 ${line.length} 超过 120 字符`,
      });
    }

    // 检查：console.log
    if (line.includes("console.log") && !file.includes("test")) {
      suggestions.push({
        file,
        line: lineNum,
        type: "debug-statement",
        original: line.trim(),
        suggested: "移除或替换为日志工具",
        reason: "生产代码不应包含 console.log",
      });
    }

    // 检查：TODO 注释
    if (line.includes("TODO") || line.includes("FIXME")) {
      suggestions.push({
        file,
        line: lineNum,
        type: "todo-comment",
        original: line.trim(),
        suggested: "处理或创建 issue 跟踪",
        reason: "TODO/FIXME 注释应该被跟踪",
      });
    }

    // 检查：any 类型
    if (line.includes(": any") || line.includes("<any>")) {
      suggestions.push({
        file,
        line: lineNum,
        type: "any-type",
        original: line.trim(),
        suggested: "使用具体类型",
        reason: "避免使用 any 类型",
      });
    }

    // 检查：魔法数字
    const magicNumber = line.match(/[^a-zA-Z](\d{2,})[^a-zA-Z\d]/);
    if (
      magicNumber &&
      !line.includes("const") &&
      !line.includes("//") &&
      !line.includes("port") &&
      !line.includes("timeout")
    ) {
      suggestions.push({
        file,
        line: lineNum,
        type: "magic-number",
        original: line.trim(),
        suggested: `提取为命名常量: const SOME_NAME = ${magicNumber[1]}`,
        reason: "避免魔法数字",
      });
    }
  }

  return suggestions;
}

// 运行 lint 检查
function runLintCheck(files: string[]): string[] {
  const warnings: string[] = [];

  for (const file of files) {
    if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      const result = exec(`npx eslint "${file}" --format compact 2>&1`);
      if (result.code !== 0 && result.stdout) {
        warnings.push(`ESLint warnings in ${file}:\n${result.stdout}`);
      }
    }
  }

  return warnings;
}

// 主函数
function applyAndRefactor(
  diffFile: string,
  options: { dryRun?: boolean; refactor?: boolean } = {}
): ApplyResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const refactorSuggestions: RefactorSuggestion[] = [];

  // 1. 检查 diff 是否可应用
  const checkResult = checkDiff(diffFile);
  if (!checkResult.canApply) {
    return {
      success: false,
      filesModified: [],
      errors: checkResult.errors,
      warnings: [],
      refactorSuggestions: [],
    };
  }

  // 2. 获取文件列表
  const files = getFilesFromDiff(diffFile);

  // 3. 应用 diff
  if (!options.dryRun) {
    const applyResult = applyDiff(diffFile);
    if (!applyResult.success) {
      return {
        success: false,
        filesModified: [],
        errors: [`Failed to apply diff: ${applyResult.output}`],
        warnings: [],
        refactorSuggestions: [],
      };
    }
  }

  // 4. 代码质量分析
  if (options.refactor) {
    for (const file of files) {
      const suggestions = analyzeCodeQuality(file);
      refactorSuggestions.push(...suggestions);
    }
  }

  // 5. Lint 检查
  const lintWarnings = runLintCheck(files);
  warnings.push(...lintWarnings);

  return {
    success: true,
    filesModified: files,
    errors,
    warnings,
    refactorSuggestions,
  };
}

// 格式化结果
function formatResult(result: ApplyResult): string {
  const lines: string[] = [];

  if (result.success) {
    lines.push("✅ Diff 应用成功");
  } else {
    lines.push("❌ Diff 应用失败");
  }

  lines.push("");
  lines.push(`📁 修改文件 (${result.filesModified.length}):`);
  for (const file of result.filesModified) {
    lines.push(`   - ${file}`);
  }

  if (result.errors.length > 0) {
    lines.push("");
    lines.push("❌ 错误:");
    for (const error of result.errors) {
      lines.push(`   ${error}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push("");
    lines.push("⚠️ 警告:");
    for (const warning of result.warnings) {
      lines.push(`   ${warning}`);
    }
  }

  if (result.refactorSuggestions.length > 0) {
    lines.push("");
    lines.push(`🔧 重构建议 (${result.refactorSuggestions.length}):`);
    for (const suggestion of result.refactorSuggestions) {
      lines.push(`   ${suggestion.file}:${suggestion.line} [${suggestion.type}]`);
      lines.push(`      原始: ${suggestion.original}`);
      lines.push(`      建议: ${suggestion.suggested}`);
      lines.push(`      原因: ${suggestion.reason}`);
    }
  }

  return lines.join("\n");
}

// CLI 入口
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const refactor = args.includes("--refactor");
  const diffFile = args.filter((a) => !a.startsWith("--"))[0];

  if (!diffFile) {
    console.error("Usage: npx ts-node apply-diff.ts <diff-file> [--dry-run] [--refactor]");
    process.exit(1);
  }

  if (!fs.existsSync(diffFile)) {
    console.error(`Error: File not found: ${diffFile}`);
    process.exit(1);
  }

  const result = applyAndRefactor(diffFile, { dryRun, refactor });
  console.log(formatResult(result));

  if (args.includes("--json")) {
    console.log("\n📦 JSON:");
    console.log(JSON.stringify(result, null, 2));
  }

  process.exit(result.success ? 0 : 1);
}

export { applyAndRefactor, checkDiff, analyzeCodeQuality };
export type { ApplyResult, RefactorSuggestion };
