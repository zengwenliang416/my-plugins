## 1. Planning and Scaffolding

- [x] 1.1 建立 TPD Codex 迁移映射与分批子任务计划（每批最多 3 文件）
- [x] 1.2 创建 prompts/agents/skills/tpd manifest 与 eval 目录骨架

## 2. Prompt Migration

- [x] 2.1 迁移 `tpd-thinking`、`tpd-plan`、`tpd-dev` prompts
- [x] 2.2 迁移 `tpd-init` prompt，并完成入口注册

## 3. Agent Migration

- [x] 3.1 迁移 `tpd-context-explorer` agent
- [x] 3.2 迁移 `tpd-codex-core` 与 `tpd-gemini-core` agents

## 4. Skill Migration

- [x] 4.1 迁移 Thinking 相关 skills（3 个）
- [x] 4.2 迁移 Thinking→Plan 桥接 skills（3 个）
- [x] 4.3 迁移 Plan 中段 skills（3 个）
- [x] 4.4 迁移 Plan 收敛与 Dev 执行 skills（3 个）
- [x] 4.5 迁移外部模型封装 skills（2 个）

## 5. Validation

- [x] 5.1 实现并运行 TPD 静态校验脚本
- [x] 5.2 校验 manifest、协议、命名一致性与关键约束词
- [ ] 5.3 Update project documentation using docflow-recorder


## 6. Official Codex Alignment

- [x] 6.1 创建 `.codex/config.toml` 并注册 TPD 官方多智能体 roles
- [x] 6.2 创建 `.codex/agents/*.toml` 角色配置文件
- [x] 6.3 将 TPD skills 迁移到官方 `.agents/skills/` 目录
- [x] 6.4 更新 TPD eval harness 以校验官方目录与角色配置

## 7. Model Profile Alignment

- [x] 7.1 将 `.codex/agents/*.toml` 模型统一为 `gpt-5.3-codex`
- [x] 7.2 将 `.codex/agents/*.toml` 推理强度统一为 `xhigh`
- [x] 7.3 将 `.codex/agents/*.md` 的 `model` 字段统一为 `gpt-5.3-codex`

## 8. Legacy Cleanup

- [x] 8.1 删除 `.codex/agents/tpd-*.md` legacy agent copies
- [x] 8.2 删除 `.codex/skills/tpd-*` legacy skill copies并清理空目录
- [x] 8.3 将 OpenSpec 规范更新为官方路径唯一事实源
