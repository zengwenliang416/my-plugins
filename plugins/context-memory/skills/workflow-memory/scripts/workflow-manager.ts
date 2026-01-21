#!/usr/bin/env bun
/**
 * Workflow Memory Manager
 * Manages workflow state persistence and recovery
 */

import { readFile, writeFile, mkdir, readdir, unlink } from "fs/promises";
import { join, dirname } from "path";

interface WorkflowPhase {
  name: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  started_at?: string;
  completed_at?: string;
  outputs?: Record<string, unknown>;
}

interface WorkflowState {
  workflow_id: string;
  name: string;
  status: "pending" | "in_progress" | "paused" | "completed" | "failed";
  current_phase: string;
  phases: WorkflowPhase[];
  context: {
    user_request: string;
    files_involved: string[];
    decisions: string[];
  };
  created_at: string;
  updated_at: string;
}

const WORKFLOWS_DIR = ".claude/memory/workflows";

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

async function saveWorkflow(state: WorkflowState): Promise<void> {
  const subdir =
    state.status === "completed"
      ? "completed"
      : state.status === "failed"
        ? "failed"
        : "active";
  const dir = join(WORKFLOWS_DIR, subdir);
  await ensureDir(dir);

  const filename = `${state.name}-${state.workflow_id}.json`;
  await writeFile(join(dir, filename), JSON.stringify(state, null, 2), "utf-8");
}

async function loadWorkflow(workflowId: string): Promise<WorkflowState | null> {
  for (const subdir of ["active", "completed", "failed"]) {
    try {
      const dir = join(WORKFLOWS_DIR, subdir);
      const files = await readdir(dir);
      const file = files.find((f) => f.includes(workflowId));
      if (file) {
        const content = await readFile(join(dir, file), "utf-8");
        return JSON.parse(content);
      }
    } catch {
      // Directory doesn't exist
    }
  }
  return null;
}

async function listWorkflows(status?: string): Promise<string[]> {
  const subdirs = status ? [status] : ["active", "completed", "failed"];
  const workflows: string[] = [];

  for (const subdir of subdirs) {
    try {
      const dir = join(WORKFLOWS_DIR, subdir);
      const files = await readdir(dir);
      workflows.push(...files.map((f) => `${subdir}/${f}`));
    } catch {
      // Directory doesn't exist
    }
  }

  return workflows;
}

function createWorkflow(name: string, userRequest: string): WorkflowState {
  const phases = getPhasesByWorkflow(name);
  return {
    workflow_id: generateId(),
    name,
    status: "pending",
    current_phase: phases[0]?.name || "",
    phases,
    context: {
      user_request: userRequest,
      files_involved: [],
      decisions: [],
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function getPhasesByWorkflow(name: string): WorkflowPhase[] {
  const phaseMap: Record<string, string[]> = {
    dev: ["context", "analyze", "prototype", "implement", "audit"],
    review: ["collect", "analyze", "report"],
    commit: ["collect", "analyze", "message", "execute"],
    docs: ["plan", "generate", "update"],
  };

  const phaseNames = phaseMap[name] || ["default"];
  return phaseNames.map((phaseName) => ({
    name: phaseName,
    status: "pending" as const,
  }));
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function advancePhase(state: WorkflowState): WorkflowState {
  const currentIndex = state.phases.findIndex(
    (p) => p.name === state.current_phase,
  );

  if (currentIndex >= 0 && currentIndex < state.phases.length - 1) {
    state.phases[currentIndex].status = "completed";
    state.phases[currentIndex].completed_at = new Date().toISOString();
    state.current_phase = state.phases[currentIndex + 1].name;
    state.phases[currentIndex + 1].status = "in_progress";
    state.phases[currentIndex + 1].started_at = new Date().toISOString();
  } else if (currentIndex === state.phases.length - 1) {
    state.phases[currentIndex].status = "completed";
    state.phases[currentIndex].completed_at = new Date().toISOString();
    state.status = "completed";
  }

  state.updated_at = new Date().toISOString();
  return state;
}

// CLI
const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

async function main() {
  switch (command) {
    case "create":
      if (!arg1 || !arg2) {
        console.error("Usage: workflow-manager.ts create <name> <request>");
        process.exit(1);
      }
      const newState = createWorkflow(arg1, arg2);
      await saveWorkflow(newState);
      console.log(`Created workflow: ${newState.workflow_id}`);
      console.log(JSON.stringify(newState, null, 2));
      break;

    case "load":
      if (!arg1) {
        console.error("Usage: workflow-manager.ts load <workflow_id>");
        process.exit(1);
      }
      const loaded = await loadWorkflow(arg1);
      if (loaded) {
        console.log(JSON.stringify(loaded, null, 2));
      } else {
        console.error(`Workflow not found: ${arg1}`);
        process.exit(1);
      }
      break;

    case "list":
      const workflows = await listWorkflows(arg1);
      console.log(workflows.join("\n"));
      break;

    case "advance":
      if (!arg1) {
        console.error("Usage: workflow-manager.ts advance <workflow_id>");
        process.exit(1);
      }
      const state = await loadWorkflow(arg1);
      if (state) {
        const advanced = advancePhase(state);
        await saveWorkflow(advanced);
        console.log(`Advanced to phase: ${advanced.current_phase}`);
        console.log(JSON.stringify(advanced, null, 2));
      } else {
        console.error(`Workflow not found: ${arg1}`);
        process.exit(1);
      }
      break;

    default:
      console.log(
        "Usage: workflow-manager.ts <create|load|list|advance> [args]",
      );
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
