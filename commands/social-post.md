---
name: social-post
description: 社交媒体工作流：素材分析 → 提纲生成 → 正文写作(并行) → 润色定稿 → 配图生成
argument-hint: platform=<wechat|xiaohongshu> topic="<主题>" [--loop] [--run-id=xxx]
allowed-tools: [Read, Write, Bash, Task, Skill, AskUserQuestion]
---

# /social-post - 社交媒体内容创作工作流命令

## 使用方式

```bash
/social-post platform=wechat topic="Claude Code 实战指南"     # 微信公众号
/social-post platform=xiaohongshu topic="5分钟学会AI编程"      # 小红书
/social-post platform=wechat topic="..." --loop                # 启用 Ralph Loop
/social-post --run-id=20260115T100000Z                         # 断点续传
```

## 执行流程

### 步骤 1: 展示流程规划

**向用户展示即将执行的工作流**:

```
📋 执行计划:
┌────┬────────────────────┬──────────────┬────────────┐
│ #  │ 阶段               │ 执行者       │ 模式       │
├────┼────────────────────┼──────────────┼────────────┤
│ 1  │ 素材分析           │ analyzer     │ 后台       │
│ 2  │ 提纲生成           │ outliner     │ 后台       │
│ 3  │ 提纲选择           │ 用户         │ 硬停止     │
│ 4  │ 正文写作           │ Codex+Gemini │ 并行后台   │
│ 5  │ 润色定稿           │ polisher     │ 后台       │
│ 6  │ 稿件确认           │ 用户         │ 硬停止     │
│ 7  │ 配图生成           │ generator    │ 后台       │
└────┴────────────────────┴──────────────┴────────────┘

🎯 目标平台: ${platform}
📝 写作主题: ${topic}
预计总耗时: 15-30 分钟

确认执行? [Y/n]
```

使用 AskUserQuestion 确认后继续。

### 步骤 2: 初始化运行环境

**参数解析**:

```bash
OPTIONS='{}'
PLATFORM=""
TOPIC=""

# 解析 platform 和 topic
[[ "$ARGUMENTS" =~ platform=([^ ]+) ]] && PLATFORM="${BASH_REMATCH[1]}"
[[ "$ARGUMENTS" =~ topic=\"([^\"]+)\" ]] && TOPIC="${BASH_REMATCH[1]}"
[[ "$ARGUMENTS" =~ --loop ]] && OPTIONS=$(echo "$OPTIONS" | jq '. + {loop: true}')

OPTIONS=$(echo "$OPTIONS" | jq --arg p "$PLATFORM" '. + {platform: $p}')
```

**断点续传检查**:

```bash
if [[ "$ARGUMENTS" =~ --run-id=([^ ]+) ]]; then
    RUN_ID="${BASH_REMATCH[1]}"
    RUN_DIR=".claude/writing/runs/${RUN_ID}"
    MODE="resume"
else
    MODE="new"
    RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
    RUN_DIR=".claude/writing/runs/${RUN_ID}"
    mkdir -p "$RUN_DIR"
fi
```

**创建状态文件（统一格式）**:

```bash
if [ "$MODE" = "new" ]; then
    cat > "${RUN_DIR}/state.json" << EOF
{
  "domain": "writing",
  "workflow_id": "${RUN_ID}",
  "goal": "${TOPIC}",
  "phases": [
    {"id": "source-analyzer", "name": "素材分析", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "outliner", "name": "提纲生成", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "writer-codex", "name": "Codex 写作", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "writer-gemini", "name": "Gemini 写作", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "polisher", "name": "润色定稿", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null},
    {"id": "image-generator", "name": "配图生成", "status": "pending", "started_at": null, "completed_at": null, "duration_seconds": null, "task_id": null, "output": null, "error": null}
  ],
  "progress": {"total_phases": 6, "completed_phases": 0, "running_phases": 0, "failed_phases": 0, "percentage": 0, "elapsed_seconds": 0, "estimated_remaining": null},
  "parallel_execution": {"max_concurrency": 8, "active_tasks": 0, "completed_tasks": 0, "failed_tasks": 0},
  "checkpoint": {"last_successful_phase": null, "selected_outline": null},
  "options": ${OPTIONS},
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "updated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

    # 写入主题
    echo "# 写作主题\n\n平台: ${PLATFORM}\n主题: ${TOPIC}" > "${RUN_DIR}/input.md"
fi
```

### 步骤 3: 委托给 Orchestrator

```
Task(
  subagent_type="social-post-orchestrator",
  description="Execute writing workflow",
  prompt="执行社交媒体写作工作流。
RUN_DIR: ${RUN_DIR}
RUN_ID: ${RUN_ID}
MODE: ${MODE}
PLATFORM: ${PLATFORM}
TOPIC: ${TOPIC}

按照 social-post-orchestrator.md 执行各阶段，使用 phase-runner 后台运行。
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
│ 🔄 工作流进度 (writing)                  │
├─────────────────────────────────────────┤
│ [✅] 素材分析           2m 30s          │
│ [✅] 提纲生成           3m 15s          │
│ [🔄] Codex 写作         运行中...       │
│ [🔄] Gemini 写作        运行中...       │
│ [⏳] 润色定稿           等待            │
│ [⏳] 配图生成           等待            │
├─────────────────────────────────────────┤
│ 总进度: 2/6 (33%)  已用时: 5m 45s       │
│ 预计剩余: ~12 分钟                      │
└─────────────────────────────────────────┘
```

### 完成

```
🎉 社交媒体内容创作完成！

📝 主题: ${TOPIC}
🎯 平台: ${PLATFORM}
⏱️ 耗时: 18 分钟
📊 字数: 2500 字

📁 产物:
  - input.md (输入)
  - analysis.md (素材分析)
  - outline-1.md, outline-2.md, outline-3.md (提纲)
  - draft-codex.md, draft-gemini.md (草稿)
  - final.md (定稿)
  - image-prompts.json (配图)

🔄 后续:
  - 断点续传: /social-post --run-id=${RUN_ID}
  - 查看定稿: cat ${RUN_DIR}/final.md
  - 生成配图: /image prompt="${RUN_DIR}/image-prompts.json"
```

## 运行目录结构

```
.claude/writing/runs/20260115T100000Z/
├── state.json              # 工作流状态
├── input.md                # 输入主题
├── analysis.md             # Phase 1: 素材分析
├── outline-1.md            # Phase 2: 提纲 1
├── outline-2.md            # Phase 2: 提纲 2
├── outline-3.md            # Phase 2: 提纲 3
├── draft-codex.md          # Phase 3: Codex 草稿
├── draft-gemini.md         # Phase 3: Gemini 草稿
├── final.md                # Phase 4: 定稿
└── image-prompts.json      # Phase 5: 配图提示词
```

## 平台适配

| 平台        | 字数范围  | 风格特点       |
| ----------- | --------- | -------------- |
| wechat      | 1500-4000 | 深度、专业     |
| xiaohongshu | 300-1500  | 轻松、实用、图 |

## 快捷命令

| 命令             | 等效调用                          |
| ---------------- | --------------------------------- |
| /ccg:wechat      | /social-post platform=wechat      |
| /ccg:xiaohongshu | /social-post platform=xiaohongshu |

## 参考资源

- Agent: `agents/social-post-orchestrator/`
- Skills: `skills/writing/`
- 状态文件: `skills/shared/workflow/STATE_FILE.md`
