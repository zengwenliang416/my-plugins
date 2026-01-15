---
description: 图片生成工作流：提示词构建 → 图片生成 → 结果呈现
argument-hint: <图片描述> [--template=<name>] [--run-id=xxx]
allowed-tools: [Read, Write, Bash, Task, Skill, AskUserQuestion]
---

# /image - 图片生成工作流命令

## 使用方式

```bash
/image "一只可爱的卡通香蕉"                      # 标准生成
/image --template=product "无线耳机产品图"        # 使用模板
/image --template=poster "2024 科技大会海报"      # 海报模板
/image --run-id=20260115T100000Z                  # 断点续传
```

## 执行流程

### 步骤 1: 展示流程规划

**向用户展示即将执行的工作流**:

```
📋 执行计划:
┌────┬────────────────────┬──────────────┬────────────┐
│ #  │ 阶段               │ 执行者       │ 模式       │
├────┼────────────────────┼──────────────┼────────────┤
│ 1  │ 模式确认           │ 用户         │ 硬停止     │
│ 2  │ 提示词构建         │ builder      │ 后台       │
│ 3  │ 图片生成           │ generator    │ 后台       │
│ 4  │ 结果确认           │ 用户         │ 硬停止     │
└────┴────────────────────┴──────────────┴────────────┘

🖼️ 描述: ${description}
🎨 模板: ${template | 无}
预计总耗时: 1-3 分钟

确认执行? [Y/n]
```

使用 AskUserQuestion 确认后继续。

### 步骤 2: 初始化运行环境

**参数解析**:

```bash
OPTIONS='{}'
[[ "$ARGUMENTS" =~ --template=([^ ]+) ]] && OPTIONS=$(echo "$OPTIONS" | jq --arg v "${BASH_REMATCH[1]}" '. + {template: $v}')
[[ "$ARGUMENTS" =~ --model=([^ ]+) ]] && OPTIONS=$(echo "$OPTIONS" | jq --arg v "${BASH_REMATCH[1]}" '. + {model: $v}')

DESCRIPTION=$(echo "$ARGUMENTS" | sed -E 's/--[a-zA-Z-]+(=[^ ]+)?//g' | xargs)
```

**断点续传检查**:

```bash
if [[ "$ARGUMENTS" =~ --run-id=([^ ]+) ]]; then
    RUN_ID="${BASH_REMATCH[1]}"
    RUN_DIR=".claude/imaging/runs/${RUN_ID}"
    MODE="resume"
else
    MODE="new"
    RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
    RUN_DIR=".claude/imaging/runs/${RUN_ID}"
    mkdir -p "$RUN_DIR"
fi
```

**创建状态文件（统一格式）**:

```bash
if [ "$MODE" = "new" ]; then
    cat > "${RUN_DIR}/state.json" << EOF
{
  "domain": "imaging",
  "workflow_id": "${RUN_ID}",
  "goal": "${DESCRIPTION}",
  "phases": [
    {"id": "prompt-builder", "name": "提示词构建", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "image-generator", "name": "图片生成", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null}
  ],
  "progress": {"total_phases": 2, "completed_phases": 0, "running_phases": 0, "failed_phases": 0, "percentage": 0, "elapsed_seconds": 0, "estimated_remaining": null},
  "parallel_execution": {"max_concurrency": 8, "active_tasks": 0, "completed_tasks": 0, "failed_tasks": 0},
  "checkpoint": {"last_successful_phase": null, "use_default_prompt": null},
  "options": ${OPTIONS},
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

    echo "$DESCRIPTION" > "${RUN_DIR}/input.txt"
fi
```

### 步骤 3: 委托给 Orchestrator

```
Task(
  subagent_type="ccg-core:image-orchestrator",
  description="Execute image generation workflow",
  prompt="执行图片生成工作流。
RUN_DIR: ${RUN_DIR}
RUN_ID: ${RUN_ID}
MODE: ${MODE}
DESCRIPTION: ${DESCRIPTION}

按照 image-orchestrator.md 执行各阶段。
完成后返回结果。"
)
```

### 步骤 4: 进度轮询

每 5 秒调用 progress-display Skill 展示进度：

```
Skill("progress-display", args="run_dir=${RUN_DIR}")
```

## 输出示例

### 执行中

```
┌─────────────────────────────────────────┐
│ 🔄 工作流进度 (imaging)                  │
├─────────────────────────────────────────┤
│ [✅] 提示词构建         0m 15s          │
│ [🔄] 图片生成           运行中...       │
├─────────────────────────────────────────┤
│ 总进度: 1/2 (50%)  已用时: 0m 25s       │
│ 预计剩余: ~30 秒                        │
└─────────────────────────────────────────┘
```

### 完成

```
🎉 图片生成完成！

🖼️ 描述: 一只可爱的卡通香蕉
⏱️ 耗时: 52 秒
📊 模型: gemini-3-pro-image-preview

📁 产物:
  - input.txt (描述)
  - prompt.json (提示词)
  - result.json (结果)
  - images/banana_xxx.png (图片)

🔄 后续:
  - 断点续传: /image --run-id=${RUN_ID}
  - 修改模板: /image --template=product "..."
```

## 运行目录结构

```
.claude/imaging/runs/20260115T100000Z/
├── state.json              # 工作流状态
├── input.txt               # 输入描述
├── prompt.json             # Phase 1: 提示词配置
├── result.json             # Phase 2: 生成结果
└── images/                 # 生成的图片
    └── image_xxx.png
```

## 模板选项

| 模板      | 说明     | 默认宽高比 |
| --------- | -------- | ---------- |
| product   | 产品图   | 1:1        |
| poster    | 海报     | 16:9       |
| social    | 社交配图 | 4:3        |
| thumbnail | 缩略图   | 16:9       |

## 参考资源

- Agent: `agents/image-orchestrator.md`
- Skills: `skills/imaging/`
