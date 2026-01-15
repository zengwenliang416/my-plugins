#!/bin/bash
# 模块结构分析脚本
# 用法: bash module-structure.sh [目录]

set -e

TARGET="${1:-.}"
REPORT_FILE="/tmp/module-structure-$(date +%Y%m%d_%H%M%S).md"

echo "📦 分析模块结构..."
echo ""

cat > "$REPORT_FILE" << EOF
# 模块结构分析报告

分析时间: $(date '+%Y-%m-%d %H:%M:%S')
目录: $TARGET

## 目录结构

\`\`\`
EOF

# 生成目录树
if command -v tree &> /dev/null; then
    tree -L 3 -I 'node_modules|__pycache__|.git|dist|build|.next|coverage' "$TARGET" >> "$REPORT_FILE" 2>/dev/null
else
    find "$TARGET" -maxdepth 3 -type d ! -path '*/node_modules/*' ! -path '*/.git/*' ! -path '*/__pycache__/*' 2>/dev/null | head -50 >> "$REPORT_FILE"
fi

echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 分析源代码目录
echo "## 源代码统计" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "| 类型 | 文件数 | 代码行数 |" >> "$REPORT_FILE"
echo "|------|--------|----------|" >> "$REPORT_FILE"

count_lines() {
    local ext="$1"
    local files=$(find "$TARGET" -name "*.$ext" -type f ! -path '*/node_modules/*' ! -path '*/.git/*' 2>/dev/null)
    if [ -n "$files" ]; then
        local count=$(echo "$files" | wc -l | tr -d ' ')
        local lines=$(echo "$files" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
        echo "| .$ext | $count | $lines |" >> "$REPORT_FILE"
    fi
}

count_lines "ts"
count_lines "tsx"
count_lines "js"
count_lines "jsx"
count_lines "py"
count_lines "go"
count_lines "rs"
count_lines "java"

echo "" >> "$REPORT_FILE"

# 检测架构模式
echo "## 架构模式检测" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Clean Architecture 检测
if [ -d "$TARGET/domain" ] || [ -d "$TARGET/src/domain" ]; then
    echo "### ✅ 可能使用 Clean Architecture / DDD" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "检测到以下目录:" >> "$REPORT_FILE"
    for dir in domain application infrastructure presentation adapters entities usecases; do
        if [ -d "$TARGET/$dir" ] || [ -d "$TARGET/src/$dir" ]; then
            echo "- ✓ $dir/" >> "$REPORT_FILE"
        fi
    done
    echo "" >> "$REPORT_FILE"
fi

# MVC 检测
if [ -d "$TARGET/controllers" ] || [ -d "$TARGET/models" ] || [ -d "$TARGET/views" ]; then
    echo "### ✅ 可能使用 MVC 模式" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    for dir in controllers models views routes middleware; do
        if [ -d "$TARGET/$dir" ] || [ -d "$TARGET/src/$dir" ]; then
            echo "- ✓ $dir/" >> "$REPORT_FILE"
        fi
    done
    echo "" >> "$REPORT_FILE"
fi

# 分层架构检测
if [ -d "$TARGET/services" ] || [ -d "$TARGET/repositories" ]; then
    echo "### ✅ 可能使用分层架构" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    for dir in services repositories dto entities handlers; do
        if [ -d "$TARGET/$dir" ] || [ -d "$TARGET/src/$dir" ]; then
            echo "- ✓ $dir/" >> "$REPORT_FILE"
        fi
    done
    echo "" >> "$REPORT_FILE"
fi

# 组件化检测 (React/Vue)
if [ -d "$TARGET/components" ] || [ -d "$TARGET/src/components" ]; then
    echo "### ✅ 组件化结构" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    for dir in components pages hooks utils stores context features; do
        if [ -d "$TARGET/$dir" ] || [ -d "$TARGET/src/$dir" ]; then
            echo "- ✓ $dir/" >> "$REPORT_FILE"
        fi
    done
    echo "" >> "$REPORT_FILE"
fi

# 入口文件检测
echo "## 入口文件" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

for entry in "index.ts" "index.js" "main.ts" "main.js" "app.ts" "app.js" "main.py" "app.py" "__main__.py" "main.go" "main.rs"; do
    found=$(find "$TARGET" -name "$entry" -type f ! -path '*/node_modules/*' 2>/dev/null | head -5)
    if [ -n "$found" ]; then
        echo "- $entry" >> "$REPORT_FILE"
        echo "$found" | while read f; do
            echo "  - $f" >> "$REPORT_FILE"
        done
    fi
done

echo ""
echo "✅ 分析完成！报告已保存到: $REPORT_FILE"
echo ""
cat "$REPORT_FILE"
