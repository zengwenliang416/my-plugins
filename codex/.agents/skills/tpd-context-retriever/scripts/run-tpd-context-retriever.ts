
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
    "Usage: npx tsx scripts/run-tpd-context-retriever.ts --run_dir <dir> [--mode <full|incremental>] [--base_context <path>]\n",
  );
}

function fail(message: string, code: number): never {
  process.stderr.write(`[run-tpd-context-retriever] ${message}\n`);
  process.exit(code);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const runDir = args.run_dir;
  const mode = args.mode ?? "full";
  const baseContext = args.base_context ?? null;

  if (!runDir) {
    fail("--run_dir is required", 1);
  }

  if (mode !== "full" && mode !== "incremental") {
    fail(`--mode must be full|incremental, received: ${mode}`, 2);
  }

  if (mode === "incremental") {
    if (!baseContext) {
      fail("--base_context is required when --mode=incremental", 2);
    }
    if (!existsSync(baseContext)) {
      fail(`Missing base context: ${baseContext}`, 2);
    }
  }

  const scopePath = normalizeJoin(runDir, "tasks.md");
  if (!existsSync(scopePath)) {
    fail(`Missing task scope: ${scopePath}`, 3);
  }

  const payload = {
    skill: "tpd-context-retriever",
    status: "ready",
    inputs: {
      run_dir: runDir,
      mode,
      base_context: baseContext,
    },
    scope: scopePath,
    outputs: [normalizeJoin(runDir, "context.md")],
  };

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

main();
