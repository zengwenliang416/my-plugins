#!/usr/bin/env python3
"""
技能验证脚本

验证技能目录结构和内容是否符合 Anthropic Agent Skills 规范。

用法:
    python validate_skill.py <path/to/skill>
    python validate_skill.py ~/.claude/skills/my-skill

检查项:
    - frontmatter 格式正确
    - name 与目录名匹配
    - description 包含触发条件
    - SKILL.md < 500 行
    - 无多余文档（README.md 等）
"""

import argparse
import re
import sys
from pathlib import Path
from typing import NamedTuple


class ValidationResult(NamedTuple):
    """验证结果"""

    passed: bool
    message: str
    level: str  # 'error', 'warning', 'info'


class SkillValidator:
    """技能验证器"""

    def __init__(self, skill_path: Path):
        self.skill_path = skill_path.resolve()
        self.skill_name = skill_path.name
        self.results: list[ValidationResult] = []

    def add_result(self, passed: bool, message: str, level: str = "error"):
        """添加验证结果"""
        self.results.append(ValidationResult(passed, message, level))

    def validate_directory_exists(self) -> bool:
        """验证目录存在"""
        if not self.skill_path.exists():
            self.add_result(False, f"技能目录不存在: {self.skill_path}")
            return False
        if not self.skill_path.is_dir():
            self.add_result(False, f"路径不是目录: {self.skill_path}")
            return False
        self.add_result(True, "技能目录存在")
        return True

    def validate_skill_md_exists(self) -> bool:
        """验证 SKILL.md 存在"""
        skill_md = self.skill_path / "SKILL.md"
        if not skill_md.exists():
            self.add_result(False, "缺少 SKILL.md 文件")
            return False
        self.add_result(True, "SKILL.md 文件存在")
        return True

    def validate_skill_md_size(self) -> bool:
        """验证 SKILL.md 行数 < 500"""
        skill_md = self.skill_path / "SKILL.md"
        if not skill_md.exists():
            return False

        content = skill_md.read_text(encoding="utf-8")
        line_count = len(content.splitlines())

        if line_count >= 500:
            self.add_result(
                False, f"SKILL.md 行数过多: {line_count} 行（限制 < 500 行）", "error"
            )
            return False

        if line_count > 300:
            self.add_result(
                True,
                f"SKILL.md 行数: {line_count} 行（建议精简到 300 行以内）",
                "warning",
            )
        else:
            self.add_result(True, f"SKILL.md 行数: {line_count} 行")
        return True

    def parse_frontmatter(self) -> dict | None:
        """解析 YAML frontmatter"""
        skill_md = self.skill_path / "SKILL.md"
        if not skill_md.exists():
            return None

        content = skill_md.read_text(encoding="utf-8")

        # 检查是否以 --- 开头
        if not content.startswith("---"):
            self.add_result(False, "SKILL.md 缺少 YAML frontmatter（必须以 --- 开头）")
            return None

        # 提取 frontmatter
        match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
        if not match:
            self.add_result(False, "SKILL.md frontmatter 格式错误（缺少结束的 ---）")
            return None

        frontmatter_text = match.group(1)

        # 简单解析 YAML（不引入依赖）
        frontmatter = {}
        current_key = None
        current_value = []

        for line in frontmatter_text.split("\n"):
            # 检查是否是新的键
            key_match = re.match(r"^([a-z][a-z0-9-]*)\s*:\s*(.*)", line)
            if key_match:
                # 保存上一个键的值
                if current_key:
                    frontmatter[current_key] = "\n".join(current_value).strip()

                current_key = key_match.group(1)
                value = key_match.group(2).strip()

                # 处理 | 多行字符串
                if value == "|":
                    current_value = []
                else:
                    current_value = [value] if value else []
            elif current_key and line.startswith("  "):
                # 多行值的续行
                current_value.append(line[2:])  # 去掉前两个空格

        # 保存最后一个键
        if current_key:
            frontmatter[current_key] = "\n".join(current_value).strip()

        self.add_result(True, "frontmatter 格式正确")
        return frontmatter

    def validate_name(self, frontmatter: dict) -> bool:
        """验证 name 字段"""
        if "name" not in frontmatter:
            self.add_result(False, "frontmatter 缺少 name 字段")
            return False

        name = frontmatter["name"]

        # 验证 hyphen-case
        if not re.match(r"^[a-z][a-z0-9]*(-[a-z0-9]+)*$", name):
            self.add_result(False, f"name '{name}' 不符合 hyphen-case 规范")
            return False

        # 验证与目录名匹配
        if name != self.skill_name:
            self.add_result(False, f"name '{name}' 与目录名 '{self.skill_name}' 不匹配")
            return False

        self.add_result(True, f"name '{name}' 格式正确且与目录名匹配")
        return True

    def validate_description(self, frontmatter: dict) -> bool:
        """验证 description 字段"""
        if "description" not in frontmatter:
            self.add_result(False, "frontmatter 缺少 description 字段")
            return False

        desc = frontmatter["description"]

        # 检查是否过短
        if len(desc) < 50:
            self.add_result(
                False,
                f"description 过短（{len(desc)} 字符），建议至少 100 字符",
                "warning",
            )

        # 检查是否包含关键元素（4句式）
        checks = [
            ("触发条件", ["当", "使用", "时", "要求", "需要"]),
            ("核心产出", ["输出", "生成", "创建", "返回", "产出"]),
        ]

        missing_elements = []
        for element_name, keywords in checks:
            if not any(kw in desc for kw in keywords):
                missing_elements.append(element_name)

        if missing_elements:
            self.add_result(
                True,
                f"description 可能缺少: {', '.join(missing_elements)}（建议使用4句式模板）",
                "warning",
            )
        else:
            self.add_result(True, "description 包含触发条件和核心产出")

        return True

    def validate_no_forbidden_files(self) -> bool:
        """验证没有禁止的文件"""
        forbidden_files = [
            "README.md",
            "INSTALLATION_GUIDE.md",
            "CHANGELOG.md",
            "CONTRIBUTING.md",
        ]

        found_forbidden = []
        for filename in forbidden_files:
            if (self.skill_path / filename).exists():
                found_forbidden.append(filename)

        if found_forbidden:
            self.add_result(
                False,
                f"存在禁止的文件: {', '.join(found_forbidden)}（技能不应创建这些文件）",
                "error",
            )
            return False

        self.add_result(True, "没有禁止的文件")
        return True

    def validate_directory_structure(self) -> bool:
        """验证目录结构"""
        recommended_dirs = ["scripts", "references"]
        optional_dirs = ["assets"]

        existing_dirs = [d.name for d in self.skill_path.iterdir() if d.is_dir()]

        # 检查是否有未知目录
        known_dirs = set(recommended_dirs + optional_dirs)
        unknown_dirs = [
            d for d in existing_dirs if d not in known_dirs and not d.startswith(".")
        ]

        if unknown_dirs:
            self.add_result(
                True, f"存在非标准目录: {', '.join(unknown_dirs)}", "warning"
            )

        # 报告目录结构
        self.add_result(
            True,
            f"目录结构: {', '.join(existing_dirs) if existing_dirs else '(无子目录)'}",
        )
        return True

    def validate(self) -> bool:
        """执行所有验证"""
        # 基础检查
        if not self.validate_directory_exists():
            return False

        if not self.validate_skill_md_exists():
            return False

        # SKILL.md 内容检查
        self.validate_skill_md_size()

        frontmatter = self.parse_frontmatter()
        if frontmatter:
            self.validate_name(frontmatter)
            self.validate_description(frontmatter)

        # 结构检查
        self.validate_no_forbidden_files()
        self.validate_directory_structure()

        return all(r.passed or r.level != "error" for r in self.results)

    def print_results(self) -> None:
        """打印验证结果"""
        print(f"\n验证技能: {self.skill_path}\n")
        print("=" * 60)

        errors = []
        warnings = []
        passes = []

        for result in self.results:
            if result.level == "error":
                if result.passed:
                    passes.append(result)
                else:
                    errors.append(result)
            elif result.level == "warning":
                warnings.append(result)
            else:
                passes.append(result)

        # 打印错误
        if errors:
            print("\n❌ 错误:")
            for r in errors:
                print(f"   - {r.message}")

        # 打印警告
        if warnings:
            print("\n⚠️  警告:")
            for r in warnings:
                print(f"   - {r.message}")

        # 打印通过项
        if passes:
            print("\n✅ 通过:")
            for r in passes:
                print(f"   - {r.message}")

        print("\n" + "=" * 60)

        # 总结
        error_count = len(errors)
        warning_count = len(warnings)
        pass_count = len(passes)

        if error_count == 0:
            print(f"\n🎉 验证通过! ({pass_count} 项通过, {warning_count} 项警告)")
        else:
            print(
                f"\n💔 验证失败! ({error_count} 项错误, {warning_count} 项警告, {pass_count} 项通过)"
            )


def main():
    parser = argparse.ArgumentParser(
        description="验证技能目录结构和内容是否符合 Anthropic Agent Skills 规范",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
检查项:
    - frontmatter 格式正确
    - name 与目录名匹配（hyphen-case）
    - description 包含触发条件
    - SKILL.md < 500 行
    - 无多余文档（README.md 等）

示例:
    python validate_skill.py ~/.claude/skills/my-skill
    python validate_skill.py ./skills/code-reviewer
        """,
    )
    parser.add_argument("skill_path", type=Path, help="技能目录路径")

    args = parser.parse_args()

    # 执行验证
    validator = SkillValidator(args.skill_path)
    success = validator.validate()
    validator.print_results()

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
