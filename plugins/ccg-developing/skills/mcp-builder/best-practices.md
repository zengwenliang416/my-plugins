# MCP 服务器最佳实践

## 工具设计原则

### 1. 原子性

每个工具完成单一、明确的职责：

```python
# ❌ 不好：一个工具做太多事
Tool(
    name="manage_user",
    description="创建、更新、删除用户",
    ...
)

# ✅ 好：每个工具单一职责
Tool(name="create_user", description="创建新用户", ...)
Tool(name="update_user", description="更新用户信息", ...)
Tool(name="delete_user", description="删除用户", ...)
```

### 2. 清晰的输入模式

使用详细的 JSON Schema 定义输入：

```python
Tool(
    name="search_documents",
    inputSchema={
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "搜索关键词",
                "minLength": 1,
                "maxLength": 200
            },
            "filters": {
                "type": "object",
                "properties": {
                    "date_from": {
                        "type": "string",
                        "format": "date",
                        "description": "起始日期 (YYYY-MM-DD)"
                    },
                    "category": {
                        "type": "string",
                        "enum": ["article", "report", "note"],
                        "description": "文档类别"
                    }
                }
            },
            "limit": {
                "type": "integer",
                "minimum": 1,
                "maximum": 100,
                "default": 10,
                "description": "返回结果数量"
            }
        },
        "required": ["query"]
    }
)
```

### 3. 友好的描述

使用清晰、具体的描述：

```python
# ❌ 模糊
description="处理数据"

# ✅ 具体
description="将 CSV 文件转换为 JSON 格式，支持自定义分隔符和编码"
```

## 错误处理

### 1. 返回有意义的错误

```python
@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    try:
        if name == "search":
            results = await search(arguments["query"])
            if not results:
                return [TextContent(
                    type="text",
                    text="未找到匹配结果。建议：\n1. 尝试更宽泛的关键词\n2. 检查拼写"
                )]
            return [TextContent(type="text", text=format_results(results))]

    except RateLimitError:
        return [TextContent(
            type="text",
            text="请求过于频繁，请稍后重试（建议等待 30 秒）"
        )]

    except AuthenticationError:
        return [TextContent(
            type="text",
            text="认证失败，请检查 API 密钥是否正确配置"
        )]

    except Exception as e:
        logger.exception(f"Tool {name} failed")
        return [TextContent(
            type="text",
            text=f"操作失败：{str(e)}\n请检查输入参数后重试"
        )]
```

### 2. 输入验证

```python
def validate_arguments(name: str, arguments: dict) -> None:
    """验证工具参数"""
    if name == "search":
        query = arguments.get("query", "")
        if len(query) < 2:
            raise ValueError("搜索关键词至少需要 2 个字符")
        if len(query) > 200:
            raise ValueError("搜索关键词不能超过 200 个字符")

    elif name == "create_item":
        if not arguments.get("name"):
            raise ValueError("名称不能为空")
```

## 安全考虑

### 1. 环境变量管理

```python
import os

# 不要硬编码敏感信息
API_KEY = os.environ.get("API_KEY")
if not API_KEY:
    raise RuntimeError("API_KEY 环境变量未设置")

# Claude Code 配置中使用变量
# .mcp.json
{
    "env": {
        "API_KEY": "${MY_API_KEY}"  # 从系统环境变量读取
    }
}
```

### 2. 输入清理

```python
import re

def sanitize_path(path: str) -> str:
    """清理文件路径，防止目录遍历"""
    # 移除 .. 和绝对路径
    path = re.sub(r'\.\.', '', path)
    path = path.lstrip('/')
    return path

def sanitize_query(query: str) -> str:
    """清理查询字符串"""
    # 移除潜在的注入字符
    return re.sub(r'[;\'"\\]', '', query)
```

### 3. 速率限制

```python
from collections import defaultdict
from time import time

class RateLimiter:
    def __init__(self, max_requests: int = 60, window: int = 60):
        self.max_requests = max_requests
        self.window = window
        self.requests = defaultdict(list)

    def is_allowed(self, key: str) -> bool:
        now = time()
        # 清理过期请求
        self.requests[key] = [
            t for t in self.requests[key]
            if now - t < self.window
        ]
        # 检查是否超限
        if len(self.requests[key]) >= self.max_requests:
            return False
        self.requests[key].append(now)
        return True

rate_limiter = RateLimiter()

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    if not rate_limiter.is_allowed(name):
        raise RateLimitError("请求过于频繁")
    # ...
```

## 性能优化

### 1. 异步操作

```python
import asyncio
import httpx

async def fetch_multiple(urls: list[str]) -> list[dict]:
    """并发获取多个 URL"""
    async with httpx.AsyncClient() as client:
        tasks = [client.get(url) for url in urls]
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        return [
            r.json() if not isinstance(r, Exception) else {"error": str(r)}
            for r in responses
        ]
```

### 2. 缓存

```python
from functools import lru_cache
from datetime import datetime, timedelta

# 简单内存缓存
@lru_cache(maxsize=100)
def get_cached_data(key: str) -> dict:
    return fetch_data(key)

# 带过期时间的缓存
class TimedCache:
    def __init__(self, ttl: int = 300):
        self.cache = {}
        self.ttl = ttl

    def get(self, key: str):
        if key in self.cache:
            value, expiry = self.cache[key]
            if datetime.now() < expiry:
                return value
            del self.cache[key]
        return None

    def set(self, key: str, value):
        expiry = datetime.now() + timedelta(seconds=self.ttl)
        self.cache[key] = (value, expiry)
```

## 日志和监控

### 1. 结构化日志

```python
import logging
import json

class StructuredLogger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)

    def log(self, level: str, message: str, **kwargs):
        log_entry = {
            "message": message,
            "timestamp": datetime.now().isoformat(),
            **kwargs
        }
        getattr(self.logger, level)(json.dumps(log_entry))

logger = StructuredLogger("mcp-server")

# 使用
logger.log("info", "Tool called", tool="search", args={"query": "test"})
logger.log("error", "Tool failed", tool="search", error=str(e))
```

### 2. 指标收集

```python
from dataclasses import dataclass, field
from time import time

@dataclass
class Metrics:
    tool_calls: dict = field(default_factory=dict)
    errors: dict = field(default_factory=dict)
    latencies: dict = field(default_factory=list)

    def record_call(self, tool: str, duration: float, success: bool):
        self.tool_calls[tool] = self.tool_calls.get(tool, 0) + 1
        if not success:
            self.errors[tool] = self.errors.get(tool, 0) + 1
        self.latencies.setdefault(tool, []).append(duration)

metrics = Metrics()

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    start = time()
    success = True
    try:
        # ... 执行工具
        pass
    except Exception as e:
        success = False
        raise
    finally:
        metrics.record_call(name, time() - start, success)
```

## 测试策略

### 1. 单元测试

```python
import pytest

@pytest.mark.asyncio
async def test_search_tool():
    result = await call_tool("search", {"query": "test"})
    assert len(result) > 0
    assert result[0].type == "text"

@pytest.mark.asyncio
async def test_search_empty_query():
    with pytest.raises(ValueError, match="至少需要 2 个字符"):
        await call_tool("search", {"query": ""})
```

### 2. 集成测试

```python
@pytest.mark.asyncio
async def test_full_workflow():
    # 创建项目
    create_result = await call_tool("create_item", {"name": "Test"})
    assert "Created" in create_result[0].text

    # 搜索项目
    search_result = await call_tool("search", {"query": "Test"})
    assert "Test" in search_result[0].text
```
