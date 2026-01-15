#!/bin/bash
# UserPromptSubmit hook - 优化版意图路由
# 策略：Layer 1 固定精简 Agent 表 (~500字符) + Layer 2 动态 Skill 注入 (0-1K字符)
# 优化效果：注入量从 ~12K 降至 500-1500 字符，节省 70-90% token

# 使用插件根目录或回退到 ~/.claude
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$HOME/.claude/plugins/cache/ccg-workflows-marketplace/ccg-workflows/3.0.0}"
PATTERNS_FILE="$PLUGIN_ROOT/hooks/scripts/evaluation/patterns.json"
LOG_FILE="$HOME/.claude/logs/intent-router.log"
LOG_LEVEL="${INTENT_ROUTER_LOG_LEVEL:-INFO}"

# UserPromptSubmit Hook 通过 stdin 接收用户输入，而不是参数
if [ -t 0 ]; then
    # 如果 stdin 是终端（测试模式），使用参数
    USER_PROMPT="$1"
else
    # 生产模式：从 stdin 读取
    USER_PROMPT=$(cat)
fi
# macOS 兼容的毫秒时间戳
if [[ "$OSTYPE" == "darwin"* ]]; then
    START_TIME=$(perl -MTime::HiRes=time -e 'printf "%.0f\n", time()*1000' 2>/dev/null || date +%s)
else
    START_TIME=$(date +%s%3N 2>/dev/null || date +%s)
fi

# === 日志工具函数 ===
log_intent() {
    local level="$1"
    local event="$2"
    local data="$3"

    # 日志级别过滤
    case "$LOG_LEVEL" in
        DEBUG) allowed_levels="DEBUG INFO WARN ERROR" ;;
        INFO)  allowed_levels="INFO WARN ERROR" ;;
        WARN)  allowed_levels="WARN ERROR" ;;
        ERROR) allowed_levels="ERROR" ;;
        *)     return ;;
    esac

    if [[ ! "$allowed_levels" =~ "$level" ]]; then
        return
    fi

    # 确保日志目录存在
    mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null

    # 生成时间戳（macOS 兼容）
    local ts
    if date --version >/dev/null 2>&1; then
        ts=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)
    else
        ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    fi

    # 写入日志
    if command -v jq >/dev/null 2>&1; then
        jq -n --arg ts "$ts" --arg level "$level" --arg event "$event" --argjson data "$data" \
            '{timestamp: $ts, level: $level, event: $event, data: $data}' >> "$LOG_FILE" 2>/dev/null
    fi
}

# === Layer 1: 固定注入（精简 Agent 表）===
generate_agent_summary() {
    cat << 'EOF'
## 可用工作流

| Agent | 触发场景 | 产出目录 |
|-------|----------|----------|
| commit | 提交/commit/推送 | 规范commit |
| debug | Bug/调试/错误/异常 | debugging/ |
| dev | 开发/实现/功能/重构 | developing/ |
| image | 图片/海报/配图 | imaging/ |
| plan | 规划/计划/设计/方案 | planning/ |
| review | 审查/PR/代码检查 | reviewing/ |
| social | 公众号/小红书/文章 | writing/ |
| test | 测试/用例/覆盖率 | testing/ |

**匹配规则**: 识别意图后调用对应工作流；多匹配时询问用户；无匹配时直接响应。
EOF
}

# === Layer 2: 关键词匹配 + 动态注入 ===
detect_intent_and_inject() {
    local prompt="$1"
    local matched_intents=""
    local matched_keywords=""
    local skills_to_inject=""
    local layer2_output=""

    # 检查 patterns.json 是否存在
    if [[ ! -f "$PATTERNS_FILE" ]]; then
        log_intent "WARN" "patterns_missing" '{"file":"'"$PATTERNS_FILE"'"}'
        return
    fi

    # 检查 jq 是否可用
    if ! command -v jq >/dev/null 2>&1; then
        log_intent "ERROR" "jq_missing" '{"message":"jq command not found"}'
        return
    fi

    # 遍历所有意图
    for intent in $(jq -r '.intents | keys[]' "$PATTERNS_FILE" 2>/dev/null); do
        # 获取该意图的关键词
        local keywords
        keywords=$(jq -r ".intents.$intent.keywords[]?" "$PATTERNS_FILE" 2>/dev/null)

        # 匹配关键词
        for kw in $keywords; do
            if echo "$prompt" | grep -qi "$kw" 2>/dev/null; then
                matched_intents="$matched_intents $intent"
                matched_keywords="$matched_keywords $kw"

                # 获取关联的 skills
                local skills
                skills=$(jq -r ".intents.$intent.skills[]?" "$PATTERNS_FILE" 2>/dev/null)
                skills_to_inject="$skills_to_inject $skills"
                break
            fi
        done
    done

    # 去重
    skills_to_inject=$(echo "$skills_to_inject" | tr ' ' '\n' | grep -v '^$' | sort -u | tr '\n' ' ')
    matched_intents=$(echo "$matched_intents" | tr ' ' '\n' | grep -v '^$' | sort -u | tr '\n' ' ')

    # 动态注入匹配的 Skill 描述
    if [[ -n "$skills_to_inject" ]]; then
        layer2_output+="\n## 相关技能\n"
        for skill in $skills_to_inject; do
            # 查找 skill 目录（支持领域分组结构）
            local skill_path
            skill_path=$(find "$PLUGIN_ROOT/skills" -name "$skill" -type d 2>/dev/null | head -1)

            if [[ -d "$skill_path" && -f "$skill_path/SKILL.md" ]]; then
                # 提取精简描述
                local desc
                desc=$(grep -A1 "^description:" "$skill_path/SKILL.md" 2>/dev/null | tail -1 | sed 's/^[[:space:]]*//' | head -c 100)
                [[ -n "$desc" ]] && layer2_output+="- **$skill**: $desc\n"
            fi
        done
    fi

    # 记录日志 (macOS 兼容)
    local end_time
    if [[ "$OSTYPE" == "darwin"* ]]; then
        end_time=$(perl -MTime::HiRes=time -e 'printf "%.0f\n", time()*1000' 2>/dev/null || date +%s)
    else
        end_time=$(date +%s%3N 2>/dev/null || date +%s)
    fi
    local detection_ms=$((end_time - START_TIME))

    log_intent "INFO" "intent_detection" "$(jq -n \
        --arg prompt_preview "${prompt:0:50}..." \
        --arg prompt_len "${#prompt}" \
        --arg keywords "$matched_keywords" \
        --arg intents "$matched_intents" \
        --arg skills "$skills_to_inject" \
        --arg ms "$detection_ms" \
        '{
            prompt_preview: $prompt_preview,
            prompt_length: ($prompt_len | tonumber),
            matched_keywords: ($keywords | split(" ") | map(select(length > 0))),
            matched_intents: ($intents | split(" ") | map(select(length > 0))),
            injected_skills: ($skills | split(" ") | map(select(length > 0))),
            detection_ms: ($ms | tonumber)
        }' 2>/dev/null || echo '{}')"

    # 输出 Layer 2 内容
    echo -e "$layer2_output"
}

# === 主输出 ===
{
    generate_agent_summary
    detect_intent_and_inject "$USER_PROMPT"
    echo ""
    echo "---"
    echo "**🔴 强制执行规则**："
    echo ""
    echo "1. **必须调用 Skill()**：识别到执行意图（提交/调试/开发/测试/审查/规划等）时，**禁止**使用 Bash/Read/Grep/Glob/Write 等工具直接执行。"
    echo "2. **调用格式**：\`Skill(\"ccg-core:command-name\")\`，如 commit/debug/dev/review/test/plan"
    echo "3. **禁止绕过**：不得以"更高效"、"更直接"为由绕过 Agent 层。即使是只读操作（Read/Grep/Glob），如果是为了执行任务（而非理解概念），也必须走 Agent。"
    echo "4. **询问类任务**：纯粹的理解/学习/询问（无需文件操作）可以直接回答，无需调用 Agent。"
    echo ""
    echo "**违规示例**："
    echo "- ❌ 用户说\"提交代码\" → 直接 \`git commit\`（绕过 ccg-core:commit）"
    echo "- ❌ 用户说\"修复 Bug\" → 直接编辑代码（绕过 ccg-core:debug）"
    echo "- ❌ 用户说\"看看代码有什么问题\" → 直接 Read 文件（绕过 ccg-core:review）"
    echo "- ❌ 用户说\"分析这个模块优化点\" → 直接 Grep 搜索（绕过 ccg-core:dev）"
    echo ""
    echo "**正确示例**："
    echo "- ✅ 用户说\"提交代码\" → \`Skill(\"ccg-core:commit\")\`"
    echo "- ✅ 用户说\"修复 Bug\" → \`Skill(\"ccg-core:debug\")\`"
    echo "- ✅ 用户说\"审查代码质量\" → \`Skill(\"ccg-core:review\")\`"
    echo "- ✅ 用户说\"看看这个文件需要优化\" → \`Skill(\"ccg-core:review\")\`"
    echo "- ✅ 用户说\"commit 的作用是什么\" → 直接回答（询问类，无需文件操作，无需调用）"
    echo "- ✅ 用户说\"解释一下这段代码\" → 可以 Read 文件查看后解释（理解类，非执行类）"
}
