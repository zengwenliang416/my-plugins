#!/usr/bin/env npx tsx
/**
 * Frontend Design Database Search Tool
 *
 * 搜索设计数据库中的风格、配色、字体等资源
 *
 * Usage:
 *   npx tsx search_design.ts --help
 *   npx tsx search_design.ts --query "glassmorphism dark"
 *   npx tsx search_design.ts --domain style --query "modern"
 *   npx tsx search_design.ts --domain color --industry fintech
 *   npx tsx search_design.ts --domain typography --query "code"
 */

import * as fs from "fs";
import * as path from "path";

// ============================================================================
// Design Database
// ============================================================================

interface DesignItem {
  name: string;
  keywords: string[];
  description: string;
  category?: string;
  industry?: string[];
  data?: Record<string, unknown>;
}

const STYLES: DesignItem[] = [
  {
    name: "glassmorphism",
    keywords: ["glass", "blur", "translucent", "frosted", "modern", "premium"],
    description: "精致毛玻璃效果，适用于系统 UI、控制面板、高端产品",
    category: "visual",
    data: {
      css: "backdrop-filter: blur(20px) saturate(180%); background: rgba(255,255,255,0.7);",
      references: ["macOS Sonoma", "Raycast", "Arc Browser"],
    },
  },
  {
    name: "neubrutalism",
    keywords: ["brutal", "bold", "stark", "raw", "punchy", "edgy"],
    description: "新野兽派，粗黑边框+高饱和撞色，适用于创意工具、独立产品",
    category: "visual",
    data: {
      css: "border: 3px solid #000; box-shadow: 4px 4px 0 #000;",
      colors: ["#ffde59+#000", "#ff6b9d+#00d4ff", "#ff8c42+#1a1a2e"],
      references: ["Gumroad", "Figma Community", "Pitch"],
    },
  },
  {
    name: "bento-grid",
    keywords: ["grid", "asymmetric", "modular", "dashboard", "apple"],
    description: "便当盒布局，不规则网格，适用于 Dashboard、产品展示",
    category: "layout",
    data: {
      css: "display: grid; grid-template-columns: repeat(4, 1fr);",
      references: ["Apple", "Linear", "Vercel Dashboard"],
    },
  },
  {
    name: "dark-mode-first",
    keywords: ["dark", "neon", "developer", "tech", "modern"],
    description: "深色优先，霓虹亮色点缀，适用于开发者工具、SaaS",
    category: "theme",
    industry: ["saas", "developer", "tech"],
    data: {
      colors: { bg: "#0a0a0a", text: "#fafafa", accent: "#00ff88" },
      references: ["Vercel", "Supabase", "Railway", "Linear"],
    },
  },
  {
    name: "terminal-ui",
    keywords: ["terminal", "code", "cli", "developer", "monospace"],
    description: "终端/代码编辑器风格，适用于开发者工具、技术产品",
    category: "visual",
    industry: ["developer", "tech"],
    data: {
      fonts: ["JetBrains Mono", "Fira Code", "Berkeley Mono"],
      references: ["Warp Terminal", "Raycast", "GitHub Copilot"],
    },
  },
  {
    name: "editorial",
    keywords: ["magazine", "typography", "editorial", "luxury", "content"],
    description: "编辑/杂志风，大胆排版+不对称布局，适用于内容平台",
    category: "layout",
    data: {
      css: "font-size: clamp(3rem, 8vw, 8rem);",
      references: ["The Outline", "Bloomberg", "Apple Newsroom"],
    },
  },
  {
    name: "organic-shapes",
    keywords: ["blob", "wave", "organic", "fluid", "natural"],
    description: "有机形状，blob/波浪/不规则曲线，适用于品牌官网",
    category: "visual",
    data: {
      elements: ["SVG blob", "clip-path", "fluid animation"],
      references: ["Stripe", "Loom", "Notion", "Webflow"],
    },
  },
  {
    name: "neumorphism",
    keywords: ["soft", "shadow", "emboss", "subtle", "quiet"],
    description: "软拟物，柔和阴影，适用于设置面板、音乐播放器",
    category: "visual",
  },
  {
    name: "claymorphism",
    keywords: ["3d", "clay", "rounded", "playful", "fun"],
    description: "粘土风，3D圆润感，适用于儿童产品、游戏",
    category: "visual",
  },
  {
    name: "aurora",
    keywords: ["gradient", "aurora", "flowing", "ethereal", "creative"],
    description: "极光渐变，流动感，适用于创意、艺术项目",
    category: "visual",
  },
  {
    name: "cyberpunk",
    keywords: ["neon", "cyber", "scifi", "futuristic", "gaming"],
    description: "赛博朋克，霓虹+科幻，适用于游戏、娱乐",
    category: "visual",
    industry: ["gaming", "entertainment"],
  },
  {
    name: "swiss-design",
    keywords: ["grid", "geometric", "minimal", "clean", "corporate"],
    description: "瑞士设计，网格+几何+极简，适用于企业、专业",
    category: "layout",
    industry: ["corporate", "enterprise"],
  },
];

const COLORS: DesignItem[] = [
  {
    name: "vercel-dark",
    keywords: ["dark", "minimal", "tech"],
    description: "Vercel 风格深色主题",
    industry: ["saas", "tech"],
    data: {
      primary: "#000",
      accent: "#0070f3",
      bg: "#0a0a0a",
      text: "#fafafa",
    },
  },
  {
    name: "linear-purple",
    keywords: ["purple", "dark", "modern"],
    description: "Linear 风格紫色主题",
    industry: ["saas", "productivity"],
    data: { primary: "#5e6ad2", accent: "#8b5cf6", bg: "#0f0f10" },
  },
  {
    name: "supabase-green",
    keywords: ["green", "dark", "developer"],
    description: "Supabase 风格绿色主题",
    industry: ["developer", "database"],
    data: { primary: "#3ecf8e", bg: "#1c1c1c", text: "#f8f8f8" },
  },
  {
    name: "stripe-neutral",
    keywords: ["neutral", "light", "professional"],
    description: "Stripe 风格中性主题",
    industry: ["fintech", "payment"],
    data: {
      primary: "#635bff",
      accent: "#00d4ff",
      bg: "#fff",
      text: "#0a2540",
    },
  },
  {
    name: "fintech-trust",
    keywords: ["blue", "trust", "professional"],
    description: "金融科技信任感配色",
    industry: ["fintech", "banking"],
    data: { primary: "#1a365d", accent: "#2b6cb0", bg: "#f7fafc" },
  },
  {
    name: "healthcare-calm",
    keywords: ["teal", "calm", "clean"],
    description: "医疗健康平静配色",
    industry: ["healthcare", "medical"],
    data: { primary: "#38b2ac", accent: "#4fd1c5", bg: "#f0fff4" },
  },
  {
    name: "luxury-gold",
    keywords: ["gold", "luxury", "premium"],
    description: "奢侈品金色配色",
    industry: ["luxury", "fashion"],
    data: { primary: "#c9a962", accent: "#1a1a1a", bg: "#fefefe" },
  },
  {
    name: "ecommerce-vibrant",
    keywords: ["vibrant", "colorful", "energetic"],
    description: "电商活力配色",
    industry: ["ecommerce", "retail"],
    data: { primary: "#ff6b6b", accent: "#feca57", bg: "#fff" },
  },
];

const TYPOGRAPHY: DesignItem[] = [
  {
    name: "modern-tech",
    keywords: ["modern", "tech", "clean"],
    description: "现代科技风字体搭配",
    data: {
      heading: "Satoshi",
      body: "Plus Jakarta Sans",
      code: "JetBrains Mono",
    },
  },
  {
    name: "editorial-elegant",
    keywords: ["editorial", "elegant", "serif"],
    description: "编辑优雅风字体搭配",
    data: {
      heading: "Clash Display",
      body: "Source Serif",
      accent: "Fraunces",
    },
  },
  {
    name: "developer-focused",
    keywords: ["developer", "monospace", "technical"],
    description: "开发者风格字体搭配",
    data: { heading: "Geist", body: "Geist", code: "Geist Mono" },
  },
  {
    name: "chinese-modern",
    keywords: ["chinese", "modern", "clean"],
    description: "现代中文字体搭配",
    data: {
      heading: "阿里巴巴普惠体 Bold",
      body: "思源黑体 Regular",
      accent: "得意黑",
    },
  },
  {
    name: "brutal-display",
    keywords: ["brutal", "bold", "display"],
    description: "野兽派展示字体",
    data: { heading: "Cabinet Grotesk", body: "DM Sans", accent: "Migra" },
  },
];

const COMPONENTS: DesignItem[] = [
  {
    name: "terminal-window",
    keywords: ["terminal", "window", "code"],
    description: "终端窗口组件，带红黄绿控制按钮",
    data: { file: "design-database.md#terminal-window" },
  },
  {
    name: "cli-button",
    keywords: ["cli", "button", "command"],
    description: "CLI 风格按钮，带 $ 前缀",
    data: { file: "design-database.md#cli-button" },
  },
  {
    name: "glass-card",
    keywords: ["glass", "card", "blur"],
    description: "毛玻璃卡片组件",
    data: { file: "stack-guidelines.md#glassmorphism" },
  },
  {
    name: "bento-layout",
    keywords: ["bento", "grid", "layout"],
    description: "便当盒网格布局",
    data: { file: "design-database.md#bento-grid" },
  },
];

// ============================================================================
// Search Logic
// ============================================================================

type Domain = "style" | "color" | "typography" | "component" | "all";

interface SearchOptions {
  query?: string;
  domain?: Domain;
  industry?: string;
  limit?: number;
}

interface SearchResult {
  domain: string;
  item: DesignItem;
  score: number;
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/\s+/).filter(Boolean);
}

function matchScore(item: DesignItem, tokens: string[]): number {
  let score = 0;
  const searchable = [
    item.name,
    item.description,
    ...item.keywords,
    ...(item.industry || []),
  ]
    .join(" ")
    .toLowerCase();

  for (const token of tokens) {
    if (item.name.toLowerCase().includes(token)) score += 10;
    if (item.keywords.some((k) => k.includes(token))) score += 5;
    if (searchable.includes(token)) score += 1;
  }
  return score;
}

function search(options: SearchOptions): SearchResult[] {
  const { query = "", domain = "all", industry, limit = 10 } = options;
  const tokens = tokenize(query);

  const databases: Record<string, DesignItem[]> = {
    style: STYLES,
    color: COLORS,
    typography: TYPOGRAPHY,
    component: COMPONENTS,
  };

  const results: SearchResult[] = [];

  const domainsToSearch = domain === "all" ? Object.keys(databases) : [domain];

  for (const d of domainsToSearch) {
    const items = databases[d] || [];
    for (const item of items) {
      // Industry filter
      if (industry && item.industry && !item.industry.includes(industry)) {
        continue;
      }

      const score = tokens.length > 0 ? matchScore(item, tokens) : 1;
      if (score > 0) {
        results.push({ domain: d, item, score });
      }
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

// ============================================================================
// CLI
// ============================================================================

function printHelp(): void {
  console.log(`
Frontend Design Database Search Tool

Usage:
  npx tsx search_design.ts [options]

Options:
  --query, -q <text>     Search query (keywords)
  --domain, -d <type>    Search domain: style|color|typography|component|all
  --industry, -i <type>  Filter by industry: saas|fintech|healthcare|ecommerce|developer|...
  --limit, -l <number>   Max results (default: 10)
  --help, -h             Show this help

Examples:
  npx tsx search_design.ts --query "glassmorphism dark"
  npx tsx search_design.ts --domain color --industry fintech
  npx tsx search_design.ts -d style -q "modern minimal"
  npx tsx search_design.ts --domain typography --query "code"

Domains:
  style      - UI styles (glassmorphism, neubrutalism, bento-grid, ...)
  color      - Color palettes by industry
  typography - Font pairings
  component  - Common component patterns
  all        - Search all domains (default)

Industries:
  saas, fintech, healthcare, ecommerce, developer, gaming, luxury, ...
`);
}

function formatResult(result: SearchResult): string {
  const { domain, item, score } = result;
  const lines = [
    `[${domain.toUpperCase()}] ${item.name} (score: ${score})`,
    `  ${item.description}`,
    `  Keywords: ${item.keywords.join(", ")}`,
  ];

  if (item.industry) {
    lines.push(`  Industries: ${item.industry.join(", ")}`);
  }

  if (item.data) {
    lines.push(
      `  Data: ${JSON.stringify(item.data, null, 2).split("\n").join("\n  ")}`,
    );
  }

  return lines.join("\n");
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    printHelp();
    return;
  }

  const options: SearchOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--query":
      case "-q":
        options.query = next;
        i++;
        break;
      case "--domain":
      case "-d":
        options.domain = next as Domain;
        i++;
        break;
      case "--industry":
      case "-i":
        options.industry = next;
        i++;
        break;
      case "--limit":
      case "-l":
        options.limit = parseInt(next, 10);
        i++;
        break;
    }
  }

  const results = search(options);

  if (results.length === 0) {
    console.log("No results found.");
    console.log("\nTry:");
    console.log("  - Using different keywords");
    console.log("  - Searching in a different domain (--domain all)");
    console.log("  - Removing industry filter");
    return;
  }

  console.log(`Found ${results.length} result(s):\n`);

  for (const result of results) {
    console.log(formatResult(result));
    console.log();
  }
}

main();
