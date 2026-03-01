#!/usr/bin/env python3
import json
import re
from pathlib import Path

SCRIPT = Path(__file__).resolve()
CODEX_ROOT = SCRIPT.parents[3]
SKILLS_ROOT = CODEX_ROOT / ".agents/skills"
ALLOWED_TOP_LEVEL = {"SKILL.md", "scripts", "references", "assets"}

THIRD_PERSON_MARKERS = ["This skill", "该技能", "此技能"]
NEGATIVE_TRIGGER_MARKERS = [
    "[Skip]",
    "does not run",
    "not applicable",
    "inapplicable",
    "Do not use",
    "Never for",
    "负触发",
    "不触发",
    "不适用",
]
PROGRESSIVE_DISCLOSURE_MARKERS = ["Progressive Disclosure", "渐进披露"]
DECISION_TREE_TITLE_MARKERS = ["Decision Tree", "决策树"]
OUTPUT_CONTRACT_INPUT_MARKERS = [
    "Required Inputs",
    "## Inputs",
    "输入",
    "interface SkillInput",
]
OUTPUT_CONTRACT_OUTPUT_MARKERS = [
    "Required Outputs",
    "## Outputs",
    "输出",
    "interface SkillOutput",
    '"outputs"',
    "`outputs`",
    '"artifact"',
    '"output"',
]
SCRIPT_SUCCESS_MARKERS = [
    '"success"',
    "'success'",
    "STATUS: SUCCESS",
    '"status": "ready"',
    'status: "ready"',
]
SCRIPT_FAILURE_MARKERS = ["process.exit(", "STATUS: FAILURE", "throw new Error", "fail("]


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def split_frontmatter(text: str):
    match = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if not match:
        return None, text
    return match.group(1), match.group(2)


def has_any(text: str, markers) -> bool:
    return any(marker in text for marker in markers)


def main():
    failed = []
    passed = 0

    def check(condition: bool, name: str, detail: str):
        nonlocal passed
        if condition:
            passed += 1
        else:
            failed.append({"check": name, "detail": detail})

    skill_dirs = sorted([path for path in SKILLS_ROOT.iterdir() if path.is_dir()])
    check(bool(skill_dirs), "skills_discovered", f"no skills found under {SKILLS_ROOT}")

    for skill_dir in skill_dirs:
        skill = skill_dir.name
        skill_file = skill_dir / "SKILL.md"
        scripts_dir = skill_dir / "scripts"
        refs_dir = skill_dir / "references"
        decision_tree = refs_dir / "decision-tree.md"
        output_contract = refs_dir / "output-contract.md"
        expected_script = scripts_dir / f"run-{skill}.ts"

        top_level_entries = {p.name for p in skill_dir.iterdir()}
        unexpected_entries = sorted(top_level_entries - ALLOWED_TOP_LEVEL)

        check(not unexpected_entries, "top_level_entries", f"{skill} has unexpected entries: {unexpected_entries}")
        check(not (skill_dir / "README.md").exists(), "forbid_readme", f"README.md not allowed: {skill_dir}")
        check(not (skill_dir / "CHANGELOG.md").exists(), "forbid_changelog", f"CHANGELOG.md not allowed: {skill_dir}")

        check(skill_file.exists(), "skill_file_exists", f"missing file: {skill_file}")
        check(scripts_dir.exists(), "scripts_dir_exists", f"missing dir: {scripts_dir}")
        check(refs_dir.exists(), "references_dir_exists", f"missing dir: {refs_dir}")
        check(decision_tree.exists(), "decision_tree_exists", f"missing file: {decision_tree}")
        check(output_contract.exists(), "output_contract_exists", f"missing file: {output_contract}")
        check(expected_script.exists(), "run_script_exists", f"missing file: {expected_script}")

        for subdir_name in ["scripts", "references", "assets"]:
            subdir = skill_dir / subdir_name
            if not subdir.exists() or not subdir.is_dir():
                continue
            nested_dirs = [p for p in subdir.rglob("*") if p.is_dir()]
            check(
                len(nested_dirs) == 0,
                "no_nested_subdirectories",
                f"nested directories are not allowed in {subdir}: {[str(p.relative_to(skill_dir)) for p in nested_dirs]}",
            )

        if not skill_file.exists():
            continue

        skill_text = read_text(skill_file)
        frontmatter, body = split_frontmatter(skill_text)

        check(frontmatter is not None, "frontmatter_exists", f"missing frontmatter: {skill_file}")
        if frontmatter is None:
            continue

        check(f"name: {skill}" in frontmatter, "name_matches_dir", f"name mismatch: {skill_file}")
        check("description:" in frontmatter, "description_exists", f"missing description: {skill_file}")

        check(
            has_any(frontmatter, THIRD_PERSON_MARKERS),
            "description_third_person",
            f"description should use third-person wording: {skill_file}",
        )
        check(
            has_any(frontmatter, NEGATIVE_TRIGGER_MARKERS),
            "description_negative_trigger",
            f"description should include inapplicable/negative triggers: {skill_file}",
        )

        check(
            bool(re.search(r"(?m)^\d+\.\s", body)),
            "numbered_steps",
            f"missing numbered steps in body: {skill_file}",
        )
        check(
            "references/decision-tree.md" in body,
            "decision_tree_reference",
            f"missing decision tree reference in SKILL.md: {skill_file}",
        )
        check(
            "references/output-contract.md" in body,
            "output_contract_reference",
            f"missing output contract reference in SKILL.md: {skill_file}",
        )

        has_progressive_block = has_any(body, PROGRESSIVE_DISCLOSURE_MARKERS)
        has_progressive_fallback = (
            ("## Decision Tree" in body and "## Output Contract" in body)
            or (
                "## References" in body
                and "references/decision-tree.md" in body
                and "references/output-contract.md" in body
            )
        )
        check(
            has_progressive_block or has_progressive_fallback,
            "progressive_disclosure_section",
            f"missing progressive disclosure cues: {skill_file}",
        )

        if decision_tree.exists():
            tree_text = read_text(decision_tree)
            check(
                has_any(tree_text, DECISION_TREE_TITLE_MARKERS),
                "decision_tree_title",
                f"decision-tree.md must declare decision tree section: {decision_tree}",
            )
            check(
                bool(re.search(r"(?m)^\d+\.\s|->|=>|├──|└──", tree_text)),
                "decision_tree_branching",
                f"decision-tree.md should include branching rules: {decision_tree}",
            )

        if output_contract.exists():
            contract_text = read_text(output_contract)
            check(
                has_any(contract_text, OUTPUT_CONTRACT_INPUT_MARKERS),
                "output_contract_inputs",
                f"missing input contract section: {output_contract}",
            )
            check(
                has_any(contract_text, OUTPUT_CONTRACT_OUTPUT_MARKERS),
                "output_contract_outputs",
                f"missing output contract section: {output_contract}",
            )

        if scripts_dir.exists():
            script_files = [p for p in scripts_dir.iterdir() if p.is_file()]
            check(bool(script_files), "script_files_exist", f"no scripts found: {scripts_dir}")
            for script in script_files:
                check(script.suffix == ".ts", "script_extension", f"script must be .ts: {script}")
                script_text = read_text(script)
                check(
                    has_any(script_text, SCRIPT_FAILURE_MARKERS),
                    "script_failure_signal",
                    f"missing failure signal: {script}",
                )
                check(
                    has_any(script_text, SCRIPT_SUCCESS_MARKERS),
                    "script_success_signal",
                    f"missing success signal: {script}",
                )

    result = {
        "status": "PASS" if not failed else "FAIL",
        "skills_total": len(skill_dirs),
        "checks_total": passed + len(failed),
        "checks_passed": passed,
        "checks_failed": len(failed),
        "failed_checks": failed,
    }

    print(json.dumps(result, ensure_ascii=False, indent=2))

    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
