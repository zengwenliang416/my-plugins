#!/bin/bash
# Dependency Checker - Multi-language dependency analysis
# Usage: ./check-deps.sh [path] [--json] [--production]

set -e

PROJECT_PATH="${1:-.}"
OUTPUT_FORMAT="text"
PRODUCTION_ONLY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --json) OUTPUT_FORMAT="json"; shift ;;
        --production) PRODUCTION_ONLY=true; shift ;;
        *) shift ;;
    esac
done

cd "$PROJECT_PATH"

detect_package_manager() {
    if [[ -f "pnpm-lock.yaml" ]]; then echo "pnpm"
    elif [[ -f "yarn.lock" ]]; then echo "yarn"
    elif [[ -f "package-lock.json" ]] || [[ -f "package.json" ]]; then echo "npm"
    elif [[ -f "Cargo.toml" ]]; then echo "cargo"
    elif [[ -f "requirements.txt" ]] || [[ -f "pyproject.toml" ]]; then echo "pip"
    else echo "unknown"
    fi
}

PM=$(detect_package_manager)

echo "=== Dependency Check Report ==="
echo "Project: $PROJECT_PATH"
echo "Package Manager: $PM"
echo "Date: $(date -Iseconds)"
echo ""

case $PM in
    npm|pnpm|yarn)
        echo "=== Outdated Dependencies ==="
        if [[ "$PM" == "yarn" ]]; then
            yarn outdated 2>/dev/null || true
        else
            npm outdated 2>/dev/null || true
        fi
        echo ""

        echo "=== Security Audit ==="
        if [[ "$PRODUCTION_ONLY" == true ]]; then
            npm audit --production 2>/dev/null || true
        else
            npm audit 2>/dev/null || true
        fi
        echo ""

        echo "=== Top-level Dependencies ==="
        npm ls --depth=0 2>/dev/null || true
        ;;

    pip)
        echo "=== Outdated Dependencies ==="
        pip list --outdated 2>/dev/null || true
        echo ""

        echo "=== Security Audit ==="
        if command -v pip-audit &> /dev/null; then
            pip-audit 2>/dev/null || true
        else
            echo "pip-audit not installed. Run: pip install pip-audit"
        fi
        ;;

    cargo)
        echo "=== Outdated Dependencies ==="
        if command -v cargo-outdated &> /dev/null; then
            cargo outdated 2>/dev/null || true
        else
            echo "cargo-outdated not installed. Run: cargo install cargo-outdated"
        fi
        echo ""

        echo "=== Security Audit ==="
        if command -v cargo-audit &> /dev/null; then
            cargo audit 2>/dev/null || true
        else
            echo "cargo-audit not installed. Run: cargo install cargo-audit"
        fi
        ;;

    *)
        echo "Unknown package manager. Please check manually."
        exit 1
        ;;
esac

echo ""
echo "=== Summary ==="
echo "Run completed at $(date)"
