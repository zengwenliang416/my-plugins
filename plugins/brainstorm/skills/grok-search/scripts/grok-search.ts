#!/usr/bin/env npx tsx
/**
 * Grok Search CLI - TypeScript Version
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { parseArgs } from "node:util";
import { ProxyAgent, type Dispatcher } from "undici";

// ============ Proxy Support ============
function getProxyUrl(): string | undefined {
  return (
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    process.env.ALL_PROXY
  );
}

function getProxyDispatcher(): Dispatcher | undefined {
  const proxyUrl = getProxyUrl();
  if (proxyUrl) {
    return new ProxyAgent(proxyUrl);
  }
  return undefined;
}

// ============ Types ============
interface GrokResult {
  ok: boolean;
  data: unknown;
  error?: { message: string; type: string };
}

interface SearchItem {
  title: string;
  url: string;
  description?: string;
}

interface ConfigInfo {
  GROK_API_URL: string;
  GROK_API_KEY: string;
  GROK_MODEL: string;
  GROK_DEBUG: boolean;
  config_status: string;
  connection_test?: ConnectionTest;
}

interface ConnectionTest {
  status: string;
  message?: string;
  response_time_ms?: number;
  available_models?: string[];
}

// ============ Config ============
class Config {
  private static instance: Config | null = null;
  private configFilePath: string | null = null;
  private cachedModel: string | null = null;

  private readonly DEFAULT_MODEL = "grok-4-fast";
  private readonly SETUP_COMMAND = `Please set environment variables:
export GROK_API_URL="https://your-api-endpoint.com/v1"
export GROK_API_KEY="your-api-key"`;

  private constructor() {}

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  get configFile(): string {
    if (!this.configFilePath) {
      const configDir = join(homedir(), ".config", "grok-search");
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }
      this.configFilePath = join(configDir, "config.json");
    }
    return this.configFilePath;
  }

  private loadConfigFile(): Record<string, unknown> {
    if (!existsSync(this.configFile)) return {};
    try {
      return JSON.parse(readFileSync(this.configFile, "utf-8"));
    } catch {
      return {};
    }
  }

  private saveConfigFile(data: Record<string, unknown>): void {
    writeFileSync(this.configFile, JSON.stringify(data, null, 2), "utf-8");
  }

  get debugEnabled(): boolean {
    const v = process.env.GROK_DEBUG?.toLowerCase() ?? "";
    return ["true", "1", "yes"].includes(v);
  }

  get retryMaxAttempts(): number {
    const val = parseInt(process.env.GROK_RETRY_MAX_ATTEMPTS ?? "3", 10);
    return Math.max(1, Math.min(val, 5));
  }

  get retryMultiplier(): number {
    const val = parseFloat(process.env.GROK_RETRY_MULTIPLIER ?? "1");
    return Math.max(0.5, Math.min(val, 5.0));
  }

  get retryMaxWait(): number {
    const val = parseInt(process.env.GROK_RETRY_MAX_WAIT ?? "10", 10);
    return Math.max(1, Math.min(val, 30));
  }

  get grokApiUrl(): string {
    const url = process.env.GROK_API_URL;
    if (!url)
      throw new Error(`GROK_API_URL not configured!\n${this.SETUP_COMMAND}`);
    return url;
  }

  get grokApiKey(): string {
    const key = process.env.GROK_API_KEY;
    if (!key)
      throw new Error(`GROK_API_KEY not configured!\n${this.SETUP_COMMAND}`);
    return key;
  }

  get logLevel(): string {
    return (process.env.GROK_LOG_LEVEL ?? "INFO").toUpperCase();
  }

  get logDir(): string {
    const dir = process.env.GROK_LOG_DIR ?? "logs";
    if (dir.startsWith("/")) return dir;
    return join(homedir(), ".config", "grok-search", dir);
  }

  get grokModel(): string {
    if (this.cachedModel) return this.cachedModel;
    const data = this.loadConfigFile();
    const fileModel = data.model as string | undefined;
    if (fileModel) {
      this.cachedModel = fileModel;
      return fileModel;
    }
    this.cachedModel = this.DEFAULT_MODEL;
    return this.DEFAULT_MODEL;
  }

  setModel(model: string): void {
    const data = this.loadConfigFile();
    data.model = model;
    this.saveConfigFile(data);
    this.cachedModel = model;
  }

  private maskApiKey(key: string): string {
    if (!key || key.length <= 8) return "***";
    return `${key.slice(0, 4)}${"*".repeat(key.length - 8)}${key.slice(-4)}`;
  }

  getConfigInfo(): ConfigInfo {
    let apiUrl = "Not configured";
    let apiKeyMasked = "Not configured";
    let configStatus = "Not configured";
    try {
      apiUrl = this.grokApiUrl;
      apiKeyMasked = this.maskApiKey(this.grokApiKey);
      configStatus = "Configuration complete";
    } catch (e) {
      configStatus = `Error: ${e instanceof Error ? e.message : String(e)}`;
    }
    return {
      GROK_API_URL: apiUrl,
      GROK_API_KEY: apiKeyMasked,
      GROK_MODEL: this.grokModel,
      GROK_DEBUG: this.debugEnabled,
      config_status: configStatus,
    };
  }
}

const config = Config.getInstance();

// ============ Logging ============
function logInfo(message: string, isDebug = false): void {
  if (!isDebug) return;
  const logDir = config.logDir;
  if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const logFile = join(logDir, `grok_search_${date}.log`);
  const timestamp = new Date().toISOString();
  appendFileSync(logFile, `${timestamp} - INFO - ${message}\n`, "utf-8");
}

// ============ Time Context ============
const TIME_KEYWORDS = new Set([
  "current",
  "now",
  "today",
  "tomorrow",
  "yesterday",
  "this week",
  "last week",
  "next week",
  "this month",
  "last month",
  "this year",
  "last year",
  "latest",
  "recent",
  "recently",
  "real-time",
  "up-to-date",
]);

function needsTimeContext(query: string): boolean {
  const q = query.toLowerCase();
  return Array.from(TIME_KEYWORDS).some(
    (kw) => query.includes(kw) || q.includes(kw),
  );
}

function getLocalTimeInfo(): string {
  const now = new Date();
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return `[Time Context] ${dateStr} (${weekdays[now.getDay()]}) ${timeStr}`;
}

// ============ Retry Logic ============
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

function isRetryableError(status: number): boolean {
  return RETRYABLE_STATUS_CODES.has(status);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateWait(
  attempt: number,
  multiplier: number,
  maxWait: number,
): number {
  const base = Math.min(maxWait, multiplier * Math.pow(2, attempt));
  const jitter = Math.random() * 0.5 * base;
  return Math.min(maxWait, base + jitter) * 1000;
}

function parseRetryAfter(headers: Headers): number | null {
  const header = headers.get("Retry-After");
  if (!header) return null;
  const trimmed = header.trim();
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10) * 1000;
  try {
    const dt = new Date(trimmed);
    return Math.max(0, dt.getTime() - Date.now());
  } catch {
    return null;
  }
}

// ============ Prompts ============
const SEARCH_PROMPT = `# Role: Search Assistant
- Output: JSON array [{title, url, description}]
- Rules: Valid JSON only, no markdown fence`;

const FETCH_PROMPT = `# Role: Web Content Fetcher
- Output: Structured Markdown
- Rules: Extract main content, remove scripts/ads`;

// ============ Provider ============
class GrokSearchProvider {
  constructor(
    private apiUrl: string,
    private apiKey: string,
    private model: string = "grok-4-fast",
  ) {}

  async search(
    query: string,
    platform = "",
    minResults = 3,
    maxResults = 10,
  ): Promise<string> {
    const platformHint = platform ? `\nFocus on: ${platform}` : "";
    const resultHint = `\nReturn ${minResults}-${maxResults} results.`;
    const timeCtx = needsTimeContext(query) ? `${getLocalTimeInfo()}\n` : "";
    const payload = {
      model: this.model,
      messages: [
        { role: "system", content: SEARCH_PROMPT },
        { role: "user", content: timeCtx + query + platformHint + resultHint },
      ],
      stream: true,
    };
    if (config.debugEnabled) logInfo(`search query: ${query}`, true);
    return this.executeStream(payload);
  }

  async fetch(url: string): Promise<string> {
    const payload = {
      model: this.model,
      messages: [
        { role: "system", content: FETCH_PROMPT },
        { role: "user", content: `Fetch and convert to Markdown: ${url}` },
      ],
      stream: true,
    };
    return this.executeStream(payload);
  }

  private async parseStreamingResponse(response: Response): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) return "";
    const decoder = new TextDecoder();
    const contentParts: string[] = [];
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        if (trimmed === "data: [DONE]" || trimmed === "data:[DONE]") continue;
        try {
          const data = JSON.parse(trimmed.slice(5).trimStart());
          const choices = data.choices ?? [];
          if (choices.length > 0) {
            const delta = choices[0].delta ?? {};
            if (delta.content) contentParts.push(delta.content);
          }
        } catch {
          continue;
        }
      }
    }
    const content = contentParts.join("");
    if (config.debugEnabled)
      logInfo(`response length: ${content.length}`, true);
    return content;
  }

  private async executeStream(
    payload: Record<string, unknown>,
  ): Promise<string> {
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
    const url = `${this.apiUrl.replace(/\/+$/, "")}/chat/completions`;
    const maxAttempts = config.retryMaxAttempts;
    const multiplier = config.retryMultiplier;
    const maxWait = config.retryMaxWait;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      try {
        const fetchOptions: RequestInit & { dispatcher?: Dispatcher } = {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
          redirect: "error",
        };
        const dispatcher = getProxyDispatcher();
        if (dispatcher) {
          fetchOptions.dispatcher = dispatcher;
        }
        const response = await fetch(url, fetchOptions as RequestInit);
        clearTimeout(timeoutId);
        if (!response.ok) {
          if (isRetryableError(response.status) && attempt < maxAttempts - 1) {
            const retryAfter = parseRetryAfter(response.headers);
            const waitTime =
              retryAfter ?? calculateWait(attempt, multiplier, maxWait);
            await sleep(waitTime);
            continue;
          }
          throw new Error(`HTTP ${response.status}`);
        }
        return await this.parseStreamingResponse(response);
      } catch (err) {
        clearTimeout(timeoutId);
        if (attempt === maxAttempts - 1) throw err;
        const waitTime = calculateWait(attempt, multiplier, maxWait);
        await sleep(waitTime);
      }
    }
    throw new Error("Max retries exceeded");
  }
}

// ============ Result Helpers ============
function success(data: unknown): GrokResult {
  return { ok: true, data };
}

function error(message: string, type: string, data: unknown): GrokResult {
  return { ok: false, data, error: { message, type } };
}

function handleException(err: unknown, defaultData: unknown): GrokResult {
  if (err instanceof Error) {
    if (err.message.includes("GROK_API"))
      return error(err.message, "config_error", defaultData);
    if (err.message.startsWith("HTTP "))
      return error(err.message, "http_error", defaultData);
    return error(`Network error: ${err.message}`, "network_error", defaultData);
  }
  return error(`Unknown error: ${String(err)}`, "unknown_error", defaultData);
}

function buildProvider(): GrokSearchProvider {
  return new GrokSearchProvider(
    config.grokApiUrl,
    config.grokApiKey,
    config.grokModel,
  );
}

// ============ Commands ============
async function testConnection(
  apiUrl: string,
  apiKey: string,
): Promise<ConnectionTest> {
  const result: ConnectionTest = { status: "Not tested" };
  const start = Date.now();
  try {
    const testFetchOptions: RequestInit & { dispatcher?: Dispatcher } = {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    };
    const dispatcher = getProxyDispatcher();
    if (dispatcher) {
      testFetchOptions.dispatcher = dispatcher;
    }
    const resp = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/models`,
      testFetchOptions as RequestInit,
    );
    const elapsed = Date.now() - start;
    if (resp.ok) {
      result.status = "Connection successful";
      result.response_time_ms = elapsed;
      try {
        const data = (await resp.json()) as { data?: { id: string }[] };
        result.available_models = data.data?.map((m) => m.id) ?? [];
      } catch {}
    } else {
      result.status = `HTTP ${resp.status}`;
    }
  } catch (e) {
    result.status =
      e instanceof Error && e.name === "TimeoutError"
        ? "Connection timeout"
        : `Error: ${String(e)}`;
  }
  return result;
}

async function cmdSearch(
  query: string,
  platform: string,
  minResults: number,
  maxResults: number,
): Promise<GrokResult> {
  const minR = Math.max(1, minResults);
  let maxR = Math.max(1, maxResults);
  if (maxR < minR) maxR = minR;
  try {
    const provider = buildProvider();
    const resultText = await provider.search(query, platform, minR, maxR);
    if (!resultText.trim())
      return error("Search response is empty", "empty_response", []);
    let data: unknown;
    try {
      data = JSON.parse(resultText);
    } catch {
      return error("Search result is not valid JSON", "json_decode_error", []);
    }
    if (!Array.isArray(data))
      return error("Search result is not an array", "invalid_result", []);
    return success(data as SearchItem[]);
  } catch (err) {
    return handleException(err, []);
  }
}

async function cmdFetch(url: string): Promise<GrokResult> {
  try {
    const provider = buildProvider();
    const resultText = await provider.fetch(url);
    if (!resultText.trim())
      return error("Response content is empty", "empty_response", "");
    return success(resultText);
  } catch (err) {
    return handleException(err, "");
  }
}

async function cmdConfig(): Promise<GrokResult> {
  const info = config.getConfigInfo();
  try {
    const apiUrl = config.grokApiUrl;
    const apiKey = config.grokApiKey;
    info.connection_test = await testConnection(apiUrl, apiKey);
    return success(info);
  } catch (err) {
    return error(
      err instanceof Error ? err.message : String(err),
      "config_error",
      info,
    );
  }
}

async function cmdModel(name: string): Promise<GrokResult> {
  try {
    const previous = config.grokModel;
    config.setModel(name);
    return success({
      previous_model: previous,
      current_model: name,
      config_file: config.configFile,
    });
  } catch (err) {
    return handleException(err, {});
  }
}

function findProjectRoot(): string {
  let root = process.cwd();
  while (true) {
    if (existsSync(join(root, ".git"))) return root;
    const parent = dirname(root);
    if (parent === root) break;
    root = parent;
  }
  return process.cwd();
}

async function cmdToggle(action: string): Promise<GrokResult> {
  const act = action || "status";
  const root = findProjectRoot();
  const settingsPath = join(root, ".claude", "settings.json");
  const tools = ["WebFetch", "WebSearch"];
  let settings: Record<string, unknown> = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
    } catch {}
  }
  const permissions = (settings.permissions as Record<string, unknown>) ?? {};
  settings.permissions = permissions;
  const deny = (permissions.deny as string[]) ?? [];
  permissions.deny = deny;

  let blocked = tools.every((t) => deny.includes(t));
  let msg: string;

  if (act === "on" || act === "enable") {
    for (const t of tools) {
      if (!deny.includes(t)) deny.push(t);
    }
    blocked = true;
    msg = "Built-in tools disabled";
  } else if (act === "off" || act === "disable") {
    const filtered = deny.filter((t) => !tools.includes(t));
    deny.length = 0;
    deny.push(...filtered);
    blocked = false;
    msg = "Built-in tools enabled";
  } else {
    msg = blocked ? "Built-in tools disabled" : "Built-in tools enabled";
  }

  if (["on", "enable", "off", "disable"].includes(act)) {
    const dir = dirname(settingsPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
  }

  return success({
    blocked,
    deny_list: deny,
    file: settingsPath,
    message: msg,
  });
}

// ============ CLI ============
function printUsage(): void {
  console.log(`Usage: grok-search.ts <command> [options]

Commands:
  search <query>         Web search
    --platform <name>    Focus platform
    --min-results <n>    Min results (default: 3)
    --max-results <n>    Max results (default: 10)

  fetch <url>            Fetch web content

  config                 Show config and test connection

  model <name>           Switch model

  toggle [on|off|status] Toggle built-in tools`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    printUsage();
    process.exit(0);
  }

  const command = args[0];
  let result: GrokResult;

  try {
    switch (command) {
      case "search": {
        const { values, positionals } = parseArgs({
          args: args.slice(1),
          options: {
            platform: { type: "string", default: "" },
            "min-results": { type: "string", default: "3" },
            "max-results": { type: "string", default: "10" },
          },
          allowPositionals: true,
        });
        const query = positionals[0];
        if (!query) {
          result = error("Missing search query", "argument_error", {});
          break;
        }
        result = await cmdSearch(
          query,
          values.platform ?? "",
          parseInt(values["min-results"] ?? "3", 10),
          parseInt(values["max-results"] ?? "10", 10),
        );
        break;
      }
      case "fetch": {
        const url = args[1];
        if (!url) {
          result = error("Missing URL parameter", "argument_error", {});
          break;
        }
        result = await cmdFetch(url);
        break;
      }
      case "config":
        result = await cmdConfig();
        break;
      case "model": {
        const name = args[1];
        if (!name) {
          result = error("Missing model name", "argument_error", {});
          break;
        }
        result = await cmdModel(name);
        break;
      }
      case "toggle":
        result = await cmdToggle(args[1] ?? "status");
        break;
      default:
        result = error(`Unknown command: ${command}`, "argument_error", {});
    }
  } catch (err) {
    result = error(
      `Runtime error: ${err instanceof Error ? err.message : String(err)}`,
      "runtime_error",
      {},
    );
  }

  console.log(JSON.stringify(result, null, 2));
}

main();
