#!/usr/bin/env npx tsx

import { existsSync, readdirSync, statSync } from "fs";
import { resolve } from "path";

interface ParsedArgs {
  runDir: string;
  depth: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    runDir: "",
    depth: "",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--run-dir") parsed.runDir = argv[i + 1] ?? "";
    if (arg === "--depth") parsed.depth = argv[i + 1] ?? "";
    if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: npx tsx scripts/run-tpd-thought-synthesizer.ts --run-dir <path> --depth light|deep|ultra",
      );
      process.exit(0);
    }
  }

  if (!parsed.runDir.trim()) throw new Error("--run-dir is required");
  if (!parsed.depth.trim()) throw new Error("--depth is required");
  return parsed;
}

function ensureDirectory(path: string): void {
  if (!existsSync(path) || !statSync(path).isDirectory()) {
    throw new Error(`run_dir is not a directory: ${path}`);
  }
}

function listExploreArtifacts(runDir: string): string[] {
  return readdirSync(runDir)
    .filter((name) => /^explore-.*\.json$/.test(name))
    .sort();
}

function main(): void {
  const parsed = parseArgs(process.argv.slice(2));
  ensureDirectory(parsed.runDir);

  const allowedDepths = new Set(["light", "deep", "ultra"]);
  if (!allowedDepths.has(parsed.depth)) {
    throw new Error(`Unsupported depth: ${parsed.depth}`);
  }

  const exploreArtifacts = listExploreArtifacts(parsed.runDir);
  if (exploreArtifacts.length === 0) {
    throw new Error("Missing required inputs: explore-*.json");
  }

  const summary = {
    skill: "tpd-thought-synthesizer",
    status: "ready",
    runDir: resolve(parsed.runDir),
    parameters: { depth: parsed.depth },
    exploreArtifacts,
    optionalInputs: {
      "codex-thought.md": existsSync(resolve(parsed.runDir, "codex-thought.md")),
      "gemini-thought.md": existsSync(resolve(parsed.runDir, "gemini-thought.md")),
    },
    expectedOutputs: ["synthesis.md"],
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
