#!/usr/bin/env python3
"""
可测试代码分析器
用法:
  python analyze-testable.py --file ./src/services/UserService.ts --lang typescript
  python analyze-testable.py --dir ./src/services --output ./test-plan.md
"""

import argparse
import os
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional


@dataclass
class FunctionInfo:
    """函数信息"""

    name: str
    params: List[str]
    return_type: Optional[str]
    is_async: bool
    is_public: bool
    line_number: int
    complexity: int = 1  # 简单复杂度估算


@dataclass
class ClassInfo:
    """类信息"""

    name: str
    methods: List[FunctionInfo] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)
    line_number: int = 0


@dataclass
class ModuleInfo:
    """模块信息"""

    filepath: str
    classes: List[ClassInfo] = field(default_factory=list)
    functions: List[FunctionInfo] = field(default_factory=list)
    imports: List[str] = field(default_factory=list)


class TypeScriptAnalyzer:
    """TypeScript/JavaScript 代码分析器"""

    # 正则模式
    CLASS_PATTERN = re.compile(
        r"(?:export\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?(?:\s+implements\s+[\w,\s]+)?\s*{"
    )
    METHOD_PATTERN = re.compile(
        r"(?:public\s+|private\s+|protected\s+)?"
        r"(?:static\s+)?"
        r"(?:async\s+)?"
        r"(\w+)\s*\("
        r"([^)]*)"
        r"\)\s*(?::\s*([\w<>[\],\s|]+))?"
    )
    FUNCTION_PATTERN = re.compile(
        r"(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\("
        r"([^)]*)"
        r"\)\s*(?::\s*([\w<>[\],\s|]+))?"
    )
    ARROW_EXPORT_PATTERN = re.compile(
        r"export\s+const\s+(\w+)\s*=\s*(?:async\s*)?\("
        r"([^)]*)"
        r"\)\s*(?::\s*([\w<>[\],\s|]+))?\s*=>"
    )
    IMPORT_PATTERN = re.compile(r"import\s+.*?\s+from\s+['\"]([^'\"]+)['\"]")
    CONSTRUCTOR_PATTERN = re.compile(r"constructor\s*\(\s*([^)]*)\s*\)")

    def analyze(self, content: str, filepath: str) -> ModuleInfo:
        """分析 TypeScript 代码"""
        module = ModuleInfo(filepath=filepath)
        lines = content.split("\n")

        # 提取 imports
        for match in self.IMPORT_PATTERN.finditer(content):
            module.imports.append(match.group(1))

        # 分析类
        current_class: Optional[ClassInfo] = None
        brace_depth = 0
        class_start_depth = 0

        for i, line in enumerate(lines, 1):
            # 跟踪大括号深度
            brace_depth += line.count("{") - line.count("}")

            # 检查类定义
            class_match = self.CLASS_PATTERN.search(line)
            if class_match:
                current_class = ClassInfo(name=class_match.group(1), line_number=i)
                class_start_depth = brace_depth

                # 提取构造函数依赖
                self._extract_dependencies(content, current_class)
                module.classes.append(current_class)
                continue

            # 检查类是否结束
            if current_class and brace_depth < class_start_depth:
                current_class = None
                continue

            # 检查方法（在类内）
            if current_class:
                method = self._parse_method(line, i)
                if method:
                    current_class.methods.append(method)
                continue

            # 检查独立函数
            func = self._parse_function(line, i)
            if func:
                module.functions.append(func)

            # 检查箭头函数导出
            arrow_func = self._parse_arrow_function(line, i)
            if arrow_func:
                module.functions.append(arrow_func)

        return module

    def _parse_method(self, line: str, line_num: int) -> Optional[FunctionInfo]:
        """解析方法"""
        match = self.METHOD_PATTERN.search(line)
        if not match:
            return None

        name = match.group(1)
        if name in ("if", "for", "while", "switch", "constructor"):
            return None

        params = [p.strip() for p in match.group(2).split(",") if p.strip()]
        return_type = match.group(3)
        is_async = "async" in line.split(name)[0]
        is_public = "private" not in line and "protected" not in line

        return FunctionInfo(
            name=name,
            params=params,
            return_type=return_type,
            is_async=is_async,
            is_public=is_public,
            line_number=line_num,
        )

    def _parse_function(self, line: str, line_num: int) -> Optional[FunctionInfo]:
        """解析函数"""
        match = self.FUNCTION_PATTERN.search(line)
        if not match:
            return None

        params = [p.strip() for p in match.group(2).split(",") if p.strip()]
        return FunctionInfo(
            name=match.group(1),
            params=params,
            return_type=match.group(3),
            is_async="async" in line,
            is_public="export" in line,
            line_number=line_num,
        )

    def _parse_arrow_function(self, line: str, line_num: int) -> Optional[FunctionInfo]:
        """解析箭头函数导出"""
        match = self.ARROW_EXPORT_PATTERN.search(line)
        if not match:
            return None

        params = [p.strip() for p in match.group(2).split(",") if p.strip()]
        return FunctionInfo(
            name=match.group(1),
            params=params,
            return_type=match.group(3),
            is_async="async" in line,
            is_public=True,
            line_number=line_num,
        )

    def _extract_dependencies(self, content: str, class_info: ClassInfo):
        """从构造函数提取依赖"""
        match = self.CONSTRUCTOR_PATTERN.search(content)
        if match:
            params = match.group(1)
            # 提取类型注解作为依赖
            type_pattern = re.compile(r"(?:private|public|readonly)\s+\w+\s*:\s*(\w+)")
            for type_match in type_pattern.finditer(params):
                class_info.dependencies.append(type_match.group(1))


class PythonAnalyzer:
    """Python 代码分析器"""

    CLASS_PATTERN = re.compile(r"class\s+(\w+)(?:\([^)]*\))?\s*:")
    FUNCTION_PATTERN = re.compile(
        r"(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*([\w\[\],\s|]+))?"
    )
    IMPORT_PATTERN = re.compile(r"(?:from\s+[\w.]+\s+)?import\s+([^#\n]+)")

    def analyze(self, content: str, filepath: str) -> ModuleInfo:
        """分析 Python 代码"""
        module = ModuleInfo(filepath=filepath)
        lines = content.split("\n")

        # 提取 imports
        for match in self.IMPORT_PATTERN.finditer(content):
            module.imports.append(match.group(1).strip())

        current_class: Optional[ClassInfo] = None
        current_indent = 0

        for i, line in enumerate(lines, 1):
            stripped = line.lstrip()
            indent = len(line) - len(stripped)

            # 检查类定义
            class_match = self.CLASS_PATTERN.match(stripped)
            if class_match:
                current_class = ClassInfo(name=class_match.group(1), line_number=i)
                current_indent = indent
                module.classes.append(current_class)
                continue

            # 检查是否离开类
            if (
                current_class
                and indent <= current_indent
                and stripped
                and not stripped.startswith("#")
            ):
                if not self.FUNCTION_PATTERN.match(stripped):
                    current_class = None

            # 检查函数/方法
            func_match = self.FUNCTION_PATTERN.match(stripped)
            if func_match:
                func = self._parse_function(func_match, i, stripped)
                if current_class and indent > current_indent:
                    current_class.methods.append(func)
                elif not current_class or indent <= current_indent:
                    current_class = None
                    module.functions.append(func)

        return module

    def _parse_function(self, match, line_num: int, line: str) -> FunctionInfo:
        """解析函数"""
        name = match.group(1)
        params_str = match.group(2)
        params = [
            p.strip().split(":")[0].strip()
            for p in params_str.split(",")
            if p.strip() and p.strip() != "self"
        ]
        return_type = match.group(3)

        return FunctionInfo(
            name=name,
            params=params,
            return_type=return_type,
            is_async="async" in line,
            is_public=not name.startswith("_"),
            line_number=line_num,
        )


def analyze_file(filepath: str, lang: Optional[str] = None) -> Optional[ModuleInfo]:
    """分析单个文件"""
    if not os.path.exists(filepath):
        print(f"文件不存在: {filepath}")
        return None

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 自动检测语言
    if not lang:
        if filepath.endswith((".ts", ".tsx", ".js", ".jsx")):
            lang = "typescript"
        elif filepath.endswith(".py"):
            lang = "python"
        else:
            print(f"无法识别文件类型: {filepath}")
            return None

    if lang in ("typescript", "javascript", "ts", "js"):
        analyzer = TypeScriptAnalyzer()
    elif lang in ("python", "py"):
        analyzer = PythonAnalyzer()
    else:
        print(f"不支持的语言: {lang}")
        return None

    return analyzer.analyze(content, filepath)


def generate_test_plan(modules: List[ModuleInfo]) -> str:
    """生成测试计划"""
    output = []
    output.append("# 测试计划\n")

    for module in modules:
        output.append(f"\n## {module.filepath}\n")

        # 类
        for cls in module.classes:
            output.append(f"\n### 类: {cls.name} (行 {cls.line_number})\n")

            if cls.dependencies:
                output.append("\n**依赖 (需要 Mock):**\n")
                for dep in cls.dependencies:
                    output.append(f"- {dep}\n")

            if cls.methods:
                output.append("\n**方法:**\n")
                for method in cls.methods:
                    if method.is_public:
                        async_mark = "async " if method.is_async else ""
                        params = ", ".join(method.params) if method.params else ""
                        ret = f" -> {method.return_type}" if method.return_type else ""
                        output.append(
                            f"- [ ] `{async_mark}{method.name}({params}){ret}`\n"
                        )
                        output.append(f"  - 正常流程测试\n")
                        output.append(f"  - 异常流程测试\n")
                        if method.params:
                            output.append(f"  - 边界值测试\n")

        # 函数
        if module.functions:
            output.append("\n### 独立函数\n")
            for func in module.functions:
                if func.is_public:
                    async_mark = "async " if func.is_async else ""
                    params = ", ".join(func.params) if func.params else ""
                    ret = f" -> {func.return_type}" if func.return_type else ""
                    output.append(f"- [ ] `{async_mark}{func.name}({params}){ret}`\n")

    return "".join(output)


def print_analysis(module: ModuleInfo):
    """打印分析结果"""
    print("=" * 60)
    print(f"文件: {module.filepath}")
    print("=" * 60)

    if module.imports:
        print("\n📦 导入:")
        for imp in module.imports[:10]:
            print(f"  - {imp}")
        if len(module.imports) > 10:
            print(f"  ... 还有 {len(module.imports) - 10} 个")

    for cls in module.classes:
        print(f"\n📦 类: {cls.name} (行 {cls.line_number})")

        if cls.dependencies:
            print("  💉 依赖:")
            for dep in cls.dependencies:
                print(f"    - {dep}")

        public_methods = [m for m in cls.methods if m.is_public]
        private_methods = [m for m in cls.methods if not m.is_public]

        if public_methods:
            print(f"  📢 公开方法 ({len(public_methods)}):")
            for method in public_methods:
                async_mark = "⚡" if method.is_async else ""
                params = ", ".join(method.params[:3])
                if len(method.params) > 3:
                    params += "..."
                print(f"    {async_mark} {method.name}({params})")

        if private_methods:
            print(f"  🔒 私有方法 ({len(private_methods)}):")
            for method in private_methods:
                print(f"    - {method.name}")

    if module.functions:
        print(f"\n📋 独立函数 ({len(module.functions)}):")
        for func in module.functions:
            if func.is_public:
                async_mark = "⚡" if func.is_async else ""
                print(f"  {async_mark} {func.name}")


def main():
    parser = argparse.ArgumentParser(description="可测试代码分析器")
    parser.add_argument("--file", type=str, help="分析单个文件")
    parser.add_argument("--dir", type=str, help="分析目录")
    parser.add_argument("--lang", type=str, help="指定语言 (typescript/python)")
    parser.add_argument("--output", type=str, help="输出测试计划文件")
    args = parser.parse_args()

    modules = []

    if args.file:
        module = analyze_file(args.file, args.lang)
        if module:
            modules.append(module)
            print_analysis(module)

    elif args.dir:
        if not os.path.isdir(args.dir):
            print(f"目录不存在: {args.dir}")
            sys.exit(1)

        for root, _, files in os.walk(args.dir):
            for file in files:
                if file.endswith((".ts", ".tsx", ".js", ".py")) and not file.endswith(
                    (".test.", ".spec.", "_test.")
                ):
                    filepath = os.path.join(root, file)
                    module = analyze_file(filepath)
                    if module:
                        modules.append(module)
                        print_analysis(module)
                        print()

    else:
        parser.print_help()
        sys.exit(1)

    # 生成测试计划
    if args.output and modules:
        plan = generate_test_plan(modules)
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(plan)
        print(f"\n✅ 测试计划已保存: {args.output}")


if __name__ == "__main__":
    main()
