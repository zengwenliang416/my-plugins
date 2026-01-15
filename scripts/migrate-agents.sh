#!/bin/bash

# 批量转换 agents 到官方标准格式
# agents/agent-name/SKILL.md → agents/agent-name.md

AGENTS_DIR="/Users/wenliang_zeng/.claude/agents"

echo "开始转换 agents 到官方标准格式..."

cd "$AGENTS_DIR" || exit 1

# 遍历所有 agent 子目录
for agent_dir in */; do
    agent_name=$(basename "$agent_dir")

    # 跳过如果不是目录
    [ ! -d "$agent_dir" ] && continue

    echo ""
    echo "处理: $agent_name"

    # 查找主文件（SKILL.md 或 AGENT.md）
    main_file=""
    if [ -f "$agent_dir/SKILL.md" ]; then
        main_file="$agent_dir/SKILL.md"
    elif [ -f "$agent_dir/AGENT.md" ]; then
        main_file="$agent_dir/AGENT.md"
    else
        echo "  ⚠️  未找到 SKILL.md 或 AGENT.md，跳过"
        continue
    fi

    # 读取文件内容并转换 frontmatter
    echo "  📝 转换 frontmatter: allowed-tools → tools, 添加 model: inherit"

    # 使用 sed 转换（macOS 兼容语法）
    sed -e 's/^allowed-tools:/tools:/' \
        -e '/^---$/,/^---$/{
            /^---$/a\
model: inherit
        }' "$main_file" > "$agent_name.md.tmp"

    # 检查是否成功生成
    if [ ! -s "$agent_name.md.tmp" ]; then
        echo "  ❌ 转换失败，跳过"
        rm -f "$agent_name.md.tmp"
        continue
    fi

    # 移动到正确位置
    mv "$agent_name.md.tmp" "$agent_name.md"
    echo "  ✅ 已创建: $agent_name.md"

    # 保留 references 目录
    if [ -d "$agent_dir/references" ]; then
        echo "  📂 保留 references 目录"
    fi

    # 删除旧的主文件
    rm -f "$main_file"
    echo "  🗑️  已删除旧文件: $main_file"
done

echo ""
echo "✅ 转换完成！"
echo ""
echo "文件结构："
ls -la "$AGENTS_DIR" | grep -E '\.md$|^d'
