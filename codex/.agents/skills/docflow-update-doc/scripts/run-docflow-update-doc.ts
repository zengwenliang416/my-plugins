#!/usr/bin/env npx ts-node --esm
import process from "node:process";
import { pathToFileURL } from "node:url";

type UpdateMode = "incremental" | "full";

interface SkillInput {
  changeSummary?: string;
  changedPaths?: string[];
  updateMode?: UpdateMode;
}

interface SkillOutput {
  skill: "docflow-update-doc";
  status: "success" | "failure";
  mode: UpdateMode;
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
  const hasSummary = Boolean(input.changeSummary && input.changeSummary.trim().length > 0);
  const hasPaths = Array.isArray(input.changedPaths) && input.changedPaths.length > 0;

  if (!hasSummary && !hasPaths) {
    return {
      skill: "docflow-update-doc",
      status: "failure",
      mode: input.updateMode ?? "incremental",
      nextStep: "provide changeSummary or changedPaths before updating docs",
      references: [
        "references/decision-tree.md",
        "references/output-contract.md",
      ],
    };
  }

  return {
    skill: "docflow-update-doc",
    status: "success",
    mode: input.updateMode ?? "incremental",
    nextStep: "update impacted docs and sync llmdoc/index.md",
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

  if (output.status === "failure") {
    process.stderr.write("[run-docflow-update-doc] failure: missing change context\n");
    process.exit(1);
  }
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`[run-docflow-update-doc] failure: ${message}\n`);
    process.exit(1);
  }
}

export { main, run };
export type { SkillInput, SkillOutput, UpdateMode };
