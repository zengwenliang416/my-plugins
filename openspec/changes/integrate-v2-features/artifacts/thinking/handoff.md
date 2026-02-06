---
proposal_id: integrate-v2-features
generated_at: "2026-02-06T00:25:00Z"
source: thinking
---

# 交接摘要（Thinking → Plan）

## 问题概览

将 Claude Code v2.1.32-33 的 4 项新功能（Agent Teams、Agent Memory、TeammateIdle/TaskCompleted Hooks、Task(agent_type) 限制）集成到 ccg-workflows 的 7 个插件系统中（23 agents, 50+ skills, 12 hooks）。

## 约束（Constraints）

### 硬约束

1. **HC-1**: UI-Design 9 个 agent 缺少 YAML frontmatter，是 Phase 0 前置条件
2. **HC-2**: 未知 frontmatter 字段必须被旧版 CLI 静默忽略（待验证）
3. **HC-3**: thinking.md 第 157 行明确禁止后台执行，与 Agent Teams 异步模型不兼容
4. **HC-4**: 双模型多样性必须保留，Agent Teams 不得跨 codex/gemini 共享部分结果
5. **HC-5**: `run_dir` 文件系统仍是 artifact 唯一真实来源
6. **HC-6**: hooks 只在 hooks.json 注册，禁止在 plugin.json 声明
7. **HC-7**: Agent 名称必须全局唯一（native memory 用名称做目录 key）
8. **HC-8**: MEMORY.md 200 行限制，需要压缩策略
9. **HC-9**: Task(agent_type) 在 command 级别应用，非 agent 级别（23 个均为叶节点 agent）
10. **HC-10**: TeammateIdle/TaskCompleted 的 JSON schema 未知，需防御性解析
11. **HC-11**: Agent Teams 需要实验性标志，必须有条件回退到当前 Task() 模式
12. **HC-12**: 50+ 现有 skills 的向后兼容不可协商

### 软约束

1. 按 command 增量迁移，避免一刀切
2. commit 跳过 Agent Teams（原子快速路径）
3. brainstorm/refactor 跳过 Agent Teams（零 Task() 调用）
4. 新 hook 脚本遵循 bash+jq 惯例
5. 新建 `scripts/orchestration/` 目录
6. Memory scope: 8 agents → user, 15 agents → project
7. tools 格式统一为 YAML 数组
8. 每个 v2 功能需要明确的逐 agent 适用标准
9. 用户无需配置两套 memory 系统
10. Agent Teams 在 run_dir 中的产物格式不变

## 非目标（Non-Goals）

1. **不替换 workflow-memory skill** — native memory 是补充，非替代
2. **不改造 brainstorm/refactor 为 Agent Teams** — 零 Task() 调用，无集成面
3. **不改造 commit 为 Agent Teams** — 原子快速路径，不需 agent 间通信
4. **不在 thinking 阶段引入 Agent Teams** — 明确禁止后台执行
5. **不修改任何现有 skill/hook 的行为** — 纯增量变更
6. **不解决 Agent Teams 的文档缺口** — 使用防御性假设推进

## 成功判据（Success Criteria）

1. 23 个 agent 文件均有 YAML frontmatter 含 `memory` 字段
2. 5 个 command 文件含 `Task(agent_type)` 限制
3. hooks.json 包含 `TeammateIdle` 和 `TaskCompleted` 两个顶级 key
4. 全部 7 个 command 工作流执行结果与集成前一致
5. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` 未设置时零行为变化
6. tpd:dev 启用 Agent Teams 后 audit-fix 迭代更少
7. Agent 名称在 23 个 agent 中唯一
8. UI-Design frontmatter 迁移保持精确 tool 声明（diff 验证）
9. Memory 系统有清晰的所有权边界文档
10. hooks 只修改 hooks.json，不修改 plugin.json

## 验收标准（Acceptance Criteria）

1. `grep -r "^memory:" plugins/*/agents/**/*.md | wc -l` = 23
2. `grep -c "Task(" plugins/tpd/commands/thinking.md plugins/tpd/commands/plan.md plugins/tpd/commands/dev.md plugins/commit/commands/commit.md plugins/ui-design/commands/ui-design.md` 均含限制声明
3. `jq '.hooks | keys' plugins/hooks/hooks/hooks.json` 包含 TeammateIdle 和 TaskCompleted
4. UI-Design 9 个 agent 的 `tools` 字段与迁移前 informal 声明完全一致
5. 无环境变量时执行 `/commit` `/tpd:thinking` `/brainstorm` 等均无报错
6. `ls plugins/hooks/scripts/orchestration/` 包含至少 2 个 .sh 文件

## 风险与待确认

### 风险

| Rank | Risk                                         | Severity | Mitigation                                  |
| ---- | -------------------------------------------- | -------- | ------------------------------------------- |
| 1    | UI-Design frontmatter 迁移破坏 agent 行为    | HIGH     | 逐文件 diff 比较 informal vs YAML tool 声明 |
| 2    | 双模型多样性因 Agent Teams 消息丢失          | HIGH     | 禁止跨模型 mailbox 通信                     |
| 3    | Agent Teams 在 env flag 未设置时破坏向后兼容 | HIGH     | 5 个 command 文件条件分支                   |
| 4    | MEMORY.md 200 行溢出                         | MEDIUM   | agent prompt 中加入轮转/压缩指令            |
| 5    | 双持久化混淆（native vs workflow-memory）    | MEDIUM   | 文档化清晰所有权边界                        |

### 待确认问题

1. **P0**: 旧版 CLI 是否忽略未知 frontmatter 字段？（假设是，实施时验证）
2. **P0**: TeammateIdle/TaskCompleted 的确切 JSON schema？（防御性解析）
3. **P1**: Agent Teams 是否支持 typed subagent_type？
4. **P1**: Agent Teams 如何处理同步执行模式？
5. **P2**: MEMORY.md 200 行溢出行为？

## OpenSpec 规范（已写入 openspec/）

- openspec_root: openspec
- proposal: openspec/changes/integrate-v2-features/proposal.md
- tasks: openspec/changes/integrate-v2-features/tasks.md
- spec: openspec/changes/integrate-v2-features/specs/integrate-v2-features/spec.md

## 下一阶段

- /tpd:plan
- /tpd:plan integrate-v2-features
