---
name: code-implementer
description: |
  【触发条件】开发工作流第四步：基于原型重构并实施代码到项目中。
  【核心产出】输出 ${run_dir}/changes.md + 实际代码变更。
  【不触发】原型生成（用 prototype-generator）、审计审查（用 audit-reviewer）。
  【先问什么】prototype-{model}.diff 缺失时，询问是否先执行原型生成
  【强制工具】必须调用 codex-cli 或 gemini-cli Skill 重构原型，禁止 Claude 自行实施。
allowed-tools:
  - Read
  - Write
  - Edit
  - Skill
  - LSP
  - mcp__sequential-thinking__sequentialthinking
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
  - name: model
    type: string
    required: true
    description: 实施模型（codex 或 gemini）
  - name: focus
    type: string
    required: false
    description: 关注领域（backend,api,logic 或 frontend,ui,styles）
---

# Code Implementer - 代码实施原子技能

## 🚨 CRITICAL: 必须调用 codex-cli 或 gemini-cli Skill

```
┌─────────────────────────────────────────────────────────────────┐
│  ❌ 禁止：Claude 自己实施代码（跳过外部模型）                     │
│  ❌ 禁止：直接 Bash 调用 codeagent-wrapper                       │
│  ✅ 必须：通过 Skill 工具调用 codex-cli 或 gemini-cli            │
│                                                                  │
│  这是多模型协作的核心！Claude 不能替代 Codex/Gemini 实施！        │
│                                                                  │
│  执行顺序（必须遵循）：                                          │
│  1. 读取 prototype-{model}.diff                                 │
│  2. Skill 调用 codex-cli 或 gemini-cli 重构原型                  │
│  3. 验证并应用变更，写入 changes.md                              │
│                                                                  │
│  如果跳过 Step 2，整个多模型协作失效！                           │
└─────────────────────────────────────────────────────────────────┘
```

## 职责边界

- **输入**: `run_dir` + `model` + `focus`（包含 `${run_dir}/prototype-{model}.diff`）
- **输出**: 实际代码变更 + `${run_dir}/changes-{model}.md`
- **单一职责**: 只做代码重构和实施，不做分析或审计
- **核心原则**: 外部模型重构原型，Claude 验证并应用

## MCP 工具集成

| MCP 工具              | 用途                                 | 触发条件        |
| --------------------- | ------------------------------------ | --------------- |
| `sequential-thinking` | 结构化实施策略，确保重构质量和完整性 | 🚨 每次执行必用 |

## 执行流程

### Step 0: 结构化实施规划（sequential-thinking）

🚨 **必须首先使用 sequential-thinking 规划实施策略**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "规划代码实施策略。需要：1) 理解原型内容 2) LSP 影响范围分析 3) 重构优化点 4) 应用顺序规划 5) 验证策略",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**思考步骤**：

1. **原型内容理解**：从 prototype-{model}.diff 提取变更内容
2. **LSP 影响范围分析**：使用 LSP 确认每个符号的引用
3. **重构优化点识别**：识别原型中需要重构的部分
4. **应用顺序规划**：确定文件修改顺序，避免循环依赖
5. **验证策略制定**：规划类型检查、语法检查、测试

### Step 1: 读取原型

```bash
读取 ${run_dir}/prototype-{model}.diff
解析: 涉及的文件、变更内容、新增/删除
```

### Step 2: 使用 LSP 确认影响范围（🚨 强制执行）

```
┌─────────────────────────────────────────────────────────────────┐
│  🚨🚨🚨 修改任何代码前必须先调用 LSP！🚨🚨🚨                       │
│                                                                  │
│  每个要修改的符号/文件，必须执行：                               │
│                                                                  │
│  1. LSP.findReferences(symbol)  - 确认影响范围（谁在用它？）     │
│  2. LSP.goToDefinition(symbol)  - 确认定义位置（它在哪定义？）   │
│  3. LSP.incomingCalls(func)     - 谁调用了这个函数？            │
│  4. LSP.outgoingCalls(func)     - 这个函数调用了谁？            │
│                                                                  │
│  跳过 LSP 直接修改代码 = 工作流失败！                           │
└─────────────────────────────────────────────────────────────────┘
```

**立即执行 LSP 调用序列：**

```
# 对 prototype.diff 中每个要修改的符号
LSP(operation="findReferences", filePath="<file>", line=<line>, character=<char>)
LSP(operation="goToDefinition", filePath="<file>", line=<line>, character=<char>)

# 对函数/方法，额外调用
LSP(operation="incomingCalls", filePath="<file>", line=<line>, character=<char>)
LSP(operation="outgoingCalls", filePath="<file>", line=<line>, character=<char>)
```

**验证**：changes.md 必须包含 LSP 影响范围分析

### Step 3: 调用外部模型重构原型（🚨 必须执行）

**🚨🚨🚨 这是关键步骤！**

**❌ 禁止行为：**

- ❌ 使用 Bash 工具调用 codeagent-wrapper
- ❌ 自己实施代码
- ❌ 使用 Write/Edit 工具直接写代码

**✅ 唯一正确做法：使用 Skill 工具**

**对于 Codex 模型（后端实施），立即执行：**

```
Skill(skill="codex-cli", args="--role architect --prompt '重构并完善原型代码。原型文件路径: ${RUN_DIR}/prototype-codex.diff。请先读取该文件，然后重构。要求: 1.调整为项目代码风格 2.精简冗余 3.补充类型定义 4.增强错误处理 5.修复安全漏洞。OUTPUT FORMAT: Unified Diff Patch + 变更说明'")
```

**对于 Gemini 模型（前端实施），立即执行：**

```
Skill(skill="gemini-cli", args="--role frontend --prompt '重构并完善原型代码。原型文件路径: ${RUN_DIR}/prototype-gemini.diff。请先读取该文件，然后重构。要求: 1.调整为项目代码风格 2.优化组件结构 3.完善样式 4.确保响应式 5.增强可访问性。OUTPUT FORMAT: Unified Diff Patch + 变更说明'")
```

**⚠️ 如果你发现自己在用 Bash/Write/Edit 写代码，立即停止并改用 Skill 工具！**

### Step 4: 验证重构结果

外部模型返回重构后的 diff，Claude 进行验证：

| 检查项        | 动作       |
| ------------- | ---------- |
| diff 格式有效 | 确保可应用 |
| 代码语法正确  | 语法检查   |
| 类型定义完整  | 类型检查   |
| 无安全漏洞    | 安全扫描   |
| 符合项目规范  | 风格检查   |

### Step 5: 应用变更

```bash
for each 文件变更 in 重构后的 diff:
    读取目标文件
    使用 Edit 工具应用变更
    验证变更正确性
```

### Step 6: 验证

```bash
# 类型检查（如适用）
if [ -f "tsconfig.json" ]; then
    npx tsc --noEmit
fi

# 语法检查（如适用）
if [ -f "package.json" ]; then
    npm run lint 2>/dev/null || true
fi
```

### Step 7: 输出变更清单

将实施结果写入 `${run_dir}/changes-{model}.md`：

```markdown
# 代码实施报告 ({model})

## 实施概述

- 基于原型: prototype-{model}.diff
- 实施模型: {codex|gemini}
- 实施时间: [timestamp]
- 关注领域: {focus}

## 变更清单

### 新增文件

| 文件       | 说明       | 行数 |
| ---------- | ---------- | ---- |
| src/new.ts | 新功能实现 | 50   |

### 修改文件

| 文件             | 变更类型 | 说明           |
| ---------------- | -------- | -------------- |
| src/foo.ts:20-35 | 新增方法 | 添加 newMethod |
| src/bar.ts:10    | 修改导入 | 引入新依赖     |

### 删除文件

无

## 重构说明

| 原型内容     | 重构调整         | 原因         |
| ------------ | ---------------- | ------------ |
| 直接抛出异常 | 包装为自定义错误 | 统一错误处理 |
| any 类型     | 具体类型定义     | 类型安全     |

## 验证结果

- [x] 类型检查通过
- [x] 语法检查通过
- [ ] 单元测试（待运行）

---

下一步: 调用 audit-reviewer 进行审计
```

## 并行执行（后台模式）

支持双模型并行实施，由编排器使用 Task 工具协调：

```
# 编排器中的调用
Task(skill="code-implementer", args="run_dir=${RUN_DIR} model=codex focus=backend,api,logic", run_in_background=true) &
Task(skill="code-implementer", args="run_dir=${RUN_DIR} model=gemini focus=frontend,ui,styles", run_in_background=true) &
wait
# 合并变更清单
```

输出文件:

- `${run_dir}/changes-codex.md` (后端变更)
- `${run_dir}/changes-gemini.md` (前端变更)
- `${run_dir}/changes.md` (合并后)

## 返回值

执行完成后，返回：

```
代码实施完成（{model}）。
输出文件: ${run_dir}/changes-{model}.md
变更文件: X 个
新增行数: +Y
删除行数: -Z

✅ 类型检查: 通过
✅ 语法检查: 通过

下一步: 使用 audit-reviewer 进行审计
```

## 质量门控

- ✅ 🚨 修改前调用了 LSP（findReferences + goToDefinition）至少 3 次
- ✅ changes.md 包含 LSP 影响范围分析
- ✅ 所有变更已应用
- ✅ 类型检查通过
- ✅ 无破坏性变更（除非明确要求）
- ✅ 代码风格符合项目规范

## 约束

- 不做需求分析（交给 multi-model-analyzer）
- 不做原型生成（交给 prototype-generator）
- 不做审计（交给 audit-reviewer）
- 修改前必须用 LSP 确认影响范围
- 每个变更必须可追溯（记录在 changes.md）

## 🚨 强制工具验证

**执行此 Skill 后，必须满足以下条件：**

| 检查项              | 要求 | 验证方式                            |
| ------------------- | ---- | ----------------------------------- |
| Skill 调用          | 必须 | 检查 codex-cli 或 gemini-cli 被调用 |
| 外部模型输出        | 必须 | changes-{model}.md 包含重构结果     |
| Claude 自行实施     | 禁止 | 不能跳过 Skill 直接写代码           |
| 直接 Bash codeagent | 禁止 | 必须通过 Skill 工具调用             |

**如果没有调用 codex-cli 或 gemini-cli Skill，此 Skill 执行失败！**
