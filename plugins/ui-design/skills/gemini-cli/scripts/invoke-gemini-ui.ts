#!/usr/bin/env npx ts-node --esm
/**
 * Gemini CLI Wrapper Script for UI Design.
 * Usage:
 *   npx ts-node --esm invoke-gemini-ui.ts --prompt <prompt> [--image <path>] [--dimension <type>] [--role <role>] [--session <id>]
 */

import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

interface Args {
  role: string;
  prompt: string;
  image: string;
  dimension: string;
  session: string;
}

function usage(): void {
  console.log(
    "Usage: npx ts-node --esm invoke-gemini-ui.ts --prompt <prompt> [--image <path>] [--dimension <type>] [--role <role>] [--session <id>]"
  );
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    role: "ui_designer",
    prompt: "",
    image: "",
    dimension: "",
    session: "",
  };

  for (let i = 0; i < argv.length; i++) {
    const current = argv[i];
    if (current === "--role") {
      args.role = argv[++i] || "ui_designer";
    } else if (current === "--prompt") {
      args.prompt = argv[++i] || "";
    } else if (current === "--image") {
      args.image = argv[++i] || "";
    } else if (current === "--dimension") {
      args.dimension = argv[++i] || "";
    } else if (current === "--session") {
      args.session = argv[++i] || "";
    } else if (current === "--help" || current === "-h") {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${current}`);
    }
  }

  if (!args.prompt.trim()) {
    throw new Error("--prompt is required");
  }

  if (args.image && !existsSync(args.image)) {
    throw new Error(`Image file not found: ${args.image}`);
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
  const args = parseArgs(process.argv.slice(2));
  const wrapper = resolveWrapperBinary();
  const commandArgs = ["gemini", "--role", args.role, "--prompt", args.prompt];
  if (args.image) {
    commandArgs.push("--file", args.image);
  }
  if (args.session) {
    commandArgs.push("--session", args.session);
  }

  console.log("Invoking Gemini CLI for UI Design...");
  console.log(`Role: ${args.role}`);
  if (args.image) {
    console.log(`Image: ${args.image}`);
  }
  if (args.dimension) {
    console.log(`Dimension: ${args.dimension}`);
  }
  if (args.session) {
    console.log(`Session: ${args.session}`);
  }
  console.log("---");

  const result = spawnSync(wrapper, commandArgs, {
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
  run();
} catch (error) {
  console.error(`Error: ${(error as Error).message}`);
  process.exit(1);
}
