---
description: 迁移初始化工作流：项目扫描 → 技术栈检测 → 代码分析(并行) → 质量审计(并行) → 策略生成 → 文档生成
argument-hint: [--path=<project>] [--deep] [--run-id=xxx]
allowed-tools: ["Read", "Write", "Bash", "Task", "AskUserQuestion"]
---

# /init - 迁移初始化工作流命令

## 使用方式

```bash
# 当前目录初始化
/init

# 指定项目路径
/init --path=/path/to/project

# 深度分析（包含安全审计、技术债扫描）
/init --deep

# 断点续传
/init --run-id=20260115T100000Z
```

## 职责

这是一个轻量级入口 Command，负责：

1. 参数解析和验证
2. 创建运行目录结构（`runs/`）
3. 初始化状态文件（`state.json`）
4. 委托给 `migration-init-orchestrator` Agent 执行

**不负责**：具体的项目扫描、代码分析、文档生成等任务（由 Agent 和 Skills 完成）。

## 执行流程

### 步骤 0: 参数解析

**选项解析**:

| 选项            | 说明                        | 默认值       |
| --------------- | --------------------------- | ------------ |
| `--path=value`  | 目标项目路径                | 当前工作目录 |
| `--deep`        | 启用深度分析（安全+技术债） | false        |
| `--run-id=<id>` | 使用指定 run-id（断点续传） | -            |

**解析逻辑**:

```bash
# 初始化选项对象
OPTIONS='{}'

# 解析各选项
[[ "$ARGUMENTS" =~ --path=([^ ]+) ]] && OPTIONS=$(echo "$OPTIONS" | jq --arg v "${BASH_REMATCH[1]}" '. + {project_path: $v}')
[[ "$ARGUMENTS" =~ --deep ]] && OPTIONS=$(echo "$OPTIONS" | jq '. + {deep_analysis: true}')

# 默认项目路径为当前目录
if [ -z "$(echo "$OPTIONS" | jq -r '.project_path // empty')" ]; then
    OPTIONS=$(echo "$OPTIONS" | jq --arg v "$(pwd)" '. + {project_path: $v}')
fi

# 提取项目名称（用于描述）
PROJECT_NAME=$(basename "$(echo "$OPTIONS" | jq -r '.project_path')")
```

### 步骤 1: 初始化运行环境

**断点续传检查**:

```bash
if [[ "$ARGUMENTS" =~ --run-id=([^ ]+) ]]; then
    RUN_ID="${BASH_REMATCH[1]}"
    RUN_DIR=".claude/migration/runs/${RUN_ID}"
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
    PHASES='["initialization","project_scan","tech_detection","code_analysis","quality_audit","strategy","documentation","summary"]'

    # 调用共用 Skill 创建运行环境和 state.json V2
    INIT_RESULT=$(Skill("workflow-run-initializer",
                        args="domain=migration goal=\"初始化项目 ${PROJECT_NAME} 的迁移分析\" phases='${PHASES}' options='${OPTIONS}'"))

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

**调用 migration-init-orchestrator Agent**:

```
Task(
  subagent_type="migration-init-orchestrator",
  description="Execute migration initialization workflow",
  prompt="请执行迁移初始化工作流。

运行参数:
- RUN_DIR: ${RUN_DIR}
- RUN_ID: ${RUN_ID}
- MODE: ${MODE}
- OPTIONS: ${OPTIONS}
- PROJECT_PATH: $(echo "$OPTIONS" | jq -r '.project_path')
- DEEP_ANALYSIS: $(echo "$OPTIONS" | jq -r '.deep_analysis // false')

状态文件位置: ${RUN_DIR}/state.json

请按照 migration-init-orchestrator.md 的规范执行阶段：
1. 项目扫描（project-scanner）
2. 技术栈检测（tech-stack-detector）
3. 代码分析（backend-analyzer + frontend-analyzer + dependency-mapper）- 并行
4. 质量审计（eol-checker + tech-debt-scanner + security-auditor）- 并行（如果 --deep）
5. 策略生成（migration-advisor）
6. 文档生成（claude-doc-generator + module-doc-generator）
7. 汇总报告（migration-summary-generator）

完成后返回迁移分析结果。"
)
```

## 输出示例

### 新建工作流

```
👉 启动迁移初始化工作流: /init --path=/path/to/legacy-erp

📂 创建工作目录: .claude/migration/runs/20260115T100000Z/
🔧 初始化状态: state.json

🚀 委托给 migration-init-orchestrator...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[migration-init-orchestrator 输出...]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 迁移初始化分析完成！

📊 关键指标:
- 项目类型: Java Maven
- 技术栈: Java 8 + Spring 4.3
- 健康度评分: 65/100

📁 工作流产物:
  - 项目结构: project-structure.json
  - 技术栈: tech-stack.json
  - 后端分析: backend-analysis.md
  - 迁移策略: migration-strategy.md
  - 根文档: CLAUDE.md

🔄 如需继续:
  - 断点续传: /init --run-id=20260115T100000Z
```

## 运行目录结构

每次调用创建独立的运行目录：

```
.claude/migration/runs/20260115T100000Z/
├── state.json                 # 工作流状态（V2 格式）
├── context/
│   ├── project-structure.json # Phase 1 产出
│   └── tech-stack.json        # Phase 2 产出
├── analysis/
│   ├── backend-analysis.md    # Phase 3 产出（并行）
│   ├── frontend-analysis.md   # Phase 3 产出（并行，可选）
│   └── dependency-map.md      # Phase 3 产出（并行）
├── audit/                     # Phase 4 产出（--deep 时）
│   ├── eol-report.md
│   ├── tech-debt-report.md
│   └── security-report.md
└── reports/
    ├── migration-strategy.md  # Phase 5 产出
    └── SUMMARY.md             # Phase 7 产出

项目根目录/
├── CLAUDE.md                  # Phase 6 产出
└── src/
    └── */CLAUDE.md            # Phase 6 产出（模块文档）
```

## 共用 Skills

本 Command 使用以下共用 Skills：

| Skill                    | 用途                      | 调用层  |
| ------------------------ | ------------------------- | ------- |
| workflow-run-initializer | 创建运行目录和 state.json | Command |
| workflow-state-manager   | 原子性状态更新            | Agent   |
| workflow-file-validator  | Gate 文件验证             | Agent   |

## 工作流阶段映射

| 阶段 | 原子技能                         | 输入           | 输出                           |
| ---- | -------------------------------- | -------------- | ------------------------------ |
| 1    | project-scanner                  | run_dir + path | context/project-structure.json |
| 2    | tech-stack-detector              | run_dir        | context/tech-stack.json        |
| 3    | backend-analyzer (并行)          | run_dir        | analysis/backend-analysis.md   |
| 3    | frontend-analyzer (并行)         | run_dir        | analysis/frontend-analysis.md  |
| 3    | dependency-mapper (并行)         | run_dir        | analysis/dependency-map.md     |
| 4    | eol-checker (并行, --deep)       | run_dir        | audit/eol-report.md            |
| 4    | tech-debt-scanner (并行, --deep) | run_dir        | audit/tech-debt-report.md      |
| 4    | security-auditor (并行, --deep)  | run_dir        | audit/security-report.md       |
| 5    | migration-advisor                | run_dir        | reports/migration-strategy.md  |
| 6    | claude-doc-generator             | run_dir + path | ${path}/CLAUDE.md              |
| 6    | module-doc-generator             | run_dir + path | ${path}/src/\*/CLAUDE.md       |
| 7    | migration-summary-generator      | run_dir        | reports/SUMMARY.md             |

## 错误处理

### run-id 不存在

```
❌ 错误: 运行目录不存在: .claude/migration/runs/20260115T999999Z
提示: 使用 /init 创建新工作流
```

### 项目路径不存在

```
❌ 错误: 项目路径不存在: /invalid/path
提示: 使用 --path 指定有效的项目路径
```

## 注意事项

1. **委托模式**: Command 不执行具体任务，只负责初始化和委托
2. **状态隔离**: 每个 run-id 有独立的目录和状态文件
3. **幂等性**: 相同 run-id 多次调用应安全（由 orchestrator 处理）
4. **路径传递**: 传递 RUN_DIR 和 RUN_ID，不传递文件内容
5. **并行执行**: Phase 3 和 Phase 4 支持并行执行

## 参考资源

- Agent: `agents/migration-init-orchestrator.md`
- Skills: `skills/migration/`
