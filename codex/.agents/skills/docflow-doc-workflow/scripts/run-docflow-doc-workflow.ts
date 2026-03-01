#!/usr/bin/env npx ts-node --esm
import process from "node:process";
import { pathToFileURL } from "node:url";

type WorkflowGoal = "init" | "read" | "update" | "investigate" | "clarify";

interface SkillInput {
  llmdocInitialized?: boolean;
  userGoal?: WorkflowGoal;
}

interface SkillOutput {
  skill: "docflow-doc-workflow";
  status: "success" | "failure";
  recommendedEntry: string;
  rationale: string;
  followUps: string[];
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
      skill: "docflow-doc-workflow",
      status: "success",
      recommendedEntry: "/prompts:docflow-init-doc",
      rationale: "llmdoc is not initialized",
      followUps: ["initialize llmdoc before reading or updating docs"],
    };
  }

  const goal = input.userGoal ?? "clarify";
  const routeMap: Record<WorkflowGoal, { entry: string; rationale: string }> = {
    init: {
      entry: "/prompts:docflow-init-doc",
      rationale: "user requests initialization",
    },
    read: {
      entry: "docflow-read-doc",
      rationale: "user needs documentation overview",
    },
    update: {
      entry: "docflow-update-doc",
      rationale: "user needs documentation synchronization",
    },
    investigate: {
      entry: "docflow-investigate",
      rationale: "user needs doc-first investigation",
    },
    clarify: {
      entry: "docflow-doc-workflow",
      rationale: "user goal is ambiguous and needs clarification",
    },
  };

  const route = routeMap[goal];

  return {
    skill: "docflow-doc-workflow",
    status: "success",
    recommendedEntry: route.entry,
    rationale: route.rationale,
    followUps: [
      "check references/decision-tree.md for branch details",
      "check references/output-contract.md for output fields",
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
    process.stderr.write(`[run-docflow-doc-workflow] failure: ${message}\n`);
    process.exit(1);
  }
}

export { main, run };
export type { SkillInput, SkillOutput, WorkflowGoal };
