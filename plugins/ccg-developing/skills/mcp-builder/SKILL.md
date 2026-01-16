---
name: mcp-builder
description: |
  【触发条件】当用户需要创建 MCP 服务器、集成外部 API 到 Claude、实现自定义工具时使用。
  【核心产出】输出：MCP 服务器代码（Python/TypeScript）、工具定义、配置文件。
  【不触发】不用于：使用现有 MCP 工具（直接调用）、API 客户端开发（改用 api-designer）。
  【先问什么】若缺少：集成的 API/服务、实现语言（Python/TypeScript）、工具功能描述，先提问补齐。
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, mcp__context7__resolve-library-id, mcp__context7__get-library-docs
---

# MCP Builder - MCP 服务器构建助手

## 功能概述

指导创建高质量的 MCP (Model Context Protocol) 服务器，用于将外部 API 和服务与 LLM 集成。支持 Python 和 TypeScript 两种实现。

## MCP 协议核心概念

### 三大基元

| 基元          | 用途             | 示例                 |
| ------------- | ---------------- | -------------------- |
| **Tools**     | 可执行的操作     | 发送邮件、查询数据库 |
| **Resources** | 只读数据源       | 文件内容、配置信息   |
| **Prompts**   | 预定义的提示模板 | 代码审查模板         |

### 传输机制

| 类型    | 适用场景  | 配置方式   |
| ------- | --------- | ---------- |
| `stdio` | 本地进程  | 命令行启动 |
| `sse`   | HTTP 服务 | URL 连接   |

## Python 实现模板

### 项目结构

```
my-mcp-server/
├── pyproject.toml
├── src/
│   └── my_mcp_server/
│       ├── __init__.py
│       └── server.py
└── README.md
```

### 基础服务器

```python
from mcp.server import Server
from mcp.types import Tool, TextContent

app = Server("my-server")

@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="my_tool",
            description="工具描述",
            inputSchema={
                "type": "object",
                "properties": {
                    "param": {"type": "string", "description": "参数说明"}
                },
                "required": ["param"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "my_tool":
        result = process(arguments["param"])
        return [TextContent(type="text", text=result)]
    raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    import asyncio
    from mcp.server.stdio import stdio_server
    asyncio.run(stdio_server(app))
```

### pyproject.toml

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "my-mcp-server"
version = "0.1.0"
dependencies = ["mcp>=1.0.0"]

[project.scripts]
my-mcp-server = "my_mcp_server.server:main"
```

## TypeScript 实现模板

### 项目结构

```
my-mcp-server/
├── package.json
├── tsconfig.json
├── src/
│   └── index.ts
└── README.md
```

### 基础服务器

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  {
    name: "my-server",
    version: "1.0.0",
  },
  {
    capabilities: { tools: {} },
  },
);

server.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "my_tool",
      description: "工具描述",
      inputSchema: {
        type: "object",
        properties: {
          param: { type: "string", description: "参数说明" },
        },
        required: ["param"],
      },
    },
  ],
}));

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;
  if (name === "my_tool") {
    const result = process(args.param);
    return { content: [{ type: "text", text: result }] };
  }
  throw new Error(`Unknown tool: ${name}`);
});

const transport = new StdioServerTransport();
server.connect(transport);
```

## Claude Code 配置

### .mcp.json

```json
{
  "mcpServers": {
    "my-server": {
      "command": "python",
      "args": ["-m", "my_mcp_server.server"],
      "env": {
        "API_KEY": "${MY_API_KEY}"
      }
    }
  }
}
```

## 最佳实践

### 工具设计原则

1. **原子性**: 每个工具完成单一职责
2. **幂等性**: 相同输入产生相同结果
3. **错误处理**: 返回清晰的错误信息
4. **输入验证**: 使用 JSON Schema 严格验证

### 安全考虑

- 敏感信息通过环境变量传递
- 实施速率限制
- 验证和清理用户输入
- 最小权限原则

## 参考资源

- [MCP 官方规范](https://modelcontextprotocol.io/)
- [Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
