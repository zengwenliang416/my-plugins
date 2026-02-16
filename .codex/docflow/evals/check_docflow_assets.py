#!/usr/bin/env python3
import json
from pathlib import Path

SCRIPT = Path(__file__).resolve()
DOCFLOW_DIR = SCRIPT.parents[1]
CODEX_HOME = DOCFLOW_DIR.parents[0]
MANIFEST = DOCFLOW_DIR / "manifest.yaml"
CASES = DOCFLOW_DIR / "evals/cases.yaml"


def load_json_yaml(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def main():
    manifest = load_json_yaml(MANIFEST)
    cases = load_json_yaml(CASES)

    failed = []
    passed = 0

    def check(cond: bool, name: str, detail: str):
        nonlocal passed
        if cond:
            passed += 1
        else:
            failed.append({"check": name, "detail": detail})

    entries = manifest["entries"]

    # 1) all files exist
    for group, items in entries.items():
        for name, rel in items.items():
            path = CODEX_HOME / rel
            check(path.exists(), "file_exists", f"{group}:{name} -> {rel}")

    # 2) prompt content checks from cases
    prompt_map = entries["prompts"]
    for case in cases:
        entry = case["entry"]
        rel = prompt_map.get(entry)
        if not rel:
            check(False, "case_entry_exists", f"missing prompt entry: {entry}")
            continue
        text = read_text(CODEX_HOME / rel)
        for marker in case.get("must_contain", []):
            check(marker in text, "prompt_marker", f"{entry} missing marker: {marker}")

    # 3) protocol completeness
    init_doc_expected = set(manifest["message_contracts"]["init_doc"])
    with_scout_expected = set(manifest["message_contracts"]["with_scout"])

    init_text = read_text(CODEX_HOME / entries["prompts"]["docflow-init-doc"])
    with_text = read_text(CODEX_HOME / entries["prompts"]["docflow-with-scout"])

    for msg in sorted(init_doc_expected):
        check(msg in init_text, "init_doc_protocol", f"missing in init-doc prompt: {msg}")
    for msg in sorted(with_scout_expected):
        check(msg in with_text, "with_scout_protocol", f"missing in with-scout prompt: {msg}")

    # 4) retry bound
    check("最多 2 轮" in with_text or "max 2" in with_text, "retry_bound", "with-scout must enforce max 2 rounds")

    # 5) naming consistency
    for skill_name, rel in entries["skills"].items():
        text = read_text(CODEX_HOME / rel)
        check(f"name: {skill_name}" in text, "skill_name_consistency", f"name mismatch in {rel}")

    for agent_name, rel in entries["agents"].items():
        text = read_text(CODEX_HOME / rel)
        check(f"name: {agent_name}" in text, "agent_name_consistency", f"name mismatch in {rel}")

    total = passed + len(failed)
    result = {
        "status": "PASS" if not failed else "FAIL",
        "checks_total": total,
        "checks_passed": passed,
        "checks_failed": len(failed),
        "failed_checks": failed,
    }

    print(json.dumps(result, ensure_ascii=False, indent=2))

    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
