#!/usr/bin/env npx ts-node --esm
/**
 * Get Git Status - 获取 Git 仓库状态
 *
 * 用法: npx ts-node get-git-status.ts [--json] [--porcelain]
 *
 * 输出: 解析后的 Git 状态信息
 */

import { execSync } from "child_process";
import { fileURLToPath } from "url";

interface FileStatus {
  status: string;
  path: string;
  type: "modified" | "added" | "deleted" | "renamed" | "copied" | "untracked";
  fileType: string;
  scope: string;
}

interface GitStatus {
  timestamp: string;
  branch: string | null;
  staged: FileStatus[];
  unstaged: FileStatus[];
  untracked: FileStatus[];
  diffStat: {
    filesChanged: number;
    insertions: number;
    deletions: number;
  };
  hasStaged: boolean;
  hasUnstaged: boolean;
  hasUntracked: boolean;
}

// Git 状态码映射
const STATUS_MAP: Record<string, FileStatus["type"]> = {
  M: "modified",
  A: "added",
  D: "deleted",
  R: "renamed",
  C: "copied",
  "??": "untracked",
};

// 文件类型映射
const FILE_TYPE_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  py: "python",
  go: "go",
  rs: "rust",
  md: "markdown",
  mdx: "markdown",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  sh: "shell",
  bash: "shell",
};

function getFileType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  return FILE_TYPE_MAP[ext] || "other";
}

function getScope(path: string): string {
  const parts = path.split("/");
  if (parts.length >= 2) {
    return parts[1]; // 返回第二级目录
  }
  return "root";
}

function parseStatusLine(line: string): FileStatus | null {
  if (!line.trim()) return null;

  const statusCode = line.substring(0, 2).trim();
  const path = line.substring(3).trim();

  // 处理重命名情况 (R100 old -> new)
  const actualPath = path.includes(" -> ") ? path.split(" -> ")[1] : path;

  return {
    status: statusCode,
    path: actualPath,
    type: STATUS_MAP[statusCode] || STATUS_MAP[statusCode[0]] || "modified",
    fileType: getFileType(actualPath),
    scope: getScope(actualPath),
  };
}

function exec(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

function getGitStatus(): GitStatus {
  // 检查是否在 Git 仓库中
  const isGitRepo = exec("git rev-parse --is-inside-work-tree");
  if (isGitRepo !== "true") {
    throw new Error("Not a git repository");
  }

  // 获取当前分支
  const branch = exec("git branch --show-current") || null;

  // 获取文件状态
  const statusOutput = exec("git status --porcelain");
  const lines = statusOutput.split("\n").filter(Boolean);

  const staged: FileStatus[] = [];
  const unstaged: FileStatus[] = [];
  const untracked: FileStatus[] = [];

  for (const line of lines) {
    const indexStatus = line[0];
    const workTreeStatus = line[1];

    const parsed = parseStatusLine(line);
    if (!parsed) continue;

    if (line.startsWith("??")) {
      untracked.push(parsed);
    } else {
      if (indexStatus !== " " && indexStatus !== "?") {
        staged.push({ ...parsed, status: indexStatus });
      }
      if (workTreeStatus !== " " && workTreeStatus !== "?") {
        unstaged.push({ ...parsed, status: workTreeStatus });
      }
    }
  }

  // 获取 diff 统计
  const numstatOutput = exec("git diff --staged --numstat");
  const numstatLines = numstatOutput.split("\n").filter(Boolean);

  let insertions = 0;
  let deletions = 0;

  for (const line of numstatLines) {
    const [ins, del] = line.split("\t");
    if (ins !== "-") insertions += parseInt(ins, 10) || 0;
    if (del !== "-") deletions += parseInt(del, 10) || 0;
  }

  return {
    timestamp: new Date().toISOString(),
    branch,
    staged,
    unstaged,
    untracked,
    diffStat: {
      filesChanged: staged.length,
      insertions,
      deletions,
    },
    hasStaged: staged.length > 0,
    hasUnstaged: unstaged.length > 0,
    hasUntracked: untracked.length > 0,
  };
}

// CLI 入口
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const status = getGitStatus();
    const args = process.argv.slice(2);

    if (args.includes("--json")) {
      console.log(JSON.stringify(status, null, 2));
    } else {
      console.log(`📊 Git Status`);
      console.log(`Branch: ${status.branch || "(no branch)"}`);
      console.log(`Staged: ${status.staged.length} files`);
      console.log(`Unstaged: ${status.unstaged.length} files`);
      console.log(`Untracked: ${status.untracked.length} files`);
      console.log(
        `Changes: +${status.diffStat.insertions}/-${status.diffStat.deletions}`
      );
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

export { getGitStatus };
export type { GitStatus, FileStatus };
