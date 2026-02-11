<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# 本地补充规则

## MCP 工具可用性判断

- `list_mcp_resources` / `resources/list` 失败（尤其是 `Method not found`）不等于 MCP 不可用。
- 必须直接调用目标 MCP 的核心方法进行验证（例如 `mcp__auggie-mcp__codebase-retrieval`）。
- 仅在核心方法调用也失败时，才判定该 MCP 不可用，并记录具体错误信息。

## 子任务执行前置计划（强制）

- 对于已拆分的每个子任务，**必须先写完整计划文档，再开始执行**。
- 子任务计划文件统一写入当前 OpenSpec change 的 `plan/` 目录，命名为 `subtask-<id>-plan.md`。
- 计划文档至少包含：目标（Objective）、输入（Inputs）、输出（Outputs）、执行步骤（Execution Steps）、风险（Risks）、验证（Verification）。
- 未生成子任务计划文档时，不得进入代码修改或命令执行阶段。
