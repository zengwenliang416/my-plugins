#!/usr/bin/env npx ts-node --esm
/**
 * Analyze Image - 分析设计图片
 *
 * 用法: npx ts-node analyze-image.ts <image-path> [--dimension <colors|layout|typography|all>]
 *
 * 功能: 提取设计图片中的视觉元素信息
 * 注意: 此脚本生成分析提示词，实际图片分析需要调用 Gemini
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

interface ImageAnalysisRequest {
  imagePath: string;
  dimension: AnalysisDimension;
  prompts: AnalysisPrompt[];
  metadata: ImageMetadata;
}

interface ImageMetadata {
  filename: string;
  extension: string;
  size?: number;
  exists: boolean;
}

type AnalysisDimension = "colors" | "layout" | "typography" | "components" | "spacing" | "all";

interface AnalysisPrompt {
  dimension: AnalysisDimension;
  prompt: string;
  expectedOutput: string[];
}

// 分析维度的提示词模板
const ANALYSIS_PROMPTS: Record<AnalysisDimension, Omit<AnalysisPrompt, "dimension">> = {
  colors: {
    prompt: `分析这张设计图片的配色方案：

1. **主色调识别**
   - 列出主要颜色的 HEX 值
   - 估算每种颜色的使用比例
   - 识别主色、辅色、强调色

2. **配色模式**
   - 判断配色类型（单色/互补/类似/三色等）
   - 分析明暗对比度
   - 评估色彩和谐度

3. **色彩应用**
   - 背景色
   - 文字色
   - 按钮/交互元素色
   - 边框/分隔线色

请以 JSON 格式输出结果。`,
    expectedOutput: [
      "primaryColor: HEX",
      "secondaryColors: HEX[]",
      "accentColor: HEX",
      "backgroundColor: HEX",
      "textColors: { primary, secondary, muted }",
      "colorSchemeType: string",
      "contrastRatio: number",
    ],
  },

  layout: {
    prompt: `分析这张设计图片的布局结构：

1. **整体布局**
   - 页面结构（单栏/双栏/网格等）
   - 内容区域划分
   - 视觉层次

2. **网格系统**
   - 列数和间距
   - 边距设置
   - 对齐方式

3. **响应式考量**
   - 关键断点建议
   - 可折叠区域
   - 优先级排序

请以 JSON 格式输出布局规格。`,
    expectedOutput: [
      "layoutType: 'single-column' | 'multi-column' | 'grid'",
      "columns: number",
      "gutter: string",
      "margin: string",
      "sections: { name, type, position }[]",
      "visualHierarchy: string[]",
      "breakpoints: { mobile, tablet, desktop }",
    ],
  },

  typography: {
    prompt: `分析这张设计图片的字体排版：

1. **字体识别**
   - 主标题字体（估计）
   - 正文字体
   - 特殊用途字体

2. **字体层级**
   - 各级标题大小（估计 px）
   - 正文大小
   - 辅助文字大小

3. **排版细节**
   - 行高比例
   - 字间距
   - 段落间距
   - 文字对齐方式

请以 JSON 格式输出排版规格。`,
    expectedOutput: [
      "fontFamilies: { heading, body, mono }",
      "fontSizes: { h1, h2, h3, body, small, caption }",
      "fontWeights: { normal, medium, bold }",
      "lineHeights: { tight, normal, relaxed }",
      "letterSpacing: string",
      "textAlign: string",
    ],
  },

  components: {
    prompt: `分析这张设计图片中的 UI 组件：

1. **组件识别**
   - 列出所有可见的 UI 组件
   - 按类型分组（导航/表单/卡片/按钮等）

2. **组件样式**
   - 每个组件的视觉特征
   - 圆角大小
   - 阴影效果
   - 边框样式

3. **状态变体**
   - 可见的组件状态（hover/active/disabled）
   - 交互反馈提示

请以 JSON 格式输出组件清单。`,
    expectedOutput: [
      "components: { type, count, styles }[]",
      "buttons: { variant, size, radius, shadow }",
      "cards: { padding, radius, shadow, border }",
      "inputs: { height, radius, borderStyle }",
      "navigation: { type, items, style }",
    ],
  },

  spacing: {
    prompt: `分析这张设计图片的间距系统：

1. **间距测量**
   - 元素之间的间距（估计 px）
   - 内边距模式
   - 外边距模式

2. **间距规律**
   - 是否遵循 4px/8px 基准
   - 间距层级关系
   - 一致性评估

3. **留白处理**
   - 主要留白区域
   - 视觉呼吸感
   - 内容密度

请以 JSON 格式输出间距规格。`,
    expectedOutput: [
      "baseUnit: number",
      "spacingScale: number[]",
      "contentPadding: string",
      "sectionGap: string",
      "elementGap: string",
      "whitespaceRatio: string",
    ],
  },

  all: {
    prompt: `全面分析这张设计图片的所有视觉元素：

1. 配色方案（主色/辅色/背景色的 HEX 值）
2. 布局结构（列数/间距/对齐）
3. 字体排版（字体/大小/行高）
4. UI 组件（类型/样式/变体）
5. 间距系统（基准单位/规律）

请以结构化 JSON 格式输出完整的设计规格。`,
    expectedOutput: [
      "colors: ColorScheme",
      "layout: LayoutSpec",
      "typography: TypographySpec",
      "components: ComponentSpec[]",
      "spacing: SpacingSpec",
    ],
  },
};

// 获取图片元数据
function getImageMetadata(imagePath: string): ImageMetadata {
  const exists = fs.existsSync(imagePath);
  const filename = path.basename(imagePath);
  const extension = path.extname(imagePath).toLowerCase();

  let size: number | undefined;
  if (exists) {
    const stat = fs.statSync(imagePath);
    size = stat.size;
  }

  return {
    filename,
    extension,
    size,
    exists,
  };
}

// 生成分析请求
function createAnalysisRequest(
  imagePath: string,
  dimension: AnalysisDimension = "all"
): ImageAnalysisRequest {
  const metadata = getImageMetadata(imagePath);
  const prompts: AnalysisPrompt[] = [];

  if (dimension === "all") {
    // 添加所有维度的提示词
    for (const [dim, template] of Object.entries(ANALYSIS_PROMPTS)) {
      if (dim !== "all") {
        prompts.push({
          dimension: dim as AnalysisDimension,
          ...template,
        });
      }
    }
  } else {
    // 只添加指定维度
    const template = ANALYSIS_PROMPTS[dimension];
    prompts.push({
      dimension,
      ...template,
    });
  }

  return {
    imagePath,
    dimension,
    prompts,
    metadata,
  };
}

// 生成 Gemini 调用命令
function generateGeminiCommand(request: ImageAnalysisRequest): string {
  const primaryPrompt = request.dimension === "all"
    ? ANALYSIS_PROMPTS.all.prompt
    : request.prompts[0]?.prompt || "";

  return `gemini -p "${primaryPrompt.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" -f "${request.imagePath}"`;
}

// 格式化输出
function formatRequest(request: ImageAnalysisRequest): string {
  const lines: string[] = [];

  lines.push(`# 设计图片分析请求`);
  lines.push(``);
  lines.push(`**图片路径**: ${request.imagePath}`);
  lines.push(`**分析维度**: ${request.dimension}`);
  lines.push(``);

  lines.push(`## 图片元数据`);
  lines.push(``);
  lines.push(`- 文件名: ${request.metadata.filename}`);
  lines.push(`- 格式: ${request.metadata.extension}`);
  lines.push(`- 大小: ${request.metadata.size ? `${Math.round(request.metadata.size / 1024)}KB` : "未知"}`);
  lines.push(`- 存在: ${request.metadata.exists ? "是" : "否"}`);
  lines.push(``);

  if (!request.metadata.exists) {
    lines.push(`⚠️ **警告**: 图片文件不存在，请检查路径`);
    lines.push(``);
  }

  lines.push(`## 分析提示词`);
  lines.push(``);

  for (const prompt of request.prompts) {
    lines.push(`### ${prompt.dimension.toUpperCase()}`);
    lines.push(``);
    lines.push("```");
    lines.push(prompt.prompt);
    lines.push("```");
    lines.push(``);
    lines.push(`**期望输出字段**:`);
    for (const field of prompt.expectedOutput) {
      lines.push(`- ${field}`);
    }
    lines.push(``);
  }

  lines.push(`## Gemini 调用命令`);
  lines.push(``);
  lines.push("```bash");
  lines.push(generateGeminiCommand(request));
  lines.push("```");
  lines.push(``);

  lines.push(`## 使用说明`);
  lines.push(``);
  lines.push(`1. 确保图片路径正确`);
  lines.push(`2. 使用 gemini-cli skill 执行分析`);
  lines.push(`3. 将输出保存到 \${run_dir}/image-analysis.md`);

  return lines.join("\n");
}

// CLI 入口
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);

  const dimensionIdx = args.indexOf("--dimension");
  const dimension = (dimensionIdx !== -1 ? args[dimensionIdx + 1] : "all") as AnalysisDimension;

  const outputIdx = args.indexOf("--output");
  const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : null;

  const imagePath = args.filter((a: string) =>
    !a.startsWith("--") &&
    a !== dimension &&
    a !== outputFile
  )[0];

  if (!imagePath) {
    console.error("Usage: npx ts-node analyze-image.ts <image-path> [--dimension <colors|layout|typography|components|spacing|all>]");
    console.error("Example: npx ts-node analyze-image.ts design.png --dimension colors");
    process.exit(1);
  }

  const request = createAnalysisRequest(imagePath, dimension);
  const formatted = formatRequest(request);

  if (outputFile) {
    fs.writeFileSync(outputFile, formatted);
    console.log(`✅ 分析请求已写入 ${outputFile}`);
  } else {
    console.log(formatted);
  }

  if (args.includes("--json")) {
    console.log("\n📦 JSON:");
    console.log(JSON.stringify(request, null, 2));
  }

  if (!request.metadata.exists) {
    process.exit(1);
  }
}

export { createAnalysisRequest };
export type { ImageAnalysisRequest, AnalysisDimension };
