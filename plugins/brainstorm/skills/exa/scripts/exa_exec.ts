#!/usr/bin/env npx tsx
/**
 * Exa CLI - AI-native search engine wrapper
 */

interface ExaResult {
  ok: boolean;
  command: string;
  input: Record<string, unknown>;
  data?: {
    results?: Array<{
      title: string;
      url: string;
      publishedDate?: string;
      author?: string;
      text?: string;
      score?: number;
    }>;
    answer?: string;
    citations?: Array<{
      url: string;
      title?: string;
    }>;
  };
  error?: {
    code: string;
    message: string;
    suggestion?: string;
  };
  meta: {
    elapsedMs: number;
  };
}

interface SearchOptions {
  query: string;
  numResults: number;
  text: boolean;
  includeDomains?: string[];
  excludeDomains?: string[];
  startPublishedDate?: string;
  endPublishedDate?: string;
  category?: string;
}

interface SimilarOptions {
  url: string;
  numResults: number;
  text: boolean;
}

interface AnswerOptions {
  query: string;
}

interface ResearchOptions {
  topic: string;
  depth: "short" | "deep";
}

const API_BASE = "https://api.exa.ai";

function getApiKey(): string | null {
  return process.env.EXA_API_KEY || null;
}

async function apiRequest(
  endpoint: string,
  body: Record<string, unknown>,
  apiKey: string,
): Promise<unknown> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

async function runSearch(
  options: SearchOptions,
  apiKey: string,
): Promise<ExaResult> {
  const startTime = Date.now();
  const body: Record<string, unknown> = {
    query: options.query,
    numResults: options.numResults,
  };

  if (options.text) {
    body.text = true;
  }
  if (options.includeDomains?.length) {
    body.includeDomains = options.includeDomains;
  }
  if (options.excludeDomains?.length) {
    body.excludeDomains = options.excludeDomains;
  }
  if (options.startPublishedDate) {
    body.startPublishedDate = options.startPublishedDate;
  }
  if (options.endPublishedDate) {
    body.endPublishedDate = options.endPublishedDate;
  }
  if (options.category) {
    body.category = options.category;
  }

  const response = (await apiRequest("/search", body, apiKey)) as {
    results: Array<{
      title: string;
      url: string;
      publishedDate?: string;
      author?: string;
      text?: string;
      score?: number;
    }>;
  };

  return {
    ok: true,
    command: "search",
    input: { query: options.query },
    data: {
      results: response.results.map((r) => ({
        title: r.title,
        url: r.url,
        publishedDate: r.publishedDate,
        author: r.author,
        text: r.text,
        score: r.score,
      })),
    },
    meta: { elapsedMs: Date.now() - startTime },
  };
}

async function runSimilar(
  options: SimilarOptions,
  apiKey: string,
): Promise<ExaResult> {
  const startTime = Date.now();
  const body: Record<string, unknown> = {
    url: options.url,
    numResults: options.numResults,
  };

  if (options.text) {
    body.text = true;
  }

  const response = (await apiRequest("/findSimilar", body, apiKey)) as {
    results: Array<{
      title: string;
      url: string;
      publishedDate?: string;
      text?: string;
      score?: number;
    }>;
  };

  return {
    ok: true,
    command: "similar",
    input: { url: options.url },
    data: {
      results: response.results.map((r) => ({
        title: r.title,
        url: r.url,
        publishedDate: r.publishedDate,
        text: r.text,
        score: r.score,
      })),
    },
    meta: { elapsedMs: Date.now() - startTime },
  };
}

async function runAnswer(
  options: AnswerOptions,
  apiKey: string,
): Promise<ExaResult> {
  const startTime = Date.now();
  const body: Record<string, unknown> = {
    query: options.query,
    text: true,
  };

  const response = (await apiRequest("/answer", body, apiKey)) as {
    answer: string;
    citations?: Array<{ url: string; title?: string }>;
  };

  return {
    ok: true,
    command: "answer",
    input: { query: options.query },
    data: {
      answer: response.answer,
      citations: response.citations,
    },
    meta: { elapsedMs: Date.now() - startTime },
  };
}

async function runResearch(
  options: ResearchOptions,
  apiKey: string,
): Promise<ExaResult> {
  const startTime = Date.now();
  const body: Record<string, unknown> = {
    instructions: options.topic,
  };

  const response = (await apiRequest("/research", body, apiKey)) as {
    output?: unknown;
    answer?: string;
    citations?: Array<{ url: string; title?: string }>;
  };

  return {
    ok: true,
    command: "research",
    input: { topic: options.topic },
    data: {
      answer:
        typeof response.output === "string"
          ? response.output
          : (response.answer ?? JSON.stringify(response.output)),
      citations: response.citations,
    },
    meta: { elapsedMs: Date.now() - startTime },
  };
}

function createError(
  command: string,
  input: Record<string, unknown>,
  code: string,
  message: string,
  suggestion?: string,
): ExaResult {
  return {
    ok: false,
    command,
    input,
    error: { code, message, suggestion },
    meta: { elapsedMs: 0 },
  };
}

function printHelp() {
  console.log(`
Exa CLI - AI-native search engine

Usage:
  npx tsx exa_exec.ts <command> <query|url> [options]

Commands:
  search <query>     Semantic web search
  answer <query>     Get direct answer with citations
  similar <url>      Find similar pages
  research <topic>   Deep research

Options:
  --limit, -n <int>     Number of results (default: 5)
  --content             Include page text content
  --include <domains>   Comma-separated domains to include
  --exclude <domains>   Comma-separated domains to exclude
  --after <YYYY-MM-DD>  Published after date
  --before <YYYY-MM-DD> Published before date
  --category <type>     Filter: company/news/paper/tweet/github
  --depth <level>       Research depth: short/deep (default: short)
  --json                JSON output format
  --help, -h            Show help

Environment:
  EXA_API_KEY          Required API key

Examples:
  # Search with content
  exa_exec.ts search "React 19 hooks" --content --limit 10

  # Domain-filtered search
  exa_exec.ts search "Next.js API" --include react.dev,nextjs.org

  # Get answer
  exa_exec.ts answer "How to fix Node heap out of memory?"

  # Find similar
  exa_exec.ts similar https://github.com/vercel/next.js --content

  # Research
  exa_exec.ts research "Best TypeScript ORM 2025" --depth deep
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  const command = args[0];
  const target = args[1];
  let jsonOutput = false;
  let numResults = 5;
  let includeContent = false;
  let includeDomains: string[] = [];
  let excludeDomains: string[] = [];
  let startDate: string | undefined;
  let endDate: string | undefined;
  let category: string | undefined;
  let depth: "short" | "deep" = "short";

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--json":
        jsonOutput = true;
        break;
      case "--limit":
      case "-n":
        numResults = parseInt(args[++i], 10) || 5;
        break;
      case "--content":
        includeContent = true;
        break;
      case "--include":
        includeDomains = args[++i].split(",").map((d) => d.trim());
        break;
      case "--exclude":
        excludeDomains = args[++i].split(",").map((d) => d.trim());
        break;
      case "--after":
        startDate = args[++i];
        break;
      case "--before":
        endDate = args[++i];
        break;
      case "--category":
        category = args[++i];
        break;
      case "--depth":
        depth = args[++i] as "short" | "deep";
        break;
    }
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    const result = createError(
      command,
      { target },
      "CONFIG_MISSING_API_KEY",
      "EXA_API_KEY environment variable not set",
      "export EXA_API_KEY=your-api-key",
    );
    console.log(JSON.stringify(result, null, 2));
    process.exit(3);
  }

  if (!target && command !== "help") {
    const result = createError(
      command,
      {},
      "VALIDATION_ERROR",
      "Missing query or URL argument",
      `Usage: exa_exec.ts ${command} <query|url> [options]`,
    );
    console.log(JSON.stringify(result, null, 2));
    process.exit(2);
  }

  let result: ExaResult;

  try {
    switch (command) {
      case "search":
        result = await runSearch(
          {
            query: target,
            numResults,
            text: includeContent,
            includeDomains: includeDomains.length ? includeDomains : undefined,
            excludeDomains: excludeDomains.length ? excludeDomains : undefined,
            startPublishedDate: startDate,
            endPublishedDate: endDate,
            category,
          },
          apiKey,
        );
        break;

      case "similar":
        result = await runSimilar(
          {
            url: target,
            numResults,
            text: includeContent,
          },
          apiKey,
        );
        break;

      case "answer":
        result = await runAnswer({ query: target }, apiKey);
        break;

      case "research":
        result = await runResearch({ topic: target, depth }, apiKey);
        break;

      default:
        result = createError(
          command,
          { target },
          "UNKNOWN_COMMAND",
          `Unknown command: ${command}`,
          "Available commands: search, answer, similar, research",
        );
        console.log(JSON.stringify(result, null, 2));
        process.exit(2);
    }

    if (jsonOutput || true) {
      console.log(JSON.stringify(result, null, 2));
    }

    process.exit(result.ok ? 0 : 1);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isRateLimit = errorMessage.includes("429");
    const isAuth = errorMessage.includes("401") || errorMessage.includes("403");

    result = createError(
      command,
      { target },
      isRateLimit ? "RATE_LIMITED" : isAuth ? "AUTH_ERROR" : "API_ERROR",
      errorMessage,
      isRateLimit
        ? "Wait and retry, or reduce numResults"
        : isAuth
          ? "Check your EXA_API_KEY"
          : undefined,
    );

    console.log(JSON.stringify(result, null, 2));
    process.exit(isRateLimit ? 5 : isAuth ? 4 : 6);
  }
}

main();
