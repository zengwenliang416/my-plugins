# Tasks: integrate-v2-features

> Integrate Claude Code v2.1.32-33 new features into ccg-workflows plugins

## Phase 0: 前置条件

- [ ] **T0.1** 迁移 9 个 UI-Design agents 到 YAML frontmatter（逐文件 diff 验证）
- [ ] **T0.2** 验证 23 个 agent 名称全局唯一

---

## Phase 1: 基础集成（可并行）

### Phase 1a: Agent Memory

- [ ] **T1a.1** 为 TPD 10 个 agents 添加 `memory` frontmatter（8 project / 2 user scope）
- [ ] **T1a.2** 为 commit 4 个 agents 添加 `memory` frontmatter（project scope）
- [ ] **T1a.3** 为 UI-Design 9 个 agents 添加 `memory` frontmatter（5 project / 4 user scope）

### Phase 1b: Task Restrictions

- [ ] **T1b.1** 为 thinking.md 添加 Task(agent_type) 限制（investigation + reasoning agents）
- [ ] **T1b.2** 为 plan.md 添加 Task(agent_type) 限制（context + planning agents）
- [ ] **T1b.3** 为 dev.md 添加 Task(agent_type) 限制（execution agents）
- [ ] **T1b.4** 为 commit.md 添加 Task(agent_type) 限制（4 commit agents）
- [ ] **T1b.5** 为 ui-design.md 添加 Task(agent_type) 限制（9 ui-design agents）

### Phase 1c: Hook Events

- [ ] **T1c.1** 在 hooks.json 添加 TeammateIdle 和 TaskCompleted 顶级 key
- [ ] **T1c.2** 创建 `scripts/orchestration/teammate-idle.sh`（防御性解析 + 通知）
- [ ] **T1c.3** 创建 `scripts/orchestration/task-completed.sh`（防御性解析 + 通知）

---

## Phase 2: 文档与策略

- [ ] **T2.1** 文档化三层 memory 架构（native → workflow-memory → session-compactor）
- [ ] **T2.2** 更新 llmdoc/architecture/plugin-architecture.md

---

## Phase 3: Agent Teams（实验性）

- [ ] **T3.1** 设计 tpd:dev Agent Teams 编排方案（条件分支 + 回退）
- [ ] **T3.2** 实现 tpd:dev Agent Teams 集成（prototype → audit → fix cycle）

---

## Phase 4: 延后项

- [ ] **T4.1** UI-Design typed agent 迁移（general-purpose → typed）
- [ ] **T4.2** UI-Design Agent Teams 集成

---

## Phase 3: 验收标准

| 项目                | 验收条件                                   |
| ------------------- | ------------------------------------------ |
| Agent Memory        | 23 个 agent 文件含 `memory:` 字段          |
| Task Restrictions   | 5 个 command 含 Task() 限制声明            |
| Hook Events         | hooks.json 含 TeammateIdle + TaskCompleted |
| Backward Compat     | 无 env var 时 7 个工作流正常执行           |
| UI-Design Migration | 9 个 agent tools 字段与迁移前一致          |
| Hook Scripts        | scripts/orchestration/ 含 2+ .sh 文件      |
