#!/usr/bin/env npx tsx
/**
 * Codex CLI wrapper for brainstorming.
 * Calls `codex exec` directly in non-interactive mode.
 * Usage:
 *   npx tsx brainstorm_codex.ts --prompt "..." [--role brainstorm]
 */

import { spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

interface Args {
  prompt: string;
  role: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function parseArgs(argv: string[]): Args {
  const args: Args = { prompt: "", role: "brainstorm" };
  for (let i = 0; i < argv.length; i++) {
    const current = argv[i];
    if (current === "--prompt") args.prompt = argv[++i] || "";
    else if (current === "--role") args.role = argv[++i] || "brainstorm";
    else if (current === "--method")
      ++i; // skip legacy param
    else if (current === "--help" || current === "-h") {
      console.log(
        "Usage: npx tsx brainstorm_codex.ts --prompt <text> [--role brainstorm]",
      );
      process.exit(0);
    }
  }
  if (!args.prompt.trim()) throw new Error("--prompt is required");
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

  const args = ["exec", finalPrompt, "-s", "read-only"];
  const result = spawnSync("codex", args, { stdio: "inherit" });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`codex exited with status ${result.status ?? "unknown"}`);
  }
}

run();
