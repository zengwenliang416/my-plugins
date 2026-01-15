# MCP TypeScript 服务器模板

## 项目结构

```
my-mcp-server/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── index.ts           # 服务器入口
│   ├── tools/             # 工具实现
│   │   ├── index.ts
│   │   └── search.ts
│   ├── resources/         # 资源实现
│   │   ├── index.ts
│   │   └── config.ts
│   └── prompts/           # 提示模板
│       ├── index.ts
│       └── codeReview.ts
└── tests/
    └── server.test.ts
```

## package.json

```json
{
  "name": "my-mcp-server",
  "version": "0.1.0",
  "description": "My MCP Server",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "my-mcp-server": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "test": "vitest"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## src/index.ts - 完整模板

```typescript
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  Tool,
  Resource,
  Prompt,
} from "@modelcontextprotocol/sdk/types.js";

// 创建服务器实例
const server = new Server(
  {
    name: "my-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  },
);

// ============ Tools ============

const TOOLS: Tool[] = [
  {
    name: "search",
    description: "搜索内容",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "搜索关键词",
        },
        limit: {
          type: "number",
          description: "返回结果数量",
          default: 10,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "create_item",
    description: "创建新项目",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        data: { type: "object" },
      },
      required: ["name"],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "search": {
      const query = args?.query as string;
      const limit = (args?.limit as number) ?? 10;
      const results = await performSearch(query, limit);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }

    case "create_item": {
      const itemName = args?.name as string;
      const data = (args?.data as object) ?? {};
      const result = await createItem(itemName, data);
      return {
        content: [{ type: "text", text: `Created: ${JSON.stringify(result)}` }],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// ============ Resources ============

const RESOURCES: Resource[] = [
  {
    uri: "config://settings",
    name: "Settings",
    description: "应用配置",
    mimeType: "application/json",
  },
];

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: RESOURCES,
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === "config://settings") {
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify({ theme: "dark", language: "zh-CN" }),
        },
      ],
    };
  }

  if (uri.startsWith("item://")) {
    const itemId = uri.replace("item://", "");
    const item = await getItem(itemId);
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(item),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

// ============ Prompts ============

const PROMPTS: Prompt[] = [
  {
    name: "code_review",
    description: "代码审查模板",
    arguments: [
      {
        name: "code",
        description: "要审查的代码",
        required: true,
      },
      {
        name: "language",
        description: "编程语言",
        required: false,
      },
    ],
  },
];

server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: PROMPTS,
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "code_review") {
    const code = args?.code ?? "";
    const language = args?.language ?? "unknown";
    return {
      description: "代码审查",
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `请审查以下 ${language} 代码:\n\n\`\`\`${language}\n${code}\n\`\`\``,
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
});

// ============ Helper Functions ============

async function performSearch(
  query: string,
  limit: number,
): Promise<Array<{ id: number; title: string }>> {
  // TODO: 实现实际搜索逻辑
  return [{ id: 1, title: `Result for ${query}` }];
}

async function createItem(
  name: string,
  data: object,
): Promise<{ id: number; name: string }> {
  // TODO: 实现实际创建逻辑
  return { id: 1, name, ...data };
}

async function getItem(itemId: string): Promise<{ id: string; name: string }> {
  // TODO: 实现实际获取逻辑
  return { id: itemId, name: "Item" };
}

// ============ Main ============

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server started");
}

main().catch(console.error);
```

## 测试模板

```typescript
// tests/server.test.ts
import { describe, it, expect } from "vitest";

describe("MCP Server", () => {
  it("should have tools defined", () => {
    // 测试工具定义
    expect(true).toBe(true);
  });

  it("should handle search tool", async () => {
    // 测试搜索工具
    expect(true).toBe(true);
  });
});
```

## 运行命令

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 运行
npm start

# 测试
npm test
```

## Claude Code 配置

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/my-mcp-server/dist/index.js"],
      "env": {
        "API_KEY": "${MY_API_KEY}"
      }
    }
  }
}
```
