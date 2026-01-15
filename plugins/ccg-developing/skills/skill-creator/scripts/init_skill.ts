#!/usr/bin/env npx tsx
/**
 * 技能初始化脚本
 *
 * 创建符合 Anthropic Agent Skills 规范的技能目录结构。
 *
 * 用法:
 *     npx tsx init_skill.ts <skill-name> [--path <output-dir>]
 *
 * 示例:
 *     npx tsx init_skill.ts my-new-skill
 *     npx tsx init_skill.ts pdf-processor --path ~/.claude/skills
 */

import { existsSync, mkdirSync, writeFileSync, chmodSync } from "fs";
import { join, resolve } from "path";
import { homedir } from "os";

// SKILL.md 模板
const SKILL_TEMPLATE = `---
name: {skill_name}
description: |
  【触发条件】当用户要求 X/Y/Z（含关键词 keyword1/keyword2）时使用。
  【核心产出】输出：A + B + C（具体交付物描述）。
  【不触发】不用于：场景 X（改用 other-skill）。
  【先问什么】若缺少：输入类型、上下文信息，先提问补齐。
---

# {skill_title}

[一句话说明用途]

## 决策入口

先回答关键问题，再进入具体流程：

- 条件 A？→ 流程 A
- 条件 B？→ 流程 B

## 工作流程

1. **步骤 1**：[描述] → 输入/输出
2. **步骤 2**：[描述] → 输入/输出
3. **步骤 3**：[描述] → 输入/输出

## 脚本使用

**先运行 \`--help\`，不要先读源码**：

\`\`\`bash
npx tsx scripts/example.ts --help
\`\`\`

## 参考文档导航

- 需要 XXX → 读 \`references/xxx.md\`
`;

// 示例脚本模板 (TypeScript)
const EXAMPLE_SCRIPT_TEMPLATE = `#!/usr/bin/env npx tsx
/**
 * 示例脚本
 *
 * 用法:
 *     npx tsx example.ts --help
 *     npx tsx example.ts <input> [options]
 */

interface Options {
  input: string;
  output?: string;
  verbose: boolean;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Partial<Options> = { verbose: false };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "-o":
      case "--output":
        options.output = args[++i];
        break;
      case "-v":
      case "--verbose":
        options.verbose = true;
        break;
      case "-h":
      case "--help":
        console.log(\`
示例脚本描述

用法:
  npx tsx example.ts <input> [options]

参数:
  input               输入文件路径

选项:
  -o, --output <路径>  输出文件路径
  -v, --verbose       详细输出
  -h, --help          显示帮助信息

示例:
  npx tsx example.ts input.txt
  npx tsx example.ts input.txt --output result.txt
\`);
        process.exit(0);
      default:
        if (!arg.startsWith("-")) {
          options.input = arg;
        }
    }
  }

  if (!options.input) {
    console.error("错误: 缺少输入文件参数");
    console.error("使用 --help 查看帮助信息");
    process.exit(1);
  }

  return options as Options;
}

function main() {
  const options = parseArgs();

  // TODO: 实现具体逻辑
  console.log(\`输入: \${options.input}\`);
  if (options.output) {
    console.log(\`输出: \${options.output}\`);
  }
}

main();
`;

// 参考文档模板
const REFERENCE_TEMPLATE = `# {title}

## 概述

[简要说明本文档用途]

## 详细内容

[具体内容]

## 示例

[使用示例]
`;

/**
 * 验证技能名称是否符合规范（hyphen-case）
 */
function validateSkillName(name: string): boolean {
  if (!name) return false;
  // 必须是小写字母、数字和连字符
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name);
}

/**
 * 将 hyphen-case 转换为 Title Case
 */
function toTitle(skillName: string): string {
  return skillName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * 展开路径中的 ~ 为用户目录
 */
function expandPath(path: string): string {
  if (path.startsWith("~")) {
    return join(homedir(), path.slice(1));
  }
  return path;
}

/**
 * 创建技能目录结构
 */
function createSkill(skillName: string, outputPath: string): void {
  const skillDir = join(outputPath, skillName);

  // 检查目录是否已存在
  if (existsSync(skillDir)) {
    console.error(`错误: 目录已存在: ${skillDir}`);
    process.exit(1);
  }

  // 创建目录结构
  const directories = [
    skillDir,
    join(skillDir, "scripts"),
    join(skillDir, "references"),
    join(skillDir, "assets"),
  ];

  for (const dirPath of directories) {
    mkdirSync(dirPath, { recursive: true });
    console.log(`创建目录: ${dirPath}`);
  }

  // 创建 SKILL.md
  const skillMdPath = join(skillDir, "SKILL.md");
  const skillMdContent = SKILL_TEMPLATE.replace(
    /{skill_name}/g,
    skillName,
  ).replace(/{skill_title}/g, toTitle(skillName));
  writeFileSync(skillMdPath, skillMdContent, "utf-8");
  console.log(`创建文件: ${skillMdPath}`);

  // 创建示例脚本
  const exampleScriptPath = join(skillDir, "scripts", "example.ts");
  writeFileSync(exampleScriptPath, EXAMPLE_SCRIPT_TEMPLATE, "utf-8");
  chmodSync(exampleScriptPath, 0o755);
  console.log(`创建文件: ${exampleScriptPath}`);

  // 创建示例参考文档
  const referencePath = join(skillDir, "references", "example.md");
  const referenceContent = REFERENCE_TEMPLATE.replace(
    /{title}/g,
    "参考文档标题",
  );
  writeFileSync(referencePath, referenceContent, "utf-8");
  console.log(`创建文件: ${referencePath}`);

  // 创建 .gitkeep 文件（保持 assets 目录可提交）
  const gitkeepPath = join(skillDir, "assets", ".gitkeep");
  writeFileSync(gitkeepPath, "", "utf-8");
  console.log(`创建文件: ${gitkeepPath}`);

  console.log();
  console.log(`✅ 技能 '${skillName}' 创建成功!`);
  console.log();
  console.log("后续步骤:");
  console.log(`  1. 编辑 ${skillMdPath} 完善 description 和工作流程`);
  console.log(`  2. 根据需要添加脚本到 scripts/ 目录`);
  console.log(`  3. 根据需要添加参考文档到 references/ 目录`);
  console.log(`  4. 删除不需要的示例文件`);
  console.log(`  5. 运行 validate_skill.ts 验证技能结构`);
}

function main() {
  const args = process.argv.slice(2);

  let skillName = "";
  let outputPath = process.cwd();

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "-p":
      case "--path":
        outputPath = expandPath(args[++i]);
        break;
      case "-h":
      case "--help":
        console.log(`
创建符合 Anthropic Agent Skills 规范的技能目录结构

用法:
  npx tsx init_skill.ts <skill-name> [--path <output-dir>]

参数:
  skill-name          技能名称（hyphen-case，如 my-new-skill）

选项:
  -p, --path <目录>   输出目录路径（默认为当前目录）
  -h, --help          显示帮助信息

技能名称规范:
  - 必须使用 hyphen-case（小写字母和连字符）
  - 示例: code-reviewer, pdf-processor, api-designer

示例:
  npx tsx init_skill.ts my-new-skill
  npx tsx init_skill.ts pdf-processor --path ~/.claude/skills
`);
        process.exit(0);
      default:
        if (!arg.startsWith("-")) {
          skillName = arg;
        }
    }
  }

  // 验证技能名称
  if (!skillName) {
    console.error("错误: 缺少技能名称参数");
    console.error("使用 --help 查看帮助信息");
    process.exit(1);
  }

  if (!validateSkillName(skillName)) {
    console.error(`错误: 技能名称 '${skillName}' 不符合规范`);
    console.error("技能名称必须使用 hyphen-case（小写字母、数字和连字符）");
    console.error("示例: code-reviewer, pdf-processor, api-designer");
    process.exit(1);
  }

  // 验证输出路径
  const resolvedPath = resolve(outputPath);
  if (!existsSync(resolvedPath)) {
    console.error(`错误: 输出路径不存在: ${resolvedPath}`);
    process.exit(1);
  }

  // 创建技能
  createSkill(skillName, resolvedPath);
}

main();
