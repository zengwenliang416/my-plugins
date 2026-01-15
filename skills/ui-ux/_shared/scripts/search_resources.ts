#!/usr/bin/env tsx

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SearchOptions {
  domain?: "style" | "color" | "typography" | "ux-guideline";
  query?: string;
  industry?: string;
  priority?: "high" | "medium" | "low" | "高" | "中" | "低";
  limit?: number;
}

interface Resource {
  id: string;
  domain: string;
  name: string;
  file_path: string;
  keywords: string[];
  description: string;
  use_cases?: string[];
  references?: string[];
  industry?: string;
  priority?: string;
  [key: string]: any;
}

interface IndexData {
  version: string;
  last_updated: string;
  total_count: {
    styles: number;
    colors: number;
    typography: number;
    ux_guidelines: number;
  };
  resources: Resource[];
}

function loadIndex(): IndexData {
  const indexPath = path.join(__dirname, "..", "index.json");

  if (!fs.existsSync(indexPath)) {
    console.error(`Error: Index file not found at ${indexPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(indexPath, "utf-8");
  return JSON.parse(content);
}

function calculateRelevance(item: Resource, query?: string): number {
  if (!query) return 0;

  const keywords = query.toLowerCase().split(/\s+/);
  let score = 0;

  keywords.forEach((kw) => {
    // Name matching (highest weight)
    if (item.name?.toLowerCase().includes(kw)) {
      score += 5;
    }

    // Keyword array matching (high weight)
    if (item.keywords?.some((k: string) => k.toLowerCase().includes(kw))) {
      score += 3;
    }

    // Description matching (medium weight)
    if (item.description?.toLowerCase().includes(kw)) {
      score += 2;
    }

    // Use cases matching (low weight)
    if (item.use_cases?.some((uc: string) => uc.toLowerCase().includes(kw))) {
      score += 1;
    }

    // ID matching (bonus)
    if (item.id?.toLowerCase().includes(kw)) {
      score += 1;
    }
  });

  return score;
}

function searchResources(options: SearchOptions): Resource[] {
  const index = loadIndex();
  let results = index.resources;

  // 1. Filter by domain
  if (options.domain) {
    results = results.filter(
      (item: Resource) => item.domain === options.domain,
    );
  }

  // 2. Filter by industry (for color palettes)
  if (options.industry) {
    results = results.filter(
      (item: Resource) =>
        item.industry?.toLowerCase() === options.industry?.toLowerCase(),
    );
  }

  // 3. Filter by priority (for UX guidelines)
  if (options.priority) {
    const priorityNormalized = options.priority.toLowerCase();
    results = results.filter(
      (item: Resource) => item.priority?.toLowerCase() === priorityNormalized,
    );
  }

  // 4. Keyword matching and scoring
  if (options.query) {
    results = results.map((item: Resource) => ({
      ...item,
      _relevance_score: calculateRelevance(item, options.query),
    }));

    // Filter out items with zero relevance
    results = results.filter((item: any) => item._relevance_score > 0);

    // Sort by relevance score (descending)
    results.sort((a: any, b: any) => b._relevance_score - a._relevance_score);
  }

  // 5. Limit results
  if (options.limit && options.limit > 0) {
    results = results.slice(0, options.limit);
  }

  return results;
}

function formatOutput(results: Resource[], verbose: boolean = false): string {
  if (results.length === 0) {
    return JSON.stringify(
      {
        count: 0,
        message: "No resources found matching the criteria",
      },
      null,
      2,
    );
  }

  if (verbose) {
    return JSON.stringify(
      {
        count: results.length,
        results: results,
      },
      null,
      2,
    );
  } else {
    // Compact output: only essential fields
    const compactResults = results.map((r) => ({
      id: r.id,
      name: r.name,
      domain: r.domain,
      file_path: r.file_path,
      description: r.description,
      ...(r._relevance_score !== undefined && {
        relevance: r._relevance_score,
      }),
    }));

    return JSON.stringify(
      {
        count: compactResults.length,
        results: compactResults,
      },
      null,
      2,
    );
  }
}

// CLI entry point
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
UI/UX Resource Search Tool

Usage:
  tsx search_resources.ts [OPTIONS]

Options:
  --domain <type>       Filter by domain: style | color | typography | ux-guideline
  --query <keywords>    Search keywords (supports multiple words)
  --industry <name>     Filter by industry (for color palettes)
  --priority <level>    Filter by priority: high | medium | low
  --limit <number>      Limit number of results
  --verbose, -v         Show full resource details

Examples:
  # Search for modern SaaS styles
  tsx search_resources.ts --domain style --query "modern SaaS"

  # Find fintech color palettes
  tsx search_resources.ts --domain color --industry fintech

  # Search typography with limit
  tsx search_resources.ts --domain typography --query "clean" --limit 3

  # High priority UX guidelines
  tsx search_resources.ts --domain ux-guideline --priority high
    `);
    process.exit(0);
  }

  const options: SearchOptions = {};
  let verbose = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === "--domain" && nextArg) {
      options.domain = nextArg as any;
      i++;
    } else if (arg === "--query" && nextArg) {
      options.query = nextArg;
      i++;
    } else if (arg === "--industry" && nextArg) {
      options.industry = nextArg;
      i++;
    } else if (arg === "--priority" && nextArg) {
      options.priority = nextArg as any;
      i++;
    } else if (arg === "--limit" && nextArg) {
      options.limit = parseInt(nextArg, 10);
      i++;
    } else if (arg === "--verbose" || arg === "-v") {
      verbose = true;
    }
  }

  try {
    const results = searchResources(options);
    const output = formatOutput(results, verbose);
    console.log(output);
    process.exit(0);
  } catch (error) {
    console.error("Search error:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { searchResources, SearchOptions, Resource };
