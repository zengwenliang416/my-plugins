# Orchestrator 标准模板

**版本**: 2.0
**基于**: `docs/orchestrator-contract.md` 统一契约规范
**用途**: 所有 orchestrator 实施的参考模板

## 模板说明

本模板提供了实施新 orchestrator 的完整结构，包含：

1. Command 层（入口）
2. Agent 层（编排）
3. Skill 层（执行）的标准定义

使用本模板时，替换所有 `{placeholder}` 为实际值。

---

## 1. Command 层模板

**文件位置**: `commands/{command-name}.md`

```markdown
---
description: { 工作流一句话描述 }
argument-hint: <required-arg> [--run-id=xxx] [--option1] [--option2]
allowed-tools: ["Read", "Write", "Bash", "Task"]
---

# /{command-name} - {工作流名称}

## 使用方式

\`\`\`bash

# 基本用法

/{command-name} <required-arg>

# 指定 run-id（用于断点续传）

/{command-name} --run-id=20260114T100000Z

# 带选项

/{command-name} <arg> --option1 --option2
\`\`\`

## 职责

这是一个轻量级入口 Command，负责：

1. 参数解析和验证
2. 创建运行目录结构（`runs/`）
3. 初始化状态文件（`state.json`）
4. 委托给 `{domain}-orchestrator` Agent 执行

**不负责**：具体的业务逻辑执行（由 Agent 和 Skills 完成）。

## 执行流程

### 步骤 0: 参数解析

**输入处理**:

\`\`\`bash

# 解析必需参数

if [ -z "$ARGUMENTS" ]; then
echo "❌ 错误: 请提供 {required-arg}"
echo "用法: /{command-name} <{required-arg}> [选项]"
exit 1
fi

# 提取第一个参数

ARG=$(echo "$ARGUMENTS" | awk '{print $1}')

# 如果参数是文件路径，读取内容

if [ -f "$ARG" ]; then
CONTENT=$(cat "$ARG")
else
CONTENT="$ARG"
fi
\`\`\`

**选项解析**:

- `--run-id=<id>`: 使用指定 run-id（断点续传）
- `--option1`: {选项1说明}
- `--option2`: {选项2说明}

### 步骤 1: 初始化运行环境

**生成 run-id**:

\`\`\`bash

# 如果未提供 --run-id，生成新 ID（UTC 时间戳格式）

if [["$ARGUMENTS" =~ --run-id=([^ ]+)]]; then
RUN_ID="${BASH_REMATCH[1]}"
    MODE="resume"
else
    RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
MODE="new"
fi
\`\`\`

**创建运行目录**:

\`\`\`bash
RUN_DIR=".claude/{domain}/runs/${RUN_ID}"

if [ "$MODE" = "new" ]; then
mkdir -p "$RUN_DIR"
    echo "📂 创建工作目录: $RUN_DIR"
elif [ ! -d "$RUN_DIR" ]; then
echo "❌ 错误: 运行目录不存在: $RUN_DIR"
exit 1
else
echo "🔄 恢复工作目录: $RUN_DIR"
fi
\`\`\`

**初始化 state.json** (仅新建模式):

\`\`\`bash
if [ "$MODE" = "new" ]; then
cat > "$RUN_DIR/state.json" <<EOF
{
  "run_id": "$RUN_ID",
"run_dir": "$RUN_DIR",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
"domain": "{domain}",
"goal": "$CONTENT",
"current_phase": "pending",
"steps": {
"{step-1-id}": { "status": "pending" },
"{step-2-id}": { "status": "pending" },
"{step-3-id}": { "status": "pending" }
}
}
EOF

    echo "🔧 初始化状态: state.json"

fi
\`\`\`

**写入 input.md** (仅新建模式):

\`\`\`bash
if [ "$MODE" = "new" ]; then
echo "$CONTENT" > "$RUN_DIR/input.md"
echo "📝 写入输入: input.md"
fi
\`\`\`

### 步骤 2: 委托给 Orchestrator

**调用 {domain}-orchestrator Agent**:

\`\`\`
Task(
subagent_type="{domain}-orchestrator",
description="Execute {domain} workflow",
prompt="请执行 {domain} 工作流。

运行参数:

- RUN_DIR: ${RUN_DIR}
- RUN_ID: ${RUN_ID}
- MODE: ${MODE}

状态文件位置: ${RUN_DIR}/state.json
输入文件位置: ${RUN_DIR}/input.md

请按照 {domain}-orchestrator.md 的规范执行各个阶段。
完成后返回最终输出路径。"
)
\`\`\`

## 输出示例

### 新建工作流

\`\`\`
👉 启动 {domain} 工作流: /{command-name} "{example-input}"

📂 创建工作目录: .claude/{domain}/runs/20260114T103000Z/
📝 写入输入: input.md
🔧 初始化状态: state.json

🚀 委托给 {domain}-orchestrator...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[{domain}-orchestrator 输出...]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 工作流完成！

📄 最终输出: .claude/{domain}/runs/20260114T103000Z/final.md
📊 工作流产物:

- {产物1}: {file1}.md
- {产物2}: {file2}.md
- {产物3}: {file3}.md

🔄 如需修改:

- 重新运行: /{command-name} --run-id=20260114T103000Z
  \`\`\`

### 断点续传

\`\`\`
👉 恢复 {domain} 工作流: /{command-name} --run-id=20260114T103000Z

🔄 恢复工作目录: .claude/{domain}/runs/20260114T103000Z/
🔍 检查状态: state.json

状态检查:
✅ {step-1-id} - 已完成
✅ {step-2-id} - 已完成
⏸️ {step-3-id} - 待执行

🚀 继续执行 {domain}-orchestrator...

[后续流程...]
\`\`\`

## 错误处理

### 参数缺失

\`\`\`
❌ 错误: 请提供 {required-arg}
用法: /{command-name} <{required-arg}> [选项]
\`\`\`

### run-id 不存在

\`\`\`
❌ 错误: 运行目录不存在: .claude/{domain}/runs/20260114T999999Z
提示: 使用 /{command-name} "{input}" 创建新工作流
\`\`\`

## 注意事项

1. **委托模式**: Command 不执行具体任务，只负责初始化和委托
2. **状态隔离**: 每个 run-id 有独立的目录和状态文件
3. **幂等性**: 相同 run-id 多次调用应安全（由 orchestrator 处理）
4. **路径传递**: 传递 RUN_DIR 和 RUN_ID，不传递文件内容

## 参考资源

- Agent: `agents/{domain}-orchestrator.md`
- State File V2: `skills/shared/workflow/STATE_FILE_V2.md`
- Orchestrator Contract: `docs/orchestrator-contract.md`
```

---

## 2. Agent 层模板

**文件位置**: `agents/{domain}-orchestrator.md`

```markdown
---
name: {domain}-orchestrator
description: |
  【触发条件】由 /{command-name} Command 调用，负责编排 {domain} 工作流。
  【核心产出】完整的 runs/ 目录，包含所有中间产物和最终结果。
  【不触发】用户直接调用单个 {domain} Skill，或非 {domain} 类任务。
model: inherit
color: {color}  # magenta, cyan, blue, green, yellow, red
tools: ["Read", "Write", "Bash", "Skill", "Task", "AskUserQuestion"]
---

# {Domain} Orchestrator - {领域名称}编排器

## 职责

编排 {domain} 工作流的 N 个阶段，管理状态文件，处理断点续传，协调并行任务（如适用）。

**重要**：这是纯编排器，不执行具体任务，所有任务通过调用 Skill 完成。

## 输入

从 `/{command-name}` Command 接收：

- `${RUN_DIR}`: 工作目录路径（如 `.claude/{domain}/runs/20260114T100000Z/`）
- `${RUN_DIR}/input.md`: 输入数据
- `${RUN_DIR}/state.json`: 状态文件（初始化或已存在）

## 工作流阶段

### Phase 1: {phase-1-name}

**调用**: `Skill("{domain}:{skill-1-name}")`

**输入**: `${RUN_DIR}/input.md`
**输出**: `${RUN_DIR}/{phase-1-output}.md`

**成功标准**:

- ✅ {phase-1-output}.md 存在且包含有效内容
- ✅ {具体验证条件1}
- ✅ {具体验证条件2}

**失败处理**:

- 检查 {phase-1-output}.md 是否存在
- 如失败，更新 state.json: `{step-1-id}: {status: "failed", error: "..."}`
- 询问用户是否重试或跳过

### Phase 2: {phase-2-name}

**调用**: `Skill("{domain}:{skill-2-name}")`

**输入**:

- `${RUN_DIR}/input.md`
- `${RUN_DIR}/{phase-1-output}.md`

**输出**: `${RUN_DIR}/{phase-2-output}.md`

**成功标准**:

- ✅ {phase-2-output}.md 存在且包含有效内容
- ✅ {具体验证条件}

**失败处理**:

- 检查 {phase-2-output}.md 是否存在
- 如 {phase-1-output}.md 缺失，提示先完成 Phase 1
- 如失败，更新 state.json 并询问用户

### Phase 3: {phase-3-name} (并行，如适用)

**调用**: 并行启动 N 个 Task

\`\`\`
Task(subagent_type="{worker-agent-name}",
prompt="使用 Skill('{domain}:{skill-3-name}') 生成 {variant-1}，
输入: ${RUN_DIR}/{phase-2-output}.md，
输出: ${RUN_DIR}/{phase-3-output-1}.md",
run_in_background=true)

Task(subagent_type="{worker-agent-name}",
prompt="使用 Skill('{domain}:{skill-3-name}') 生成 {variant-2}，
输入: ${RUN_DIR}/{phase-2-output}.md，
输出: ${RUN_DIR}/{phase-3-output-2}.md",
run_in_background=true)
\`\`\`

**等待**: 所有 N 个 Task 完成

**成功标准**:

- ✅ 所有 {phase-3-output-\*}.md 都存在
- ✅ 每个输出包含有效内容
- ✅ {具体验证条件}

**失败处理**:

- 如某个任务失败，标记为 failed 但继续（至少保证有 1 个成功）
- 如全部失败，询问用户是否重试

### Phase 4: {phase-4-name}

**调用**: `Skill("{domain}:{skill-4-name}")`

**输入**: `${RUN_DIR}/{phase-3-output-*}.md`（所有成功生成的产物）

**输出**: `${RUN_DIR}/final.md`

**成功标准**:

- ✅ final.md 存在且包含有效内容
- ✅ {具体验证条件}

**失败处理**:

- 如失败，询问用户是否重试或选择最佳中间产物作为最终结果

## 状态管理（state.json）

### 初始状态

\`\`\`json
{
"run_id": "20260114T100000Z",
"run_dir": ".claude/{domain}/runs/20260114T100000Z",
"created_at": "2026-01-14T10:30:00Z",
"domain": "{domain}",
"goal": "{用户输入的目标}",
"current_phase": "pending",
"steps": {
"{step-1-id}": { "status": "pending" },
"{step-2-id}": { "status": "pending" },
"{step-3-id}": { "status": "pending" },
"{step-4-id}": { "status": "pending" }
}
}
\`\`\`

### 步骤执行流程

1. **读取 state.json**
   \`\`\`
   Read ${RUN_DIR}/state.json
   \`\`\`

2. **检查步骤状态**
   \`\`\`python
   if steps["{step-id}"]["status"] == "completed":
   skip Phase N
   elif steps["{step-id}"]["status"] == "failed":
   ask user if retry
   else:
   execute Phase N
   \`\`\`

3. **更新状态**

   每个步骤开始前：
   \`\`\`json
   "{step-id}": {
   "status": "in_progress",
   "started_at": "<timestamp>"
   }
   \`\`\`

   步骤成功后：
   \`\`\`json
   "{step-id}": {
   "status": "completed",
   "output": "{output-file}",
   "completed_at": "<timestamp>"
   }
   \`\`\`

   步骤失败后：
   \`\`\`json
   "{step-id}": {
   "status": "failed",
   "error": "<error message>",
   "failed_at": "<timestamp>"
   }
   \`\`\`

4. **写回 state.json**
   \`\`\`
   Write ${RUN_DIR}/state.json <updated_state>
   \`\`\`

## 断点续传

### 恢复策略

1. **读取现有 state.json**
2. **检查每个步骤**:
   - `completed`: 跳过，显示"已完成"
   - `failed`: 询问用户是否重试
   - `in_progress`: 检查输出文件是否存在，存在则标记为 completed，否则重试
   - `pending`: 执行

3. **输出文件验证**:
   即使 status 为 completed，也验证输出文件：
   - 文件存在 → 跳过
   - 文件不存在 → 重新执行

### 示例输出

\`\`\`
📋 检查工作流状态: ${RUN_DIR}

✅ Phase 1: {step-1-id} - 已完成 ({phase-1-output}.md)
✅ Phase 2: {step-2-id} - 已完成 ({phase-2-output}.md)
❌ Phase 3: {step-3-id-variant-1} - 失败 ({错误原因})
✅ Phase 3: {step-3-id-variant-2} - 已完成 ({phase-3-output-2}.md)
⏸️ Phase 4: {step-4-id} - 待执行

🔧 操作建议:

1. 重试 {step-3-id-variant-1}？[Y/n]
2. 使用现有产物继续 Phase 4？[Y/n]
   \`\`\`

## 用户交互

### 关键决策点

1. **Phase 失败后**:
   \`\`\`
   ❌ {Phase N} 失败: <error>

   选项:
   1. 重试
   2. 跳过
   3. 手动修复后继续
   4. 中止工作流
      \`\`\`

2. **并行任务部分失败**:
   \`\`\`
   ⚠️ {N} 个任务中有 {M} 个失败

   已完成:
   - {task-1} ({output-1})
   - {task-2} ({output-2})

   失败:
   - {task-3} ({error})

   选项:
   1. 重试失败任务
   2. 使用现有 {N-M} 个结果继续
   3. 中止工作流
      \`\`\`

3. **选择最佳结果** (如适用):
   \`\`\`
   📝 请选择用于后续步骤的结果:
   1. {output-1} ({描述})
   2. {output-2} ({描述}) [推荐]
   3. {output-3} ({描述})

   输入选项编号 [1-3]:
   \`\`\`

## 执行示例

### 正常流程（全新）

\`\`\`
👉 启动 {domain} 工作流: /{command-name} "{example-input}"

📂 创建工作目录: .claude/{domain}/runs/20260114T103000Z/
📝 写入输入: input.md
🔧 初始化状态: state.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Phase 1: {phase-1-name}
调用: Skill("{domain}:{skill-1-name}")
✅ 完成: {phase-1-output}.md ({描述})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Phase 2: {phase-2-name}
调用: Skill("{domain}:{skill-2-name}")
✅ 完成: {phase-2-output}.md ({描述})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✍️ Phase 3: {phase-3-name} (并行)
Task 1: {variant-1} → {phase-3-output-1}.md
Task 2: {variant-2} → {phase-3-output-2}.md

⏳ 等待并行任务完成...

✅ {phase-3-output-1}.md 完成 ({描述})
✅ {phase-3-output-2}.md 完成 ({描述})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ Phase 4: {phase-4-name}
调用: Skill("{domain}:{skill-4-name}")
✅ 完成: final.md ({描述})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 {Domain} 工作流完成！

产物位置: .claude/{domain}/runs/20260114T103000Z/

- {phase-1-output}.md ({描述})
- {phase-2-output}.md ({描述})
- {phase-3-output-1}.md ({描述})
- {phase-3-output-2}.md ({描述})
- final.md ({描述}) ⭐

👉 下一步:

- 查看最终结果: cat final.md
- 对比中间产物: diff {phase-3-output-1}.md {phase-3-output-2}.md
  \`\`\`

### 断点续传示例

\`\`\`
👉 恢复工作流: /{command-name} --run-id=20260114T103000Z

📂 读取工作目录: .claude/{domain}/runs/20260114T103000Z/
🔍 检查状态: state.json

状态检查:
✅ {step-1-id} - 已完成
✅ {step-2-id} - 已完成
⏸️ {step-3-id} - 待执行
⏸️ {step-4-id} - 待执行

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✍️ Phase 3: 继续 {phase-3-name}
跳过: {phase-3-output-1}.md (已存在)
Task 2: {variant-2} → {phase-3-output-2}.md

✅ {phase-3-output-2}.md 完成

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[后续流程同上...]
\`\`\`

## 注意事项

1. **纯编排器**: 不执行具体任务，所有任务通过 Skill 调用
2. **状态文件**: 每步执行前后都更新 state.json
3. **文件验证**: 即使 status 为 completed，也验证输出文件存在
4. **并行隔离**: 并行任务的输出文件必须使用不同的文件名
5. **用户友好**: 提供清晰的进度提示和操作建议

## 参考资源

- Orchestrator Contract: `docs/orchestrator-contract.md`
- State File V2: `skills/shared/workflow/STATE_FILE_V2.md`
- Parallel Execution Guide: `docs/parallel-execution-guide.md`
- Skill 调用规范: `skills/{domain}/*/SKILL.md`
```

---

## 3. Skill 层模板

**文件位置**: `skills/{domain}/{skill-name}/SKILL.md`

```markdown
---
name: { skill-name }
description: { 单一职责的简短描述 }
arguments:
  - name: input_path
    type: string
    description: 输入文件路径
  - name: output_path
    type: string
    description: 输出文件路径
  - name: option1
    type: string
    description: { 可选参数1说明 }
    optional: true
---

# {Skill Name} - {功能名称}

## 职责

{单一、明确的职责描述，说明此 Skill 做什么}

**输入**: 接收文件路径，不接收文件内容
**输出**: 输出文件路径

## 输入

### 必需参数

- `input_path` (string): 输入文件的完整路径
  - 格式: {说明输入文件的格式要求}
  - 示例: `.claude/{domain}/runs/20260114T103000Z/input.md`

- `output_path` (string): 输出文件的完整路径
  - 格式: {说明输出文件的格式要求}
  - 示例: `.claude/{domain}/runs/20260114T103000Z/output.md`

### 可选参数

- `option1` (string): {参数说明}
  - 默认值: {default-value}
  - 可选值: {value1|value2|value3}

## 处理流程

1. **读取输入**:
   \`\`\`
   Read ${input_path}
   \`\`\`

2. **处理逻辑**:
   {描述具体的处理步骤}

3. **生成输出**:
   \`\`\`
   Write ${output_path} <result>
   \`\`\`

4. **返回路径**:
   \`\`\`
   return output_path
   \`\`\`

## 输出

### 输出文件格式

## \`\`\`markdown

## {frontmatter 字段说明}

# {输出文件结构说明}

{输出内容示例}
\`\`\`

### 返回值

- `output_path`: 成功生成的输出文件路径
- 可选元数据:
  \`\`\`json
  {
  "output_path": "${output_path}",
  "metadata": {
  "key1": "value1",
  "key2": "value2"
  }
  }
  \`\`\`

## 成功标准

- ✅ 输出文件存在于 `output_path`
- ✅ {具体验证条件1}
- ✅ {具体验证条件2}

## 错误处理

| 错误类型            | 条件               | 处理方式     |
| ------------------- | ------------------ | ------------ |
| `input_not_found`   | 输入文件不存在     | 返回错误信息 |
| `invalid_format`    | 输入文件格式不正确 | 返回错误信息 |
| `processing_failed` | 处理逻辑失败       | 返回错误信息 |

## 使用示例

### 基本调用

\`\`\`
Skill("{domain}:{skill-name}",
args="input_path=${RUN_DIR}/input.md output_path=${RUN_DIR}/output.md")
\`\`\`

### 带选项调用

\`\`\`
Skill("{domain}:{skill-name}",
args="input_path=${RUN_DIR}/input.md output_path=${RUN_DIR}/output.md option1=value1")
\`\`\`

## 注意事项

1. **只传路径**: 不接收文件内容作为参数
2. **原子操作**: 只做一件事，做好一件事
3. **无状态**: 不依赖外部状态，可重复执行
4. **文件验证**: 输出前验证文件内容正确性

## 相关 Skills

- `{domain}:{related-skill-1}`: {关系说明}
- `{domain}:{related-skill-2}`: {关系说明}

## 参考资源

- Orchestrator: `agents/{domain}-orchestrator.md`
- Skill Contract: `docs/orchestrator-contract.md#13-skill-层职责`
```

---

## 使用指南

### 创建新 Orchestrator

1. **复制模板**:
   \`\`\`bash
   cp skills/\shared/workflow/ORCHESTRATOR_TEMPLATE.md .working-draft.md
   \`\`\`

2. **替换占位符**:
   - `{command-name}`: 命令名称（如 `article`, `commit`, `debug`）
   - `{domain}`: 领域名称（如 `writing`, `committing`, `debugging`）
   - `{Domain}`: 首字母大写的领域名称
   - `{phase-N-name}`: 各阶段名称
   - `{skill-N-name}`: 各阶段调用的 Skill 名称
   - `{step-N-id}`: state.json 中的步骤 ID
   - `{color}`: Agent 颜色（magenta, cyan, blue, green, yellow, red）

3. **调整阶段**:
   - 根据实际需要增删 Phase
   - 更新 state.json 的 steps 定义
   - 确保 Phase 间的输入输出路径一致

4. **实施 Skills**:
   - 为每个 Phase 创建对应的 Skill
   - 使用 Skill 层模板
   - 确保 Skill 只接收文件路径

5. **验证**:
   - 使用 `docs/orchestrator-contract.md` 第 10 节的验收清单
   - 测试正常流程
   - 测试断点续传
   - 测试错误处理

### 验收清单

在创建新 Orchestrator 后，确保通过以下检查：

- [ ] Command 层正确初始化 run-id 和 state.json
- [ ] Agent 层只编排不执行，所有任务通过 Skill 调用
- [ ] Skill 层只接收/返回文件路径，不接收文件内容
- [ ] state.json 格式符合 V2 规范
- [ ] 支持断点续传（中断后重新运行能继续）
- [ ] 错误处理正确分类（recoverable/user_intervention/fatal）
- [ ] 并行任务（如适用）使用 run_in_background
- [ ] 并行任务输出文件隔离（不同文件名）
- [ ] Hard Stop 点正确实现（AskUserQuestion）
- [ ] 输出文件验证（即使 status=completed 也检查文件）

## 参考资源

- 统一契约: `docs/orchestrator-contract.md`
- 状态文件规范: `skills/shared/workflow/STATE_FILE_V2.md`
- Phase 1 成功案例: `commands/article.md`, `agents/writer-orchestrator.md`
- 并行执行指南: `docs/parallel-execution-guide.md`
