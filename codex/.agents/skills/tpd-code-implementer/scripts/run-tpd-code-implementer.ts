
import { existsSync } from "fs";

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
    "Usage: npx tsx scripts/run-tpd-code-implementer.ts --run_dir <dir> [--constraints_ref <path>] [--pbt_ref <path>]\n",
  );
}

function fail(message: string, code: number): never {
  process.stderr.write(`[run-tpd-code-implementer] ${message}\n`);
  process.exit(code);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const runDir = args.run_dir;

  if (!runDir) {
    fail("--run_dir is required", 1);
  }

  const codexDiff = normalizeJoin(runDir, "prototype-codex.diff");
  const geminiDiff = normalizeJoin(runDir, "prototype-gemini.diff");

  const selectedDiffs = [codexDiff, geminiDiff].filter((path) => existsSync(path));
  if (selectedDiffs.length === 0) {
    fail(`No prototype diff found at ${codexDiff} or ${geminiDiff}`, 2);
  }

  const optionalRefs = [args.constraints_ref, args.pbt_ref].filter(
    (value): value is string => Boolean(value),
  );
  const missingRefs = optionalRefs.filter((path) => !existsSync(path));
  if (missingRefs.length > 0) {
    fail(`Missing optional references: ${missingRefs.join(", ")}`, 3);
  }

  const outputs = [normalizeJoin(runDir, "changes.md")];

  const payload = {
    skill: "tpd-code-implementer",
    status: "ready",
    inputs: {
      run_dir: runDir,
      constraints_ref: args.constraints_ref ?? null,
      pbt_ref: args.pbt_ref ?? null,
    },
    selected_diffs: selectedDiffs,
    outputs,
  };

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

main();
