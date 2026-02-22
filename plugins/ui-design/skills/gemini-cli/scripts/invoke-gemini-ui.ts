#!/usr/bin/env npx tsx
/**
 * Gemini CLI Wrapper Script for UI Design.
 * Usage:
 *   npx ts-node --esm invoke-gemini-ui.ts --prompt <prompt> [--image <path>] [--dimension <type>] [--role <role>] [--session <id>]
 */

import { spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

interface Args {
  role: string;
  prompt: string;
  image: string;
  dimension: string;
  session: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  // Do not hardcode legacy ~/.claude/bin paths; rely on PATH or CODEAGENT_WRAPPER override.
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
  const args = parseArgs(process.argv.slice(2));
  const wrapper = resolveWrapperBinary();
  const localRolePrompt = readLocalRolePrompt(args.role);
  const finalPrompt = localRolePrompt
    ? mergeRolePrompt(localRolePrompt, args.prompt)
    : args.prompt;

  const commandArgs = ["gemini"];
  if (!localRolePrompt) {
    commandArgs.push("--role", args.role);
  }
  commandArgs.push("--prompt", finalPrompt);
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
