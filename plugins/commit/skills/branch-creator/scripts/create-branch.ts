#!/usr/bin/env npx tsx

import * as fs from "fs";
import * as path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

type BranchStatus = "created" | "switched" | "reused" | "skipped";

interface Args {
  runDir: string;
  branchName?: string;
  skipBranch: boolean;
}

interface BranchInfo {
  previous_branch: string;
  new_branch: string;
  branch_type: BranchStatus;
  status: "success";
}

interface AnalysisLike {
  primary_type?: string;
  primaryType?: string;
  primary_scope?: string;
  primaryScope?: string;
  summary?: string;
  semantic_analysis?: { summary?: string };
  commitStrategy?: { reason?: string };
}

interface NamingConfig {
  format?: { max_length?: number };
  type_prefixes?: string[];
  stop_words?: string[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function usage(): string {
  return [
    "Usage: create-branch.ts --run-dir <dir> [--branch-name <name>] [--skip-branch]",
    "",
    "Options:",
    "  --run-dir <dir>       Runtime directory used to read/write workflow artifacts.",
    "  --branch-name <name>  Optional target branch name.",
    "  --skip-branch         Skip branch creation and only write branch-info.json.",
  ].join("\n");
}

function parseArgs(argv: string[]): Args {
  const args: Args = { runDir: "", skipBranch: false };

  for (let i = 0; i < argv.length; i++) {
    const current = argv[i];
    if (current === "--run-dir") {
      args.runDir = argv[++i] || "";
    } else if (current === "--branch-name") {
      args.branchName = argv[++i] || "";
    } else if (current === "--skip-branch") {
      args.skipBranch = true;
    } else if (current === "--help" || current === "-h") {
      console.log(usage());
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${current}`);
    }
  }

  if (!args.runDir) {
    throw new Error("--run-dir is required.");
  }

  return args;
}

function runGit(args: string[]): string {
  return execFileSync("git", args, { encoding: "utf-8" }).trim();
}

function isGitRepo(): boolean {
  try {
    const output = runGit(["rev-parse", "--is-inside-work-tree"]);
    return output === "true";
  } catch {
    return false;
  }
}

function branchExists(name: string): boolean {
  try {
    execFileSync("git", ["show-ref", "--verify", "--quiet", `refs/heads/${name}`], {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function readJsonSafe<T>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function sanitizeSegment(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-/]+|[-/]+$/g, "");
}

function normalizeBranchName(input: string): string {
  const sanitized = sanitizeSegment(input).replace(/\/+/g, "/");
  const [typeRaw, restRaw] = sanitized.includes("/")
    ? [sanitized.split("/")[0], sanitized.split("/").slice(1).join("/")]
    : ["feat", sanitized];
  const type = sanitizeSegment(typeRaw) || "feat";
  const rest = sanitizeSegment(restRaw || "general-update") || "general-update";
  return `${type}/${rest}`;
}

function extractKeywords(text: string, stopWords: Set<string>): string[] {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const filtered = tokens.filter((token) => token.length > 1 && !stopWords.has(token));
  return filtered.slice(0, 3);
}

function buildBranchName(runDir: string, explicitName: string | undefined): string {
  if (explicitName && explicitName.trim()) {
    return normalizeBranchName(explicitName.trim());
  }

  const configPath = path.resolve(__dirname, "../references/branch-naming.json");
  const config = readJsonSafe<NamingConfig>(configPath) || {};
  const maxLength = config.format?.max_length ?? 50;
  const allowedTypes = new Set((config.type_prefixes || []).map((item) => item.toLowerCase()));
  const stopWords = new Set((config.stop_words || []).map((item) => item.toLowerCase()));

  const analysisPath = path.join(runDir, "changes-analysis.json");
  const analysis = readJsonSafe<AnalysisLike>(analysisPath) || {};
  const typeRaw = (analysis.primary_type || analysis.primaryType || "feat").toLowerCase();
  const scopeRaw = analysis.primary_scope || analysis.primaryScope || "general";
  const summaryRaw =
    analysis.summary ||
    analysis.semantic_analysis?.summary ||
    analysis.commitStrategy?.reason ||
    "update";

  const type = allowedTypes.has(typeRaw) ? typeRaw : "feat";
  const scope = sanitizeSegment(scopeRaw) || "general";
  const keywords = extractKeywords(summaryRaw, stopWords);
  const description = sanitizeSegment(keywords.join("-")) || "update";

  let branch = `${type}/${scope}-${description}`;
  if (branch.length > maxLength) {
    branch = branch.slice(0, maxLength);
    branch = branch.replace(/[-/]+$/g, "");
  }

  if (!branch.includes("/")) {
    branch = `feat/${branch || "general-update"}`;
  }

  return normalizeBranchName(branch);
}

function writeBranchInfo(runDir: string, payload: BranchInfo): void {
  fs.mkdirSync(runDir, { recursive: true });
  const outputPath = path.join(runDir, "branch-info.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
}

function run(): void {
  const args = parseArgs(process.argv.slice(2));

  if (!isGitRepo()) {
    throw new Error("Current directory is not a git repository.");
  }

  const currentBranch = runGit(["branch", "--show-current"]);
  if (!currentBranch) {
    throw new Error("Detached HEAD is not supported by this helper.");
  }

  const targetBranch = buildBranchName(args.runDir, args.branchName);
  let status: BranchStatus = "skipped";
  let finalBranch = currentBranch;

  if (!args.skipBranch) {
    if (branchExists(targetBranch)) {
      if (targetBranch === currentBranch) {
        status = "reused";
      } else {
        runGit(["checkout", targetBranch]);
        status = "switched";
      }
    } else {
      runGit(["checkout", "-b", targetBranch]);
      status = "created";
    }
    finalBranch = targetBranch;
  }

  writeBranchInfo(args.runDir, {
    previous_branch: currentBranch,
    new_branch: finalBranch,
    branch_type: status,
    status: "success",
  });

  console.log(`Branch helper finished: ${status} -> ${finalBranch}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    run();
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

export { run };
