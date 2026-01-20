#!/usr/bin/env npx ts-node --esm
/**
 * Generate Palette - 生成配色方案
 *
 * 用法: npx ts-node generate-palette.ts <style> [--variants <count>]
 *
 * 功能: 根据设计风格生成配色方案
 */

import * as fs from "fs";
import { fileURLToPath } from "url";

interface ColorPalette {
  name: string;
  style: string;
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    accent: ColorScale;
    neutral: ColorScale;
    semantic: SemanticColors;
  };
  usage: ColorUsage;
}

interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

interface SemanticColors {
  success: string;
  warning: string;
  error: string;
  info: string;
}

interface ColorUsage {
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  border: string;
  focus: string;
}

// 预设配色方案
const STYLE_PALETTES: Record<string, Partial<ColorPalette>> = {
  minimalist: {
    name: "Minimalist Clean",
    colors: {
      primary: generateScale("#3B82F6"), // Blue
      secondary: generateScale("#64748B"), // Slate
      accent: generateScale("#8B5CF6"), // Violet
      neutral: generateScale("#6B7280"), // Gray
      semantic: {
        success: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#3B82F6",
      },
    },
    usage: {
      background: "#FFFFFF",
      surface: "#F8FAFC",
      text: {
        primary: "#0F172A",
        secondary: "#475569",
        muted: "#94A3B8",
      },
      border: "#E2E8F0",
      focus: "#3B82F6",
    },
  },
  modern: {
    name: "Modern Professional",
    colors: {
      primary: generateScale("#0EA5E9"), // Sky
      secondary: generateScale("#6366F1"), // Indigo
      accent: generateScale("#EC4899"), // Pink
      neutral: generateScale("#71717A"), // Zinc
      semantic: {
        success: "#10B981",
        warning: "#FBBF24",
        error: "#F43F5E",
        info: "#0EA5E9",
      },
    },
    usage: {
      background: "#FAFAFA",
      surface: "#FFFFFF",
      text: {
        primary: "#18181B",
        secondary: "#52525B",
        muted: "#A1A1AA",
      },
      border: "#E4E4E7",
      focus: "#0EA5E9",
    },
  },
  playful: {
    name: "Playful Vibrant",
    colors: {
      primary: generateScale("#8B5CF6"), // Violet
      secondary: generateScale("#06B6D4"), // Cyan
      accent: generateScale("#F97316"), // Orange
      neutral: generateScale("#78716C"), // Stone
      semantic: {
        success: "#4ADE80",
        warning: "#FDE047",
        error: "#FB7185",
        info: "#38BDF8",
      },
    },
    usage: {
      background: "#FFFBEB",
      surface: "#FFFFFF",
      text: {
        primary: "#292524",
        secondary: "#57534E",
        muted: "#A8A29E",
      },
      border: "#F5F5F4",
      focus: "#8B5CF6",
    },
  },
  dark: {
    name: "Dark Mode",
    colors: {
      primary: generateScale("#60A5FA"), // Blue Light
      secondary: generateScale("#A78BFA"), // Violet Light
      accent: generateScale("#34D399"), // Emerald Light
      neutral: generateScale("#9CA3AF"), // Gray
      semantic: {
        success: "#4ADE80",
        warning: "#FBBF24",
        error: "#F87171",
        info: "#60A5FA",
      },
    },
    usage: {
      background: "#0F172A",
      surface: "#1E293B",
      text: {
        primary: "#F8FAFC",
        secondary: "#CBD5E1",
        muted: "#64748B",
      },
      border: "#334155",
      focus: "#60A5FA",
    },
  },
  glassmorphism: {
    name: "Glassmorphism",
    colors: {
      primary: generateScale("#818CF8"), // Indigo Light
      secondary: generateScale("#C084FC"), // Purple Light
      accent: generateScale("#38BDF8"), // Sky Light
      neutral: generateScale("#A1A1AA"), // Zinc
      semantic: {
        success: "#34D399",
        warning: "#FCD34D",
        error: "#FB7185",
        info: "#60A5FA",
      },
    },
    usage: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      surface: "rgba(255, 255, 255, 0.1)",
      text: {
        primary: "#FFFFFF",
        secondary: "rgba(255, 255, 255, 0.8)",
        muted: "rgba(255, 255, 255, 0.5)",
      },
      border: "rgba(255, 255, 255, 0.2)",
      focus: "#818CF8",
    },
  },
};

// 从基础色生成色阶
function generateScale(baseColor: string): ColorScale {
  // 简化的色阶生成（实际应使用色彩算法）
  const hex = baseColor.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  function lighten(r: number, g: number, b: number, factor: number): string {
    const lr = Math.min(255, Math.round(r + (255 - r) * factor));
    const lg = Math.min(255, Math.round(g + (255 - g) * factor));
    const lb = Math.min(255, Math.round(b + (255 - b) * factor));
    return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`.toUpperCase();
  }

  function darken(r: number, g: number, b: number, factor: number): string {
    const dr = Math.max(0, Math.round(r * (1 - factor)));
    const dg = Math.max(0, Math.round(g * (1 - factor)));
    const db = Math.max(0, Math.round(b * (1 - factor)));
    return `#${dr.toString(16).padStart(2, "0")}${dg.toString(16).padStart(2, "0")}${db.toString(16).padStart(2, "0")}`.toUpperCase();
  }

  return {
    50: lighten(r, g, b, 0.95),
    100: lighten(r, g, b, 0.9),
    200: lighten(r, g, b, 0.7),
    300: lighten(r, g, b, 0.5),
    400: lighten(r, g, b, 0.25),
    500: baseColor.toUpperCase(),
    600: darken(r, g, b, 0.15),
    700: darken(r, g, b, 0.3),
    800: darken(r, g, b, 0.45),
    900: darken(r, g, b, 0.6),
    950: darken(r, g, b, 0.75),
  };
}

// 生成 CSS 变量
function generateCSSVariables(palette: ColorPalette): string {
  const lines: string[] = [];

  lines.push(":root {");

  // Primary colors
  for (const [shade, color] of Object.entries(palette.colors.primary)) {
    lines.push(`  --color-primary-${shade}: ${color};`);
  }

  // Secondary colors
  for (const [shade, color] of Object.entries(palette.colors.secondary)) {
    lines.push(`  --color-secondary-${shade}: ${color};`);
  }

  // Accent colors
  for (const [shade, color] of Object.entries(palette.colors.accent)) {
    lines.push(`  --color-accent-${shade}: ${color};`);
  }

  // Semantic colors
  lines.push(`  --color-success: ${palette.colors.semantic.success};`);
  lines.push(`  --color-warning: ${palette.colors.semantic.warning};`);
  lines.push(`  --color-error: ${palette.colors.semantic.error};`);
  lines.push(`  --color-info: ${palette.colors.semantic.info};`);

  // Usage colors
  lines.push(`  --color-background: ${palette.usage.background};`);
  lines.push(`  --color-surface: ${palette.usage.surface};`);
  lines.push(`  --color-text-primary: ${palette.usage.text.primary};`);
  lines.push(`  --color-text-secondary: ${palette.usage.text.secondary};`);
  lines.push(`  --color-text-muted: ${palette.usage.text.muted};`);
  lines.push(`  --color-border: ${palette.usage.border};`);
  lines.push(`  --color-focus: ${palette.usage.focus};`);

  lines.push("}");

  return lines.join("\n");
}

// 生成 Tailwind 配置
function generateTailwindConfig(palette: ColorPalette): string {
  return `// tailwind.config.js colors extension
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: ${JSON.stringify(palette.colors.primary, null, 8).replace(/"/g, "'")},
        secondary: ${JSON.stringify(palette.colors.secondary, null, 8).replace(/"/g, "'")},
        accent: ${JSON.stringify(palette.colors.accent, null, 8).replace(/"/g, "'")},
      },
    },
  },
};`;
}

// 主生成函数
function generatePalette(style: string): ColorPalette {
  const preset = STYLE_PALETTES[style] || STYLE_PALETTES.modern;

  return {
    name: preset.name || "Custom Palette",
    style,
    colors: preset.colors!,
    usage: preset.usage!,
  };
}

// 格式化输出
function formatPalette(palette: ColorPalette): string {
  const lines: string[] = [];

  lines.push(`# 配色方案: ${palette.name}`);
  lines.push("");
  lines.push(`**风格**: ${palette.style}`);
  lines.push("");

  lines.push("## 主色调");
  lines.push("");
  lines.push("| 色阶 | 色值 |");
  lines.push("|------|------|");
  for (const [shade, color] of Object.entries(palette.colors.primary)) {
    lines.push(`| ${shade} | ${color} |`);
  }
  lines.push("");

  lines.push("## 语义色");
  lines.push("");
  lines.push(`- Success: ${palette.colors.semantic.success}`);
  lines.push(`- Warning: ${palette.colors.semantic.warning}`);
  lines.push(`- Error: ${palette.colors.semantic.error}`);
  lines.push(`- Info: ${palette.colors.semantic.info}`);
  lines.push("");

  lines.push("## 使用指南");
  lines.push("");
  lines.push(`- 背景: ${palette.usage.background}`);
  lines.push(`- 表面: ${palette.usage.surface}`);
  lines.push(`- 主文本: ${palette.usage.text.primary}`);
  lines.push(`- 次文本: ${palette.usage.text.secondary}`);
  lines.push(`- 边框: ${palette.usage.border}`);
  lines.push("");

  lines.push("## CSS 变量");
  lines.push("");
  lines.push("```css");
  lines.push(generateCSSVariables(palette));
  lines.push("```");
  lines.push("");

  lines.push("## Tailwind 配置");
  lines.push("");
  lines.push("```javascript");
  lines.push(generateTailwindConfig(palette));
  lines.push("```");

  return lines.join("\n");
}

// CLI 入口
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const outputIdx = args.indexOf("--output");
  const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : null;
  const style = args.filter((a) => !a.startsWith("--") && a !== outputFile)[0];

  const availableStyles = Object.keys(STYLE_PALETTES).join(", ");

  if (!style) {
    console.error("Usage: npx ts-node generate-palette.ts <style> [--output <file>]");
    console.error(`Available styles: ${availableStyles}`);
    process.exit(1);
  }

  if (!STYLE_PALETTES[style]) {
    console.error(`Unknown style: ${style}`);
    console.error(`Available styles: ${availableStyles}`);
    process.exit(1);
  }

  const palette = generatePalette(style);
  const formatted = formatPalette(palette);

  if (outputFile) {
    fs.writeFileSync(outputFile, formatted);
    console.log(`✅ 配色方案已写入 ${outputFile}`);
  } else {
    console.log(formatted);
  }

  if (args.includes("--json")) {
    console.log("\n📦 JSON:");
    console.log(JSON.stringify(palette, null, 2));
  }

  if (args.includes("--css")) {
    console.log("\n📄 CSS Variables:");
    console.log(generateCSSVariables(palette));
  }
}

export { generatePalette, generateCSSVariables, generateTailwindConfig };
export type { ColorPalette };
