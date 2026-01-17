#!/usr/bin/env npx ts-node --esm
/**
 * Generate Component - 生成 UI 组件代码
 *
 * 用法: npx ts-node generate-component.ts <component-name> --tech <react|vue> [--style <tailwind|css>]
 *
 * 功能: 根据设计规格生成组件代码
 */

import * as fs from "fs";
import { fileURLToPath } from "url";

interface ComponentConfig {
  name: string;
  tech: "react" | "vue";
  style: "tailwind" | "css" | "styled";
  variant?: string;
  props?: PropDefinition[];
}

interface PropDefinition {
  name: string;
  type: string;
  required: boolean;
  default?: string;
  description: string;
}

interface GeneratedComponent {
  name: string;
  files: GeneratedFile[];
  techStack: string;
}

interface GeneratedFile {
  path: string;
  content: string;
  type: "component" | "style" | "types" | "test" | "story";
}

// React 组件模板
function generateReactComponent(config: ComponentConfig): GeneratedFile[] {
  const { name, style, props = [] } = config;
  const files: GeneratedFile[] = [];

  // Props 接口
  const propsInterface = props.length > 0
    ? `interface ${name}Props {\n${props.map(p =>
        `  /** ${p.description} */\n  ${p.name}${p.required ? "" : "?"}: ${p.type};`
      ).join("\n")}\n}`
    : `interface ${name}Props {\n  children?: React.ReactNode;\n}`;

  // 默认值
  const defaultProps = props.filter(p => p.default).map(p =>
    `  ${p.name} = ${p.default}`
  ).join(",\n");

  // 组件内容
  let componentContent = "";

  if (style === "tailwind") {
    componentContent = `import React from "react";
import { cn } from "@/lib/utils";

${propsInterface}

export const ${name}: React.FC<${name}Props> = ({
${defaultProps ? defaultProps + ",\n" : ""}  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        "px-4 py-2",
        "bg-white dark:bg-gray-800",
        "border border-gray-200 dark:border-gray-700",
        "rounded-lg shadow-sm",
        "transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default ${name};
`;
  } else if (style === "styled") {
    componentContent = `import React from "react";
import styled from "styled-components";

${propsInterface}

const StyledWrapper = styled.div\`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
\`;

export const ${name}: React.FC<${name}Props> = ({
${defaultProps ? defaultProps + ",\n" : ""}  children,
  ...props
}) => {
  return (
    <StyledWrapper {...props}>
      {children}
    </StyledWrapper>
  );
};

export default ${name};
`;
  } else {
    componentContent = `import React from "react";
import styles from "./${name}.module.css";

${propsInterface}

export const ${name}: React.FC<${name}Props> = ({
${defaultProps ? defaultProps + ",\n" : ""}  children,
  className,
  ...props
}) => {
  return (
    <div
      className={\`\${styles.wrapper} \${className || ""}\`}
      {...props}
    >
      {children}
    </div>
  );
};

export default ${name};
`;

    // CSS Module 文件
    files.push({
      path: `${name}.module.css`,
      type: "style",
      content: `.wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.wrapper:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
`,
    });
  }

  files.unshift({
    path: `${name}.tsx`,
    type: "component",
    content: componentContent,
  });

  // 类型文件
  files.push({
    path: `${name}.types.ts`,
    type: "types",
    content: `export ${propsInterface}

export type ${name}Variant = "default" | "primary" | "secondary" | "outline";
export type ${name}Size = "sm" | "md" | "lg";
`,
  });

  // 测试文件
  files.push({
    path: `${name}.test.tsx`,
    type: "test",
    content: `import { render, screen } from "@testing-library/react";
import { ${name} } from "./${name}";

describe("${name}", () => {
  it("renders children correctly", () => {
    render(<${name}>Test Content</${name}>);
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<${name} className="custom-class">Test</${name}>);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
`,
  });

  // Storybook 文件
  files.push({
    path: `${name}.stories.tsx`,
    type: "story",
    content: `import type { Meta, StoryObj } from "@storybook/react";
import { ${name} } from "./${name}";

const meta: Meta<typeof ${name}> = {
  title: "Components/${name}",
  component: ${name},
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: "text",
      description: "Content to render inside the component",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ${name}>;

export const Default: Story = {
  args: {
    children: "${name} Content",
  },
};

export const WithCustomContent: Story = {
  args: {
    children: "Custom content here",
  },
};
`,
  });

  return files;
}

// Vue 组件模板
function generateVueComponent(config: ComponentConfig): GeneratedFile[] {
  const { name, style, props = [] } = config;
  const files: GeneratedFile[] = [];

  // Props 定义
  const propsDefinition = props.map(p =>
    `    ${p.name}: {\n      type: ${p.type === "string" ? "String" : p.type === "number" ? "Number" : p.type === "boolean" ? "Boolean" : "Object"} as PropType<${p.type}>,\n      required: ${p.required},${p.default ? `\n      default: ${p.default},` : ""}\n    }`
  ).join(",\n");

  let componentContent = "";

  if (style === "tailwind") {
    componentContent = `<script setup lang="ts">
import { PropType } from "vue";

defineProps({
${propsDefinition || "  // No props defined"}
});
</script>

<template>
  <div
    class="flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-all duration-200"
  >
    <slot />
  </div>
</template>
`;
  } else {
    componentContent = `<script setup lang="ts">
import { PropType } from "vue";

defineProps({
${propsDefinition || "  // No props defined"}
});
</script>

<template>
  <div class="${name.toLowerCase()}">
    <slot />
  </div>
</template>

<style scoped>
.${name.toLowerCase()} {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.${name.toLowerCase()}:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
`;
  }

  files.push({
    path: `${name}.vue`,
    type: "component",
    content: componentContent,
  });

  // 类型文件
  files.push({
    path: `${name}.types.ts`,
    type: "types",
    content: `export interface ${name}Props {
${props.map(p => `  /** ${p.description} */\n  ${p.name}${p.required ? "" : "?"}: ${p.type};`).join("\n") || "  // No props defined"}
}

export type ${name}Variant = "default" | "primary" | "secondary" | "outline";
export type ${name}Size = "sm" | "md" | "lg";
`,
  });

  return files;
}

// 主生成函数
function generateComponent(config: ComponentConfig): GeneratedComponent {
  const files = config.tech === "vue"
    ? generateVueComponent(config)
    : generateReactComponent(config);

  return {
    name: config.name,
    files,
    techStack: `${config.tech} + ${config.style}`,
  };
}

// 格式化输出
function formatResult(result: GeneratedComponent): string {
  const lines: string[] = [];

  lines.push(`# 组件生成报告`);
  lines.push(``);
  lines.push(`**组件名**: ${result.name}`);
  lines.push(`**技术栈**: ${result.techStack}`);
  lines.push(`**文件数**: ${result.files.length}`);
  lines.push(``);

  lines.push(`## 生成的文件`);
  lines.push(``);

  for (const file of result.files) {
    lines.push(`### ${file.path} (${file.type})`);
    lines.push(``);
    lines.push("```" + (file.path.endsWith(".vue") ? "vue" : file.path.endsWith(".css") ? "css" : "tsx"));
    lines.push(file.content);
    lines.push("```");
    lines.push(``);
  }

  return lines.join("\n");
}

// 写入文件
function writeFiles(result: GeneratedComponent, outputDir: string): void {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const file of result.files) {
    const filePath = `${outputDir}/${file.path}`;
    fs.writeFileSync(filePath, file.content);
    console.log(`  ✅ ${file.path}`);
  }
}

// CLI 入口
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);

  const techIdx = args.indexOf("--tech");
  const tech = (techIdx !== -1 ? args[techIdx + 1] : "react") as "react" | "vue";

  const styleIdx = args.indexOf("--style");
  const style = (styleIdx !== -1 ? args[styleIdx + 1] : "tailwind") as "tailwind" | "css" | "styled";

  const outputIdx = args.indexOf("--output");
  const outputDir = outputIdx !== -1 ? args[outputIdx + 1] : null;

  const name = args.filter((a: string) =>
    !a.startsWith("--") &&
    a !== tech &&
    a !== style &&
    a !== outputDir
  )[0];

  if (!name) {
    console.error("Usage: npx ts-node generate-component.ts <name> --tech <react|vue> [--style <tailwind|css|styled>]");
    console.error("Example: npx ts-node generate-component.ts Button --tech react --style tailwind");
    process.exit(1);
  }

  const config: ComponentConfig = {
    name,
    tech,
    style,
  };

  const result = generateComponent(config);

  if (outputDir) {
    console.log(`📁 写入文件到 ${outputDir}:`);
    writeFiles(result, outputDir);
    console.log(`\n✅ 组件生成完成`);
  } else {
    console.log(formatResult(result));
  }

  if (args.includes("--json")) {
    console.log("\n📦 JSON:");
    console.log(JSON.stringify(result, null, 2));
  }
}

export { generateComponent };
export type { ComponentConfig, GeneratedComponent };
