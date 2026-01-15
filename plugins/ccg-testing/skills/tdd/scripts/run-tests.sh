#!/bin/bash
# 通用测试运行脚本
# 用法: bash run-tests.sh [目录]
# 自动检测项目类型并运行相应的测试框架

set -e

TARGET="${1:-.}"
cd "$TARGET"

echo "🧪 检测项目类型并运行测试..."
echo ""

# 检测并运行测试
run_tests() {
    local found=0

    # Python (pytest)
    if [ -f "pyproject.toml" ] || [ -f "setup.py" ] || [ -f "pytest.ini" ]; then
        echo "🐍 检测到 Python 项目"
        if command -v pytest &> /dev/null; then
            echo "   运行 pytest..."
            pytest -v --tb=short
            found=1
        elif command -v python &> /dev/null; then
            echo "   运行 python -m pytest..."
            python -m pytest -v --tb=short
            found=1
        fi
    fi

    # Node.js (npm test)
    if [ -f "package.json" ]; then
        echo "📦 检测到 Node.js 项目"

        # 检查 package.json 中的测试脚本
        if grep -q '"test"' package.json; then
            echo "   运行 npm test..."
            npm test
            found=1
        fi

        # 检查特定测试框架
        if [ -f "vitest.config.ts" ] || [ -f "vitest.config.js" ]; then
            echo "   检测到 Vitest"
            npx vitest run
            found=1
        elif [ -f "jest.config.js" ] || [ -f "jest.config.ts" ]; then
            echo "   检测到 Jest"
            npx jest
            found=1
        fi
    fi

    # Go
    if [ -f "go.mod" ]; then
        echo "🐹 检测到 Go 项目"
        echo "   运行 go test..."
        go test -v ./...
        found=1
    fi

    # Rust
    if [ -f "Cargo.toml" ]; then
        echo "🦀 检测到 Rust 项目"
        echo "   运行 cargo test..."
        cargo test
        found=1
    fi

    # Java (Maven)
    if [ -f "pom.xml" ]; then
        echo "☕ 检测到 Maven 项目"
        echo "   运行 mvn test..."
        mvn test
        found=1
    fi

    # Java (Gradle)
    if [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
        echo "☕ 检测到 Gradle 项目"
        echo "   运行 ./gradlew test..."
        ./gradlew test
        found=1
    fi

    if [ "$found" -eq 0 ]; then
        echo "❌ 未检测到已知的测试框架"
        echo ""
        echo "支持的项目类型:"
        echo "  - Python (pytest)"
        echo "  - Node.js (npm test, Jest, Vitest)"
        echo "  - Go (go test)"
        echo "  - Rust (cargo test)"
        echo "  - Java (Maven, Gradle)"
        exit 1
    fi
}

run_tests

echo ""
echo "✅ 测试完成"
