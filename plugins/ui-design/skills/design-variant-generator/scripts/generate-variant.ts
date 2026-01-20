#!/usr/bin/env npx ts-node --esm
/**
 * Generate Variant - 生成设计变体
 *
 * 用法: npx ts-node generate-variant.ts <base-design> --variant <A|B|C> [--output <file>]
 *
 * 功能: 基于基础设计生成多个变体方案
 */

import * as fs from "fs";
import { fileURLToPath } from "url";

interface DesignVariant {
  id: string;
  name: string;
  baseDesign: string;
  theme: VariantTheme;
  components: VariantComponent[];
  cssVariables: Record<string, string>;
  tailwindExtend: Record<string, any>;
}

interface VariantTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  borderRadius: string;
  shadow: string;
  fontFamily: string;
}

interface VariantComponent {
  name: string;
  styles: Record<string, string>;
  variants: string[];
}

// 预设变体配置
const VARIANT_PRESETS: Record<string, Partial<VariantTheme>> = {
  A: {
    // 现代简约
    primaryColor: "#3B82F6",
    secondaryColor: "#64748B",
    accentColor: "#8B5CF6",
    backgroundColor: "#FFFFFF",
    surfaceColor: "#F8FAFC",
    textColor: "#0F172A",
    borderRadius: "8px",
    shadow: "0 1px 3px rgba(0,0,0,0.1)",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  B: {
    // 活泼鲜艳
    primaryColor: "#EC4899",
    secondaryColor: "#06B6D4",
    accentColor: "#F59E0B",
    backgroundColor: "#FFFBEB",
    surfaceColor: "#FFFFFF",
    textColor: "#1F2937",
    borderRadius: "12px",
    shadow: "0 4px 6px rgba(0,0,0,0.1)",
    fontFamily: "Poppins, system-ui, sans-serif",
  },
  C: {
    // 深色专业
    primaryColor: "#60A5FA",
    secondaryColor: "#A78BFA",
    accentColor: "#34D399",
    backgroundColor: "#0F172A",
    surfaceColor: "#1E293B",
    textColor: "#F8FAFC",
    borderRadius: "6px",
    shadow: "0 2px 4px rgba(0,0,0,0.3)",
    fontFamily: "JetBrains Mono, monospace",
  },
};

// 组件样式模板
function generateComponentStyles(theme: VariantTheme): VariantComponent[] {
  return [
    {
      name: "Button",
      styles: {
        base: `
          padding: 8px 16px;
          border-radius: ${theme.borderRadius};
          font-family: ${theme.fontFamily};
          font-weight: 500;
          transition: all 0.2s ease;
        `,
        primary: `
          background-color: ${theme.primaryColor};
          color: white;
          box-shadow: ${theme.shadow};
        `,
        secondary: `
          background-color: transparent;
          color: ${theme.primaryColor};
          border: 1px solid ${theme.primaryColor};
        `,
        ghost: `
          background-color: transparent;
          color: ${theme.textColor};
        `,
      },
      variants: ["primary", "secondary", "ghost"],
    },
    {
      name: "Card",
      styles: {
        base: `
          background-color: ${theme.surfaceColor};
          border-radius: ${theme.borderRadius};
          box-shadow: ${theme.shadow};
          padding: 16px;
        `,
        bordered: `
          border: 1px solid ${theme.secondaryColor}20;
        `,
        elevated: `
          box-shadow: 0 8px 16px rgba(0,0,0,0.15);
        `,
      },
      variants: ["bordered", "elevated"],
    },
    {
      name: "Input",
      styles: {
        base: `
          padding: 8px 12px;
          border-radius: ${theme.borderRadius};
          border: 1px solid ${theme.secondaryColor}40;
          background-color: ${theme.surfaceColor};
          color: ${theme.textColor};
          font-family: ${theme.fontFamily};
        `,
        focus: `
          border-color: ${theme.primaryColor};
          outline: none;
          box-shadow: 0 0 0 3px ${theme.primaryColor}20;
        `,
      },
      variants: [],
    },
    {
      name: "Badge",
      styles: {
        base: `
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 500;
        `,
        default: `
          background-color: ${theme.secondaryColor}20;
          color: ${theme.secondaryColor};
        `,
        success: `
          background-color: #22C55E20;
          color: #22C55E;
        `,
        warning: `
          background-color: #F59E0B20;
          color: #F59E0B;
        `,
        error: `
          background-color: #EF444420;
          color: #EF4444;
        `,
      },
      variants: ["default", "success", "warning", "error"],
    },
  ];
}

// 生成 CSS 变量
function generateCSSVariables(theme: VariantTheme): Record<string, string> {
  return {
    "--color-primary": theme.primaryColor,
    "--color-secondary": theme.secondaryColor,
    "--color-accent": theme.accentColor,
    "--color-background": theme.backgroundColor,
    "--color-surface": theme.surfaceColor,
    "--color-text": theme.textColor,
    "--border-radius": theme.borderRadius,
    "--shadow": theme.shadow,
    "--font-family": theme.fontFamily,
  };
}

// 生成 Tailwind 扩展
function generateTailwindExtend(theme: VariantTheme): Record<string, any> {
  return {
    colors: {
      primary: {
        DEFAULT: theme.primaryColor,
        light: adjustColor(theme.primaryColor, 0.2),
        dark: adjustColor(theme.primaryColor, -0.2),
      },
      secondary: {
        DEFAULT: theme.secondaryColor,
      },
      accent: {
        DEFAULT: theme.accentColor,
      },
    },
    borderRadius: {
      DEFAULT: theme.borderRadius,
    },
    fontFamily: {
      sans: theme.fontFamily.split(",").map(f => f.trim()),
    },
    boxShadow: {
      DEFAULT: theme.shadow,
    },
  };
}

// 颜色调整（简化版）
function adjustColor(hex: string, factor: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xFF) + Math.round(255 * factor)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + Math.round(255 * factor)));
  const b = Math.min(255, Math.max(0, (num & 0xFF) + Math.round(255 * factor)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// 主生成函数
function generateVariant(baseDesign: string, variantId: string): DesignVariant {
  const preset = VARIANT_PRESETS[variantId] || VARIANT_PRESETS.A;

  const theme: VariantTheme = {
    primaryColor: preset.primaryColor || "#3B82F6",
    secondaryColor: preset.secondaryColor || "#64748B",
    accentColor: preset.accentColor || "#8B5CF6",
    backgroundColor: preset.backgroundColor || "#FFFFFF",
    surfaceColor: preset.surfaceColor || "#F8FAFC",
    textColor: preset.textColor || "#0F172A",
    borderRadius: preset.borderRadius || "8px",
    shadow: preset.shadow || "0 1px 3px rgba(0,0,0,0.1)",
    fontFamily: preset.fontFamily || "Inter, system-ui, sans-serif",
  };

  return {
    id: variantId,
    name: `Variant ${variantId}`,
    baseDesign,
    theme,
    components: generateComponentStyles(theme),
    cssVariables: generateCSSVariables(theme),
    tailwindExtend: generateTailwindExtend(theme),
  };
}

// 格式化输出
function formatVariant(variant: DesignVariant): string {
  const lines: string[] = [];

  lines.push(`# 设计变体 ${variant.id}: ${variant.name}`);
  lines.push(``);
  lines.push(`**基础设计**: ${variant.baseDesign}`);
  lines.push(``);

  lines.push(`## 主题配置`);
  lines.push(``);
  lines.push(`| 属性 | 值 |`);
  lines.push(`|------|-----|`);
  for (const [key, value] of Object.entries(variant.theme)) {
    lines.push(`| ${key} | ${value} |`);
  }
  lines.push(``);

  lines.push(`## CSS 变量`);
  lines.push(``);
  lines.push("```css");
  lines.push(":root {");
  for (const [key, value] of Object.entries(variant.cssVariables)) {
    lines.push(`  ${key}: ${value};`);
  }
  lines.push("}");
  lines.push("```");
  lines.push(``);

  lines.push(`## Tailwind 扩展`);
  lines.push(``);
  lines.push("```javascript");
  lines.push("// tailwind.config.js");
  lines.push("module.exports = {");
  lines.push("  theme: {");
  lines.push("    extend: " + JSON.stringify(variant.tailwindExtend, null, 6).replace(/"/g, "'"));
  lines.push("  }");
  lines.push("}");
  lines.push("```");
  lines.push(``);

  lines.push(`## 组件样式`);
  lines.push(``);

  for (const component of variant.components) {
    lines.push(`### ${component.name}`);
    lines.push(``);
    lines.push("```css");
    for (const [styleName, styleValue] of Object.entries(component.styles)) {
      lines.push(`.${component.name.toLowerCase()}--${styleName} {${styleValue}}`);
    }
    lines.push("```");
    lines.push(``);
    if (component.variants.length > 0) {
      lines.push(`**可用变体**: ${component.variants.join(", ")}`);
      lines.push(``);
    }
  }

  return lines.join("\n");
}

// CLI 入口
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);

  const variantIdx = args.indexOf("--variant");
  const variantId = variantIdx !== -1 ? args[variantIdx + 1] : "A";

  const outputIdx = args.indexOf("--output");
  const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : null;

  const baseDesign = args.filter((a: string) =>
    !a.startsWith("--") &&
    a !== variantId &&
    a !== outputFile
  )[0];

  if (!baseDesign) {
    console.error("Usage: npx ts-node generate-variant.ts <base-design> --variant <A|B|C> [--output <file>]");
    console.error("Example: npx ts-node generate-variant.ts requirements.md --variant B");
    process.exit(1);
  }

  const variant = generateVariant(baseDesign, variantId);
  const formatted = formatVariant(variant);

  if (outputFile) {
    fs.writeFileSync(outputFile, formatted);
    console.log(`✅ 变体规格已写入 ${outputFile}`);
  } else {
    console.log(formatted);
  }

  if (args.includes("--json")) {
    console.log("\n📦 JSON:");
    console.log(JSON.stringify(variant, null, 2));
  }

  if (args.includes("--all")) {
    console.log("\n📦 生成所有变体...");
    for (const id of ["A", "B", "C"]) {
      const v = generateVariant(baseDesign, id);
      const path = outputFile ? outputFile.replace(/\.md$/, `-${id}.md`) : `variant-${id}.md`;
      fs.writeFileSync(path, formatVariant(v));
      console.log(`  ✅ ${path}`);
    }
  }
}

export { generateVariant };
export type { DesignVariant, VariantTheme };
