#!/usr/bin/env npx tsx
/**
 * Merge and deduplicate ideas from multiple sources (Codex + Gemini)
 * Usage: npx tsx merge_ideas.ts --codex codex-output.json --gemini gemini-output.json --output ideas-pool.json
 */

interface CodexIdea {
  id: string;
  title: string;
  description: string;
  technical_complexity: number;
  timeline: string;
  dependencies: string[];
  source: "codex";
}

interface GeminiIdea {
  id: string;
  title: string;
  description: string;
  user_value: number;
  innovation_level: string;
  emotional_appeal: string;
  source: "gemini";
}

type Idea = CodexIdea | GeminiIdea;

interface MergeResult {
  timestamp: string;
  total_ideas: number;
  sources: {
    codex: number;
    gemini: number;
  };
  ideas: Idea[];
  duplicates_removed: number;
}

function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / union.size;
}

function deduplicateIdeas(ideas: Idea[], threshold = 0.8): Idea[] {
  const result: Idea[] = [];
  const removed: string[] = [];

  for (const idea of ideas) {
    const isDuplicate = result.some((existing) => {
      const titleSim = calculateSimilarity(idea.title, existing.title);
      const descSim = calculateSimilarity(idea.description, existing.description);
      return titleSim > threshold || descSim > threshold;
    });

    if (!isDuplicate) {
      result.push(idea);
    } else {
      removed.push(idea.id);
    }
  }

  console.log(`Removed ${removed.length} duplicates: ${removed.join(", ")}`);
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  let codexFile = "";
  let geminiFile = "";
  let outputFile = "ideas-pool.json";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--codex") codexFile = args[++i];
    if (args[i] === "--gemini") geminiFile = args[++i];
    if (args[i] === "--output") outputFile = args[++i];
  }

  const fs = await import("fs/promises");

  const codexIdeas: CodexIdea[] = codexFile
    ? JSON.parse(await fs.readFile(codexFile, "utf-8"))
    : [];
  const geminiIdeas: GeminiIdea[] = geminiFile
    ? JSON.parse(await fs.readFile(geminiFile, "utf-8"))
    : [];

  const allIdeas: Idea[] = [...codexIdeas, ...geminiIdeas];
  const deduped = deduplicateIdeas(allIdeas);

  const result: MergeResult = {
    timestamp: new Date().toISOString(),
    total_ideas: deduped.length,
    sources: {
      codex: deduped.filter((i) => i.source === "codex").length,
      gemini: deduped.filter((i) => i.source === "gemini").length,
    },
    ideas: deduped,
    duplicates_removed: allIdeas.length - deduped.length,
  };

  await fs.writeFile(outputFile, JSON.stringify(result, null, 2));
  console.log(`Merged ${result.total_ideas} ideas to ${outputFile}`);
}

main().catch(console.error);
