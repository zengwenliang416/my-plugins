#!/usr/bin/env bun
/**
 * Dependency Analyzer Script
 * Analyzes module dependencies and generates code map
 */

import { readdir, readFile, stat } from "fs/promises";
import { join, relative, extname } from "path";

interface ModuleInfo {
  path: string;
  type: "service" | "controller" | "repository" | "utility" | "unknown";
  imports: string[];
  exports: string[];
  lines: number;
}

interface DependencyGraph {
  modules: Map<string, ModuleInfo>;
  edges: Array<{ from: string; to: string; type: "direct" | "optional" }>;
}

const IMPORT_REGEX = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
const EXPORT_REGEX = /export\s+(class|function|const|interface|type)\s+(\w+)/g;

async function analyzeFile(filePath: string): Promise<ModuleInfo | null> {
  try {
    const content = await readFile(filePath, "utf-8");
    const lines = content.split("\n").length;

    const imports: string[] = [];
    let match;
    while ((match = IMPORT_REGEX.exec(content)) !== null) {
      imports.push(match[1]);
    }

    const exports: string[] = [];
    while ((match = EXPORT_REGEX.exec(content)) !== null) {
      exports.push(match[2]);
    }

    // Detect module type
    let type: ModuleInfo["type"] = "unknown";
    if (/Service/.test(content)) type = "service";
    else if (/Controller|@Controller/.test(content)) type = "controller";
    else if (/Repository/.test(content)) type = "repository";
    else if (exports.length > 0) type = "utility";

    return { path: filePath, type, imports, exports, lines };
  } catch {
    return null;
  }
}

async function walkDir(dir: string, patterns: string[]): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
        files.push(...(await walkDir(fullPath, patterns)));
      }
    } else {
      const ext = extname(entry.name);
      if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

async function buildGraph(rootDir: string): Promise<DependencyGraph> {
  const files = await walkDir(rootDir, []);
  const modules = new Map<string, ModuleInfo>();
  const edges: DependencyGraph["edges"] = [];

  for (const file of files) {
    const info = await analyzeFile(file);
    if (info) {
      const relPath = relative(rootDir, file);
      modules.set(relPath, { ...info, path: relPath });
    }
  }

  // Build edges
  for (const [path, info] of modules) {
    for (const imp of info.imports) {
      if (imp.startsWith(".")) {
        edges.push({ from: path, to: imp, type: "direct" });
      }
    }
  }

  return { modules, edges };
}

function toMermaid(graph: DependencyGraph): string {
  let mermaid = "graph TD\n";

  for (const [path, info] of graph.modules) {
    const id = path.replace(/[\/\.\-]/g, "_");
    mermaid += `    ${id}[${path}]\n`;
  }

  for (const edge of graph.edges) {
    const fromId = edge.from.replace(/[\/\.\-]/g, "_");
    const toId = edge.to.replace(/[\/\.\-]/g, "_");
    mermaid += `    ${fromId} --> ${toId}\n`;
  }

  return mermaid;
}

// Main
const rootDir = process.argv[2] || ".";
buildGraph(rootDir).then((graph) => {
  console.log(JSON.stringify(Object.fromEntries(graph.modules), null, 2));
  console.log("\n--- Mermaid ---\n");
  console.log(toMermaid(graph));
});
