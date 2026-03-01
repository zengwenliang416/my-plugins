#!/usr/bin/env npx tsx

import { existsSync, statSync } from "fs";
import { resolve } from "path";

interface ParsedArgs {
  runDir: string;
  proposalId?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = { runDir: "" };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--run-dir") parsed.runDir = argv[i + 1] ?? "";
    if (arg === "--proposal-id") parsed.proposalId = argv[i + 1] ?? "";
    if (arg === "--help" || arg === "-h") {
      console.log("Usage: npx tsx scripts/run-tpd-plan-context-retriever.ts --run-dir <path> [--proposal-id <id>]");
      process.exit(0);
    }
  }

  if (!parsed.runDir.trim()) throw new Error("--run-dir is required");
  return parsed;
}

function ensureDirectory(path: string): void {
  if (!existsSync(path) || !statSync(path).isDirectory()) {
    throw new Error(`run_dir is not a directory: ${path}`);
  }
}

function main(): void {
  const parsed = parseArgs(process.argv.slice(2));
  ensureDirectory(parsed.runDir);

  const requirementsPath = resolve(parsed.runDir, "requirements.md");
  if (!existsSync(requirementsPath)) {
    throw new Error("Missing required input: requirements.md");
  }

  const optionalInputs = ["../thinking/handoff.json"];
  const summary = {
    skill: "tpd-plan-context-retriever",
    status: "ready",
    runDir: resolve(parsed.runDir),
    parameters: { proposalId: parsed.proposalId ?? null },
    requiredInputs: ["requirements.md"],
    optionalInputs,
    optionalAvailability: {
      "../thinking/handoff.json": existsSync(resolve(parsed.runDir, "../thinking/handoff.json")),
    },
    expectedOutputs: ["context.md", "meta/evidence-capture.json"],
    references: {
      decisionTree: "references/decision-tree.md",
      outputContract: "references/output-contract.md",
    },
  };

  console.log("STATUS: SUCCESS");
  console.log(JSON.stringify(summary, null, 2));
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("STATUS: FAILURE");
  console.error(`ERROR: ${message}`);
  process.exit(1);
}
