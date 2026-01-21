#!/usr/bin/env bun
/**
 * Style Detection Script
 * Analyzes project files to detect coding style patterns
 */

import { readFile, writeFile, mkdir, readdir, stat } from "fs/promises";
import { join, extname } from "path";

interface CodeStyle {
  indent: "spaces" | "tabs";
  indentSize: number;
  quotes: "single" | "double";
  semicolons: boolean;
  trailingComma: "none" | "es5" | "all";
}

interface NamingConvention {
  files: string;
  functions: string;
  classes: string;
  constants: string;
}

interface StyleProfile {
  project_id: string;
  detected_styles: {
    code_style: CodeStyle;
    naming_convention: NamingConvention;
  };
  learned_from: Array<{ file: string; confidence: number }>;
  updated_at: string;
}

async function findSourceFiles(dir: string, maxFiles = 10): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string) {
    if (files.length >= maxFiles) return;

    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (files.length >= maxFiles) break;

      const fullPath = join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (
          !entry.name.startsWith(".") &&
          entry.name !== "node_modules" &&
          entry.name !== "dist"
        ) {
          await walk(fullPath);
        }
      } else {
        const ext = extname(entry.name);
        if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  await walk(dir);
  return files;
}

function detectIndent(content: string): {
  type: "spaces" | "tabs";
  size: number;
} {
  const lines = content.split("\n");
  let tabCount = 0;
  let spaceCount = 0;
  const spaceSizes: Record<number, number> = {};

  for (const line of lines) {
    const match = line.match(/^(\s+)/);
    if (match) {
      if (match[1].includes("\t")) {
        tabCount++;
      } else {
        spaceCount++;
        const size = match[1].length;
        spaceSizes[size] = (spaceSizes[size] || 0) + 1;
      }
    }
  }

  const type = tabCount > spaceCount ? "tabs" : "spaces";
  let size = 2;
  if (type === "spaces") {
    // Find most common indent size
    let maxCount = 0;
    for (const [s, count] of Object.entries(spaceSizes)) {
      if (count > maxCount && parseInt(s) <= 4) {
        maxCount = count;
        size = parseInt(s);
      }
    }
  }

  return { type, size };
}

function detectQuotes(content: string): "single" | "double" {
  const singleCount = (content.match(/'/g) || []).length;
  const doubleCount = (content.match(/"/g) || []).length;
  return singleCount > doubleCount ? "single" : "double";
}

function detectSemicolons(content: string): boolean {
  const withSemi = (content.match(/;\s*$/gm) || []).length;
  const lines = content.split("\n").filter((l) => l.trim()).length;
  return withSemi > lines * 0.3;
}

function detectNamingConvention(files: string[]): NamingConvention {
  const fileNames = files.map((f) => f.split("/").pop() || "");

  let kebab = 0,
    camel = 0,
    pascal = 0;
  for (const name of fileNames) {
    const base = name.replace(/\.[^.]+$/, "");
    if (/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(base)) kebab++;
    else if (/^[a-z][a-zA-Z0-9]*$/.test(base)) camel++;
    else if (/^[A-Z][a-zA-Z0-9]*$/.test(base)) pascal++;
  }

  const fileStyle =
    kebab >= camel && kebab >= pascal
      ? "kebab-case"
      : pascal >= camel
        ? "PascalCase"
        : "camelCase";

  return {
    files: fileStyle,
    functions: "camelCase",
    classes: "PascalCase",
    constants: "UPPER_SNAKE_CASE",
  };
}

async function detectStyle(projectDir: string): Promise<StyleProfile> {
  const files = await findSourceFiles(projectDir);

  if (files.length === 0) {
    throw new Error("No source files found");
  }

  const samples: Array<{
    indent: { type: "spaces" | "tabs"; size: number };
    quotes: "single" | "double";
    semicolons: boolean;
  }> = [];

  for (const file of files) {
    const content = await readFile(file, "utf-8");
    samples.push({
      indent: detectIndent(content),
      quotes: detectQuotes(content),
      semicolons: detectSemicolons(content),
    });
  }

  // Aggregate results
  const indentType =
    samples.filter((s) => s.indent.type === "spaces").length >
    samples.length / 2
      ? "spaces"
      : "tabs";
  const indentSize = Math.round(
    samples.reduce((sum, s) => sum + s.indent.size, 0) / samples.length,
  );
  const quotes =
    samples.filter((s) => s.quotes === "single").length > samples.length / 2
      ? "single"
      : "double";
  const semicolons =
    samples.filter((s) => s.semicolons).length > samples.length / 2;

  return {
    project_id: projectDir.split("/").pop() || "unknown",
    detected_styles: {
      code_style: {
        indent: indentType,
        indentSize,
        quotes,
        semicolons,
        trailingComma: "es5",
      },
      naming_convention: detectNamingConvention(files),
    },
    learned_from: files.map((f) => ({
      file: f,
      confidence: 0.8,
    })),
    updated_at: new Date().toISOString(),
  };
}

// Main
const projectDir = process.argv[2] || ".";
const outputPath = process.argv[3] || ".claude/memory/style-profile.json";

detectStyle(projectDir)
  .then(async (profile) => {
    await mkdir(join(outputPath, ".."), { recursive: true });
    await writeFile(outputPath, JSON.stringify(profile, null, 2), "utf-8");

    console.log("Style detection complete:");
    console.log(JSON.stringify(profile.detected_styles, null, 2));
    console.log(`\nOutput: ${outputPath}`);
  })
  .catch((err) => {
    console.error("Detection failed:", err);
    process.exit(1);
  });
