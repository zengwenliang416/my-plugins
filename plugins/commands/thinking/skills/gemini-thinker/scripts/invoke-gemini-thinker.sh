#!/bin/bash
# Gemini Thinker Wrapper Script
# Usage: ./invoke-gemini-thinker.sh --level <medium|high> --question <question> [--output <path>]

set -e

# Default values
LEVEL="medium"
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
  PROMPT="你是一位顶级产品设计师和创新专家。请对以下复杂问题进行全面创意分析：

问题：${QUESTION}

请进行以下层次的推理：

## 第一层：问题洞察
- 用户痛点识别
- 需求层次分析
- 场景深度理解

## 第二层：创意发散
- 生成至少 5 种创新方案
- 跨领域灵感借鉴
- 非常规解决路径

## 第三层：方案评估
- 用户价值评分
- 可实现性分析
- 差异化优势

## 第四层：设计整合
- 视觉/交互建议
- 情感体验设计
- 可扩展性考量

请展示完整的创意推导链，包括假设、灵感来源和结论。"
else
  PROMPT="你是一位创意设计专家和用户体验设计师。请对以下问题进行创意分析：

问题：${QUESTION}

请从以下角度进行推理：
1. 用户视角分析
2. 创意解决方案探索
3. 潜在机会识别
4. 设计优化建议

请展示你的推理过程，包括：
- 每一步的创意推导
- 用户场景假设
- 可行性评估"
fi

# Execute
echo "🎨 Invoking Gemini Thinker (Level: $LEVEL)..."
echo "---"

RESULT=$(~/.claude/bin/codeagent-wrapper gemini --prompt "$PROMPT")

# Output
if [ -n "$OUTPUT" ]; then
  echo "$RESULT" > "$OUTPUT"
  echo "Output saved to: $OUTPUT"
else
  echo "$RESULT"
fi
