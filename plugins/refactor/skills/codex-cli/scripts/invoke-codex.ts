#!/usr/bin/env npx ts-node --esm
/**
 * Codex wrapper for cross-platform skill execution.
 * Usage:
 *   npx ts-node --esm invoke-codex.ts --prompt "<prompt>" [--role <role>] [--workdir <path>] [--session <id>] [--sandbox <mode>]
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
  sandbox: string;
  passthrough: string[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function usage(): void {
  console.log(
    "Usage: npx ts-node --esm invoke-codex.ts --prompt <prompt> [--role <role>] [--workdir <path>] [--session <id>] [--sandbox <mode>]"
  );
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    role: "refactoring-expert",
    prompt: "",
    workdir: "",
    session: "",
    sandbox: "read-only",
    passthrough: [],
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--role") {
      parsed.role = argv[++i] || parsed.role;
    } else if (arg === "--prompt") {
      parsed.prompt = argv[++i] || "";
    } else if (arg === "--workdir") {
      parsed.workdir = argv[++i] || "";
    } else if (arg === "--session") {
      parsed.session = argv[++i] || "";
    } else if (arg === "--sandbox") {
      parsed.sandbox = argv[++i] || parsed.sandbox;
    } else if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    } else {
      parsed.passthrough.push(arg);
    }
  }

  if (!parsed.prompt.trim()) {
    throw new Error("--prompt is required");
  }

  return parsed;
}

function resolveWrapperBinary(): string {
  if (process.env.CODEAGENT_WRAPPER?.trim()) {
    return process.env.CODEAGENT_WRAPPER.trim();
  }
  // Legacy ~/.claude/bin fallback is deprecated; rely on PATH by default.
  return "codeagent-wrapper";
}

function readLocalRolePrompt(role: string): string | null {
  if (!role) return null;
  const localPath = resolve(__dirname, "../references/roles", `${role}.md`);
  if (!existsSync(localPath)) {
    return null;
  }
  return readFileSync(localPath, "utf-8").trim();
}

function mergeRolePrompt(rolePrompt: string, taskPrompt: string): string {
  return `${rolePrompt}\n\n---\n\n${taskPrompt}`.trim();
}

function main(): void {
  const parsed = parseArgs(process.argv.slice(2));
  const wrapper = resolveWrapperBinary();
  const localRolePrompt = readLocalRolePrompt(parsed.role);
  const finalPrompt = localRolePrompt
    ? mergeRolePrompt(localRolePrompt, parsed.prompt)
    : parsed.prompt;

  const args = ["codex"];
  if (!localRolePrompt) {
    args.push("--role", parsed.role);
  }
  args.push("--prompt", finalPrompt);
  if (parsed.workdir) {
    args.push("--workdir", parsed.workdir);
  }
  if (parsed.session) {
    args.push("--session", parsed.session);
  }
  if (parsed.sandbox) {
    args.push("--sandbox", parsed.sandbox);
  }
  if (parsed.passthrough.length > 0) {
    args.push(...parsed.passthrough);
  }

  const result = spawnSync(wrapper, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`codeagent-wrapper exited with status ${result.status ?? "unknown"}`);
  }
}

try {
  main();
} catch (error) {
  console.error(`Error: ${(error as Error).message}`);
  process.exit(1);
}
