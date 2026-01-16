#!/usr/bin/env python3
"""
项目结构分析器
用法:
  python analyze-project.py --path ./my-project
  python analyze-project.py --path ./my-project --output report.md
"""

import argparse
import json
import os
import re
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Set


@dataclass
class ProjectInfo:
    """项目信息"""

    name: str
    path: str
    project_type: str = "unknown"
    tech_stack: List[str] = field(default_factory=list)
    entry_points: List[str] = field(default_factory=list)
    config_files: List[str] = field(default_factory=list)
    directories: Dict[str, str] = field(default_factory=dict)
    dependencies: Dict[str, List[str]] = field(default_factory=dict)
    file_stats: Dict[str, int] = field(default_factory=dict)


# 项目类型检测规则
PROJECT_MARKERS = {
    "node": ["package.json"],
    "python": ["requirements.txt", "pyproject.toml", "setup.py", "Pipfile"],
    "go": ["go.mod"],
    "rust": ["Cargo.toml"],
    "java": ["pom.xml", "build.gradle", "build.gradle.kts"],
    "ruby": ["Gemfile"],
    "php": ["composer.json"],
    "dotnet": ["*.csproj", "*.sln"],
}

# 框架检测规则
FRAMEWORK_MARKERS = {
    # Node.js 框架
    "next.js": ["next.config.js", "next.config.mjs", "next.config.ts"],
    "react": ["src/App.jsx", "src/App.tsx"],
    "vue": ["vue.config.js", "src/App.vue"],
    "nestjs": ["nest-cli.json"],
    "express": ["app.js", "server.js"],
    # Python 框架
    "django": ["manage.py", "settings.py"],
    "flask": ["app.py", "wsgi.py"],
    "fastapi": ["main.py"],
    "pytorch": ["train.py", "model.py"],
    # Go 框架
    "gin": ["main.go"],
}

# 目录职责映射
DIRECTORY_ROLES = {
    "src": "源代码",
    "lib": "库文件",
    "app": "应用代码",
    "pages": "页面/路由",
    "routes": "路由定义",
    "api": "API 接口",
    "components": "UI 组件",
    "views": "视图层",
    "controllers": "控制器",
    "services": "业务逻辑",
    "models": "数据模型",
    "entities": "实体定义",
    "repositories": "数据访问层",
    "utils": "工具函数",
    "helpers": "辅助函数",
    "middleware": "中间件",
    "config": "配置文件",
    "configs": "配置文件",
    "tests": "测试代码",
    "test": "测试代码",
    "__tests__": "测试代码",
    "spec": "测试规范",
    "docs": "文档",
    "public": "静态资源",
    "static": "静态资源",
    "assets": "资源文件",
    "scripts": "脚本文件",
    "data": "数据文件",
    "migrations": "数据库迁移",
    "seeds": "种子数据",
    "fixtures": "测试数据",
}

# 忽略的目录
IGNORED_DIRS = {
    "node_modules",
    ".git",
    "__pycache__",
    ".venv",
    "venv",
    "env",
    ".env",
    "dist",
    "build",
    ".next",
    ".nuxt",
    "target",
    "vendor",
    ".idea",
    ".vscode",
    "coverage",
    ".pytest_cache",
    ".mypy_cache",
}


def detect_project_type(path: Path) -> tuple[str, List[str]]:
    """检测项目类型和技术栈"""
    tech_stack = []

    for project_type, markers in PROJECT_MARKERS.items():
        for marker in markers:
            if "*" in marker:
                pattern = marker.replace("*", "")
                if any(
                    f.endswith(pattern)
                    for f in os.listdir(path)
                    if os.path.isfile(path / f)
                ):
                    tech_stack.append(project_type)
                    break
            elif (path / marker).exists():
                tech_stack.append(project_type)
                break

    # 检测框架
    for framework, markers in FRAMEWORK_MARKERS.items():
        for marker in markers:
            if (path / marker).exists():
                tech_stack.append(framework)
                break

    primary_type = tech_stack[0] if tech_stack else "unknown"
    return primary_type, tech_stack


def find_entry_points(path: Path, project_type: str) -> List[str]:
    """查找入口文件"""
    entry_points = []

    # 通用入口文件
    common_entries = [
        "main.py",
        "main.ts",
        "main.js",
        "main.go",
        "index.ts",
        "index.js",
        "app.py",
        "app.ts",
        "app.js",
        "server.py",
        "server.ts",
        "server.js",
        "__main__.py",
        "manage.py",
        "wsgi.py",
        "asgi.py",
    ]

    for entry in common_entries:
        if (path / entry).exists():
            entry_points.append(entry)
        elif (path / "src" / entry).exists():
            entry_points.append(f"src/{entry}")

    return entry_points


def find_config_files(path: Path) -> List[str]:
    """查找配置文件"""
    config_patterns = [
        "*.config.js",
        "*.config.ts",
        "*.config.mjs",
        ".env*",
        "*.yaml",
        "*.yml",
        "*.json",
        "*.toml",
        "tsconfig*.json",
        "webpack*.js",
        "vite.config.*",
        "jest.config.*",
        "pytest.ini",
        "setup.cfg",
        "Makefile",
        "Dockerfile*",
        "docker-compose*.yml",
    ]

    config_files = []

    for item in path.iterdir():
        if item.is_file():
            name = item.name
            # 检查是否匹配配置模式
            if name.startswith(".") and not name.startswith(".git"):
                config_files.append(name)
            elif name.endswith((".yaml", ".yml", ".toml", ".ini", ".cfg")):
                config_files.append(name)
            elif "config" in name.lower():
                config_files.append(name)
            elif name in [
                "package.json",
                "tsconfig.json",
                "Makefile",
                "Dockerfile",
                "docker-compose.yml",
            ]:
                config_files.append(name)

    return sorted(config_files)


def analyze_directory_structure(path: Path) -> Dict[str, str]:
    """分析目录结构"""
    directories = {}

    for item in path.iterdir():
        if (
            item.is_dir()
            and item.name not in IGNORED_DIRS
            and not item.name.startswith(".")
        ):
            role = DIRECTORY_ROLES.get(item.name, "")
            directories[item.name] = role

    return directories


def count_files(path: Path) -> Dict[str, int]:
    """统计文件数量"""
    stats = defaultdict(int)

    for root, dirs, files in os.walk(path):
        # 跳过忽略的目录
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS and not d.startswith(".")]

        for f in files:
            ext = Path(f).suffix.lower()
            if ext:
                stats[ext] += 1

    return dict(sorted(stats.items(), key=lambda x: x[1], reverse=True)[:15])


def parse_dependencies(path: Path, project_type: str) -> Dict[str, List[str]]:
    """解析依赖"""
    deps = {"production": [], "development": []}

    # Node.js
    if (path / "package.json").exists():
        try:
            with open(path / "package.json", "r", encoding="utf-8") as f:
                pkg = json.load(f)
                deps["production"] = list(pkg.get("dependencies", {}).keys())[:20]
                deps["development"] = list(pkg.get("devDependencies", {}).keys())[:10]
        except Exception:
            pass

    # Python
    if (path / "requirements.txt").exists():
        try:
            with open(path / "requirements.txt", "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        pkg = re.split(r"[=<>!~\[]", line)[0].strip()
                        if pkg:
                            deps["production"].append(pkg)
        except Exception:
            pass

    # Python pyproject.toml
    if (path / "pyproject.toml").exists():
        try:
            with open(path / "pyproject.toml", "r", encoding="utf-8") as f:
                content = f.read()
                # 简单解析 dependencies
                in_deps = False
                for line in content.split("\n"):
                    if "dependencies" in line and "=" in line:
                        in_deps = True
                        continue
                    if in_deps:
                        if line.startswith("["):
                            in_deps = False
                        elif line.strip().startswith('"'):
                            pkg = (
                                line.strip()
                                .strip('",')
                                .split("[")[0]
                                .split(">=")[0]
                                .split("==")[0]
                            )
                            if pkg:
                                deps["production"].append(pkg)
        except Exception:
            pass

    return deps


def analyze_project(path: str) -> ProjectInfo:
    """分析项目"""
    project_path = Path(path).resolve()

    if not project_path.exists():
        raise ValueError(f"路径不存在: {path}")

    project_type, tech_stack = detect_project_type(project_path)

    info = ProjectInfo(
        name=project_path.name,
        path=str(project_path),
        project_type=project_type,
        tech_stack=tech_stack,
        entry_points=find_entry_points(project_path, project_type),
        config_files=find_config_files(project_path),
        directories=analyze_directory_structure(project_path),
        dependencies=parse_dependencies(project_path, project_type),
        file_stats=count_files(project_path),
    )

    return info


def generate_report(info: ProjectInfo) -> str:
    """生成分析报告"""
    lines = []
    lines.append(f"# 项目分析报告: {info.name}\n")

    # 基本信息
    lines.append("## 基本信息\n")
    lines.append(f"- **项目路径**: `{info.path}`")
    lines.append(f"- **项目类型**: {info.project_type}")
    lines.append(
        f"- **技术栈**: {', '.join(info.tech_stack) if info.tech_stack else '未识别'}"
    )
    lines.append("")

    # 入口点
    if info.entry_points:
        lines.append("## 入口文件\n")
        for entry in info.entry_points:
            lines.append(f"- `{entry}`")
        lines.append("")

    # 配置文件
    if info.config_files:
        lines.append("## 配置文件\n")
        for config in info.config_files[:15]:
            lines.append(f"- `{config}`")
        lines.append("")

    # 目录结构
    if info.directories:
        lines.append("## 目录结构\n")
        lines.append("| 目录 | 职责 |")
        lines.append("|------|------|")
        for dir_name, role in sorted(info.directories.items()):
            lines.append(f"| `{dir_name}/` | {role or '待分析'} |")
        lines.append("")

    # 依赖
    if info.dependencies.get("production"):
        lines.append("## 主要依赖\n")
        lines.append("### 生产依赖\n")
        for dep in info.dependencies["production"][:15]:
            lines.append(f"- {dep}")
        lines.append("")

    if info.dependencies.get("development"):
        lines.append("### 开发依赖\n")
        for dep in info.dependencies["development"][:10]:
            lines.append(f"- {dep}")
        lines.append("")

    # 文件统计
    if info.file_stats:
        lines.append("## 文件统计\n")
        lines.append("| 扩展名 | 数量 |")
        lines.append("|--------|------|")
        for ext, count in list(info.file_stats.items())[:10]:
            lines.append(f"| `{ext}` | {count} |")
        lines.append("")

    # 建议阅读顺序
    lines.append("## 建议阅读顺序\n")
    lines.append("1. 阅读 README.md 了解项目目的")
    if info.config_files:
        lines.append(f"2. 查看配置文件了解项目设置")
    if info.entry_points:
        lines.append(f"3. 从入口文件 `{info.entry_points[0]}` 开始追踪")
    if "src" in info.directories:
        lines.append("4. 深入 `src/` 目录了解核心实现")
    lines.append("")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="项目结构分析器")
    parser.add_argument("--path", type=str, required=True, help="项目路径")
    parser.add_argument("--output", type=str, help="输出文件路径")
    parser.add_argument("--json", action="store_true", help="输出 JSON 格式")
    args = parser.parse_args()

    try:
        info = analyze_project(args.path)

        if args.json:
            import dataclasses

            output = json.dumps(dataclasses.asdict(info), indent=2, ensure_ascii=False)
        else:
            output = generate_report(info)

        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(output)
            print(f"✅ 报告已保存: {args.output}")
        else:
            print(output)

    except Exception as e:
        print(f"❌ 错误: {e}")
        exit(1)


if __name__ == "__main__":
    main()
