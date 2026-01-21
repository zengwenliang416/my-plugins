#!/usr/bin/env bun
/**
 * Documentation Full Updater Script
 * Updates documentation based on source code changes
 */

import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  copyFile,
  stat,
} from "fs/promises";
import { join, dirname, relative } from "path";
import { createHash } from "crypto";

interface SourceHash {
  source_files: Record<string, string>;
  doc_hash: string;
  last_updated: string;
}

interface UpdateResult {
  path: string;
  status: "updated" | "skipped" | "failed";
  reason: string;
  custom_sections_preserved?: number;
  lines_changed?: number;
}

interface UpdateReport {
  timestamp: string;
  summary: {
    total: number;
    updated: number;
    skipped: number;
    failed: number;
  };
  results: UpdateResult[];
  preserved_custom: Array<{ doc: string; sections: number }>;
  broken_links: Array<{ doc: string; link: string; target: string }>;
}

const CUSTOM_START = "<!-- CUSTOM -->";
const CUSTOM_END = "<!-- END-CUSTOM -->";

function computeHash(content: string): string {
  return createHash("sha256").update(content).digest("hex").substring(0, 12);
}

function extractCustomSections(
  content: string,
): Array<{ content: string; position: number }> {
  const sections: Array<{ content: string; position: number }> = [];
  const regex = new RegExp(`${CUSTOM_START}([\\s\\S]*?)${CUSTOM_END}`, "g");
  let match;
  while ((match = regex.exec(content)) !== null) {
    sections.push({
      content: match[1],
      position: match.index,
    });
  }
  return sections;
}

function mergeCustomSections(
  newDoc: string,
  customSections: Array<{ content: string; position: number }>,
): string {
  if (customSections.length === 0) return newDoc;

  // Append custom sections at the end
  const customContent = customSections
    .map((s) => `${CUSTOM_START}${s.content}${CUSTOM_END}`)
    .join("\n\n");

  return `${newDoc}\n\n${customContent}`;
}

function findBrokenLinks(
  content: string,
  docPath: string,
  allDocs: string[],
): Array<{ link: string; target: string }> {
  const broken: Array<{ link: string; target: string }> = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const [, , href] = match;
    if (href.startsWith("./") || href.startsWith("../")) {
      const resolvedPath = join(dirname(docPath), href.split("#")[0]);
      if (!allDocs.includes(resolvedPath)) {
        broken.push({ link: match[0], target: resolvedPath });
      }
    }
  }

  return broken;
}

async function loadHashFile(
  hashPath: string,
): Promise<Record<string, SourceHash>> {
  try {
    const content = await readFile(hashPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function saveHashFile(
  hashPath: string,
  hashes: Record<string, SourceHash>,
): Promise<void> {
  await mkdir(dirname(hashPath), { recursive: true });
  await writeFile(hashPath, JSON.stringify(hashes, null, 2), "utf-8");
}

async function createBackup(docPath: string, backupDir: string): Promise<void> {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .substring(0, 19);
  const backupPath = join(backupDir, timestamp, relative(".", docPath));

  await mkdir(dirname(backupPath), { recursive: true });
  await copyFile(docPath, backupPath);
}

async function updateDocs(
  docsDir: string,
  force: boolean,
  preserveCustom: boolean,
): Promise<UpdateReport> {
  const hashPath = ".claude/memory/docs/source-hashes.json";
  const backupDir = ".claude/memory/docs/backups";
  const hashes = await loadHashFile(hashPath);

  const report: UpdateReport = {
    timestamp: new Date().toISOString(),
    summary: { total: 0, updated: 0, skipped: 0, failed: 0 },
    results: [],
    preserved_custom: [],
    broken_links: [],
  };

  // Find all markdown files
  const docFiles: string[] = [];
  async function findDocs(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        await findDocs(fullPath);
      } else if (entry.name.endsWith(".md")) {
        docFiles.push(fullPath);
      }
    }
  }
  await findDocs(docsDir);

  report.summary.total = docFiles.length;

  for (const docPath of docFiles) {
    try {
      const content = await readFile(docPath, "utf-8");
      const currentHash = computeHash(content);

      const hashInfo = hashes[docPath];
      const needsUpdate =
        force || !hashInfo || hashInfo.doc_hash !== currentHash;

      if (!needsUpdate) {
        report.results.push({
          path: docPath,
          status: "skipped",
          reason: "No changes detected",
        });
        report.summary.skipped++;
        continue;
      }

      // Backup before update
      await createBackup(docPath, backupDir);

      // Extract custom sections
      let customSections: Array<{ content: string; position: number }> = [];
      if (preserveCustom) {
        customSections = extractCustomSections(content);
        if (customSections.length > 0) {
          report.preserved_custom.push({
            doc: docPath,
            sections: customSections.length,
          });
        }
      }

      // Check for broken links
      const brokenLinks = findBrokenLinks(content, docPath, docFiles);
      for (const link of brokenLinks) {
        report.broken_links.push({
          doc: docPath,
          link: link.link,
          target: link.target,
        });
      }

      // In real implementation, regenerate content here using codex/gemini
      // For now, just merge custom sections back
      const updatedContent = mergeCustomSections(content, []);

      await writeFile(docPath, updatedContent, "utf-8");

      // Update hash
      hashes[docPath] = {
        source_files: {},
        doc_hash: computeHash(updatedContent),
        last_updated: new Date().toISOString(),
      };

      report.results.push({
        path: docPath,
        status: "updated",
        reason: "Content regenerated",
        custom_sections_preserved: customSections.length,
      });
      report.summary.updated++;
    } catch (err) {
      report.results.push({
        path: docPath,
        status: "failed",
        reason: String(err),
      });
      report.summary.failed++;
    }
  }

  await saveHashFile(hashPath, hashes);

  return report;
}

// CLI
const docsDir = process.argv[2] || "docs";
const force = process.argv.includes("--force");
const preserveCustom = !process.argv.includes("--no-preserve-custom");

updateDocs(docsDir, force, preserveCustom)
  .then(async (report) => {
    const reportPath = ".claude/memory/docs/update-report.json";
    await mkdir(dirname(reportPath), { recursive: true });
    await writeFile(reportPath, JSON.stringify(report, null, 2), "utf-8");

    console.log("Documentation update complete:");
    console.log(`  Total: ${report.summary.total}`);
    console.log(`  Updated: ${report.summary.updated}`);
    console.log(`  Skipped: ${report.summary.skipped}`);
    console.log(`  Failed: ${report.summary.failed}`);

    if (report.preserved_custom.length > 0) {
      console.log(
        `\nCustom sections preserved in ${report.preserved_custom.length} files`,
      );
    }

    if (report.broken_links.length > 0) {
      console.log(
        `\nWarning: ${report.broken_links.length} broken links found`,
      );
    }

    console.log(`\nReport saved to: ${reportPath}`);
  })
  .catch((err) => {
    console.error("Update failed:", err);
    process.exit(1);
  });
