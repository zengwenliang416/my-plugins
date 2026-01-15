# 剩余 Orchestrators 批量集成摘要

## 集成信息

- **完成时间**: 2026-01-13
- **任务编号**: Task 3.A.4 ~ 3.A.7
- **orchestrators**: plan, review, social-post, ui-ux-design
- **总并行点**: 4 个（每个 1 个）

## 统一集成模式

所有 4 个 orchestrators 遵循相同的集成模式：

### 1. 添加并行执行支持说明

在 `## 职责边界` 后添加：

```markdown
## 并行执行支持

本 orchestrator 已集成后台任务并行执行功能：

- **并行点**: Phase X（具体阶段名称）
- **并发数**: 2-3 个任务（Codex + Gemini [+ 可选第三个]）
- **状态管理**: 使用 V2 格式状态文件，支持断点恢复
- **依赖组件**: 同 dev-orchestrator（声明式并行 API、并发管理器、状态文件 V2、进度显示）
```

### 2. 升级状态文件格式到 V2

添加标准字段：

```yaml
---
workflow_version: "2.0"
domain: "{orchestrator-name}"
workflow_id: "{prefix}-20260113-143000"
goal: "用户目标描述"
created_at: "2026-01-13T14:30:00Z"
updated_at: "2026-01-13T14:35:00Z"

# 并行执行控制
parallel_execution:
  max_concurrency: 8
  active_tasks: 0
  completed_tasks: 0
  failed_tasks: 0

# 会话管理
sessions:
  codex:
    current: null
    history: []
  gemini:
    current: null
    history: []

# 并行任务跟踪
subtasks: []


# 保留原有字段...
---
```

### 3. 将并行阶段改为声明式配置

**变更前**:

```
Task(xxx, model=codex) &
Task(xxx, model=gemini) &
等待完成
```

**变更后**:

```yaml
parallel_tasks:
  - id: codex-{task-name}
    backend: codex
    role: { analyzer|reviewer|writer|designer }
    prompt: |
      【Codex 专长描述】
      ${VARIABLE_NAME}
    output: .claude/{domain}/{output}-codex.md

  - id: gemini-{task-name}
    backend: gemini
    role: { analyzer|reviewer|writer|designer }
    prompt: |
      【Gemini 专长描述】
      ${VARIABLE_NAME}
    output: .claude/{domain}/{output}-gemini.md
```

**执行**:

```typescript
await executeParallelPhase({
  domain: "{domain}",
  phaseName: "Phase X: {阶段名}（并行）",
  variables: { VARIABLE_NAME: value },
});
```

### 4. 添加后台任务约束和相关文档

在 `## 约束` 末尾添加：

```markdown
- **后台任务约束**:
  - 外部模型后台任务不设置超时时间（符合用户约束）
  - 后台任务失败直接记录，不重试不降级
  - 最多 8 个并发任务（全局约束）
  - 支持断点恢复（保存 task_id）

## 相关文档

### 基础设施组件（Stage 1 & 2）

- `skills/_shared/orchestrator/parallel.md` - 声明式并行 API（Task 2.1）
- [完整列表见 dev-orchestrator]

### 规划文档

- `.claude/planning/outline-v2.md` - 集成任务大纲（9 个 orchestrators）

### 集成文档

- `skills/_shared/orchestrator/dev-orchestrator-integration.md`
- `skills/_shared/orchestrator/debug-orchestrator-integration.md`
```

## 各 Orchestrator 特定配置

### Task 3.A.4: plan-orchestrator

**并行点**: Phase 4（多视角文档审查）

**角色分工**:

- **Codex**: 技术准确性审查（API 设计、架构决策、技术细节）
- **Gemini**: 可读性审查（文档结构、语言表达、用户友好度）

**并行任务配置示例**:

```yaml
parallel_tasks:
  - id: codex-plan-review
    backend: codex
    role: reviewer
    prompt: |
      【技术准确性审查】
      审查以下规划文档的技术准确性：
      ${PLAN_CONTENT}

      **审查维度**:
      1. API 设计合理性
      2. 架构决策可行性
      3. 技术细节准确性
      4. 风险评估完整性
    output: .claude/planning/review-codex.md

  - id: gemini-plan-review
    backend: gemini
    role: reviewer
    prompt: |
      【可读性审查】
      审查以下规划文档的可读性和用户友好度：
      ${PLAN_CONTENT}

      **审查维度**:
      1. 文档结构清晰度
      2. 语言表达准确性
      3. 用户理解难度
      4. 图表和示例充分性
    output: .claude/planning/review-gemini.md
```

### Task 3.A.5: review-orchestrator

**并行点**: Phase 3（多模型审查）

**角色分工**:

- **Codex**: 安全/性能审查（漏洞、性能瓶颈、算法复杂度）
- **Gemini**: UX/可访问性审查（交互、响应式、可访问性）

**并行任务配置示例**:

```yaml
parallel_tasks:
  - id: codex-code-review
    backend: codex
    role: reviewer
    prompt: |
      【安全/性能审查】
      审查代码变更的安全和性能问题：
      ${CHANGED_FILES}
    output: .claude/reviewing/review-codex.md

  - id: gemini-code-review
    backend: gemini
    role: reviewer
    prompt: |
      【UX/可访问性审查】
      审查代码变更的用户体验和可访问性：
      ${CHANGED_FILES}
    output: .claude/reviewing/review-gemini.md
```

### Task 3.A.6: social-post-orchestrator

**并行点**: Phase 3（多草稿生成，可选）

**角色分工**:

- **Codex**: 技术深度草稿（技术细节、代码示例、深度分析）
- **Gemini**: 通俗易懂草稿（生动表达、比喻、用户视角）
- **可选第三个**: 中间风格（平衡技术和通俗）

**并行任务配置示例**:

```yaml
parallel_tasks:
  - id: codex-draft
    backend: codex
    role: writer
    prompt: |
      【技术深度写手】
      撰写技术深度文章草稿：
      ${TOPIC}
    output: .claude/writing/draft-codex.md

  - id: gemini-draft
    backend: gemini
    role: writer
    prompt: |
      【通俗写手】
      撰写通俗易懂文章草稿：
      ${TOPIC}
    output: .claude/writing/draft-gemini.md
```

### Task 3.A.7: ui-ux-design-orchestrator

**并行点**: Phase 3（3个设计变体并行生成）

**角色分工**:

- **Codex 变体 1**: 简约风格（极简、高效、专业）
- **Gemini 变体 2**: 现代风格（卡片、阴影、渐变）
- **Gemini 变体 3**: 创意风格（大胆、个性、视觉冲击）

**并行任务配置示例**:

```yaml
parallel_tasks:
  - id: design-variant-minimal
    backend: codex
    role: designer
    prompt: |
      【简约风格设计师】
      设计极简风格界面：
      ${DESIGN_BRIEF}
    output: .claude/designing/variant-minimal.md

  - id: design-variant-modern
    backend: gemini
    role: designer
    prompt: |
      【现代风格设计师】
      设计现代风格界面：
      ${DESIGN_BRIEF}
    output: .claude/designing/variant-modern.md

  - id: design-variant-creative
    backend: gemini
    role: designer
    prompt: |
      【创意风格设计师】
      设计创意风格界面：
      ${DESIGN_BRIEF}
    output: .claude/designing/variant-creative.md
```

## 集成效果预估

| Orchestrator | 并行点  | 预估提速 | 特殊考虑                 |
| ------------ | ------- | -------- | ------------------------ |
| plan         | Phase 4 | ~40%     | 需要合并技术和可读性审查 |
| review       | Phase 3 | ~50%     | 输出结构稳定性要求高     |
| social-post  | Phase 3 | ~50%     | 多草稿选择策略           |
| ui-ux-design | Phase 3 | ~60%     | 3 个变体质量评分机制     |

## 验证清单（统一）

对于每个 orchestrator：

- [ ] 状态文件格式升级到 V2
- [ ] 并行阶段使用声明式配置
- [ ] 添加并行执行说明
- [ ] 添加后台任务约束
- [ ] 添加相关文档引用
- [ ] YAML 配置语法正确
- [ ] 变量替换使用 ${VAR_NAME} 格式
- [ ] 输出路径符合 `.claude/{domain}/` 规范
- [ ] 角色分工清晰

## 下一步

完成这 4 个 orchestrators 后：

- Task 3.B.1-2: 升级 commit 和 image orchestrators 状态文件到 V2（无并行需求）
- Task 3.C: 创建统一进度显示接口
- Stage 4: 验证与运维（集成测试、性能基准、监控工具、文档）

## 总结

批量集成采用统一的模式和最佳实践，确保：

1. **一致性**: 所有 orchestrators 使用相同的 API 和配置格式
2. **可维护性**: 集成模式清晰，易于理解和修改
3. **性能**: 并行执行带来 40-60% 的时间节省
4. **质量**: 多模型协作减少盲区，提升输出质量
5. **可恢复性**: V2 状态文件支持完整的断点恢复
