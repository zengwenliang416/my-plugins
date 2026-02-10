#!/usr/bin/env -S npx tsx
/**
 * Tech Rules Generator Script
 * Generates technology stack specific coding rules
 */

import { readFile, writeFile, mkdir, stat, glob } from "node:fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

interface StackConfig {
  name: string;
  inherits: string[];
  search_queries: string[];
  official_docs: string;
}

interface RulesConfig {
  output_dir: string;
  index_file: string;
  stacks: Record<string, StackConfig>;
  rule_sections: string[];
  project_analysis: {
    enabled: boolean;
    patterns: Record<string, string[]>;
  };
}

interface RuleIndex {
  rules: Array<{
    stack: string;
    path: string;
    generated: string;
    version: string;
    sources: string[];
  }>;
  last_updated: string;
}

interface ProjectAnalysis {
  naming_patterns: {
    files: string;
    variables: string;
    functions: string;
    classes: string;
  };
  directory_structure: string[];
  code_style: {
    indent: string;
    quotes: string;
    semicolons: boolean;
  };
  detected_patterns: string[];
}

const DEFAULT_CONFIG: RulesConfig = {
  output_dir: ".claude/rules",
  index_file: "index.json",
  stacks: {
    typescript: {
      name: "TypeScript",
      inherits: [],
      search_queries: [
        "TypeScript best practices 2024",
        "TypeScript coding standards",
      ],
      official_docs: "https://www.typescriptlang.org/docs/",
    },
  },
  rule_sections: [
    "type_system",
    "naming_conventions",
    "file_organization",
    "error_handling",
    "async_patterns",
    "testing",
    "security",
  ],
  project_analysis: {
    enabled: true,
    patterns: {
      naming: ["*.ts", "*.tsx", "*.js", "*.jsx"],
      config: ["tsconfig.json", "package.json", ".eslintrc*"],
    },
  },
};

async function loadConfig(): Promise<RulesConfig> {
  const configPath = join(SCRIPT_DIR, "../assets/rules-config.json");
  try {
    const content = await readFile(configPath, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function parseStackInput(input: string): string[] {
  // Handle combined stacks like "react+typescript"
  return input.toLowerCase().split("+").filter(Boolean);
}

function resolveInheritedStacks(
  stacks: string[],
  config: RulesConfig,
): string[] {
  const resolved = new Set<string>();

  function addWithInherited(stack: string) {
    if (resolved.has(stack)) return;
    resolved.add(stack);

    const stackConfig = config.stacks[stack];
    if (stackConfig?.inherits) {
      for (const inherited of stackConfig.inherits) {
        addWithInherited(inherited);
      }
    }
  }

  for (const stack of stacks) {
    addWithInherited(stack);
  }

  return Array.from(resolved);
}

async function analyzeProjectNaming(projectPath: string): Promise<string> {
  const patterns: string[] = [];

  // Check for common patterns
  let fileCount = 0;
  let kebabCount = 0;
  let camelCount = 0;
  let pascalCount = 0;

  for await (const file of glob("**/*.ts", {
    cwd: projectPath,
    exclude: ["**/node_modules/**", "**/.git/**"],
  })) {
    fileCount++;
    const name = String(file).split("/").pop() || "";
    if (name.includes("-")) kebabCount++;
    else if (name[0] === name[0].toLowerCase()) camelCount++;
    else pascalCount++;

    if (fileCount > 50) break; // Sample limit
  }

  if (fileCount > 0) {
    if (kebabCount > fileCount * 0.5) patterns.push("kebab-case files");
    else if (camelCount > fileCount * 0.5) patterns.push("camelCase files");
    else if (pascalCount > fileCount * 0.5) patterns.push("PascalCase files");
  }

  return patterns.join(", ") || "mixed";
}

async function analyzeProjectStyle(projectPath: string): Promise<{
  indent: string;
  quotes: string;
  semicolons: boolean;
}> {
  const style = {
    indent: "2 spaces",
    quotes: "single",
    semicolons: true,
  };

  // Check for config files
  const prettierPath = join(projectPath, ".prettierrc");
  const prettierJsonPath = join(projectPath, ".prettierrc.json");

  for (const configPath of [prettierPath, prettierJsonPath]) {
    if (await fileExists(configPath)) {
      try {
        const content = await readFile(configPath, "utf-8");
        const config = JSON.parse(content);
        if (config.tabWidth) style.indent = `${config.tabWidth} spaces`;
        if (config.useTabs) style.indent = "tabs";
        if (config.singleQuote !== undefined)
          style.quotes = config.singleQuote ? "single" : "double";
        if (config.semi !== undefined) style.semicolons = config.semi;
      } catch {
        // Ignore parse errors
      }
    }
  }

  return style;
}

async function analyzeProject(projectPath: string): Promise<ProjectAnalysis> {
  const namingPattern = await analyzeProjectNaming(projectPath);
  const codeStyle = await analyzeProjectStyle(projectPath);

  // Get directory structure
  const directories: string[] = [];
  let dirCount = 0;
  for await (const dir of glob("**/", {
    cwd: projectPath,
    exclude: ["**/node_modules/**", "**/.git/**"],
  })) {
    const normalized = String(dir).replace(/\/$/, "");
    if (
      normalized &&
      normalized !== "." &&
      !normalized.startsWith(".")
    ) {
      directories.push(normalized);
      dirCount++;
      if (dirCount > 20) break;
    }
  }

  return {
    naming_patterns: {
      files: namingPattern,
      variables: "camelCase (assumed)",
      functions: "camelCase (assumed)",
      classes: "PascalCase (assumed)",
    },
    directory_structure: directories.slice(0, 10),
    code_style: codeStyle,
    detected_patterns: [],
  };
}

function generateRuleContent(
  stacks: string[],
  config: RulesConfig,
  projectAnalysis?: ProjectAnalysis,
): string {
  const primaryStack = stacks[0];
  const stackConfig = config.stacks[primaryStack];
  const timestamp = new Date().toISOString();

  let content = `---
name: ${primaryStack}-rules
version: 1.0.0
generated: ${timestamp}
stack: ${stacks.join("+")}
sources:
  - official: ${stackConfig?.official_docs || "N/A"}
---

# ${stackConfig?.name || primaryStack} 编码规则

## 概述

本规则文件定义了 ${stackConfig?.name || primaryStack} 项目的编码规范和最佳实践。

## 类型系统

### 严格模式

启用严格类型检查:

\`\`\`json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
\`\`\`

### 类型声明规范

**推荐:**

\`\`\`typescript
// 使用 interface 定义对象结构
interface User {
  id: string;
  name: string;
  email: string;
}

// 使用 type 定义联合类型
type Status = "pending" | "active" | "inactive";

// 泛型类型
interface ApiResponse<T> {
  data: T;
  error?: string;
}
\`\`\`

**避免:**

\`\`\`typescript
// ❌ 避免 any
const data: any = fetchData();

// ❌ 避免隐式 any
function process(item) {
  return item.value;
}
\`\`\`

## 命名约定

| 类型 | 约定 | 示例 |
|------|------|------|
| 类/接口 | PascalCase | \`UserService\`, \`IRepository\` |
| 函数/方法 | camelCase | \`getUserById\`, \`validateInput\` |
| 变量 | camelCase | \`userName\`, \`isActive\` |
| 常量 | UPPER_SNAKE | \`MAX_RETRY\`, \`API_URL\` |
| 枚举 | PascalCase | \`UserRole\`, \`HttpStatus\` |
| 文件 | kebab-case | \`user-service.ts\` |
| 目录 | kebab-case | \`auth-module/\` |

## 文件组织

\`\`\`
src/
├── modules/          # 业务模块
│   ├── user/
│   │   ├── user.service.ts
│   │   ├── user.controller.ts
│   │   └── user.types.ts
│   └── auth/
├── shared/           # 共享代码
│   ├── utils/
│   ├── types/
│   └── constants/
├── config/           # 配置
└── index.ts          # 入口
\`\`\`

## 错误处理

\`\`\`typescript
// 自定义错误类
class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Result 模式
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };
\`\`\`

## 异步处理

\`\`\`typescript
// ✅ 使用 async/await
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(\`/api/users/\${id}\`);
  if (!response.ok) {
    throw new AppError('FETCH_FAILED', 'Failed to fetch user');
  }
  return response.json();
}

// ✅ 并行请求
const [users, roles] = await Promise.all([
  fetchUsers(),
  fetchRoles()
]);
\`\`\`

## 测试规范

\`\`\`typescript
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when exists', async () => {
      // Arrange
      const userId = 'test-id';

      // Act
      const result = await userService.getUserById(userId);

      // Assert
      expect(result).toBeDefined();
    });
  });
});
\`\`\`

## 安全规范

1. 使用参数化查询防止 SQL 注入
2. 验证所有用户输入
3. 不在日志中输出敏感信息
4. 使用环境变量存储密钥
`;

  // Add project-specific section if available
  if (projectAnalysis) {
    content += `
## 项目特定规范

### 检测到的约定

#### 文件命名
${projectAnalysis.naming_patterns.files}

#### 代码风格
- 缩进: ${projectAnalysis.code_style.indent}
- 引号: ${projectAnalysis.code_style.quotes}
- 分号: ${projectAnalysis.code_style.semicolons ? "使用" : "不使用"}

#### 目录结构
\`\`\`
${projectAnalysis.directory_structure.join("\n")}
\`\`\`
`;
  }

  return content;
}

async function loadRuleIndex(outputDir: string): Promise<RuleIndex> {
  const indexPath = join(outputDir, "index.json");
  try {
    const content = await readFile(indexPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return { rules: [], last_updated: new Date().toISOString() };
  }
}

async function saveRuleIndex(
  outputDir: string,
  index: RuleIndex,
): Promise<void> {
  const indexPath = join(outputDir, "index.json");
  await writeFile(indexPath, JSON.stringify(index, null, 2), "utf-8");
}

async function generateRules(
  stackInput: string,
  includeProject: boolean,
  regenerate: boolean,
): Promise<void> {
  const config = await loadConfig();
  const stacks = parseStackInput(stackInput);
  const resolvedStacks = resolveInheritedStacks(stacks, config);
  const primaryStack = stacks[0];
  const outputPath = join(config.output_dir, `${primaryStack}.md`);

  // Check if rules exist and skip if not regenerating
  if (!regenerate && (await fileExists(outputPath))) {
    console.log(
      `Rules for ${primaryStack} already exist. Use --regenerate to overwrite.`,
    );
    return;
  }

  // Create output directory
  await mkdir(dirname(outputPath), { recursive: true });

  // Analyze project if enabled
  let projectAnalysis: ProjectAnalysis | undefined;
  if (includeProject && config.project_analysis.enabled) {
    console.log("Analyzing project conventions...");
    projectAnalysis = await analyzeProject(process.cwd());
  }

  // Generate rule content
  console.log(`Generating rules for: ${resolvedStacks.join(", ")}`);
  const content = generateRuleContent(resolvedStacks, config, projectAnalysis);

  // Write rules file
  await writeFile(outputPath, content, "utf-8");

  // Update index
  const index = await loadRuleIndex(config.output_dir);
  const existingIdx = index.rules.findIndex((r) => r.stack === primaryStack);
  const ruleEntry = {
    stack: primaryStack,
    path: `${primaryStack}.md`,
    generated: new Date().toISOString(),
    version: "1.0.0",
    sources: ["template"],
  };

  if (existingIdx >= 0) {
    index.rules[existingIdx] = ruleEntry;
  } else {
    index.rules.push(ruleEntry);
  }
  index.last_updated = new Date().toISOString();

  await saveRuleIndex(config.output_dir, index);

  console.log(`\nRules generated successfully:`);
  console.log(`  Output: ${outputPath}`);
  console.log(`  Stacks: ${resolvedStacks.join(", ")}`);
  if (projectAnalysis) {
    console.log(`  Project analysis: included`);
  }
}

// CLI
const stackArg = process.argv[2];
const includeProject = !process.argv.includes("--no-include-project");
const regenerate = process.argv.includes("--regenerate");

if (!stackArg) {
  console.log(
    "Usage: generate-rules.ts <stack> [--no-include-project] [--regenerate]",
  );
  console.log("\nExamples:");
  console.log("  generate-rules.ts typescript");
  console.log('  generate-rules.ts "react+typescript"');
  console.log("  generate-rules.ts nestjs --regenerate");
  process.exit(1);
}

generateRules(stackArg, includeProject, regenerate).catch((err) => {
  console.error("Generation failed:", err);
  process.exit(1);
});
