---
description: "UI/UX 设计工作流 v2.0：需求分析 → 样式推荐 → 设计生成（并行 3 变体）→ UX 检查 → 代码生成（双模型协作）→ 质量验证"
argument-hint: "[--image=<path>] [--scenario=from_scratch|optimize] [--tech-stack=react|vue] [--run-id=xxx] <设计描述>"
allowed-tools:
  - Task
  - AskUserQuestion
  - Read
  - Write
  - Bash
  - TaskOutput
---

# /ui-design - UI/UX 设计工作流命令 v2.0

## 执行模型

```
┌─────────────────────────────────────────────────────────────┐
│  自动执行（无需询问）    │  硬停止（必须询问）                  │
├─────────────────────────────────────────────────────────────┤
│  Phase 1 → Phase 2      │  ⏸️ Phase 2: 场景确认               │
│  Phase 2.5（如有图片）  │  ⏸️ Phase 5: 方案选择               │
│  Phase 3 → Phase 4      │                                      │
│  Phase 6 → Phase 7      │                                      │
│  Phase 7 → Phase 8      │                                      │
│  Phase 8 → Phase 9      │                                      │
│  Phase 9 → Phase 10     │                                      │
└─────────────────────────────────────────────────────────────┘
```

## 阶段流程

```
Phase 1: 初始化        → 创建 RUN_DIR
Phase 2: 场景确认      → AskUserQuestion（⏸️ 硬停止）
Phase 2.5: 图片分析    → Task(image-analyzer)【仅当有 --image 参数时】
Phase 3: 需求分析      → Task(requirement-analyzer) → 自动继续 ↓
Phase 4: 样式推荐      → Task(style-recommender) → 自动继续 ↓
Phase 5: 方案选择      → AskUserQuestion（⏸️ 硬停止）
Phase 6: 设计生成      → Task(design-variant-generator) × 3 并行 → 自动继续 ↓
Phase 7: UX 检查       → Task(ux-guideline-checker) → 自动继续 ↓
                       ├─ 通过 → Phase 8
                       └─ 失败 → 返回 Phase 6 重新生成
Phase 8: 代码生成      → Task(gemini-prototype) → Task(claude-refactor) → 自动继续 ↓
Phase 9: 质量验证      → Task(quality-validator) → 自动继续 ↓
Phase 10: 交付         → 输出摘要
```

---

## Phase 1: 初始化

### 参数解析

| 选项                 | 说明                             | 默认值       |
| -------------------- | -------------------------------- | ------------ |
| `--image=<path>`     | 参考图片路径（启用图片分析）     | -            |
| `--scenario=value`   | 设计场景 (from_scratch/optimize) | from_scratch |
| `--tech-stack=value` | 技术栈 (react/vue)               | react        |
| `--run-id=<id>`      | 使用指定 run-id（断点续传）      | -            |

### 运行目录创建

```bash
if [[ "$ARGUMENTS" =~ --run-id=([^ ]+) ]]; then
    RUN_ID="${BASH_REMATCH[1]}"
    RUN_DIR=".claude/ui-design/runs/${RUN_ID}"
    MODE="resume"
else
    MODE="new"
    RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
    RUN_DIR=".claude/ui-design/runs/${RUN_ID}"
    mkdir -p "$RUN_DIR"
fi
```

---

## Phase 2: 场景确认

### ⏸️ 硬停止

使用 AskUserQuestion 确认：

- 设计场景（从零设计 / 优化现有）
- 技术栈偏好（React + Tailwind / Vue + Tailwind）

---

## Phase 2.5: 图片分析（仅当有 --image 参数）

**触发条件**：用户提供了 `--image=<path>` 参数

### Agent 调用

```
Task(
  subagent_type="general-purpose",
  description="Analyze design image",
  prompt="You are the image-analyzer agent. Read plugins/ui-design/agents/analysis/image-analyzer.md. Execute with: run_dir=${RUN_DIR} image_path=${IMAGE_PATH}",
  run_in_background=true
)
```

**产出**：`${run_dir}/image-analysis.md`

---

## Phase 3: 需求分析

### Agent 调用

```
Task(
  subagent_type="general-purpose",
  description="Analyze requirements",
  prompt="You are the requirement-analyzer agent. Read plugins/ui-design/agents/analysis/requirement-analyzer.md. Execute with: run_dir=${RUN_DIR} description=${DESCRIPTION}",
  run_in_background=false
)
```

**产出**：`${run_dir}/requirements.md`

**如果是 optimize 场景**，同时调用：

```
Task(
  subagent_type="general-purpose",
  description="Analyze existing code",
  prompt="You are the existing-code-analyzer agent. Read plugins/ui-design/agents/analysis/existing-code-analyzer.md. Execute with: run_dir=${RUN_DIR}",
  run_in_background=true
)
```

---

## Phase 4: 样式推荐

### Agent 调用

```
Task(
  subagent_type="general-purpose",
  description="Generate style recommendations",
  prompt="You are the style-recommender agent. Read plugins/ui-design/agents/design/style-recommender.md. Execute with: run_dir=${RUN_DIR}",
  run_in_background=false
)
```

**产出**：

- `${run_dir}/style-recommendations.md`
- `${run_dir}/previews/index.html`
- `${run_dir}/previews/preview-A.html`
- `${run_dir}/previews/preview-B.html`
- `${run_dir}/previews/preview-C.html`

---

## Phase 5: 方案选择

### ⏸️ 硬停止

1. 提示用户打开 HTML 预览：

```
🎨 设计方案已生成！请在浏览器中预览：
   open ${RUN_DIR}/previews/index.html
```

2. 使用 AskUserQuestion 询问选择：
   - 生成全部 3 个方案（并行）（推荐）
   - 仅生成方案 A
   - 仅生成方案 B
   - 仅生成方案 C

---

## Phase 6: 设计生成（并行执行）

### Agent 并行调用

**如果用户选择"生成全部 3 个方案"**：

```
Task(
  subagent_type="general-purpose",
  description="Generate design variant A",
  prompt="You are the design-variant-generator agent. Read plugins/ui-design/agents/design/design-variant-generator.md. Execute with: run_dir=${RUN_DIR} variant_id=A",
  run_in_background=true
)

Task(
  subagent_type="general-purpose",
  description="Generate design variant B",
  prompt="You are the design-variant-generator agent. Read plugins/ui-design/agents/design/design-variant-generator.md. Execute with: run_dir=${RUN_DIR} variant_id=B",
  run_in_background=true
)

Task(
  subagent_type="general-purpose",
  description="Generate design variant C",
  prompt="You are the design-variant-generator agent. Read plugins/ui-design/agents/design/design-variant-generator.md. Execute with: run_dir=${RUN_DIR} variant_id=C",
  run_in_background=true
)

# 使用 TaskOutput 等待所有任务完成
```

**产出**：`${run_dir}/design-{A,B,C}.md`

---

## Phase 7: UX 检查（带重试）

### Agent 调用

对每个生成的设计变体：

```
Task(
  subagent_type="general-purpose",
  description="Check UX guidelines for variant ${variant}",
  prompt="You are the ux-guideline-checker agent. Read plugins/ui-design/agents/validation/ux-guideline-checker.md. Execute with: run_dir=${RUN_DIR} variant_id=${variant}",
  run_in_background=false
)
```

**判定条件**：

- 通过率 ≥ 80% 且高优先级问题 = 0 → 通过
- 否则 → 返回 Phase 6 重新生成（最多重试 2 次）

**产出**：`${run_dir}/ux-check-report.md`

---

## Phase 8: 代码生成（双模型协作）

### Step 1: Gemini 原型生成

```
Task(
  subagent_type="general-purpose",
  description="Gemini prototype generation",
  prompt="You are the gemini-prototype-generator agent. Read plugins/ui-design/agents/generation/gemini-prototype-generator.md. Execute with: run_dir=${RUN_DIR} variant_id=${FINAL_VARIANT} tech_stack=${TECH_STACK}",
  run_in_background=false
)
```

**产出**：`${run_dir}/code/gemini-raw/`

### Step 2: Claude 重构精简

```
Task(
  subagent_type="general-purpose",
  description="Claude code refactor",
  prompt="You are the claude-code-refactor agent. Read plugins/ui-design/agents/generation/claude-code-refactor.md. Execute with: run_dir=${RUN_DIR} tech_stack=${TECH_STACK}",
  run_in_background=false
)
```

**产出**：`${run_dir}/code/${tech_stack}/`

---

## Phase 9: 质量验证

### Agent 调用

```
Task(
  subagent_type="general-purpose",
  description="Validate code quality",
  prompt="You are the quality-validator agent. Read plugins/ui-design/agents/validation/quality-validator.md. Execute with: run_dir=${RUN_DIR} variant_id=${FINAL_VARIANT} tech_stack=${TECH_STACK}",
  run_in_background=false
)
```

**判定条件**：总分 ≥ 7.5/10

**产出**：`${run_dir}/quality-report.md`

---

## Phase 10: 交付

输出完成摘要：

```
🎉 UI/UX 设计完成！

📋 任务: ${DESCRIPTION}
🎨 选定方案: 方案 ${FINAL_VARIANT}
🔧 技术栈: ${TECH_STACK}

📊 质量指标:
- UX 通过率: ${UX_PASS_RATE}%
- 质量评分: ${QUALITY_SCORE}/10

📁 产物:
  ${RUN_DIR}/
  ├── requirements.md           # 需求分析
  ├── style-recommendations.md  # 样式推荐
  ├── design-${FINAL_VARIANT}.md  # 最终设计规格
  ├── ux-check-report.md        # UX 检查报告
  ├── code/${TECH_STACK}/       # 生成代码
  └── quality-report.md         # 质量报告

🔄 后续:
  - 断点续传: /ui-design --run-id=${RUN_ID}
  - 安装依赖: cd ${RUN_DIR}/code/${TECH_STACK} && npm install
  - 启动开发: npm run dev
```

---

## 运行目录结构

```
.claude/ui-design/runs/20260115T100000Z/
├── state.json                 # 工作流状态
├── input.md                   # 原始输入
├── requirements.md            # Phase 3 产出
├── style-recommendations.md   # Phase 4 产出
├── previews/                  # Phase 4 产出（HTML 预览）
│   ├── index.html
│   ├── preview-A.html
│   ├── preview-B.html
│   └── preview-C.html
├── design-A.md                # Phase 6 产出（并行）
├── design-B.md
├── design-C.md
├── ux-check-report.md         # Phase 7 产出
├── code/                      # Phase 8 产出
│   ├── gemini-raw/            # Gemini 原型（保留用于调试）
│   └── ${tech_stack}/         # 最终代码
└── quality-report.md          # Phase 9 产出
```

---

## Agent 目录结构

```
plugins/ui-design/agents/
├── analysis/
│   ├── image-analyzer.md         # 8 并行 Gemini 视觉分析
│   ├── requirement-analyzer.md   # 需求解析 (auggie + Gemini)
│   └── existing-code-analyzer.md # 现有代码分析
├── design/
│   ├── style-recommender.md      # 3 变体样式推荐
│   └── design-variant-generator.md # 设计规格生成
├── validation/
│   ├── ux-guideline-checker.md   # UX 准则检查
│   └── quality-validator.md      # 代码质量验证
└── generation/
    ├── gemini-prototype-generator.md # Gemini 原型生成 (70%)
    └── claude-code-refactor.md       # Claude 重构精简 (95%)
```

---

## 约束

- 不跳过任何 Phase
- 每个 Phase 必须调用对应的 Agent（通过 Task 工具）
- 硬停止点必须等待用户确认
- Phase 6 并行执行设计生成
- Phase 7 失败需要重试（最多 2 次）
- Phase 8 使用双模型协作（Gemini + Claude）
