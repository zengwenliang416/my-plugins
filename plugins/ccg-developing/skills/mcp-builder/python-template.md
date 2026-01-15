# MCP Python 服务器模板

## 项目结构

```
my-mcp-server/
├── pyproject.toml
├── README.md
├── src/
│   └── my_mcp_server/
│       ├── __init__.py
│       ├── server.py          # 服务器入口
│       ├── tools/             # 工具实现
│       │   ├── __init__.py
│       │   └── my_tool.py
│       ├── resources/         # 资源实现
│       │   ├── __init__.py
│       │   └── my_resource.py
│       └── prompts/           # 提示模板
│           ├── __init__.py
│           └── my_prompt.py
└── tests/
    └── test_server.py
```

## pyproject.toml

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "my-mcp-server"
version = "0.1.0"
description = "My MCP Server"
readme = "README.md"
requires-python = ">=3.10"
license = "MIT"
dependencies = [
    "mcp>=1.0.0",
    "httpx>=0.25.0",
    "pydantic>=2.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "pytest-asyncio>=0.21.0",
]

[project.scripts]
my-mcp-server = "my_mcp_server.server:main"

[tool.hatch.build.targets.wheel]
packages = ["src/my_mcp_server"]
```

## server.py - 完整模板

````python
"""MCP Server 主入口"""
import asyncio
import logging
from typing import Any

from mcp.server import Server
from mcp.types import (
    Tool,
    TextContent,
    ImageContent,
    Resource,
    ResourceTemplate,
    Prompt,
    PromptMessage,
    GetPromptResult,
)

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建服务器实例
app = Server("my-mcp-server")


# ============ Tools ============

@app.list_tools()
async def list_tools() -> list[Tool]:
    """列出所有可用工具"""
    return [
        Tool(
            name="search",
            description="搜索内容",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "搜索关键词"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "返回结果数量",
                        "default": 10
                    }
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="create_item",
            description="创建新项目",
            inputSchema={
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "data": {"type": "object"}
                },
                "required": ["name"]
            }
        )
    ]


@app.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent | ImageContent]:
    """执行工具调用"""
    logger.info(f"Calling tool: {name} with args: {arguments}")

    if name == "search":
        query = arguments["query"]
        limit = arguments.get("limit", 10)
        # 实际实现搜索逻辑
        results = await perform_search(query, limit)
        return [TextContent(type="text", text=str(results))]

    elif name == "create_item":
        name = arguments["name"]
        data = arguments.get("data", {})
        # 实际实现创建逻辑
        result = await create_item(name, data)
        return [TextContent(type="text", text=f"Created: {result}")]

    raise ValueError(f"Unknown tool: {name}")


# ============ Resources ============

@app.list_resources()
async def list_resources() -> list[Resource]:
    """列出静态资源"""
    return [
        Resource(
            uri="config://settings",
            name="Settings",
            description="应用配置",
            mimeType="application/json"
        )
    ]


@app.list_resource_templates()
async def list_resource_templates() -> list[ResourceTemplate]:
    """列出资源模板（动态资源）"""
    return [
        ResourceTemplate(
            uriTemplate="item://{id}",
            name="Item by ID",
            description="通过 ID 获取项目"
        )
    ]


@app.read_resource()
async def read_resource(uri: str) -> str:
    """读取资源内容"""
    if uri == "config://settings":
        return '{"theme": "dark", "language": "zh-CN"}'

    if uri.startswith("item://"):
        item_id = uri.replace("item://", "")
        item = await get_item(item_id)
        return str(item)

    raise ValueError(f"Unknown resource: {uri}")


# ============ Prompts ============

@app.list_prompts()
async def list_prompts() -> list[Prompt]:
    """列出提示模板"""
    return [
        Prompt(
            name="code_review",
            description="代码审查模板",
            arguments=[
                {
                    "name": "code",
                    "description": "要审查的代码",
                    "required": True
                },
                {
                    "name": "language",
                    "description": "编程语言",
                    "required": False
                }
            ]
        )
    ]


@app.get_prompt()
async def get_prompt(name: str, arguments: dict[str, str] | None) -> GetPromptResult:
    """获取提示内容"""
    if name == "code_review":
        code = arguments.get("code", "") if arguments else ""
        language = arguments.get("language", "unknown") if arguments else "unknown"
        return GetPromptResult(
            description="代码审查",
            messages=[
                PromptMessage(
                    role="user",
                    content=TextContent(
                        type="text",
                        text=f"请审查以下 {language} 代码:\n\n```{language}\n{code}\n```"
                    )
                )
            ]
        )

    raise ValueError(f"Unknown prompt: {name}")


# ============ Helper Functions ============

async def perform_search(query: str, limit: int) -> list[dict]:
    """搜索实现"""
    # TODO: 实现实际搜索逻辑
    return [{"id": 1, "title": f"Result for {query}"}]


async def create_item(name: str, data: dict) -> dict:
    """创建项目实现"""
    # TODO: 实现实际创建逻辑
    return {"id": 1, "name": name, **data}


async def get_item(item_id: str) -> dict:
    """获取项目实现"""
    # TODO: 实现实际获取逻辑
    return {"id": item_id, "name": "Item"}


# ============ Main ============

def main():
    """启动服务器"""
    from mcp.server.stdio import stdio_server
    asyncio.run(stdio_server(app))


if __name__ == "__main__":
    main()
````

## 测试模板

```python
"""tests/test_server.py"""
import pytest
from my_mcp_server.server import app


@pytest.mark.asyncio
async def test_list_tools():
    tools = await app.list_tools()
    assert len(tools) > 0
    assert any(t.name == "search" for t in tools)


@pytest.mark.asyncio
async def test_call_search_tool():
    result = await app.call_tool("search", {"query": "test"})
    assert len(result) > 0
    assert result[0].type == "text"
```

## 运行命令

```bash
# 安装开发依赖
pip install -e ".[dev]"

# 运行测试
pytest

# 直接运行
python -m my_mcp_server.server

# 作为命令运行
my-mcp-server
```
