#!/usr/bin/env npx ts-node --esm
/**
 * Update Changelog - 更新 CHANGELOG.md
 *
 * 用法: npx tsx update-changelog.ts <entry> [--version <version>]
 *
 * 输出: 更新后的 CHANGELOG.md
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

interface ChangelogEntry {
  type: "Added" | "Changed" | "Deprecated" | "Removed" | "Fixed" | "Security";
  content: string;
  breaking?: boolean;
}

type ChangelogType = ChangelogEntry["type"];

interface TypeMappingConfig {
  conventional_to_changelog?: Record<string, ChangelogType | null>;
  changelog_sections_order?: ChangelogType[];
}

const DEFAULT_TYPE_MAP: Record<string, ChangelogType | null> = {
  feat: "Added",
  fix: "Fixed",
  docs: "Changed",
  style: "Changed",
  refactor: "Changed",
  perf: "Changed",
  test: null,
  build: "Changed",
  ci: null,
  chore: null,
  revert: "Removed",
};

// 类型优先级（显示顺序）
const DEFAULT_TYPE_PRIORITY: ChangelogType[] = [
  "Changed",
  "Added",
  "Deprecated",
  "Removed",
  "Fixed",
  "Security",
];

function loadTypeMappingConfig(): {
  typeMap: Record<string, ChangelogType | null>;
  typePriority: ChangelogType[];
} {
  try {
    const currentFile = fileURLToPath(import.meta.url);
    const currentDir = path.dirname(currentFile);
    const mappingPath = path.resolve(currentDir, "../references/type-mapping.json");
    const raw = fs.readFileSync(mappingPath, "utf-8");
    const parsed = JSON.parse(raw) as TypeMappingConfig;
    return {
      typeMap: parsed.conventional_to_changelog || DEFAULT_TYPE_MAP,
      typePriority: parsed.changelog_sections_order || DEFAULT_TYPE_PRIORITY,
    };
  } catch {
    return {
      typeMap: DEFAULT_TYPE_MAP,
      typePriority: DEFAULT_TYPE_PRIORITY,
    };
  }
}

const TYPE_MAPPING = loadTypeMappingConfig();
const TYPE_MAP = TYPE_MAPPING.typeMap;
const TYPE_PRIORITY = TYPE_MAPPING.typePriority;

const CHANGELOG_TEMPLATE = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

`;

function readChangelog(path: string): string {
  if (fs.existsSync(path)) {
    return fs.readFileSync(path, "utf-8");
  }
  return CHANGELOG_TEMPLATE;
}

function parseChangelog(content: string): {
  header: string;
  sections: Map<string, Map<string, string[]>>;
  footer: string;
} {
  const lines = content.split("\n");
  const header: string[] = [];
  const sections = new Map<string, Map<string, string[]>>();
  const footer: string[] = [];

  let currentSection: string | null = null;
  let currentType: string | null = null;
  let inHeader = true;
  let inFooter = false;

  for (const line of lines) {
    // 检测版本部分
    const versionMatch = line.match(/^## \[([^\]]+)\]/);
    if (versionMatch) {
      inHeader = false;
      currentSection = versionMatch[1];
      sections.set(currentSection, new Map());
      continue;
    }

    // 检测类型部分
    const typeMatch = line.match(/^### (\w+)/);
    if (typeMatch && currentSection) {
      currentType = typeMatch[1];
      const sectionMap = sections.get(currentSection)!;
      if (!sectionMap.has(currentType)) {
        sectionMap.set(currentType, []);
      }
      continue;
    }

    // 检测链接部分（footer）
    if (line.match(/^\[.+\]:\s*http/)) {
      inFooter = true;
    }

    if (inHeader) {
      header.push(line);
    } else if (inFooter) {
      footer.push(line);
    } else if (currentSection && currentType && line.startsWith("- ")) {
      const sectionMap = sections.get(currentSection)!;
      sectionMap.get(currentType)!.push(line);
    }
  }

  return {
    header: header.join("\n"),
    sections,
    footer: footer.join("\n"),
  };
}

function addEntry(
  content: string,
  entry: ChangelogEntry,
  version?: string
): string {
  const parsed = parseChangelog(content);
  const targetSection = version || "Unreleased";

  // 确保目标 section 存在
  if (!parsed.sections.has(targetSection)) {
    parsed.sections.set(targetSection, new Map());
  }

  const sectionMap = parsed.sections.get(targetSection)!;

  // 确保类型存在
  if (!sectionMap.has(entry.type)) {
    sectionMap.set(entry.type, []);
  }

  // 添加条目
  const prefix = entry.breaking ? "- **Breaking:** " : "- ";
  sectionMap.get(entry.type)!.push(`${prefix}${entry.content}`);

  // 重建 changelog
  return rebuildChangelog(parsed, version);
}

function rebuildChangelog(
  parsed: ReturnType<typeof parseChangelog>,
  newVersion?: string
): string {
  const lines: string[] = [];

  // Header
  lines.push(parsed.header.trim());
  lines.push("");

  // Sections
  const sortedSections = [...parsed.sections.entries()].sort((a, b) => {
    if (a[0] === "Unreleased") return -1;
    if (b[0] === "Unreleased") return 1;
    return b[0].localeCompare(a[0]); // 版本号降序
  });

  for (const [section, typeMap] of sortedSections) {
    if (section === "Unreleased" && newVersion) {
      lines.push(`## [${newVersion}] - ${new Date().toISOString().split("T")[0]}`);
    } else {
      lines.push(`## [${section}]${section !== "Unreleased" ? "" : ""}`);
    }
    lines.push("");

    // 按优先级排序类型
    const sortedTypes = [...typeMap.entries()].sort((a, b) => {
      const aIdx = TYPE_PRIORITY.indexOf(a[0] as ChangelogEntry["type"]);
      const bIdx = TYPE_PRIORITY.indexOf(b[0] as ChangelogEntry["type"]);
      return aIdx - bIdx;
    });

    for (const [type, entries] of sortedTypes) {
      if (entries.length > 0) {
        lines.push(`### ${type}`);
        lines.push("");
        for (const entry of entries) {
          lines.push(entry);
        }
        lines.push("");
      }
    }
  }

  // Footer
  if (parsed.footer.trim()) {
    lines.push(parsed.footer.trim());
  }

  return lines.join("\n");
}

function commitTypeToChangelogType(
  commitType: string
): ChangelogEntry["type"] | null {
  const normalized = commitType.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(TYPE_MAP, normalized)) {
    return TYPE_MAP[normalized];
  }
  return "Changed";
}

// CLI 入口
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const versionIdx = args.indexOf("--version");
  const version = versionIdx !== -1 ? args[versionIdx + 1] : undefined;

  const entryArg = args.filter((a) => !a.startsWith("--") && a !== version)[0];

  if (!entryArg) {
    console.error("Usage: npx tsx update-changelog.ts <entry> [--version <version>]");
    console.error('Example: npx tsx update-changelog.ts "feat: Add new button component"');
    process.exit(1);
  }

  // 解析 entry (格式: type(scope)!: description)
  const match = entryArg.match(/^(\w+)(?:\([^)]+\))?(!)?:\s*(.+)$/);
  if (!match) {
    console.error("Invalid entry format. Expected: type: description");
    process.exit(1);
  }

  const [, commitType, bangMarker, description] = match;
  const changelogType = commitTypeToChangelogType(commitType);
  if (!changelogType) {
    console.log(`ℹ️ Skip changelog for commit type: ${commitType}`);
    process.exit(0);
  }

  const entry: ChangelogEntry = {
    type: changelogType,
    content: description,
    breaking: bangMarker === "!" || entryArg.includes("BREAKING"),
  };

  const changelogPath = "CHANGELOG.md";
  const content = readChangelog(changelogPath);
  const updated = addEntry(content, entry, version);

  fs.writeFileSync(changelogPath, updated);
  console.log(`✅ CHANGELOG.md updated`);
  console.log(`   Type: ${entry.type}`);
  console.log(`   Entry: ${entry.content}`);
  console.log(`   Section: [${version || "Unreleased"}]`);
}

export {
  addEntry,
  parseChangelog,
  readChangelog,
  commitTypeToChangelogType,
};
export type { ChangelogEntry };
