#!/usr/bin/env python3
"""
API 规范验证器
用法:
  python validate-api.py --spec ./api/openapi.yaml
  python validate-api.py --spec ./api/openapi.yaml --impl ./src/routes
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple


def parse_yaml_simple(content: str) -> Dict[str, Any]:
    """简单的 YAML 解析器（避免依赖 pyyaml）"""
    # 这是一个非常简化的解析器，仅用于基本验证
    # 生产环境应使用 pyyaml
    result = {}
    current_path = []
    current_indent = 0

    lines = content.split("\n")
    for line in lines:
        if not line.strip() or line.strip().startswith("#"):
            continue

        # 计算缩进
        indent = len(line) - len(line.lstrip())
        stripped = line.strip()

        # 处理键值对
        if ":" in stripped:
            key, _, value = stripped.partition(":")
            key = key.strip()
            value = value.strip().strip('"').strip("'")

            # 调整路径深度
            while current_path and indent <= current_indent:
                current_path.pop()
                current_indent = max(0, current_indent - 2)

            if value:
                # 有值
                if current_path:
                    obj = result
                    for p in current_path[:-1]:
                        obj = obj.setdefault(p, {})
                    obj.setdefault(current_path[-1], {})[key] = value
                else:
                    result[key] = value
            else:
                # 无值，是一个对象
                current_path.append(key)
                current_indent = indent
                if len(current_path) == 1:
                    result.setdefault(key, {})

    return result


def load_spec(filepath: str) -> Dict[str, Any]:
    """加载 OpenAPI 规范文件"""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    if filepath.endswith(".json"):
        return json.loads(content)
    else:
        # 尝试简单解析 YAML
        try:
            import yaml

            return yaml.safe_load(content)
        except ImportError:
            print("警告: pyyaml 未安装，使用简化解析器")
            return parse_yaml_simple(content)


class OpenAPIValidator:
    """OpenAPI 规范验证器"""

    def __init__(self, spec: Dict[str, Any]):
        self.spec = spec
        self.errors: List[str] = []
        self.warnings: List[str] = []

    def validate(self) -> bool:
        """执行完整验证"""
        self._validate_version()
        self._validate_info()
        self._validate_paths()
        self._validate_components()
        return len(self.errors) == 0

    def _validate_version(self):
        """验证 OpenAPI 版本"""
        version = self.spec.get("openapi", "")
        if not version:
            self.errors.append("缺少 'openapi' 版本字段")
        elif not version.startswith("3."):
            self.warnings.append(f"使用的 OpenAPI 版本 {version}，建议使用 3.x")

    def _validate_info(self):
        """验证 info 部分"""
        info = self.spec.get("info", {})
        if not info:
            self.errors.append("缺少 'info' 字段")
            return

        if not info.get("title"):
            self.errors.append("info.title 是必需的")
        if not info.get("version"):
            self.errors.append("info.version 是必需的")

    def _validate_paths(self):
        """验证 paths 部分"""
        paths = self.spec.get("paths", {})
        if not paths:
            self.warnings.append("没有定义任何路径")
            return

        for path, methods in paths.items():
            self._validate_path(path, methods)

    def _validate_path(self, path: str, methods: Dict[str, Any]):
        """验证单个路径"""
        # 检查路径格式
        if not path.startswith("/"):
            self.errors.append(f"路径必须以 '/' 开头: {path}")

        # 检查路径参数
        path_params = re.findall(r"\{(\w+)\}", path)

        valid_methods = [
            "get",
            "post",
            "put",
            "patch",
            "delete",
            "options",
            "head",
            "trace",
        ]

        for method, operation in methods.items():
            if method.lower() not in valid_methods:
                continue

            self._validate_operation(path, method, operation, path_params)

    def _validate_operation(
        self, path: str, method: str, operation: Dict[str, Any], path_params: List[str]
    ):
        """验证操作"""
        op_id = f"{method.upper()} {path}"

        # 检查 operationId
        if not operation.get("operationId"):
            self.warnings.append(f"{op_id}: 建议添加 operationId")

        # 检查 summary/description
        if not operation.get("summary") and not operation.get("description"):
            self.warnings.append(f"{op_id}: 建议添加 summary 或 description")

        # 检查 responses
        responses = operation.get("responses", {})
        if not responses:
            self.errors.append(f"{op_id}: 必须定义至少一个响应")
        else:
            # 检查常见响应码
            if method.lower() == "get" and "200" not in responses:
                self.warnings.append(f"{op_id}: GET 请求应定义 200 响应")
            if (
                method.lower() == "post"
                and "201" not in responses
                and "200" not in responses
            ):
                self.warnings.append(f"{op_id}: POST 请求应定义 201 或 200 响应")
            if (
                method.lower() == "delete"
                and "204" not in responses
                and "200" not in responses
            ):
                self.warnings.append(f"{op_id}: DELETE 请求应定义 204 或 200 响应")

        # 检查路径参数是否都有定义
        defined_params = {
            p.get("name")
            for p in operation.get("parameters", [])
            if p.get("in") == "path"
        }
        for param in path_params:
            if param not in defined_params:
                self.errors.append(
                    f"{op_id}: 路径参数 '{param}' 未在 parameters 中定义"
                )

        # 检查请求体
        if method.lower() in ["post", "put", "patch"]:
            request_body = operation.get("requestBody")
            if method.lower() in ["post", "put"] and not request_body:
                self.warnings.append(
                    f"{op_id}: {method.upper()} 请求通常需要 requestBody"
                )

    def _validate_components(self):
        """验证 components 部分"""
        components = self.spec.get("components", {})
        schemas = components.get("schemas", {})

        for name, schema in schemas.items():
            self._validate_schema(name, schema)

    def _validate_schema(self, name: str, schema: Dict[str, Any]):
        """验证 Schema"""
        if (
            not schema.get("type")
            and not schema.get("$ref")
            and not schema.get("allOf")
        ):
            self.warnings.append(f"Schema '{name}': 建议定义 type")

        # 检查 required 字段
        required = schema.get("required", [])
        properties = schema.get("properties", {})
        for req_field in required:
            if req_field not in properties:
                self.errors.append(
                    f"Schema '{name}': required 字段 '{req_field}' 未在 properties 中定义"
                )

    def print_report(self):
        """打印验证报告"""
        print("=" * 60)
        print("OpenAPI 规范验证报告")
        print("=" * 60)

        if self.errors:
            print(f"\n❌ 错误 ({len(self.errors)}):")
            for err in self.errors:
                print(f"   • {err}")

        if self.warnings:
            print(f"\n⚠️  警告 ({len(self.warnings)}):")
            for warn in self.warnings:
                print(f"   • {warn}")

        if not self.errors and not self.warnings:
            print("\n✅ 验证通过，未发现问题")

        print("\n" + "-" * 60)
        print(f"总计: {len(self.errors)} 个错误, {len(self.warnings)} 个警告")


class ImplementationChecker:
    """检查实现与规范的一致性"""

    def __init__(self, spec: Dict[str, Any], impl_dir: str):
        self.spec = spec
        self.impl_dir = impl_dir
        self.spec_endpoints: Set[Tuple[str, str]] = set()
        self.impl_endpoints: Set[Tuple[str, str]] = set()
        self.missing: List[Tuple[str, str]] = []
        self.extra: List[Tuple[str, str]] = []

    def check(self) -> bool:
        """执行一致性检查"""
        self._extract_spec_endpoints()
        self._scan_implementation()
        self._compare()
        return len(self.missing) == 0

    def _extract_spec_endpoints(self):
        """从规范中提取端点"""
        paths = self.spec.get("paths", {})
        for path, methods in paths.items():
            for method in ["get", "post", "put", "patch", "delete"]:
                if method in methods:
                    # 标准化路径参数格式
                    normalized_path = re.sub(r"\{[^}]+\}", ":id", path)
                    self.spec_endpoints.add((method.upper(), normalized_path))

    def _scan_implementation(self):
        """扫描实现代码"""
        patterns = [
            # Express
            (
                r"router\.(get|post|put|patch|delete)\s*\(\s*['\"]([^'\"]+)['\"]",
                "express",
            ),
            # FastAPI
            (
                r"@(?:router|app)\.(get|post|put|patch|delete)\s*\(\s*['\"]([^'\"]+)['\"]",
                "fastapi",
            ),
            # NestJS decorators
            (
                r"@(Get|Post|Put|Patch|Delete)\s*\(\s*['\"]?([^'\")\s]*)['\"]?\s*\)",
                "nestjs",
            ),
        ]

        for root, _, files in os.walk(self.impl_dir):
            for file in files:
                if not file.endswith((".ts", ".js", ".py")):
                    continue

                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()

                for pattern, _ in patterns:
                    for match in re.finditer(pattern, content, re.IGNORECASE):
                        method = match.group(1).upper()
                        path = match.group(2)
                        # 标准化路径参数
                        normalized_path = re.sub(r":\w+", ":id", path)
                        normalized_path = re.sub(r"\{[^}]+\}", ":id", normalized_path)
                        if normalized_path and not normalized_path.startswith("/"):
                            normalized_path = "/" + normalized_path
                        self.impl_endpoints.add((method, normalized_path))

    def _compare(self):
        """比较规范与实现"""
        self.missing = list(self.spec_endpoints - self.impl_endpoints)
        self.extra = list(self.impl_endpoints - self.spec_endpoints)

    def print_report(self):
        """打印一致性报告"""
        print("\n" + "=" * 60)
        print("实现一致性检查报告")
        print("=" * 60)

        print(f"\n规范定义端点: {len(self.spec_endpoints)}")
        print(f"实现发现端点: {len(self.impl_endpoints)}")

        if self.missing:
            print(f"\n❌ 规范中定义但未实现 ({len(self.missing)}):")
            for method, path in sorted(self.missing):
                print(f"   • {method} {path}")

        if self.extra:
            print(f"\n⚠️  已实现但规范中未定义 ({len(self.extra)}):")
            for method, path in sorted(self.extra):
                print(f"   • {method} {path}")

        if not self.missing and not self.extra:
            print("\n✅ 实现与规范完全一致")

        # 匹配的端点
        matched = self.spec_endpoints & self.impl_endpoints
        if matched:
            print(f"\n✅ 已匹配端点 ({len(matched)}):")
            for method, path in sorted(matched):
                print(f"   • {method} {path}")


def main():
    parser = argparse.ArgumentParser(description="API 规范验证器")
    parser.add_argument("--spec", type=str, required=True, help="OpenAPI 规范文件路径")
    parser.add_argument("--impl", type=str, help="实现代码目录（用于一致性检查）")
    args = parser.parse_args()

    # 加载规范
    if not os.path.exists(args.spec):
        print(f"错误: 文件不存在 '{args.spec}'")
        sys.exit(1)

    print(f"加载规范: {args.spec}")
    spec = load_spec(args.spec)

    # 验证规范
    validator = OpenAPIValidator(spec)
    is_valid = validator.validate()
    validator.print_report()

    # 一致性检查
    if args.impl:
        if not os.path.isdir(args.impl):
            print(f"错误: 目录不存在 '{args.impl}'")
            sys.exit(1)

        print(f"\n扫描实现: {args.impl}")
        checker = ImplementationChecker(spec, args.impl)
        is_consistent = checker.check()
        checker.print_report()

        if not is_valid or not is_consistent:
            sys.exit(1)
    else:
        if not is_valid:
            sys.exit(1)

    print("\n" + "=" * 60)
    print("验证完成")
    print("=" * 60)


if __name__ == "__main__":
    main()
