#!/bin/bash
# Codex Thinker Wrapper Script
# Usage: ./invoke-codex-thinker.sh --level <low|high> --question <question> [--output <path>]

set -e

# Default values
LEVEL="low"
QUESTION=""
OUTPUT=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --level)
      LEVEL="$2"
      shift 2
      ;;
    --question)
      QUESTION="$2"
      shift 2
      ;;
    --output)
      OUTPUT="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate
if [ -z "$QUESTION" ]; then
  echo "Error: --question is required"
  exit 1
fi

# Build prompt based on level
if [ "$LEVEL" = "high" ]; then
  PROMPT="你是一位顶级系统架构师。请对以下复杂问题进行全面深度分析：

问题：${QUESTION}

请进行以下层次的推理：

## 第一层：问题分解
- 识别核心问题和子问题
- 建立问题之间的依赖关系
- 确定解决顺序

## 第二层：方案探索
- 生成至少 3 种可能的解决方案
- 分析每种方案的优缺点
- 评估技术复杂度和风险

## 第三层：深度推理
- 选择最优方案
- 详细推导实现步骤
- 验证逻辑完整性

## 第四层：安全与性能
- 安全风险分析
- 性能瓶颈预测
- 可扩展性评估

请展示完整的推理链，包括假设、推导和结论。"
else
  PROMPT="你是一位资深技术专家。请对以下问题进行深度技术分析：

问题：${QUESTION}

请从以下角度进行推理：
1. 技术可行性分析
2. 实现路径推导
3. 潜在风险识别
4. 最佳实践建议

请展示你的推理过程，包括：
- 每一步的逻辑推导
- 关键假设说明
- 置信度评估"
fi

# Execute
echo "🧠 Invoking Codex Thinker (Level: $LEVEL)..."
echo "---"

RESULT=$(~/.claude/bin/codeagent-wrapper codex --prompt "$PROMPT")

# Output
if [ -n "$OUTPUT" ]; then
  echo "$RESULT" > "$OUTPUT"
  echo "Output saved to: $OUTPUT"
else
  echo "$RESULT"
fi
