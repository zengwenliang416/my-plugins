#!/usr/bin/env npx tsx
/**
 * Execute external searches for topic research using WebSearch tool.
 * This script is a placeholder — actual search execution happens via
 * the WebSearch tool in the topic-researcher skill workflow.
 *
 * Usage:
 *   npx tsx execute_search.ts --topic "topic" --mode basic|deep --output-dir ./output
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";

type Mode = "basic" | "deep";

interface Args {
  topic: string;
  mode: Mode;
  outputDir: string;
}

function usage(): void {
  console.log(
    "Usage: npx tsx execute_search.ts --topic <topic> [--mode basic|deep] [--output-dir <dir>]",
  );
  console.log("");
  console.log("NOTE: This script generates search query templates.");
  console.log(
    "Actual searching is performed by the WebSearch tool in the skill workflow.",
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

interface SearchQuery {
  label: string;
  query: string;
}

function buildQueries(topic: string, mode: Mode): SearchQuery[] {
  const queries: SearchQuery[] = [
    { label: "trends", query: `${topic} trends 2026` },
    { label: "cases", query: `${topic} case study success story` },
    {
      label: "cross-industry",
      query: `${topic} inspiration from other industries`,
    },
  ];

  if (mode === "deep") {
    queries.push(
      { label: "problems", query: `${topic} challenges problems pain points` },
      {
        label: "opportunities",
        query: `${topic} opportunities innovations startups`,
      },
    );
  }

  return queries;
}

function run(): void {
  const args = parseArgs(process.argv.slice(2));
  const outputDir = resolve(args.outputDir);
  mkdirSync(outputDir, { recursive: true });

  console.log(`Topic: ${args.topic}`);
  console.log(`Mode: ${args.mode}`);
  console.log("");

  const queries = buildQueries(args.topic, args.mode);
  const manifest = queries.map((q, i) => ({
    index: i + 1,
    label: q.label,
    query: q.query,
    tool: "WebSearch",
  }));

  const manifestPath = join(outputDir, "search-queries.json");
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`Search query manifest saved to: ${manifestPath}`);

  for (const entry of manifest) {
    console.log(
      `  [${entry.index}/${manifest.length}] ${entry.label}: WebSearch("${entry.query}")`,
    );
  }
}

try {
  run();
} catch (error) {
  console.error(`Error: ${(error as Error).message}`);
  process.exit(1);
}
