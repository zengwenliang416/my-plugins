# debug-orchestrator 并行执行集成摘要

## 集成信息

- **完成时间**: 2026-01-13
- **任务编号**: Task 3.A.2
- **复杂度**: 3/5
- **并行点**: 2 个（Phase 2, Phase 4）
- **并发数**: 每个阶段 2 个任务（Codex + Gemini）

## 改动清单

### 1. 状态文件格式升级（V1 → V2）

**位置**: `agents/debug-orchestrator/SKILL.md` 第 33-100 行

**变更**:

- 添加 `workflow_version: "2.0"` 版本标识
- 添加 `parallel_execution` 根对象（max_concurrency, active_tasks, completed_tasks, failed_tasks）
- 添加 `sessions` 根对象（codex/gemini 会话管理）
- 添加 `subtasks` 数组（并行任务跟踪）
- artifacts 扩展为区分 codex/gemini 输出（hypotheses_codex/gemini, fix_proposal_codex/gemini）
- 保留所有 V1 字段以确保兼容

### 2. Phase 2: 假设生成（并行化）

**位置**: `agents/debug-orchestrator/SKILL.md` 第 138-229 行

**变更前**:

```
Task(debugging:hypothesis-generator, model=codex) &
Task(debugging:hypothesis-generator, model=gemini) &
等待完成
```

**变更后**:

```yaml
parallel_tasks:
  - id: codex-hypothesis
    backend: codex
    role: analyzer
    prompt: |
      【后端/逻辑假设生成器】
      基于症状生成假设...
      ${SYMPTOMS_SUMMARY}
    output: .claude/debugging/hypotheses-codex.md

  - id: gemini-hypothesis
    backend: gemini
    role: analyzer
    prompt: |
      【前端/UX 假设生成器】
      基于症状生成假设...
      ${SYMPTOMS_SUMMARY}
    output: .claude/debugging/hypotheses-gemini.md
```

**执行方式**:

```typescript
await executeParallelPhase({
  domain: "debugging",
  phaseName: "Phase 2: 假设生成（并行）",
  variables: { SYMPTOMS_SUMMARY: symptomsSummary.substring(0, 500) },
});
```

**角色分工**:

- **Codex**: 后端/逻辑假设（数据、算法、状态、依赖）
- **Gemini**: 前端/UX 假设（UI 渲染、事件处理、状态同步、网络）

### 3. Phase 4: 修复方案（并行化）

**位置**: `agents/debug-orchestrator/SKILL.md` 第 250-337 行

**变更前**:

```
Task(debugging:fix-proposer, model=codex) &  # 安全/性能
Task(debugging:fix-proposer, model=gemini) &  # 可读性/维护性
等待完成
```

**变更后**:

```yaml
parallel_tasks:
  - id: codex-fix
    backend: codex
    role: reviewer
    prompt: |
      【安全/性能修复专家】
      提供修复方案...
      ${ROOT_CAUSE_SUMMARY}
    output: .claude/debugging/fix-proposal-codex.md

  - id: gemini-fix
    backend: gemini
    role: reviewer
    prompt: |
      【可读性/维护性修复专家】
      提供修复方案...
      ${ROOT_CAUSE_SUMMARY}
    output: .claude/debugging/fix-proposal-gemini.md
```

**执行方式**:

```typescript
await executeParallelPhase({
  domain: "debugging",
  phaseName: "Phase 4: 修复方案（并行）",
  variables: { ROOT_CAUSE_SUMMARY: rootCauseSummary.substring(0, 500) },
});
```

**角色分工**:

- **Codex**: 安全/性能方案（安全风险、性能影响、边界条件）
- **Gemini**: 可读性/维护性方案（代码清晰度、注释、扩展性、用户体验）

### 4. 新增并行执行说明

**位置**: `agents/debug-orchestrator/SKILL.md` 第 20-31 行

添加了并行执行支持说明，包括：

- 并行点说明（Phase 2, Phase 4）
- 并发数（每阶段 2 个任务）
- 状态管理（V2 格式，支持断点恢复）
- 依赖组件列表

### 5. 新增后台任务约束

**位置**: `agents/debug-orchestrator/SKILL.md` 第 434-438 行

添加了后台任务约束说明：

- 外部模型后台任务不设置超时时间
- 后台任务失败直接记录，不重试不降级
- 最多 8 个并发任务（全局约束）
- 支持断点恢复（保存 task_id）

### 6. 新增相关文档引用

**位置**: `agents/debug-orchestrator/SKILL.md` 第 440-465 行

添加了完整的基础设施组件和规划文档引用。

## 集成效果

### 性能提升

- **Phase 2 执行时间**: 从串行 ~6分钟 → 并行 ~3分钟（预估）
- **Phase 4 执行时间**: 从串行 ~5分钟 → 并行 ~2.5分钟（预估）
- **总体提升**: 约 50% 的时间节省

### 用户体验改进

- **实时进度显示**: 使用 `skills/_shared/ui/progress.sh` 显示任务进度
- **断点恢复**: 支持调试流程中断后从 task_id 恢复
- **透明错误处理**: 失败任务记录到 `.claude/logs/debugging-failures.log`
- **会话延续**: 支持跨 Phase 延续 Codex/Gemini 对话上下文
- **假设合并**: 自动合并去重 Codex 和 Gemini 的假设，按优先级排序

### 调试质量提升

- **多角度假设**: 后端逻辑 + 前端 UX 双视角，减少盲区
- **全面修复方案**: 安全性能 + 可读维护双维度，平衡短期修复和长期质量
- **DEDUCE 方法论**: 完整支持 Describe → Evidence → Diagnose → Uncover → Correct → Evaluate

## 迁移指南

现有的 `.claude/debugging.local.md` 文件可以使用以下命令迁移：

```bash
# 单文件迁移
bash skills/shared/workflow/migrate-v1-to-v2.sh debugging

# 或直接编辑
# 添加 workflow_version, parallel_execution, sessions, subtasks 字段
# 扩展 artifacts 为 hypotheses_codex/gemini, fix_proposal_codex/gemini
```

## 验证清单

- [x] 状态文件格式升级到 V2
- [x] Phase 2 使用声明式并行配置
- [x] Phase 4 使用声明式并行配置
- [x] 添加并行执行说明和约束
- [x] 添加相关文档引用
- [x] YAML 配置语法正确
- [x] 变量替换使用 ${VAR_NAME} 格式
- [x] 输出路径符合 `.claude/debugging/` 规范
- [x] 角色分工清晰（Codex 后端/安全，Gemini 前端/UX）
- [x] 文档清晰，便于其他开发者理解

## 特殊考虑

### 假设合并策略

Phase 2 输出两个独立的假设文件：

- `.claude/debugging/hypotheses-codex.md` - 后端逻辑假设
- `.claude/debugging/hypotheses-gemini.md` - 前端 UX 假设

orchestrator 需要在硬停止前合并：

1. 提取两个文件中的所有假设
2. 去重（相同假设只保留一个）
3. 按优先级重新排序
4. 展示给用户确认

### 修复方案选择策略

Phase 4 输出两个独立的修复方案文件：

- `.claude/debugging/fix-proposal-codex.md` - 安全/性能方案
- `.claude/debugging/fix-proposal-gemini.md` - 可读性/维护性方案

orchestrator 需要在硬停止时让用户选择：

1. **选项 A**: 采用 Codex 方案（优先安全和性能）
2. **选项 B**: 采用 Gemini 方案（优先可读和维护）
3. **选项 C**: 综合两者（由 Claude 重构合并）

## 下一步

继续集成其他 orchestrators：

- Task 3.A.3: test-orchestrator（1 个并行点）
- Task 3.A.4: plan-orchestrator（1 个并行点）
- Task 3.A.5: review-orchestrator（1 个并行点）
- Task 3.A.6: social-post-orchestrator（1 个可选并行点）
- Task 3.A.7: ui-ux-design-orchestrator（1 个并行点）
