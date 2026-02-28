#!/usr/bin/env npx tsx
/**
 * Gemini CLI wrapper for context-memory skill execution.
 * Calls `gemini` directly in non-interactive (headless) mode.
 * Usage:
 *   npx tsx invoke-gemini.ts --prompt "<prompt>" [--role <role>] [--workdir <path>] [--session <id>]
 */

import { spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

interface ParsedArgs {
  role: string;
  prompt: string;
  workdir: string;
  session: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    role: "doc-generator",
    prompt: "",
    workdir: "",
    session: "",
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--role") parsed.role = argv[++i] || parsed.role;
    else if (arg === "--prompt") parsed.prompt = argv[++i] || "";
    else if (arg === "--workdir") parsed.workdir = argv[++i] || "";
    else if (arg === "--session") parsed.session = argv[++i] || "";
    else if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: npx tsx invoke-gemini.ts --prompt <prompt> [--role <role>] [--workdir <path>] [--session <id>]",
      );
      process.exit(0);
    }
  }
  if (!parsed.prompt.trim()) throw new Error("--prompt is required");
  return parsed;
}

function readLocalRolePrompt(role: string): string | null {
  if (!role) return null;
  const promptPath = resolve(__dirname, "../references/roles", `${role}.md`);
  return existsSync(promptPath)
    ? readFileSync(promptPath, "utf-8").trim()
    : null;
}

function main(): void {
  const parsed = parseArgs(process.argv.slice(2));
  const rolePrompt = readLocalRolePrompt(parsed.role);
  const finalPrompt = rolePrompt
    ? `${rolePrompt}\n\n---\n\n${parsed.prompt}`.trim()
    : parsed.prompt;

  const args = ["-p", finalPrompt, "-o", "text"];
  if (parsed.session) args.push("--session", parsed.session);
  const result = spawnSync("gemini", args, {
    stdio: "inherit",
    cwd: parsed.workdir || undefined,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`gemini exited with status ${result.status ?? "unknown"}`);
  }
}

try {
  main();
} catch (error) {
  console.error(`Error: ${(error as Error).message}`);
  process.exit(1);
}
