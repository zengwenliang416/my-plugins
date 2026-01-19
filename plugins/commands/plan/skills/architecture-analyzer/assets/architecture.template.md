# 架构分析报告

## 元信息

- 分析时间: {{analyzed_at}}
- 需求 ID: {{requirement_id}}
- 任务类型: {{task_type}}
- 分析模型: {{models_used}}

## 1. 引言和目标

### 1.1 需求概述

{{requirements_summary}}

### 1.2 质量目标

| 优先级 | 质量属性 | 场景描述 |
| ------ | -------- | -------- |

{{#each quality_goals}}
| {{priority}} | {{attribute}} | {{scenario}} |
{{/each}}

### 1.3 利益相关者

| 角色 | 期望 |
| ---- | ---- |

{{#each stakeholders}}
| {{role}} | {{expectation}} |
{{/each}}

## 2. 约束

### 2.1 技术约束

{{#if constraints.technical}}
| ID | 约束 | 原因 |
|----|------|------|
{{#each constraints.technical}}
| TC-{{@index}} | {{constraint}} | {{reason}} |
{{/each}}
{{else}}
[无特殊技术约束]
{{/if}}

### 2.2 组织约束

{{#if constraints.organizational}}
| ID | 约束 | 原因 |
|----|------|------|
{{#each constraints.organizational}}
| OC-{{@index}} | {{constraint}} | {{reason}} |
{{/each}}
{{else}}
[无特殊组织约束]
{{/if}}

### 2.3 业务约束

{{#if constraints.business}}
| ID | 约束 | 原因 |
|----|------|------|
{{#each constraints.business}}
| BC-{{@index}} | {{constraint}} | {{reason}} |
{{/each}}
{{else}}
[无特殊业务约束]
{{/if}}

## 3. 上下文和范围

### 3.1 业务上下文

```mermaid
graph LR
{{#each business_context}}
    {{from}} -->|{{label}}| {{to}}
{{/each}}
```

### 3.2 技术上下文

| 组件 | 协议 | 说明 |
| ---- | ---- | ---- |

{{#each technical_context}}
| {{component}} | {{protocol}} | {{description}} |
{{/each}}

## 4. 解决方案策略

### 4.1 技术决策

| 决策领域 | 选择 | 理由 |
| -------- | ---- | ---- |

{{#each tech_decisions}}
| {{domain}} | {{choice}} | {{rationale}} |
{{/each}}

### 4.2 架构模式

{{#each arch_patterns}}

- **{{name}}**: {{description}}
  {{/each}}

## 5. 构建块视图

### 5.1 Level 1: 系统白盒

```mermaid
graph TB
{{system_whitebox_diagram}}
```

### 5.2 模块描述

{{#each modules}}

#### {{name}}

| 属性 | 值                 |
| ---- | ------------------ |
| 路径 | `{{path}}`         |
| 职责 | {{responsibility}} |
| 技术 | {{technology}}     |
| 接口 | {{interfaces}}     |

{{/each}}

{{#if task_type_is_frontend}}

## 前端架构（Gemini 分析）

### 组件结构

{{#each frontend.components}}

- **{{name}}**: {{description}}
  - 类型: {{type}}
  - 状态: {{state_management}}
    {{/each}}

### 状态管理

| 状态类型 | 管理方案 | 说明 |
| -------- | -------- | ---- |

{{#each frontend.state_management}}
| {{type}} | {{solution}} | {{description}} |
{{/each}}

### 路由设计

| 路径 | 组件 | 权限 |
| ---- | ---- | ---- |

{{#each frontend.routes}}
| `{{path}}` | {{component}} | {{auth}} |
{{/each}}
{{/if}}

{{#if task_type_is_backend}}

## 后端架构（Codex 分析）

### API 设计

| 方法 | 端点 | 描述 |
| ---- | ---- | ---- |

{{#each backend.api_endpoints}}
| {{method}} | `{{endpoint}}` | {{description}} |
{{/each}}

### 数据模型

{{#each backend.data_models}}

#### {{name}}

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |

{{#each fields}}
| {{name}} | {{type}} | {{description}} |
{{/each}}

{{/each}}

### 安全策略

{{#each backend.security}}

- **{{name}}**: {{description}}
  {{/each}}
  {{/if}}

## 6. 运行时视图

### 关键场景

{{#each runtime_scenarios}}

#### {{name}}

```mermaid
sequenceDiagram
{{diagram}}
```

{{/each}}

## 7. 部署视图

### 7.1 基础设施

| 环境 | 提供商 | 配置 |
| ---- | ------ | ---- |

{{#each infrastructure}}
| {{env}} | {{provider}} | {{config}} |
{{/each}}

### 7.2 部署拓扑

```mermaid
graph TB
{{deployment_diagram}}
```

## 8. 横切关注点

### 8.1 安全

| 层面 | 措施 |
| ---- | ---- |

{{#each crosscutting.security}}
| {{layer}} | {{measure}} |
{{/each}}

### 8.2 日志

| 级别 | 用途 | 示例 |
| ---- | ---- | ---- |

{{#each crosscutting.logging}}
| {{level}} | {{purpose}} | {{example}} |
{{/each}}

### 8.3 错误处理

{{crosscutting.error_handling}}

### 8.4 持久化

{{crosscutting.persistence}}

## 9. 架构决策

{{#each decisions}}

### ADR-{{id}}: {{title}}

**状态**: {{status}}

**上下文**: {{context}}

**决策**: {{decision}}

**后果**:
{{#each consequences}}

- {{this}}
  {{/each}}

---

{{/each}}

## 10. 质量需求

### 10.1 质量场景

| ID  | 质量属性 | 场景 | 度量 |
| --- | -------- | ---- | ---- |

{{#each quality_scenarios}}
| {{id}} | {{attribute}} | {{scenario}} | {{measure}} |
{{/each}}

## 11. 风险和技术债务

### 11.1 已识别风险

| ID  | 风险 | 概率 | 影响 | 缓解措施 |
| --- | ---- | ---- | ---- | -------- |

{{#each risks}}
| {{id}} | {{risk}} | {{probability}} | {{impact}} | {{mitigation}} |
{{/each}}

### 11.2 技术债务

| ID  | 描述 | 优先级 | 计划 |
| --- | ---- | ------ | ---- |

{{#each tech_debt}}
| {{id}} | {{description}} | {{priority}} | {{plan}} |
{{/each}}

## 12. 术语表

| 术语 | 定义 |
| ---- | ---- |

{{#each glossary}}
| {{term}} | {{definition}} |
{{/each}}

## 证据引用

本分析基于以下证据：

| 证据 ID | 文件 | 描述 |
| ------- | ---- | ---- |

{{#each evidence_references}}
| {{id}} | `{{file}}` | {{description}} |
{{/each}}

---

下一步: 调用 task-decomposer 进行任务分解
