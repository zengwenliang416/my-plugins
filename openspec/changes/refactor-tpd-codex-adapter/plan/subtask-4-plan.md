# Subtask 4 Plan

## Objective
迁移 TPD 两个核心模型代理：`tpd-codex-core` 与 `tpd-gemini-core`。

## Inputs
- `plugins/tpd/agents/codex-core.md`
- `plugins/tpd/agents/gemini-core.md`
- `.codex/tpd/manifest.yaml`

## Outputs
- `.codex/agents/tpd-codex-core.md`
- `.codex/agents/tpd-gemini-core.md`

## Execution Steps
1. 保留 role/mode 输入合同与输出文件合同。
2. 把技能调用名统一改为 `tpd-codex-cli` / `tpd-gemini-cli`。
3. 保留 ACK、heartbeat、错误上报与验证条款。

## Risks
- 角色产物路径写错造成阶段串联失败。
- 未替换旧技能名导致执行链断裂。

## Verification
- 两个 agent 文件存在且 name 正确。
- 两个 agent 都包含 `constraint|architect|implementer|auditor` 四类 role。
- 两个 agent 都声明 `fix_request` / `fix_done` 等修复通信要求。
