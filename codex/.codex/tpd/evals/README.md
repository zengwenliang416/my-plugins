# TPD Asset Evals

用于校验 TPD 在 Codex CLI 官方目录结构下的资产完整性与约束一致性。

## 运行方式

在仓库根目录执行：

```bash
python3 .codex/tpd/evals/check_tpd_assets.py
```

## 校验项

1. manifest 中登记的 prompts/skills/agents/config 文件存在。
2. `cases.yaml` 中每个 prompt 的关键标记词存在。
3. Thinking/Plan/Dev 三阶段消息协议与 prompt 内容一致。
4. Dev 阶段必须包含“最多 2 轮”修复边界。
5. 官方 skills 路径（`.agents/skills/tpd-*/SKILL.md`）中，frontmatter `name`
   与 manifest key 一致。
6. `.codex/config.toml` 已注册官方 agent roles：
   - `tpd_context_explorer`
   - `tpd_codex_core`
   - `tpd_gemini_core`
7. agent role 配置文件（`.codex/agents/*.toml`）包含 `model`、
   `model_reasoning_effort`、`sandbox_mode`、`developer_instructions`。
8. agent role 模型配置固定为：
   - `model = "gpt-5.3-codex"`
   - `model_reasoning_effort = "xhigh"`

## 通过标准

- 输出 `status` 为 `PASS`
- `checks_failed = 0`

## 失败排查

- 先看 `failed_checks` 的 `detail` 字段。
- 重点核对：
  - `.codex/tpd/manifest.yaml`
  - `.codex/tpd/evals/cases.yaml`
  - `.codex/prompts/tpd-*.md`
  - `.agents/skills/tpd-*/SKILL.md`
  - `.codex/config.toml`
  - `.codex/agents/tpd-*.toml`
