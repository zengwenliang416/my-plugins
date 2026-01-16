#!/usr/bin/env python3
"""
OpenAPI 规范生成器
用法:
  python openapi-generator.py --resource users --operations list,get,create,update,delete
  python openapi-generator.py --scan ./src/routes --framework express
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# OpenAPI 基础模板
BASE_TEMPLATE = {
    "openapi": "3.0.3",
    "info": {
        "title": "API Documentation",
        "version": "1.0.0",
        "description": "Auto-generated API documentation",
    },
    "servers": [{"url": "/api/v1", "description": "API Server"}],
    "paths": {},
    "components": {
        "schemas": {},
        "securitySchemes": {
            "BearerAuth": {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"}
        },
    },
}

# CRUD 操作模板
OPERATION_TEMPLATES = {
    "list": {
        "method": "get",
        "path": "/{resource}",
        "summary": "获取{resource_cn}列表",
        "responses": {
            "200": {
                "description": "成功",
                "content": {
                    "application/json": {
                        "schema": {
                            "type": "object",
                            "properties": {
                                "data": {
                                    "type": "array",
                                    "items": {
                                        "$ref": "#/components/schemas/{Resource}"
                                    },
                                },
                                "total": {"type": "integer"},
                                "page": {"type": "integer"},
                                "pageSize": {"type": "integer"},
                            },
                        }
                    }
                },
            }
        },
        "parameters": [
            {
                "name": "page",
                "in": "query",
                "schema": {"type": "integer", "default": 1},
            },
            {
                "name": "pageSize",
                "in": "query",
                "schema": {"type": "integer", "default": 20},
            },
        ],
    },
    "get": {
        "method": "get",
        "path": "/{resource}/{id}",
        "summary": "获取{resource_cn}详情",
        "responses": {
            "200": {
                "description": "成功",
                "content": {
                    "application/json": {
                        "schema": {"$ref": "#/components/schemas/{Resource}"}
                    }
                },
            },
            "404": {"description": "未找到"},
        },
        "parameters": [
            {"name": "id", "in": "path", "required": True, "schema": {"type": "string"}}
        ],
    },
    "create": {
        "method": "post",
        "path": "/{resource}",
        "summary": "创建{resource_cn}",
        "responses": {
            "201": {
                "description": "创建成功",
                "content": {
                    "application/json": {
                        "schema": {"$ref": "#/components/schemas/{Resource}"}
                    }
                },
            },
            "400": {"description": "请求参数错误"},
        },
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {"$ref": "#/components/schemas/{Resource}Input"}
                }
            },
        },
    },
    "update": {
        "method": "put",
        "path": "/{resource}/{id}",
        "summary": "更新{resource_cn}",
        "responses": {
            "200": {
                "description": "更新成功",
                "content": {
                    "application/json": {
                        "schema": {"$ref": "#/components/schemas/{Resource}"}
                    }
                },
            },
            "404": {"description": "未找到"},
        },
        "parameters": [
            {"name": "id", "in": "path", "required": True, "schema": {"type": "string"}}
        ],
        "requestBody": {
            "required": True,
            "content": {
                "application/json": {
                    "schema": {"$ref": "#/components/schemas/{Resource}Input"}
                }
            },
        },
    },
    "patch": {
        "method": "patch",
        "path": "/{resource}/{id}",
        "summary": "部分更新{resource_cn}",
        "responses": {
            "200": {
                "description": "更新成功",
                "content": {
                    "application/json": {
                        "schema": {"$ref": "#/components/schemas/{Resource}"}
                    }
                },
            },
            "404": {"description": "未找到"},
        },
        "parameters": [
            {"name": "id", "in": "path", "required": True, "schema": {"type": "string"}}
        ],
        "requestBody": {
            "content": {
                "application/json": {
                    "schema": {"$ref": "#/components/schemas/{Resource}Patch"}
                }
            },
        },
    },
    "delete": {
        "method": "delete",
        "path": "/{resource}/{id}",
        "summary": "删除{resource_cn}",
        "responses": {
            "204": {"description": "删除成功"},
            "404": {"description": "未找到"},
        },
        "parameters": [
            {"name": "id", "in": "path", "required": True, "schema": {"type": "string"}}
        ],
    },
}


def to_pascal_case(s: str) -> str:
    """转换为 PascalCase"""
    return "".join(word.capitalize() for word in s.replace("-", "_").split("_"))


def to_kebab_case(s: str) -> str:
    """转换为 kebab-case"""
    s = re.sub(r"([A-Z])", r"-\1", s).lower()
    return s.strip("-").replace("_", "-")


def generate_schema(resource: str) -> Dict[str, Any]:
    """生成资源 Schema"""
    pascal_name = to_pascal_case(resource)

    return {
        pascal_name: {
            "type": "object",
            "properties": {
                "id": {"type": "string", "description": "唯一标识"},
                "createdAt": {"type": "string", "format": "date-time"},
                "updatedAt": {"type": "string", "format": "date-time"},
            },
            "required": ["id"],
        },
        f"{pascal_name}Input": {
            "type": "object",
            "description": f"创建/更新{resource}的输入",
            "properties": {},
        },
        f"{pascal_name}Patch": {
            "type": "object",
            "description": f"部分更新{resource}的输入",
            "properties": {},
        },
    }


def generate_resource_paths(resource: str, operations: List[str]) -> Dict[str, Any]:
    """生成资源路径"""
    paths = {}
    pascal_name = to_pascal_case(resource)
    kebab_name = to_kebab_case(resource)

    for op in operations:
        if op not in OPERATION_TEMPLATES:
            print(f"警告: 未知操作 '{op}'，跳过")
            continue

        template = OPERATION_TEMPLATES[op]
        method = template["method"]
        path = template["path"].format(resource=kebab_name)

        # 构建操作对象
        operation = {
            "summary": template["summary"].format(resource_cn=resource),
            "tags": [pascal_name],
            "operationId": f"{op}{pascal_name}",
            "responses": {},
        }

        # 处理响应
        for code, resp in template.get("responses", {}).items():
            if isinstance(resp, dict) and "content" in resp:
                # 替换 schema 引用
                resp_copy = json.loads(
                    json.dumps(resp).replace("{Resource}", pascal_name)
                )
                operation["responses"][code] = resp_copy
            else:
                operation["responses"][code] = resp

        # 处理参数
        if "parameters" in template:
            operation["parameters"] = template["parameters"]

        # 处理请求体
        if "requestBody" in template:
            body = json.loads(
                json.dumps(template["requestBody"]).replace("{Resource}", pascal_name)
            )
            operation["requestBody"] = body

        # 添加到路径
        if path not in paths:
            paths[path] = {}
        paths[path][method] = operation

    return paths


def scan_express_routes(directory: str) -> Dict[str, Any]:
    """扫描 Express 路由文件"""
    paths = {}
    route_pattern = re.compile(
        r"router\.(get|post|put|patch|delete)\s*\(\s*['\"]([^'\"]+)['\"]"
    )

    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith((".js", ".ts")):
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()

                for match in route_pattern.finditer(content):
                    method, path = match.groups()
                    if path not in paths:
                        paths[path] = {}
                    paths[path][method] = {
                        "summary": f"{method.upper()} {path}",
                        "responses": {"200": {"description": "成功"}},
                    }

    return paths


def scan_fastapi_routes(directory: str) -> Dict[str, Any]:
    """扫描 FastAPI 路由文件"""
    paths = {}
    route_pattern = re.compile(
        r"@(?:router|app)\.(get|post|put|patch|delete)\s*\(\s*['\"]([^'\"]+)['\"]"
    )

    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()

                for match in route_pattern.finditer(content):
                    method, path = match.groups()
                    if path not in paths:
                        paths[path] = {}
                    paths[path][method] = {
                        "summary": f"{method.upper()} {path}",
                        "responses": {"200": {"description": "成功"}},
                    }

    return paths


def to_yaml(obj: Any, indent: int = 0) -> str:
    """简单的 YAML 输出（避免依赖 pyyaml）"""
    result = []
    prefix = "  " * indent

    if isinstance(obj, dict):
        for key, value in obj.items():
            if isinstance(value, (dict, list)) and value:
                result.append(f"{prefix}{key}:")
                result.append(to_yaml(value, indent + 1))
            elif isinstance(value, str):
                # 处理多行字符串
                if "\n" in value:
                    result.append(f"{prefix}{key}: |")
                    for line in value.split("\n"):
                        result.append(f"{prefix}  {line}")
                else:
                    result.append(f'{prefix}{key}: "{value}"')
            elif isinstance(value, bool):
                result.append(f"{prefix}{key}: {str(value).lower()}")
            elif value is None:
                result.append(f"{prefix}{key}: null")
            else:
                result.append(f"{prefix}{key}: {value}")
    elif isinstance(obj, list):
        for item in obj:
            if isinstance(item, dict):
                result.append(f"{prefix}-")
                for key, value in item.items():
                    if isinstance(value, (dict, list)) and value:
                        result.append(f"{prefix}  {key}:")
                        result.append(to_yaml(value, indent + 2))
                    elif isinstance(value, str):
                        result.append(f'{prefix}  {key}: "{value}"')
                    elif isinstance(value, bool):
                        result.append(f"{prefix}  {key}: {str(value).lower()}")
                    else:
                        result.append(f"{prefix}  {key}: {value}")
            else:
                result.append(
                    f'{prefix}- "{item}"'
                    if isinstance(item, str)
                    else f"{prefix}- {item}"
                )

    return "\n".join(result)


def main():
    parser = argparse.ArgumentParser(description="OpenAPI 规范生成器")
    parser.add_argument("--resource", type=str, help="资源名称")
    parser.add_argument(
        "--operations",
        type=str,
        default="list,get,create,update,delete",
        help="操作列表",
    )
    parser.add_argument("--scan", type=str, help="扫描现有代码目录")
    parser.add_argument(
        "--framework", type=str, choices=["express", "fastapi"], help="框架类型"
    )
    parser.add_argument("--output", type=str, help="输出文件路径")
    parser.add_argument(
        "--title", type=str, default="API Documentation", help="API 标题"
    )
    parser.add_argument("--version", type=str, default="1.0.0", help="API 版本")
    args = parser.parse_args()

    # 初始化 OpenAPI 文档
    spec = json.loads(json.dumps(BASE_TEMPLATE))
    spec["info"]["title"] = args.title
    spec["info"]["version"] = args.version

    if args.scan:
        # 扫描现有代码
        if not os.path.isdir(args.scan):
            print(f"错误: 目录不存在 '{args.scan}'")
            sys.exit(1)

        print(f"扫描目录: {args.scan}")
        if args.framework == "express":
            paths = scan_express_routes(args.scan)
        elif args.framework == "fastapi":
            paths = scan_fastapi_routes(args.scan)
        else:
            print("错误: 扫描模式需要指定 --framework")
            sys.exit(1)

        spec["paths"] = paths
        print(f"发现 {len(paths)} 个路径")

    elif args.resource:
        # 生成资源 CRUD
        operations = [op.strip() for op in args.operations.split(",")]
        paths = generate_resource_paths(args.resource, operations)
        schemas = generate_schema(args.resource)

        spec["paths"] = paths
        spec["components"]["schemas"] = schemas
        print(f"为资源 '{args.resource}' 生成 {len(operations)} 个操作")

    else:
        parser.print_help()
        sys.exit(1)

    # 输出
    output = to_yaml(spec)

    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(output)
        print(f"已保存到: {args.output}")
    else:
        print("\n" + "=" * 60)
        print("OpenAPI 规范:")
        print("=" * 60)
        print(output)


if __name__ == "__main__":
    main()
