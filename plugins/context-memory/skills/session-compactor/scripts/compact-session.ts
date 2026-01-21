#!/usr/bin/env bun
/**
 * Session Compactor Script
 * Compresses session history while preserving key information
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";

interface SessionMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

interface CompactionResult {
  original_tokens: number;
  compressed_tokens: number;
  ratio: number;
  summary: string;
  decisions: string[];
  code_changes: string[];
  learnings: string[];
}

interface CompactionConfig {
  strategy: "aggressive" | "balanced" | "conservative";
  keep_decisions: boolean;
  keep_code_changes: boolean;
  keep_errors: boolean;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function extractDecisions(messages: SessionMessage[]): string[] {
  const decisions: string[] = [];
  const decisionPatterns = [
    /决定|选择|采用|使用|方案/,
    /decide|choose|select|use|approach/i,
  ];

  for (const msg of messages) {
    if (msg.role === "assistant") {
      const lines = msg.content.split("\n");
      for (const line of lines) {
        if (decisionPatterns.some((p) => p.test(line))) {
          decisions.push(line.trim());
        }
      }
    }
  }

  return [...new Set(decisions)].slice(0, 10);
}

function extractCodeChanges(messages: SessionMessage[]): string[] {
  const changes: string[] = [];
  const filePatterns = [
    /(?:修改|创建|删除|新增).*?(\S+\.\w+)/g,
    /(?:Edit|Write|Create|Delete).*?(\S+\.\w+)/gi,
  ];

  for (const msg of messages) {
    if (msg.role === "assistant") {
      for (const pattern of filePatterns) {
        let match;
        while ((match = pattern.exec(msg.content)) !== null) {
          changes.push(match[0]);
        }
      }
    }
  }

  return [...new Set(changes)];
}

function extractLearnings(messages: SessionMessage[]): string[] {
  const learnings: string[] = [];
  const learningPatterns = [
    /项目.*?(偏好|惯例|规范|风格)/,
    /注意|记住|重要|必须/,
    /project.*?(prefer|convention|style)/i,
  ];

  for (const msg of messages) {
    if (msg.role === "assistant") {
      const lines = msg.content.split("\n");
      for (const line of lines) {
        if (learningPatterns.some((p) => p.test(line))) {
          learnings.push(line.trim());
        }
      }
    }
  }

  return [...new Set(learnings)].slice(0, 5);
}

function generateSummary(
  messages: SessionMessage[],
  decisions: string[],
  codeChanges: string[],
  learnings: string[],
): string {
  const userRequests = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content.slice(0, 200))
    .slice(0, 3);

  return `# Session Summary

**Generated**: ${new Date().toISOString()}

## User Requests

${userRequests.map((r, i) => `${i + 1}. ${r}`).join("\n")}

## Key Decisions

${decisions.map((d) => `- ${d}`).join("\n") || "- No explicit decisions recorded"}

## Code Changes

${codeChanges.map((c) => `- ${c}`).join("\n") || "- No code changes recorded"}

## Project Learnings

${learnings.map((l) => `- ${l}`).join("\n") || "- No specific learnings recorded"}
`;
}

async function compactSession(
  inputPath: string,
  outputPath: string,
  config: CompactionConfig,
): Promise<CompactionResult> {
  const content = await readFile(inputPath, "utf-8");
  const messages: SessionMessage[] = JSON.parse(content);

  const originalTokens = estimateTokens(JSON.stringify(messages));

  const decisions = config.keep_decisions ? extractDecisions(messages) : [];
  const codeChanges = config.keep_code_changes
    ? extractCodeChanges(messages)
    : [];
  const learnings = extractLearnings(messages);

  const summary = generateSummary(messages, decisions, codeChanges, learnings);
  const compressedTokens = estimateTokens(summary);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, summary, "utf-8");

  return {
    original_tokens: originalTokens,
    compressed_tokens: compressedTokens,
    ratio: compressedTokens / originalTokens,
    summary,
    decisions,
    code_changes: codeChanges,
    learnings,
  };
}

// Main
const inputPath = process.argv[2];
const outputPath = process.argv[3] || ".claude/memory/sessions/latest.md";
const strategy = (process.argv[4] ||
  "balanced") as CompactionConfig["strategy"];

if (!inputPath) {
  console.error(
    "Usage: compact-session.ts <input.json> [output.md] [strategy]",
  );
  process.exit(1);
}

const config: CompactionConfig = {
  strategy,
  keep_decisions: true,
  keep_code_changes: true,
  keep_errors: true,
};

compactSession(inputPath, outputPath, config)
  .then((result) => {
    console.log("Compaction complete:");
    console.log(`  Original: ${result.original_tokens} tokens`);
    console.log(`  Compressed: ${result.compressed_tokens} tokens`);
    console.log(`  Ratio: ${(result.ratio * 100).toFixed(1)}%`);
    console.log(`  Output: ${outputPath}`);
  })
  .catch((err) => {
    console.error("Compaction failed:", err);
    process.exit(1);
  });
