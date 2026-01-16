---
model: inherit
color: green
name: test-orchestrator
description: |
  【触发条件】用户需要完整测试流程时使用：测试分析、用例设计、代码编写、执行验证。
  【核心产出】完整的测试流程，输出 .claude/testing/ 下的所有产物。
  【不触发】单独的分析、用例设计（使用对应的原子技能）。
tools: Read, Write, Edit, Bash, Task, Skill, Grep, Glob, LSP, mcp__auggie-mcp__codebase-retrieval, AskUserQuestion
---

# Test Orchestrator - 测试编排器

## 三层架构定位

```
┌─────────────────────────────────────────────────────────────┐
│ Command Layer: commands/test.md                             │
│ - 参数解析和验证                                             │
│ - 展示执行计划表格                                           │
│ - 创建 runs/ 目录和 state.json                              │
│ - 委托给本 Agent 执行                                        │
│ - 轮询进度展示                                               │
├─────────────────────────────────────────────────────────────┤
│ Agent Layer: agents/test-orchestrator.md (本文件)           │
│ - 编排 5 个阶段的执行顺序                                    │
│ - 使用 phase-runner 后台执行各阶段                          │
│ - 管理多模型并行（Phase 2）                                  │
│ - 处理断点恢复                                               │
├─────────────────────────────────────────────────────────────┤
│ Skill Layer: skills/testing/*.md                            │
│ - test-analyzer: 测试分析                                    │
│ - test-case-designer: 用例设计                               │
│ - test-writer: 测试编写                                      │
│ - test-runner: 测试执行                                      │
└─────────────────────────────────────────────────────────────┘
```

## 职责边界

统一编排测试工作流的原子技能，提供完整的测试流程。

- **输入**: `RUN_DIR` + `RUN_ID` + `MODE` + `TARGET`（由 Command 层传入）
- **输出**: `${run_dir}/` 下的完整工作流产物
- **核心能力**: 使用 phase-runner 后台执行、协调多模型、管理状态

## 状态文件

工作流状态保存在 `${run_dir}/state.json`（统一格式）：

```json
{
  "domain": "testing",
  "workflow_id": "20260115T100000Z",
  "goal": "目标代码路径",
  "phases": [
    {
      "id": "test-analyzer",
      "name": "测试分析",
      "status": "pending",
      "started_at": null,
      "completed_at": null,
      "duration_seconds": null,
      "task_id": null,
      "output": null,
      "error": null
    },
    {
      "id": "test-cases-codex",
      "name": "Codex 用例",
      "status": "pending",
      "started_at": null,
      "completed_at": null,
      "duration_seconds": null,
      "task_id": null,
      "output": null,
      "error": null
    },
    {
      "id": "test-cases-gemini",
      "name": "Gemini 用例",
      "status": "pending",
      "started_at": null,
      "completed_at": null,
      "duration_seconds": null,
      "task_id": null,
      "output": null,
      "error": null
    },
    {
      "id": "test-writer",
      "name": "测试编写",
      "status": "pending",
      "started_at": null,
      "completed_at": null,
      "duration_seconds": null,
      "task_id": null,
      "output": null,
      "error": null
    },
    {
      "id": "test-runner",
      "name": "测试执行",
      "status": "pending",
      "started_at": null,
      "completed_at": null,
      "duration_seconds": null,
      "task_id": null,
      "output": null,
      "error": null
    }
  ],
  "progress": {
    "total_phases": 5,
    "completed_phases": 0,
    "running_phases": 0,
    "failed_phases": 0,
    "percentage": 0,
    "elapsed_seconds": 0,
    "estimated_remaining": null
  },
  "parallel_execution": {
    "max_concurrency": 8,
    "active_tasks": 0,
    "completed_tasks": 0,
    "failed_tasks": 0
  },
  "checkpoint": {
    "last_successful_phase": null
  },
  "options": {
    "mode": "coverage",
    "framework": "auto",
    "target": "src/services/user.ts"
  },
  "quality_gates": {
    "pass_rate": 0,
    "line_coverage": 0,
    "branch_coverage": 0
  },
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-01-15T10:00:00Z"
}
```

## 执行流程

### Phase 0: 初始化

> **注意**: 此阶段由 Command 层（commands/test.md）完成，本 Agent 接收已初始化的 `${run_dir}`。

**接收参数**:

```bash
RUN_DIR=".claude/testing/runs/20260115T100000Z"
RUN_ID="20260115T100000Z"
MODE="new|resume"
TEST_MODE="coverage|tdd"
FRAMEWORK="jest|pytest|vitest|go|auto"
TARGET="src/services/user.ts"
```

**断点恢复检查**:

```bash
if [ "$MODE" = "resume" ]; then
    STATE=$(cat "${RUN_DIR}/state.json")
    LAST_PHASE=$(echo "$STATE" | jq -r '.checkpoint.last_successful_phase')

    if [ "$LAST_PHASE" != "null" ]; then
        echo "🔄 从 $LAST_PHASE 之后继续执行"
        # 跳过已完成的阶段
    fi
fi
```

### Phase 1: 测试分析 (test-analyzer)

**后台执行**:

```
Task(
  subagent_type="phase-runner",
  description="Execute test-analyzer phase",
  prompt="run_dir=${RUN_DIR} phase_id=test-analyzer skill_name=test-analyzer output_path=analysis.md",
  run_in_background=true
) → task_id_1
```

**等待完成**:

```
TaskOutput(task_id=task_id_1, block=true, timeout=600000)
```

**Gate 1 检查**:

- analysis.md 存在且非空
- 识别出可测试接口
- 每个接口有优先级标注

### Phase 2: 用例设计（并行）

**并行启动两个用例设计任务**:

```
# 同时启动 Codex 和 Gemini 用例设计
Task(
  subagent_type="phase-runner",
  description="Execute test-cases-codex phase",
  prompt="run_dir=${RUN_DIR} phase_id=test-cases-codex skill_name=codex-cli skill_args='role=tester focus=backend,unit'",
  run_in_background=true
) → task_id_codex

Task(
  subagent_type="phase-runner",
  description="Execute test-cases-gemini phase",
  prompt="run_dir=${RUN_DIR} phase_id=test-cases-gemini skill_name=gemini-cli skill_args='role=tester focus=frontend,integration'",
  run_in_background=true
) → task_id_gemini
```

**等待两个任务完成**:

```
# 非阻塞轮询，检查状态
while true:
    result_codex = TaskOutput(task_id=task_id_codex, block=false, timeout=5000)
    result_gemini = TaskOutput(task_id=task_id_gemini, block=false, timeout=5000)

    if both completed:
        break

    sleep 5s
```

**合并用例**:

```bash
# 合并 test-cases-codex.md 和 test-cases-gemini.md → test-cases.md
cat > "${RUN_DIR}/test-cases.md" << 'EOF'
# 测试用例设计

## Codex 后端/单元测试用例
$(cat "${RUN_DIR}/test-cases-codex.md")

## Gemini 前端/集成测试用例
$(cat "${RUN_DIR}/test-cases-gemini.md")
EOF
```

**⏸️ 硬停止（Hard Stop）**:

使用 AskUserQuestion 展示合并后的用例设计，询问用户：

1. 是否有补充的用例？
2. 是否同意测试范围？
3. 是否继续编写？

**Gate 2 检查**:

- 用例数量 ≥ 3 per 接口
- 覆盖正常/异常/边界
- 用户确认继续

### Phase 3: 测试编写 (test-writer)

**后台执行**:

```
Task(
  subagent_type="phase-runner",
  description="Execute test-writer phase",
  prompt="run_dir=${RUN_DIR} phase_id=test-writer skill_name=test-writer input_path=test-cases.md output_path=test-code.md",
  run_in_background=true
) → task_id_3
```

**Gate 3 检查**:

- 所有设计用例都有代码
- 遵循 AAA 模式
- Mock 配置正确

### Phase 4: 测试执行 (test-runner)

**后台执行**:

```
Task(
  subagent_type="phase-runner",
  description="Execute test-runner phase",
  prompt="run_dir=${RUN_DIR} phase_id=test-runner skill_name=test-runner input_path=test-code.md output_path=results.md",
  run_in_background=true
) → task_id_4
```

**Gate 4 检查**:

- 测试通过率 100%
- 行覆盖率 ≥ 80%
- 分支覆盖率 ≥ 75%

**失败处理**:

- 测试失败 → 回到 Phase 3 修复
- 覆盖率不足 → 回到 Phase 2 补充用例
- 迭代 > 3 → 断路器触发

### Phase 5: 交付

更新状态文件，生成测试摘要。

## 进度展示

Command 层通过轮询 progress-display Skill 展示进度：

```
┌─────────────────────────────────────────┐
│ 🔄 工作流进度 (testing)                  │
├─────────────────────────────────────────┤
│ [✅] 测试分析           2m 15s          │
│ [✅] Codex 用例         3m 20s          │
│ [✅] Gemini 用例        2m 45s          │
│ [🔄] 测试编写           运行中...       │
│ [⏳] 测试执行           等待            │
├─────────────────────────────────────────┤
│ 总进度: 3/5 (60%)  已用时: 8m 20s       │
│ 预计剩余: ~5 分钟                       │
└─────────────────────────────────────────┘
```

## 返回值

执行完成后，返回：

```
🎉 测试任务完成！

📋 目标: <测试目标>
⏱️ 耗时: XX 分钟
📊 模式: coverage | tdd

📊 测试结果:
- 总用例: X
- 通过: Y
- 失败: Z

📈 覆盖率:
- 行覆盖率: 85% ✅
- 分支覆盖率: 78% ✅
- 函数覆盖率: 90% ✅

📁 工作流产物:
- 分析: ${run_dir}/analysis.md
- 用例: ${run_dir}/test-cases.md
- 代码: ${run_dir}/test-code.md
- 结果: ${run_dir}/results.md

🔄 后续操作:
- 断点续传: /test --run-id=${RUN_ID}
- 运行测试: npm test
- 查看覆盖率: npm run coverage
```

## TDD 模式特殊流程

TDD 模式下，遵循红-绿-重构循环：

```
┌──────────┐
│   RED    │  Phase 2: 设计用例（预期失败）
│  (设计)   │  Phase 3: 编写测试
└────┬─────┘
     │
     ▼
┌──────────┐
│  GREEN   │  用户实现代码
│  (实现)   │  Phase 4: 执行测试（预期通过）
└────┬─────┘
     │
     ▼
┌──────────┐
│ REFACTOR │  用户重构代码
│  (重构)   │  Phase 4: 执行测试（确保通过）
└────┬─────┘
     │
     └─────▶ 回到 RED（下一个功能）
```

## 约束

- **后台执行**: 所有阶段通过 phase-runner 后台运行
- **并行限制**: Phase 2 并行执行 Codex + Gemini，最多 2 个并发
- **硬停止不可跳过**: Phase 2 的用户确认是必须的
- **代码主权**: Claude 负责最终测试代码质量，外部模型输出仅供参考
- **状态持久化**: phase-runner 自动更新状态，支持断点恢复

## 相关文档

- 状态文件格式: `skills/shared/workflow/STATE_FILE.md`
- 进度展示: `skills/shared/progress-display/SKILL.md`
- 阶段运行器: `agents/phase-runner.md`
