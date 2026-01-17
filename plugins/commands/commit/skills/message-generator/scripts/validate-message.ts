#!/usr/bin/env npx ts-node --esm
/**
 * Validate Message - 验证 Conventional Commit 消息格式
 *
 * 用法: npx ts-node validate-message.ts <message> [--strict]
 *
 * 输出: 验证结果和修复建议
 */

import { fileURLToPath } from "url";

interface ValidationResult {
  valid: boolean;
  message: string;
  parsed: ParsedMessage | null;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

interface ParsedMessage {
  type: string;
  scope: string | null;
  breaking: boolean;
  description: string;
  body: string | null;
  footer: string | null;
}

// Conventional Commit 类型
const VALID_TYPES = [
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
];

// Emoji 映射
const EMOJI_MAP: Record<string, string> = {
  feat: "✨",
  fix: "🐛",
  docs: "📝",
  style: "💄",
  refactor: "♻️",
  perf: "⚡️",
  test: "✅",
  build: "📦",
  ci: "👷",
  chore: "🔧",
  revert: "⏪",
};

// 正则表达式
const HEADER_PATTERN = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/;
const MAX_HEADER_LENGTH = 72;
const MAX_BODY_LINE_LENGTH = 100;

function parseMessage(message: string): ParsedMessage | null {
  const lines = message.split("\n");
  const header = lines[0];

  const match = header.match(HEADER_PATTERN);
  if (!match) return null;

  const [, type, scope, breaking, description] = match;

  // 解析 body 和 footer
  let body: string | null = null;
  let footer: string | null = null;

  if (lines.length > 1) {
    const restLines = lines.slice(1);
    const emptyLineIdx = restLines.findIndex((l) => l.trim() === "");

    if (emptyLineIdx === 0) {
      // 第一行是空行，后面是 body
      const afterEmpty = restLines.slice(1);
      const footerIdx = afterEmpty.findIndex(
        (l) => l.startsWith("BREAKING CHANGE:") || /^[\w-]+:\s/.test(l)
      );

      if (footerIdx === -1) {
        body = afterEmpty.join("\n").trim() || null;
      } else {
        body = afterEmpty.slice(0, footerIdx).join("\n").trim() || null;
        footer = afterEmpty.slice(footerIdx).join("\n").trim() || null;
      }
    }
  }

  return {
    type,
    scope: scope || null,
    breaking: breaking === "!" || message.includes("BREAKING CHANGE:"),
    description,
    body,
    footer,
  };
}

function validateMessage(message: string, strict = false): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  const lines = message.split("\n");
  const header = lines[0];

  // 解析消息
  const parsed = parseMessage(message);

  // 验证头部格式
  if (!parsed) {
    errors.push("消息格式不符合 Conventional Commit 规范");
    errors.push("正确格式: <type>(<scope>): <description>");
    return { valid: false, message, parsed: null, errors, warnings, suggestions };
  }

  // 验证类型
  if (!VALID_TYPES.includes(parsed.type)) {
    errors.push(`无效的类型: ${parsed.type}`);
    errors.push(`有效类型: ${VALID_TYPES.join(", ")}`);
  }

  // 验证头部长度
  if (header.length > MAX_HEADER_LENGTH) {
    if (strict) {
      errors.push(`头部超过 ${MAX_HEADER_LENGTH} 字符 (${header.length})`);
    } else {
      warnings.push(`头部超过 ${MAX_HEADER_LENGTH} 字符 (${header.length})`);
    }
  }

  // 验证描述
  if (!parsed.description || parsed.description.trim().length === 0) {
    errors.push("描述不能为空");
  } else {
    // 描述不应以大写字母开头（英文）
    if (/^[A-Z]/.test(parsed.description) && strict) {
      warnings.push("描述建议以小写字母开头");
    }
    // 描述不应以句号结尾
    if (parsed.description.endsWith(".")) {
      warnings.push("描述不应以句号结尾");
    }
  }

  // 验证 body 行长度
  if (parsed.body) {
    const bodyLines = parsed.body.split("\n");
    for (let i = 0; i < bodyLines.length; i++) {
      if (bodyLines[i].length > MAX_BODY_LINE_LENGTH) {
        warnings.push(`Body 第 ${i + 1} 行超过 ${MAX_BODY_LINE_LENGTH} 字符`);
      }
    }
  }

  // 建议
  if (!parsed.scope && strict) {
    suggestions.push("建议添加作用域以明确变更范围");
  }

  const emoji = EMOJI_MAP[parsed.type];
  if (emoji && !header.includes(emoji)) {
    suggestions.push(`可添加 emoji: ${emoji} ${parsed.type}(${parsed.scope || "scope"}): ${parsed.description}`);
  }

  return {
    valid: errors.length === 0,
    message,
    parsed,
    errors,
    warnings,
    suggestions,
  };
}

function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.valid) {
    lines.push("✅ 消息格式有效");
  } else {
    lines.push("❌ 消息格式无效");
  }

  lines.push("");

  if (result.parsed) {
    lines.push("📝 解析结果:");
    lines.push(`   类型: ${result.parsed.type}`);
    lines.push(`   作用域: ${result.parsed.scope || "(无)"}`);
    lines.push(`   描述: ${result.parsed.description}`);
    lines.push(`   Breaking: ${result.parsed.breaking ? "是" : "否"}`);
    lines.push("");
  }

  if (result.errors.length > 0) {
    lines.push("❌ 错误:");
    for (const error of result.errors) {
      lines.push(`   - ${error}`);
    }
    lines.push("");
  }

  if (result.warnings.length > 0) {
    lines.push("⚠️ 警告:");
    for (const warning of result.warnings) {
      lines.push(`   - ${warning}`);
    }
    lines.push("");
  }

  if (result.suggestions.length > 0) {
    lines.push("💡 建议:");
    for (const suggestion of result.suggestions) {
      lines.push(`   - ${suggestion}`);
    }
  }

  return lines.join("\n");
}

// CLI 入口
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const strict = args.includes("--strict");
  const message = args.filter((a) => !a.startsWith("--")).join(" ");

  if (!message) {
    console.error("Usage: npx ts-node validate-message.ts <message> [--strict]");
    console.error('Example: npx ts-node validate-message.ts "feat(auth): add login"');
    process.exit(1);
  }

  const result = validateMessage(message, strict);
  console.log(formatValidationResult(result));

  if (args.includes("--json")) {
    console.log("\n📦 JSON:");
    console.log(JSON.stringify(result, null, 2));
  }

  process.exit(result.valid ? 0 : 1);
}

export { validateMessage, parseMessage };
export type { ValidationResult, ParsedMessage };
