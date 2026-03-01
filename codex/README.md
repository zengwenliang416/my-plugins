# Codex Bundle Preview

这个目录用于预览最终安装到系统根目录时的结构（实体拷贝版）。

- `codex/.codex`：Codex CLI 配置与 prompts/agents/evals
- `codex/.agents`：skills 目录

## 一键安装脚本

使用 `install-codex-bundle.sh`，可选择安装到用户级或项目级。

```bash
# 用户级（安装到 ~/.codex 与 ~/.agents）
./codex/install-codex-bundle.sh --scope user

# 项目级（安装到 <project-root>/.codex 与 <project-root>/.agents）
./codex/install-codex-bundle.sh --scope project --project-root /path/to/project

# 预演（不写入）
./codex/install-codex-bundle.sh --scope user --dry-run
```

## 安装策略

- 默认 `--mode merge`：非破坏合并，不删除目标已有文件。
- 可选 `--mode replace`：按源目录替换同步（会删除目标多余文件）。
- `config.toml` 采用**追加合并**：
  - 不会整体覆盖你现有配置。
  - 只追加缺失的 `agents.*` 与 `[[skills.config]]`。
  - `skills.config.path` 会写成绝对路径并指向 `.../SKILL.md`。
- 默认自动备份到 `~/.backup/codex-bundle-installer/<timestamp>-<scope>/`。

## 校验策略

- 默认执行：
  - `python3 .codex/tpd/evals/check_tpd_assets.py`
  - `python3 .codex/docflow/evals/check_docflow_assets.py`
- 可选执行全量 skills 校验：
  - `--verify-skill-all`

## 手动安装（备用）

```bash
cp -R codex/.codex ~/.codex
cp -R codex/.agents ~/.agents
```
