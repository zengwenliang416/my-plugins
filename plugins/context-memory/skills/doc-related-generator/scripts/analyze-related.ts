#!/usr/bin/env bun
/**
 * Related Documentation Analyzer
 * Analyzes dependencies and generates related documentation
 */

import { readFile, writeFile, mkdir, readdir } from "fs/promises";
import { join, dirname, relative, extname } from "path";

interface Dependency {
  path: string;
  type: "internal" | "external";
  usage: string[];
  depth: number;
  via?: string;
}

interface DependencyAnalysis {
  entry: string;
  module_type: string;
  dependencies: {
    direct: Dependency[];
    indirect: Dependency[];
  };
  dependents: {
    direct: Dependency[];
  };
}

interface RelatedDoc {
  path: string;
  title: string;
  source: string;
  relation: "entry" | "dependency" | "dependent";
  depth: number;
}

async function readFileContent(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, "utf-8");
  } catch {
    return "";
  }
}

function extractImports(content: string): string[] {
  const imports: string[] = [];

  // ES6 imports
  const es6Regex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = es6Regex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  // CommonJS requires
  const cjsRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = cjsRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

function classifyImport(
  importPath: string,
  baseDir: string,
): { type: "internal" | "external"; resolvedPath: string } {
  if (
    importPath.startsWith(".") ||
    importPath.startsWith("/") ||
    importPath.startsWith("@/")
  ) {
    return {
      type: "internal",
      resolvedPath: importPath.startsWith("@/")
        ? importPath.replace("@/", "src/")
        : importPath,
    };
  }
  return { type: "external", resolvedPath: importPath };
}

function detectModuleType(filePath: string, content: string): string {
  const filename = filePath.toLowerCase();

  if (filename.includes("service")) return "service";
  if (filename.includes("controller") || filename.includes("route"))
    return "controller";
  if (filename.includes("model") || filename.includes("entity")) return "model";
  if (filename.includes("util") || filename.includes("helper"))
    return "utility";
  if (filename.includes("component") || filename.endsWith(".tsx"))
    return "component";
  if (filename.includes("hook")) return "hook";
  if (filename.includes("middleware")) return "middleware";

  return "module";
}

async function analyzeDependencies(
  entryPath: string,
  maxDepth: number,
): Promise<DependencyAnalysis> {
  const content = await readFileContent(entryPath);
  const imports = extractImports(content);
  const baseDir = dirname(entryPath);

  const directDeps: Dependency[] = [];
  const indirectDeps: Dependency[] = [];

  // Analyze direct dependencies
  for (const imp of imports) {
    const { type, resolvedPath } = classifyImport(imp, baseDir);

    const usage = extractUsageFromImport(content, imp);

    directDeps.push({
      path: resolvedPath,
      type,
      usage,
      depth: 1,
    });
  }

  // Analyze indirect dependencies (depth > 1)
  if (maxDepth > 1) {
    for (const dep of directDeps) {
      if (dep.type === "internal") {
        const depContent = await readFileContent(dep.path);
        const depImports = extractImports(depContent);

        for (const imp of depImports) {
          const { type, resolvedPath } = classifyImport(imp, dirname(dep.path));

          if (!directDeps.some((d) => d.path === resolvedPath)) {
            indirectDeps.push({
              path: resolvedPath,
              type,
              usage: [],
              depth: 2,
              via: dep.path,
            });
          }
        }
      }
    }
  }

  return {
    entry: entryPath,
    module_type: detectModuleType(entryPath, content),
    dependencies: {
      direct: directDeps,
      indirect: indirectDeps,
    },
    dependents: {
      direct: [], // Would require scanning all project files
    },
  };
}

function extractUsageFromImport(content: string, importPath: string): string[] {
  // Find what's imported from this path
  const regex = new RegExp(
    `import\\s+\\{([^}]+)\\}\\s+from\\s+['"]${importPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}['"]`,
  );
  const match = content.match(regex);

  if (match) {
    return match[1]
      .split(",")
      .map((s) => s.trim().split(" as ")[0].trim())
      .filter(Boolean);
  }

  // Default import
  const defaultRegex = new RegExp(
    `import\\s+(\\w+)\\s+from\\s+['"]${importPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}['"]`,
  );
  const defaultMatch = content.match(defaultRegex);

  if (defaultMatch) {
    return [defaultMatch[1]];
  }

  return [];
}

function generateRelatedDocs(analysis: DependencyAnalysis): RelatedDoc[] {
  const docs: RelatedDoc[] = [];

  // Entry document
  docs.push({
    path: `docs/related/${analysis.entry
      .split("/")
      .pop()
      ?.replace(/\.[^.]+$/, ".md")}`,
    title:
      analysis.entry
        .split("/")
        .pop()
        ?.replace(/\.[^.]+$/, "") || "",
    source: analysis.entry,
    relation: "entry",
    depth: 0,
  });

  // Dependency documents
  for (const dep of analysis.dependencies.direct) {
    if (dep.type === "internal") {
      docs.push({
        path: `docs/related/dependencies/${dep.path
          .split("/")
          .pop()
          ?.replace(/\.[^.]+$/, ".md")}`,
        title:
          dep.path
            .split("/")
            .pop()
            ?.replace(/\.[^.]+$/, "") || "",
        source: dep.path,
        relation: "dependency",
        depth: dep.depth,
      });
    }
  }

  return docs;
}

// CLI
const entryPath = process.argv[2];
const maxDepth = parseInt(process.argv[3] || "2", 10);
const outputPath =
  process.argv[4] || ".claude/memory/docs/related-analysis.json";

if (!entryPath) {
  console.error("Usage: analyze-related.ts <entry-path> [depth] [output]");
  process.exit(1);
}

analyzeDependencies(entryPath, maxDepth)
  .then(async (analysis) => {
    const docs = generateRelatedDocs(analysis);

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(
      outputPath,
      JSON.stringify({ analysis, documents: docs }, null, 2),
      "utf-8",
    );

    console.log("Related documentation analysis complete:");
    console.log(`  Entry: ${analysis.entry}`);
    console.log(`  Module type: ${analysis.module_type}`);
    console.log(
      `  Direct dependencies: ${analysis.dependencies.direct.length}`,
    );
    console.log(
      `  Indirect dependencies: ${analysis.dependencies.indirect.length}`,
    );
    console.log(`  Documents to generate: ${docs.length}`);
    console.log(`\nOutput: ${outputPath}`);
  })
  .catch((err) => {
    console.error("Analysis failed:", err);
    process.exit(1);
  });
