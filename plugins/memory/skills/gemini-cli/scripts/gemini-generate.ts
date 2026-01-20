#!/usr/bin/env bun
/**
 * Gemini CLI Generator Script
 * Executes document generation tasks using Gemini CLI
 */

import { readFile, writeFile, mkdir, readdir, stat } from "fs/promises";
import { join, dirname, basename, extname } from "path";
import { spawn } from "child_process";

type GenerationType =
  | "skill_index"
  | "doc_summary"
  | "design_tokens"
  | "workflow_summary";
type OutputFormat = "markdown" | "json" | "yaml";

interface GenerationConfig {
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
  generation_types: Record<
    GenerationType,
    {
      name: string;
      description: string;
      output_formats: OutputFormat[];
      [key: string]: unknown;
    }
  >;
  prompt_templates: Record<
    GenerationType,
    {
      system: string;
      task_prefix: string;
      output_instruction: string;
    }
  >;
  fallback: {
    enabled: boolean;
    strategies: Record<string, { action: string; [key: string]: unknown }>;
    codex_fallback: {
      enabled: boolean;
      simplified_prompt: boolean;
      quality_warning: string;
    };
  };
}

interface GenerationRequest {
  type: GenerationType;
  prompt: string;
  input_files?: string[];
  input_directory?: string;
  output_format?: OutputFormat;
  session_id?: string;
  level?: number;
}

interface GenerationResult {
  success: boolean;
  output?: string;
  format: OutputFormat;
  error?: string;
  fallback_used?: boolean;
}

async function loadConfig(): Promise<GenerationConfig> {
  const configPath = join(import.meta.dir, "../assets/gemini-config.json");
  const content = await readFile(configPath, "utf-8");
  return JSON.parse(content);
}

async function readInputFiles(files: string[]): Promise<string> {
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

async function scanDirectory(dirPath: string): Promise<string[]> {
  const files: string[] = [];

  async function scan(currentPath: string) {
    const entries = await readdir(currentPath);

    for (const entry of entries) {
      const fullPath = join(currentPath, entry);
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        if (!entry.startsWith(".") && entry !== "node_modules") {
          await scan(fullPath);
        }
      } else if (stats.isFile()) {
        const ext = extname(entry).toLowerCase();
        if (
          [
            ".md",
            ".ts",
            ".js",
            ".tsx",
            ".jsx",
            ".json",
            ".yaml",
            ".yml",
          ].includes(ext)
        ) {
          files.push(fullPath);
        }
      }
    }
  }

  await scan(dirPath);
  return files;
}

function buildPrompt(
  request: GenerationRequest,
  config: GenerationConfig,
  inputContent: string,
): string {
  const template = config.prompt_templates[request.type];
  let prompt = template.system + "\n\n";

  // Add task prefix
  prompt += template.task_prefix;

  // Add input content
  if (inputContent) {
    prompt += "\n## Input Content\n" + inputContent;
  }

  // Add custom prompt
  if (request.prompt) {
    prompt += "\n## Additional Instructions\n" + request.prompt;
  }

  // Add level specification for skill_index
  if (request.type === "skill_index" && request.level) {
    prompt += `\n\n请生成 Level ${request.level} 详细度的索引。`;
  }

  // Add output instruction
  const outputInstruction = template.output_instruction.replace(
    "{format}",
    request.output_format || "markdown",
  );
  prompt += outputInstruction;

  return prompt;
}

async function executeGemini(
  prompt: string,
  inputFiles: string[],
  config: GenerationConfig,
): Promise<{ success: boolean; output?: string; error?: string }> {
  return new Promise((resolve) => {
    const args = [...config.cli.default_flags.slice(0, 1), prompt];

    // Add sandbox flag and input files
    if (inputFiles.length > 0) {
      args.push("--sandbox");
      args.push(...inputFiles);
    }

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
  inputFiles: string[],
  config: GenerationConfig,
): Promise<{ success: boolean; output?: string; error?: string }> {
  const { max_attempts, backoff_multiplier, initial_delay_ms } =
    config.cli.retry;

  let lastError = "";
  let delay = initial_delay_ms;

  for (let attempt = 1; attempt <= max_attempts; attempt++) {
    const result = await executeGemini(prompt, inputFiles, config);

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

async function codexFallback(
  request: GenerationRequest,
  config: GenerationConfig,
): Promise<{ success: boolean; output?: string; error?: string }> {
  if (!config.fallback.codex_fallback.enabled) {
    return { success: false, error: "Codex fallback disabled" };
  }

  console.log("Using Codex fallback...");
  console.warn(config.fallback.codex_fallback.quality_warning);

  // Build simplified prompt for Codex
  const simplifiedPrompt = `分析以下内容并生成文档:

${request.prompt}

输出格式: ${request.output_format || "markdown"}`;

  return new Promise((resolve) => {
    const args = [
      "--approval-mode",
      "full-auto",
      "--full-stdout",
      simplifiedPrompt,
    ];

    const proc = spawn("codex", args, {
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

async function localFallback(
  request: GenerationRequest,
): Promise<{ success: boolean; output?: string; error?: string }> {
  console.log("Using local fallback generation...");

  // Basic template-based fallback
  const results: string[] = [];
  results.push("# Generated Document (Fallback Mode)\n");
  results.push("⚠️ Using local generation - quality may be limited\n");

  if (request.type === "skill_index" && request.input_directory) {
    results.push(`\n## SKILL Index\n`);
    results.push(`Directory: ${request.input_directory}\n`);

    try {
      const files = await scanDirectory(request.input_directory);
      const skillFiles = files.filter((f) => f.endsWith("SKILL.md"));

      for (const skillFile of skillFiles) {
        const content = await readFile(skillFile, "utf-8");
        const nameMatch = content.match(/^name:\s*(.+)$/m);
        const descMatch = content.match(/^description:\s*\|?\s*(.+)$/m);

        const name = nameMatch
          ? nameMatch[1].trim()
          : basename(dirname(skillFile));
        const desc = descMatch ? descMatch[1].trim() : "No description";

        results.push(`\n### ${name}\n`);
        results.push(`${desc}\n`);
      }
    } catch (err) {
      results.push("\nError scanning directory\n");
    }
  } else if (request.input_files && request.input_files.length > 0) {
    results.push(`\n## Document Summary\n`);

    for (const file of request.input_files) {
      try {
        const content = await readFile(file, "utf-8");
        const lines = content.split("\n");
        const firstParagraph = lines.slice(0, 10).join("\n");

        results.push(`\n### ${basename(file)}\n`);
        results.push(`Lines: ${lines.length}\n`);
        results.push(`Preview:\n${firstParagraph}...\n`);
      } catch {
        results.push(`\n### ${basename(file)}\nError: Could not read file\n`);
      }
    }
  }

  return { success: true, output: results.join("\n") };
}

async function generate(request: GenerationRequest): Promise<GenerationResult> {
  const config = await loadConfig();
  const format = request.output_format || "markdown";

  // Validate generation type
  if (!config.generation_types[request.type]) {
    return {
      success: false,
      format,
      error: `Unknown generation type: ${request.type}`,
    };
  }

  // Collect input files
  let inputFiles: string[] = [];
  if (request.input_files) {
    inputFiles = request.input_files;
  } else if (request.input_directory) {
    inputFiles = await scanDirectory(request.input_directory);
  }

  // Read input content
  const inputContent = await readInputFiles(inputFiles.slice(0, 20)); // Limit to 20 files

  // Build prompt
  const prompt = buildPrompt(request, config, inputContent);

  // Execute with retry
  let result = await executeWithRetry(prompt, inputFiles, config);

  // Try Codex fallback if failed
  if (!result.success && config.fallback.enabled) {
    console.log("Primary generation failed, trying Codex fallback...");
    result = await codexFallback(request, config);

    if (result.success) {
      return {
        success: true,
        output: result.output,
        format,
        fallback_used: true,
      };
    }

    // Try local fallback
    console.log("Codex fallback failed, trying local fallback...");
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
  result: GenerationResult,
  outputPath: string,
): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });

  let content: string;
  if (result.format === "json" && result.output) {
    try {
      const parsed = JSON.parse(result.output);
      content = JSON.stringify(parsed, null, 2);
    } catch {
      content = result.output;
    }
  } else if (result.format === "yaml" && result.output) {
    content = result.output;
  } else {
    content = result.output || "";
  }

  await writeFile(outputPath, content, "utf-8");
}

// CLI
const args = process.argv.slice(2);

function printUsage() {
  console.log(`Usage: gemini-generate.ts <type> [options]

Generation Types:
  skill_index        Generate SKILL.md index with progressive loading
  doc_summary        Generate structured document summary
  design_tokens      Extract design system tokens
  workflow_summary   Summarize workflow session

Options:
  --prompt <text>        Additional generation instructions
  --files <paths>        Comma-separated list of input files
  --dir <path>           Input directory to scan
  --format <format>      Output format: markdown|json|yaml (default: markdown)
  --output <path>        Output file path
  --level <1-4>          Index detail level for skill_index (default: 1)
  --session <id>         Session ID for workflow_summary

Examples:
  gemini-generate.ts skill_index --dir plugins/memory/skills/ --level 2
  gemini-generate.ts doc_summary --files README.md,CONTRIBUTING.md
  gemini-generate.ts design_tokens --files src/styles/theme.ts --format yaml
  gemini-generate.ts workflow_summary --session abc123 --format markdown
`);
}

if (args.length === 0 || args.includes("--help")) {
  printUsage();
  process.exit(0);
}

const generationType = args[0] as GenerationType;

// Parse options
function getArg(name: string): string | undefined {
  const idx = args.indexOf(name);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

const request: GenerationRequest = {
  type: generationType,
  prompt: getArg("--prompt") || "",
  input_files: getArg("--files")?.split(","),
  input_directory: getArg("--dir"),
  output_format: (getArg("--format") as OutputFormat) || "markdown",
  session_id: getArg("--session"),
  level: getArg("--level") ? parseInt(getArg("--level")!, 10) : undefined,
};

const outputPath = getArg("--output");

generate(request)
  .then(async (result) => {
    if (result.success) {
      if (outputPath) {
        await saveResult(result, outputPath);
        console.log(`Generated output saved to: ${outputPath}`);
      } else {
        console.log(result.output);
      }

      if (result.fallback_used) {
        console.warn(
          "\n⚠️ Fallback generation was used - quality may be limited",
        );
      }
    } else {
      console.error("Generation failed:", result.error);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
