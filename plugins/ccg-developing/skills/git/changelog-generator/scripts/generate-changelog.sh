#!/bin/bash
# 自动生成 Changelog 脚本
# 用法: bash generate-changelog.sh [from-ref] [to-ref]
# 示例: bash generate-changelog.sh v1.0.0 HEAD

set -e

FROM_REF="${1:-$(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~50")}"
TO_REF="${2:-HEAD}"
OUTPUT_FILE="CHANGELOG_GENERATED.md"

echo "📝 生成 Changelog..."
echo "   从: $FROM_REF"
echo "   到: $TO_REF"
echo ""

# 初始化文件
cat > "$OUTPUT_FILE" << EOF
# Changelog

生成时间: $(date '+%Y-%m-%d %H:%M:%S')
范围: ${FROM_REF}..${TO_REF}

EOF

# 获取版本信息
if [ "$TO_REF" = "HEAD" ]; then
    VERSION="[Unreleased]"
else
    VERSION="[$TO_REF]"
fi

echo "## $VERSION - $(date '+%Y-%m-%d')" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# 分类收集提交
declare -A CATEGORIES
CATEGORIES["feat"]="✨ Features"
CATEGORIES["fix"]="🐛 Bug Fixes"
CATEGORIES["perf"]="⚡ Performance"
CATEGORIES["docs"]="📚 Documentation"
CATEGORIES["refactor"]="♻️ Refactor"
CATEGORIES["test"]="🧪 Tests"
CATEGORIES["chore"]="🔧 Chores"

# 检查是否有破坏性变更
BREAKING=$(git log "$FROM_REF..$TO_REF" --grep="BREAKING CHANGE" --pretty=format:"- %s (%h)" 2>/dev/null || true)
if [ -n "$BREAKING" ]; then
    echo "### 💥 Breaking Changes" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "$BREAKING" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
fi

# 按类型分类提交
for type in "${!CATEGORIES[@]}"; do
    commits=$(git log "$FROM_REF..$TO_REF" --pretty=format:"- %s (%h)" --grep="^${type}:" --grep="^${type}(" 2>/dev/null || true)
    if [ -n "$commits" ]; then
        echo "### ${CATEGORIES[$type]}" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "$commits" | sed "s/^${type}[:(][^):]*[)]*: //" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    fi
done

# 其他提交（不符合 Conventional Commits 格式）
OTHER=$(git log "$FROM_REF..$TO_REF" --pretty=format:"%s (%h)" 2>/dev/null | grep -v -E "^(feat|fix|perf|docs|refactor|test|chore|build|ci|style|revert)[:(]" | head -20 || true)
if [ -n "$OTHER" ]; then
    echo "### 📦 Other Changes" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "$OTHER" | while read line; do
        echo "- $line" >> "$OUTPUT_FILE"
    done
    echo "" >> "$OUTPUT_FILE"
fi

# 统计信息
echo "---" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "### 📊 Statistics" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
COMMIT_COUNT=$(git rev-list --count "$FROM_REF..$TO_REF" 2>/dev/null || echo "0")
AUTHOR_COUNT=$(git log "$FROM_REF..$TO_REF" --format='%aN' 2>/dev/null | sort -u | wc -l | tr -d ' ')
FILES_CHANGED=$(git diff --stat "$FROM_REF..$TO_REF" 2>/dev/null | tail -1 || echo "N/A")
echo "- 提交数: $COMMIT_COUNT" >> "$OUTPUT_FILE"
echo "- 贡献者: $AUTHOR_COUNT" >> "$OUTPUT_FILE"
echo "- 变更: $FILES_CHANGED" >> "$OUTPUT_FILE"

echo ""
echo "✅ Changelog 已生成: $OUTPUT_FILE"
echo ""
cat "$OUTPUT_FILE"
