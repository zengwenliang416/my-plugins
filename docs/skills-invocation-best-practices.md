# Skills 调用规范和最佳实践

## 文档目的

本文档定义 Agent 层如何正确调用 Skill 层，确保所有 orchestrators 遵循统一的调用模式。

**关联文档**:

- `docs/orchestrator-contract.md` - 总体架构契约
- `skills/shared/workflow/ORCHESTRATOR_TEMPLATE.md` - 标准模板

---

## 1. 基本调用模式

### 1.1 标准调用语法

```
Skill("{domain}:{skill-name}", args="key1=value1 key2=value2")
```

**示例** (来自 Phase 1):

```
Skill("writing:analyzer", args="input_path=${RUN_DIR}/input.md output_path=${RUN_DIR}/analysis.md")
```

### 1.2 参数传递规则

| 规则             | 说明                                 | 示例                                       |
| ---------------- | ------------------------------------ | ------------------------------------------ |
| **文件路径优先** | 传递文件路径，不传递内容             | `input_path=${RUN_DIR}/file.md`            |
| **相对路径禁止** | 必须使用绝对路径或 `${RUN_DIR}` 变量 | ✅ `${RUN_DIR}/file.md`<br>❌ `../file.md` |
| **键值对格式**   | 使用空格分隔的 `key=value` 对        | `arg1=val1 arg2=val2`                      |
| **特殊字符转义** | 包含空格的值用引号包裹               | `message="hello world"`                    |

---

## 2. 文件路径通信模式

### 2.1 核心原则

**✅ 正确**：仅传递文件路径，由 Skill 自行读取

```
# Agent 层
Skill("writing:outliner",
     args="input_path=${RUN_DIR}/analysis.md output_path=${RUN_DIR}/outline.md")

# Skill 层 (skills/writing/outliner/SKILL.md)
1. Read ${input_path}
2. 处理内容...
3. Write ${output_path} <result>
```

**❌ 错误**：在 Agent 层读取内容并传递

```
# ❌ 反模式：Agent 读取内容
analysis_content = Read(${RUN_DIR}/analysis.md)
Skill("writing:outliner", args="content=${analysis_content}")
```

### 2.2 为什么只传路径？

| 原因           | 说明                             |
| -------------- | -------------------------------- |
| **上下文节省** | 避免重复传递大文件内容           |
| **职责分离**   | Agent 专注编排，Skill 专注处理   |
| **可追溯性**   | 文件路径对应磁盘文件，可人工检查 |
| **断点续传**   | 文件已存在时可跳过，无需重新生成 |

---

## 3. 常见调用模式

### 3.1 单输入单输出

**场景**：转换类任务（分析、格式化、总结）

```
# Phase 1 示例：article-analyzer
Skill("writing:analyzer",
     args="input_path=${RUN_DIR}/input.md output_path=${RUN_DIR}/analysis.md")
```

**Skill 实现约定**:

```markdown
## 处理流程

1. **读取输入**: Read ${input_path}
2. **分析处理**: [具体逻辑]
3. **生成输出**: Write ${output_path} <result>
4. **返回路径**: return output_path
```

### 3.2 多输入单输出

**场景**：合并类任务（润色、审查、汇总）

```
# Phase 1 示例：article-polish
Skill("writing:polish",
     args="analysis_path=${RUN_DIR}/analysis.md outline_path=${RUN_DIR}/outline.md draft_path=${RUN_DIR}/draft-2.md output_path=${RUN_DIR}/final.md")
```

**Skill 实现约定**:

```markdown
## 处理流程

1. **读取所有输入**:
   - Read ${analysis_path}
   - Read ${outline_path}
   - Read ${draft_path}

2. **综合处理**: [具体逻辑]
3. **生成输出**: Write ${output_path} <result>
4. **返回路径**: return output_path
```

### 3.3 单输入多输出

**场景**：拆分类任务（章节拆分、测试用例生成）

```
# 假设示例：test-generator
Skill("testing:generator",
     args="input_path=${RUN_DIR}/requirements.md output_dir=${RUN_DIR}/tests")
```

**Skill 实现约定**:

```markdown
## 处理流程

1. **读取输入**: Read ${input_path}
2. **拆分处理**: [具体逻辑]
3. **生成多个输出**:
   - Write ${output_dir}/test-unit.ts
   - Write ${output_dir}/test-integration.ts
   - Write ${output_dir}/test-e2e.ts
4. **返回目录路径**: return output_dir
```

### 3.4 条件调用

**场景**：根据前置步骤结果决定是否调用

```
# Agent 层
if steps["precheck"]["status"] == "failed":
    echo "⚠️ 预检查失败，跳过 Skill 调用"
    AskUserQuestion("预检查失败，是否继续？")
else:
    Skill("committing:change-analyzer", args="...")
fi
```

---

## 4. 错误处理模式

### 4.1 Skill 调用失败

**Agent 层责任**：捕获失败，更新 state.json，决定下一步

```
# 伪代码示例
result = Skill("writing:analyzer", args="...")

if result.success == false:
    # 1. 更新状态文件
    state["steps"]["analyzer"] = {
        "status": "failed",
        "error": result.error,
        "failed_at": timestamp
    }
    Write ${RUN_DIR}/state.json <updated_state>

    # 2. 根据错误类型决策
    if result.error_type == "recoverable":
        # 自动重试（max 3 次）
        retry_count += 1
        if retry_count <= 3:
            Skill("writing:analyzer", args="...")
        else:
            AskUserQuestion("重试 3 次后仍失败，是否继续？")

    elif result.error_type == "user_intervention":
        # 询问用户
        AskUserQuestion("分析失败: ${result.error}。选项：1. 重试 2. 跳过 3. 中止")

    elif result.error_type == "fatal":
        # 终止工作流
        echo "❌ 致命错误: ${result.error}，工作流已终止"
        exit 1
```

### 4.2 输出文件验证

**Agent 层责任**：验证 Skill 输出文件是否符合预期

```
# 伪代码示例
Skill("writing:analyzer", args="input_path=${RUN_DIR}/input.md output_path=${RUN_DIR}/analysis.md")

# 验证输出文件
if [ ! -f "${RUN_DIR}/analysis.md" ]; then
    echo "❌ 输出文件不存在: analysis.md"
    state["steps"]["analyzer"]["status"] = "failed"
    state["steps"]["analyzer"]["error"] = "输出文件未生成"
fi

# 验证文件内容（frontmatter）
analysis_content = Read ${RUN_DIR}/analysis.md
if not contains_valid_frontmatter(analysis_content):
    echo "❌ 输出文件缺少有效 frontmatter"
    state["steps"]["analyzer"]["status"] = "failed"
    state["steps"]["analyzer"]["error"] = "frontmatter 缺失或无效"
fi
```

---

## 5. 并行调用模式

### 5.1 背景任务调用

**场景**：多个 Skill 可并行执行，互不依赖

```
# Phase 1 示例：并行写作（3 个 writer-agent）
Task(subagent_type="writer-agent",
     prompt="使用 Skill('writing:writer') 生成草稿，风格: technical，
            输入: ${RUN_DIR}/outline.md + analysis.md，
            输出: ${RUN_DIR}/draft-1.md",
     run_in_background=true)

Task(subagent_type="writer-agent",
     prompt="使用 Skill('writing:writer') 生成草稿，风格: accessible，
            输入: ${RUN_DIR}/outline.md + analysis.md，
            输出: ${RUN_DIR}/draft-2.md",
     run_in_background=true)

Task(subagent_type="writer-agent",
     prompt="使用 Skill('writing:writer') 生成草稿，风格: narrative，
            输入: ${RUN_DIR}/outline.md + analysis.md，
            输出: ${RUN_DIR}/draft-3.md",
     run_in_background=true)

# 等待所有任务完成
wait_for_all_tasks()
```

### 5.2 并行调用约束

| 约束           | 说明                                      |
| -------------- | ----------------------------------------- |
| **文件隔离**   | 每个并行任务必须输出到不同的文件          |
| **无共享状态** | 不能写入同一个文件或共享变量              |
| **独立输入**   | 输入文件可共享（只读），输出文件必须独立  |
| **状态独立**   | 每个任务在 state.json 中有独立的 step key |

**✅ 正确**：输出文件隔离

```
# draft-1.md, draft-2.md, draft-3.md 互不冲突
state["steps"]["writer-1"]["output"] = "draft-1.md"
state["steps"]["writer-2"]["output"] = "draft-2.md"
state["steps"]["writer-3"]["output"] = "draft-3.md"
```

**❌ 错误**：共享输出文件

```
# ❌ 三个任务都写入同一个文件，产生竞态条件
output: ${RUN_DIR}/draft.md  # 冲突！
```

---

## 6. Phase 1 实战示例

### 6.1 article-analyzer (单输入单输出)

**调用** (来自 agents/writer-orchestrator.md:32):

```
Skill("writing:analyzer")
```

**实际参数传递** (由 Command 层初始化):

```
input_path: ${RUN_DIR}/input.md
output_path: ${RUN_DIR}/analysis.md
```

**Skill 实现** (skills/writing/analyzer/SKILL.md):

```markdown
## 处理流程

1. **读取主题**: Read ${RUN_DIR}/input.md
2. **分析主题**:
   - 识别主题类型 (技术/科普/观点)
   - 评估难度 (beginner/medium/expert)
   - 预估字数
3. ## **生成 frontmatter**:
   topic: [主题]
   difficulty: [难度]
   estimated_words: [预估字数]
   ***
4. **写入输出**: Write ${RUN_DIR}/analysis.md
```

### 6.2 article-polish (多输入单输出)

**调用** (来自 agents/writer-orchestrator.md:109):

```
Skill("writing:polish")
```

**实际参数传递**:

```
input_paths: ${RUN_DIR}/draft-*.md
analysis_path: ${RUN_DIR}/analysis.md
outline_path: ${RUN_DIR}/outline.md
output_path: ${RUN_DIR}/final.md
```

**Skill 实现** (skills/writing/polish/SKILL.md):

```markdown
## 处理流程

1. **读取所有输入**:
   - Read ${RUN_DIR}/draft-1.md
   - Read ${RUN_DIR}/draft-2.md
   - Read ${RUN_DIR}/draft-3.md
   - Read ${RUN_DIR}/analysis.md
   - Read ${RUN_DIR}/outline.md

2. **选择最佳草稿** (或合并优点):
   - 对比三个草稿的语言风格、结构完整性、观点深度
   - 用户选择或自动评分

3. **润色优化**:
   - 修正语法和拼写
   - 统一术语和风格
   - 增强可读性

4. ## **生成 frontmatter**:

   source_draft: draft-2.md
   word_count: 2050
   polished_at: [时间戳]

   ***

5. **写入输出**: Write ${RUN_DIR}/final.md
```

### 6.3 article-writer (并行调用)

**调用** (来自 agents/writer-orchestrator.md:75-92):

```
Task(subagent_type="writer-agent",
     prompt="使用 Skill('writing:writer') 生成草稿，风格: technical，
            输入: ${RUN_DIR}/outline.md + analysis.md，
            输出: ${RUN_DIR}/draft-1.md",
     run_in_background=true)
```

**关键点**：

- 3 个 Task 并行执行
- 每个 Task 调用相同的 Skill (`writing:writer`)，但参数不同（风格）
- 输出文件隔离 (`draft-1.md`, `draft-2.md`, `draft-3.md`)
- state.json 独立跟踪 (`writer-1`, `writer-2`, `writer-3`)

---

## 7. 反模式（禁止事项）

### 7.1 ❌ 在 Agent 层读取文件内容

```
# ❌ 错误示例
content = Read ${RUN_DIR}/input.md
Skill("writing:analyzer", args="content=${content}")
```

**问题**：

- 浪费上下文（内容被传递两次）
- 违反职责分离（Agent 不应处理文件内容）
- 无法利用 Skill 层的缓存和优化

**正确做法**：

```
# ✅ 正确示例
Skill("writing:analyzer", args="input_path=${RUN_DIR}/input.md")
```

### 7.2 ❌ 使用相对路径

```
# ❌ 错误示例
Skill("writing:analyzer", args="input_path=../input.md")
```

**问题**：

- 相对路径依赖当前工作目录，容易出错
- 不符合 run_dir 规范

**正确做法**：

```
# ✅ 正确示例
Skill("writing:analyzer", args="input_path=${RUN_DIR}/input.md")
```

### 7.3 ❌ 直接调用 Skill 而不更新 state.json

```
# ❌ 错误示例：调用 Skill 后不更新状态
Skill("writing:analyzer", args="...")
# 忘记更新 state.json！
```

**问题**：

- 断点续传无法判断步骤是否完成
- 错误无法被追踪

**正确做法**：

```
# ✅ 正确示例：调用前后都更新状态

# 调用前：标记为 in_progress
state["steps"]["analyzer"]["status"] = "in_progress"
state["steps"]["analyzer"]["started_at"] = timestamp
Write ${RUN_DIR}/state.json <updated_state>

# 执行调用
Skill("writing:analyzer", args="...")

# 调用后：标记为 done 或 failed
state["steps"]["analyzer"]["status"] = "done"
state["steps"]["analyzer"]["completed_at"] = timestamp
state["steps"]["analyzer"]["output"] = "analysis.md"
Write ${RUN_DIR}/state.json <updated_state>
```

### 7.4 ❌ 并行任务共享输出文件

```
# ❌ 错误示例：三个并行任务写同一个文件
Task(..., prompt="输出: ${RUN_DIR}/draft.md", run_in_background=true)
Task(..., prompt="输出: ${RUN_DIR}/draft.md", run_in_background=true)
Task(..., prompt="输出: ${RUN_DIR}/draft.md", run_in_background=true)
```

**问题**：竞态条件，文件内容不可预测

**正确做法**：

```
# ✅ 正确示例：每个任务独立输出
Task(..., prompt="输出: ${RUN_DIR}/draft-1.md", ...)
Task(..., prompt="输出: ${RUN_DIR}/draft-2.md", ...)
Task(..., prompt="输出: ${RUN_DIR}/draft-3.md", ...)
```

---

## 8. Skill 定义规范

### 8.1 Frontmatter 必需字段

```yaml
---
name: skill-name
description: 单一职责的简短描述（一句话）
arguments:
  - name: input_path
    type: string
    description: 输入文件路径
  - name: output_path
    type: string
    description: 输出文件路径
---
```

### 8.2 处理流程标准化

```markdown
## 处理流程

1. **读取输入**: Read ${input_path}
2. **[步骤名称]**: [具体处理逻辑]
3. **生成输出**: Write ${output_path} <result>
4. **返回路径**: return output_path
```

### 8.3 错误处理

```markdown
## 错误处理

| 错误类型       | 处理方式                             |
| -------------- | ------------------------------------ |
| 输入文件不存在 | 返回 `error_type: fatal`             |
| 输入格式无效   | 返回 `error_type: user_intervention` |
| 处理超时       | 返回 `error_type: recoverable`       |
```

---

## 9. 调用清单（Checklist）

在 Agent 层调用 Skill 前，确认：

- [ ] **参数传递**：仅传递文件路径，不传递内容
- [ ] **路径格式**：使用 `${RUN_DIR}/filename` 而非相对路径
- [ ] **状态更新**：调用前标记 `in_progress`，调用后标记 `done/failed`
- [ ] **输出验证**：检查输出文件是否存在且格式正确
- [ ] **错误处理**：根据 error_type 采取相应策略
- [ ] **并行隔离**：并行任务输出到不同文件
- [ ] **文档对齐**：Skill 定义与调用参数一致

---

## 10. 扩展阅读

| 文档                                               | 用途             |
| -------------------------------------------------- | ---------------- |
| `docs/orchestrator-contract.md`                    | 总体架构契约     |
| `skills/shared/workflow/STATE_FILE_V2.md`         | 状态文件格式规范 |
| `skills/shared/workflow/ORCHESTRATOR_TEMPLATE.md` | 标准模板         |
| Phase 1 实现：`agents/writer-orchestrator.md`      | 实战参考         |

---

**版本**: v1.0
**创建时间**: 2026-01-14
**适用范围**: 所有 orchestrators (Task 4-13)
