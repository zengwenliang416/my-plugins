#!/usr/bin/env npx ts-node --esm
/**
 * Safe Commit - 安全执行 Git 提交
 *
 * 用法: npx ts-node safe-commit.ts <message> [--skip-hooks] [--dry-run]
 *
 * 功能: 验证消息格式，检查 pre-commit hook，执行提交
 */

import { execSync, spawnSync } from "child_process";
import { fileURLToPath } from "url";

interface CommitResult {
  success: boolean;
  commitHash: string | null;
  message: string;
  errors: string[];
  warnings: string[];
}

interface SafetyCheck {
  name: string;
  passed: boolean;
  message: string;
}

// 安全检查规则
const SAFETY_CHECKS = {
  // 禁止的命令模式
  FORBIDDEN_PATTERNS: [
    /--force\s+.*main/i,
    /--force\s+.*master/i,
    /push.*--force/i,
    /reset\s+--hard/i,
  ],

  // 敏感文件检查
  SENSITIVE_FILES: [
    /\.env$/,
    /\.env\.\w+$/,
    /credentials/i,
    /secrets?/i,
    /\.pem$/,
    /\.key$/,
  ],

  // 最大提交消息长度
  MAX_HEADER_LENGTH: 72,
};

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

function runSafetyChecks(message: string): SafetyCheck[] {
  const checks: SafetyCheck[] = [];

  // 1. 检查消息长度
  const headerLength = message.split("\n")[0].length;
  checks.push({
    name: "消息长度",
    passed: headerLength <= SAFETY_CHECKS.MAX_HEADER_LENGTH,
    message:
      headerLength <= SAFETY_CHECKS.MAX_HEADER_LENGTH
        ? `✓ 头部 ${headerLength} 字符`
        : `✗ 头部 ${headerLength} 字符 (超过 ${SAFETY_CHECKS.MAX_HEADER_LENGTH})`,
  });

  // 2. 检查暂存区是否有敏感文件
  const stagedFiles = exec("git diff --staged --name-only").stdout.split("\n");
  const sensitiveFiles = stagedFiles.filter((f) =>
    SAFETY_CHECKS.SENSITIVE_FILES.some((pattern) => pattern.test(f))
  );

  checks.push({
    name: "敏感文件",
    passed: sensitiveFiles.length === 0,
    message:
      sensitiveFiles.length === 0
        ? "✓ 未检测到敏感文件"
        : `✗ 检测到敏感文件: ${sensitiveFiles.join(", ")}`,
  });

  // 3. 检查是否有未解决的合并冲突
  const conflictMarkers = exec(
    'git diff --staged --check 2>&1 || true'
  ).stdout;
  const hasConflicts =
    conflictMarkers.includes("conflict") ||
    conflictMarkers.includes("<<<<<<<");

  checks.push({
    name: "合并冲突",
    passed: !hasConflicts,
    message: hasConflicts ? "✗ 存在未解决的合并冲突" : "✓ 无合并冲突",
  });

  // 4. 检查是否在正确的分支
  const currentBranch = exec("git branch --show-current").stdout;
  const isProtectedBranch = ["main", "master", "production"].includes(
    currentBranch
  );

  checks.push({
    name: "分支保护",
    passed: !isProtectedBranch,
    message: isProtectedBranch
      ? `⚠️ 当前在保护分支: ${currentBranch}`
      : `✓ 当前分支: ${currentBranch}`,
  });

  return checks;
}

function runPreCommitHook(): { success: boolean; output: string } {
  const hookPath = ".git/hooks/pre-commit";
  const result = exec(`test -x ${hookPath} && ${hookPath}`);

  if (result.code === 0) {
    return { success: true, output: result.stdout };
  }

  // 如果 hook 不存在，视为成功
  if (result.stderr.includes("not found") || result.code === 127) {
    return { success: true, output: "No pre-commit hook found" };
  }

  return { success: false, output: result.stderr || result.stdout };
}

function executeCommit(
  message: string,
  skipHooks: boolean,
  dryRun: boolean
): CommitResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 运行安全检查
  const checks = runSafetyChecks(message);
  const failedChecks = checks.filter((c) => !c.passed);

  for (const check of failedChecks) {
    if (check.name === "分支保护") {
      warnings.push(check.message);
    } else {
      errors.push(check.message);
    }
  }

  // 如果有严重错误，停止
  if (errors.length > 0) {
    return {
      success: false,
      commitHash: null,
      message,
      errors,
      warnings,
    };
  }

  // 运行 pre-commit hook（除非跳过）
  if (!skipHooks) {
    const hookResult = runPreCommitHook();
    if (!hookResult.success) {
      return {
        success: false,
        commitHash: null,
        message,
        errors: [`Pre-commit hook failed: ${hookResult.output}`],
        warnings,
      };
    }
  }

  // Dry run 模式
  if (dryRun) {
    return {
      success: true,
      commitHash: "(dry-run)",
      message,
      errors: [],
      warnings: [...warnings, "Dry run mode - no commit created"],
    };
  }

  // 执行提交
  const commitCmd = skipHooks
    ? `git commit --no-verify -m "${message.replace(/"/g, '\\"')}"`
    : `git commit -m "${message.replace(/"/g, '\\"')}"`;

  const result = exec(commitCmd);

  if (result.code !== 0) {
    return {
      success: false,
      commitHash: null,
      message,
      errors: [result.stderr || "Commit failed"],
      warnings,
    };
  }

  // 获取提交 hash
  const hash = exec("git rev-parse --short HEAD").stdout;

  return {
    success: true,
    commitHash: hash,
    message,
    errors: [],
    warnings,
  };
}

function formatResult(result: CommitResult): string {
  const lines: string[] = [];

  if (result.success) {
    lines.push(`✅ 提交成功`);
    lines.push(`   Hash: ${result.commitHash}`);
  } else {
    lines.push(`❌ 提交失败`);
  }

  lines.push(`   Message: ${result.message.split("\n")[0]}`);

  if (result.errors.length > 0) {
    lines.push("");
    lines.push("错误:");
    for (const error of result.errors) {
      lines.push(`   ${error}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push("");
    lines.push("警告:");
    for (const warning of result.warnings) {
      lines.push(`   ${warning}`);
    }
  }

  return lines.join("\n");
}

// CLI 入口
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const skipHooks = args.includes("--skip-hooks");
  const dryRun = args.includes("--dry-run");
  const message = args.filter((a) => !a.startsWith("--")).join(" ");

  if (!message) {
    console.error("Usage: npx ts-node safe-commit.ts <message> [--skip-hooks] [--dry-run]");
    console.error('Example: npx ts-node safe-commit.ts "feat(auth): add login"');
    process.exit(1);
  }

  const result = executeCommit(message, skipHooks, dryRun);
  console.log(formatResult(result));

  if (args.includes("--json")) {
    console.log("\n📦 JSON:");
    console.log(JSON.stringify(result, null, 2));
  }

  process.exit(result.success ? 0 : 1);
}

export { executeCommit, runSafetyChecks };
export type { CommitResult, SafetyCheck };
