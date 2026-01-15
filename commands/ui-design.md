---
description: UI/UX 设计工作流：需求分析 → 样式推荐 → 设计生成（并行 3 变体）→ UX 检查 → 代码生成 → 质量验证
argument-hint: [--scenario=from_scratch|optimize] [--tech-stack=react|vue] [--run-id=xxx] <设计描述>
allowed-tools: ["Read", "Write", "Bash", "Task", "AskUserQuestion"]
---

# /ui-design - UI/UX 设计工作流命令

## 使用方式

```bash
# 从零设计
/ui-design "设计一个 SaaS Dashboard"

# 优化现有界面
/ui-design --scenario=optimize "优化登录页面"

# 指定技术栈
/ui-design --tech-stack=vue "设计产品展示页"

# 断点续传
/ui-design --run-id=20260115T100000Z
```

## 职责

这是一个轻量级入口 Command，负责：

1. 参数解析和验证
2. 创建运行目录结构（`runs/`）
3. 初始化状态文件（`state.json`）
4. 委托给 `ui-ux-design-orchestrator` Agent 执行

**不负责**：具体的需求分析、设计生成、代码生成等任务（由 Agent 和 Skills 完成）。

## 执行流程

### 步骤 0: 参数解析

**选项解析**:

| 选项                 | 说明                             | 默认值       |
| -------------------- | -------------------------------- | ------------ |
| `--scenario=value`   | 设计场景 (from_scratch/optimize) | from_scratch |
| `--tech-stack=value` | 技术栈 (react/vue)               | react        |
| `--run-id=<id>`      | 使用指定 run-id（断点续传）      | -            |

**解析逻辑**:

```bash
# 初始化选项对象
OPTIONS='{}'

# 解析各选项
[[ "$ARGUMENTS" =~ --scenario=([^ ]+) ]] && OPTIONS=$(echo "$OPTIONS" | jq --arg v "${BASH_REMATCH[1]}" '. + {scenario: $v}')
[[ "$ARGUMENTS" =~ --tech-stack=([^ ]+) ]] && OPTIONS=$(echo "$OPTIONS" | jq --arg v "${BASH_REMATCH[1]}" '. + {tech_stack: $v}')

# 提取设计描述（排除选项后的剩余部分）
DESCRIPTION=$(echo "$ARGUMENTS" | sed -E 's/--[a-zA-Z-]+(=[^ ]+)?//g' | xargs)
```

### 步骤 1: 初始化运行环境

**断点续传检查**:

```bash
if [[ "$ARGUMENTS" =~ --run-id=([^ ]+) ]]; then
    RUN_ID="${BASH_REMATCH[1]}"
    RUN_DIR=".claude/ui-ux-design/runs/${RUN_ID}"
    if [ ! -d "$RUN_DIR" ]; then
        echo "❌ 错误: 运行目录不存在: $RUN_DIR"
        exit 1
    fi
    MODE="resume"
    echo "🔄 恢复工作目录: $RUN_DIR"
else
    MODE="new"
fi
```

**新建运行（使用 workflow-run-initializer Skill）**:

```bash
if [ "$MODE" = "new" ]; then
    PHASES='["initialization","requirement","style","design","ux_check","code","quality","delivery"]'

    # 调用共用 Skill 创建运行环境和 state.json V2
    INIT_RESULT=$(Skill("workflow-run-initializer",
                        args="domain=ui-ux-design goal=\"${DESCRIPTION}\" phases='${PHASES}' options='${OPTIONS}'"))

    # 提取结果
    if [ "$(echo "$INIT_RESULT" | jq -r '.success')" != "true" ]; then
        echo "❌ 初始化失败: $(echo "$INIT_RESULT" | jq -r '.error')"
        exit 1
    fi

    RUN_DIR=$(echo "$INIT_RESULT" | jq -r '.run_dir')
    RUN_ID=$(echo "$INIT_RESULT" | jq -r '.run_id')

    echo "📂 创建工作目录: $RUN_DIR"
    echo "🔧 初始化状态: state.json (V2 格式)"
fi
```

### 步骤 2: 委托给 Orchestrator

**调用 ui-ux-design-orchestrator Agent**:

```
Task(
  subagent_type="ui-ux-design-orchestrator",
  description="Execute UI/UX design workflow",
  prompt="请执行 UI/UX 设计工作流。

运行参数:
- RUN_DIR: ${RUN_DIR}
- RUN_ID: ${RUN_ID}
- MODE: ${MODE}
- OPTIONS: ${OPTIONS}
- DESCRIPTION: ${DESCRIPTION}

状态文件位置: ${RUN_DIR}/state.json

请按照 ui-ux-design-orchestrator.md 的规范执行阶段：
1. 初始化与场景识别（Hard Stop）
2. 需求分析（requirement-analyzer）
3. 样式推荐（style-recommender）
4. 设计方案生成（design-variant-generator）- 并行 3 个变体
5. UX 准则检查（ux-guideline-checker）
6. 代码生成（code-generator）
7. 质量验证（quality-validator）
8. 交付确认

完成后返回设计结果。"
)
```

## 输出示例

### 新建工作流

```
👉 启动 UI/UX 设计工作流: /ui-design 设计一个 SaaS Dashboard

📂 创建工作目录: .claude/ui-ux-design/runs/20260115T100000Z/
🔧 初始化状态: state.json

🚀 委托给 ui-ux-design-orchestrator...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ui-ux-design-orchestrator 输出...]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ UI/UX 设计完成！

📊 质量指标:
- UX 通过率: 86.7%
- 质量评分: 8.5/10
- 设计还原度: 88%

📁 工作流产物:
  - 需求分析: requirements.md
  - 设计方案: design-A.md
  - 代码目录: code/react-tailwind/
  - 质量报告: quality-report.md

🔄 如需继续:
  - 断点续传: /ui-design --run-id=20260115T100000Z
```

## 运行目录结构

每次调用创建独立的运行目录：

```
.claude/ui-ux-design/runs/20260115T100000Z/
├── state.json                 # 工作流状态（V2 格式）
├── requirements.md            # Phase 1 产出
├── style-recommendations.md   # Phase 2 产出
├── design-A.md                # Phase 3 产出（并行）
├── design-B.md                # Phase 3 产出（并行）
├── design-C.md                # Phase 3 产出（并行）
├── ux-check-report.md         # Phase 4 产出
├── code/                      # Phase 5 产出
│   └── react-tailwind/
│       ├── components/
│       ├── pages/
│       ├── styles/
│       ├── package.json
│       └── README.md
└── quality-report.md          # Phase 6 产出
```

## 共用 Skills

本 Command 使用以下共用 Skills：

| Skill                    | 用途                      | 调用层  |
| ------------------------ | ------------------------- | ------- |
| workflow-run-initializer | 创建运行目录和 state.json | Command |
| workflow-state-manager   | 原子性状态更新            | Agent   |
| workflow-file-validator  | Gate 文件验证             | Agent   |

## 工作流阶段映射

| 阶段 | 原子技能                 | 输入             | 输出                     |
| ---- | ------------------------ | ---------------- | ------------------------ |
| 0    | (Hard Stop)              | -                | 场景/技术栈确认          |
| 1    | requirement-analyzer     | run_dir + desc   | requirements.md          |
| 2    | style-recommender        | run_dir + req    | style-recommendations.md |
| 3    | design-variant-generator | run_dir + style  | design-A/B/C.md          |
| 4    | ux-guideline-checker     | run_dir + design | ux-check-report.md       |
| 5    | code-generator           | run_dir + design | code/                    |
| 6    | quality-validator        | run_dir + code   | quality-report.md        |

## 错误处理

### run-id 不存在

```
❌ 错误: 运行目录不存在: .claude/ui-ux-design/runs/20260115T999999Z
提示: 使用 /ui-design 创建新工作流
```

### UX 检查失败

```
⚠️  UX 检查未通过
通过率: 72% (需要 ≥ 80%)
高优先级问题: 3 个

正在自动重新生成设计方案...
```

## 注意事项

1. **委托模式**: Command 不执行具体任务，只负责初始化和委托
2. **状态隔离**: 每个 run-id 有独立的目录和状态文件
3. **幂等性**: 相同 run-id 多次调用应安全（由 orchestrator 处理）
4. **路径传递**: 传递 RUN_DIR 和 RUN_ID，不传递文件内容
5. **并行执行**: Phase 3 并行生成 3 个设计变体

## 参考资源

- Agent: `agents/ui-ux-design-orchestrator.md`
- Skills: `skills/ui-ux/`
