#!/usr/bin/env npx ts-node --esm
import process from "node:process";
import { pathToFileURL } from "node:url";

interface SkillInput {
  intent?: string;
  hasStagedChanges?: boolean;
  hasUnstagedChanges?: boolean;
}

interface SkillOutput {
  skill: "docflow-commit";
  status: "success" | "failure";
  decision: "commit" | "need_confirmation" | "stop";
  nextStep: string;
  references: string[];
}

function parseInput(raw: string | undefined): SkillInput {
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as SkillInput;
  } catch (error) {
    throw new Error(`invalid JSON input: ${String(error)}`);
  }
}

function run(input: SkillInput): SkillOutput {
  const hasChanges = Boolean(input.hasStagedChanges) || Boolean(input.hasUnstagedChanges);

  if (!hasChanges) {
    return {
      skill: "docflow-commit",
      status: "success",
      decision: "stop",
      nextStep: "no changes to commit",
      references: [
        "references/decision-tree.md",
        "references/output-contract.md",
      ],
    };
  }

  if (!input.hasStagedChanges) {
    return {
      skill: "docflow-commit",
      status: "success",
      decision: "need_confirmation",
      nextStep: "confirm staging strategy before commit",
      references: [
        "references/decision-tree.md",
        "references/output-contract.md",
      ],
    };
  }

  return {
    skill: "docflow-commit",
    status: "success",
    decision: "commit",
    nextStep: "confirm commit message and execute git commit",
    references: [
      "references/decision-tree.md",
      "references/output-contract.md",
    ],
  };
}

function main(): void {
  const input = parseInput(process.argv[2]);
  const output = run(input);
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`[run-docflow-commit] failure: ${message}\n`);
    process.exit(1);
  }
}

export { main, run };
export type { SkillInput, SkillOutput };
