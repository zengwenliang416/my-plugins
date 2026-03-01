# Change: Refactor Codex Skills to Best-Practice Authoring Standard

## Why

当前 `codex/.agents/skills` 中的 TPD/Docflow skills 在结构化前言、渐进披露、
决策树表达、脚本下沉与可验证性方面不一致，难以稳定复用。

## What Changes

- 将 `codex/.agents/skills/{tpd-*,docflow-*}/SKILL.md` 统一为最佳实践模板。
- 统一 frontmatter description：第三人称 + 明确不适用场景（negative triggers）。
- 每个 skill 增加渐进披露目录（`references/`）与 TS 脚本目录（`scripts/`）。
- 所有新增脚本使用 TypeScript（`.ts`），并输出明确 stdout/stderr。
- 新增技能静态校验脚本，验证目录结构、frontmatter、流程结构与脚本扩展名。

## Impact

- Affected specs: `codex-skill-best-practices`
- Affected code:
  - `codex/.agents/skills/tpd-*`
  - `codex/.agents/skills/docflow-*`
  - `codex/.codex/skills/evals/*`
