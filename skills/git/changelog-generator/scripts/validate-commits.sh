#!/bin/bash
# 验证提交信息是否符合 Conventional Commits 规范
# 用法: bash validate-commits.sh [from-ref] [to-ref]

set -e

FROM_REF="${1:-HEAD~10}"
TO_REF="${2:-HEAD}"

echo "🔍 验证提交信息规范..."
echo "   范围: $FROM_REF..$TO_REF"
echo ""

# Conventional Commits 正则表达式
PATTERN="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9_-]+\))?!?: .{1,100}$"

VALID=0
INVALID=0
WARNINGS=0

echo "## 验证结果"
echo ""

git log "$FROM_REF..$TO_REF" --pretty=format:"%H|%s" | while IFS='|' read hash subject; do
    short_hash="${hash:0:7}"

    if echo "$subject" | grep -qE "$PATTERN"; then
        echo "✅ $short_hash: $subject"
        ((VALID++)) || true
    else
        echo "❌ $short_hash: $subject"
        ((INVALID++)) || true

        # 提供修复建议
        if echo "$subject" | grep -qiE "^add"; then
            echo "   💡 建议: 使用 'feat:' 替代 'Add'"
        elif echo "$subject" | grep -qiE "^fix"; then
            echo "   💡 建议: 格式应为 'fix: 描述' 或 'fix(scope): 描述'"
        elif echo "$subject" | grep -qiE "^update"; then
            echo "   💡 建议: 使用 'feat:', 'fix:', 或 'refactor:'"
        fi
    fi

    # 检查消息长度
    if [ ${#subject} -gt 72 ]; then
        echo "   ⚠️  警告: 标题超过 72 字符 (${#subject} 字符)"
        ((WARNINGS++)) || true
    fi
done

echo ""
echo "---"
echo "📊 统计:"
echo "   ✅ 有效: $VALID"
echo "   ❌ 无效: $INVALID"
echo "   ⚠️  警告: $WARNINGS"

if [ "$INVALID" -gt 0 ]; then
    echo ""
    echo "❗ 存在不符合规范的提交，建议使用 git rebase -i 修改"
    exit 1
fi

echo ""
echo "✅ 所有提交均符合 Conventional Commits 规范"
