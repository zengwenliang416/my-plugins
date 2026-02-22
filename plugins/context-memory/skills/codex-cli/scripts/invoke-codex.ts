#!/usr/bin/env npx tsx
/**
 * Codex CLI wrapper for context-memory skill execution.
 * Calls `codex exec` directly in non-interactive mode.
 * Usage:
 *   npx tsx invoke-codex.ts --prompt "<prompt>" [--role <role>] [--workdir <path>] [--sandbox <mode>]
 */

import { spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

interface ParsedArgs {
  role: string;
  prompt: string;
  workdir: string;
  sandbox: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    role: "analyzer",
    prompt: "",
    workdir: "",
    sandbox: "read-only",
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--role") parsed.role = argv[++i] || parsed.role;
    else if (arg === "--prompt") parsed.prompt = argv[++i] || "";
    else if (arg === "--workdir") parsed.workdir = argv[++i] || "";
    else if (arg === "--sandbox") parsed.sandbox = argv[++i] || parsed.sandbox;
    else if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: npx tsx invoke-codex.ts --prompt <prompt> [--role <role>] [--workdir <path>] [--sandbox <mode>]",
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

  const args = ["exec", finalPrompt, "-s", parsed.sandbox];
  if (parsed.workdir) args.push("-C", parsed.workdir);
  const result = spawnSync("codex", args, { stdio: "inherit" });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`codex exited with status ${result.status ?? "unknown"}`);
  }
}

try {
  main();
} catch (error) {
  console.error(`Error: ${(error as Error).message}`);
  process.exit(1);
}
