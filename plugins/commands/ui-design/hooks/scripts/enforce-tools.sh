#!/bin/bash
# ui-design 强制工具使用 Hook
# 基于文件存在性检测工作流阶段，强制使用正确的工具

set -euo pipefail

# 读取输入
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
TOOL_INPUT=$(echo "$INPUT" | jq -r '.tool_input // empty')

# 查找最新的 ui-design run 目录
# 格式: 20260116T162538Z (ISO 8601 日期时间格式)
RUN_DIR=$(find .claude/ui-design/runs -maxdepth 1 -type d -name "[0-9]*T[0-9]*Z" 2>/dev/null | sort -r | head -1 || echo "")

if [[ -z "$RUN_DIR" ]]; then
  # 不在 ui-design 工作流中，允许所有工具
  exit 0
fi

# ============================================================
# Phase 检测（基于文件存在性）
# ============================================================

# Phase 3 (requirement-analyzer): input.md 存在，但 requirements.md 不存在
IN_PHASE_3=false
if [[ -f "${RUN_DIR}/input.md" ]] && [[ ! -f "${RUN_DIR}/requirements.md" ]]; then
  IN_PHASE_3=true
fi

# Phase 4 (style-recommender): requirements.md 存在，但 style-recommendations.md 不存在
IN_PHASE_4=false
if [[ -f "${RUN_DIR}/requirements.md" ]] && [[ ! -f "${RUN_DIR}/style-recommendations.md" ]]; then
  IN_PHASE_4=true
fi

# ============================================================
# Phase 3: 代码分析必须用 auggie-mcp（禁止 Glob/Grep/Search）
# ============================================================
if [[ "$IN_PHASE_3" == "true" ]]; then
  # 检查 auggie-mcp 分析结果是否已存在
  AUGGIE_OUTPUT="${RUN_DIR}/auggie-codebase-analysis.md"
  GEMINI_REQ_OUTPUT="${RUN_DIR}/gemini-requirement-analysis.md"

  case "$TOOL_NAME" in
    Glob|Grep)
      # 检查是否在分析代码库（而非操作 run 目录内文件）
      if ! echo "$TOOL_INPUT" | grep -q ".claude/ui-design"; then
        jq -n '{
          "decision": "block",
          "reason": "⛔ ui-design Phase 3 (需求分析) 禁止使用 '"$TOOL_NAME"' 进行代码库分析！\n\n✅ 请改用: mcp__auggie-mcp__codebase-retrieval\n\n示例: 调用 codebase-retrieval 并传入你要分析的问题"
        }'
        exit 0
      fi
      ;;
    Write)
      # 阻止直接写 requirements.md（必须先有 gemini 输出）
      if echo "$TOOL_INPUT" | grep -q "requirements\.md"; then
        if [[ ! -f "$GEMINI_REQ_OUTPUT" ]]; then
          jq -n '{
            "decision": "block",
            "reason": "⛔ ui-design Phase 3 必须先执行 codeagent-wrapper gemini 分析需求！\n\n❌ 你正在尝试直接写 requirements.md\n✅ 请先执行: Bash(~/.claude/bin/codeagent-wrapper gemini --role analyzer --prompt \"...\")\n✅ 然后保存到: '"$GEMINI_REQ_OUTPUT"'\n✅ 最后才能写: requirements.md"
          }'
          exit 0
        fi
      fi
      ;;
  esac
fi

# ============================================================
# Phase 4: 创意方案必须先用 codeagent-wrapper gemini
# ============================================================
if [[ "$IN_PHASE_4" == "true" ]]; then
  # 检查 gemini 输出是否已存在
  GEMINI_OUTPUT="${RUN_DIR}/gemini-style-recommendations.md"

  if [[ ! -f "$GEMINI_OUTPUT" ]]; then
    case "$TOOL_NAME" in
      Write)
        # 阻止直接写 style-recommendations.md（必须先有 gemini 输出）
        if echo "$TOOL_INPUT" | grep -q "style-recommendations\.md"; then
          jq -n '{
            "decision": "block",
            "reason": "⛔ ui-design Phase 4 (样式推荐) 必须先执行 codeagent-wrapper gemini！\n\n❌ 你正在尝试直接写 style-recommendations.md\n✅ 请先执行: Bash(~/.claude/bin/codeagent-wrapper gemini --prompt \"...\")\n✅ 然后保存到: '"$GEMINI_OUTPUT"'\n✅ 最后才能写: style-recommendations.md"
          }'
          exit 0
        fi
        ;;
    esac
  fi
fi

# ============================================================
# Phase 8: 代码生成必须用 codeagent-wrapper gemini
# ============================================================
CODE_DIR="${RUN_DIR}/code"
IN_PHASE_8=false
if [[ -d "$CODE_DIR" ]] && [[ ! -d "${CODE_DIR}/gemini-raw" ]] && [[ ! -d "${CODE_DIR}/final" ]]; then
  IN_PHASE_8=true
fi

if [[ "$IN_PHASE_8" == "true" ]]; then
  case "$TOOL_NAME" in
    Write)
      # 检查是否在写代码文件（必须先有 gemini-raw）
      if echo "$TOOL_INPUT" | grep -qE "code/(components|pages|styles)"; then
        jq -n '{
          "decision": "block",
          "reason": "⛔ ui-design Phase 8 (代码生成) 必须先用 codeagent-wrapper gemini 生成原型！\n\n❌ 你正在尝试直接写代码\n✅ 请先执行: Bash(~/.claude/bin/codeagent-wrapper gemini --prompt \"...\") 生成代码到 gemini-raw/\n✅ 然后 Claude 重构到 refactored/\n✅ 最后合并到 final/"
        }'
        exit 0
      fi
      ;;
  esac
fi

# 默认允许
exit 0
