#!/usr/bin/env npx ts-node --esm
/**
 * Codex wrapper for context-memory skill execution.
 * Usage:
 *   npx tsx invoke-codex.ts --prompt "<prompt>" [--role <role>] [--workdir <path>] [--session <id>] [--sandbox <mode>]
 */

import { spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { dirname, join, resolve } from "path";
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
    "Usage: npx tsx invoke-codex.ts --prompt <prompt> [--role <role>] [--workdir <path>] [--session <id>] [--sandbox <mode>]",
  );
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    role: "analyzer",
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
  return "codeagent-wrapper";
}

function resolvePromptsDir(): string {
  if (process.env.CLAUDE_PROMPTS_DIR?.trim()) {
    return process.env.CLAUDE_PROMPTS_DIR.trim();
  }
  return join(homedir(), ".claude", "prompts");
}

function localRolePromptPath(role: string): string {
  return resolve(__dirname, "../references/roles", `${role}.md`);
}

function readLocalRolePrompt(role: string): string | null {
  if (!role) return null;
  const promptPath = localRolePromptPath(role);
  if (!existsSync(promptPath)) {
    return null;
  }
  return readFileSync(promptPath, "utf-8").trim();
}

function globalRolePromptExists(model: string, role: string): boolean {
  if (!role) return false;
  const promptPath = resolve(resolvePromptsDir(), model, `${role}.md`);
  return existsSync(promptPath);
}

function rolePromptExists(model: string, role: string): boolean {
  if (!role) return false;
  if (existsSync(localRolePromptPath(role))) {
    return true;
  }
  return globalRolePromptExists(model, role);
}

function mergeRolePrompt(rolePrompt: string, taskPrompt: string): string {
  return `${rolePrompt}\n\n---\n\n${taskPrompt}`.trim();
}

function resolveRoleAlias(role: string): string {
  if (!role) return role;
  if (rolePromptExists("codex", role)) {
    return role;
  }

  const aliasMap: Record<string, string> = {
    analyzer: "analyzer",
    "doc-generator": "architect",
    auditor: "reviewer",
  };

  const alias = aliasMap[role];
  if (alias && rolePromptExists("codex", alias)) {
    console.error(
      `[context-memory:codex-cli] role '${role}' prompt missing, fallback to '${alias}'.`,
    );
    return alias;
  }

  if (rolePromptExists("codex", "analyzer")) {
    console.error(
      `[context-memory:codex-cli] role '${role}' prompt missing, fallback to 'analyzer'.`,
    );
    return "analyzer";
  }

  return role;
}

function main(): void {
  const parsed = parseArgs(process.argv.slice(2));
  const wrapper = resolveWrapperBinary();
  const localRolePrompt = readLocalRolePrompt(parsed.role);
  const resolvedRole = localRolePrompt ? "" : resolveRoleAlias(parsed.role);
  const finalPrompt = localRolePrompt
    ? mergeRolePrompt(localRolePrompt, parsed.prompt)
    : parsed.prompt;

  const args = ["codex"];
  if (resolvedRole) {
    args.push("--role", resolvedRole);
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
    throw new Error(
      `codeagent-wrapper exited with status ${result.status ?? "unknown"}`,
    );
  }
}

try {
  main();
} catch (error) {
  console.error(`Error: ${(error as Error).message}`);
  process.exit(1);
}
