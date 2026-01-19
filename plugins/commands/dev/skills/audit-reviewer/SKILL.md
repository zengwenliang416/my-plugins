---
name: audit-reviewer
description: |
  【触发条件】开发工作流第五步：审计代码变更，确保质量和安全。
  【核心产出】输出 ${run_dir}/audit-{model}.md，包含审计结果和修复建议。
  【不触发】代码实施（用 code-implementer）、原型生成（用 prototype-generator）。
  【先问什么】changes.md 缺失时，询问需要审计的文件范围
  【强制工具】必须调用 codex-cli 或 gemini-cli Skill，禁止 Claude 自行审计。
allowed-tools:
  - Read
  - Write
  - Skill
  - mcp__sequential-thinking__sequentialthinking
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
  - name: model
    type: string
    required: true
    description: 审计模型（codex 或 gemini）
  - name: focus
    type: string
    required: false
    description: 审计重点（security,performance 或 ux,accessibility）
---

# Audit Reviewer - 审计审查原子技能

## 🚨 CRITICAL: 必须调用 codex-cli 或 gemini-cli Skill

```
┌─────────────────────────────────────────────────────────────────┐
│  ❌ 禁止：Claude 自己做审计（跳过外部模型）                       │
│  ❌ 禁止：直接 Bash 调用 codeagent-wrapper                       │
│  ✅ 必须：通过 Skill 工具调用 codex-cli 或 gemini-cli            │
│                                                                  │
│  这是多模型协作的核心！Claude 不能替代 Codex/Gemini 审计！        │
│                                                                  │
│  执行顺序（必须遵循）：                                          │
│  1. 读取 changes.md                                             │
│  2. Skill 调用 codex-cli 或 gemini-cli                          │
│  3. 将外部模型输出写入 audit-{model}.md                          │
│                                                                  │
│  如果跳过 Step 2，整个多模型审计失效！                           │
└─────────────────────────────────────────────────────────────────┘
```

## 职责边界

- **输入**: `run_dir` + `model` 类型 + `focus`
- **输出**: `${run_dir}/audit-{codex|gemini}.md`
- **单一职责**: 只做审计审查，不做代码修改

## MCP 工具集成

| MCP 工具              | 用途                             | 触发条件        |
| --------------------- | -------------------------------- | --------------- |
| `sequential-thinking` | 结构化审计策略，确保覆盖所有维度 | 🚨 每次执行必用 |

## 执行流程

### Step 0: 结构化审计规划（sequential-thinking）

🚨 **必须首先使用 sequential-thinking 规划审计策略**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "规划代码审计策略。需要：1) 理解变更范围 2) 确定审计视角 3) 识别关键路径 4) 检查安全/性能 5) 评估可维护性",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**思考步骤**：

1. **变更范围理解**：从 changes.md 提取变更文件和代码
2. **审计视角确定**：根据 model 参数确定安全/UX 视角
3. **关键路径识别**：识别高风险代码路径
4. **安全/性能检查**：检查 OWASP Top 10 和性能问题
5. **可维护性评估**：评估代码质量和可维护性

### Step 1: 读取变更清单

```bash
读取 ${run_dir}/changes.md
提取: 变更文件列表、新增/修改/删除的代码
```

### Step 2: 确定审计视角

根据模型类型确定审计重点：

| 模型   | Skill      | 审计视角  | 关注点                                     |
| ------ | ---------- | --------- | ------------------------------------------ |
| Codex  | codex-cli  | 后端/安全 | 安全漏洞、性能问题、错误处理、边界条件     |
| Gemini | gemini-cli | 前端/UX   | 可访问性、响应式设计、用户体验、设计一致性 |

### Step 3: 调用外部模型 Skill（🚨 必须执行）

**🚨🚨🚨 这是关键步骤！**

**❌ 禁止行为：**

- ❌ 使用 Bash 工具调用 codeagent-wrapper
- ❌ 自己做审计分析
- ❌ 跳过 Skill 直接写审计报告

**✅ 唯一正确做法：使用 Skill 工具**

**对于 Codex 模型（安全/性能审计），立即执行：**

```
Skill(skill="codex-cli", args="--role reviewer --prompt '审查代码变更。变更清单路径: ${RUN_DIR}/changes.md。请先读取该文件，然后审查代码。审查重点: 安全漏洞(SQL注入/XSS/CSRF)、性能问题(N+1/内存泄漏)、错误处理、边界条件。输出: 1.问题清单(Critical>Major>Minor) 2.修复建议 3.评分(1-5) 4.建议(APPROVE/REQUEST_CHANGES/COMMENT)'")
```

**对于 Gemini 模型（UX/可访问性审计），立即执行：**

```
Skill(skill="gemini-cli", args="--role reviewer --prompt '审查前端代码变更。变更清单路径: ${RUN_DIR}/changes.md。请先读取该文件，然后审查代码。审查重点: 可访问性(ARIA/键盘导航)、响应式设计、用户体验、设计一致性。输出: 1.问题清单(Critical>Major>Minor) 2.修复建议 3.评分(1-5) 4.建议(APPROVE/REQUEST_CHANGES/COMMENT)'")
```

**⚠️ 如果你发现自己在做审计分析而不是调用 Skill，立即停止并改用 Skill 工具！**

### Step 4: 结构化输出

将审计结果写入 `${run_dir}/audit-{model}.md`：

```markdown
# {Codex|Gemini} 审计报告

## 审计信息

- 模型: {codex|gemini}
- 视角: {后端/安全|前端/UX}
- 审计时间: [timestamp]

## 审计结果

### 整体评分

| 维度            | 评分    | 说明 |
| --------------- | ------- | ---- |
| 安全性/可访问性 | X/5     | ...  |
| 性能/响应式     | X/5     | ...  |
| 代码质量        | X/5     | ...  |
| 可维护性        | X/5     | ...  |
| **总分**        | **X/5** | ...  |

### 问题清单

#### Critical（必须修复）

| #   | 文件:行号     | 问题描述     | 修复建议       |
| --- | ------------- | ------------ | -------------- |
| 1   | src/foo.ts:25 | SQL 注入风险 | 使用参数化查询 |

#### Major（建议修复）

| #   | 文件:行号     | 问题描述   | 修复建议       |
| --- | ------------- | ---------- | -------------- |
| 2   | src/bar.ts:10 | 未处理异常 | 添加 try-catch |

#### Minor（可选修复）

| #   | 文件:行号      | 问题描述   | 修复建议           |
| --- | -------------- | ---------- | ------------------ |
| 3   | src/utils.ts:5 | 命名不清晰 | 改为更具描述性名称 |

### 亮点

- [值得肯定的实现]
- [良好的代码实践]

## 结论

- **建议**: ✅ APPROVE / 🔄 REQUEST_CHANGES / 💬 COMMENT
- **理由**: [一句话说明]

---

基于变更: changes.md
下一步: 综合审计结果决定是否交付
```

## 并行执行（后台模式）

支持双模型并行审计，由编排器使用 Task 工具协调：

```
# 编排器中的调用
Task(skill="audit-reviewer", args="run_dir=${RUN_DIR} model=codex focus=security,performance", run_in_background=true) &
Task(skill="audit-reviewer", args="run_dir=${RUN_DIR} model=gemini focus=ux,accessibility", run_in_background=true) &
wait
# 综合两份审计报告
```

## 返回值

执行完成后，返回：

```
{模型} 审计完成。
输出文件: ${run_dir}/audit-{model}.md

📊 审计结果:
- Critical: X 个
- Major: Y 个
- Minor: Z 个
- 总分: A/5

建议: {APPROVE|REQUEST_CHANGES|COMMENT}

下一步: 等待所有审计完成后综合评估
```

## 质量门控

- ✅ 审计覆盖所有变更文件
- ✅ Critical 问题必须修复才能通过
- ✅ 总分 ≥ 3/5 才能通过
- ✅ 两个模型的审计意见综合考虑

## 约束

- 不做代码修改（交给 code-implementer）
- 不生成原型（交给 prototype-generator）
- 审计意见仅供参考，最终决策由用户做出
- 外部模型的审计需要 Claude 综合评估

## 🚨 强制工具验证

**执行此 Skill 后，必须满足以下条件：**

| 检查项              | 要求 | 验证方式                            |
| ------------------- | ---- | ----------------------------------- |
| Skill 调用          | 必须 | 检查 codex-cli 或 gemini-cli 被调用 |
| 外部模型输出        | 必须 | audit-{model}.md 包含模型响应       |
| Claude 自行审计     | 禁止 | 不能跳过 Skill 直接写结果           |
| 直接 Bash codeagent | 禁止 | 必须通过 Skill 工具调用             |

**如果没有调用 codex-cli 或 gemini-cli Skill，此 Skill 执行失败！**
