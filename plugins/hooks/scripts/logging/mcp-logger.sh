#!/bin/bash
# =============================================================================
# mcp-logger.sh - MCP 工具调用日志 Hook
# =============================================================================
# 用途: 记录所有 MCP 工具的调用，便于追踪和审计
# 触发: PreToolUse (mcp__.*)
# 优先级: P2 - 效率提升
# =============================================================================

set -euo pipefail

# 读取 stdin 输入
input=$(cat)

# 提取工具名称
tool_name=$(echo "$input" | jq -r '.tool_name // empty')

# 如果不是 MCP 工具，直接退出
[[ ! "$tool_name" =~ ^mcp__ ]] && exit 0

# 时间戳
timestamp=$(date '+%Y-%m-%d %H:%M:%S')

# 解析 MCP 工具名称
# 格式: mcp__<server>__<tool>
server=$(echo "$tool_name" | sed 's/^mcp__\([^_]*\)__.*/\1/')
tool=$(echo "$tool_name" | sed 's/^mcp__[^_]*__//')

# 获取项目目录
project_dir="${CLAUDE_PROJECT_DIR:-$HOME/.claude}"

# 日志文件路径
log_dir="$project_dir/logs"
mkdir -p "$log_dir"
log_file="$log_dir/mcp-calls.log"

# 提取关键参数（避免记录敏感内容）
params=$(echo "$input" | jq -c '
  .tool_input |
  if . == null then "{}" else
    # 移除可能的敏感字段
    del(.password, .token, .secret, .key, .credential, .api_key, .apiKey) |
    # 截断过长的字段
    with_entries(
      if (.value | type) == "string" and (.value | length) > 100
      then .value = (.value[:100] + "...")
      else .
      end
    )
  end
' 2>/dev/null || echo '{}')

# 记录日志
echo "[$timestamp] $server::$tool $params" >> "$log_file"

# 根据不同的 MCP 服务显示不同的提示
case "$server" in
  serena)
    case "$tool" in
      find_symbol|get_symbols_overview)
        echo "🔍 Serena: 符号检索"
        ;;
      replace_symbol_body|insert_*_symbol)
        echo "✏️ Serena: 代码编辑"
        ;;
      search_for_pattern)
        echo "🔎 Serena: 模式搜索"
        ;;
      find_referencing_symbols)
        echo "🔗 Serena: 引用分析"
        ;;
      *)
        echo "📊 Serena: $tool"
        ;;
    esac
    ;;

  codex)
    sandbox=$(echo "$input" | jq -r '.tool_input.sandbox // "read-only"')
    echo "🤖 Codex 协作 [sandbox=$sandbox]"
    # 强制检查 sandbox 设置
    if [[ "$sandbox" != "read-only" ]]; then
      echo "   ⚠️ 警告: sandbox 非只读模式，请确认意图"
    fi
    ;;

  context7)
    case "$tool" in
      resolve-library-id)
        lib=$(echo "$input" | jq -r '.tool_input.libraryName // empty')
        echo "📚 Context7: 解析库 ID - $lib"
        ;;
      get-library-docs)
        lib=$(echo "$input" | jq -r '.tool_input.context7CompatibleLibraryID // empty')
        topic=$(echo "$input" | jq -r '.tool_input.topic // "全部"')
        echo "📖 Context7: 获取文档 - $lib ($topic)"
        ;;
    esac
    ;;

  ddg-search)
    query=$(echo "$input" | jq -r '.tool_input.query // empty' | head -c 50)
    echo "🦆 DuckDuckGo: ${query}..."
    ;;

  chrome-devtools)
    echo "🌐 Chrome DevTools: $tool"
    ;;

  banana-image)
    echo "🖼️ Banana Image: $tool"
    ;;

    thought_num=$(echo "$input" | jq -r '.tool_input.thoughtNumber // 1')
    total=$(echo "$input" | jq -r '.tool_input.totalThoughts // 1')
    echo "🧠 思考中: $thought_num/$total"
    ;;

  *)
    echo "🔧 MCP: $server::$tool"
    ;;
esac

# 保持日志文件大小合理（保留最近 1000 行）
if [[ -f "$log_file" ]] && [[ $(wc -l < "$log_file") -gt 1000 ]]; then
  tail -500 "$log_file" > "$log_file.tmp" && mv "$log_file.tmp" "$log_file"
fi

exit 0
