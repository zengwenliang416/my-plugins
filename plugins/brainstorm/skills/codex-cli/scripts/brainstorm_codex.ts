#!/usr/bin/env npx ts-node --esm
/**
 * Codex CLI wrapper for brainstorming.
 * Usage:
 *   npx ts-node --esm brainstorm_codex.ts --prompt "..." [--method scamper|hats|auto] [--role brainstorm]
 */

import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

interface Args {
  prompt: string;
  method: string;
  role: string;
}

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

function run(): void {
  const parsed = parseArgs(process.argv.slice(2));
  const wrapper = resolveWrapperBinary();

  // Keep method argument for compatibility with existing callers.
  void parsed.method;

  const result = spawnSync(
    wrapper,
    ["codex", "--role", parsed.role, "--prompt", parsed.prompt, "--sandbox", "read-only"],
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
