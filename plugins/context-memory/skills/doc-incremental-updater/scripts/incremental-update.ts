#!/usr/bin/env bun
/**
 * Documentation Incremental Updater Script
 * Updates documentation based on recent code changes
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { dirname } from "path";
import { $ } from "bun";

interface ChangedFile {
  path: string;
  change_type: "added" | "modified" | "deleted";
  diff_summary: {
    added_lines: number;
    removed_lines: number;
    functions_changed: string[];
    types_changed: string[];
  };
}

interface AffectedDoc {
  path: string;
  sections_to_update: string[];
  update_priority: "high" | "medium" | "low";
}

interface IncrementalUpdate {
  timestamp: string;
  since: string;
  changes: {
    files_changed: number;
    docs_updated: number;
    sections_updated: number;
  };
  changed_files: ChangedFile[];
  affected_docs: AffectedDoc[];
  proposed_changes: Array<{
    doc: string;
    section: string;
    diff: string;
  }>;
  warnings: string[];
  errors: string[];
}

async function getChangedFiles(since: string): Promise<string[]> {
  try {
    const result = await $`git diff --name-only ${since}..HEAD`.text();
    return result
      .trim()
      .split("\n")
      .filter(
        (f) => f.endsWith(".ts") || f.endsWith(".tsx") || f.endsWith(".js"),
      );
  } catch {
    return [];
  }
}

async function getFileDiff(filePath: string, since: string): Promise<string> {
  try {
    return await $`git diff ${since}..HEAD -- ${filePath}`.text();
  } catch {
    return "";
  }
}

function extractChangedFunctions(diff: string): string[] {
  const functions: string[] = [];
  // Match function declarations in diff
  const funcRegex =
    /[+-]\s*(?:async\s+)?function\s+(\w+)|[+-]\s*(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(/g;
  let match;
  while ((match = funcRegex.exec(diff)) !== null) {
    const funcName = match[1] || match[2];
    if (funcName && !functions.includes(funcName)) {
      functions.push(funcName);
    }
  }
  return functions;
}

function extractChangedTypes(diff: string): string[] {
  const types: string[] = [];
  // Match type/interface declarations in diff
  const typeRegex = /[+-]\s*(?:type|interface)\s+(\w+)/g;
  let match;
  while ((match = typeRegex.exec(diff)) !== null) {
    if (!types.includes(match[1])) {
      types.push(match[1]);
    }
  }
  return types;
}

async function loadSourceToDocMapping(): Promise<
  Record<string, { docs: string[]; sections: Record<string, string> }>
> {
  try {
    const content = await readFile(
      ".claude/memory/docs/source-to-doc.json",
      "utf-8",
    );
    return JSON.parse(content);
  } catch {
    return {};
  }
}

function findAffectedDocs(
  changedFiles: ChangedFile[],
  mapping: Record<string, { docs: string[]; sections: Record<string, string> }>,
): AffectedDoc[] {
  const affected: AffectedDoc[] = [];

  for (const file of changedFiles) {
    const docInfo = mapping[file.path];
    if (docInfo) {
      for (const docPath of docInfo.docs) {
        const sectionsToUpdate: string[] = [];

        // Find which sections need updating
        for (const func of file.diff_summary.functions_changed) {
          if (docInfo.sections[func]) {
            sectionsToUpdate.push(func);
          }
        }

        for (const type of file.diff_summary.types_changed) {
          if (docInfo.sections[type]) {
            sectionsToUpdate.push(type);
          }
        }

        if (sectionsToUpdate.length > 0 || file.change_type === "deleted") {
          affected.push({
            path: docPath,
            sections_to_update: sectionsToUpdate,
            update_priority:
              file.diff_summary.functions_changed.length > 3
                ? "high"
                : "medium",
          });
        }
      }
    }
  }

  return affected;
}

async function analyzeChanges(since: string): Promise<IncrementalUpdate> {
  const update: IncrementalUpdate = {
    timestamp: new Date().toISOString(),
    since,
    changes: { files_changed: 0, docs_updated: 0, sections_updated: 0 },
    changed_files: [],
    affected_docs: [],
    proposed_changes: [],
    warnings: [],
    errors: [],
  };

  // Get changed files
  const files = await getChangedFiles(since);
  update.changes.files_changed = files.length;

  // Analyze each file
  for (const filePath of files) {
    const diff = await getFileDiff(filePath, since);
    const addedLines = (diff.match(/^\+[^+]/gm) || []).length;
    const removedLines = (diff.match(/^-[^-]/gm) || []).length;

    update.changed_files.push({
      path: filePath,
      change_type: "modified",
      diff_summary: {
        added_lines: addedLines,
        removed_lines: removedLines,
        functions_changed: extractChangedFunctions(diff),
        types_changed: extractChangedTypes(diff),
      },
    });
  }

  // Load source-to-doc mapping
  const mapping = await loadSourceToDocMapping();

  // Find affected docs
  update.affected_docs = findAffectedDocs(update.changed_files, mapping);
  update.changes.docs_updated = update.affected_docs.length;
  update.changes.sections_updated = update.affected_docs.reduce(
    (sum, doc) => sum + doc.sections_to_update.length,
    0,
  );

  return update;
}

function generateDryRunReport(update: IncrementalUpdate): string {
  let report = `# Incremental Update Preview

**Analysis Time**: ${update.timestamp}
**Mode**: Dry Run (no changes applied)
**Since**: ${update.since}

## Changes Detected

| File | Type | Functions | Types |
|------|------|-----------|-------|
`;

  for (const file of update.changed_files) {
    report += `| ${file.path} | ${file.change_type} | ${file.diff_summary.functions_changed.join(", ") || "-"} | ${file.diff_summary.types_changed.join(", ") || "-"} |\n`;
  }

  report += `
## Affected Documents

| Document | Sections | Priority |
|----------|----------|----------|
`;

  for (const doc of update.affected_docs) {
    report += `| ${doc.path} | ${doc.sections_to_update.join(", ") || "all"} | ${doc.update_priority} |\n`;
  }

  report += `
## Summary

- Files changed: ${update.changes.files_changed}
- Documents to update: ${update.changes.docs_updated}
- Sections to update: ${update.changes.sections_updated}

---
Run without --dry-run to apply these changes.
`;

  return report;
}

// CLI
const since = process.argv[2] || "HEAD~1";
const dryRun = process.argv.includes("--dry-run");
const outputPath = ".claude/memory/docs/incremental-update.json";

analyzeChanges(since)
  .then(async (update) => {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, JSON.stringify(update, null, 2), "utf-8");

    if (dryRun) {
      const report = generateDryRunReport(update);
      console.log(report);
    } else {
      console.log("Incremental update analysis complete:");
      console.log(`  Files changed: ${update.changes.files_changed}`);
      console.log(`  Documents to update: ${update.changes.docs_updated}`);
      console.log(`  Sections to update: ${update.changes.sections_updated}`);
    }

    console.log(`\nOutput: ${outputPath}`);
  })
  .catch((err) => {
    console.error("Analysis failed:", err);
    process.exit(1);
  });
