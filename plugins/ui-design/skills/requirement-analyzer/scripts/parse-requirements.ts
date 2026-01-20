#!/usr/bin/env npx ts-node --esm
/**
 * Parse Requirements - 解析 UI/UX 需求
 *
 * 用法: npx ts-node parse-requirements.ts <description> [--output <file>]
 *
 * 功能: 从自然语言描述中提取结构化需求
 */

import * as fs from "fs";
import { fileURLToPath } from "url";

interface ParsedRequirements {
  timestamp: string;
  rawDescription: string;
  projectType: string;
  targetUsers: UserProfile;
  coreFeatures: Feature[];
  designPreferences: DesignPreferences;
  technicalConstraints: TechnicalConstraints;
  keywords: Keywords;
  clarificationNeeded: string[];
}

interface UserProfile {
  ageRange: string;
  occupation: string;
  techLevel: "beginner" | "intermediate" | "advanced";
  primaryDevice: "desktop" | "mobile" | "tablet" | "all";
}

interface Feature {
  name: string;
  priority: "P0" | "P1" | "P2";
  description: string;
  userStory: string;
}

interface DesignPreferences {
  style: string[];
  colorPreference: string[];
  typography: string[];
  mood: string[];
}

interface TechnicalConstraints {
  framework: string | null;
  styleSystem: string | null;
  componentLibrary: string | null;
  browserSupport: string[];
  responsive: boolean;
}

interface Keywords {
  style: string[];
  functional: string[];
  emotional: string[];
}

// 项目类型关键词
const PROJECT_TYPE_KEYWORDS: Record<string, string[]> = {
  website: ["网站", "官网", "landing", "主页", "website"],
  webapp: ["app", "应用", "系统", "平台", "dashboard", "后台"],
  mobile: ["移动", "手机", "ios", "android", "mobile"],
  component: ["组件", "按钮", "表单", "卡片", "component"],
};

// 设计风格关键词
const STYLE_KEYWORDS: Record<string, string[]> = {
  minimalist: ["极简", "简洁", "minimal", "clean", "简约"],
  modern: ["现代", "专业", "modern", "professional"],
  playful: ["活泼", "有趣", "友好", "playful", "fun"],
  luxury: ["高端", "奢华", "luxury", "premium"],
  futuristic: ["科技", "未来", "futuristic", "tech"],
  corporate: ["企业", "商务", "corporate", "business"],
};

// 颜色偏好关键词
const COLOR_KEYWORDS: Record<string, string[]> = {
  warm: ["暖色", "红", "橙", "黄", "warm"],
  cool: ["冷色", "蓝", "绿", "紫", "cool"],
  neutral: ["中性", "灰", "黑白", "neutral"],
  vibrant: ["鲜艳", "明亮", "vibrant", "bright"],
  muted: ["柔和", "低饱和", "muted", "soft"],
};

// 技术栈关键词
const TECH_KEYWORDS: Record<string, string[]> = {
  react: ["react", "nextjs", "next.js"],
  vue: ["vue", "nuxt", "nuxt.js"],
  angular: ["angular"],
  tailwind: ["tailwind", "tailwindcss"],
  antd: ["antd", "ant design", "ant-design"],
  mui: ["mui", "material", "material-ui"],
  shadcn: ["shadcn", "shadcn/ui"],
};

// 检测关键词
function detectKeywords(text: string, keywords: Record<string, string[]>): string[] {
  const detected: string[] = [];
  const lower = text.toLowerCase();

  for (const [category, words] of Object.entries(keywords)) {
    if (words.some((word) => lower.includes(word.toLowerCase()))) {
      detected.push(category);
    }
  }

  return detected;
}

// 提取用户画像
function extractUserProfile(text: string): UserProfile {
  const lower = text.toLowerCase();

  let techLevel: UserProfile["techLevel"] = "intermediate";
  if (lower.includes("技术") || lower.includes("开发") || lower.includes("developer")) {
    techLevel = "advanced";
  } else if (lower.includes("小白") || lower.includes("新手") || lower.includes("beginner")) {
    techLevel = "beginner";
  }

  let primaryDevice: UserProfile["primaryDevice"] = "all";
  if (lower.includes("移动") || lower.includes("手机") || lower.includes("mobile")) {
    primaryDevice = "mobile";
  } else if (lower.includes("桌面") || lower.includes("pc") || lower.includes("desktop")) {
    primaryDevice = "desktop";
  }

  return {
    ageRange: "18-45",
    occupation: "通用用户",
    techLevel,
    primaryDevice,
  };
}

// 提取功能需求
function extractFeatures(text: string): Feature[] {
  const features: Feature[] = [];
  const featurePatterns = [
    /需要(?:一个)?(.+?)(?:功能|页面|组件)/g,
    /实现(.+?)(?:的|功能)/g,
    /添加(.+?)(?:按钮|表单|列表)/g,
  ];

  for (const pattern of featurePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      features.push({
        name: match[1].trim(),
        priority: "P1",
        description: match[0],
        userStory: `作为用户，我希望${match[1].trim()}`,
      });
    }
  }

  // 如果没有提取到，创建默认功能
  if (features.length === 0) {
    features.push({
      name: "核心功能",
      priority: "P0",
      description: "待明确",
      userStory: "作为用户，我希望完成核心任务",
    });
  }

  return features;
}

// 识别需要澄清的问题
function identifyClarificationNeeded(
  requirements: Partial<ParsedRequirements>
): string[] {
  const questions: string[] = [];

  if (!requirements.projectType) {
    questions.push("这是什么类型的产品？（网站/Web App/移动 App/Dashboard）");
  }

  if (!requirements.designPreferences?.style?.length) {
    questions.push("偏好什么设计风格？（极简/现代专业/活泼友好/其他）");
  }

  if (!requirements.technicalConstraints?.framework) {
    questions.push("使用什么前端框架？（React/Vue/Angular/其他）");
  }

  if (!requirements.technicalConstraints?.styleSystem) {
    questions.push("使用什么样式系统？（Tailwind CSS/CSS Modules/Styled Components）");
  }

  return questions;
}

// 主解析函数
function parseRequirements(description: string): ParsedRequirements {
  const projectTypes = detectKeywords(description, PROJECT_TYPE_KEYWORDS);
  const styles = detectKeywords(description, STYLE_KEYWORDS);
  const colors = detectKeywords(description, COLOR_KEYWORDS);
  const techs = detectKeywords(description, TECH_KEYWORDS);

  const userProfile = extractUserProfile(description);
  const features = extractFeatures(description);

  const result: ParsedRequirements = {
    timestamp: new Date().toISOString(),
    rawDescription: description,
    projectType: projectTypes[0] || "webapp",
    targetUsers: userProfile,
    coreFeatures: features,
    designPreferences: {
      style: styles.length > 0 ? styles : ["modern"],
      colorPreference: colors.length > 0 ? colors : [],
      typography: [],
      mood: [],
    },
    technicalConstraints: {
      framework: techs.find((t) => ["react", "vue", "angular"].includes(t)) || null,
      styleSystem: techs.includes("tailwind") ? "tailwind" : null,
      componentLibrary: techs.find((t) => ["antd", "mui", "shadcn"].includes(t)) || null,
      browserSupport: ["chrome", "firefox", "safari", "edge"],
      responsive: true,
    },
    keywords: {
      style: styles,
      functional: features.map((f) => f.name),
      emotional: colors,
    },
    clarificationNeeded: [],
  };

  result.clarificationNeeded = identifyClarificationNeeded(result);

  return result;
}

// 格式化输出
function formatRequirements(req: ParsedRequirements): string {
  const lines: string[] = [];

  lines.push(`# UI/UX 需求分析报告`);
  lines.push("");
  lines.push(`**分析时间**: ${req.timestamp}`);
  lines.push("");

  lines.push(`## 1. 项目概述`);
  lines.push("");
  lines.push(`**项目类型**: ${req.projectType}`);
  lines.push(`**原始描述**: ${req.rawDescription}`);
  lines.push("");

  lines.push(`## 2. 目标用户`);
  lines.push("");
  lines.push(`- 年龄范围: ${req.targetUsers.ageRange}`);
  lines.push(`- 职业: ${req.targetUsers.occupation}`);
  lines.push(`- 技术水平: ${req.targetUsers.techLevel}`);
  lines.push(`- 主要设备: ${req.targetUsers.primaryDevice}`);
  lines.push("");

  lines.push(`## 3. 核心功能`);
  lines.push("");
  for (const feature of req.coreFeatures) {
    lines.push(`### ${feature.name} [${feature.priority}]`);
    lines.push(`- 描述: ${feature.description}`);
    lines.push(`- 用户故事: ${feature.userStory}`);
    lines.push("");
  }

  lines.push(`## 4. 设计偏好`);
  lines.push("");
  lines.push(`- 风格: ${req.designPreferences.style.join(", ") || "待定"}`);
  lines.push(`- 色彩: ${req.designPreferences.colorPreference.join(", ") || "待定"}`);
  lines.push("");

  lines.push(`## 5. 技术约束`);
  lines.push("");
  lines.push(`- 框架: ${req.technicalConstraints.framework || "待定"}`);
  lines.push(`- 样式系统: ${req.technicalConstraints.styleSystem || "待定"}`);
  lines.push(`- 组件库: ${req.technicalConstraints.componentLibrary || "待定"}`);
  lines.push(`- 响应式: ${req.technicalConstraints.responsive ? "是" : "否"}`);
  lines.push("");

  lines.push(`## 6. 设计关键词`);
  lines.push("");
  lines.push(`- 风格关键词: ${req.keywords.style.join(", ")}`);
  lines.push(`- 功能关键词: ${req.keywords.functional.join(", ")}`);
  lines.push(`- 情感关键词: ${req.keywords.emotional.join(", ")}`);
  lines.push("");

  if (req.clarificationNeeded.length > 0) {
    lines.push(`## 7. 待澄清问题`);
    lines.push("");
    for (const q of req.clarificationNeeded) {
      lines.push(`- ${q}`);
    }
  }

  return lines.join("\n");
}

// CLI 入口
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const outputIdx = args.indexOf("--output");
  const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : null;
  const description = args.filter((a) => !a.startsWith("--") && a !== outputFile).join(" ");

  if (!description) {
    console.error("Usage: npx ts-node parse-requirements.ts <description> [--output <file>]");
    console.error('Example: npx ts-node parse-requirements.ts "设计一个现代风格的 React 登录页面"');
    process.exit(1);
  }

  const result = parseRequirements(description);
  const formatted = formatRequirements(result);

  if (outputFile) {
    fs.writeFileSync(outputFile, formatted);
    console.log(`✅ 需求分析已写入 ${outputFile}`);
  } else {
    console.log(formatted);
  }

  if (args.includes("--json")) {
    console.log("\n📦 JSON:");
    console.log(JSON.stringify(result, null, 2));
  }
}

export { parseRequirements };
export type { ParsedRequirements };
