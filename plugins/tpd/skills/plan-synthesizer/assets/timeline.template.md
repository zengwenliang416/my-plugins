# 项目时间线

## 项目信息

| 字段     | 值               |
| -------- | ---------------- |
| 提案 ID  | {{proposal_id}}  |
| 项目名称 | {{project_name}} |
| 创建时间 | {{created_at}}   |

---

## 1. 里程碑概览

```mermaid
gantt
    title {{project_name}} 时间线
    dateFormat YYYY-MM-DD
    section 里程碑
{{#each milestones}}
    {{name}} :milestone, m{{@index}}, {{date}}, 0d
{{/each}}
```

---

## 2. 阶段甘特图

```mermaid
gantt
    title 阶段进度
    dateFormat YYYY-MM-DD
{{#each phases}}
    section {{name}}
{{#each tasks}}
    {{name}} :{{status}}, {{id}}, {{start}}, {{duration}}
{{/each}}
{{/each}}
```

---

## 3. 里程碑详情

{{#each milestones}}

### M{{@index}}: {{name}}

| 属性     | 值                |
| -------- | ----------------- |
| 目标日期 | {{date}}          |
| 状态     | {{status}}        |
| 负责人   | {{owner}}         |
| 前置条件 | {{prerequisites}} |

**可交付物**:
{{#each deliverables}}

- [ ] {{this}}
      {{/each}}

**验收标准**:
{{#each acceptance_criteria}}

- [ ] {{this}}
      {{/each}}

**依赖**:
{{#each dependencies}}

- {{this}}
  {{/each}}

---

{{/each}}

## 4. 阶段详情

{{#each phases}}

### 阶段 {{number}}: {{name}}

| 属性 | 值            |
| ---- | ------------- |
| 开始 | {{start}}     |
| 结束 | {{end}}       |
| 状态 | {{status}}    |
| 进度 | {{progress}}% |

#### 任务列表

| ID  | 任务 | 开始 | 持续 | 依赖 | 状态 |
| --- | ---- | ---- | ---- | ---- | ---- |

{{#each tasks}}
| {{id}} | {{name}} | {{start}} | {{duration}} | {{dependencies}} | {{status}} |
{{/each}}

#### 阶段目标

{{objective}}

#### 交付物

{{#each deliverables}}

- {{this}}
  {{/each}}

---

{{/each}}

## 5. 关键路径

### 5.1 关键路径图

```mermaid
graph LR
{{#each critical_path}}
    {{from}} --> {{to}}
{{/each}}
```

### 5.2 关键任务

| 任务 | 持续 | 浮动时间 | 风险 |
| ---- | ---- | -------- | ---- |

{{#each critical_tasks}}
| {{name}} | {{duration}} | {{slack}} | {{risk}} |
{{/each}}

### 5.3 路径风险

{{#each path_risks}}

- **{{task}}**: {{risk}} → 缓解: {{mitigation}}
  {{/each}}

---

## 6. 依赖关系

### 6.1 任务依赖图

```mermaid
graph TD
{{#each dependencies}}
    {{from}}["{{from_name}}"] --> {{to}}["{{to_name}}"]
{{/each}}
```

### 6.2 外部依赖

| 依赖项 | 类型 | 提供方 | 状态 | 风险 |
| ------ | ---- | ------ | ---- | ---- |

{{#each external_dependencies}}
| {{name}} | {{type}} | {{provider}} | {{status}} | {{risk}} |
{{/each}}

### 6.3 阻塞项

{{#each blockers}}

#### 阻塞: {{name}}

- **影响任务**: {{affected_tasks}}
- **原因**: {{reason}}
- **解决方案**: {{resolution}}
- **预计解决**: {{eta}}

{{/each}}

---

## 7. 进度追踪

### 7.1 整体进度

| 指标     | 值                   |
| -------- | -------------------- |
| 总任务数 | {{total_tasks}}      |
| 已完成   | {{completed}}        |
| 进行中   | {{in_progress}}      |
| 未开始   | {{not_started}}      |
| 阻塞     | {{blocked}}          |
| 完成率   | {{completion_rate}}% |

### 7.2 燃尽图

```
复杂度
  ^
  │ {{burndown_chart}}
  │
  └─────────────────────> 时间
```

### 7.3 每日进度

| 日期 | 计划完成 | 实际完成 | 偏差 |
| ---- | -------- | -------- | ---- |

{{#each daily_progress}}
| {{date}} | {{planned}} | {{actual}} | {{variance}} |
{{/each}}

---

## 8. 资源分配

### 8.1 资源时间线

```mermaid
gantt
    title 资源分配
    dateFormat YYYY-MM-DD
{{#each resources}}
    section {{name}}
{{#each assignments}}
    {{task}} :{{start}}, {{duration}}
{{/each}}
{{/each}}
```

### 8.2 资源负载

| 资源 | 当前负载 | 峰值负载 | 空闲时间 |
| ---- | -------- | -------- | -------- |

{{#each resource_load}}
| {{name}} | {{current}}% | {{peak}}% | {{idle}} |
{{/each}}

---

## 9. 风险时间线

### 9.1 风险窗口

| 风险 | 影响阶段 | 窗口期 | 监控点 |
| ---- | -------- | ------ | ------ |

{{#each risk_windows}}
| {{risk_id}} | {{phase}} | {{window}} | {{checkpoint}} |
{{/each}}

### 9.2 应急缓冲

| 阶段 | 计划缓冲 | 已使用 | 剩余 |
| ---- | -------- | ------ | ---- |

{{#each buffers}}
| {{phase}} | {{planned}} | {{used}} | {{remaining}} |
{{/each}}

---

## 10. 里程碑检查点

### 10.1 检查点清单

{{#each checkpoints}}

#### 检查点: {{name}} ({{date}})

**检查项**:
{{#each items}}

- [ ] {{this}}
      {{/each}}

**Go/No-Go 标准**:

- 必须通过: {{must_pass}}
- 可接受: {{acceptable}}

**决策**: {{decision}}

{{/each}}

---

## 附录

### A. 状态定义

| 状态        | 描述   |
| ----------- | ------ |
| not_started | 未开始 |
| in_progress | 进行中 |
| completed   | 已完成 |
| blocked     | 阻塞   |
| deferred    | 延期   |
| cancelled   | 取消   |

### B. 优先级定义

| 优先级 | 描述     |
| ------ | -------- |
| P1     | 关键路径 |
| P2     | 重要     |
| P3     | 一般     |
| P4     | 可延迟   |

### C. 更新记录

| 日期 | 变更内容 | 变更人 |
| ---- | -------- | ------ |

{{#each updates}}
| {{date}} | {{change}} | {{author}} |
{{/each}}
