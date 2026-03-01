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
    "Usage: npx tsx scripts/run-tpd-conclusion-generator.ts --run_dir <dir>\n",
  );
}

function fail(message: string, code: number): never {
  process.stderr.write(`[run-tpd-conclusion-generator] ${message}\n`);
  process.exit(code);
}

function extractOpenQuestions(content: string): string[] {
  const lines = content.split(/\r?\n/);
  const results: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- [ ]")) {
      results.push(trimmed.replace("- [ ]", "").trim());
    }
  }
  return results;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const runDir = args.run_dir;

  if (!runDir) {
    fail("--run_dir is required", 1);
  }

  const synthesis = normalizeJoin(runDir, "synthesis.md");
  const clarifications = normalizeJoin(runDir, "clarifications.md");

  if (!existsSync(synthesis)) {
    fail(`Missing required input: ${synthesis}`, 2);
  }

  const synthesisContent = readFileSync(synthesis, "utf-8").toLowerCase();
  const requiredSections = ["constraints", "risks", "success criteria"];
  const missingSections = requiredSections.filter(
    (section) => !synthesisContent.includes(section),
  );
  if (missingSections.length > 0) {
    fail(`Synthesis is missing required sections: ${missingSections.join(", ")}`, 2);
  }

  const openQuestions = extractOpenQuestions(readFileSync(synthesis, "utf-8"));

  const payload = {
    skill: "tpd-conclusion-generator",
    status: "ready",
    inputs: {
      run_dir: runDir,
      synthesis,
      clarifications: existsSync(clarifications) ? clarifications : null,
    },
    outputs: [normalizeJoin(runDir, "conclusion.md")],
    open_questions: openQuestions,
  };

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

main();
