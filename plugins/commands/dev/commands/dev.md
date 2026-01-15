---
description: "开发工作流：上下文检索 → 需求分析 → 原型生成 → 代码实施 → 审计验证"
argument-hint: <feature-description> [--task-type=frontend|backend|fullstack]
allowed-tools: ["Read", "Write", "Bash", "Skill", "AskUserQuestion", "Task"]
---

# /dev - 开发工作流命令

## 使用方式

```bash
/dev <功能描述>                       # 标准开发（fullstack）
/dev --task-type=frontend <描述>     # 前端任务
/dev --task-type=backend <描述>      # 后端任务
```

## 执行流程

本命令**直接编排 Skills**，无 Agent 中间层。

### Phase 1: 初始化

解析参数并创建工作目录：

```bash
# 解析参数
TASK_TYPE="fullstack"
[[ "$ARGUMENTS" =~ --task-type=([^ ]+) ]] && TASK_TYPE="${BASH_REMATCH[1]}"
FEATURE=$(echo "$ARGUMENTS" | sed -E 's/--[a-zA-Z-]+(=[^ ]+)?//g' | xargs)

# 创建运行目录
RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
RUN_DIR=".claude/developing/runs/${RUN_ID}"
mkdir -p "$RUN_DIR"
echo "$FEATURE" > "${RUN_DIR}/input.md"
```

向用户展示执行计划并确认：

```
📋 开发工作流
┌────┬──────────────────┬────────────┐
│ #  │ 阶段             │ 模式       │
├────┼──────────────────┼────────────┤
│ 1  │ 上下文检索       │ auggie+LSP │
│ 2  │ 需求分析         │ 多模型并行 │
│ 3  │ 原型生成         │ 串行       │
│ 4  │ 代码实施         │ Claude主导 │
│ 5  │ 审计验证         │ 多模型并行 │
└────┴──────────────────┴────────────┘

功能: ${FEATURE}
类型: ${TASK_TYPE}

确认执行? [Y/n]
```

使用 AskUserQuestion 确认后继续。

### Phase 2: 上下文检索

调用 context-retriever Skill：

```
Skill("context-retriever", args="run_dir=${RUN_DIR}")
```

**输出**: `${RUN_DIR}/context.md`

**Gate 检查**:

- context.md 存在且非空
- 识别了 3+ 相关文件

### Phase 3: 需求分析（多模型并行）

根据 task_type 路由：

| 类型      | 模型           |
| --------- | -------------- |
| frontend  | 仅 Gemini      |
| backend   | 仅 Codex       |
| fullstack | Codex + Gemini |

调用 multi-model-analyzer Skill（可并行）：

```
Skill("multi-model-analyzer", args="run_dir=${RUN_DIR} model=codex")
Skill("multi-model-analyzer", args="run_dir=${RUN_DIR} model=gemini")
```

**输出**: `${RUN_DIR}/analysis-codex.md`, `${RUN_DIR}/analysis-gemini.md`

**⏸️ 硬停止**: 使用 AskUserQuestion 展示分析摘要，确认方案后继续。

### Phase 4: 原型生成

调用 prototype-generator Skill：

```
Skill("prototype-generator", args="run_dir=${RUN_DIR} task_type=${TASK_TYPE}")
```

**输出**: `${RUN_DIR}/prototype.diff`

**Gate 检查**:

- diff 格式有效
- 代码可编译

### Phase 5: 代码实施

调用 code-implementer Skill：

```
Skill("code-implementer", args="run_dir=${RUN_DIR}")
```

**核心原则**: Claude 是最终交付者，原型只是参考。

**输出**: `${RUN_DIR}/changes.md` + 实际代码变更

**Gate 检查**:

- 类型检查通过
- 语法检查通过

### Phase 6: 审计验证（多模型并行）

调用 audit-reviewer Skill：

```
Skill("audit-reviewer", args="run_dir=${RUN_DIR} model=codex focus=security,performance")
Skill("audit-reviewer", args="run_dir=${RUN_DIR} model=gemini focus=ux,accessibility")
```

**输出**: `${RUN_DIR}/audit-codex.md`, `${RUN_DIR}/audit-gemini.md`

**⏸️ 硬停止**: 展示审计结果，如有 Critical 问题需用户确认。

### Phase 7: 交付

```
🎉 开发任务完成！

📋 任务: ${FEATURE}
⏱️ 耗时: XX 分钟
🔀 类型: ${TASK_TYPE}

📊 审计结果:
- Codex 评分: X/5 (安全/性能)
- Gemini 评分: X/5 (UX/可访问性)

📁 产物:
  ${RUN_DIR}/
  ├── context.md         # 上下文
  ├── analysis-*.md      # 分析报告
  ├── prototype.diff     # 原型
  ├── changes.md         # 变更记录
  └── audit-*.md         # 审计报告

🔄 后续:
  - /commit              # 提交代码
  - gh pr create         # 创建 PR
```

## 循环控制

工作流循环由 `workflow-loop` Hook 控制：

1. 每个 Phase 完成后更新状态
2. Hook 检查是否所有 Phase 完成
3. 未完成则阻止退出，注入下一阶段提示

状态文件: `${RUN_DIR}/workflow.local.md`

```yaml
---
active: true
current_phase: 2
total_phases: 7
completion_promise: "<promise>WORKFLOW_COMPLETE</promise>"
---
```

当 Claude 输出 `<promise>WORKFLOW_COMPLETE</promise>` 时，工作流结束。
