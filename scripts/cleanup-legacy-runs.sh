#!/bin/bash
# Cleanup helper for historical runtime artifacts under project-local .claude/*/runs
# Default mode is dry-run. Use --execute for one-time cleanup.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CLAUDE_ROOT="${PROJECT_ROOT}/.claude"
EXECUTE=false

usage() {
  cat <<'USAGE'
Usage: ./scripts/cleanup-legacy-runs.sh [--execute]

Options:
  --execute   Remove legacy .claude/*/runs directories (destructive)
  -h, --help  Show this help

Default behavior is dry-run inventory only.
USAGE
}

for arg in "$@"; do
  case "$arg" in
    --execute)
      EXECUTE=true
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      usage >&2
      exit 1
      ;;
  esac
done

collect_targets() {
  if [ ! -d "$CLAUDE_ROOT" ]; then
    return 0
  fi

  find "$CLAUDE_ROOT" -mindepth 2 -maxdepth 2 -type d -name runs | sort
}

collect_stats() {
  local roots=("$@")
  local run_roots_count=0
  local run_dirs_count=0
  local total_kb=0

  for root in "${roots[@]}"; do
    if [ -z "$root" ]; then
      continue
    fi

    run_roots_count=$((run_roots_count + 1))
    local child_count=0
    local root_kb=0

    child_count=$(find "$root" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')
    root_kb=$(du -sk "$root" | awk '{print $1}')

    run_dirs_count=$((run_dirs_count + child_count))
    total_kb=$((total_kb + root_kb))
  done

  echo "$run_roots_count $run_dirs_count $total_kb"
}

TARGET_ROOTS=()
while IFS= read -r line; do
  TARGET_ROOTS+=("$line")
done < <(collect_targets)
read -r BEFORE_ROOTS BEFORE_RUNS BEFORE_KB < <(collect_stats "${TARGET_ROOTS[@]:-}")

if [ "$EXECUTE" = false ]; then
  echo "Mode: dry-run"
  echo "Project root: $PROJECT_ROOT"
  echo "Legacy run roots: $BEFORE_ROOTS"
  echo "Legacy run directories: $BEFORE_RUNS"
  echo "Legacy disk usage (KB): $BEFORE_KB"
  echo

  if [ "$BEFORE_ROOTS" -eq 0 ]; then
    echo "No legacy .claude/*/runs roots found."
  else
    echo "Targets:"
    for root in "${TARGET_ROOTS[@]}"; do
      echo "- ${root#${PROJECT_ROOT}/}"
    done
  fi

  echo
  echo "SUMMARY mode=dry-run roots=${BEFORE_ROOTS} runs=${BEFORE_RUNS} kb=${BEFORE_KB}"
  exit 0
fi

echo "Mode: execute"
echo "Project root: $PROJECT_ROOT"

echo "Removing legacy run roots..."
if [ "$BEFORE_ROOTS" -gt 0 ]; then
  for root in "${TARGET_ROOTS[@]}"; do
    echo "- removing ${root#${PROJECT_ROOT}/}"
    rm -rf "$root"
  done
fi

AFTER_TARGET_ROOTS=()
while IFS= read -r line; do
  AFTER_TARGET_ROOTS+=("$line")
done < <(collect_targets)
read -r AFTER_ROOTS AFTER_RUNS AFTER_KB < <(collect_stats "${AFTER_TARGET_ROOTS[@]:-}")

RECLAIMED_KB=$((BEFORE_KB - AFTER_KB))
if [ "$RECLAIMED_KB" -lt 0 ]; then
  RECLAIMED_KB=0
fi

echo
echo "Cleanup completed."
echo "Before roots: $BEFORE_ROOTS | After roots: $AFTER_ROOTS"
echo "Before runs:  $BEFORE_RUNS | After runs:  $AFTER_RUNS"
echo "Before KB:    $BEFORE_KB   | After KB:    $AFTER_KB"
echo "Reclaimed KB: $RECLAIMED_KB"
echo
echo "SUMMARY mode=execute before_roots=${BEFORE_ROOTS} before_runs=${BEFORE_RUNS} before_kb=${BEFORE_KB} after_roots=${AFTER_ROOTS} after_runs=${AFTER_RUNS} after_kb=${AFTER_KB} reclaimed_kb=${RECLAIMED_KB}"
