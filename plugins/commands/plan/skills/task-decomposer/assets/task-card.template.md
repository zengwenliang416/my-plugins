# 任务卡 - {{id}}

## 基本信息

| 属性     | 值                   |
| -------- | -------------------- |
| ID       | {{id}}               |
| 名称     | {{name}}             |
| 类型     | {{type}}             |
| 阶段     | {{phase}}            |
| 工作包   | {{work_package}}     |
| 复杂度   | {{complexity}}/5     |
| 预估工时 | {{estimated_hours}}h |
| 优先级   | {{priority}}         |
| 状态     | {{status}}           |

## 依赖关系

### 前置任务

{{#if depends_on}}
| ID | 名称 | 状态 |
|----|------|------|
{{#each depends_on}}
| {{id}} | {{name}} | {{status}} |
{{/each}}
{{else}}
无前置依赖（可立即开始）
{{/if}}

### 后续任务

{{#if followed_by}}
| ID | 名称 | 阻塞? |
|----|------|-------|
{{#each followed_by}}
| {{id}} | {{name}} | {{#if blocked}}是{{else}}否{{/if}} |
{{/each}}
{{else}}
无后续任务
{{/if}}

## 输入

{{#each inputs}}

- [ ] {{this}}
      {{/each}}

## 输出 / 交付物

{{#each outputs}}

- [ ] {{this}}
      {{/each}}

## 验收标准 (DoD)

{{#each acceptance_criteria}}

- [ ] {{this}}
      {{/each}}

## 技术细节

### 实现要点

{{#each implementation_notes}}

- {{this}}
  {{/each}}

### 涉及文件

{{#if files}}
| 文件 | 操作 | 说明 |
|------|------|------|
{{#each files}}
| `{{path}}` | {{action}} | {{description}} |
{{/each}}
{{else}}
待确定
{{/if}}

### API 变更

{{#if api_changes}}
| 端点 | 方法 | 变更类型 |
|------|------|----------|
{{#each api_changes}}
| `{{endpoint}}` | {{method}} | {{change_type}} |
{{/each}}
{{else}}
无 API 变更
{{/if}}

## 风险

{{#if risks}}
| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
{{#each risks}}
| {{description}} | {{probability}} | {{impact}} | {{mitigation}} |
{{/each}}
{{else}}
无已识别风险
{{/if}}

## 测试计划

### 单元测试

{{#each unit_tests}}

- [ ] {{this}}
      {{/each}}

### 集成测试

{{#each integration_tests}}

- [ ] {{this}}
      {{/each}}

## 时间线

| 事件        | 计划时间           | 实际时间          |
| ----------- | ------------------ | ----------------- |
| 开始        | {{planned_start}}  | {{actual_start}}  |
| 完成        | {{planned_end}}    | {{actual_end}}    |
| Code Review | {{planned_review}} | {{actual_review}} |

## 关联

### 相关需求

{{#each related_requirements}}

- [{{id}}] {{description}}
  {{/each}}

### 相关设计决策

{{#each related_decisions}}

- [ADR-{{number}}] {{title}}
  {{/each}}

### 相关风险

{{#each related_risks}}

- [R-{{id}}] {{description}}
  {{/each}}

## 备注

{{#if notes}}
{{notes}}
{{else}}
无
{{/if}}

## 签核

| 角色   | 姓名          | 日期            | 签名 |
| ------ | ------------- | --------------- | ---- |
| 开发者 | {{developer}} | {{dev_date}}    |      |
| 审核人 | {{reviewer}}  | {{review_date}} |      |
| 验收人 | {{acceptor}}  | {{accept_date}} |      |

---

## 执行日志

| 日期 | 事件 | 描述 |
| ---- | ---- | ---- |

{{#each logs}}
| {{date}} | {{event}} | {{description}} |
{{/each}}
