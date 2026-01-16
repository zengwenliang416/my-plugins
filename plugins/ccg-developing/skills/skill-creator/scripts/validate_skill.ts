#!/usr/bin/env npx tsx
/**
 * 技能验证脚本
 *
 * 验证技能目录结构和内容是否符合 Anthropic Agent Skills 规范。
 *
 * 用法:
 *     npx tsx validate_skill.ts <path/to/skill>
 *     npx tsx validate_skill.ts ~/.claude/skills/my-skill
 *
 * 检查项:
 *     - frontmatter 格式正确
 *     - name 与目录名匹配
 *     - description 包含触发条件
 *     - SKILL.md < 500 行
 *     - 无多余文档（README.md 等）
 */

import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { basename, resolve } from "path";
import { homedir } from "os";

interface ValidationResult {
  passed: boolean;
  message: string;
  level: "error" | "warning" | "info";
}

interface Frontmatter {
  [key: string]: string;
}

class SkillValidator {
  private skillPath: string;
  private skillName: string;
  private results: ValidationResult[] = [];

  constructor(skillPath: string) {
    this.skillPath = resolve(expandPath(skillPath));
    this.skillName = basename(this.skillPath);
  }

  private addResult(
    passed: boolean,
    message: string,
    level: ValidationResult["level"] = "error",
  ): void {
    this.results.push({ passed, message, level });
  }

  private validateDirectoryExists(): boolean {
    if (!existsSync(this.skillPath)) {
      this.addResult(false, `技能目录不存在: ${this.skillPath}`);
      return false;
    }
    if (!statSync(this.skillPath).isDirectory()) {
      this.addResult(false, `路径不是目录: ${this.skillPath}`);
      return false;
    }
    this.addResult(true, "技能目录存在");
    return true;
  }

  private validateSkillMdExists(): boolean {
    const skillMdPath = `${this.skillPath}/SKILL.md`;
    if (!existsSync(skillMdPath)) {
      this.addResult(false, "缺少 SKILL.md 文件");
      return false;
    }
    this.addResult(true, "SKILL.md 文件存在");
    return true;
  }

  private validateSkillMdSize(): boolean {
    const skillMdPath = `${this.skillPath}/SKILL.md`;
    if (!existsSync(skillMdPath)) {
      return false;
    }

    const content = readFileSync(skillMdPath, "utf-8");
    const lineCount = content.split("\n").length;

    if (lineCount >= 500) {
      this.addResult(
        false,
        `SKILL.md 行数过多: ${lineCount} 行（限制 < 500 行）`,
        "error",
      );
      return false;
    }

    if (lineCount > 300) {
      this.addResult(
        true,
        `SKILL.md 行数: ${lineCount} 行（建议精简到 300 行以内）`,
        "warning",
      );
    } else {
      this.addResult(true, `SKILL.md 行数: ${lineCount} 行`);
    }
    return true;
  }

  private parseFrontmatter(): Frontmatter | null {
    const skillMdPath = `${this.skillPath}/SKILL.md`;
    if (!existsSync(skillMdPath)) {
      return null;
    }

    const content = readFileSync(skillMdPath, "utf-8");

    // 检查是否以 --- 开头
    if (!content.startsWith("---")) {
      this.addResult(
        false,
        "SKILL.md 缺少 YAML frontmatter（必须以 --- 开头）",
      );
      return null;
    }

    // 提取 frontmatter
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) {
      this.addResult(false, "SKILL.md frontmatter 格式错误（缺少结束的 ---）");
      return null;
    }

    const frontmatterText = match[1];

    // 简单解析 YAML（不引入依赖）
    const frontmatter: Frontmatter = {};
    let currentKey: string | null = null;
    let currentValue: string[] = [];

    for (const line of frontmatterText.split("\n")) {
      // 检查是否是新的键
      const keyMatch = line.match(/^([a-z][a-z0-9-]*)\s*:\s*(.*)/);
      if (keyMatch) {
        // 保存上一个键的值
        if (currentKey) {
          frontmatter[currentKey] = currentValue.join("\n").trim();
        }

        currentKey = keyMatch[1];
        const value = keyMatch[2].trim();

        // 处理 | 多行字符串
        if (value === "|") {
          currentValue = [];
        } else {
          currentValue = value ? [value] : [];
        }
      } else if (currentKey && line.startsWith("  ")) {
        // 多行值的续行
        currentValue.push(line.slice(2)); // 去掉前两个空格
      }
    }

    // 保存最后一个键
    if (currentKey) {
      frontmatter[currentKey] = currentValue.join("\n").trim();
    }

    this.addResult(true, "frontmatter 格式正确");
    return frontmatter;
  }

  private validateName(frontmatter: Frontmatter): boolean {
    if (!frontmatter.name) {
      this.addResult(false, "frontmatter 缺少 name 字段");
      return false;
    }

    const name = frontmatter.name;

    // 验证 hyphen-case
    if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
      this.addResult(false, `name '${name}' 不符合 hyphen-case 规范`);
      return false;
    }

    // 验证与目录名匹配
    if (name !== this.skillName) {
      this.addResult(
        false,
        `name '${name}' 与目录名 '${this.skillName}' 不匹配`,
      );
      return false;
    }

    this.addResult(true, `name '${name}' 格式正确且与目录名匹配`);
    return true;
  }

  private validateDescription(frontmatter: Frontmatter): boolean {
    if (!frontmatter.description) {
      this.addResult(false, "frontmatter 缺少 description 字段");
      return false;
    }

    const desc = frontmatter.description;

    // 检查是否过短
    if (desc.length < 50) {
      this.addResult(
        false,
        `description 过短（${desc.length} 字符），建议至少 100 字符`,
        "warning",
      );
    }

    // 检查是否包含关键元素（4句式）
    const checks: [string, string[]][] = [
      ["触发条件", ["当", "使用", "时", "要求", "需要"]],
      ["核心产出", ["输出", "生成", "创建", "返回", "产出"]],
    ];

    const missingElements: string[] = [];
    for (const [elementName, keywords] of checks) {
      if (!keywords.some((kw) => desc.includes(kw))) {
        missingElements.push(elementName);
      }
    }

    if (missingElements.length > 0) {
      this.addResult(
        true,
        `description 可能缺少: ${missingElements.join(", ")}（建议使用4句式模板）`,
        "warning",
      );
    } else {
      this.addResult(true, "description 包含触发条件和核心产出");
    }

    return true;
  }

  private validateNoForbiddenFiles(): boolean {
    const forbiddenFiles = [
      "README.md",
      "INSTALLATION_GUIDE.md",
      "CHANGELOG.md",
      "CONTRIBUTING.md",
    ];

    const foundForbidden: string[] = [];
    for (const filename of forbiddenFiles) {
      if (existsSync(`${this.skillPath}/${filename}`)) {
        foundForbidden.push(filename);
      }
    }

    if (foundForbidden.length > 0) {
      this.addResult(
        false,
        `存在禁止的文件: ${foundForbidden.join(", ")}（技能不应创建这些文件）`,
        "error",
      );
      return false;
    }

    this.addResult(true, "没有禁止的文件");
    return true;
  }

  private validateDirectoryStructure(): boolean {
    const recommendedDirs = ["scripts", "references"];
    const optionalDirs = ["assets"];

    const existingDirs: string[] = [];
    try {
      const entries = readdirSync(this.skillPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          existingDirs.push(entry.name);
        }
      }
    } catch {
      // 忽略读取错误
    }

    // 检查是否有未知目录
    const knownDirs = new Set([...recommendedDirs, ...optionalDirs]);
    const unknownDirs = existingDirs.filter(
      (d) => !knownDirs.has(d) && !d.startsWith("."),
    );

    if (unknownDirs.length > 0) {
      this.addResult(
        true,
        `存在非标准目录: ${unknownDirs.join(", ")}`,
        "warning",
      );
    }

    // 报告目录结构
    this.addResult(
      true,
      `目录结构: ${existingDirs.length > 0 ? existingDirs.join(", ") : "(无子目录)"}`,
    );
    return true;
  }

  validate(): boolean {
    // 基础检查
    if (!this.validateDirectoryExists()) {
      return false;
    }

    if (!this.validateSkillMdExists()) {
      return false;
    }

    // SKILL.md 内容检查
    this.validateSkillMdSize();

    const frontmatter = this.parseFrontmatter();
    if (frontmatter) {
      this.validateName(frontmatter);
      this.validateDescription(frontmatter);
    }

    // 结构检查
    this.validateNoForbiddenFiles();
    this.validateDirectoryStructure();

    return this.results.every((r) => r.passed || r.level !== "error");
  }

  printResults(): void {
    console.log(`\n验证技能: ${this.skillPath}\n`);
    console.log("=".repeat(60));

    const errors: ValidationResult[] = [];
    const warnings: ValidationResult[] = [];
    const passes: ValidationResult[] = [];

    for (const result of this.results) {
      if (result.level === "error") {
        if (result.passed) {
          passes.push(result);
        } else {
          errors.push(result);
        }
      } else if (result.level === "warning") {
        warnings.push(result);
      } else {
        passes.push(result);
      }
    }

    // 打印错误
    if (errors.length > 0) {
      console.log("\n❌ 错误:");
      for (const r of errors) {
        console.log(`   - ${r.message}`);
      }
    }

    // 打印警告
    if (warnings.length > 0) {
      console.log("\n⚠️  警告:");
      for (const r of warnings) {
        console.log(`   - ${r.message}`);
      }
    }

    // 打印通过项
    if (passes.length > 0) {
      console.log("\n✅ 通过:");
      for (const r of passes) {
        console.log(`   - ${r.message}`);
      }
    }

    console.log("\n" + "=".repeat(60));

    // 总结
    const errorCount = errors.length;
    const warningCount = warnings.length;
    const passCount = passes.length;

    if (errorCount === 0) {
      console.log(
        `\n🎉 验证通过! (${passCount} 项通过, ${warningCount} 项警告)`,
      );
    } else {
      console.log(
        `\n💔 验证失败! (${errorCount} 项错误, ${warningCount} 项警告, ${passCount} 项通过)`,
      );
    }
  }
}

/**
 * 展开路径中的 ~ 为用户目录
 */
function expandPath(path: string): string {
  if (path.startsWith("~")) {
    return `${homedir()}${path.slice(1)}`;
  }
  return path;
}

function main() {
  const args = process.argv.slice(2);

  let skillPath = "";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "-h":
      case "--help":
        console.log(`
验证技能目录结构和内容是否符合 Anthropic Agent Skills 规范

用法:
  npx tsx validate_skill.ts <skill-path>

参数:
  skill-path          技能目录路径

选项:
  -h, --help          显示帮助信息

检查项:
    - frontmatter 格式正确
    - name 与目录名匹配（hyphen-case）
    - description 包含触发条件
    - SKILL.md < 500 行
    - 无多余文档（README.md 等）

示例:
  npx tsx validate_skill.ts ~/.claude/skills/my-skill
  npx tsx validate_skill.ts ./skills/code-reviewer
`);
        process.exit(0);
      default:
        if (!arg.startsWith("-")) {
          skillPath = arg;
        }
    }
  }

  // 验证参数
  if (!skillPath) {
    console.error("错误: 缺少技能目录路径参数");
    console.error("使用 --help 查看帮助信息");
    process.exit(1);
  }

  // 执行验证
  const validator = new SkillValidator(skillPath);
  const success = validator.validate();
  validator.printResults();

  process.exit(success ? 0 : 1);
}

main();
