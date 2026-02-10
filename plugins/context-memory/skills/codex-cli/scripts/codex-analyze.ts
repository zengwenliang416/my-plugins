#!/usr/bin/env bun
/**
 * Codex CLI Analyzer Script
 * Executes code analysis tasks using Codex CLI
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

type AnalysisType =
  | "module_structure"
  | "call_chain"
  | "api_extraction"
  | "data_flow";
type OutputFormat = "markdown" | "json" | "mermaid";

interface AnalysisConfig {
  cli: {
    command: string;
    default_flags: string[];
    timeout_ms: number;
    retry: {
      max_attempts: number;
      backoff_multiplier: number;
      initial_delay_ms: number;
    };
  };
  analysis_types: Record<
    AnalysisType,
    {
      name: string;
      description: string;
      focus_areas: string[];
      output_formats: OutputFormat[];
    }
  >;
  prompt_templates: Record<
    AnalysisType,
    {
      system: string;
      task_prefix: string;
      output_instruction: string;
    }
  >;
  fallback: {
    enabled: boolean;
    strategies: Record<string, { action: string; [key: string]: unknown }>;
  };
}

interface AnalysisRequest {
  type: AnalysisType;
  prompt: string;
  context_files?: string[];
  output_format?: OutputFormat;
  function_name?: string;
  source?: string;
  target?: string;
}

interface AnalysisResult {
  success: boolean;
  output?: string;
  format: OutputFormat;
  error?: string;
  fallback_used?: boolean;
}

async function loadConfig(): Promise<AnalysisConfig> {
  const configPath = join(SCRIPT_DIR, "../assets/codex-config.json");
  const content = await readFile(configPath, "utf-8");
  return JSON.parse(content);
}

async function readContextFiles(files: string[]): Promise<string> {
  const contents: string[] = [];

  for (const file of files) {
    try {
      const content = await readFile(file, "utf-8");
      contents.push(`\n### File: ${file}\n\`\`\`\n${content}\n\`\`\`\n`);
    } catch (err) {
      console.warn(`Warning: Could not read file ${file}`);
    }
  }

  return contents.join("\n");
}

function buildPrompt(
  request: AnalysisRequest,
  config: AnalysisConfig,
  contextContent: string,
): string {
  const template = config.prompt_templates[request.type];
  let prompt = template.system + "\n\n";

  // Build task prefix with variable substitution
  let taskPrefix = template.task_prefix;
  if (request.function_name) {
    taskPrefix = taskPrefix.replace("{function_name}", request.function_name);
  }
  if (request.source) {
    taskPrefix = taskPrefix.replace("{source}", request.source);
  }
  if (request.target) {
    taskPrefix = taskPrefix.replace("{target}", request.target);
  }

  prompt += taskPrefix;

  // Add context
  if (contextContent) {
    prompt += "\n## Context Files\n" + contextContent;
  }

  // Add custom prompt
  if (request.prompt) {
    prompt += "\n## Additional Instructions\n" + request.prompt;
  }

  // Add output instruction
  const outputInstruction = template.output_instruction.replace(
    "{format}",
    request.output_format || "markdown",
  );
  prompt += outputInstruction;

  return prompt;
}

async function executeCodex(
  prompt: string,
  config: AnalysisConfig,
): Promise<{ success: boolean; output?: string; error?: string }> {
  return new Promise((resolve) => {
    const args = [...config.cli.default_flags, prompt];

    const proc = spawn(config.cli.command, args, {
      timeout: config.cli.timeout_ms,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true, output: stdout });
      } else {
        resolve({ success: false, error: stderr || `Exit code: ${code}` });
      }
    });

    proc.on("error", (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

async function executeWithRetry(
  prompt: string,
  config: AnalysisConfig,
): Promise<{ success: boolean; output?: string; error?: string }> {
  const { max_attempts, backoff_multiplier, initial_delay_ms } =
    config.cli.retry;

  let lastError = "";
  let delay = initial_delay_ms;

  for (let attempt = 1; attempt <= max_attempts; attempt++) {
    const result = await executeCodex(prompt, config);

    if (result.success) {
      return result;
    }

    lastError = result.error || "Unknown error";

    // Check if error is retryable
    if (
      lastError.includes("quota") ||
      lastError.includes("rate limit") ||
      lastError.includes("unauthorized")
    ) {
      break; // Don't retry quota/auth errors
    }

    if (attempt < max_attempts) {
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
      delay *= backoff_multiplier;
    }
  }

  return { success: false, error: lastError };
}

async function localFallback(
  request: AnalysisRequest,
): Promise<{ success: boolean; output?: string; error?: string }> {
  console.log("Using local fallback analysis...");

  // Basic pattern matching fallback
  if (!request.context_files || request.context_files.length === 0) {
    return { success: false, error: "No context files for fallback analysis" };
  }

  const results: string[] = [];
  results.push("# Fallback Analysis (Limited Capabilities)\n");
  results.push("⚠️ Using local analysis - semantic analysis not available\n");

  for (const file of request.context_files) {
    try {
      const content = await readFile(file, "utf-8");
      const lines = content.split("\n");

      results.push(`\n## File: ${file}\n`);
      results.push(`- Lines: ${lines.length}`);

      // Count exports
      const exports = lines.filter(
        (l) => l.includes("export") || l.includes("module.exports"),
      );
      results.push(`- Exports: ${exports.length}`);

      // Count imports
      const imports = lines.filter(
        (l) => l.includes("import ") || l.includes("require("),
      );
      results.push(`- Imports: ${imports.length}`);

      // Count functions
      const functions = lines.filter(
        (l) =>
          l.includes("function ") ||
          l.includes("async function") ||
          /\w+\s*=\s*(async\s*)?\([^)]*\)\s*=>/.test(l),
      );
      results.push(`- Functions: ${functions.length}`);

      // Count classes
      const classes = lines.filter((l) => l.includes("class "));
      results.push(`- Classes: ${classes.length}`);
    } catch (err) {
      results.push(`\n## File: ${file}\n- Error: Could not read file`);
    }
  }

  return { success: true, output: results.join("\n") };
}

async function analyze(request: AnalysisRequest): Promise<AnalysisResult> {
  const config = await loadConfig();
  const format = request.output_format || "markdown";

  // Validate analysis type
  if (!config.analysis_types[request.type]) {
    return {
      success: false,
      format,
      error: `Unknown analysis type: ${request.type}`,
    };
  }

  // Read context files
  const contextContent = request.context_files
    ? await readContextFiles(request.context_files)
    : "";

  // Build prompt
  const prompt = buildPrompt(request, config, contextContent);

  // Execute with retry
  let result = await executeWithRetry(prompt, config);

  // Try fallback if failed and enabled
  if (!result.success && config.fallback.enabled) {
    console.log("Primary analysis failed, trying fallback...");
    result = await localFallback(request);
    if (result.success) {
      return {
        success: true,
        output: result.output,
        format,
        fallback_used: true,
      };
    }
  }

  if (result.success) {
    return { success: true, output: result.output, format };
  }

  return { success: false, format, error: result.error };
}

async function saveResult(
  result: AnalysisResult,
  outputPath: string,
): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });

  let content: string;
  if (result.format === "json" && result.output) {
    try {
      // Try to parse and format as JSON
      const parsed = JSON.parse(result.output);
      content = JSON.stringify(parsed, null, 2);
    } catch {
      content = result.output;
    }
  } else {
    content = result.output || "";
  }

  await writeFile(outputPath, content, "utf-8");
}

// CLI
const args = process.argv.slice(2);

function printUsage() {
  console.log(`Usage: codex-analyze.ts <type> [options]

Analysis Types:
  module_structure   Analyze module structure and dependencies
  call_chain         Trace function call chains
  api_extraction     Extract API endpoints
  data_flow          Analyze data flow paths

Options:
  --prompt <text>        Additional analysis instructions
  --files <paths>        Comma-separated list of context files
  --format <format>      Output format: markdown|json|mermaid (default: markdown)
  --output <path>        Output file path
  --function <name>      Function name for call_chain analysis
  --source <path>        Source for data_flow analysis
  --target <path>        Target for data_flow analysis

Examples:
  codex-analyze.ts module_structure --files src/services/ --format json
  codex-analyze.ts call_chain --function handleRequest --files src/handlers/
  codex-analyze.ts api_extraction --files src/routes/ --format markdown
`);
}

if (args.length === 0 || args.includes("--help")) {
  printUsage();
  process.exit(0);
}

const analysisType = args[0] as AnalysisType;

// Parse options
function getArg(name: string): string | undefined {
  const idx = args.indexOf(name);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

const request: AnalysisRequest = {
  type: analysisType,
  prompt: getArg("--prompt") || "",
  context_files: getArg("--files")?.split(","),
  output_format: (getArg("--format") as OutputFormat) || "markdown",
  function_name: getArg("--function"),
  source: getArg("--source"),
  target: getArg("--target"),
};

const outputPath = getArg("--output");

analyze(request)
  .then(async (result) => {
    if (result.success) {
      if (outputPath) {
        await saveResult(result, outputPath);
        console.log(`Analysis saved to: ${outputPath}`);
      } else {
        console.log(result.output);
      }

      if (result.fallback_used) {
        console.warn("\n⚠️ Fallback analysis was used - limited capabilities");
      }
    } else {
      console.error("Analysis failed:", result.error);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
