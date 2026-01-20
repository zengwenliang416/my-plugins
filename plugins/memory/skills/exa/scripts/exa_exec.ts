#!/usr/bin/env bun
/**
 * Memory Plugin - Exa Search Executor
 *
 * Usage:
 *   bun run exa_exec.ts --query "search query" --category auto --limit 5
 */

import { parseArgs } from "util";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: "official" | "github" | "blog" | "other";
  relevance: number;
}

interface SearchResponse {
  query: string;
  category: string;
  results: SearchResult[];
  metadata: {
    total_found: number;
    returned: number;
    search_time_ms: number;
  };
}

const CATEGORY_TEMPLATES: Record<string, (query: string) => string> = {
  "best-practices": (q) => `${q} best practices production 2024`,
  docs: (q) => `${q} API documentation official`,
  examples: (q) => `${q} example implementation github`,
  tutorials: (q) => `${q} tutorial step by step`,
};

function detectCategory(query: string): string {
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes("how to") || lowerQuery.includes("tutorial")) {
    return "tutorials";
  }
  if (
    lowerQuery.includes("docs") ||
    lowerQuery.includes("reference") ||
    lowerQuery.includes("api")
  ) {
    return "docs";
  }
  if (
    lowerQuery.includes("best") ||
    lowerQuery.includes("pattern") ||
    lowerQuery.includes("practice")
  ) {
    return "best-practices";
  }
  if (lowerQuery.includes("example") || lowerQuery.includes("github")) {
    return "examples";
  }
  return "best-practices"; // default
}

function enhanceQuery(query: string, category: string): string {
  const template = CATEGORY_TEMPLATES[category];
  if (template) {
    return template(query);
  }
  return query;
}

function classifySource(url: string): SearchResult["source"] {
  if (url.includes("github.com")) return "github";
  if (
    url.includes(".dev") ||
    url.includes(".io") ||
    url.includes("docs.") ||
    url.includes(".org")
  ) {
    return "official";
  }
  if (
    url.includes("medium.com") ||
    url.includes("dev.to") ||
    url.includes("blog")
  ) {
    return "blog";
  }
  return "other";
}

async function searchExa(
  query: string,
  category: string,
  limit: number,
): Promise<SearchResponse> {
  const startTime = Date.now();

  const actualCategory = category === "auto" ? detectCategory(query) : category;
  const enhancedQuery = enhanceQuery(query, actualCategory);

  // Use Exa API
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    throw new Error("EXA_API_KEY environment variable not set");
  }

  const response = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      query: enhancedQuery,
      numResults: limit,
      useAutoprompt: true,
      type: "neural",
    }),
  });

  if (!response.ok) {
    throw new Error(`Exa API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const endTime = Date.now();

  const results: SearchResult[] = (data.results || []).map(
    (r: any, index: number) => ({
      title: r.title || "Untitled",
      url: r.url,
      snippet: r.text?.substring(0, 300) || "",
      source: classifySource(r.url),
      relevance: 1 - index * 0.1, // Simple relevance score
    }),
  );

  return {
    query: query,
    category: actualCategory,
    results,
    metadata: {
      total_found: data.autopromptString ? 100 : results.length,
      returned: results.length,
      search_time_ms: endTime - startTime,
    },
  };
}

async function main() {
  const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      query: { type: "string", short: "q" },
      category: { type: "string", short: "c", default: "auto" },
      limit: { type: "string", short: "l", default: "5" },
    },
  });

  if (!values.query) {
    console.error("Error: --query is required");
    process.exit(1);
  }

  try {
    const result = await searchExa(
      values.query,
      values.category || "auto",
      parseInt(values.limit || "5", 10),
    );
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Search failed:", error);
    process.exit(1);
  }
}

main();
