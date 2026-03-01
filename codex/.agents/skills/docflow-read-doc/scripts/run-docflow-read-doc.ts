#!/usr/bin/env npx ts-node --esm
import process from "node:process";
import { pathToFileURL } from "node:url";

type ReadDepth = "overview" | "deep";

interface SkillInput {
  llmdocInitialized?: boolean;
  depth?: ReadDepth;
  focusArea?: string;
}

interface SkillOutput {
  skill: "docflow-read-doc";
  status: "success" | "failure";
  summaryLevel: ReadDepth;
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
  if (!input.llmdocInitialized) {
    return {
      skill: "docflow-read-doc",
      status: "failure",
      summaryLevel: "overview",
      nextStep: "initialize llmdoc via /prompts:docflow-init-doc",
      references: [
        "references/decision-tree.md",
        "references/output-contract.md",
      ],
    };
  }

  const summaryLevel = input.depth ?? "overview";
  const focusHint = input.focusArea ? `focus on ${input.focusArea}` : "scan all major sections";

  return {
    skill: "docflow-read-doc",
    status: "success",
    summaryLevel,
    nextStep: `${focusHint} and produce layered summary`,
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
    process.stderr.write("[run-docflow-read-doc] failure: llmdoc is not initialized\n");
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
    process.stderr.write(`[run-docflow-read-doc] failure: ${message}\n`);
    process.exit(1);
  }
}

export { main, run };
export type { SkillInput, SkillOutput, ReadDepth };
