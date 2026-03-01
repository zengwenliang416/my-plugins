
type Args = Record<string, string>;

const ROLES = new Set(["constraint-analyst", "architect", "implementer", "auditor"]);
const IMPLEMENTER_MODES = new Set(["analyze", "prototype"]);

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
    "Usage: npx tsx scripts/run-tpd-codex-cli.ts --role <role> --prompt <text> [--mode <analyze|prototype>] [--focus <text>] [--run_dir <dir>]\n",
  );
}

function fail(message: string, code: number): never {
  process.stderr.write(`[run-tpd-codex-cli] ${message}\n`);
  process.exit(code);
}

function artifactName(role: string, mode: string | undefined, runDir: string): string {
  if (role === "implementer" && mode === "prototype") {
    return normalizeJoin(runDir, "prototype-codex.diff");
  }
  if (role === "implementer" && mode === "analyze") {
    return normalizeJoin(runDir, "analysis-codex.md");
  }
  return normalizeJoin(runDir, `codex-${role}.md`);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const role = args.role;
  const prompt = args.prompt;
  const mode = args.mode;
  const focus = args.focus ?? null;
  const runDir = args.run_dir ?? ".";

  if (!role) {
    fail("--role is required", 1);
  }
  if (!ROLES.has(role)) {
    fail(`--role must be one of constraint-analyst|architect|implementer|auditor, received: ${role}`, 1);
  }
  if (!prompt || prompt.trim().length === 0) {
    fail("--prompt is required", 1);
  }

  if (role === "implementer") {
    if (!mode) {
      fail("--mode is required when --role=implementer", 2);
    }
    if (!IMPLEMENTER_MODES.has(mode)) {
      fail(`--mode must be analyze|prototype when --role=implementer, received: ${mode}`, 2);
    }
  }

  const payload = {
    skill: "tpd-codex-cli",
    status: "ready",
    inputs: {
      role,
      mode: mode ?? null,
      focus,
      run_dir: runDir,
    },
    command: ["npx", "tsx", "scripts/invoke-codex.ts"],
    command_args: {
      role,
      mode: mode ?? null,
      prompt,
      focus,
      run_dir: runDir,
      sandbox: "read-only",
    },
    artifact: artifactName(role, mode, runDir),
  };

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

main();
