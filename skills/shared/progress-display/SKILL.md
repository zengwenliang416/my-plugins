# progress-display Skill

## 概述

读取 state.json 并渲染终端进度展示。

## 输入参数

| 参数    | 类型   | 必需 | 说明         |
| ------- | ------ | ---- | ------------ |
| run_dir | string | Yes  | 运行目录路径 |

## 执行流程

### 步骤 1: 读取状态文件

```bash
STATE_FILE="${run_dir}/state.json"
if [ ! -f "$STATE_FILE" ]; then
    echo "❌ 状态文件不存在: $STATE_FILE"
    exit 1
fi

STATE=$(cat "$STATE_FILE")
DOMAIN=$(echo "$STATE" | jq -r '.domain')
```

### 步骤 2: 渲染进度表格

```bash
echo "┌─────────────────────────────────────────┐"
echo "│ 🔄 工作流进度 (${DOMAIN})                    │"
echo "├─────────────────────────────────────────┤"

echo "$STATE" | jq -c '.phases[]' | while read -r phase; do
    ID=$(echo "$phase" | jq -r '.id')
    NAME=$(echo "$phase" | jq -r '.name')
    STATUS=$(echo "$phase" | jq -r '.status')
    DURATION=$(echo "$phase" | jq -r '.duration_seconds // empty')

    case "$STATUS" in
        "pending")   ICON="⏳" ;;
        "running")   ICON="🔄" ;;
        "completed") ICON="✅" ;;
        "failed")    ICON="❌" ;;
        *)           ICON="?" ;;
    esac

    if [ -n "$DURATION" ] && [ "$DURATION" != "null" ]; then
        MINS=$((DURATION / 60))
        SECS=$((DURATION % 60))
        TIME_STR="${MINS}m ${SECS}s"
    elif [ "$STATUS" = "running" ]; then
        TIME_STR="运行中..."
    else
        TIME_STR="等待"
    fi

    printf "│ [%s] %-18s %10s │\n" "$ICON" "$NAME" "$TIME_STR"
done

echo "├─────────────────────────────────────────┤"

COMPLETED=$(echo "$STATE" | jq -r '.progress.completed_phases')
TOTAL=$(echo "$STATE" | jq -r '.progress.total_phases')
PCT=$(echo "$STATE" | jq -r '.progress.percentage')
ELAPSED=$(echo "$STATE" | jq -r '.progress.elapsed_seconds')

ELAPSED_MINS=$((ELAPSED / 60))
ELAPSED_SECS=$((ELAPSED % 60))

printf "│ 总进度: %d/%d (%d%%)  已用时: %dm %ds      │\n" \
    "$COMPLETED" "$TOTAL" "$PCT" "$ELAPSED_MINS" "$ELAPSED_SECS"

REMAINING=$(echo "$STATE" | jq -r '.progress.estimated_remaining // empty')
if [ -n "$REMAINING" ] && [ "$REMAINING" != "null" ] && [ "$REMAINING" -gt 0 ]; then
    REMAIN_MINS=$((REMAINING / 60))
    printf "│ 预计剩余: ~%d 分钟                      │\n" "$REMAIN_MINS"
fi

echo "└─────────────────────────────────────────┘"
```

## 使用示例

```
Skill("progress-display", args="run_dir=.claude/planning/runs/20260115T100000Z")
```

## 输出示例

```
┌─────────────────────────────────────────┐
│ 🔄 工作流进度 (planning)                │
├─────────────────────────────────────────┤
│ [✅] 任务规划           2m 15s          │
│ [✅] 素材研究           5m 30s          │
│ [🔄] 内容编写           运行中...       │
│ [⏳] Codex 审查         等待            │
│ [⏳] Gemini 审查        等待            │
│ [⏳] 文档润色           等待            │
├─────────────────────────────────────────┤
│ 总进度: 2/6 (33%)  已用时: 7m 45s       │
│ 预计剩余: ~10 分钟                      │
└─────────────────────────────────────────┘
```

## 相关文档

- 状态文件格式: `skills/shared/workflow/STATE_FILE.md`
- 状态管理: `skills/shared/workflow-state-manager/SKILL.md`
