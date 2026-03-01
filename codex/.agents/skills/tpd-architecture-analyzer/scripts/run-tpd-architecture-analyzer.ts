
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
    "Usage: npx tsx scripts/run-tpd-architecture-analyzer.ts --run_dir <dir> [--task_type <fullstack|frontend|backend>]\n",
  );
}

function fail(message: string, code: number): never {
  process.stderr.write(`[run-tpd-architecture-analyzer] ${message}\n`);
  process.exit(code);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const runDir = args.run_dir;
  const taskType = args.task_type ?? "fullstack";

  if (!runDir) {
    fail("--run_dir is required", 1);
  }

  const supported = new Set(["fullstack", "frontend", "backend"]);
  if (!supported.has(taskType)) {
    fail(`--task_type must be one of fullstack|frontend|backend, received: ${taskType}`, 1);
  }

  const requiredInputs = [
    normalizeJoin(runDir, "requirements.md"),
    normalizeJoin(runDir, "context.md"),
  ];

  if (taskType === "fullstack" || taskType === "backend") {
    requiredInputs.push(normalizeJoin(runDir, "codex-plan.md"));
  }
  if (taskType === "fullstack" || taskType === "frontend") {
    requiredInputs.push(normalizeJoin(runDir, "gemini-plan.md"));
  }

  const missing = requiredInputs.filter((path) => !existsSync(path));
  if (missing.length > 0) {
    fail(`Missing required inputs: ${missing.join(", ")}`, 2);
  }

  const outputs = [
    normalizeJoin(runDir, "architecture.md"),
    normalizeJoin(runDir, "constraints.md"),
  ];

  const payload = {
    skill: "tpd-architecture-analyzer",
    status: "ready",
    inputs: {
      run_dir: runDir,
      task_type: taskType,
    },
    required_inputs: requiredInputs,
    outputs,
  };

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

main();
