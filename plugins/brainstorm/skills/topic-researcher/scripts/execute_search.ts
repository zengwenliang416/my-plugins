#!/usr/bin/env npx ts-node --esm
/**
 * Execute external searches for topic research.
 * Usage:
 *   npx ts-node --esm execute_search.ts --topic "topic" --mode basic|deep --output-dir ./output
 */

import { execFileSync } from "child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

type Mode = "basic" | "deep";

interface Args {
  topic: string;
  mode: Mode;
  outputDir: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function usage(): void {
  console.log(
    "Usage: npx ts-node --esm execute_search.ts --topic <topic> [--mode basic|deep] [--output-dir <dir>]"
  );
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    topic: "",
    mode: "basic",
    outputDir: ".",
  };

  for (let i = 0; i < argv.length; i++) {
    const current = argv[i];
    if (current === "--topic") {
      args.topic = argv[++i] || "";
    } else if (current === "--mode") {
      const mode = (argv[++i] || "basic").toLowerCase();
      if (mode === "basic" || mode === "deep") {
        args.mode = mode;
      } else {
        throw new Error(`Unsupported mode: ${mode}`);
      }
    } else if (current === "--output-dir") {
      args.outputDir = argv[++i] || ".";
    } else if (current === "--help" || current === "-h") {
      usage();
      process.exit(0);
    }
  }

  if (!args.topic.trim()) {
    throw new Error("--topic is required");
  }

  return args;
}

function runExternalSearch(searchScript: string, query: string): string {
  const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
  return execFileSync(
    npxCommand,
    ["tsx", searchScript, "search", query, "--max-results", "5"],
    { encoding: "utf-8" }
  );
}

function saveSearchResult(searchScript: string, outputDir: string, fileName: string, query: string): void {
  const result = runExternalSearch(searchScript, query);
  writeFileSync(join(outputDir, fileName), result, "utf-8");
}

function run(): void {
  const args = parseArgs(process.argv.slice(2));
  const searchScript = resolve(__dirname, "../../grok-search/scripts/grok-search.ts");
  if (!existsSync(searchScript)) {
    throw new Error(`Search script not found: ${searchScript}`);
  }

  const outputDir = resolve(args.outputDir);
  mkdirSync(outputDir, { recursive: true });

  console.log(`Starting topic research for: ${args.topic}`);
  console.log(`Mode: ${args.mode}`);
  console.log("");

  console.log("[1/3] Searching trends...");
  saveSearchResult(searchScript, outputDir, "search-trends.json", `${args.topic} trends 2026`);

  console.log("[2/3] Searching case studies...");
  saveSearchResult(
    searchScript,
    outputDir,
    "search-cases.json",
    `${args.topic} case study success story`
  );

  console.log("[3/3] Searching cross-industry inspiration...");
  saveSearchResult(
    searchScript,
    outputDir,
    "search-cross.json",
    `${args.topic} inspiration from other industries`
  );

  if (args.mode === "deep") {
    console.log("");
    console.log("Deep mode: running additional searches...");

    console.log("[4/5] Searching pain points...");
    saveSearchResult(
      searchScript,
      outputDir,
      "search-problems.json",
      `${args.topic} challenges problems pain points`
    );

    console.log("[5/5] Searching opportunities...");
    saveSearchResult(
      searchScript,
      outputDir,
      "search-opportunities.json",
      `${args.topic} opportunities innovations startups`
    );
  }

  console.log("");
  console.log(`Search completed. Results saved to: ${outputDir}`);

  const files = readdirSync(outputDir)
    .filter((name) => name.startsWith("search-") && name.endsWith(".json"))
    .sort();
  for (const name of files) {
    console.log(`- ${join(outputDir, name)}`);
  }
}

try {
  run();
} catch (error) {
  console.error(`Error: ${(error as Error).message}`);
  process.exit(1);
}
