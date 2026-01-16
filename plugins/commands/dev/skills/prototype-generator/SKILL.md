---
name: prototype-generator
description: |
  【触发条件】开发工作流第三步：根据分析方案生成代码原型。
  【核心产出】输出 ${run_dir}/prototype-{model}.diff，包含 Unified Diff 格式的代码变更。
  【不触发】分析方案（用 multi-model-analyzer）、最终实施（用 code-implementer）。
  【强制工具】必须调用 codex-cli 或 gemini-cli Skill，禁止 Claude 自行生成。
allowed-tools:
  - Read
  - Write
  - Skill
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
  - name: model
    type: string
    required: true
    description: 模型类型（codex 或 gemini）
  - name: focus
    type: string
    required: false
    description: 关注领域（backend,api,logic 或 frontend,ui,styles）
---

# Prototype Generator - 原型生成原子技能

## 🚨 CRITICAL: 必须调用 codex-cli 或 gemini-cli Skill

```
┌─────────────────────────────────────────────────────────────────┐
│  ❌ 禁止：Claude 自己生成代码（跳过外部模型）                     │
│  ❌ 禁止：直接 Bash 调用 codeagent-wrapper                       │
│  ✅ 必须：通过 Skill 工具调用 codex-cli 或 gemini-cli            │
│                                                                  │
│  这是多模型协作的核心！Claude 不能替代 Codex/Gemini 生成！        │
│                                                                  │
│  执行顺序（必须遵循）：                                          │
│  1. 读取 analysis-{model}.md                                    │
│  2. Skill 调用 codex-cli 或 gemini-cli                          │
│  3. 将外部模型输出写入 prototype-{model}.diff                    │
│                                                                  │
│  如果跳过 Step 2，整个多模型协作失效！                           │
└─────────────────────────────────────────────────────────────────┘
```

## 职责边界

- **输入**: `run_dir` + `model` + `focus`
- **输出**:
  - 并行模式: `${run_dir}/prototype-{codex|gemini}.diff`
  - 合并后: `${run_dir}/prototype.diff`
- **单一职责**: 只做原型生成，不做最终实施

## 执行流程

### Step 1: 读取分析报告

```bash
读取 ${run_dir}/analysis-{model}.md
提取: 实施方案、技术选型、实现步骤
```

### Step 2: 确定路由策略

根据 model 参数选择对应的 Skill：

| model  | Skill      | 关注领域                      |
| ------ | ---------- | ----------------------------- |
| codex  | codex-cli  | backend, api, logic, security |
| gemini | gemini-cli | frontend, ui, styles, ux      |

### Step 3: 调用外部模型 Skill（🚨 必须执行）

**🚨🚨🚨 这是关键步骤！**

**❌ 禁止行为：**
- ❌ 使用 Bash 工具调用 codeagent-wrapper
- ❌ 自己生成代码
- ❌ 使用 Write 工具写代码

**✅ 唯一正确做法：使用 Skill 工具**

**对于 Codex 模型（model=codex），立即执行：**

```
Skill(skill="codex-cli", args="--role architect --prompt '基于分析方案生成代码。分析报告路径: ${RUN_DIR}/analysis-codex.md。请先读取该文件，然后生成代码。要求: 1.完整代码变更 2.遵循项目代码风格 3.包含类型定义 4.添加关键注释。OUTPUT FORMAT: Unified Diff Patch ONLY，不要解释'")
```

**对于 Gemini 模型（model=gemini），立即执行：**

```
Skill(skill="gemini-cli", args="--role frontend --prompt '基于分析方案生成前端代码。分析报告路径: ${RUN_DIR}/analysis-gemini.md。请先读取该文件，然后生成代码。要求: 1.React组件代码 2.Tailwind CSS样式 3.响应式设计 4.可访问性考虑。OUTPUT FORMAT: Unified Diff Patch ONLY，不要解释'")
```

**⚠️ 如果你发现自己在用 Bash 或 Write 写代码，立即停止并改用 Skill 工具！**

### Step 4: 处理并行结果（fullstack 任务）

```bash
if task_type == fullstack:
    等待两个模型完成
    合并 diff（处理冲突）
    标记需要人工审查的部分
```

### Step 5: 输出原型

将生成的 diff 写入 `${run_dir}/prototype-{model}.diff`：

```diff
# Prototype Diff
# 生成模型: {codex|gemini}
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

## 并行执行（后台模式）

支持 fullstack 任务的并行生成，由编排器使用 Task 工具协调：

```
# 编排器中的调用
Task(skill="prototype-generator", args="run_dir=${RUN_DIR} model=codex focus=backend,api,logic", run_in_background=true) &
Task(skill="prototype-generator", args="run_dir=${RUN_DIR} model=gemini focus=frontend,ui,styles", run_in_background=true) &
wait
# 合并结果 → prototype.diff
```

输出文件:

- `${run_dir}/prototype-codex.diff` (后端原型)
- `${run_dir}/prototype-gemini.diff` (前端原型)
- `${run_dir}/prototype.diff` (合并后)

## 返回值

执行完成后，返回：

```
原型生成完成。
输出文件: ${run_dir}/prototype-{model}.diff
变更文件: X 个
新增行数: +Y
删除行数: -Z
生成模型: {codex|gemini}

⚠️ 注意: 此为"脏原型"，需经 code-implementer 重构后才能应用

下一步: 使用 code-implementer 进行重构实施
```

## 质量门控

- ✅ diff 格式有效
- ✅ 涉及文件与分析报告一致
- ✅ 代码语法正确（可编译）
- ✅ 无明显的安全漏洞

## 约束

- 不做需求分析（交给 multi-model-analyzer）
- 不做最终实施（交给 code-implementer）
- 输出必须是 Unified Diff 格式
- 原型视为"脏代码"，需要 Claude 审核重构
- 外部模型无写入权限，只生成 diff

## 🚨 强制工具验证

**执行此 Skill 后，必须满足以下条件：**

| 检查项              | 要求 | 验证方式                            |
| ------------------- | ---- | ----------------------------------- |
| Skill 调用          | 必须 | 检查 codex-cli 或 gemini-cli 被调用 |
| 外部模型输出        | 必须 | prototype-{model}.diff 包含模型响应 |
| Claude 自行生成     | 禁止 | 不能跳过 Skill 直接写结果           |
| 直接 Bash codeagent | 禁止 | 必须通过 Skill 工具调用             |

**如果没有调用 codex-cli 或 gemini-cli Skill，此 Skill 执行失败！**
