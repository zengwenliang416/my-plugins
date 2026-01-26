#!/usr/bin/env npx ts-node --esm
/**
 * Generate Diff - 生成 Unified Diff 格式的代码原型
 *
 * 用法: npx ts-node generate-diff.ts <analysis-file> [--output <file>]
 *
 * 功能: 基于分析结果生成 diff 格式的代码原型
 */

import * as fs from "fs";
import { fileURLToPath } from "url";

interface DiffHunk {
  originalStart: number;
  originalCount: number;
  newStart: number;
  newCount: number;
  context: string;
  lines: DiffLine[];
}

interface DiffLine {
  type: "context" | "add" | "remove";
  content: string;
}

interface DiffFile {
  originalPath: string;
  newPath: string;
  hunks: DiffHunk[];
}

interface GeneratedDiff {
  timestamp: string;
  model: string;
  task: string;
  files: DiffFile[];
  stats: {
    filesChanged: number;
    insertions: number;
    deletions: number;
  };
}

// 生成 hunk 头
function generateHunkHeader(hunk: DiffHunk): string {
  const context = hunk.context ? ` ${hunk.context}` : "";
  return `@@ -${hunk.originalStart},${hunk.originalCount} +${hunk.newStart},${hunk.newCount} @@${context}`;
}

// 生成文件头
function generateFileHeader(
  originalPath: string,
  newPath: string
): string[] {
  return [
    `--- ${originalPath}`,
    `+++ ${newPath}`,
  ];
}

// 将 DiffFile 转换为 diff 字符串
function diffFileToString(file: DiffFile): string {
  const lines: string[] = [];

  lines.push(...generateFileHeader(file.originalPath, file.newPath));

  for (const hunk of file.hunks) {
    lines.push(generateHunkHeader(hunk));

    for (const line of hunk.lines) {
      switch (line.type) {
        case "context":
          lines.push(` ${line.content}`);
          break;
        case "add":
          lines.push(`+${line.content}`);
          break;
        case "remove":
          lines.push(`-${line.content}`);
          break;
      }
    }
  }

  return lines.join("\n");
}

// 从源文件和修改生成 diff
function generateDiffFromChanges(
  originalPath: string,
  originalContent: string,
  changes: Array<{
    lineNumber: number;
    type: "add" | "remove" | "replace";
    content: string;
    newContent?: string;
  }>
): DiffFile {
  const originalLines = originalContent.split("\n");
  const hunks: DiffHunk[] = [];

  // 按行号排序变更
  const sortedChanges = [...changes].sort((a, b) => a.lineNumber - b.lineNumber);

  // 将相邻变更合并为 hunk
  let currentHunk: DiffHunk | null = null;
  const CONTEXT_LINES = 3;

  for (const change of sortedChanges) {
    const lineIdx = change.lineNumber - 1;

    // 如果当前 hunk 为空或变更离上一个太远，创建新 hunk
    if (!currentHunk || lineIdx > currentHunk.originalStart + currentHunk.originalCount + CONTEXT_LINES * 2) {
      if (currentHunk) {
        hunks.push(currentHunk);
      }

      // 添加前置上下文
      const contextStart = Math.max(0, lineIdx - CONTEXT_LINES);
      const contextLines: DiffLine[] = [];

      for (let i = contextStart; i < lineIdx; i++) {
        contextLines.push({ type: "context", content: originalLines[i] || "" });
      }

      currentHunk = {
        originalStart: contextStart + 1,
        originalCount: lineIdx - contextStart,
        newStart: contextStart + 1,
        newCount: lineIdx - contextStart,
        context: "",
        lines: contextLines,
      };
    }

    // 添加变更
    switch (change.type) {
      case "add":
        currentHunk.lines.push({ type: "add", content: change.content });
        currentHunk.newCount++;
        break;
      case "remove":
        currentHunk.lines.push({ type: "remove", content: originalLines[lineIdx] || "" });
        currentHunk.originalCount++;
        break;
      case "replace":
        currentHunk.lines.push({ type: "remove", content: originalLines[lineIdx] || "" });
        currentHunk.lines.push({ type: "add", content: change.newContent || change.content });
        currentHunk.originalCount++;
        currentHunk.newCount++;
        break;
    }
  }

  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return {
    originalPath: `a/${originalPath}`,
    newPath: `b/${originalPath}`,
    hunks,
  };
}

// 生成新文件 diff
function generateNewFileDiff(path: string, content: string): DiffFile {
  const lines = content.split("\n");

  return {
    originalPath: "/dev/null",
    newPath: `b/${path}`,
    hunks: [
      {
        originalStart: 0,
        originalCount: 0,
        newStart: 1,
        newCount: lines.length,
        context: "",
        lines: lines.map((line) => ({ type: "add" as const, content: line })),
      },
    ],
  };
}

// 生成删除文件 diff
function generateDeleteFileDiff(path: string, content: string): DiffFile {
  const lines = content.split("\n");

  return {
    originalPath: `a/${path}`,
    newPath: "/dev/null",
    hunks: [
      {
        originalStart: 1,
        originalCount: lines.length,
        newStart: 0,
        newCount: 0,
        context: "",
        lines: lines.map((line) => ({ type: "remove" as const, content: line })),
      },
    ],
  };
}

// 计算 diff 统计
function calculateStats(files: DiffFile[]): GeneratedDiff["stats"] {
  let insertions = 0;
  let deletions = 0;

  for (const file of files) {
    for (const hunk of file.hunks) {
      for (const line of hunk.lines) {
        if (line.type === "add") insertions++;
        if (line.type === "remove") deletions++;
      }
    }
  }

  return {
    filesChanged: files.length,
    insertions,
    deletions,
  };
}

// 验证 diff 格式
function validateDiff(diffString: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const lines = diffString.split("\n");

  let inFile = false;
  let inHunk = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    if (line.startsWith("---")) {
      if (!line.startsWith("--- a/") && !line.startsWith("--- /dev/null")) {
        errors.push(`Line ${lineNum}: Invalid --- header, should start with 'a/' or be '/dev/null'`);
      }
      inFile = true;
    } else if (line.startsWith("+++")) {
      if (!line.startsWith("+++ b/") && !line.startsWith("+++ /dev/null")) {
        errors.push(`Line ${lineNum}: Invalid +++ header, should start with 'b/' or be '/dev/null'`);
      }
    } else if (line.startsWith("@@")) {
      const match = line.match(/^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
      if (!match) {
        errors.push(`Line ${lineNum}: Invalid hunk header format`);
      }
      inHunk = true;
    } else if (inHunk) {
      if (!line.startsWith(" ") && !line.startsWith("+") && !line.startsWith("-") && line !== "") {
        errors.push(`Line ${lineNum}: Invalid line prefix, must be ' ', '+', '-', or empty`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// 格式化输出
function formatDiff(diff: GeneratedDiff): string {
  const header = [
    `# Prototype generated by ${diff.model}`,
    `# Task: ${diff.task}`,
    `# Generated at: ${diff.timestamp}`,
    "",
  ].join("\n");

  const body = diff.files.map(diffFileToString).join("\n\n");

  return header + body;
}

// CLI 入口
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const outputIdx = args.indexOf("--output");
  const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : null;
  const analysisFile = args.filter((a) => !a.startsWith("--") && a !== outputFile)[0];

  if (!analysisFile) {
    console.error("Usage: npx ts-node generate-diff.ts <analysis-file> [--output <file>]");
    process.exit(1);
  }

  // 示例：从分析文件生成 diff
  // 实际使用中，这会调用外部模型生成代码

  const exampleDiff: GeneratedDiff = {
    timestamp: new Date().toISOString(),
    model: "example",
    task: "Example task",
    files: [
      generateNewFileDiff("src/example.ts", [
        "// Example file",
        "export function example() {",
        "  return 'hello';",
        "}",
      ].join("\n")),
    ],
    stats: { filesChanged: 1, insertions: 4, deletions: 0 },
  };

  const formatted = formatDiff(exampleDiff);

  // 验证
  const validation = validateDiff(formatted);
  if (!validation.valid) {
    console.error("Validation errors:");
    validation.errors.forEach((e) => console.error(`  ${e}`));
  }

  if (outputFile) {
    fs.writeFileSync(outputFile, formatted);
    console.log(`✅ Diff written to ${outputFile}`);
  } else {
    console.log(formatted);
  }

  console.log(`\n📊 Stats: +${exampleDiff.stats.insertions}/-${exampleDiff.stats.deletions} in ${exampleDiff.stats.filesChanged} file(s)`);
}

export {
  generateDiffFromChanges,
  generateNewFileDiff,
  generateDeleteFileDiff,
  validateDiff,
};
export type { DiffFile, DiffHunk, GeneratedDiff };
