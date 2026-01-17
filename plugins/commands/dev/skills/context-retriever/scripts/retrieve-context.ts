#!/usr/bin/env npx ts-node --esm
/**
 * Retrieve Context - 检索代码上下文
 *
 * 用法: npx ts-node retrieve-context.ts <query> [--output <file>]
 *
 * 功能: 从代码库检索相关上下文
 */

import * as fs from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

interface RetrievalResult {
  timestamp: string;
  query: string;
  internalContext: InternalContext[];
  externalContext: ExternalContext[];
  tokenEstimate: number;
}

interface InternalContext {
  source: string;
  type: "file" | "symbol" | "snippet";
  path: string;
  content: string;
  relevance: number;
}

interface ExternalContext {
  source: string;
  url: string;
  title: string;
  snippet: string;
  relevance: number;
}

// Token 估算（粗略：4 字符 ≈ 1 token）
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// 执行 shell 命令
function exec(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }).trim();
  } catch {
    return "";
  }
}

// 使用 grep 搜索代码
function grepSearch(
  query: string,
  options: { type?: string; maxResults?: number } = {}
): InternalContext[] {
  const { type = "", maxResults = 10 } = options;

  // 构建 grep 命令
  let cmd = `grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" "${query}" . 2>/dev/null | head -${maxResults}`;

  if (type) {
    cmd = `grep -rn --include="*.${type}" "${query}" . 2>/dev/null | head -${maxResults}`;
  }

  const output = exec(cmd);
  if (!output) return [];

  const results: InternalContext[] = [];
  const lines = output.split("\n");

  for (const line of lines) {
    const match = line.match(/^(.+?):(\d+):(.*)$/);
    if (match) {
      const [, path, lineNum, content] = match;
      results.push({
        source: "grep",
        type: "snippet",
        path: path.replace(/^\.\//, ""),
        content: `Line ${lineNum}: ${content.trim()}`,
        relevance: 0.8,
      });
    }
  }

  return results;
}

// 使用 glob 搜索文件
function globSearch(pattern: string): InternalContext[] {
  const cmd = `find . -type f -name "${pattern}" 2>/dev/null | head -20`;
  const output = exec(cmd);

  if (!output) return [];

  return output.split("\n").map((path) => ({
    source: "glob",
    type: "file" as const,
    path: path.replace(/^\.\//, ""),
    content: `File: ${path}`,
    relevance: 0.7,
  }));
}

// 从文件读取符号（简化版，实际应使用 LSP）
function extractSymbols(filePath: string): InternalContext[] {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const symbols: InternalContext[] = [];

    // 匹配函数定义
    const funcPattern = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g;
    let match;
    while ((match = funcPattern.exec(content)) !== null) {
      symbols.push({
        source: "symbols",
        type: "symbol",
        path: filePath,
        content: `function ${match[1]}`,
        relevance: 0.9,
      });
    }

    // 匹配类定义
    const classPattern = /(?:export\s+)?class\s+(\w+)/g;
    while ((match = classPattern.exec(content)) !== null) {
      symbols.push({
        source: "symbols",
        type: "symbol",
        path: filePath,
        content: `class ${match[1]}`,
        relevance: 0.9,
      });
    }

    // 匹配接口定义
    const interfacePattern = /(?:export\s+)?interface\s+(\w+)/g;
    while ((match = interfacePattern.exec(content)) !== null) {
      symbols.push({
        source: "symbols",
        type: "symbol",
        path: filePath,
        content: `interface ${match[1]}`,
        relevance: 0.85,
      });
    }

    return symbols;
  } catch {
    return [];
  }
}

// 主检索函数
function retrieveContext(
  query: string,
  options: { maxTokens?: number } = {}
): RetrievalResult {
  const { maxTokens = 8000 } = options;
  const internalContext: InternalContext[] = [];
  const externalContext: ExternalContext[] = [];

  // 1. Grep 搜索
  const grepResults = grepSearch(query);
  internalContext.push(...grepResults);

  // 2. 如果 query 看起来像文件模式，进行 glob 搜索
  if (query.includes("*") || query.includes(".")) {
    const globResults = globSearch(query);
    internalContext.push(...globResults);
  }

  // 3. 从高相关性文件提取符号
  const relevantFiles = internalContext
    .filter((c) => c.type === "snippet")
    .slice(0, 3)
    .map((c) => c.path);

  for (const file of relevantFiles) {
    const symbols = extractSymbols(file);
    internalContext.push(...symbols);
  }

  // 4. 去重并按相关性排序
  const uniqueContext = Array.from(
    new Map(
      internalContext.map((c) => [`${c.path}:${c.content}`, c])
    ).values()
  ).sort((a, b) => b.relevance - a.relevance);

  // 5. 截断到 token 限制
  let totalTokens = 0;
  const finalContext: InternalContext[] = [];

  for (const ctx of uniqueContext) {
    const tokens = estimateTokens(ctx.content);
    if (totalTokens + tokens > maxTokens) break;
    finalContext.push(ctx);
    totalTokens += tokens;
  }

  return {
    timestamp: new Date().toISOString(),
    query,
    internalContext: finalContext,
    externalContext, // 外部检索需要 exa/WebSearch
    tokenEstimate: totalTokens,
  };
}

// 格式化输出
function formatResult(result: RetrievalResult): string {
  const lines: string[] = [];

  lines.push(`📚 Context Retrieval Result`);
  lines.push(`Query: ${result.query}`);
  lines.push(`Timestamp: ${result.timestamp}`);
  lines.push(`Token Estimate: ~${result.tokenEstimate}`);
  lines.push("");

  lines.push(`## Internal Context (${result.internalContext.length} items)`);
  lines.push("");

  for (const ctx of result.internalContext) {
    lines.push(`### [${ctx.type}] ${ctx.path}`);
    lines.push(`Relevance: ${ctx.relevance}`);
    lines.push(`\`\`\``);
    lines.push(ctx.content);
    lines.push(`\`\`\``);
    lines.push("");
  }

  if (result.externalContext.length > 0) {
    lines.push(`## External Context (${result.externalContext.length} items)`);
    lines.push("");
    for (const ctx of result.externalContext) {
      lines.push(`### ${ctx.title}`);
      lines.push(`URL: ${ctx.url}`);
      lines.push(`${ctx.snippet}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

// CLI 入口
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const outputIdx = args.indexOf("--output");
  const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : null;

  const query = args.filter((a) => !a.startsWith("--") && a !== outputFile).join(" ");

  if (!query) {
    console.error("Usage: npx ts-node retrieve-context.ts <query> [--output <file>]");
    console.error('Example: npx ts-node retrieve-context.ts "authentication"');
    process.exit(1);
  }

  const result = retrieveContext(query);
  const formatted = formatResult(result);

  if (outputFile) {
    fs.writeFileSync(outputFile, formatted);
    console.log(`✅ Context written to ${outputFile}`);
  } else {
    console.log(formatted);
  }

  if (args.includes("--json")) {
    console.log("\n📦 JSON:");
    console.log(JSON.stringify(result, null, 2));
  }
}

export { retrieveContext };
export type { RetrievalResult, InternalContext, ExternalContext };
