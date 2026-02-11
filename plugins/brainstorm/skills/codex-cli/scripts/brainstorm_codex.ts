#!/usr/bin/env npx ts-node --esm
/**
 * Codex CLI wrapper for brainstorming.
 * Usage:
 *   npx ts-node --esm brainstorm_codex.ts --prompt "..." [--method scamper|hats|auto] [--role brainstorm]
 */

import { spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

interface Args {
  prompt: string;
  method: string;
  role: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function usage(): void {
  console.log(
    "Usage: npx ts-node --esm brainstorm_codex.ts --prompt <text> [--method scamper|hats|auto] [--role brainstorm]"
  );
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    prompt: "",
    method: "auto",
    role: "brainstorm",
  };

  for (let i = 0; i < argv.length; i++) {
    const current = argv[i];
    if (current === "--prompt") {
      args.prompt = argv[++i] || "";
    } else if (current === "--method") {
      args.method = argv[++i] || "auto";
    } else if (current === "--role") {
      args.role = argv[++i] || "brainstorm";
    } else if (current === "--help" || current === "-h") {
      usage();
      process.exit(0);
    }
  }

  if (!args.prompt.trim()) {
    throw new Error("--prompt is required");
  }

  return args;
}

function resolveWrapperBinary(): string {
  if (process.env.CODEAGENT_WRAPPER?.trim()) {
    return process.env.CODEAGENT_WRAPPER.trim();
  }

  const home = homedir();
  if (process.platform === "win32") {
    const windowsCandidates = [
      join(home, ".claude", "bin", "codeagent-wrapper.cmd"),
      join(home, ".claude", "bin", "codeagent-wrapper.exe"),
      join(home, ".claude", "bin", "codeagent-wrapper"),
    ];
    for (const candidate of windowsCandidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  } else {
    const unixCandidate = join(home, ".claude", "bin", "codeagent-wrapper");
    if (existsSync(unixCandidate)) {
      return unixCandidate;
    }
  }

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

function run(): void {
  const parsed = parseArgs(process.argv.slice(2));
  const wrapper = resolveWrapperBinary();
  const localRolePrompt = readLocalRolePrompt(parsed.role);
  const finalPrompt = localRolePrompt
    ? mergeRolePrompt(localRolePrompt, parsed.prompt)
    : parsed.prompt;

  // Keep method argument for compatibility with existing callers.
  void parsed.method;

  const commandArgs = ["codex"];
  if (!localRolePrompt) {
    commandArgs.push("--role", parsed.role);
  }
  commandArgs.push("--prompt", finalPrompt, "--sandbox", "read-only");

  const result = spawnSync(
    wrapper,
    commandArgs,
    {
      stdio: "inherit",
      shell: process.platform === "win32",
    }
  );

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`codeagent-wrapper exited with status ${result.status ?? "unknown"}`);
  }
}

run();
