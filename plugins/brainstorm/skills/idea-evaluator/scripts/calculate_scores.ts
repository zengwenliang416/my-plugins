#!/usr/bin/env npx tsx
/**
 * Calculate evaluation scores for ideas
 * Usage: npx tsx calculate_scores.ts --ideas ideas-pool.json --weights weights.json --output evaluation.json
 */

interface Idea {
  id: string;
  title: string;
  description: string;
  technical_complexity?: number;
  timeline?: string;
  user_value?: number;
  innovation_level?: string;
  source: "codex" | "gemini";
}

interface Weights {
  impact: number;
  feasibility: number;
  innovation: number;
  alignment: number;
}

interface EvaluatedIdea extends Idea {
  scores: {
    impact: number;
    feasibility: number;
    innovation: number;
    alignment: number;
    total: number;
  };
  rank: number;
}

interface EvaluationResult {
  timestamp: string;
  weights: Weights;
  evaluated_ideas: EvaluatedIdea[];
  top_5: EvaluatedIdea[];
  statistics: {
    total_ideas: number;
    avg_score: number;
    max_score: number;
    min_score: number;
  };
}

function calculateImpact(idea: Idea): number {
  if (idea.user_value) return idea.user_value;
  // Infer from description length and keywords
  const keywords = ["解决", "提升", "优化", "创新", "突破"];
  const matches = keywords.filter((k) => idea.description.includes(k)).length;
  return Math.min(5, 2 + matches);
}

function calculateFeasibility(idea: Idea): number {
  if (idea.technical_complexity) return 6 - idea.technical_complexity; // Invert: low complexity = high feasibility
  if (idea.timeline === "短期") return 5;
  if (idea.timeline === "中期") return 3;
  if (idea.timeline === "长期") return 2;
  return 3;
}

function calculateInnovation(idea: Idea): number {
  if (idea.innovation_level === "突破") return 5;
  if (idea.innovation_level === "渐进") return 3;
  // Infer from keywords
  const keywords = ["全新", "首创", "颠覆", "革命"];
  const matches = keywords.filter((k) => idea.description.includes(k)).length;
  return Math.min(5, 2 + matches * 2);
}

function calculateAlignment(_idea: Idea): number {
  // Default alignment score (would need context to calculate properly)
  return 4;
}

function evaluateIdeas(ideas: Idea[], weights: Weights): EvaluatedIdea[] {
  const totalWeight = weights.impact + weights.feasibility + weights.innovation + weights.alignment;

  const evaluated = ideas.map((idea) => {
    const scores = {
      impact: calculateImpact(idea),
      feasibility: calculateFeasibility(idea),
      innovation: calculateInnovation(idea),
      alignment: calculateAlignment(idea),
      total: 0,
    };

    scores.total =
      (scores.impact * weights.impact +
        scores.feasibility * weights.feasibility +
        scores.innovation * weights.innovation +
        scores.alignment * weights.alignment) /
      totalWeight;

    return { ...idea, scores, rank: 0 };
  });

  // Sort by total score and assign ranks
  evaluated.sort((a, b) => b.scores.total - a.scores.total);
  evaluated.forEach((idea, index) => {
    idea.rank = index + 1;
  });

  return evaluated;
}

async function main() {
  const args = process.argv.slice(2);
  let ideasFile = "";
  let weightsFile = "";
  let outputFile = "evaluation.json";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--ideas") ideasFile = args[++i];
    if (args[i] === "--weights") weightsFile = args[++i];
    if (args[i] === "--output") outputFile = args[++i];
  }

  const fs = await import("fs/promises");

  const ideasData = JSON.parse(await fs.readFile(ideasFile, "utf-8"));
  const ideas: Idea[] = ideasData.ideas || ideasData;

  const defaultWeights: Weights = { impact: 35, feasibility: 35, innovation: 20, alignment: 10 };
  const weights: Weights = weightsFile
    ? JSON.parse(await fs.readFile(weightsFile, "utf-8"))
    : defaultWeights;

  const evaluated = evaluateIdeas(ideas, weights);
  const scores = evaluated.map((i) => i.scores.total);

  const result: EvaluationResult = {
    timestamp: new Date().toISOString(),
    weights,
    evaluated_ideas: evaluated,
    top_5: evaluated.slice(0, 5),
    statistics: {
      total_ideas: evaluated.length,
      avg_score: scores.reduce((a, b) => a + b, 0) / scores.length,
      max_score: Math.max(...scores),
      min_score: Math.min(...scores),
    },
  };

  await fs.writeFile(outputFile, JSON.stringify(result, null, 2));
  console.log(`Evaluated ${result.statistics.total_ideas} ideas, saved to ${outputFile}`);
}

main().catch(console.error);
