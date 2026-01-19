# 任务分解文档

## 元信息

- 分解时间: {{decomposed_at}}
- 需求 ID: {{requirement_id}}
- 任务类型: {{task_type}}
- 总任务数: {{total_tasks}}
- 预估总工时: {{total_hours}} 小时

## 1. WBS 层级结构

```mermaid
graph TD
{{wbs_diagram}}
```

## 2. 执行阶段

{{#each phases}}

### 阶段 {{order}}: {{name}}

**目标**: {{goal}}

**里程碑**: {{milestone}}

**依赖**: {{#if dependencies}}{{dependencies}}{{else}}无{{/if}}

| ID  | 任务 | 类型 | 复杂度 | 预估 | 依赖 |
| --- | ---- | ---- | ------ | ---- | ---- |

{{#each tasks}}
| {{id}} | {{name}} | {{type}} | {{complexity}}/5 | {{estimated_hours}}h | {{#if depends_on}}{{depends_on}}{{else}}-{{/if}} |
{{/each}}

{{/each}}

## 3. 任务详情

{{#each all_tasks}}

### {{id}}: {{name}}

| 属性     | 值                                                |
| -------- | ------------------------------------------------- |
| 类型     | {{type}}                                          |
| 复杂度   | {{complexity}}/5                                  |
| 预估工时 | {{estimated_hours}} 小时                          |
| 依赖     | {{#if depends_on}}{{depends_on}}{{else}}无{{/if}} |
| 优先级   | {{priority}}                                      |

**输入**:
{{#each inputs}}

- {{this}}
  {{/each}}

**输出**:
{{#each outputs}}

- {{this}}
  {{/each}}

**验收标准**:
{{#each acceptance_criteria}}

- [ ] {{this}}
      {{/each}}

{{#if risks}}
**风险**:
{{#each risks}}

- ⚠️ {{this}}
  {{/each}}
  {{/if}}

---

{{/each}}

## 4. 依赖图

```mermaid
graph LR
{{dependency_diagram}}
```

## 5. 关键路径

### 路径

```
{{critical_path}}
```

### 关键路径长度

{{critical_path_length}} 小时

### 关键任务

| ID  | 任务 | 工期 | ES  | EF  | LS  | LF  | 浮动 |
| --- | ---- | ---- | --- | --- | --- | --- | ---- |

{{#each critical_tasks}}
| {{id}} | {{name}} | {{duration}}h | {{es}} | {{ef}} | {{ls}} | {{lf}} | {{float}} |
{{/each}}

## 6. 并行执行计划

{{#each execution_waves}}

### 第 {{wave}} 波

**开始条件**: {{#if precondition}}{{precondition}}{{else}}无依赖{{/if}}

**并行任务**:
{{#each tasks}}

- {{id}}: {{name}} ({{type}}, {{estimated_hours}}h)
  {{/each}}

**团队分配**:

- 后端: {{backend_tasks}}
- 前端: {{frontend_tasks}}
- 其他: {{other_tasks}}

{{/each}}

## 7. 资源需求

### 按类型统计

| 类型 | 任务数 | 总工时 | 占比 |
| ---- | ------ | ------ | ---- |

{{#each resource_by_type}}
| {{type}} | {{count}} | {{hours}}h | {{percentage}}% |
{{/each}}

### 技能要求

{{#each skill_requirements}}

- **{{skill}}**: {{tasks}}
  {{/each}}

## 8. 里程碑

| 里程碑 | 完成阶段 | 依赖任务 | 验收标准 |
| ------ | -------- | -------- | -------- |

{{#each milestones}}
| {{name}} | Phase {{phase}} | {{tasks}} | {{criteria}} |
{{/each}}

## 9. 风险任务

| ID  | 任务 | 风险描述 | 缓解措施 |
| --- | ---- | -------- | -------- |

{{#each risk_tasks}}
| {{id}} | {{name}} | {{risk}} | {{mitigation}} |
{{/each}}

## 10. Contract-First 执行顺序

{{#if is_fullstack}}

### 接口契约阶段

| 后端任务 | 前端任务 | 契约产物 |
| -------- | -------- | -------- |

{{#each contract_phase}}
| {{backend}} | {{frontend}} | {{contract}} |
{{/each}}

### Mock 开发阶段

| 前端任务 | Mock 数据源 |
| -------- | ----------- |

{{#each mock_phase}}
| {{task}} | {{mock_source}} |
{{/each}}

### 并行开发阶段

| 后端任务 | 前端任务 | 同步点 |
| -------- | -------- | ------ |

{{#each parallel_phase}}
| {{backend}} | {{frontend}} | {{sync_point}} |
{{/each}}

### 集成阶段

| 任务 | 类型 | 验证点 |
| ---- | ---- | ------ |

{{#each integration_phase}}
| {{task}} | {{type}} | {{verification}} |
{{/each}}

{{/if}}

## 证据引用

本分解基于以下输入：

| 来源 | 文件 | 描述 |
| ---- | ---- | ---- |

{{#each evidence_references}}
| {{source}} | `{{file}}` | {{description}} |
{{/each}}

---

下一步: 调用 risk-assessor 进行风险评估
