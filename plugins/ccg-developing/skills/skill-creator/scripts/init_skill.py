#!/usr/bin/env python3
"""
技能初始化脚本

创建符合 Anthropic Agent Skills 规范的技能目录结构。

用法:
    python init_skill.py <skill-name> [--path <output-dir>]

示例:
    python init_skill.py my-new-skill
    python init_skill.py pdf-processor --path ~/.claude/skills
"""

import argparse
import os
import sys
from pathlib import Path


# SKILL.md 模板
SKILL_TEMPLATE = """---
name: {skill_name}
description: |
  【触发条件】当用户要求 X/Y/Z（含关键词 keyword1/keyword2）时使用。
  【核心产出】输出：A + B + C（具体交付物描述）。
  【不触发】不用于：场景 X（改用 other-skill）。
  【先问什么】若缺少：输入类型、上下文信息，先提问补齐。
---

# {skill_title}

[一句话说明用途]

## 决策入口

先回答关键问题，再进入具体流程：

- 条件 A？→ 流程 A
- 条件 B？→ 流程 B

## 工作流程

1. **步骤 1**：[描述] → 输入/输出
2. **步骤 2**：[描述] → 输入/输出
3. **步骤 3**：[描述] → 输入/输出

## 脚本使用

**先运行 `--help`，不要先读源码**：

```bash
python scripts/example.py --help
```

## 参考文档导航

- 需要 XXX → 读 `references/xxx.md`
"""

# 示例脚本模板
EXAMPLE_SCRIPT_TEMPLATE = '''#!/usr/bin/env python3
"""
示例脚本

用法:
    python example.py --help
    python example.py <input> [options]
"""

import argparse


def main():
    parser = argparse.ArgumentParser(
        description="示例脚本描述",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
    python example.py input.txt
    python example.py input.txt --output result.txt
        """
    )
    parser.add_argument("input", help="输入文件路径")
    parser.add_argument("-o", "--output", help="输出文件路径")
    parser.add_argument("-v", "--verbose", action="store_true", help="详细输出")

    args = parser.parse_args()

    # TODO: 实现具体逻辑
    print(f"输入: {args.input}")
    if args.output:
        print(f"输出: {args.output}")


if __name__ == "__main__":
    main()
'''

# 参考文档模板
REFERENCE_TEMPLATE = """# {title}

## 概述

[简要说明本文档用途]

## 详细内容

[具体内容]

## 示例

[使用示例]
"""


def validate_skill_name(name: str) -> bool:
    """验证技能名称是否符合规范（hyphen-case）"""
    if not name:
        return False
    # 必须是小写字母、数字和连字符
    import re

    return bool(re.match(r"^[a-z][a-z0-9]*(-[a-z0-9]+)*$", name))


def to_title(skill_name: str) -> str:
    """将 hyphen-case 转换为 Title Case"""
    return " ".join(word.capitalize() for word in skill_name.split("-"))


def create_skill(skill_name: str, output_path: Path) -> None:
    """创建技能目录结构"""
    skill_dir = output_path / skill_name

    # 检查目录是否已存在
    if skill_dir.exists():
        print(f"错误: 目录已存在: {skill_dir}", file=sys.stderr)
        sys.exit(1)

    # 创建目录结构
    directories = [
        skill_dir,
        skill_dir / "scripts",
        skill_dir / "references",
        skill_dir / "assets",
    ]

    for dir_path in directories:
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"创建目录: {dir_path}")

    # 创建 SKILL.md
    skill_md_path = skill_dir / "SKILL.md"
    skill_md_content = SKILL_TEMPLATE.format(
        skill_name=skill_name, skill_title=to_title(skill_name)
    )
    skill_md_path.write_text(skill_md_content, encoding="utf-8")
    print(f"创建文件: {skill_md_path}")

    # 创建示例脚本
    example_script_path = skill_dir / "scripts" / "example.py"
    example_script_path.write_text(EXAMPLE_SCRIPT_TEMPLATE, encoding="utf-8")
    example_script_path.chmod(0o755)
    print(f"创建文件: {example_script_path}")

    # 创建示例参考文档
    reference_path = skill_dir / "references" / "example.md"
    reference_content = REFERENCE_TEMPLATE.format(title="参考文档标题")
    reference_path.write_text(reference_content, encoding="utf-8")
    print(f"创建文件: {reference_path}")

    # 创建 .gitkeep 文件（保持 assets 目录可提交）
    gitkeep_path = skill_dir / "assets" / ".gitkeep"
    gitkeep_path.touch()
    print(f"创建文件: {gitkeep_path}")

    print()
    print(f"✅ 技能 '{skill_name}' 创建成功!")
    print()
    print("后续步骤:")
    print(f"  1. 编辑 {skill_md_path} 完善 description 和工作流程")
    print(f"  2. 根据需要添加脚本到 scripts/ 目录")
    print(f"  3. 根据需要添加参考文档到 references/ 目录")
    print(f"  4. 删除不需要的示例文件")
    print(f"  5. 运行 validate_skill.py 验证技能结构")


def main():
    parser = argparse.ArgumentParser(
        description="创建符合 Anthropic Agent Skills 规范的技能目录结构",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
    python init_skill.py my-new-skill
    python init_skill.py pdf-processor --path ~/.claude/skills

技能名称规范:
    - 必须使用 hyphen-case（小写字母和连字符）
    - 示例: code-reviewer, pdf-processor, api-designer
        """,
    )
    parser.add_argument("skill_name", help="技能名称（hyphen-case，如 my-new-skill）")
    parser.add_argument(
        "-p",
        "--path",
        type=Path,
        default=Path.cwd(),
        help="输出目录路径（默认为当前目录）",
    )

    args = parser.parse_args()

    # 验证技能名称
    if not validate_skill_name(args.skill_name):
        print(f"错误: 技能名称 '{args.skill_name}' 不符合规范", file=sys.stderr)
        print("技能名称必须使用 hyphen-case（小写字母、数字和连字符）", file=sys.stderr)
        print("示例: code-reviewer, pdf-processor, api-designer", file=sys.stderr)
        sys.exit(1)

    # 验证输出路径
    output_path = args.path.expanduser().resolve()
    if not output_path.exists():
        print(f"错误: 输出路径不存在: {output_path}", file=sys.stderr)
        sys.exit(1)

    # 创建技能
    create_skill(args.skill_name, output_path)


if __name__ == "__main__":
    main()
