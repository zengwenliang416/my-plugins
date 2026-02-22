#!/usr/bin/env npx tsx
/**
 * Gemini CLI wrapper for UI Design.
 * Calls `gemini` directly in non-interactive (headless) mode with image support.
 * Usage:
 *   npx tsx invoke-gemini-ui.ts --prompt <prompt> [--image <path>] [--dimension <type>] [--role <role>]
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
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function parseArgs(argv: string[]): Args {
  const args: Args = {
    role: "ui_designer",
    prompt: "",
    image: "",
    dimension: "",
  };
  for (let i = 0; i < argv.length; i++) {
    const current = argv[i];
    if (current === "--role") args.role = argv[++i] || "ui_designer";
    else if (current === "--prompt") args.prompt = argv[++i] || "";
    else if (current === "--image") args.image = argv[++i] || "";
    else if (current === "--dimension") args.dimension = argv[++i] || "";
    else if (current === "--session")
      ++i; // skip legacy param
    else if (current === "--help" || current === "-h") {
      console.log(
        "Usage: npx tsx invoke-gemini-ui.ts --prompt <prompt> [--image <path>] [--dimension <type>] [--role <role>]",
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${current}`);
    }
  }
  if (!args.prompt.trim()) throw new Error("--prompt is required");
  if (args.image && !existsSync(args.image))
    throw new Error(`Image file not found: ${args.image}`);
  return args;
}

function readLocalRolePrompt(role: string): string | null {
  if (!role) return null;
  const localPath = resolve(__dirname, "../references/roles", `${role}.md`);
  return existsSync(localPath) ? readFileSync(localPath, "utf-8").trim() : null;
}

function run(): void {
  const parsed = parseArgs(process.argv.slice(2));
  const rolePrompt = readLocalRolePrompt(parsed.role);
  const finalPrompt = rolePrompt
    ? `${rolePrompt}\n\n---\n\n${parsed.prompt}`.trim()
    : parsed.prompt;

  const args = ["-p", finalPrompt, "--approval-mode", "plan", "-o", "text"];
  if (parsed.image) args.push("-i", parsed.image);

  console.error(
    `[ui-design:gemini-cli] role=${parsed.role} image=${parsed.image || "none"} dimension=${parsed.dimension || "none"}`,
  );

  const result = spawnSync("gemini", args, { stdio: "inherit" });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`gemini exited with status ${result.status ?? "unknown"}`);
  }
}

try {
  run();
} catch (error) {
  console.error(`Error: ${(error as Error).message}`);
  process.exit(1);
}
