# 风险评估文档

## 元信息

- 评估时间: {{assessed_at}}
- 项目名称: {{project_name}}
- 评估范围: {{scope}}
- 评估方法: OWASP Risk Rating Methodology

## 1. 风险概览

### 风险统计

| 等级     | 数量                | 占比                     |
| -------- | ------------------- | ------------------------ |
| Critical | {{critical_count}}  | {{critical_percentage}}% |
| High     | {{high_count}}      | {{high_percentage}}%     |
| Medium   | {{medium_count}}    | {{medium_percentage}}%   |
| Low      | {{low_count}}       | {{low_percentage}}%      |
| **总计** | **{{total_count}}** | **100%**                 |

### 风险热力图

```
         Impact
         LOW    MEDIUM   HIGH
       ┌───────┬───────┬───────┐
  HIGH │   M   │   H   │   C   │ {{high_low}} | {{high_med}} | {{high_high}}
       ├───────┼───────┼───────┤
L MEDIUM│   L   │   M   │   H   │ {{med_low}} | {{med_med}} | {{med_high}}
i      ├───────┼───────┼───────┤
k LOW  │   N   │   L   │   M   │ {{low_low}} | {{low_med}} | {{low_high}}
e      └───────┴───────┴───────┘
l
i
h
o
o
d
```

## 2. 高优先级风险

{{#each critical_risks}}

### {{id}}: {{title}}

| 属性     | 值                                    |
| -------- | ------------------------------------- |
| 风险等级 | 🔴 **CRITICAL** ({{score}})           |
| 可能性   | {{likelihood}} ({{likelihood_level}}) |
| 影响     | {{impact}} ({{impact_level}})         |
| 响应时间 | 立即                                  |
| 负责人   | {{owner}}                             |

**场景描述**:
{{scenario}}

**受影响资产**:
{{#each affected_assets}}

- {{name}} ({{classification}})
  {{/each}}

**缓解措施**:
{{#each mitigation_actions}}

- [ ] {{action}} - {{owner}} - {{deadline}}
      {{/each}}

---

{{/each}}

{{#each high_risks}}

### {{id}}: {{title}}

| 属性     | 值                                    |
| -------- | ------------------------------------- |
| 风险等级 | 🟠 **HIGH** ({{score}})               |
| 可能性   | {{likelihood}} ({{likelihood_level}}) |
| 影响     | {{impact}} ({{impact_level}})         |
| 响应时间 | 24 小时                               |
| 负责人   | {{owner}}                             |

**场景描述**:
{{scenario}}

**缓解措施**:
{{#each mitigation_actions}}

- [ ] {{action}}
      {{/each}}

---

{{/each}}

## 3. 中等优先级风险

{{#each medium_risks}}

### {{id}}: {{title}}

| 属性     | 值                    |
| -------- | --------------------- |
| 风险等级 | 🟡 Medium ({{score}}) |
| 可能性   | {{likelihood}}        |
| 影响     | {{impact}}            |
| 响应时间 | 1 周内                |

**场景**: {{scenario}}

**缓解措施**:
{{#each mitigation_actions}}

- [ ] {{action}}
      {{/each}}

{{/each}}

## 4. 低优先级风险

| ID  | 标题 | 分数 | 可能性 | 影响 | 缓解策略 |
| --- | ---- | ---- | ------ | ---- | -------- |

{{#each low_risks}}
| {{id}} | {{title}} | {{score}} | {{likelihood}} | {{impact}} | {{strategy}} |
{{/each}}

## 5. 风险分类分析

### 按类别

| 类别 | 数量 | 高优先级 | 示例 |
| ---- | ---- | -------- | ---- |

{{#each categories}}
| {{name}} | {{count}} | {{high_count}} | {{example}} |
{{/each}}

### 按来源

```mermaid
pie title 风险来源分布
{{#each sources}}
    "{{name}}" : {{count}}
{{/each}}
```

## 6. 风险评分详情

{{#each all_risks}}

### {{id}}: {{title}}

#### Likelihood 评估

| 因素           | 分数                   | 说明                        |
| -------------- | ---------------------- | --------------------------- |
| 技能等级       | {{threat_skill}}       | {{threat_skill_note}}       |
| 动机           | {{threat_motive}}      | {{threat_motive_note}}      |
| 机会           | {{threat_opportunity}} | {{threat_opportunity_note}} |
| 规模           | {{threat_size}}        | {{threat_size_note}}        |
| 易发现性       | {{vuln_discovery}}     | {{vuln_discovery_note}}     |
| 易利用性       | {{vuln_exploit}}       | {{vuln_exploit_note}}       |
| 认知程度       | {{vuln_awareness}}     | {{vuln_awareness_note}}     |
| 入侵检测       | {{vuln_detection}}     | {{vuln_detection_note}}     |
| **Likelihood** | **{{likelihood}}**     | (威胁代理 + 漏洞因素) / 2   |

#### Impact 评估

| 因素       | 分数                     | 说明                          |
| ---------- | ------------------------ | ----------------------------- |
| 保密性损失 | {{tech_confidentiality}} | {{tech_confidentiality_note}} |
| 完整性损失 | {{tech_integrity}}       | {{tech_integrity_note}}       |
| 可用性损失 | {{tech_availability}}    | {{tech_availability_note}}    |
| 可审计损失 | {{tech_accountability}}  | {{tech_accountability_note}}  |
| 财务损失   | {{biz_financial}}        | {{biz_financial_note}}        |
| 声誉损失   | {{biz_reputation}}       | {{biz_reputation_note}}       |
| 合规影响   | {{biz_compliance}}       | {{biz_compliance_note}}       |
| 隐私影响   | {{biz_privacy}}          | {{biz_privacy_note}}          |
| **Impact** | **{{impact}}**           | (技术影响 + 业务影响) / 2     |

#### 风险计算

```
Risk = Likelihood × Impact
     = {{likelihood}} × {{impact}}
     = {{score}}
     → {{severity}} 等级
```

---

{{/each}}

## 7. 缓解计划

### 优先级排序

| 优先级 | 风险 ID | 缓解措施 | 负责人 | 截止日期 | 状态 |
| ------ | ------- | -------- | ------ | -------- | ---- |

{{#each mitigation_plan}}
| P{{priority}} | {{risk_id}} | {{action}} | {{owner}} | {{deadline}} | {{status}} |
{{/each}}

### 资源需求

| 资源类型 | 需求描述 | 预估投入 |
| -------- | -------- | -------- |

{{#each resource_requirements}}
| {{type}} | {{description}} | {{estimate}} |
{{/each}}

## 8. 剩余风险

完成缓解措施后的预期剩余风险：

| 风险 ID | 当前分数 | 预期分数 | 降低幅度 | 可接受 |
| ------- | -------- | -------- | -------- | ------ |

{{#each residual_risks}}
| {{id}} | {{current}} | {{expected}} | {{reduction}}% | {{acceptable}} |
{{/each}}

## 9. 风险监控

### 指标定义

| 指标         | 定义                   | 阈值   | 当前值              |
| ------------ | ---------------------- | ------ | ------------------- |
| 高风险数量   | Critical + High 风险数 | < 5    | {{high_risk_count}} |
| 风险闭环率   | 已缓解 / 总数          | > 80%  | {{closure_rate}}%   |
| 平均修复时间 | 发现到缓解的平均时间   | < 7 天 | {{avg_fix_time}} 天 |
| 新增风险趋势 | 本周新增 - 上周新增    | ≤ 0    | {{risk_trend}}      |

### 复审计划

| 风险等级 | 复审周期 | 下次复审                 |
| -------- | -------- | ------------------------ |
| Critical | 每日     | {{next_critical_review}} |
| High     | 每周     | {{next_high_review}}     |
| Medium   | 每月     | {{next_medium_review}}   |
| Low      | 每季度   | {{next_low_review}}      |

## 10. 证据引用

本评估基于以下输入：

| 来源 | 文件/位置 | 描述 |
| ---- | --------- | ---- |

{{#each evidence_references}}
| {{source}} | `{{file}}` | {{description}} |
{{/each}}

---

下一步: 调用 plan-synthesizer 整合计划
