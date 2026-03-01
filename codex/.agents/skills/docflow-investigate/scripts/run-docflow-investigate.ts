#!/usr/bin/env npx ts-node --esm
import process from "node:process";
import { pathToFileURL } from "node:url";

interface SkillInput {
  question?: string;
  scope?: string;
  needsExternalInfo?: boolean;
}

interface SkillOutput {
  skill: "docflow-investigate";
  status: "success" | "failure";
  nextStep: string;
  evidenceRequired: boolean;
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
  const hasQuestion = Boolean(input.question && input.question.trim().length > 0);

  if (!hasQuestion) {
    return {
      skill: "docflow-investigate",
      status: "failure",
      nextStep: "provide a concrete investigation question",
      evidenceRequired: true,
      references: [
        "references/decision-tree.md",
        "references/output-contract.md",
      ],
    };
  }

  return {
    skill: "docflow-investigate",
    status: "success",
    nextStep: input.needsExternalInfo
      ? "declare boundaries, then use external evidence"
      : "investigate llmdoc first, then inspect code only if needed",
    evidenceRequired: true,
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
    process.stderr.write("[run-docflow-investigate] failure: missing required question\n");
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
    process.stderr.write(`[run-docflow-investigate] failure: ${message}\n`);
    process.exit(1);
  }
}

export { main, run };
export type { SkillInput, SkillOutput };
