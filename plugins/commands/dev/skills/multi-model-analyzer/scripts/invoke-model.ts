#!/usr/bin/env npx ts-node --esm
/**
 * Invoke Model - 调用外部模型进行分析
 *
 * 用法: npx ts-node invoke-model.ts <model> <prompt-file> [--output <file>]
 *
 * 支持模型: codex, gemini
 */

import * as fs from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

interface ModelInvocation {
  model: "codex" | "gemini";
  prompt: string;
  response: string;
  timestamp: string;
  sessionId: string | null;
  tokenUsage: {
    input: number;
    output: number;
  };
}

interface ModelConfig {
  command: string;
  contextLimit: number;
  strengths: string[];
}

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  codex: {
    command: "codex",
    contextLimit: 192000,
    strengths: ["后端逻辑", "调试", "安全审计", "复杂链路分析"],
  },
  gemini: {
    command: "gemini",
    contextLimit: 32000,
    strengths: ["前端 UI", "CSS 样式", "React 组件", "设计趋势"],
  },
};

// Token 估算
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// 执行 shell 命令
function exec(cmd: string, timeout = 300000): string {
  try {
    return execSync(cmd, {
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024,
      timeout,
    }).trim();
  } catch (error: any) {
    throw new Error(`Command failed: ${error.message}`);
  }
}

// 调用 Codex
function invokeCodex(prompt: string, sessionId?: string): string {
  const sessionArg = sessionId ? `--session ${sessionId}` : "";
  const escapedPrompt = prompt.replace(/'/g, "'\\''");

  // 使用 heredoc 传递 prompt
  const cmd = `codex ${sessionArg} --full-auto --quiet <<'PROMPT_EOF'
${escapedPrompt}
PROMPT_EOF`;

  return exec(cmd);
}

// 调用 Gemini
function invokeGemini(prompt: string, contextFiles?: string[]): string {
  const contextArg = contextFiles?.length
    ? contextFiles.map((f) => `-c ${f}`).join(" ")
    : "";
  const escapedPrompt = prompt.replace(/'/g, "'\\''");

  const cmd = `gemini ${contextArg} -p '${escapedPrompt}'`;

  return exec(cmd);
}

// 主调用函数
function invokeModel(
  model: string,
  prompt: string,
  options: { sessionId?: string; contextFiles?: string[] } = {}
): ModelInvocation {
  const config = MODEL_CONFIGS[model];
  if (!config) {
    throw new Error(`Unknown model: ${model}. Supported: ${Object.keys(MODEL_CONFIGS).join(", ")}`);
  }

  // 检查 prompt 长度
  const inputTokens = estimateTokens(prompt);
  if (inputTokens > config.contextLimit * 0.8) {
    console.warn(
      `⚠️ Prompt may be too long (${inputTokens} tokens, limit: ${config.contextLimit})`
    );
  }

  let response: string;
  const startTime = Date.now();

  if (model === "codex") {
    response = invokeCodex(prompt, options.sessionId);
  } else if (model === "gemini") {
    response = invokeGemini(prompt, options.contextFiles);
  } else {
    throw new Error(`Model ${model} not implemented`);
  }

  const duration = Date.now() - startTime;
  const outputTokens = estimateTokens(response);

  return {
    model: model as "codex" | "gemini",
    prompt,
    response,
    timestamp: new Date().toISOString(),
    sessionId: options.sessionId || null,
    tokenUsage: {
      input: inputTokens,
      output: outputTokens,
    },
  };
}

// 路由选择建议
function suggestModel(taskDescription: string): string {
  const backendKeywords = [
    "api",
    "database",
    "backend",
    "server",
    "auth",
    "security",
    "debug",
    "error",
    "logic",
    "algorithm",
  ];

  const frontendKeywords = [
    "ui",
    "css",
    "style",
    "component",
    "react",
    "vue",
    "design",
    "layout",
    "responsive",
    "animation",
  ];

  const lower = taskDescription.toLowerCase();

  const backendScore = backendKeywords.filter((k) => lower.includes(k)).length;
  const frontendScore = frontendKeywords.filter((k) => lower.includes(k)).length;

  if (backendScore > frontendScore) {
    return "codex";
  } else if (frontendScore > backendScore) {
    return "gemini";
  }

  // 默认使用 codex（更通用）
  return "codex";
}

// 格式化结果
function formatResult(result: ModelInvocation): string {
  const lines: string[] = [];

  lines.push(`🤖 Model Invocation Result`);
  lines.push(`Model: ${result.model}`);
  lines.push(`Timestamp: ${result.timestamp}`);
  lines.push(
    `Tokens: ${result.tokenUsage.input} input, ${result.tokenUsage.output} output`
  );
  if (result.sessionId) {
    lines.push(`Session: ${result.sessionId}`);
  }
  lines.push("");
  lines.push(`## Response`);
  lines.push("");
  lines.push(result.response);

  return lines.join("\n");
}

// CLI 入口
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);

  if (args.includes("--suggest")) {
    const taskIdx = args.indexOf("--suggest");
    const task = args.slice(taskIdx + 1).join(" ");
    if (task) {
      const suggested = suggestModel(task);
      console.log(`Suggested model for "${task}": ${suggested}`);
      console.log(`Strengths: ${MODEL_CONFIGS[suggested].strengths.join(", ")}`);
    }
    process.exit(0);
  }

  const model = args[0];
  const promptFile = args[1];
  const outputIdx = args.indexOf("--output");
  const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : null;
  const sessionIdx = args.indexOf("--session");
  const sessionId = sessionIdx !== -1 ? args[sessionIdx + 1] : undefined;

  if (!model || !promptFile) {
    console.error("Usage: npx ts-node invoke-model.ts <model> <prompt-file> [--output <file>] [--session <id>]");
    console.error("       npx ts-node invoke-model.ts --suggest <task description>");
    console.error("Models: codex, gemini");
    process.exit(1);
  }

  try {
    const prompt = fs.readFileSync(promptFile, "utf-8");
    const result = invokeModel(model, prompt, { sessionId });
    const formatted = formatResult(result);

    if (outputFile) {
      fs.writeFileSync(outputFile, formatted);
      console.log(`✅ Result written to ${outputFile}`);
    } else {
      console.log(formatted);
    }

    if (args.includes("--json")) {
      console.log("\n📦 JSON:");
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

export { invokeModel, suggestModel, MODEL_CONFIGS };
export type { ModelInvocation };
