#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_ROOT="$SCRIPT_DIR"
SCOPE=""
PROJECT_ROOT=""
MODE="merge"
BACKUP=true
VERIFY=true
VERIFY_SKILL_ALL=false
DRY_RUN=false
YES=false
BACKUP_DIR=""

print_usage() {
  cat <<'EOF'
安装 codex 预览包（.codex + .agents）到用户级或项目级。

Usage:
  ./install-codex-bundle.sh --scope <user|project> [options]

Options:
  --scope <user|project>   安装范围（必填）
  --project-root <path>    项目级安装目标根目录（scope=project 时可选，默认当前目录）
  --source <path>          预览包根目录（默认脚本所在目录）
  --mode <merge|replace>   合并或替换（默认 merge）
  --backup-dir <path>      备份目录（默认 ~/.backup/codex-bundle-installer/<timestamp>）
  --no-backup              跳过备份
  --no-verify              跳过安装后校验
  --verify-skill-all       额外执行全量 skills best-practice 校验
  --dry-run                预演，不写入
  --yes                    非交互确认（用于 replace 模式）
  -h, --help               显示帮助

Examples:
  ./install-codex-bundle.sh --scope user
  ./install-codex-bundle.sh --scope project --project-root /path/to/repo
  ./install-codex-bundle.sh --scope user --mode replace --yes
EOF
}

log() {
  printf '[install-codex] %s\n' "$*"
}

warn() {
  printf '[install-codex][WARN] %s\n' "$*" >&2
}

fail() {
  printf '[install-codex][ERROR] %s\n' "$*" >&2
  exit 1
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --scope)
        SCOPE="${2:-}"
        shift 2
        ;;
      --project-root)
        PROJECT_ROOT="${2:-}"
        shift 2
        ;;
      --source)
        SOURCE_ROOT="${2:-}"
        shift 2
        ;;
      --mode)
        MODE="${2:-}"
        shift 2
        ;;
      --backup-dir)
        BACKUP_DIR="${2:-}"
        shift 2
        ;;
      --no-backup)
        BACKUP=false
        shift
        ;;
      --no-verify)
        VERIFY=false
        shift
        ;;
      --verify-skill-all)
        VERIFY_SKILL_ALL=true
        shift
        ;;
      --dry-run)
        DRY_RUN=true
        shift
        ;;
      --yes)
        YES=true
        shift
        ;;
      -h|--help)
        print_usage
        exit 0
        ;;
      *)
        fail "未知参数: $1"
        ;;
    esac
  done
}

resolve_paths() {
  [[ "$SCOPE" == "user" || "$SCOPE" == "project" ]] || fail "--scope 必须是 user 或 project"
  [[ "$MODE" == "merge" || "$MODE" == "replace" ]] || fail "--mode 必须是 merge 或 replace"

  SOURCE_ROOT="$(cd "$SOURCE_ROOT" && pwd)"
  SOURCE_CODEX="$SOURCE_ROOT/.codex"
  SOURCE_AGENTS="$SOURCE_ROOT/.agents"

  [[ -d "$SOURCE_CODEX" ]] || fail "源目录不存在: $SOURCE_CODEX"
  [[ -d "$SOURCE_AGENTS" ]] || fail "源目录不存在: $SOURCE_AGENTS"

  if [[ "$SCOPE" == "user" ]]; then
    TARGET_ROOT="$HOME"
  else
    if [[ -n "$PROJECT_ROOT" ]]; then
      TARGET_ROOT="$(cd "$PROJECT_ROOT" && pwd)"
    else
      TARGET_ROOT="$(pwd)"
    fi
  fi

  TARGET_CODEX="$TARGET_ROOT/.codex"
  TARGET_AGENTS="$TARGET_ROOT/.agents"
  SOURCE_CONFIG="$SOURCE_CODEX/config.toml"
  TARGET_CONFIG="$TARGET_CODEX/config.toml"

  if [[ -z "$BACKUP_DIR" ]]; then
    ts="$(date +%Y%m%d-%H%M%S)"
    BACKUP_DIR="$HOME/.backup/codex-bundle-installer/$ts-$SCOPE"
  fi
}

confirm_replace_if_needed() {
  if [[ "$MODE" != "replace" ]]; then
    return
  fi

  if [[ "$YES" == "true" ]]; then
    return
  fi

  echo "⚠️ 将以 replace 模式同步，目标中不存在于源目录的文件会被删除。"
  echo "   目标 .codex: $TARGET_CODEX"
  echo "   目标 .agents: $TARGET_AGENTS"
  read -r -p "输入 CONFIRM 继续: " answer
  [[ "$answer" == "CONFIRM" ]] || fail "用户取消安装"
}

backup_targets() {
  if [[ "$BACKUP" != "true" ]]; then
    log "已跳过备份 (--no-backup)"
    return
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    log "dry-run 模式：跳过实际备份"
    return
  fi

  mkdir -p "$BACKUP_DIR"

  if [[ -d "$TARGET_CODEX" ]]; then
    cp -a "$TARGET_CODEX" "$BACKUP_DIR/.codex"
    log "已备份: $TARGET_CODEX -> $BACKUP_DIR/.codex"
  fi

  if [[ -d "$TARGET_AGENTS" ]]; then
    cp -a "$TARGET_AGENTS" "$BACKUP_DIR/.agents"
    log "已备份: $TARGET_AGENTS -> $BACKUP_DIR/.agents"
  fi
}

sync_one() {
  local src="$1"
  local dst="$2"
  local exclude_config="${3:-false}"

  local flags=(
    -a
    --exclude "__pycache__/"
    --exclude "*.pyc"
    --exclude ".DS_Store"
  )

  if [[ "$exclude_config" == "true" ]]; then
    flags+=( --exclude "config.toml" )
  fi

  if [[ "$MODE" == "replace" ]]; then
    flags+=( --delete )
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    flags+=( --dry-run --itemize-changes )
  fi

  if [[ "$DRY_RUN" != "true" ]]; then
    mkdir -p "$dst"
  fi

  rsync "${flags[@]}" "$src/" "$dst/"
}

merge_config_append() {
  if [[ ! -f "$SOURCE_CONFIG" ]]; then
    warn "源配置不存在，跳过 config 追加合并: $SOURCE_CONFIG"
    return
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    log "dry-run 模式：跳过 config 追加合并"
    return
  fi

  mkdir -p "$(dirname "$TARGET_CONFIG")"

  SOURCE_CONFIG="$SOURCE_CONFIG" \
  TARGET_CONFIG="$TARGET_CONFIG" \
  TARGET_ROOT="$TARGET_ROOT" \
  python3 - <<'PY'
import datetime
import json
import os
import re
from pathlib import Path

source_config = Path(os.environ["SOURCE_CONFIG"])
target_config = Path(os.environ["TARGET_CONFIG"])
target_root = Path(os.environ["TARGET_ROOT"])
config_dir = target_root / ".codex"

source_text = source_config.read_text(encoding="utf-8")
if target_config.exists():
    target_text = target_config.read_text(encoding="utf-8")
else:
    target_text = ""


def to_toml_str(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def canonical_skill_path(raw: str) -> str:
    p = Path(raw)
    if p.is_absolute():
        resolved = p
    else:
        resolved = (config_dir / p).resolve()

    if resolved.name.lower() != "skill.md":
        resolved = resolved / "SKILL.md"

    return str(resolved)


append_blocks = []

# append [agents] block only if target has no [agents]
agents_block = re.search(r"(?ms)^\[agents\]\n(.*?)(?=^\[|\Z)", source_text)
if agents_block and "[agents]" not in target_text:
    body = agents_block.group(1).rstrip()
    append_blocks.append("[agents]\n" + body + "\n")

# append missing [agents.<role>] blocks
for m in re.finditer(r"(?ms)^\[agents\.([^\]]+)\]\n(.*?)(?=^\[|\Z)", source_text):
    role = m.group(1)
    body = m.group(2).rstrip()
    header = "[agents." + role + "]"
    if header in target_text:
        continue
    append_blocks.append(header + "\n" + body + "\n")

# append [skills] block only if target has no [skills]
skills_block = re.search(r"(?ms)^\[skills\]\n(.*?)(?=^\[|\Z)", source_text)
if skills_block and "[skills]" not in target_text:
    body = skills_block.group(1).rstrip()
    append_blocks.append("[skills]\n" + body + "\n")

# collect existing paths from target and normalize to absolute SKILL.md
existing_skill_paths = set()
for raw_path in re.findall(r'(?m)^path\s*=\s*"(.*?)"\s*$', target_text):
    existing_skill_paths.add(canonical_skill_path(raw_path))

# append missing [[skills.config]] entries from source
for m in re.finditer(r"(?ms)^\[\[skills\.config\]\]\n(.*?)(?=^\[\[skills\.config\]\]|^\[|\Z)", source_text):
    body = m.group(1)
    path_match = re.search(r'(?m)^path\s*=\s*"(.*?)"\s*$', body)
    if not path_match:
        continue

    raw_path = path_match.group(1)
    canon = canonical_skill_path(raw_path)
    if canon in existing_skill_paths:
        continue

    enabled_match = re.search(r"(?m)^enabled\s*=\s*(true|false)\s*$", body, flags=re.IGNORECASE)
    enabled = enabled_match.group(1).lower() if enabled_match else "true"

    block = (
        "[[skills.config]]\n"
        "path = " + to_toml_str(canon) + "\n"
        "enabled = " + enabled + "\n"
    )
    append_blocks.append(block)
    existing_skill_paths.add(canon)

if append_blocks:
    with target_config.open("a", encoding="utf-8") as f:
        f.write("\n\n# ---- CCG Workflows Codex Bundle (appended, non-destructive) ----\n")
        f.write(f"# appended_at = {to_toml_str(datetime.datetime.now().isoformat())}\n\n")
        for block in append_blocks:
            f.write(block)
            if not block.endswith("\n\n"):
                f.write("\n")

print(json.dumps({"appended_blocks": len(append_blocks)}, ensure_ascii=False))
PY
}

verify_install() {
  if [[ "$VERIFY" != "true" ]]; then
    log "已跳过校验 (--no-verify)"
    return
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    log "dry-run 模式：跳过实际校验"
    return
  fi

  command_exists python3 || fail "未找到 python3，无法执行校验"

  local tpd_eval="$TARGET_ROOT/.codex/tpd/evals/check_tpd_assets.py"
  local docflow_eval="$TARGET_ROOT/.codex/docflow/evals/check_docflow_assets.py"
  local skill_eval="$TARGET_ROOT/.codex/skills/evals/check_skill_best_practices.py"

  [[ -f "$tpd_eval" ]] || fail "缺少校验脚本: $tpd_eval"
  [[ -f "$docflow_eval" ]] || fail "缺少校验脚本: $docflow_eval"

  (cd "$TARGET_ROOT" && python3 .codex/tpd/evals/check_tpd_assets.py)
  (cd "$TARGET_ROOT" && python3 .codex/docflow/evals/check_docflow_assets.py)

  if [[ "$VERIFY_SKILL_ALL" == "true" ]]; then
    if [[ -f "$skill_eval" ]]; then
      (cd "$TARGET_ROOT" && python3 .codex/skills/evals/check_skill_best_practices.py)
    else
      warn "未找到全量 skills 校验脚本，跳过: $skill_eval"
    fi
  fi
}

main() {
  parse_args "$@"

  command_exists rsync || fail "未找到 rsync，请先安装 rsync"

  resolve_paths
  confirm_replace_if_needed

  log "源目录: $SOURCE_ROOT"
  log "安装范围: $SCOPE"
  log "目标根目录: $TARGET_ROOT"
  log "同步模式: $MODE"
  log "dry-run: $DRY_RUN"

  backup_targets

  # .codex 用非破坏同步，config.toml 单独做追加合并
  sync_one "$SOURCE_CODEX" "$TARGET_CODEX" "true"
  sync_one "$SOURCE_AGENTS" "$TARGET_AGENTS" "false"

  merge_config_append

  verify_install

  if [[ "$DRY_RUN" == "true" ]]; then
    log "dry-run 完成（未写入）"
  else
    log "安装完成"
    if [[ "$BACKUP" == "true" ]]; then
      log "备份目录: $BACKUP_DIR"
    fi
  fi
}

main "$@"
