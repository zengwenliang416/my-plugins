# Skills Best-Practice Evals

用于校验 `codex/.agents/skills/*`（含 TPD + Docflow）是否符合
Agent Skill Best Practices 的最小落地要求。

## 运行方式

在仓库根目录执行：

```bash
python3 codex/.codex/skills/evals/check_skill_best_practices.py
```

## 校验项

1. 目录结构：仅允许 `SKILL.md`、`scripts/`、`references/`、`assets/`。
2. 目录约束：禁止 `README.md`、`CHANGELOG.md` 及嵌套子目录。
3. Frontmatter：`name` 与目录一致，`description` 使用第三人称并包含负触发。
4. SKILL 流程：包含编号步骤，引用 `references/decision-tree.md` 与
   `references/output-contract.md`，并具备渐进披露线索。
5. 决策树文档：存在决策树标题与分支表达（编号或箭头）。
6. 输出契约文档：存在输入/输出契约（接口或章节）。
7. 脚本规范：`scripts/` 下脚本均为 `.ts`，并具备 success/failure 信号。

## 通过标准

- 输出 `PASS`
- `checks_failed = 0`

## 失败排查

1. 查看 `failed_checks` 中的 `check` 与 `detail`。
2. 修复对应 skill 目录。
3. 重新执行校验脚本，直到全部通过。
