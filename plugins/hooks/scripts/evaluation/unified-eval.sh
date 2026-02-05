#!/bin/bash
# =============================================================================
# unified-eval.sh - 智能插件路由 + 意图评估
# =============================================================================
# 核心思路：收集已启用插件元数据 → 注入 context → Claude 自主决策
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# 1. 读取用户输入
# -----------------------------------------------------------------------------
input=$(cat)
prompt=$(echo "$input" | jq -r '.prompt // empty')

# -----------------------------------------------------------------------------
# 2. 动态收集已启用插件信息
# -----------------------------------------------------------------------------
collect_plugin_catalog() {
  local settings_file="$HOME/.claude/settings.json"
  local cache_dir="$HOME/.claude/plugins/cache"
  local catalog=""

  if [[ ! -f "$settings_file" ]]; then
    return
  fi

  # 获取已启用的插件列表
  local enabled_plugins
  enabled_plugins=$(jq -r '.enabledPlugins | to_entries[] | select(.value == true) | .key' "$settings_file" 2>/dev/null || echo "")

  if [[ -z "$enabled_plugins" ]]; then
    return
  fi

  catalog="## 🔌 已启用插件清单\n\n"
  catalog+="根据用户意图，判断是否需要调用以下插件/技能：\n\n"

  while IFS= read -r plugin_entry; do
    [[ -z "$plugin_entry" ]] && continue

    # 解析 plugin-name@marketplace
    local plugin_name marketplace
    plugin_name=$(echo "$plugin_entry" | cut -d'@' -f1)
    marketplace=$(echo "$plugin_entry" | cut -d'@' -f2)

    # 查找插件目录（取最新版本）
    local plugin_dir
    plugin_dir=$(find "$cache_dir/$marketplace/$plugin_name" -maxdepth 1 -type d 2>/dev/null | sort -V | tail -1)

    if [[ -z "$plugin_dir" || ! -d "$plugin_dir" ]]; then
      continue
    fi

    # 读取插件描述
    local description=""
    if [[ -f "$plugin_dir/.claude-plugin/plugin.json" ]]; then
      description=$(jq -r '.description // ""' "$plugin_dir/.claude-plugin/plugin.json" 2>/dev/null)
    fi

    catalog+="### /$plugin_name\n"
    [[ -n "$description" ]] && catalog+="**描述**: $description\n"

    # 收集 commands（用户可调用的命令）
    if [[ -d "$plugin_dir/commands" ]]; then
      local commands
      commands=$(find "$plugin_dir/commands" -name "*.md" -exec basename {} .md \; 2>/dev/null | tr '\n' ', ' | sed 's/,$//')
      [[ -n "$commands" ]] && catalog+="**命令**: $commands\n"
    fi

    # 收集 skills（简化版，只列名称）
    if [[ -d "$plugin_dir/skills" ]]; then
      local skills
      skills=$(find "$plugin_dir/skills" -maxdepth 1 -type d ! -name "skills" ! -name "_*" -exec basename {} \; 2>/dev/null | tr '\n' ', ' | sed 's/,$//')
      [[ -n "$skills" ]] && catalog+="**技能**: $skills\n"
    fi

    # 从插件 CLAUDE.md 提取触发条件和使用场景
    local plugin_claude_md="$plugin_dir/CLAUDE.md"
    if [[ -f "$plugin_claude_md" ]]; then
      # 策略1: 提取 <available-skills> 或 <available-hooks> 表格
      local trigger_table
      trigger_table=$(sed -n '/<available-skills>/,/<\/available-skills>/p' "$plugin_claude_md" 2>/dev/null | grep -E '^\|.*\|' | head -8)
      if [[ -z "$trigger_table" ]]; then
        trigger_table=$(sed -n '/<available-hooks>/,/<\/available-hooks>/p' "$plugin_claude_md" 2>/dev/null | grep -E '^\|.*\|' | head -8)
      fi
      if [[ -n "$trigger_table" ]]; then
        catalog+="**触发条件**:\n$trigger_table\n"
      fi

      # 策略2: 提取 "## When to Use" 或类似段落
      local when_to_use
      when_to_use=$(sed -n '/## When to [Uu]se/,/^## /p' "$plugin_claude_md" 2>/dev/null | grep -E '^[-*]' | head -5 | sed 's/^/  /')
      if [[ -n "$when_to_use" ]]; then
        catalog+="**使用场景**:\n$when_to_use\n"
      fi

      # 策略3: 提取 Workflow Phases（如 ui-design）
      local workflow_phases
      workflow_phases=$(sed -n '/## Workflow Phases/,/^## /p' "$plugin_claude_md" 2>/dev/null | grep -E '^[0-9]+\.' | head -5 | sed 's/^/  /')
      if [[ -n "$workflow_phases" ]]; then
        catalog+="**工作流阶段**:\n$workflow_phases\n"
      fi
    fi

    catalog+="\n"
  done <<< "$enabled_plugins"

  echo -e "$catalog"
}

# -----------------------------------------------------------------------------
# 3. 构建注入内容
# -----------------------------------------------------------------------------
build_context() {
  local plugin_catalog
  plugin_catalog=$(collect_plugin_catalog)

  cat << 'STATIC_RULES'
🔴 **强制：回复前必须先输出意图评估**

格式（直接输出，不用代码块）：
📋 **意图评估** | 类型: [询问/执行] | 意图: [一句话] | 方式: [直接回答/Skill(xxx)]

规则：
- 执行类任务 → 输出评估 → 调用对应 Skill
- 询问类任务 → 输出评估 → 直接回答
- 禁止跳过评估直接调用工具

---

🔍 **工具优先级（强制）**

代码检索任务必须按以下顺序：
1. **auggie-mcp** (首选) → 语义检索，理解意图
2. **LSP** → 符号级精准操作
3. **Grep/Glob** → 降级选择

**强制规则**：
- 首次搜索必须用 `mcp__auggie-mcp__codebase-retrieval`
- 禁止直接 Grep/Glob 盲搜（除非 auggie 不可用）

示例：
```
mcp__auggie-mcp__codebase-retrieval({
  information_request: "用户认证功能的实现位置"
})
```

---

STATIC_RULES

  # 追加动态插件清单
  if [[ -n "$plugin_catalog" ]]; then
    echo -e "$plugin_catalog"
    cat << 'PLUGIN_RULES'

📌 **插件路由规则**

1. 根据用户意图匹配上述插件
2. 如果匹配到插件，使用 `Skill("plugin:command")` 调用
3. 如果无匹配，使用通用工具处理
4. 复杂任务可组合多个插件

PLUGIN_RULES
  fi
}

# -----------------------------------------------------------------------------
# 4. 输出
# -----------------------------------------------------------------------------
build_context
