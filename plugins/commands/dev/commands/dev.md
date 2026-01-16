---
description: "开发工作流：上下文检索 → 需求分析 → 原型生成 → 代码实施 → 审计验证"
argument-hint: <feature-description> [--task-type=frontend|backend|fullstack]
allowed-tools:
  - Skill
  - AskUserQuestion
  - Read
---

# /dev - 开发工作流命令

## 🚨🚨🚨 强制执行规则 🚨🚨🚨

**你必须按照下面的 Phase 顺序，使用 Skill 工具调用对应的 skill。**

**禁止行为（违反则工作流失败）：**

- ❌ 跳过 Skill 调用，自己直接写代码
- ❌ 用 Read/Write/Bash 替代 Skill 调用
- ❌ 省略任何 Phase

**每个 Phase 你必须：**

1. 调用指定的 Skill（使用 Skill 工具）
2. 等待 Skill 执行完成
3. 验证输出文件存在
4. 再进入下一个 Phase

---

## Phase 1: 初始化

1. 解析参数：
   - TASK_TYPE: fullstack (默认) | frontend | backend
   - FEATURE: 用户描述的功能需求

2. 生成运行目录路径（不需要手动创建，Skill 会自动创建）：
   - RUN_ID: 当前 UTC 时间戳，格式 YYYYMMDDTHHMMSSZ
   - RUN_DIR: `.claude/developing/runs/${RUN_ID}`

3. 使用 AskUserQuestion 确认执行计划

---

## Phase 2: 上下文检索

### 🚨🚨🚨 强制执行 🚨🚨🚨

**立即调用 Skill 工具：**
```
Skill(skill="context-retriever", args="run_dir=${RUN_DIR}")
```

**⚠️ 新项目/空代码库时**：context-retriever 内部必须调用 exa skill 获取外部文档！

**验证**：
- 确认 `${RUN_DIR}/context.md` 已生成
- 如果是新项目，确认 context.md 包含外部文档部分

---

## Phase 3: 需求分析（多模型并行）

### 🚨🚨🚨 强制执行 - 禁止跳过 🚨🚨🚨

**❌ 禁止行为：**
- ❌ 自己做需求分析
- ❌ 跳过 Skill 调用直接写分析报告

**✅ 唯一正确做法：调用 Skill 工具**

### 立即执行

根据 task_type：
- fullstack: 并行调用两个 Skill
- frontend: 仅调用 gemini
- backend: 仅调用 codex

**Skill 调用 1（后端分析）：**
```
Skill(skill="multi-model-analyzer", args="run_dir=${RUN_DIR} model=codex")
```

**Skill 调用 2（前端分析）：**
```
Skill(skill="multi-model-analyzer", args="run_dir=${RUN_DIR} model=gemini")
```

**验证**：确认 `${RUN_DIR}/analysis-codex.md` 和/或 `${RUN_DIR}/analysis-gemini.md` 已生成

**⏸️ 硬停止**：使用 AskUserQuestion 展示分析摘要，确认方案后继续

---

## Phase 4: 原型生成（多模型并行）

### 🚨🚨🚨 强制执行 - 禁止跳过 🚨🚨🚨

**❌ 禁止行为（违反则工作流失败）：**
- ❌ 自己用 Write 工具写代码
- ❌ 自己用 Bash 创建文件
- ❌ 跳过 Skill 调用直接实现
- ❌ 说"我来生成代码"然后自己写

**✅ 唯一正确做法：调用 Skill 工具**

### 立即执行（不要犹豫，不要自己写代码）

**你必须现在调用 Skill 工具。参数如下：**

根据 task_type：
- fullstack: 并行调用两个 Skill
- frontend: 仅调用 gemini
- backend: 仅调用 codex

**Skill 调用 1（后端）：**
```
Skill(skill="prototype-generator", args="run_dir=${RUN_DIR} model=codex focus=backend,api,logic")
```

**Skill 调用 2（前端）：**
```
Skill(skill="prototype-generator", args="run_dir=${RUN_DIR} model=gemini focus=frontend,ui,styles")
```

**验证**：确认 `${RUN_DIR}/prototype-codex.diff` 和/或 `${RUN_DIR}/prototype-gemini.diff` 已生成

**如果你发现自己在用 Write 写代码而不是调用 Skill，立即停止并改用 Skill 工具！**

---

## Phase 5: 代码实施（多模型并行）

### 🚨🚨🚨 强制执行 - 禁止跳过 🚨🚨🚨

**❌ 禁止行为（违反则工作流失败）：**
- ❌ 自己用 Write/Edit 工具实施代码
- ❌ 跳过 Skill 调用直接修改文件
- ❌ 说"我来实施"然后自己改代码

**✅ 唯一正确做法：调用 Skill 工具**

### 立即执行

**Skill 调用 1（后端）：**
```
Skill(skill="code-implementer", args="run_dir=${RUN_DIR} model=codex focus=backend,api,logic")
```

**Skill 调用 2（前端）：**
```
Skill(skill="code-implementer", args="run_dir=${RUN_DIR} model=gemini focus=frontend,ui,styles")
```

**验证**：确认 `${RUN_DIR}/changes-codex.md` 和/或 `${RUN_DIR}/changes-gemini.md` 已生成

**合并变更清单**：将两份 changes-\*.md 合并为 `${RUN_DIR}/changes.md`

---

## Phase 6: 审计验证（多模型并行）

### 🚨🚨🚨 强制执行 - 禁止跳过 🚨🚨🚨

**❌ 禁止行为：**
- ❌ 自己做审计分析
- ❌ 跳过 Skill 调用直接写审计报告

**✅ 唯一正确做法：调用 Skill 工具**

### 立即执行

**Skill 调用 1（安全/性能审计）：**
```
Skill(skill="audit-reviewer", args="run_dir=${RUN_DIR} model=codex focus=security,performance")
```

**Skill 调用 2（UX/可访问性审计）：**
```
Skill(skill="audit-reviewer", args="run_dir=${RUN_DIR} model=gemini focus=ux,accessibility")
```

**验证**：确认 `${RUN_DIR}/audit-codex.md` 和 `${RUN_DIR}/audit-gemini.md` 已生成

**⏸️ 硬停止**：展示审计结果，如有 Critical 问题需用户确认

---

## Phase 7: 交付

输出完成摘要：

```
🎉 开发任务完成！

📋 任务: ${FEATURE}
🔀 类型: ${TASK_TYPE}

📊 审计结果:
- Codex 评分: X/5 (安全/性能)
- Gemini 评分: X/5 (UX/可访问性)

📁 产物:
  ${RUN_DIR}/
  ├── context.md
  ├── analysis-codex.md
  ├── analysis-gemini.md
  ├── prototype-codex.diff
  ├── prototype-gemini.diff
  ├── changes-codex.md
  ├── changes-gemini.md
  ├── changes.md
  ├── audit-codex.md
  └── audit-gemini.md
```

---

## 特殊情况处理

### 新项目（空代码库）

Phase 2 的 context-retriever 会：

- 跳过内部代码检索（无代码可检索）
- 使用 exa skill 搜索外部文档和最佳实践

### 简单任务

如果用户明确要求跳过多模型协作，可以：

- Phase 3/4/5/6 改为单模型
- 但必须仍然调用 Skill，不能自己替代

### 后台并行执行

支持使用 Task 工具的 `run_in_background=true` 参数实现后台并行：

```
# 示例：Phase 3 后台并行
Task(skill="multi-model-analyzer", args="run_dir=${RUN_DIR} model=codex", run_in_background=true)
Task(skill="multi-model-analyzer", args="run_dir=${RUN_DIR} model=gemini", run_in_background=true)
# 等待完成后继续
```
