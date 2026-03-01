
import { existsSync, readFileSync } from "fs";

type Args = Record<string, string>;

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") {
      printUsage();
      process.exit(0);
    }
    if (!token.startsWith("--")) {
      fail(`Unknown token: ${token}`, 1);
    }
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      fail(`Missing value for --${key}`, 1);
    }
    args[key] = value;
    i += 1;
  }
  return args;
}

function normalizeJoin(base: string, leaf: string): string {
  const left = base.replace(/\/+$/, "");
  const right = leaf.replace(/^\/+/, "");
  return `${left}/${right}`;
}

function printUsage(): void {
  process.stdout.write(
    "Usage: npx tsx scripts/run-tpd-complexity-analyzer.ts --run_dir <dir>\n",
  );
}

function fail(message: string, code: number): never {
  process.stderr.write(`[run-tpd-complexity-analyzer] ${message}\n`);
  process.exit(code);
}

function countMatches(content: string, patterns: RegExp[]): number {
  return patterns.reduce((acc, pattern) => acc + (content.match(pattern)?.length ?? 0), 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function selectDepth(score: number): "light" | "deep" | "ultra" {
  if (score <= 3) {
    return "light";
  }
  if (score <= 6) {
    return "deep";
  }
  return "ultra";
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const runDir = args.run_dir;

  if (!runDir) {
    fail("--run_dir is required", 1);
  }

  const inputPath = normalizeJoin(runDir, "input.md");
  if (!existsSync(inputPath)) {
    fail(`Missing required input: ${inputPath}`, 2);
  }

  const content = readFileSync(inputPath, "utf-8").toLowerCase();

  const scopeSignals = countMatches(content, [/module/g, /service/g, /integration/g, /multi/g]);
  const ambiguitySignals = countMatches(content, [/maybe/g, /unclear/g, /unknown/g, /tbd/g]);
  const riskSignals = countMatches(content, [/security/g, /migration/g, /compliance/g, /performance/g]);

  const rawScore = 1 + scopeSignals + ambiguitySignals + riskSignals;
  const score = clamp(rawScore, 1, 10);
  const depth = selectDepth(score);

  const payload = {
    skill: "tpd-complexity-analyzer",
    status: "ready",
    inputs: {
      run_dir: runDir,
      input: inputPath,
    },
    score,
    depth,
    needs_confirmation: score >= 4 && score <= 6,
    output: normalizeJoin(runDir, "complexity-analysis.md"),
  };

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

main();
