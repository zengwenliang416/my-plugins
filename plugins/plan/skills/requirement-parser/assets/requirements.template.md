# 需求规格

## 元信息

- 解析时间: {{parsed_at}}
- 任务类型: {{task_type}}
- 前端权重: {{weight.frontend}}%
- 后端权重: {{weight.backend}}%

## 需求概述

{{summary}}

## 功能需求

| ID  | 需求描述 | 优先级 | 验收标准 |
| --- | -------- | ------ | -------- |

{{#each functional_requirements}}
| {{id}} | {{description}} | {{priority}} | {{#each acceptance_criteria}}- {{this}}{{#unless @last}}<br>{{/unless}}{{/each}} |
{{/each}}

{{#each functional_requirements}}

### {{id}}: {{description}}

**优先级**: {{priority}}

**用户故事**:
{{#if user_story}}
作为 {{user_story.as_a}}，
我希望 {{user_story.i_want}}，
以便 {{user_story.so_that}}。
{{else}}
[待补充]
{{/if}}

**验收标准**:
{{#each acceptance_criteria}}

- [ ] {{this}}
      {{/each}}

{{#if business_rules}}
**业务规则**:
{{#each business_rules}}

- {{this}}
  {{/each}}
  {{/if}}

---

{{/each}}

## 非功能需求

| ID  | 类别 | 约束描述 | 度量指标 |
| --- | ---- | -------- | -------- |

{{#each non_functional_requirements}}
| {{id}} | {{category}} | {{constraint}} | {{metric}} |
{{/each}}

## UI/UX 需求

{{#if ui_ux_requirements}}
| ID | 组件/页面 | 交互描述 | 视觉规格 |
|----|---------|---------|---------|
{{#each ui_ux_requirements}}
| {{id}} | {{component}} | {{interaction}} | {{visual_spec}} |
{{/each}}
{{else}}
[本需求不涉及 UI/UX 变更]
{{/if}}

## 约束条件

### 技术约束

{{#if constraints.technical}}
{{#each constraints.technical}}

- {{this}}
  {{/each}}
  {{else}}
- [无特殊技术约束]
  {{/if}}

### 业务约束

{{#if constraints.business}}
{{#each constraints.business}}

- {{this}}
  {{/each}}
  {{else}}
- [无特殊业务约束]
  {{/if}}

### 兼容约束

{{#if constraints.compatibility}}
{{#each constraints.compatibility}}

- {{this}}
  {{/each}}
  {{else}}
- [无特殊兼容约束]
  {{/if}}

### 合规约束

{{#if constraints.compliance}}
{{#each constraints.compliance}}

- {{this}}
  {{/each}}
  {{else}}
- [无特殊合规约束]
  {{/if}}

## 假设与依赖

### 假设

{{#if assumptions}}
{{#each assumptions}}

- {{this}}
  {{/each}}
  {{else}}
- [无特殊假设]
  {{/if}}

### 依赖

{{#if dependencies}}
{{#each dependencies}}

- {{this}}
  {{/each}}
  {{else}}
- [无外部依赖]
  {{/if}}

## 待澄清事项

{{#if open_questions}}
{{#each open_questions}}

- [ ] {{this}}
      {{/each}}
      {{else}}
      [所有事项已澄清]
      {{/if}}

---

下一步: 调用 plan-context-retriever 检索上下文
