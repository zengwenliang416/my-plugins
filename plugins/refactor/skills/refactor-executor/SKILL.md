---
name: refactor-executor
description: |
  【触发条件】重构工作流第四步：安全执行重构操作。
  【核心产出】输出 ${run_dir}/changes.md 和 ${run_dir}/refactor-result.json。
  【不触发】检测气味（用 smell-detector）、影响分析（用 impact-analyzer）。
  【先问什么】impact-analysis.md 不存在时，询问是否先执行影响分析
  【MUST】codex-cli 执行重构，必须使用。
  [Resource Usage] Use references/, assets/.
allowed-tools:
  - Write
  - Read
  - Edit
  - Skill
  - AskUserQuestion
  - mcp__auggie-mcp__codebase-retrieval
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 command 传入）
  - name: mode
    type: string
    required: false
    description: 执行模式 (analyze/auto/interactive)，默认 analyze
---

# Refactor Executor - 重构执行原子技能

## 🚨 CRITICAL: MUST USE TOOLS

```
┌─────────────────────────────────────────────────────────────────┐
│  🔧 重构执行                                                     │
│     ✅ 后端重构: codex-cli skill（API、逻辑、数据）              │
│     ✅ 前端重构: gemini-cli skill（组件、样式、交互）            │
│     ❌ 禁止: Claude 自己直接修改代码                              │
│                                                                  │
│  📋 安全机制                                                     │
│     ✅ 低风险自动执行（auto 模式）                               │
│     ✅ 高风险需用户确认                                          │
│     ✅ 每次修改后验证编译                                        │
│                                                                  │
│  ⚠️  必须通过 codex-cli/gemini-cli 执行，确保重构安全！         │
└─────────────────────────────────────────────────────────────────┘
```

---

## MCP 工具集成

| MCP 工具              | 用途                         | 触发条件        |
| --------------------- | ---------------------------- | --------------- |
| `auggie-mcp`          | 验证重构结果，确保语义正确   | 🚨 每次执行必用 |

## 前置检查

1. 验证 `${run_dir}/impact-analysis.md` 存在
2. 验证 `${run_dir}/suggestions.json` 存在
3. 如果不存在，提示用户先执行 impact-analyzer

## 执行模式

| 模式        | 行为                             |
| ----------- | -------------------------------- |
| analyze     | 跳过执行，仅输出分析报告         |
| auto        | 自动执行低风险重构，高风险需确认 |
| interactive | 每个重构操作逐一确认后执行       |

---

## 执行流程



```
  thought: "规划重构执行策略。需要：1) 按风险排序 2) 制定执行顺序 3) 设定回滚点 4) 规划验证步骤 5) 处理依赖关系",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

### Step 1: 读取重构建议和影响分析

```bash
suggestions=$(cat "${run_dir}/suggestions.json")
impact=$(cat "${run_dir}/impact-analysis.md")
```

解析：

- 每个建议的风险等级
- 执行顺序（低风险优先）
- 依赖关系

### Step 2: 按风险分类

**执行顺序优先级：**

1. 🟢 Low - 可自动执行
2. 🟡 Medium - 可自动执行（auto 模式）或需确认（interactive 模式）
3. 🔶 High - 需要用户确认
4. 🔴 Critical - 需要用户确认，建议分步执行

### Step 3: 执行策略选择

**如果 mode = analyze：**

```
直接跳到 Step 7，生成分析报告
```

**如果 mode = auto：**

```
1. 自动执行所有 low + medium 风险重构
2. 对 high + critical 风险使用 AskUserQuestion 确认
```

**如果 mode = interactive：**

```
对每个重构使用 AskUserQuestion 确认：
- 显示重构详情
- 显示影响范围
- 等待用户确认
```

### Step 4: 路由并执行重构

🚨 **根据重构类型选择执行工具**

**路由规则**：

| 重构类型            | 执行工具   | 判定条件                              |
| ------------------- | ---------- | ------------------------------------- |
| Extract Method      | codex-cli  | 后端代码（.ts, .js, .py, .go 等）     |
| Extract Class       | codex-cli  | 后端代码                              |
| Move Method         | codex-cli  | 后端代码                              |
| Introduce Parameter | codex-cli  | 后端代码                              |
| Extract Component   | gemini-cli | 前端代码（.tsx, .jsx, .vue, .svelte） |
| CSS Optimization    | gemini-cli | 样式文件（.css, .scss, .less）        |
| Accessibility Fix   | gemini-cli | 前端组件                              |
| State Refactoring   | gemini-cli | 前端状态管理                          |

#### 4.1 后端重构（codex-cli）

🚨 **必须通过 Skill 工具调用 codex-cli**

```
Skill(skill="codex-cli", args="--role refactoring-expert --prompt '${CODEX_PROMPT}' --sandbox read-only")
```

**CODEX_PROMPT 构建**：

```
## 角色
你是代码重构专家，精通安全重构技术。

## 任务
执行以下重构操作：

## 重构详情
- 类型: ${refactoring_type}
- 目标文件: ${target_file}
- 目标符号: ${target_symbol}
- 操作步骤: ${steps}

## 约束
- 保持功能行为不变
- 不引入新的依赖
- 保持代码风格一致
- 输出 unified diff 格式

## 输出格式
仅输出 diff，不要其他解释：
--- a/${file}
+++ b/${file}
@@ ... @@
...
```

#### 4.2 前端重构（gemini-cli）

🚨 **前端组件/样式重构必须通过 Skill 工具调用 gemini-cli**

```
Skill(skill="gemini-cli", args="--role frontend-refactor --prompt '${GEMINI_PROMPT}'")
```

**GEMINI_PROMPT 构建**：

```
## 角色
你是前端重构专家，精通组件设计和 CSS 架构。

## 任务
执行以下前端重构操作：

## 重构详情
- 类型: ${refactoring_type}
- 目标组件: ${target_component}
- 目标文件: ${target_file}
- 操作步骤: ${steps}

## 约束
- 保持组件功能不变
- 保持样式一致性
- 确保可访问性
- 确保响应式兼容
- 输出完整的重构后代码

## 输出格式
输出重构后的完整组件代码，包含：
1. 组件代码（如有拆分，输出所有新组件）
2. 样式代码（如有修改）
3. 需要更新的父组件引用
```

### Step 5: 验证重构结果（auggie-mcp）

🚨 **每次重构后必须验证**

```
mcp__auggie-mcp__codebase-retrieval({
  "information_request": "验证重构结果的正确性：
    - 重构类型: ${refactoring_type}
    - 目标: ${target_symbol}

    请检查：
    1. 重构是否完整（所有引用都已更新）
    2. 是否引入了语法错误
    3. 是否保持了原有功能
    4. 是否符合项目代码规范"
})
```

### Step 6: 应用重构（Claude 审查后执行）

🚨 **Claude 必须审查 Codex 输出后再应用**

1. 解析 Codex 返回的 diff
2. Claude 审查 diff 是否合理
3. 使用 Edit 工具应用修改
4. 记录变更

**变更记录格式**：

```json
{
  "id": "REF-001",
  "status": "completed",
  "changes": [
    {
      "file": "src/services/UserService.ts",
      "type": "modified",
      "diff_summary": "+3 methods, -1 method (refactored)"
    }
  ],
  "verification": {
    "syntax_check": "passed",
    "semantic_check": "passed"
  }
}
```

### Step 7: 生成执行结果

**写入 `${run_dir}/changes.md`**：

````markdown
# 重构变更清单

## 执行概览

| 指标     | 值           |
| -------- | ------------ |
| 执行时间 | ${timestamp} |
| 执行模式 | ${mode}      |
| 总建议数 | ${total}     |
| 已执行   | ${executed}  |
| 跳过     | ${skipped}   |
| 失败     | ${failed}    |

## 变更列表

### ✅ REF-001: Extract Method - processUserData

**状态**: 已完成

**变更文件**:

| 文件                        | 操作 | 变更摘要              |
| --------------------------- | ---- | --------------------- |
| src/services/UserService.ts | 修改 | +3 methods, -1 method |

**Diff 预览**:

```diff
--- a/src/services/UserService.ts
+++ b/src/services/UserService.ts
@@ -45,120 +45,35 @@
-  async processUserData(data: UserInput) {
-    // 120 lines of complex logic
-  }
+  async processUserData(data: UserInput) {
+    this.validateUserInput(data);
+    const transformed = this.transformUserData(data);
+    await this.persistUserData(transformed);
+  }
+
+  private validateUserInput(data: UserInput): void {
+    // validation logic
+  }
+
+  private transformUserData(data: UserInput): TransformedData {
+    // transformation logic
+  }
+
+  private async persistUserData(data: TransformedData): Promise<void> {
+    // persistence logic
+  }
```
````

**验证结果**:

- ✅ 语法检查: 通过
- ✅ 语义检查: 通过
- ⚠️ 测试更新: 需要添加新方法测试

---

### ⏭️ REF-002: Extract Class - AppManager

**状态**: 跳过（用户选择不执行）

**原因**: 高风险重构，用户选择稍后手动执行

---

## 后续建议

1. 运行测试验证: `npm test`
2. 检查变更: `git diff`
3. 添加新测试用例
4. 更新相关文档

````

**写入 `${run_dir}/refactor-result.json`**：

```json
{
  "timestamp": "2026-01-19T12:00:00Z",
  "mode": "auto",
  "summary": {
    "total": 5,
    "executed": 3,
    "skipped": 1,
    "failed": 1
  },
  "results": [
    {
      "id": "REF-001",
      "type": "extract_method",
      "target": "processUserData",
      "status": "completed",
      "risk_level": "low",
      "changes": [
        {
          "file": "src/services/UserService.ts",
          "operation": "modified",
          "insertions": 45,
          "deletions": 120
        }
      ],
      "verification": {
        "syntax": "passed",
        "semantic": "passed",
        "tests": "pending"
      }
    },
    {
      "id": "REF-002",
      "type": "extract_class",
      "target": "AppManager",
      "status": "skipped",
      "risk_level": "critical",
      "skip_reason": "用户选择稍后手动执行"
    }
  ],
  "affected_files": [
    "src/services/UserService.ts",
    "src/utils/helper.ts"
  ],
  "next_steps": [
    "运行测试: npm test",
    "查看变更: git diff",
    "添加新测试用例"
  ]
}
````

---

## 用户交互（interactive 模式）

**确认对话框示例**：

```
AskUserQuestion(
  questions=[
    {
      "question": "是否执行以下重构？",
      "header": "REF-001",
      "options": [
        {"label": "执行", "description": "Extract Method: processUserData → 3 个子方法"},
        {"label": "跳过", "description": "保留原代码，稍后手动处理"},
        {"label": "查看详情", "description": "显示完整的重构计划和影响分析"}
      ],
      "multiSelect": false
    }
  ]
)
```

---

## 质量门控

### 工具使用验证

- [ ] 后端重构调用了 codex-cli skill
- [ ] 前端重构调用了 gemini-cli skill
- [ ] 调用了 `mcp__auggie-mcp__codebase-retrieval` 验证结果
- [ ] 生成了 `changes.md`
- [ ] 生成了 `refactor-result.json`

### 执行质量验证

- [ ] 每次重构后验证语法
- [ ] 高风险重构有用户确认
- [ ] 记录了所有变更
- [ ] 提供了后续建议

---

## 回滚机制

如果重构失败或验证不通过：

1. 不应用当前 diff
2. 记录失败原因
3. 继续下一个重构（除非是依赖项）
4. 在结果中标记失败

---

## 约束

- 不检测代码气味（交给 smell-detector）
- 不生成重构建议（交给 refactor-suggester）
- 不分析影响范围（交给 impact-analyzer）
- **后端重构必须通过 codex-cli skill 执行**
- **前端重构必须通过 gemini-cli skill 执行**
- **Claude 负责审查和应用重构结果**
- **高风险重构必须用户确认**
- **每次重构后必须验证**
