# 开发实施计划

## 元信息

| 字段     | 值                |
| -------- | ----------------- |
| 提案 ID  | {{proposal_id}}   |
| 任务类型 | {{task_type}}     |
| 创建时间 | {{created_at}}    |
| 输入摘要 | {{input_summary}} |
| 风险等级 | {{overall_risk}}  |

### 产物链接

| 产物       | 路径                                 |
| ---------- | ------------------------------------ |
| OpenSpec 提案 | [proposal.md](./proposal.md)       |
| 约束清单   | [constraints.md](./constraints.md)  |
| PBT 属性   | [pbt.md](./pbt.md)                  |
| 需求规格   | [requirements.md](./requirements.md) |
| 上下文检索 | [context.md](./context.md)           |
| 架构设计   | [architecture.md](./architecture.md) |
| 任务分解   | [tasks.md](./tasks.md)               |
| 风险评估   | [risks.md](./risks.md)               |

---

## 1. 执行摘要

### 1.1 目标

{{objective}}

### 1.2 范围

**包含**：
{{#each scope_in}}

- {{this}}
  {{/each}}

**不包含**：
{{#each scope_out}}

- {{this}}
  {{/each}}

### 1.3 关键决策

{{#each key_decisions}}
{{@index}}. **{{title}}**: {{decision}}

- 理由: {{rationale}}
  {{/each}}

### 1.4 风险预警

{{#each critical_risks}}

- 🔴 **{{id}}**: {{title}} ({{severity}})
  {{/each}}

{{#each high_risks}}

- 🟠 **{{id}}**: {{title}} ({{severity}})
  {{/each}}

---

## 2. 需求规格

### 2.1 功能需求

| ID  | 需求 | 优先级 | 状态 |
| --- | ---- | ------ | ---- |

{{#each functional_requirements}}
| {{id}} | {{description}} | {{priority}} | {{status}} |
{{/each}}

### 2.2 非功能需求

| ID  | 类别 | 要求 | 验收标准 |
| --- | ---- | ---- | -------- |

{{#each non_functional_requirements}}
| {{id}} | {{category}} | {{requirement}} | {{acceptance}} |
{{/each}}

### 2.3 约束 / 非目标 / 判据

**约束（硬/软）**：
{{#each constraints}}
- {{this}}
{{/each}}

**非目标**：
{{#each non_goals}}
- {{this}}
{{/each}}

**成功判据**：
{{#each success_criteria}}
- {{this}}
{{/each}}

**验收标准**：
{{#each acceptance_criteria}}
- [ ] {{this}}
{{/each}}

---

## 3. PBT 属性

{{#each pbt_properties}}
- {{this}}
{{/each}}

---

## 4. 架构设计

### 4.1 技术方案

{{technical_approach}}

### 4.2 组件结构

```
{{component_diagram}}
```

### 4.3 关键架构决策

{{#each architecture_decisions}}

#### ADR-{{@index}}: {{title}}

- **状态**: {{status}}
- **上下文**: {{context}}
- **决策**: {{decision}}
- **后果**: {{consequences}}

{{/each}}

### 4.4 技术栈

| 层级 | 技术 | 版本 | 用途 |
| ---- | ---- | ---- | ---- |

{{#each tech_stack}}
| {{layer}} | {{technology}} | {{version}} | {{purpose}} |
{{/each}}

---

## 5. 实施路线图

### 5.1 阶段概览

```
{{roadmap_diagram}}
```

### 5.2 阶段详情

{{#each phases}}

#### 阶段 {{number}}: {{name}}

**目标**: {{objective}}

**任务列表**:

| ID  | 任务 | 类型 | 复杂度 | 依赖 | 验收标准 |
| --- | ---- | ---- | ------ | ---- | -------- |

{{#each tasks}}
| {{id}} | {{name}} | {{type}} | {{complexity}}/5 | {{dependencies}} | {{acceptance}} |
{{/each}}

**交付物**:
{{#each deliverables}}

- {{this}}
  {{/each}}

{{/each}}

### 5.3 关键路径

```
{{critical_path}}
```

### 5.4 并行建议

{{#each parallel_suggestions}}

- {{this}}
  {{/each}}

### 5.5 任务统计

| 类型     | 数量                | 复杂度总计               |
| -------- | ------------------- | ------------------------ |
| 后端     | {{backend_count}}   | {{backend_complexity}}   |
| 前端     | {{frontend_count}}  | {{frontend_complexity}}  |
| 全栈     | {{fullstack_count}} | {{fullstack_complexity}} |
| **总计** | **{{total_count}}** | **{{total_complexity}}** |

---

## 6. 风险与缓解

### 6.1 风险矩阵

```
         Impact
         LOW    MEDIUM   HIGH
       ┌───────┬───────┬───────┐
  HIGH │  {{hl}} │  {{hm}} │  {{hh}} │
       ├───────┼───────┼───────┤
L MED  │  {{ml}} │  {{mm}} │  {{mh}} │
i      ├───────┼───────┼───────┤
k LOW  │  {{ll}} │  {{lm}} │  {{lh}} │
e      └───────┴───────┴───────┘
```

### 6.2 高优先级风险

{{#each prioritized_risks}}

#### {{id}}: {{title}}

| 属性       | 值             |
| ---------- | -------------- |
| 等级       | {{severity}}   |
| Likelihood | {{likelihood}} |
| Impact     | {{impact}}     |
| 状态       | {{status}}     |

**场景**: {{scenario}}

**缓解措施**:
{{#each mitigations}}

- [ ] {{action}} - {{owner}}
      {{/each}}

{{/each}}

### 6.3 风险监控

| 风险 | 监控指标 | 告警阈值 |
| ---- | -------- | -------- |

{{#each risk_monitoring}}
| {{risk_id}} | {{kpi}} | {{threshold}} |
{{/each}}

---

## 7. 验收标准

### 7.1 功能验收

{{#each functional_acceptance}}

- [ ] {{this}}
      {{/each}}

### 7.2 质量验收

{{#each quality_acceptance}}

- [ ] {{this}}
      {{/each}}

### 7.3 安全验收

{{#each security_acceptance}}

- [ ] {{this}}
      {{/each}}

### 7.4 交付物清单

#### 代码文件

{{#each code_deliverables}}

- `{{path}}` - {{description}}
  {{/each}}

#### 文档更新

{{#each doc_deliverables}}

- `{{path}}` - {{description}}
  {{/each}}

#### 配置变更

{{#each config_deliverables}}

- `{{path}}` - {{description}}
  {{/each}}

---

## 8. 资源需求

### 8.1 技能需求

| 技能 | 级别 | 任务覆盖 |
| ---- | ---- | -------- |

{{#each skill_requirements}}
| {{skill}} | {{level}} | {{tasks}} |
{{/each}}

### 8.2 工具/服务

| 工具/服务 | 用途 | 状态 |
| --------- | ---- | ---- |

{{#each tool_requirements}}
| {{name}} | {{purpose}} | {{status}} |
{{/each}}

---

## 9. 沟通计划

### 9.1 关键里程碑

| 里程碑 | 目标 | 状态 |
| ------ | ---- | ---- |

{{#each milestones}}
| {{name}} | {{objective}} | {{status}} |
{{/each}}

### 9.2 报告机制

| 报告类型 | 频率 | 接收人 |
| -------- | ---- | ------ |

{{#each reports}}
| {{type}} | {{frequency}} | {{recipients}} |
{{/each}}

---

## 10. 后续操作

### 10.1 执行命令

```bash
# 执行最小可验证阶段
/tpd:dev --proposal-id={{proposal_id}}
```

### 10.2 前置检查

- [ ] 所有依赖服务可用
- [ ] 开发环境已配置
- [ ] 相关权限已获取
- [ ] 团队成员已知悉

### 10.3 注意事项

{{#each notes}}

- {{this}}
  {{/each}}

---

## 附录

### A. 术语表

| 术语 | 定义 |
| ---- | ---- |

{{#each glossary}}
| {{term}} | {{definition}} |
{{/each}}

### B. 参考资料

{{#each references}}

- [{{title}}]({{url}})
  {{/each}}

### C. 变更记录

| 版本 | 日期 | 变更内容 | 变更人 |
| ---- | ---- | -------- | ------ |

{{#each changelog}}
| {{version}} | {{date}} | {{change}} | {{author}} |
{{/each}}

---

_本计划由 `/tpd:plan` 工作流自动生成，基于 OWASP 风险评估方法论和 arc42 架构模板。_
