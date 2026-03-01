#!/usr/bin/env npx tsx

import { existsSync, statSync } from "fs";
import { resolve } from "path";

interface ParsedArgs {
  runDir: string;
  proposalId: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    runDir: "",
    proposalId: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--run-dir") parsed.runDir = argv[i + 1] ?? "";
    if (arg === "--proposal-id") parsed.proposalId = argv[i + 1] ?? "";
    if (arg === "--help" || arg === "-h") {
      console.log("Usage: npx tsx scripts/run-tpd-handoff-generator.ts --run-dir <path> --proposal-id <id>");
      process.exit(0);
    }
  }

  if (!parsed.runDir.trim()) throw new Error("--run-dir is required");
  if (!parsed.proposalId.trim()) throw new Error("--proposal-id is required");
  return parsed;
}

function ensureDirectory(path: string): void {
  if (!existsSync(path) || !statSync(path).isDirectory()) {
    throw new Error(`run_dir is not a directory: ${path}`);
  }
}

function requireFiles(runDir: string, relativePaths: string[]): string[] {
  const missing: string[] = [];
  for (const relativePath of relativePaths) {
    const absolutePath = resolve(runDir, relativePath);
    if (!existsSync(absolutePath)) {
      missing.push(relativePath);
    }
  }
  return missing;
}

function main(): void {
  const parsed = parseArgs(process.argv.slice(2));
  ensureDirectory(parsed.runDir);

  const requiredInputs = ["conclusion.md", "synthesis.md"];
  const missingInputs = requireFiles(parsed.runDir, requiredInputs);
  if (missingInputs.length > 0) {
    throw new Error(`Missing required inputs: ${missingInputs.join(", ")}`);
  }

  const summary = {
    skill: "tpd-handoff-generator",
    status: "ready",
    runDir: resolve(parsed.runDir),
    parameters: { proposalId: parsed.proposalId },
    requiredInputs,
    expectedOutputs: [
      "handoff.md",
      "handoff.json",
      "meta/artifact-manifest.json",
    ],
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
