# Release Policy

发布节奏约定，定义计划与发布的对应关系。

## 1. 发布节奏模型

### 1.1 常见发布模式

| 模式       | 周期   | 适用场景           |
| ---------- | ------ | ------------------ |
| Continuous | 持续   | 成熟 CI/CD，小批量 |
| Daily      | 每日   | Web 应用，快速迭代 |
| Weekly     | 每周   | 敏捷团队，固定节奏 |
| Sprint     | 2-4 周 | Scrum 团队         |
| Monthly    | 每月   | B2B 产品，稳定优先 |
| Quarterly  | 季度   | 大型系统，协调复杂 |

### 1.2 选择因素

| 因素       | 快节奏      | 慢节奏     |
| ---------- | ----------- | ---------- |
| 用户类型   | 消费者/内部 | 企业/合规  |
| 部署复杂度 | 自动化高    | 手动步骤多 |
| 回滚成本   | 低          | 高         |
| 测试覆盖   | 完善        | 需人工验证 |
| 合规要求   | 灵活        | 严格       |

## 2. 发布类型

### 2.1 类型定义

| 类型   | 版本号规则 | 描述             | 审批要求 |
| ------ | ---------- | ---------------- | -------- |
| Hotfix | x.y.Z      | 紧急修复         | 简化流程 |
| Patch  | x.y.Z      | Bug 修复         | 常规审批 |
| Minor  | x.Y.0      | 新功能，向后兼容 | 常规审批 |
| Major  | X.0.0      | 破坏性变更       | 高管审批 |

### 2.2 语义化版本

```
MAJOR.MINOR.PATCH

MAJOR: 不兼容的 API 变更
MINOR: 向后兼容的功能新增
PATCH: 向后兼容的 Bug 修复
```

### 2.3 预发布标签

```
1.0.0-alpha.1    # 内部测试
1.0.0-beta.1     # 外部测试
1.0.0-rc.1       # 发布候选
1.0.0            # 正式发布
```

## 3. 发布检查清单

### 3.1 代码质量

- [ ] 所有测试通过
- [ ] 代码审查完成
- [ ] 静态分析无高危问题
- [ ] 测试覆盖率达标

### 3.2 安全检查

- [ ] 依赖漏洞扫描
- [ ] 安全审查完成
- [ ] 敏感信息检查
- [ ] 权限配置验证

### 3.3 文档更新

- [ ] CHANGELOG 更新
- [ ] API 文档更新
- [ ] 用户手册更新
- [ ] 部署文档更新

### 3.4 部署准备

- [ ] 数据库迁移脚本
- [ ] 配置变更清单
- [ ] 回滚方案准备
- [ ] 监控告警配置

## 4. 发布流程

### 4.1 标准流程

```
1. 代码冻结
   ↓
2. 发布分支创建
   ↓
3. 集成测试
   ↓
4. 预发布环境验证
   ↓
5. 发布审批
   ↓
6. 生产部署
   ↓
7. 发布验证
   ↓
8. 发布公告
```

### 4.2 紧急流程 (Hotfix)

```
1. 问题确认
   ↓
2. Hotfix 分支
   ↓
3. 修复 + 测试
   ↓
4. 快速审批
   ↓
5. 生产部署
   ↓
6. 验证 + 通知
```

### 4.3 回滚流程

```
1. 问题检测
   ↓
2. 回滚决策
   ↓
3. 执行回滚
   ↓
4. 验证恢复
   ↓
5. 根因分析
   ↓
6. 修复计划
```

## 5. 环境策略

### 5.1 环境层级

| 环境        | 用途       | 数据     | 部署频率 |
| ----------- | ---------- | -------- | -------- |
| Development | 开发调试   | 模拟数据 | 持续     |
| Testing     | 功能测试   | 测试数据 | 每日     |
| Staging     | 预发布验证 | 生产副本 | 按需     |
| Production  | 正式服务   | 真实数据 | 按计划   |

### 5.2 环境配置

```yaml
environments:
  development:
    auto_deploy: true
    approval_required: false
    data_source: mock

  testing:
    auto_deploy: true
    approval_required: false
    data_source: test_db

  staging:
    auto_deploy: false
    approval_required: true
    data_source: prod_snapshot

  production:
    auto_deploy: false
    approval_required: true
    data_source: production
```

## 6. 计划与发布对应

### 6.1 规划周期

| 规划范围 | 发布目标     | 示例         |
| -------- | ------------ | ------------ |
| 单任务   | Patch/Hotfix | Bug 修复     |
| 功能模块 | Minor        | 用户认证功能 |
| 多模块   | Minor        | Sprint 交付  |
| 大功能   | Major        | 重大架构升级 |

### 6.2 计划文档标注

```yaml
# plan.md 元信息
release_target:
  type: minor
  version: 1.2.0
  target_date: 2026-01-26
  dependencies:
    - migration: schema_v42
    - config: auth_settings
```

### 6.3 发布分组

当一个 plan 跨多个发布时：

```yaml
phases:
  - phase: 1
    release: 1.1.0
    tasks: [T-001, T-002, T-003]

  - phase: 2
    release: 1.2.0
    tasks: [T-004, T-005]
    depends_on: phase_1
```

## 7. 风险与发布

### 7.1 风险影响

| 风险等级 | 发布影响     | 建议操作       |
| -------- | ------------ | -------------- |
| Critical | 阻塞发布     | 修复后才能发布 |
| High     | 需要高管决策 | 记录风险并审批 |
| Medium   | 纳入发布说明 | 告知用户       |
| Low      | 可接受       | 后续迭代处理   |

### 7.2 发布条件

```yaml
release_gates:
  must_pass:
    - all_tests_pass
    - no_critical_risks
    - security_scan_clean
    - docs_updated

  should_pass:
    - no_high_risks
    - coverage_threshold

  nice_to_have:
    - performance_baseline
    - accessibility_audit
```

## 8. 沟通计划

### 8.1 内部沟通

| 时间点   | 受众    | 内容           |
| -------- | ------- | -------------- |
| 规划完成 | 团队    | 发布范围和时间 |
| 代码冻结 | 开发    | 停止新功能合入 |
| 预发布   | QA/运维 | 验证准备       |
| 发布完成 | 全员    | 发布结果       |

### 8.2 外部沟通

| 类型     | 时机        | 内容         |
| -------- | ----------- | ------------ |
| 预告     | 发布前 1 周 | 新功能预览   |
| 发布说明 | 发布当日    | 完整变更列表 |
| 迁移指南 | 破坏性变更  | 升级步骤     |
| 事后通报 | 故障时      | 影响和修复   |

### 8.3 CHANGELOG 格式

```markdown
## [1.2.0] - 2026-01-26

### Added

- 用户认证功能 (FR-001)
- OAuth 第三方登录 (FR-002)

### Changed

- 升级 React 到 19.0 (T-010)

### Fixed

- 修复登录页样式问题 (BUG-042)

### Security

- 修复 XSS 漏洞 (SEC-001)

### Breaking

- API 端点从 /api/v1 迁移到 /api/v2
```
