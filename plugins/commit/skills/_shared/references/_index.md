# Commit Skills 渐进式加载索引

本索引用于 commit 插件的“方案3：先索引后按需加载”。

## 全局规则

1. 先读运行产物（`${run_dir}/*.json` / `*.md`），不要先读所有 references。
2. 优先读结构化 JSON（规则、映射、阈值），仅在歧义时再读 Markdown 说明。
3. 每个阶段只加载当前技能所需的 1-2 个参考文件。
4. 禁止一次性加载全部技能文档、全部 references 或全部 assets。

## 阶段资源映射

| 阶段 | Skill | 先读运行产物 | 首选参考 | 按需补充 |
| --- | --- | --- | --- | --- |
| 1 | `change-collector` | `${run_dir}` | `change-collector/references/git-status-codes.json` | `change-collector/references/git-status-mapping.md` |
| 2 | `change-analyzer` | `${run_dir}/changes-raw.json` | `change-analyzer/references/analysis-rules.json` | `change-analyzer/references/analysis-rules.md` |
| 3.5 | `branch-creator` | `${run_dir}/changes-analysis.json` | `branch-creator/references/branch-naming.json` | `branch-creator/references/branch-naming.md` |
| 4 | `analysis-synthesizer` | `${run_dir}/semantic-analysis.json`, `${run_dir}/symbol-analysis.json` | `_shared/references/commit-taxonomy.json` | `change-analyzer/references/analysis-rules.json` |
| 5 | `message-generator` | `${run_dir}/changes-analysis.json` | `_shared/references/commit-taxonomy.json`, `message-generator/references/commit-templates.json` | `message-generator/references/conventional-commits.md` |
| 5.5 | `changelog-generator` | `${run_dir}/changes-analysis.json`, `${run_dir}/commit-message.md` | `_shared/references/commit-taxonomy.json` | `changelog-generator/references/changelog-format.md` |
| 6 | `commit-executor` | `${run_dir}/commit-message.md` | `commit-executor/references/pre-commit-checks.json` | `commit-executor/references/git-safety.md` |

## 推荐加载顺序（模板）

1. 读取当前阶段输入产物，提取关键字段。
2. 读取对应 JSON 参考（mapping / thresholds / templates）。
3. 仅在冲突、异常、边界场景时再读取 Markdown 深度说明。
4. 生成输出时优先复用 `assets/*.template.*`，避免在 SKILL 中展开大样例。
