---
mode: plan
cwd: /Users/wenliang_zeng/workspace/open_sources/ccg-workflows
task: 优化 sync-plugins.sh 安装输出体验
complexity: medium
planning_method: builtin
created_at: 2026-02-08T23:01:14+0800
---

# Plan: 优化 sync-plugins.sh 安装输出体验

🎯 任务概述
当前 `scripts/sync-plugins.sh` 的安装/同步输出“太丑”，需要在不改变核心行为的前提下，优化 CLI 输出的可读性、一致性与可扫描性，并确保非交互/quiet 模式下的稳定性。

📋 执行计划
1. 现状审计与痛点清单：运行 `-l`、默认同步、`-i`、`-s`、`-d` 等路径，记录对齐、截断、颜色与信息密度问题。
2. 设计目标与约束：明确保持兼容（不改变功能逻辑）、零外部依赖、在非 TTY 下可读、对超长描述有稳定裁切。
3. 输出规范设计：统一表头与列宽策略、明确版本/统计的展示位置、为安装/同步/错误/警告定义固定样式。
4. 代码改造实施：在 `sync-plugins.sh` 中集中输出逻辑（表格渲染与摘要），引入可复用的格式化函数并调整现有打印点。
5. 文档与变更记录：按需更新 README/CHANGELOG/llmdoc 中的脚本说明（如示例输出或参数解释）。
6. 验证与回归：`bash -n` 校验语法，执行多路径命令验证输出效果，模拟非 TTY 场景（如管道输出）。

⚠️ 风险与注意事项
- 终端字体/emoji 宽度差异可能导致对齐偏移，需要为非彩色/非 emoji 场景提供退化样式。
- `claude` CLI 不一定可用，安装路径验证需允许跳过或使用 dry-run。

📎 参考
- `/Users/wenliang_zeng/workspace/open_sources/ccg-workflows/scripts/sync-plugins.sh:1`
- `/Users/wenliang_zeng/workspace/open_sources/ccg-workflows/README.md:1`
