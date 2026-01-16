#!/bin/bash
# 依赖分析脚本
# 用法: bash analyze-dependencies.sh [目录]

set -e

TARGET="${1:-.}"
cd "$TARGET"

REPORT_FILE="/tmp/dependency-analysis-$(date +%Y%m%d_%H%M%S).md"

echo "🔍 分析项目依赖..."
echo ""

cat > "$REPORT_FILE" << EOF
# 依赖分析报告

分析时间: $(date '+%Y-%m-%d %H:%M:%S')
目录: $TARGET

EOF

# Node.js 项目
if [ -f "package.json" ]; then
    echo "## Node.js 依赖" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    # 生产依赖
    echo "### 生产依赖" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    cat package.json | grep -A 100 '"dependencies"' | grep -B 100 -m1 '}' | head -20 >> "$REPORT_FILE" 2>/dev/null || echo "无" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    # 开发依赖
    echo "### 开发依赖" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    cat package.json | grep -A 100 '"devDependencies"' | grep -B 100 -m1 '}' | head -20 >> "$REPORT_FILE" 2>/dev/null || echo "无" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    # 检查过时的包
    if command -v npm &> /dev/null; then
        echo "### 过时的依赖" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        npm outdated 2>/dev/null >> "$REPORT_FILE" || echo "所有依赖都是最新的" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi

    # 检查安全漏洞
    if command -v npm &> /dev/null; then
        echo "### 安全审计" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        npm audit --json 2>/dev/null | head -50 >> "$REPORT_FILE" || echo "npm audit 完成" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
fi

# Python 项目
if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
    echo "## Python 依赖" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    if [ -f "requirements.txt" ]; then
        echo "### requirements.txt" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        cat requirements.txt >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi

    if [ -f "pyproject.toml" ]; then
        echo "### pyproject.toml 依赖" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        grep -A 50 '\[project\]' pyproject.toml | grep -A 20 'dependencies' | head -25 >> "$REPORT_FILE" 2>/dev/null || echo "未找到" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi

    # 安全检查
    if command -v pip-audit &> /dev/null; then
        echo "### 安全审计 (pip-audit)" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        pip-audit 2>/dev/null >> "$REPORT_FILE" || echo "pip-audit 完成" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
fi

# Go 项目
if [ -f "go.mod" ]; then
    echo "## Go 依赖" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    echo "### go.mod" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    cat go.mod >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    # 依赖图
    if command -v go &> /dev/null; then
        echo "### 依赖列表" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        go list -m all 2>/dev/null | head -30 >> "$REPORT_FILE" || echo "无" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
fi

# Rust 项目
if [ -f "Cargo.toml" ]; then
    echo "## Rust 依赖" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    echo "### Cargo.toml" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    grep -A 30 '\[dependencies\]' Cargo.toml >> "$REPORT_FILE" 2>/dev/null || echo "无" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    # 安全审计
    if command -v cargo-audit &> /dev/null; then
        echo "### 安全审计 (cargo-audit)" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
        cargo audit 2>/dev/null >> "$REPORT_FILE" || echo "cargo audit 完成" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
    fi
fi

echo ""
echo "✅ 分析完成！报告已保存到: $REPORT_FILE"
echo ""
cat "$REPORT_FILE"
