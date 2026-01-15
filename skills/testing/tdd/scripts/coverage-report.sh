#!/bin/bash
# 测试覆盖率报告生成脚本
# 用法: bash coverage-report.sh [目录]

set -e

TARGET="${1:-.}"
cd "$TARGET"

echo "📊 生成测试覆盖率报告..."
echo ""

# 检测项目类型并生成覆盖率
generate_coverage() {
    local found=0

    # Python
    if [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
        echo "🐍 Python 项目覆盖率"
        if command -v pytest &> /dev/null; then
            pytest --cov=. --cov-report=term-missing --cov-report=html
            echo ""
            echo "📁 HTML 报告: htmlcov/index.html"
            found=1
        fi
    fi

    # Node.js with Jest
    if [ -f "package.json" ]; then
        if [ -f "jest.config.js" ] || [ -f "jest.config.ts" ] || grep -q '"jest"' package.json; then
            echo "📦 Jest 覆盖率"
            npx jest --coverage
            echo ""
            echo "📁 HTML 报告: coverage/lcov-report/index.html"
            found=1
        elif [ -f "vitest.config.ts" ] || [ -f "vitest.config.js" ]; then
            echo "📦 Vitest 覆盖率"
            npx vitest run --coverage
            echo ""
            echo "📁 HTML 报告: coverage/index.html"
            found=1
        fi
    fi

    # Go
    if [ -f "go.mod" ]; then
        echo "🐹 Go 覆盖率"
        go test -coverprofile=coverage.out ./...
        go tool cover -func=coverage.out
        go tool cover -html=coverage.out -o coverage.html
        echo ""
        echo "📁 HTML 报告: coverage.html"
        found=1
    fi

    # Rust
    if [ -f "Cargo.toml" ]; then
        echo "🦀 Rust 覆盖率 (需要安装 cargo-tarpaulin)"
        if command -v cargo-tarpaulin &> /dev/null; then
            cargo tarpaulin --out Html
            echo ""
            echo "📁 HTML 报告: tarpaulin-report.html"
        else
            echo "   ⚠️ 请安装: cargo install cargo-tarpaulin"
        fi
        found=1
    fi

    if [ "$found" -eq 0 ]; then
        echo "❌ 未检测到支持覆盖率的项目"
        exit 1
    fi
}

generate_coverage

echo ""
echo "✅ 覆盖率报告生成完成"
