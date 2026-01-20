# 风险登记表

## 项目信息

| 字段     | 值               |
| -------- | ---------------- |
| 项目名称 | {{project_name}} |
| 创建日期 | {{created_at}}   |
| 更新日期 | {{updated_at}}   |
| 负责人   | {{owner}}        |
| 版本     | {{version}}      |

---

## 风险登记

{{#each risks}}

### {{id}}: {{title}}

#### 基本信息

| 字段     | 值                  |
| -------- | ------------------- |
| 风险 ID  | {{id}}              |
| 标题     | {{title}}           |
| 类别     | {{category}}        |
| 来源     | {{source}}          |
| 识别日期 | {{identified_date}} |
| 识别人   | {{identified_by}}   |
| 状态     | {{status}}          |

#### 风险描述

**场景**:
{{scenario}}

**根本原因**:
{{root_cause}}

**触发条件**:
{{trigger}}

**影响描述**:
{{impact_description}}

#### 风险评估

| 评估项     | 分数                 | 等级                 |
| ---------- | -------------------- | -------------------- |
| Likelihood | {{likelihood_score}} | {{likelihood_level}} |
| Impact     | {{impact_score}}     | {{impact_level}}     |
| **Risk**   | **{{risk_score}}**   | **{{risk_level}}**   |

##### Likelihood 因素

| 因素     | 分数               | 说明                    |
| -------- | ------------------ | ----------------------- |
| 技能等级 | {{ta_skill}}       | {{ta_skill_note}}       |
| 动机     | {{ta_motive}}      | {{ta_motive_note}}      |
| 机会     | {{ta_opportunity}} | {{ta_opportunity_note}} |
| 规模     | {{ta_size}}        | {{ta_size_note}}        |
| 易发现性 | {{vf_discovery}}   | {{vf_discovery_note}}   |
| 易利用性 | {{vf_exploit}}     | {{vf_exploit_note}}     |
| 认知程度 | {{vf_awareness}}   | {{vf_awareness_note}}   |
| 入侵检测 | {{vf_detection}}   | {{vf_detection_note}}   |

##### Impact 因素

| 因素     | 分数                   | 说明                        |
| -------- | ---------------------- | --------------------------- |
| 保密性   | {{ti_confidentiality}} | {{ti_confidentiality_note}} |
| 完整性   | {{ti_integrity}}       | {{ti_integrity_note}}       |
| 可用性   | {{ti_availability}}    | {{ti_availability_note}}    |
| 可审计性 | {{ti_accountability}}  | {{ti_accountability_note}}  |
| 财务     | {{bi_financial}}       | {{bi_financial_note}}       |
| 声誉     | {{bi_reputation}}      | {{bi_reputation_note}}      |
| 合规     | {{bi_compliance}}      | {{bi_compliance_note}}      |
| 隐私     | {{bi_privacy}}         | {{bi_privacy_note}}         |

#### 受影响资产

| 资产名称 | 分类级别 | 影响程度 |
| -------- | -------- | -------- |

{{#each affected_assets}}
| {{name}} | {{classification}} | {{impact_degree}} |
{{/each}}

#### 缓解策略

**策略类型**: {{mitigation_strategy}}

| 控制措施 | 类型 | 状态 | 有效性 |
| -------- | ---- | ---- | ------ |

{{#each controls}}
| {{name}} | {{type}} | {{status}} | {{effectiveness}} |
{{/each}}

#### 行动计划

| 编号 | 行动项 | 负责人 | 截止日期 | 状态 |
| ---- | ------ | ------ | -------- | ---- |

{{#each action_items}}
| {{seq}} | {{action}} | {{owner}} | {{deadline}} | {{status}} |
{{/each}}

#### 剩余风险

| 评估项     | 当前                   | 预期                    | 可接受                    |
| ---------- | ---------------------- | ----------------------- | ------------------------- |
| Likelihood | {{current_likelihood}} | {{expected_likelihood}} | {{likelihood_acceptable}} |
| Impact     | {{current_impact}}     | {{expected_impact}}     | {{impact_acceptable}}     |
| Risk       | {{current_risk}}       | {{expected_risk}}       | {{risk_acceptable}}       |

#### 监控与复审

| 字段         | 值                  |
| ------------ | ------------------- |
| 复审周期     | {{review_cycle}}    |
| 下次复审日期 | {{next_review}}     |
| 监控指标     | {{monitor_kpi}}     |
| 告警阈值     | {{alert_threshold}} |

#### 历史记录

| 日期 | 事件 | 变更内容 | 操作人 |
| ---- | ---- | -------- | ------ |

{{#each history}}
| {{date}} | {{event}} | {{change}} | {{by}} |
{{/each}}

#### 相关链接

| 类型 | 链接 |
| ---- | ---- |

{{#each related_links}}
| {{type}} | {{link}} |
{{/each}}

---

{{/each}}

## 统计汇总

### 按状态

| 状态        | 数量                | 占比               |
| ----------- | ------------------- | ------------------ |
| Open        | {{open_count}}      | {{open_pct}}%      |
| In Progress | {{progress_count}}  | {{progress_pct}}%  |
| Mitigated   | {{mitigated_count}} | {{mitigated_pct}}% |
| Closed      | {{closed_count}}    | {{closed_pct}}%    |
| Accepted    | {{accepted_count}}  | {{accepted_pct}}%  |

### 按等级

| 等级     | 数量               | 待处理            |
| -------- | ------------------ | ----------------- |
| Critical | {{critical_total}} | {{critical_open}} |
| High     | {{high_total}}     | {{high_open}}     |
| Medium   | {{medium_total}}   | {{medium_open}}   |
| Low      | {{low_total}}      | {{low_open}}      |

### 按类别

| 类别 | 数量 | 最高等级 |
| ---- | ---- | -------- |

{{#each category_stats}}
| {{name}} | {{count}} | {{max_level}} |
{{/each}}

---

## 附录

### 风险状态定义

| 状态        | 描述                       |
| ----------- | -------------------------- |
| Open        | 已识别，待评估或待处理     |
| In Progress | 正在实施缓解措施           |
| Mitigated   | 缓解措施已实施，等待验证   |
| Closed      | 风险已消除或降至可接受水平 |
| Accepted    | 接受风险，不采取进一步措施 |

### 风险等级定义

| 等级     | 分数范围 | 响应要求             |
| -------- | -------- | -------------------- |
| Critical | 7-9      | 立即响应，需高管关注 |
| High     | 5-7      | 24 小时内响应        |
| Medium   | 3-5      | 1 周内制定计划       |
| Low      | 1-3      | 记录并定期复审       |

### 控制措施类型

| 类型         | 描述                               |
| ------------ | ---------------------------------- |
| Preventive   | 预防性控制，降低发生可能性         |
| Detective    | 检测性控制，及时发现问题           |
| Corrective   | 纠正性控制，问题发生后的补救       |
| Compensating | 补偿性控制，替代无法实施的主要控制 |
