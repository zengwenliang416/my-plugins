# Docflow Eval Harness (Static)

受 OpenAI Cookbook 中“可重复评估（harness）”思路启发，这里提供一个轻量、可重复执行的静态评估入口，用于验证 docflow 资产是否完整、关键约束是否仍然存在。

## 评估目标

- 资产完整：prompts/skills/agents 文件存在。
- 约束完整：文档优先、消息协议、2 轮封顶修复策略未丢失。
- 命名一致：入口为 `/prompts:docflow-*`，skill/agent 统一 `docflow-*` 前缀。

## 文件说明

- `../manifest.yaml`：docflow 资产清单与消息契约。
- `cases.yaml`：三条主流程静态 case。
- `check_docflow_assets.py`：评估脚本。

## 运行方式

在仓库根目录执行：

```bash
python3 .codex/docflow/evals/check_docflow_assets.py
```

## 通过标准

- 输出 `PASS`。
- `checks_failed = 0`。

## 失败排查

1. 查看脚本输出中的 `failed_checks`。
2. 对照 `manifest.yaml` 路径确认是否遗漏同步。
3. 对照对应 prompt/skill/agent 文本补回丢失的关键约束。
