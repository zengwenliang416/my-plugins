# 威胁模型

## 项目信息

| 字段     | 值               |
| -------- | ---------------- |
| 项目名称 | {{project_name}} |
| 版本     | {{version}}      |
| 创建日期 | {{created_at}}   |
| 更新日期 | {{updated_at}}   |
| 负责人   | {{owner}}        |

---

## 1. 系统概述

### 1.1 系统描述

{{system_description}}

### 1.2 数据流图 (DFD)

```
{{dfd_diagram}}
```

### 1.3 信任边界

| 边界 ID | 名称 | 描述 | 跨越组件 |
| ------- | ---- | ---- | -------- |

{{#each trust_boundaries}}
| {{id}} | {{name}} | {{description}} | {{components}} |
{{/each}}

---

## 2. 资产识别

### 2.1 数据资产

| 资产 ID | 名称 | 分类级别 | 存储位置 | 传输方式 | 访问控制 |
| ------- | ---- | -------- | -------- | -------- | -------- |

{{#each data_assets}}
| {{id}} | {{name}} | {{classification}} | {{storage}} | {{transmission}} | {{access_control}} |
{{/each}}

### 2.2 系统资产

| 资产 ID | 名称 | 分类级别 | 技术栈 | SLA | 依赖 |
| ------- | ---- | -------- | ------ | --- | ---- |

{{#each system_assets}}
| {{id}} | {{name}} | {{classification}} | {{technology}} | {{sla}} | {{dependencies}} |
{{/each}}

---

## 3. 威胁识别 (STRIDE)

### 3.1 Spoofing (身份伪造)

{{#each spoofing_threats}}

#### S-{{@index}}: {{title}}

| 属性     | 值                    |
| -------- | --------------------- |
| 目标资产 | {{target}}            |
| 攻击场景 | {{scenario}}          |
| 前提条件 | {{precondition}}      |
| 攻击步骤 | {{attack_steps}}      |
| 现有控制 | {{existing_controls}} |
| 风险等级 | {{risk_level}}        |

{{/each}}

### 3.2 Tampering (数据篡改)

{{#each tampering_threats}}

#### T-{{@index}}: {{title}}

| 属性     | 值                    |
| -------- | --------------------- |
| 目标资产 | {{target}}            |
| 攻击场景 | {{scenario}}          |
| 前提条件 | {{precondition}}      |
| 攻击步骤 | {{attack_steps}}      |
| 现有控制 | {{existing_controls}} |
| 风险等级 | {{risk_level}}        |

{{/each}}

### 3.3 Repudiation (抵赖)

{{#each repudiation_threats}}

#### R-{{@index}}: {{title}}

| 属性     | 值                    |
| -------- | --------------------- |
| 目标资产 | {{target}}            |
| 攻击场景 | {{scenario}}          |
| 前提条件 | {{precondition}}      |
| 攻击步骤 | {{attack_steps}}      |
| 现有控制 | {{existing_controls}} |
| 风险等级 | {{risk_level}}        |

{{/each}}

### 3.4 Information Disclosure (信息泄露)

{{#each information_disclosure_threats}}

#### I-{{@index}}: {{title}}

| 属性     | 值                    |
| -------- | --------------------- |
| 目标资产 | {{target}}            |
| 攻击场景 | {{scenario}}          |
| 前提条件 | {{precondition}}      |
| 攻击步骤 | {{attack_steps}}      |
| 现有控制 | {{existing_controls}} |
| 风险等级 | {{risk_level}}        |

{{/each}}

### 3.5 Denial of Service (拒绝服务)

{{#each dos_threats}}

#### D-{{@index}}: {{title}}

| 属性     | 值                    |
| -------- | --------------------- |
| 目标资产 | {{target}}            |
| 攻击场景 | {{scenario}}          |
| 前提条件 | {{precondition}}      |
| 攻击步骤 | {{attack_steps}}      |
| 现有控制 | {{existing_controls}} |
| 风险等级 | {{risk_level}}        |

{{/each}}

### 3.6 Elevation of Privilege (权限提升)

{{#each eop_threats}}

#### E-{{@index}}: {{title}}

| 属性     | 值                    |
| -------- | --------------------- |
| 目标资产 | {{target}}            |
| 攻击场景 | {{scenario}}          |
| 前提条件 | {{precondition}}      |
| 攻击步骤 | {{attack_steps}}      |
| 现有控制 | {{existing_controls}} |
| 风险等级 | {{risk_level}}        |

{{/each}}

---

## 4. 攻击树分析

### 4.1 主要攻击目标

{{#each attack_trees}}

#### 目标: {{goal}}

```
{{tree_diagram}}
```

**关键路径**: {{critical_path}}

**最低成本攻击**: {{lowest_cost_attack}}

{{/each}}

---

## 5. 威胁统计

### 5.1 按 STRIDE 分类

| 类别                   | 数量                  | 高风险               |
| ---------------------- | --------------------- | -------------------- |
| Spoofing               | {{spoofing_count}}    | {{spoofing_high}}    |
| Tampering              | {{tampering_count}}   | {{tampering_high}}   |
| Repudiation            | {{repudiation_count}} | {{repudiation_high}} |
| Information Disclosure | {{info_count}}        | {{info_high}}        |
| Denial of Service      | {{dos_count}}         | {{dos_high}}         |
| Elevation of Privilege | {{eop_count}}         | {{eop_high}}         |

### 5.2 按风险等级

| 等级     | 数量               |
| -------- | ------------------ |
| Critical | {{critical_count}} |
| High     | {{high_count}}     |
| Medium   | {{medium_count}}   |
| Low      | {{low_count}}      |

### 5.3 热力图

```
              Spoofing  Tampering  Repudiation  Info Disc  DoS  EoP
            ┌─────────┬─────────┬───────────┬──────────┬─────┬─────┐
  Critical  │  {{sc}} │  {{tc}} │   {{rc}}  │  {{ic}}  │{{dc}}│{{ec}}│
            ├─────────┼─────────┼───────────┼──────────┼─────┼─────┤
  High      │  {{sh}} │  {{th}} │   {{rh}}  │  {{ih}}  │{{dh}}│{{eh}}│
            ├─────────┼─────────┼───────────┼──────────┼─────┼─────┤
  Medium    │  {{sm}} │  {{tm}} │   {{rm}}  │  {{im}}  │{{dm}}│{{em}}│
            ├─────────┼─────────┼───────────┼──────────┼─────┼─────┤
  Low       │  {{sl}} │  {{tl}} │   {{rl}}  │  {{il}}  │{{dl}}│{{el}}│
            └─────────┴─────────┴───────────┴──────────┴─────┴─────┘
```

---

## 6. 优先威胁列表

| 优先级 | 威胁 ID | STRIDE | 标题 | 风险分数 | 状态 |
| ------ | ------- | ------ | ---- | -------- | ---- |

{{#each prioritized_threats}}
| P{{priority}} | {{id}} | {{stride}} | {{title}} | {{risk_score}} | {{status}} |
{{/each}}

---

## 7. 缓解建议

{{#each mitigation_recommendations}}

### {{threat_id}}: {{threat_title}}

**建议控制措施**:

| 控制措施 | 类型 | 有效性 | 实施成本 | 优先级 |
| -------- | ---- | ------ | -------- | ------ |

{{#each controls}}
| {{name}} | {{type}} | {{effectiveness}} | {{cost}} | {{priority}} |
{{/each}}

**快速缓解**: {{quick_fix}}

**长期方案**: {{long_term_solution}}

{{/each}}

---

## 附录

### A. STRIDE 威胁类型定义

| 类型                   | 描述                 | 违反属性 |
| ---------------------- | -------------------- | -------- |
| Spoofing               | 冒充其他实体的身份   | 认证     |
| Tampering              | 未授权修改数据或代码 | 完整性   |
| Repudiation            | 否认执行过的操作     | 不可否认 |
| Information Disclosure | 泄露信息给未授权方   | 保密性   |
| Denial of Service      | 使系统或资源不可用   | 可用性   |
| Elevation of Privilege | 获取超出授权的权限   | 授权     |

### B. 风险等级定义

| 等级     | 分数范围 | 描述                |
| -------- | -------- | ------------------- |
| Critical | 7-9      | 需立即处理          |
| High     | 5-7      | 需在 24 小时内响应  |
| Medium   | 3-5      | 需在 1 周内制定计划 |
| Low      | 1-3      | 记录并定期复审      |

### C. 控制类型

| 类型         | 描述                   |
| ------------ | ---------------------- |
| Preventive   | 预防威胁发生           |
| Detective    | 检测威胁活动           |
| Corrective   | 响应和恢复             |
| Compensating | 替代无法实施的主要控制 |

---

下一步: 调用 risk-assessor 进行 OWASP 风险评分
