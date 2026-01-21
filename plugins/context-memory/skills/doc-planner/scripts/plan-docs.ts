#!/usr/bin/env bun
/**
 * Documentation Planner Script
 * Analyzes project structure and generates documentation plan
 */

import { readFile, writeFile, mkdir, readdir, stat } from "fs/promises";
import { join, extname, relative } from "path";

interface DocItem {
  id: string;
  type: "api" | "component" | "guide" | "reference";
  path: string;
  title: string;
  source_files: string[];
  priority: "critical" | "high" | "medium" | "low";
  status: "missing" | "outdated" | "incomplete" | "complete";
  estimated_sections: string[];
  dependencies: string[];
  complexity: "low" | "medium" | "high";
}

interface DocPlan {
  version: string;
  generated: string;
  project_root: string;
  scope: string;
  summary: {
    total_files: number;
    documented: number;
    needs_doc: number;
    outdated: number;
    coverage: string;
  };
  documents: DocItem[];
  structure: Record<string, unknown>;
  generation_order: string[];
  metadata: {
    analysis_time_ms: number;
    files_scanned: number;
    existing_docs: number;
  };
}

const CODE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".java"];
const DOC_EXTENSION = ".md";

async function findFiles(
  dir: string,
  extensions: string[],
  maxDepth = 5,
): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string, depth: number) {
    if (depth > maxDepth) return;

    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (
          !entry.name.startsWith(".") &&
          entry.name !== "node_modules" &&
          entry.name !== "dist" &&
          entry.name !== "build"
        ) {
          await walk(fullPath, depth + 1);
        }
      } else {
        const ext = extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  await walk(dir, 0);
  return files;
}

function detectDocType(
  filePath: string,
  content: string,
): "api" | "component" | "guide" | "reference" {
  const filename = filePath.toLowerCase();

  // API detection
  if (
    filename.includes("route") ||
    filename.includes("controller") ||
    filename.includes("api") ||
    content.includes("@Get") ||
    content.includes("@Post") ||
    content.includes("app.get") ||
    content.includes("router.")
  ) {
    return "api";
  }

  // Component detection
  if (
    filename.endsWith(".tsx") ||
    filename.endsWith(".vue") ||
    filename.includes(".component.") ||
    content.includes("export default function") ||
    content.includes("defineComponent")
  ) {
    return "component";
  }

  // Guide detection (complex modules)
  if (
    filename.includes("service") ||
    filename.includes("util") ||
    filename.includes("helper")
  ) {
    return "guide";
  }

  return "reference";
}

function calculatePriority(
  complexity: number,
  usage: number,
  changeFreq: number,
  docStatus: number,
): "critical" | "high" | "medium" | "low" {
  const score =
    complexity * 0.3 + usage * 0.3 + changeFreq * 0.2 + docStatus * 0.2;

  if (score > 4) return "critical";
  if (score > 3) return "high";
  if (score > 2) return "medium";
  return "low";
}

function generateId(index: number): string {
  return `doc-${String(index + 1).padStart(3, "0")}`;
}

function titleFromPath(filePath: string): string {
  const filename = filePath.split("/").pop() || "";
  const base = filename.replace(/\.[^.]+$/, "");
  return base
    .replace(/[-_]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function generatePlan(
  projectDir: string,
  scope: string,
): Promise<DocPlan> {
  const startTime = Date.now();

  // Find code files and existing docs
  const codeFiles = await findFiles(projectDir, CODE_EXTENSIONS);
  const docFiles = await findFiles(projectDir, [DOC_EXTENSION]);

  const documents: DocItem[] = [];

  for (let i = 0; i < codeFiles.length; i++) {
    const file = codeFiles[i];
    const content = await readFile(file, "utf-8");
    const docType = detectDocType(file, content);

    // Filter by scope
    if (scope !== "full") {
      if (scope === "api" && docType !== "api") continue;
      if (scope === "components" && docType !== "component") continue;
      if (scope === "guides" && docType !== "guide") continue;
    }

    const relPath = relative(projectDir, file);
    const docPath = `docs/${docType}/${relPath.replace(/\.[^.]+$/, ".md")}`;

    // Check if doc exists
    const existingDoc = docFiles.find((d) =>
      d.includes(
        relPath
          .split("/")
          .pop()
          ?.replace(/\.[^.]+$/, "") || "",
      ),
    );
    const status = existingDoc ? "complete" : "missing";

    documents.push({
      id: generateId(i),
      type: docType,
      path: docPath,
      title: titleFromPath(file),
      source_files: [relPath],
      priority: calculatePriority(3, 3, 2, status === "missing" ? 5 : 1),
      status,
      estimated_sections: getSectionsForType(docType),
      dependencies: [],
      complexity: "medium",
    });
  }

  // Sort by priority
  documents.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const needsDoc = documents.filter((d) => d.status !== "complete").length;

  return {
    version: "1.0",
    generated: new Date().toISOString(),
    project_root: projectDir,
    scope,
    summary: {
      total_files: codeFiles.length,
      documented: documents.length - needsDoc,
      needs_doc: needsDoc,
      outdated: 0,
      coverage: `${Math.round(((documents.length - needsDoc) / documents.length) * 100)}%`,
    },
    documents,
    structure: buildStructure(documents),
    generation_order: documents.map((d) => d.id),
    metadata: {
      analysis_time_ms: Date.now() - startTime,
      files_scanned: codeFiles.length,
      existing_docs: docFiles.length,
    },
  };
}

function getSectionsForType(type: string): string[] {
  const sectionMap: Record<string, string[]> = {
    api: ["Overview", "Authentication", "Endpoints", "Examples", "Errors"],
    component: ["Overview", "Props", "Usage", "Variants", "Accessibility"],
    guide: ["Introduction", "Prerequisites", "Steps", "Troubleshooting", "FAQ"],
    reference: ["Overview", "API", "Examples", "Related"],
  };
  return sectionMap[type] || ["Overview", "Content"];
}

function buildStructure(documents: DocItem[]): Record<string, unknown> {
  const structure: Record<string, string[]> = {
    "docs/api/": [],
    "docs/components/": [],
    "docs/guides/": [],
    "docs/reference/": [],
  };

  for (const doc of documents) {
    const dir = `docs/${doc.type}/`;
    if (structure[dir]) {
      structure[dir].push(doc.path.split("/").pop() || "");
    }
  }

  return structure;
}

// CLI
const projectDir = process.argv[2] || ".";
const scope = process.argv[3] || "full";
const outputPath = process.argv[4] || ".claude/memory/docs/plan.json";

generatePlan(projectDir, scope)
  .then(async (plan) => {
    await mkdir(join(outputPath, ".."), { recursive: true });
    await writeFile(outputPath, JSON.stringify(plan, null, 2), "utf-8");

    console.log("Documentation plan generated:");
    console.log(`  Total files: ${plan.summary.total_files}`);
    console.log(`  Needs documentation: ${plan.summary.needs_doc}`);
    console.log(`  Coverage: ${plan.summary.coverage}`);
    console.log(`\nOutput: ${outputPath}`);
  })
  .catch((err) => {
    console.error("Planning failed:", err);
    process.exit(1);
  });
