#!/usr/bin/env npx ts-node --esm
/**
 * Skill Loader Script
 * Loads skill content with optional references.
 *
 * Usage:
 *   npx ts-node --esm load-skill.ts <output-file> <skill-name> [mode]
 * Modes:
 *   full | summary | selective
 */

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "fs";
import { basename, join } from "path";
import { fileURLToPath } from "url";

type Mode = "full" | "summary" | "selective";

function log(message: string): void {
  console.log(`[skill-loader] ${message}`);
}

function usage(): void {
  console.log("Usage: load-skill.ts <output-file> <skill-name> [mode]");
  console.log("Modes: full, summary, selective");
}

function extractFrontmatter(content: string): string {
  const lines = content.split("\n");
  const start = lines.findIndex((line) => line.trim() === "---");
  if (start === -1) {
    return content;
  }
  const end = lines.findIndex((line, index) => index > start && line.trim() === "---");
  if (end === -1) {
    return content;
  }
  return lines.slice(start, end + 1).join("\n");
}

function run(): void {
  const scriptDir = fileURLToPath(new URL(".", import.meta.url));
  const defaultSkillsDir = join(scriptDir, "..", "..");
  const skillsDir = process.env.SKILLS_DIR || defaultSkillsDir;
  const outputFile = process.argv[2] || "skill-content.md";
  const skillName = process.argv[3] || "";
  const modeArg = (process.argv[4] || "full").toLowerCase();
  const mode: Mode = modeArg === "summary" || modeArg === "selective" ? modeArg : "full";

  if (!skillName) {
    usage();
    process.exit(1);
  }

  const skillPath = join(skillsDir, skillName);
  const skillFile = join(skillPath, "SKILL.md");

  if (!existsSync(skillFile)) {
    throw new Error(`Skill not found: ${skillFile}`);
  }

  log(`Loading skill: ${skillName} (mode: ${mode})`);

  const lines: string[] = [];
  lines.push(`# Skill: ${skillName}`);
  lines.push("");
  lines.push(`Loaded: ${new Date().toISOString()}`);
  lines.push(`Mode: ${mode}`);
  lines.push("");
  lines.push("## Main Content");
  lines.push("");

  const mainContent = readFileSync(skillFile, "utf-8");
  if (mode === "summary") {
    lines.push(extractFrontmatter(mainContent));
  } else {
    lines.push(mainContent);
  }
  lines.push("");

  if (mode === "full") {
    const refsDir = join(skillPath, "references");
    if (existsSync(refsDir)) {
      const refFiles = readdirSync(refsDir)
        .filter((entry) => entry.endsWith(".md"))
        .map((entry) => join(refsDir, entry))
        .filter((filePath) => statSync(filePath).isFile())
        .sort();

      if (refFiles.length > 0) {
        log("Loading references...");
        lines.push("## References");
        lines.push("");
        for (const refPath of refFiles) {
          lines.push(`### ${basename(refPath, ".md")}`);
          lines.push("");
          lines.push(readFileSync(refPath, "utf-8"));
          lines.push("");
        }
      }
    }
  }

  const output = `${lines.join("\n")}\n`;
  writeFileSync(outputFile, output, "utf-8");

  const tokenEstimate = Math.floor(output.length / 4);
  log(`Loaded: ${outputFile}`);
  log(`Estimated tokens: ${tokenEstimate}`);
  console.log("Done!");
}

try {
  run();
} catch (error) {
  console.error(`Error: ${(error as Error).message}`);
  process.exit(1);
}
