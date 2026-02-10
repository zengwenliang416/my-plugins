#!/usr/bin/env npx ts-node --esm
/**
 * Context Loader Script
 * Assembles context from various sources.
 *
 * Usage:
 *   npx ts-node --esm load-context.ts [output-file] [max-tokens]
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "fs";
import { basename, join } from "path";

const MEMORY_DIR = ".claude/memory";
const RULES_DIR = ".claude/rules";

function log(message: string): void {
  console.log(`[context-loader] ${message}`);
}

function warn(message: string): void {
  console.warn(`[warning] ${message}`);
}

function success(message: string): void {
  console.log(`[success] ${message}`);
}

function readFileSafe(filePath: string): string {
  return readFileSync(filePath, "utf-8");
}

function collectRuleFiles(): string[] {
  if (!existsSync(RULES_DIR)) {
    return [];
  }

  return readdirSync(RULES_DIR)
    .filter((entry) => entry.endsWith(".md"))
    .map((entry) => join(RULES_DIR, entry))
    .filter((filePath) => statSync(filePath).isFile())
    .sort();
}

function run(): void {
  const outputFile = process.argv[2] || "context.md";
  const maxTokens = Number(process.argv[3] || "50000");

  if (!existsSync(MEMORY_DIR)) {
    warn(`Memory directory not found: ${MEMORY_DIR}`);
    mkdirSync(MEMORY_DIR, { recursive: true });
    log("Created memory directory");
  }

  const lines: string[] = [];
  lines.push("# Project Context");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  const ruleFiles = collectRuleFiles();
  if (ruleFiles.length > 0) {
    log("Loading rules...");
    lines.push("## Rules");
    lines.push("");
    for (const rulePath of ruleFiles) {
      lines.push(`### ${basename(rulePath, ".md")}`);
      lines.push(readFileSafe(rulePath));
      lines.push("");
    }
  }

  const codeMapPath = join(MEMORY_DIR, "code-map.md");
  if (existsSync(codeMapPath)) {
    log("Loading code map...");
    lines.push("## Code Map");
    lines.push("");
    lines.push(readFileSafe(codeMapPath));
    lines.push("");
  }

  const skillsIndexPath = join(MEMORY_DIR, "skills", "index.json");
  if (existsSync(skillsIndexPath)) {
    log("Loading skills index...");
    lines.push("## Available Skills");
    lines.push("");
    lines.push("```json");
    lines.push(readFileSafe(skillsIndexPath));
    lines.push("```");
    lines.push("");
  }

  const latestSessionPath = join(MEMORY_DIR, "sessions", "latest.md");
  if (existsSync(latestSessionPath)) {
    log("Loading session summary...");
    lines.push("## Recent Session");
    lines.push("");
    lines.push(readFileSafe(latestSessionPath));
    lines.push("");
  }

  const output = `${lines.join("\n")}\n`;
  writeFileSync(outputFile, output, "utf-8");

  const charCount = output.length;
  const tokenEstimate = Math.floor(charCount / 4);

  success(`Context assembled: ${outputFile}`);
  log(`Estimated tokens: ${tokenEstimate} / ${maxTokens}`);
  if (tokenEstimate > maxTokens) {
    warn("Context exceeds token budget, truncation may be needed");
  }
}

try {
  run();
} catch (error) {
  console.error(`Error: ${(error as Error).message}`);
  process.exit(1);
}
