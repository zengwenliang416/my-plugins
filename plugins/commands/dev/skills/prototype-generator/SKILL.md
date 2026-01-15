---
name: prototype-generator
description: |
  【触发条件】开发工作流第三步：根据分析方案生成代码原型。
  【核心产出】输出 ${run_dir}/prototype.diff，包含 Unified Diff 格式的代码变更。
  【不触发】分析方案（用 multi-model-analyzer）、最终实施（用 code-implementer）。
allowed-tools: Read, Write, Bash, Task
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
  - name: task_type
    type: string
    required: false
    description: 任务类型（frontend/backend/fullstack，默认 fullstack）
---

# Prototype Generator - 原型生成原子技能

## 职责边界

- **输入**: `run_dir` + `task_type`
- **输出**:
  - 并行模式: `${run_dir}/prototype-{codex|gemini}.diff`
  - 合并后: `${run_dir}/prototype.diff`
- **单一职责**: 只做原型生成，不做最终实施

## 执行流程

### Step 1: 读取分析报告

```bash
读取 ${run_dir}/analysis-codex.md（如有）
读取 ${run_dir}/analysis-gemini.md（如有）
综合两份分析的实施步骤
```

### Step 2: 确定路由策略

根据任务类型选择生成模型：

| 任务类型  | 路由   | 模型参数           |
| --------- | ------ | ------------------ |
| frontend  | Gemini | `--role frontend`  |
| backend   | Codex  | `--role architect` |
| fullstack | 并行   | 分别生成后合并     |

### Step 3: 调用外部模型生成原型

输出: `.claude/developing/prototype-{codex|gemini}.diff`

```bash
~/.claude/bin/codeagent-wrapper {codex|gemini} \
  --role {architect|frontend} \
  --workdir $PROJECT_DIR \
  --prompt "
基于以下分析方案文件生成代码:

分析报告路径: .claude/developing/analysis-{codex|gemini}.md
请先读取该文件，然后基于内容生成代码。

要求:
1. 生成完整的代码变更
2. 遵循项目现有代码风格
3. 包含必要的类型定义
4. 添加关键注释

OUTPUT FORMAT: Unified Diff Patch ONLY
不要解释，只输出 diff
"
```

### Step 4: 处理并行结果（fullstack 任务）

```bash
if task_type == fullstack:
    等待两个模型完成
    合并 diff（处理冲突）
    标记需要人工审查的部分
```

### Step 5: 输出原型

将生成的 diff 写入 `.claude/developing/prototype.diff`：

```diff
# Prototype Diff
# 生成模型: {codex|gemini|both}
# 任务类型: {frontend|backend|fullstack}
# 生成时间: [timestamp]

diff --git a/src/foo.ts b/src/foo.ts
--- a/src/foo.ts
+++ b/src/foo.ts
@@ -10,6 +10,15 @@ export class Foo {
+  // 新增方法
+  async newMethod(): Promise<void> {
+    // 实现逻辑
+  }

diff --git a/src/bar.ts b/src/bar.ts
...
```

## 返回值

执行完成后，返回：

```
原型生成完成。
输出文件: .claude/developing/prototype.diff
变更文件: X 个
新增行数: +Y
删除行数: -Z
生成模型: {codex|gemini|both}

⚠️ 注意: 此为"脏原型"，需经 code-implementer 重构后才能应用

下一步: 使用 /developing:code-implementer 进行重构实施
```

## 质量门控

- ✅ diff 格式有效
- ✅ 涉及文件与分析报告一致
- ✅ 代码语法正确（可编译）
- ✅ 无明显的安全漏洞

## 并行执行

支持 fullstack 任务的并行生成：

```bash
# 编排器中的调用
Task(prototype-generator, model=codex, task_type=backend, run_in_background=true) → prototype-codex.diff &
Task(prototype-generator, model=gemini, task_type=frontend, run_in_background=true) → prototype-gemini.diff &
wait
# 合并结果 → prototype.diff
```

输出文件:

- `.claude/developing/prototype-codex.diff` (后端原型)
- `.claude/developing/prototype-gemini.diff` (前端原型)
- `.claude/developing/prototype.diff` (合并后)

## 约束

- 不做需求分析（交给 multi-model-analyzer）
- 不做最终实施（交给 code-implementer）
- 输出必须是 Unified Diff 格式
- 原型视为"脏代码"，需要 Claude 审核重构
- 外部模型无写入权限，只生成 diff
