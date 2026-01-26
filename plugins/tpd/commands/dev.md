---
description: "OpenSpec 开发工作流：OpenSpec 选择 → 最小阶段 → 原型生成 → 重构实施 → 审计验证 → 任务归档"
argument-hint: "[feature-description] [--proposal-id=<proposal_id>] [--task-type=frontend|backend|fullstack]"
allowed-tools:
  - Skill
  - AskUserQuestion
  - Read
  - Write
  - Task
  - Bash
---

# /tpd:dev - OpenSpec 开发工作流命令

## 概述

dev 阶段严格对齐 OpenSpec Implementation：**只实现 tasks.md 中“最小可验证阶段”**，并强制多模型原型 → 重构 → 审计流程。外部模型输出仅作为参考，禁止直接落盘。

**支持无参数调用**：直接执行 `/tpd:dev` 时，会自动读取 OpenSpec Active Change 并让用户确认提案。

---

## 🚨🚨🚨 强制执行规则 🚨🚨🚨

- ✅ 必须先 `openspec view` 并确认 `proposal_id`
- ✅ 必须先 `/openspec:apply <proposal_id>`
- ✅ 只实现 tasks.md 中最小可验证阶段（禁止一次做完全部）
- ✅ 外部模型只产出 Unified Diff Patch，禁止直接应用
- ✅ 应用前必须做 Side-effect Review
- ✅ 完成后更新 tasks.md 勾选状态
- ✅ 全部任务完成后执行 `/openspec:archive`

**禁止行为：**

- ❌ 未确认 proposal_id 就开始实施
- ❌ 直接按外部模型 diff 落盘
- ❌ 跳过 Side-effect Review
- ❌ 一次性完成全部 tasks

---

## Phase 0: OpenSpec 状态检查

1. 执行（与官方流程一致的 OpenSpec Dashboard 探测）：

```bash
openspec view 2>/dev/null || openspec list 2>/dev/null || ls -la openspec 2>/dev/null || echo "OpenSpec not initialized"
```

2. proposal_id 解析优先级：
   - `--proposal-id` 参数
   - 若 `openspec view` 仅有 1 个 Active Change → 自动选择
   - 否则用户从 `openspec view` 输出中选择

3. 未初始化 OpenSpec → 提示执行 `/tpd:init` 后再继续

---

## Phase 1: 初始化

1. 解析参数：
   - TASK_TYPE: fullstack (默认) | frontend | backend
   - FEATURE: 可选；若缺省则从 plan/proposal 提取
   - PROPOSAL_ID: 必须确认（--proposal-id 或从 OpenSpec Active Change 选择）

2. 生成运行目录路径（固定路径，位于 OpenSpec 之下）：
   - DEV_DIR: `openspec/changes/${PROPOSAL_ID}/artifacts/dev`

```bash
mkdir -p "${DEV_DIR}"
```

3. 若未提供 FEATURE：从 proposal.md / tasks.md 生成输入摘要

---

## Phase 2: 应用 OpenSpec

执行：

```
/openspec:apply ${PROPOSAL_ID}
```

并定位任务文件：

```
TASKS_FILE=\"openspec/changes/${PROPOSAL_ID}/tasks.md\"
```

将 tasks.md 复制到 `${DEV_DIR}/tasks.md` 作为本阶段工作清单（**源文件仍在 openspec/**）。

---

## Phase 3: 最小可验证阶段选择（必须）

1. 读取 `${DEV_DIR}/tasks.md`
2. 选择**最小可验证阶段**（1~3 个任务，能形成闭环验证）
3. 写入 `${DEV_DIR}/tasks-scope.md`

**⏸️ 硬停止**：AskUserQuestion 展示本次任务范围，确认后继续

---

## Phase 4: 上下文检索

**如当前运行目录已提供 context.md，可跳过；否则必须执行：**

```
Skill(skill=\"tpd:context-retriever\", args=\"run_dir=${DEV_DIR}\")
```

**验证**：确认 `${DEV_DIR}/context.md` 已生成

---

## Phase 5: 任务分析（多模型并行）

根据 task_type 并行调用：

```
Skill(skill=\"tpd:multi-model-analyzer\", args=\"run_dir=${DEV_DIR} model=codex\")
Skill(skill=\"tpd:multi-model-analyzer\", args=\"run_dir=${DEV_DIR} model=gemini\")
```

**验证**：`analysis-codex.md` / `analysis-gemini.md`

**⏸️ 硬停止**：展示分析摘要，确认方案后继续

---

## Phase 6: 原型生成（多模型并行）

```
Skill(skill=\"tpd:prototype-generator\", args=\"run_dir=${DEV_DIR} model=codex focus=backend,api,logic\")
Skill(skill=\"tpd:prototype-generator\", args=\"run_dir=${DEV_DIR} model=gemini focus=frontend,ui,styles\")
```

**验证**：`prototype-codex.diff` / `prototype-gemini.diff`

---

## Phase 7: 重构实施（多模型并行）

```
Skill(skill=\"tpd:code-implementer\", args=\"run_dir=${DEV_DIR} model=codex focus=backend,api,logic\")
Skill(skill=\"tpd:code-implementer\", args=\"run_dir=${DEV_DIR} model=gemini focus=frontend,ui,styles\")
```

**验证**：`changes-codex.md` / `changes-gemini.md` / `changes.md`

---

## Phase 8: Side-effect Review（必须）

检查所有变更是否严格限于 `tasks-scope.md`，禁止波及无关模块：

- 是否新增/修改了未授权文件？
- 是否引入了未批准依赖？
- 是否破坏既有接口契约？

如发现问题，必须回到 Phase 7 进行修正。

---

## Phase 9: 多模型审计验证

```
Skill(skill=\"tpd:audit-reviewer\", args=\"run_dir=${DEV_DIR} model=codex focus=security,performance\")
Skill(skill=\"tpd:audit-reviewer\", args=\"run_dir=${DEV_DIR} model=gemini focus=ux,accessibility\")
```

**验证**：`audit-codex.md` / `audit-gemini.md`

**⏸️ 硬停止**：如有 Critical 问题必须修复

---

## Phase 10: 任务勾选与阶段收尾

1. 将本阶段完成的任务在 `openspec/changes/${PROPOSAL_ID}/tasks.md` 标记为 `- [x]`
2. 将同步后的 tasks.md 拷贝回 `${DEV_DIR}/tasks.md`

**⏸️ 硬停止**：询问是否进入下一阶段（如需继续，重复 Phase 3~10）

---

## Phase 11: OpenSpec 归档

当 tasks.md 全部完成后：

```
/openspec:archive
```

---

## Phase 12: 交付

```
🎉 开发阶段完成！

📋 提案: ${PROPOSAL_ID}
🔀 类型: ${TASK_TYPE}
📁 产物:
  ${DEV_DIR}/
  ├── input.md
  ├── context.md
  ├── tasks.md
  ├── tasks-scope.md
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
