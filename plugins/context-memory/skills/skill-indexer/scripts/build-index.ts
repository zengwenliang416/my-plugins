#!/usr/bin/env bun
/**
 * Skill Index Builder
 * Scans skill directories and builds searchable index
 */

import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { parse as parseYaml } from "yaml";

interface SkillInfo {
  name: string;
  path: string;
  description: string;
  triggers: string[];
  tools: string[];
  category: string;
  arguments?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
}

interface SkillIndex {
  version: string;
  generated: string;
  skills: SkillInfo[];
  categories: Record<string, string[]>;
}

async function parseSkillFile(filePath: string): Promise<SkillInfo | null> {
  try {
    const content = await readFile(filePath, "utf-8");

    // Extract YAML frontmatter
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;

    const frontmatter = parseYaml(match[1]);

    // Extract triggers from description
    const triggers: string[] = [];
    const triggerMatch =
      frontmatter.description?.match(/【触发条件】([^\n【]+)/);
    if (triggerMatch) {
      triggers.push(
        ...triggerMatch[1].split(/或|,/).map((t: string) => t.trim()),
      );
    }

    // Determine category
    let category = "utility";
    const desc = frontmatter.description?.toLowerCase() || "";
    if (desc.includes("工作流") || desc.includes("workflow"))
      category = "workflow";
    else if (desc.includes("分析") || desc.includes("analysis"))
      category = "analysis";
    else if (desc.includes("生成") || desc.includes("generator"))
      category = "generation";

    return {
      name: frontmatter.name,
      path: filePath,
      description: frontmatter.description?.split("\n")[0] || "",
      triggers,
      tools: frontmatter["allowed-tools"] || [],
      category,
      arguments: frontmatter.arguments,
    };
  } catch (err) {
    console.error(`Failed to parse ${filePath}:`, err);
    return null;
  }
}

async function scanSkillDirs(rootDir: string): Promise<SkillInfo[]> {
  const skills: SkillInfo[] = [];

  try {
    const entries = await readdir(rootDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillFile = join(rootDir, entry.name, "SKILL.md");
        try {
          const skill = await parseSkillFile(skillFile);
          if (skill) {
            skill.path = `skills/${entry.name}`;
            skills.push(skill);
          }
        } catch {
          // SKILL.md doesn't exist in this directory
        }
      }
    }
  } catch (err) {
    console.error(`Failed to scan ${rootDir}:`, err);
  }

  return skills;
}

function buildCategories(skills: SkillInfo[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {};

  for (const skill of skills) {
    if (!categories[skill.category]) {
      categories[skill.category] = [];
    }
    categories[skill.category].push(skill.name);
  }

  return categories;
}

async function buildIndex(
  skillsDir: string,
  outputPath: string,
): Promise<void> {
  console.log(`Scanning skills in ${skillsDir}...`);

  const skills = await scanSkillDirs(skillsDir);
  const categories = buildCategories(skills);

  const index: SkillIndex = {
    version: "1.0.0",
    generated: new Date().toISOString(),
    skills,
    categories,
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(index, null, 2), "utf-8");

  console.log(`Index built: ${skills.length} skills found`);
  console.log(`Categories: ${Object.keys(categories).join(", ")}`);
  console.log(`Output: ${outputPath}`);
}

// Main
const skillsDir = process.argv[2] || "plugins/memory/skills";
const outputPath = process.argv[3] || ".claude/memory/skills/index.json";

buildIndex(skillsDir, outputPath).catch((err) => {
  console.error("Failed to build index:", err);
  process.exit(1);
});
