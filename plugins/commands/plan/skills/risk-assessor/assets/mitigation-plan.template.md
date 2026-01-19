# 风险缓解计划

## 项目信息

| 字段     | 值               |
| -------- | ---------------- |
| 项目名称 | {{project_name}} |
| 版本     | {{version}}      |
| 创建日期 | {{created_at}}   |
| 更新日期 | {{updated_at}}   |
| 负责人   | {{owner}}        |
| 审批人   | {{approver}}     |

---

## 1. 执行摘要

### 1.1 风险概览

| 指标         | 当前值               | 目标值              |
| ------------ | -------------------- | ------------------- |
| 高风险数量   | {{current_high}}     | {{target_high}}     |
| 风险闭环率   | {{current_closure}}% | {{target_closure}}% |
| 平均修复时间 | {{current_mttr}} 天  | {{target_mttr}} 天  |
| 总缓解措施数 | {{total_controls}}   | -                   |
| 待实施措施数 | {{pending_controls}} | 0                   |

### 1.2 关键结论

{{executive_summary}}

---

## 2. 缓解策略概览

### 2.1 策略分布

| 策略     | 风险数量           | 占比              |
| -------- | ------------------ | ----------------- |
| Avoid    | {{avoid_count}}    | {{avoid_pct}}%    |
| Transfer | {{transfer_count}} | {{transfer_pct}}% |
| Mitigate | {{mitigate_count}} | {{mitigate_pct}}% |
| Accept   | {{accept_count}}   | {{accept_pct}}%   |

### 2.2 资源投入

| 资源类型 | 预估投入       |
| -------- | -------------- |
| 人力     | {{hr_cost}}    |
| 技术     | {{tech_cost}}  |
| 外部服务 | {{ext_cost}}   |
| 总计     | {{total_cost}} |

---

## 3. 详细缓解计划

{{#each mitigation_plans}}

### 3.{{@index}}: {{risk_id}} - {{risk_title}}

#### 风险信息

| 属性     | 值                |
| -------- | ----------------- |
| 风险 ID  | {{risk_id}}       |
| 风险等级 | {{risk_level}}    |
| 当前分数 | {{current_score}} |
| 目标分数 | {{target_score}}  |
| 缓解策略 | {{strategy}}      |
| 责任人   | {{owner}}         |

#### 风险场景

{{scenario}}

#### 缓解措施

| 序号 | 措施 | 类型 | 优先级 | 状态 | 负责人 | 截止日期 |
| ---- | ---- | ---- | ------ | ---- | ------ | -------- |

{{#each controls}}
| {{seq}} | {{name}} | {{type}} | P{{priority}} | {{status}} | {{owner}} | {{deadline}} |
{{/each}}

#### 实施步骤

{{#each implementation_steps}}
{{step}}. {{description}}

- 前置条件: {{prerequisites}}
- 预期产出: {{deliverable}}
- 验证方式: {{verification}}
  {{/each}}

#### 资源需求

| 资源类型 | 描述 | 数量 | 周期 |
| -------- | ---- | ---- | ---- |

{{#each resources}}
| {{type}} | {{description}} | {{quantity}} | {{duration}} |
{{/each}}

#### 里程碑

| 里程碑 | 日期 | 可交付物 | 状态 |
| ------ | ---- | -------- | ---- |

{{#each milestones}}
| {{name}} | {{date}} | {{deliverable}} | {{status}} |
{{/each}}

#### 剩余风险

| 指标       | 当前                   | 预期                    | 可接受                    |
| ---------- | ---------------------- | ----------------------- | ------------------------- |
| Likelihood | {{current_likelihood}} | {{expected_likelihood}} | {{acceptable_likelihood}} |
| Impact     | {{current_impact}}     | {{expected_impact}}     | {{acceptable_impact}}     |
| Risk Score | {{current_score}}      | {{expected_score}}      | {{acceptable_score}}      |

#### 监控指标

| KPI | 定义 | 阈值 | 当前值 |
| --- | ---- | ---- | ------ |

{{#each kpis}}
| {{name}} | {{definition}} | {{threshold}} | {{current}} |
{{/each}}

---

{{/each}}

## 4. 实施时间线

### 4.1 甘特图

```
{{gantt_chart}}
```

### 4.2 阶段划分

| 阶段 | 时间范围 | 目标 | 关键措施 |
| ---- | -------- | ---- | -------- |

{{#each phases}}
| {{name}} | {{timeframe}} | {{objective}} | {{key_controls}} |
{{/each}}

### 4.3 关键路径

```
{{critical_path}}
```

---

## 5. 应急响应计划

### 5.1 触发条件

| 场景 | 触发指标 | 响应级别 |
| ---- | -------- | -------- |

{{#each triggers}}
| {{scenario}} | {{indicator}} | {{response_level}} |
{{/each}}

### 5.2 响应流程

```mermaid
graph TD
{{response_flowchart}}
```

### 5.3 联系人

| 角色 | 姓名 | 联系方式 | 职责 |
| ---- | ---- | -------- | ---- |

{{#each contacts}}
| {{role}} | {{name}} | {{contact}} | {{responsibility}} |
{{/each}}

### 5.4 回滚计划

{{#each rollback_plans}}

#### {{risk_id}}: 回滚方案

**触发条件**: {{trigger}}

**回滚步骤**:
{{#each steps}}
{{@index}}. {{description}}
{{/each}}

**恢复时间目标 (RTO)**: {{rto}}

**恢复点目标 (RPO)**: {{rpo}}

{{/each}}

---

## 6. 监控与报告

### 6.1 监控仪表盘

| 指标 | 数据源 | 频率 | 告警阈值 |
| ---- | ------ | ---- | -------- |

{{#each monitoring_metrics}}
| {{name}} | {{source}} | {{frequency}} | {{threshold}} |
{{/each}}

### 6.2 报告机制

| 报告类型 | 频率 | 接收人 | 内容 |
| -------- | ---- | ------ | ---- |

{{#each reports}}
| {{type}} | {{frequency}} | {{recipients}} | {{content}} |
{{/each}}

### 6.3 复审计划

| 风险等级 | 复审周期 | 下次复审          |
| -------- | -------- | ----------------- |
| Critical | 每日     | {{next_critical}} |
| High     | 每周     | {{next_high}}     |
| Medium   | 每月     | {{next_medium}}   |
| Low      | 每季度   | {{next_low}}      |

---

## 7. 审批与签字

### 7.1 审批流程

| 步骤 | 审批人 | 状态 | 日期 | 备注 |
| ---- | ------ | ---- | ---- | ---- |

{{#each approval_steps}}
| {{step}} | {{approver}} | {{status}} | {{date}} | {{notes}} |
{{/each}}

### 7.2 变更历史

| 版本 | 日期 | 变更内容 | 变更人 | 审批人 |
| ---- | ---- | -------- | ------ | ------ |

{{#each change_history}}
| {{version}} | {{date}} | {{change}} | {{author}} | {{approver}} |
{{/each}}

---

## 附录

### A. 缓解策略定义

| 策略     | 描述                             | 适用场景                   |
| -------- | -------------------------------- | -------------------------- |
| Avoid    | 消除风险根源，停止相关活动       | 风险超出容忍度且无法控制   |
| Transfer | 将风险转移给第三方（保险、外包） | 专业性要求高或成本效益更优 |
| Mitigate | 降低风险发生概率或影响           | 可控且有有效控制措施       |
| Accept   | 接受风险，不采取进一步措施       | 低风险或成本超过收益       |

### B. 控制措施类型

| 类型         | 描述                   | 示例               |
| ------------ | ---------------------- | ------------------ |
| Preventive   | 预防风险发生           | 输入验证、访问控制 |
| Detective    | 检测风险事件           | 日志监控、异常告警 |
| Corrective   | 响应和恢复             | 事件响应、备份恢复 |
| Compensating | 替代无法实施的主要控制 | 增强监控代替补丁   |

### C. 优先级定义

| 优先级 | 响应时间 | 描述     |
| ------ | -------- | -------- |
| P1     | 24 小时  | 立即处理 |
| P2     | 7 天     | 优先处理 |
| P3     | 30 天    | 计划处理 |
| P4     | 下迭代   | 按需处理 |

### D. 状态定义

| 状态        | 描述       |
| ----------- | ---------- |
| Not Started | 未开始     |
| In Progress | 进行中     |
| Blocked     | 阻塞       |
| Completed   | 已完成     |
| Verified    | 已验证有效 |
| Deferred    | 延期       |

---

下一步: 调用 plan-synthesizer 整合计划
