#!/usr/bin/env npx ts-node --esm
/**
 * Analyze Changes - 分析变更类型和作用域
 *
 * 用法: npx tsx analyze-changes.ts <changes-raw.json>
 *
 * 输出: 变更分析结果 JSON
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

interface FileChange {
  status: string;
  path: string;
  type: string;
  fileType: string;
  scope: string;
}

interface RawChanges {
  staged: FileChange[];
  unstaged: FileChange[];
  untracked: FileChange[];
  diffStat: {
    filesChanged: number;
    insertions: number;
    deletions: number;
  };
}

interface AnalysisResult {
  timestamp: string;
  analyzedFiles: number;
  primaryType: string;
  primaryScope: string;
  scopes: string[];
  complexity: "low" | "medium" | "high";
  shouldSplit: boolean;
  splitRecommendation: SplitRecommendation | null;
  commitStrategy: {
    suggestedType: string;
    suggestedScope: string;
    confidence: "high" | "medium" | "low";
    reason: string;
  };
  filesByType: Record<string, FileChange[]>;
}

interface SplitRecommendation {
  reason: string;
  commits: Array<{
    type: string;
    scope: string;
    files: string[];
    description: string;
    priority: number;
  }>;
}

// 类型推断规则
const TYPE_INFERENCE_RULES: Array<{
  pattern: RegExp;
  type: string;
  priority: number;
}> = [
  { pattern: /^docs?\/|\.md$/i, type: "docs", priority: 1 },
  { pattern: /\.test\.|\.spec\.|__tests__/i, type: "test", priority: 2 },
  { pattern: /package\.json|yarn\.lock|pnpm-lock/i, type: "chore", priority: 3 },
  { pattern: /\.config\.|tsconfig|eslint|prettier/i, type: "chore", priority: 3 },
  { pattern: /\.github\/|\.gitlab\//i, type: "ci", priority: 4 },
  { pattern: /fix|bug|patch|hotfix/i, type: "fix", priority: 5 },
];

function inferType(file: FileChange): string {
  // 根据变更类型推断
  if (file.type === "added") return "feat";
  if (file.type === "deleted") return "refactor";

  // 根据路径规则推断
  for (const rule of TYPE_INFERENCE_RULES) {
    if (rule.pattern.test(file.path)) {
      return rule.type;
    }
  }

  // 默认为 feat（修改代码通常是功能相关）
  return "feat";
}

function inferScope(files: FileChange[]): string {
  const scopeCounts: Record<string, number> = {};

  for (const file of files) {
    const scope = file.scope || "root";
    scopeCounts[scope] = (scopeCounts[scope] || 0) + 1;
  }

  // 返回出现最多的 scope
  const sorted = Object.entries(scopeCounts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || "root";
}

function evaluateComplexity(
  fileCount: number,
  insertions: number,
  deletions: number
): "low" | "medium" | "high" {
  const totalChanges = insertions + deletions;

  if (fileCount <= 3 && totalChanges <= 50) return "low";
  if (fileCount <= 10 && totalChanges <= 300) return "medium";
  return "high";
}

function shouldSplitCommit(
  files: FileChange[],
  types: string[],
  scopes: string[],
  totalChanges: number
): { shouldSplit: boolean; reason: string | null } {
  // 多作用域
  if (scopes.length >= 2) {
    return { shouldSplit: true, reason: `涉及 ${scopes.length} 个不同作用域` };
  }

  // 混合类型（feat + fix 除外）
  const uniqueTypes = [...new Set(types)];
  if (uniqueTypes.length > 2) {
    return { shouldSplit: true, reason: `混合 ${uniqueTypes.length} 种变更类型` };
  }

  // 大变更
  if (files.length > 10) {
    return { shouldSplit: true, reason: `文件数过多 (${files.length} 个)` };
  }
  if (totalChanges > 300) {
    return { shouldSplit: true, reason: `变更行数过多 (${totalChanges} 行)` };
  }

  return { shouldSplit: false, reason: null };
}

function generateSplitRecommendation(
  files: FileChange[]
): SplitRecommendation | null {
  const groups: Record<string, FileChange[]> = {};

  for (const file of files) {
    const type = inferType(file);
    const key = `${type}:${file.scope}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(file);
  }

  if (Object.keys(groups).length <= 1) return null;

  const commits = Object.entries(groups).map(([key, groupFiles], idx) => {
    const [type, scope] = key.split(":");
    return {
      type,
      scope,
      files: groupFiles.map((f) => f.path),
      description: `${type}(${scope}): ${groupFiles.length} 个文件`,
      priority: idx + 1,
    };
  });

  return {
    reason: `包含 ${commits.length} 个独立功能模块，建议拆分`,
    commits,
  };
}

function analyzeChanges(rawChanges: RawChanges): AnalysisResult {
  const files = rawChanges.staged.length > 0
    ? rawChanges.staged
    : [...rawChanges.unstaged, ...rawChanges.untracked];

  const types = files.map(inferType);
  const scopes = [...new Set(files.map((f) => f.scope))];

  // 计算主要类型（出现最多的）
  const typeCounts: Record<string, number> = {};
  for (const type of types) {
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }
  const primaryType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "chore";

  const primaryScope = inferScope(files);
  const totalChanges = rawChanges.diffStat.insertions + rawChanges.diffStat.deletions;
  const complexity = evaluateComplexity(
    files.length,
    rawChanges.diffStat.insertions,
    rawChanges.diffStat.deletions
  );

  const splitResult = shouldSplitCommit(files, types, scopes, totalChanges);

  // 按类型分组文件
  const filesByType: Record<string, FileChange[]> = {};
  for (let i = 0; i < files.length; i++) {
    const type = types[i];
    if (!filesByType[type]) filesByType[type] = [];
    filesByType[type].push(files[i]);
  }

  // 评估置信度
  let confidence: "high" | "medium" | "low" = "high";
  if (scopes.length > 1) confidence = "medium";
  if (complexity === "high" || scopes.length > 2) confidence = "low";

  return {
    timestamp: new Date().toISOString(),
    analyzedFiles: files.length,
    primaryType,
    primaryScope,
    scopes,
    complexity,
    shouldSplit: splitResult.shouldSplit,
    splitRecommendation: splitResult.shouldSplit
      ? generateSplitRecommendation(files)
      : null,
    commitStrategy: {
      suggestedType: primaryType,
      suggestedScope: primaryScope,
      confidence,
      reason: splitResult.reason || `${files.length} 个文件，语义一致`,
    },
    filesByType,
  };
}

// CLI 入口
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const inputFile = args[0];

  if (!inputFile) {
    console.error("Usage: npx tsx analyze-changes.ts <changes-raw.json>");
    process.exit(1);
  }

  try {
    const rawContent = fs.readFileSync(inputFile, "utf-8");
    const rawChanges: RawChanges = JSON.parse(rawContent);
    const analysis = analyzeChanges(rawChanges);

    console.log(JSON.stringify(analysis, null, 2));
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

export { analyzeChanges };
export type { AnalysisResult };
