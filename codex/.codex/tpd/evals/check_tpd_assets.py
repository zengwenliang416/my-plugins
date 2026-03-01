#!/usr/bin/env python3
import json
from pathlib import Path

SCRIPT = Path(__file__).resolve()
TPD_DIR = SCRIPT.parents[1]
REPO_ROOT = TPD_DIR.parents[1]
MANIFEST = TPD_DIR / "manifest.yaml"
CASES = TPD_DIR / "evals/cases.yaml"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def main():
    manifest = load_json(MANIFEST)
    cases = load_json(CASES)

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
            path = REPO_ROOT / rel
            check(path.exists(), "file_exists", f"{group}:{name} -> {rel}")

    # 2) prompt content checks from cases
    prompt_map = entries["prompts"]
    for case in cases:
        entry = case["entry"]
        rel = prompt_map.get(entry)
        if not rel:
            check(False, "case_entry_exists", f"missing prompt entry: {entry}")
            continue
        prompt_path = REPO_ROOT / rel
        if not prompt_path.exists():
            check(False, "case_prompt_exists", f"missing prompt file: {rel}")
            continue
        text = read_text(prompt_path)
        for marker in case.get("must_contain", []):
            check(marker in text, "prompt_marker", f"{entry} missing marker: {marker}")

    # 3) protocol completeness
    thinking_expected = set(manifest["message_contracts"]["thinking"])
    plan_expected = set(manifest["message_contracts"]["plan"])
    dev_expected = set(manifest["message_contracts"]["dev"])

    thinking_text = read_text(REPO_ROOT / entries["prompts"]["tpd-thinking"])
    plan_text = read_text(REPO_ROOT / entries["prompts"]["tpd-plan"])
    dev_text = read_text(REPO_ROOT / entries["prompts"]["tpd-dev"])

    for msg in sorted(thinking_expected):
        check(msg in thinking_text, "thinking_protocol", f"missing in tpd-thinking prompt: {msg}")
    for msg in sorted(plan_expected):
        check(msg in plan_text, "plan_protocol", f"missing in tpd-plan prompt: {msg}")
    for msg in sorted(dev_expected):
        check(msg in dev_text, "dev_protocol", f"missing in tpd-dev prompt: {msg}")

    # 4) retry bound
    check("最多 2 轮" in dev_text or "max 2" in dev_text, "retry_bound", "tpd-dev must enforce max 2 rounds")

    # 5) skill naming consistency
    for skill_name, rel in entries["skills"].items():
        path = REPO_ROOT / rel
        if not path.exists():
            check(False, "skill_name_consistency", f"missing file: {rel}")
            continue
        text = read_text(path)
        check(f"name: {skill_name}" in text, "skill_name_consistency", f"name mismatch in {rel}")

    # 6) official codex config registration
    config_rel = entries["codex_config"]["project_config"]
    config_path = REPO_ROOT / config_rel
    if config_path.exists():
        config_text = read_text(config_path)
        expected_roles = {
            "tpd-context-explorer": "tpd_context_explorer",
            "tpd-codex-core": "tpd_codex_core",
            "tpd-gemini-core": "tpd_gemini_core",
        }
        for agent_name, role_name in expected_roles.items():
            check(
                f"[agents.{role_name}]" in config_text,
                "config_agent_role",
                f"missing role in config.toml: {agent_name} ({role_name})",
            )
    else:
        check(False, "config_exists", f"missing codex config: {config_rel}")

    # 7) agent toml required fields and pinned model profile
    for agent_name, rel in entries["agents"].items():
        path = REPO_ROOT / rel
        if not path.exists():
            check(False, "agent_toml_fields", f"missing file: {rel}")
            continue
        text = read_text(path)
        check("model = " in text, "agent_toml_fields", f"missing model field: {rel}")
        check("model_reasoning_effort = " in text, "agent_toml_fields", f"missing model_reasoning_effort field: {rel}")
        check("sandbox_mode = " in text, "agent_toml_fields", f"missing sandbox_mode field: {rel}")
        check("developer_instructions = " in text, "agent_toml_fields", f"missing developer_instructions field: {rel}")
        check('model = "gpt-5.3-codex"' in text, "agent_model_profile", f"unexpected model in {rel}")
        check('model_reasoning_effort = "xhigh"' in text, "agent_model_profile", f"unexpected model_reasoning_effort in {rel}")

    result = {
        "status": "PASS" if not failed else "FAIL",
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
