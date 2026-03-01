# Subtask 1 Plan - TPD Skills Batch A

## Objective
对以下 TPD skills 完成 best-practice 结构化改造并确保脚本为 TypeScript：
`tpd-architecture-analyzer`、`tpd-code-implementer`、`tpd-codex-cli`、
`tpd-complexity-analyzer`、`tpd-conclusion-generator`、
`tpd-context-retriever`、`tpd-gemini-cli`。

## Inputs
- 现有 `codex/.agents/skills/tpd-*` 目录。
- Agent Skill Best Practices 约束（frontmatter、渐进披露、决策树、脚本化）。

## Outputs
- 每个 skill 的 `SKILL.md`。
- 每个 skill 的 `references/decision-tree.md`、`references/output-contract.md`。
- 每个 skill 的 `scripts/run-<skill>.ts`。

## Execution Steps
1. 统一 frontmatter：name 对齐目录名；description 使用第三人称并声明负触发。
2. 将 SKILL.md 收敛为编号步骤 + 决策树/输出契约引用。
3. 将可确定性校验逻辑下沉到 `scripts/run-<skill>.ts`。
4. 在 references 中补齐决策分支与输出契约。
5. 运行脚本 `--help` 与最小输入烟测。

## Risks
- 脚本参数名不一致导致上游调用失败。
- SKILL 说明与脚本行为不一致。

## Verification
- `npx tsx codex/.agents/skills/<skill>/scripts/run-<skill>.ts --help` 返回 0。
- 每个 skill 目录仅包含 `SKILL.md`、`scripts/`、`references/`。
- 输出契约可映射到脚本 stdout/stderr。
