#!/usr/bin/env python3
"""
依赖关系图生成器
用法:
  python dependency-graph.py --path ./src --lang python
  python dependency-graph.py --path ./src --lang typescript --output deps.md
"""

import argparse
import os
import re
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Set


@dataclass
class ModuleInfo:
    """模块信息"""

    path: str
    name: str
    imports: List[str] = field(default_factory=list)
    exports: List[str] = field(default_factory=list)


class PythonImportAnalyzer:
    """Python 导入分析器"""

    IMPORT_PATTERN = re.compile(r"^(?:from\s+([\w.]+)\s+)?import\s+(.+)$", re.MULTILINE)
    RELATIVE_IMPORT = re.compile(r"^\.+")

    def analyze(self, content: str, file_path: str) -> ModuleInfo:
        module_name = Path(file_path).stem
        imports = []

        for match in self.IMPORT_PATTERN.finditer(content):
            from_module = match.group(1)
            import_names = match.group(2)

            if from_module:
                # from x import y
                if self.RELATIVE_IMPORT.match(from_module):
                    # 相对导入
                    imports.append(from_module)
                else:
                    imports.append(from_module)
            else:
                # import x, y, z
                for name in import_names.split(","):
                    name = name.strip().split(" as ")[0].strip()
                    if name:
                        imports.append(name.split(".")[0])

        # 提取导出（__all__ 或顶级定义）
        exports = []
        all_match = re.search(r"__all__\s*=\s*\[([^\]]+)\]", content)
        if all_match:
            exports = [s.strip().strip("'\"") for s in all_match.group(1).split(",")]

        return ModuleInfo(
            path=file_path, name=module_name, imports=imports, exports=exports
        )


class TypeScriptImportAnalyzer:
    """TypeScript/JavaScript 导入分析器"""

    IMPORT_PATTERN = re.compile(
        r"import\s+(?:(?:[\w*{}\s,]+)\s+from\s+)?['\"]([^'\"]+)['\"]", re.MULTILINE
    )
    EXPORT_PATTERN = re.compile(
        r"export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type|enum)\s+(\w+)"
    )
    REQUIRE_PATTERN = re.compile(r"require\s*\(\s*['\"]([^'\"]+)['\"]\s*\)")

    def analyze(self, content: str, file_path: str) -> ModuleInfo:
        module_name = Path(file_path).stem
        imports = []

        # ES6 imports
        for match in self.IMPORT_PATTERN.finditer(content):
            imports.append(match.group(1))

        # CommonJS requires
        for match in self.REQUIRE_PATTERN.finditer(content):
            imports.append(match.group(1))

        # 提取导出
        exports = [match.group(1) for match in self.EXPORT_PATTERN.finditer(content)]

        return ModuleInfo(
            path=file_path, name=module_name, imports=imports, exports=exports
        )


class GoImportAnalyzer:
    """Go 导入分析器"""

    IMPORT_SINGLE = re.compile(r'^import\s+"([^"]+)"', re.MULTILINE)
    IMPORT_BLOCK = re.compile(r"import\s*\(\s*([^)]+)\s*\)", re.DOTALL)

    def analyze(self, content: str, file_path: str) -> ModuleInfo:
        module_name = Path(file_path).stem
        imports = []

        # 单行导入
        for match in self.IMPORT_SINGLE.finditer(content):
            imports.append(match.group(1))

        # 块导入
        for match in self.IMPORT_BLOCK.finditer(content):
            block = match.group(1)
            for line in block.split("\n"):
                line = line.strip()
                if line.startswith('"'):
                    pkg = line.strip('"').split(" ")[0].strip('"')
                    imports.append(pkg)
                elif line:
                    parts = line.split('"')
                    if len(parts) >= 2:
                        imports.append(parts[1])

        return ModuleInfo(path=file_path, name=module_name, imports=imports)


def analyze_directory(
    path: str, lang: str, extensions: List[str]
) -> Dict[str, ModuleInfo]:
    """分析目录中的所有文件"""
    modules = {}

    if lang == "python":
        analyzer = PythonImportAnalyzer()
    elif lang in ("typescript", "javascript"):
        analyzer = TypeScriptImportAnalyzer()
    elif lang == "go":
        analyzer = GoImportAnalyzer()
    else:
        raise ValueError(f"不支持的语言: {lang}")

    ignored_dirs = {
        "node_modules",
        "__pycache__",
        ".git",
        "venv",
        ".venv",
        "dist",
        "build",
        "vendor",
    }

    for root, dirs, files in os.walk(path):
        dirs[:] = [d for d in dirs if d not in ignored_dirs]

        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, path)

                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                    module = analyzer.analyze(content, rel_path)
                    modules[rel_path] = module
                except Exception as e:
                    print(f"警告: 无法分析 {file_path}: {e}")

    return modules


def build_dependency_graph(
    modules: Dict[str, ModuleInfo], base_path: str
) -> Dict[str, Set[str]]:
    """构建依赖图"""
    graph = defaultdict(set)
    module_names = {Path(p).stem: p for p in modules.keys()}

    for path, module in modules.items():
        for imp in module.imports:
            # 处理相对导入
            if imp.startswith("."):
                # 计算绝对路径
                current_dir = Path(path).parent
                dots = len(imp) - len(imp.lstrip("."))
                for _ in range(dots - 1):
                    current_dir = current_dir.parent
                imp_name = imp.lstrip(".")
                if imp_name:
                    target = str(current_dir / imp_name)
                else:
                    target = str(current_dir)

                # 查找匹配的模块
                for mod_path in modules.keys():
                    if mod_path.startswith(target) or Path(mod_path).stem == imp_name:
                        graph[path].add(mod_path)
                        break
            else:
                # 绝对导入 - 查找本地模块
                imp_base = imp.split(".")[0]
                if imp_base in module_names:
                    graph[path].add(module_names[imp_base])

    return graph


def find_circular_dependencies(graph: Dict[str, Set[str]]) -> List[List[str]]:
    """查找循环依赖"""
    cycles = []
    visited = set()
    path = []
    path_set = set()

    def dfs(node: str):
        if node in path_set:
            # 找到循环
            cycle_start = path.index(node)
            cycle = path[cycle_start:] + [node]
            cycles.append(cycle)
            return

        if node in visited:
            return

        visited.add(node)
        path.append(node)
        path_set.add(node)

        for neighbor in graph.get(node, []):
            dfs(neighbor)

        path.pop()
        path_set.remove(node)

    for node in graph:
        dfs(node)

    return cycles


def generate_mermaid_graph(graph: Dict[str, Set[str]], max_nodes: int = 50) -> str:
    """生成 Mermaid 图表"""
    lines = ["```mermaid", "graph TD"]

    # 限制节点数量
    nodes = set()
    edges = []

    for source, targets in graph.items():
        for target in targets:
            if len(nodes) < max_nodes:
                nodes.add(source)
                nodes.add(target)
                edges.append((source, target))

    # 生成节点ID映射
    node_ids = {node: f"N{i}" for i, node in enumerate(nodes)}

    # 添加节点定义
    for node, node_id in node_ids.items():
        short_name = Path(node).stem
        lines.append(f"    {node_id}[{short_name}]")

    # 添加边
    for source, target in edges:
        if source in node_ids and target in node_ids:
            lines.append(f"    {node_ids[source]} --> {node_ids[target]}")

    lines.append("```")
    return "\n".join(lines)


def generate_report(
    modules: Dict[str, ModuleInfo],
    graph: Dict[str, Set[str]],
    cycles: List[List[str]],
) -> str:
    """生成分析报告"""
    lines = []
    lines.append("# 依赖关系分析报告\n")

    # 统计信息
    lines.append("## 统计信息\n")
    lines.append(f"- **模块总数**: {len(modules)}")
    lines.append(f"- **依赖关系数**: {sum(len(deps) for deps in graph.values())}")
    lines.append(f"- **循环依赖数**: {len(cycles)}")
    lines.append("")

    # 循环依赖警告
    if cycles:
        lines.append("## ⚠️ 循环依赖\n")
        for i, cycle in enumerate(cycles[:5], 1):
            lines.append(f"### 循环 {i}")
            lines.append("```")
            lines.append(" → ".join(Path(p).stem for p in cycle))
            lines.append("```")
            lines.append("")

    # 依赖图
    lines.append("## 依赖关系图\n")
    lines.append(generate_mermaid_graph(graph))
    lines.append("")

    # 模块列表
    lines.append("## 模块列表\n")
    lines.append("| 模块 | 导入数 | 被依赖数 |")
    lines.append("|------|--------|----------|")

    # 计算被依赖次数
    dependents = defaultdict(int)
    for source, targets in graph.items():
        for target in targets:
            dependents[target] += 1

    for path, module in sorted(modules.items()):
        import_count = len(graph.get(path, []))
        dependent_count = dependents.get(path, 0)
        lines.append(f"| `{module.name}` | {import_count} | {dependent_count} |")

    lines.append("")

    # 高度耦合模块
    highly_coupled = [
        (path, dependents[path]) for path in modules if dependents[path] >= 5
    ]
    if highly_coupled:
        lines.append("## 高度耦合模块 (被依赖>=5次)\n")
        for path, count in sorted(highly_coupled, key=lambda x: -x[1])[:10]:
            lines.append(f"- `{Path(path).stem}` - 被 {count} 个模块依赖")
        lines.append("")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="依赖关系图生成器")
    parser.add_argument("--path", type=str, required=True, help="源代码目录")
    parser.add_argument(
        "--lang",
        type=str,
        choices=["python", "typescript", "javascript", "go"],
        required=True,
        help="编程语言",
    )
    parser.add_argument("--output", type=str, help="输出文件路径")
    args = parser.parse_args()

    # 确定文件扩展名
    extensions_map = {
        "python": [".py"],
        "typescript": [".ts", ".tsx"],
        "javascript": [".js", ".jsx"],
        "go": [".go"],
    }
    extensions = extensions_map[args.lang]

    print(f"分析目录: {args.path}")
    print(f"语言: {args.lang}")
    print("")

    modules = analyze_directory(args.path, args.lang, extensions)
    print(f"找到 {len(modules)} 个模块")

    graph = build_dependency_graph(modules, args.path)
    cycles = find_circular_dependencies(graph)

    if cycles:
        print(f"⚠️  发现 {len(cycles)} 个循环依赖")

    report = generate_report(modules, graph, cycles)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(report)
        print(f"\n✅ 报告已保存: {args.output}")
    else:
        print(report)


if __name__ == "__main__":
    main()
