# 里程碑文档

## 元信息

- 项目: {{project_name}}
- 创建时间: {{created_at}}
- 更新时间: {{updated_at}}
- 总里程碑数: {{total_milestones}}

## 里程碑概览

```mermaid
gantt
    title 里程碑时间线
    dateFormat YYYY-MM-DD

    section 主要里程碑
    {{#each milestones}}
    {{name}} :milestone, {{id}}, {{planned_date}}, 0d
    {{/each}}
```

## 里程碑详情

{{#each milestones}}

### {{id}}: {{name}}

| 属性     | 值               |
| -------- | ---------------- |
| ID       | {{id}}           |
| 名称     | {{name}}         |
| 阶段     | Phase {{phase}}  |
| 计划日期 | {{planned_date}} |
| 状态     | {{status}}       |
| 类型     | {{type}}         |

#### 描述

{{description}}

#### 验收标准

{{#each criteria}}

- [ ] {{this}}
      {{/each}}

#### 依赖任务

| ID  | 任务名称 | 状态 | 完成度 |
| --- | -------- | ---- | ------ |

{{#each dependent_tasks}}
| {{id}} | {{name}} | {{status}} | {{progress}}% |
{{/each}}

#### 前置里程碑

{{#if prerequisites}}
{{#each prerequisites}}

- [{{id}}] {{name}} - {{status}}
  {{/each}}
  {{else}}
  无前置里程碑
  {{/if}}

#### 后续里程碑

{{#if successors}}
{{#each successors}}

- [{{id}}] {{name}}
  {{/each}}
  {{else}}
  无后续里程碑
  {{/if}}

#### 风险

{{#if risks}}
| 风险 | 影响 | 缓解措施 |
|------|------|----------|
{{#each risks}}
| {{description}} | {{impact}} | {{mitigation}} |
{{/each}}
{{else}}
无已识别风险
{{/if}}

#### 交付物

{{#each deliverables}}

- [ ] {{name}}: {{description}}
      {{/each}}

#### 通知列表

当里程碑达成时通知以下人员：

{{#each notify}}

- {{role}}: {{name}} ({{email}})
  {{/each}}

---

{{/each}}

## 里程碑依赖图

```mermaid
graph LR
{{#each milestone_dependencies}}
    {{from}}[{{from_name}}] --> {{to}}[{{to_name}}]
{{/each}}
```

## 状态汇总

| 状态   | 数量                  | 占比                        |
| ------ | --------------------- | --------------------------- |
| 已完成 | {{completed_count}}   | {{completed_percentage}}%   |
| 进行中 | {{in_progress_count}} | {{in_progress_percentage}}% |
| 待开始 | {{pending_count}}     | {{pending_percentage}}%     |
| 延期   | {{delayed_count}}     | {{delayed_percentage}}%     |

## 关键里程碑

以下里程碑位于关键路径上，延迟将影响项目整体进度：

{{#each critical_milestones}}

- **{{id}}**: {{name}} (计划: {{planned_date}})
  {{/each}}

## 里程碑类型说明

| 类型        | 描述     | 示例               |
| ----------- | -------- | ------------------ |
| delivery    | 功能交付 | API 完成、组件完成 |
| quality     | 质量门禁 | 测试通过、审计通过 |
| integration | 集成节点 | 前后端联调完成     |
| release     | 发布节点 | 版本发布、上线     |
| checkpoint  | 检查点   | 阶段评审、状态同步 |

## 里程碑模板

```markdown
### M-XXX: [里程碑名称]

| 属性     | 值         |
| -------- | ---------- |
| ID       | M-XXX      |
| 名称     | [名称]     |
| 阶段     | Phase X    |
| 计划日期 | YYYY-MM-DD |
| 状态     | 待开始     |
| 类型     | [类型]     |

#### 描述

[里程碑描述]

#### 验收标准

- [ ] [标准 1]
- [ ] [标准 2]

#### 依赖任务

| ID    | 任务名称 | 状态   |
| ----- | -------- | ------ |
| T-XXX | [任务]   | 待开始 |

#### 交付物

- [ ] [交付物 1]
- [ ] [交付物 2]
```

## 更新记录

| 日期 | 里程碑 | 变更 | 原因 |
| ---- | ------ | ---- | ---- |

{{#each update_history}}
| {{date}} | {{milestone}} | {{change}} | {{reason}} |
{{/each}}
