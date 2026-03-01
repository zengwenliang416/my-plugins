#!/usr/bin/env npx tsx

import { existsSync, statSync } from "fs";
import { resolve } from "path";

interface ParsedArgs {
  runDir: string;
  taskType: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    runDir: "",
    taskType: "fullstack",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--run-dir") parsed.runDir = argv[i + 1] ?? "";
    if (arg === "--task-type") parsed.taskType = argv[i + 1] ?? "fullstack";
    if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: npx tsx scripts/run-tpd-task-decomposer.ts --run-dir <path> [--task-type fullstack|frontend|backend]",
      );
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

function requireFiles(runDir: string, files: string[]): string[] {
  return files.filter((file) => !existsSync(resolve(runDir, file)));
}

function main(): void {
  const parsed = parseArgs(process.argv.slice(2));
  ensureDirectory(parsed.runDir);

  const supportedTaskTypes = new Set(["fullstack", "frontend", "backend"]);
  if (!supportedTaskTypes.has(parsed.taskType)) {
    throw new Error(`Unsupported task type: ${parsed.taskType}`);
  }

  const requiredInputs = ["architecture.md", "constraints.md"];
  const missingInputs = requireFiles(parsed.runDir, requiredInputs);
  if (missingInputs.length > 0) {
    throw new Error(`Missing required inputs: ${missingInputs.join(", ")}`);
  }

  const summary = {
    skill: "tpd-task-decomposer",
    status: "ready",
    runDir: resolve(parsed.runDir),
    parameters: { taskType: parsed.taskType },
    requiredInputs,
    expectedOutputs: ["tasks.md", "pbt.md"],
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
