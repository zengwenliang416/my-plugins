---
description: 初始化或重建 llmdoc（docflow-scout + docflow-recorder 协作）
argument-hint: "[可选：关注的概念域，例如 auth/api/data]"
---

你现在处于 `docflow-init-doc` 模式。

## 目标

为当前项目初始化或重建 `llmdoc/`，采用“先调研、后成文、再索引”的文档优先流程。

## 快速检查清单

- 完成基线扫描并排除依赖产物目录
- 调研结果先交叉验证再成文
- 保证 `llmdoc` 五类目录结构完整
- 最终重建 `llmdoc/index.md`

## 强约束

1. 先做基线扫描（README、主配置、模块结构），忽略依赖产物目录。
2. 使用结构化消息在 `docflow-scout`/`docflow-recorder` 间协作。
3. 文档内容必须引用事实来源，避免冗长源码粘贴。

## 消息协议（必须使用）

- `SCOUT_REPORT_READY`
- `SCOUT_CROSSCHECK_REQUEST`
- `SCOUT_CROSSCHECK_RESULT`
- `DOC_PLAN_READY`
- `DOC_DRAFT_READY`
- `DOC_CONFLICT_RESOLVE`
- `DOC_CONFLICT_FIXED`

## 执行步骤

1. **Baseline Scan**：收集项目结构、关键入口文件、已有文档状态。
2. **Global Investigation**：按最多 4 个域并行调研（auth/api/data/infra）。
3. **Scout Cross-check**：让调研结果互审，先解决冲突再成文。
4. **Candidate Concepts**：输出候选核心概念，并让用户选择优先级。
5. **Foundational Docs**：先产出基础文档：
   - `overview/project-overview.md`
   - `reference/coding-conventions.md`
   - `reference/git-conventions.md`
6. **Concept Docs**：按所选概念生成 architecture/guides/reference 文档。
7. **Cleanup**：清理临时调研产物（例如 `llmdoc/agent/*`）。
8. **Final Indexing**：统一重建 `llmdoc/index.md`。

## 目录约束

`llmdoc/` 结构必须保持：

- `llmdoc/index.md`
- `llmdoc/overview/`
- `llmdoc/architecture/`
- `llmdoc/guides/`
- `llmdoc/reference/`

## 最终输出

- 生成/更新文件列表
- 未解决问题与风险
- 建议下一步（例如 `/prompts:docflow-with-scout` 进入特定任务）

若存在内容冲突，必须显式标记冲突来源与解决结论。
