---
description: 文章工作流：分析 → 大纲 → 写作(并行3) → 润色
argument-hint: <topic-or-file> [--run-id=xxx] [--no-parallel]
allowed-tools: ["Read", "Write", "Bash", "Task"]
---

# /article - 文章工作流命令

## 使用方式

```bash
# 基本用法
/article "AI 的未来趋势分析"

# 指定 run-id（用于断点续传）
/article --run-id=20260114T100000Z

# 禁用并行写作（仅生成 1 个草稿）
/article "主题" --no-parallel

# 从文件输入
/article path/to/input.md
```

## 职责

这是一个轻量级入口 Command，负责：

1. 参数解析和验证
2. 创建运行目录结构（`runs/`）
3. 初始化状态文件（`state.json`）
4. 委托给 `writer-orchestrator` Agent 执行

**不负责**：具体的分析、写作、润色等任务（由 Agent 和 Skills 完成）。

## 执行流程

### 步骤 0: 参数解析

**输入处理**:

```bash
# 解析第一个参数
if [ -f "$ARGUMENTS" ]; then
    # 文件路径 → 读取文件内容
    TOPIC=$(cat "$ARGUMENTS")
elif [ -n "$ARGUMENTS" ]; then
    # 字符串 → 直接作为主题
    TOPIC="$ARGUMENTS"
else
    echo "❌ 错误: 请提供主题或文件路径"
    echo "用法: /article \"主题\" 或 /article path/to/file.md"
    exit 1
fi
```

**选项解析**:

- `--run-id=<id>`: 使用指定 run-id（断点续传）
- `--no-parallel`: 禁用并行写作
- `--style=<technical|accessible|narrative>`: 指定单一风格（与 --no-parallel 配合使用）

### 步骤 1: 初始化运行环境

**生成 run-id**:

```bash
# 如果未提供 --run-id，生成新 ID（UTC 时间戳格式）
if [[ "$ARGUMENTS" =~ --run-id=([^ ]+) ]]; then
    RUN_ID="${BASH_REMATCH[1]}"
    MODE="resume"
else
    RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
    MODE="new"
fi
```

**创建运行目录**:

```bash
RUN_DIR=".claude/writing/runs/${RUN_ID}"

if [ "$MODE" = "new" ]; then
    mkdir -p "$RUN_DIR"
    echo "📂 创建工作目录: $RUN_DIR"
elif [ ! -d "$RUN_DIR" ]; then
    echo "❌ 错误: 运行目录不存在: $RUN_DIR"
    exit 1
else
    echo "🔄 恢复工作目录: $RUN_DIR"
fi
```

**初始化 state.json** (仅新建模式):

```bash
if [ "$MODE" = "new" ]; then
    cat > "$RUN_DIR/state.json" <<EOF
{
  "run_id": "$RUN_ID",
  "run_dir": "$RUN_DIR",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "topic": "$TOPIC",
  "steps": {
    "analyzer": { "status": "pending" },
    "outliner": { "status": "pending" },
    "writer-1": { "status": "pending" },
    "writer-2": { "status": "pending" },
    "writer-3": { "status": "pending" },
    "polisher": { "status": "pending" }
  }
}
EOF

    echo "🔧 初始化状态: state.json"
fi
```

**写入 input.md** (仅新建模式):

```bash
if [ "$MODE" = "new" ]; then
    echo "$TOPIC" > "$RUN_DIR/input.md"
    echo "📝 写入主题: input.md"
fi
```

### 步骤 2: 委托给 Orchestrator

**调用 writer-orchestrator Agent**:

```
Task(
  subagent_type="writer-orchestrator",
  description="Execute writing workflow",
  prompt="请执行写作工作流。

运行参数:
- RUN_DIR: ${RUN_DIR}
- RUN_ID: ${RUN_ID}
- MODE: ${MODE}

状态文件位置: ${RUN_DIR}/state.json
输入文件位置: ${RUN_DIR}/input.md

请按照 writer-orchestrator.md 的规范执行 4 个阶段：
1. 分析主题（article-analyzer）
2. 生成大纲（article-outliner）
3. 并行写作（article-writer x3）
4. 润色定稿（article-polisher）

完成后返回最终文章路径。"
)
```

## 输出示例

### 新建工作流

```
👉 启动写作工作流: /article "AI 在医疗诊断中的应用前景"

📂 创建工作目录: .claude/writing/runs/20260114T103000Z/
📝 写入主题: input.md
🔧 初始化状态: state.json

🚀 委托给 writer-orchestrator...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[writer-orchestrator 输出...]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 文章创作完成！

📄 最终文章: .claude/writing/runs/20260114T103000Z/final.md
📊 工作流产物:
  - 主题分析: analysis.md
  - 文章大纲: outline.md
  - 草稿变体: draft-{1,2,3}.md
  - 最终定稿: final.md

🔄 如需修改:
  - 重新运行: /article --run-id=20260114T103000Z
  - 查看最终版本: cat .claude/writing/runs/20260114T103000Z/final.md
```

### 断点续传

```
👉 恢复写作工作流: /article --run-id=20260114T103000Z

🔄 恢复工作目录: .claude/writing/runs/20260114T103000Z/
🔍 检查状态: state.json

状态检查:
✅ analyzer - 已完成
✅ outliner - 已完成
⏸️  writer-1 - 待执行
⏸️  writer-2 - 待执行
⏸️  writer-3 - 待执行
⏸️  polisher - 待执行

🚀 继续执行 writer-orchestrator...

[后续流程...]
```

## 错误处理

### 参数缺失

```
❌ 错误: 请提供主题或文件路径
用法: /article "主题" 或 /article path/to/file.md
```

### run-id 不存在

```
❌ 错误: 运行目录不存在: .claude/writing/runs/20260114T999999Z
提示: 使用 /article "主题" 创建新工作流
```

### state.json 损坏

```
⚠️  警告: 状态文件损坏或格式不正确
建议:
1. 手动修复 .claude/writing/runs/20260114T103000Z/state.json
2. 或创建新工作流: /article "主题"
```

## 注意事项

1. **委托模式**: Command 不执行具体任务，只负责初始化和委托
2. **状态隔离**: 每个 run-id 有独立的目录和状态文件
3. **幂等性**: 相同 run-id 多次调用应安全（由 orchestrator 处理）
4. **路径传递**: 传递 RUN_DIR 和 RUN_ID，不传递文件内容

## 参考资源

- Agent: `agents/writer-orchestrator.md`
- State File V2: `skills/shared/workflow/STATE_FILE_V2.md`
- Planning: `.claude/planning/1-phase1-article-workflow-prototype.md`
