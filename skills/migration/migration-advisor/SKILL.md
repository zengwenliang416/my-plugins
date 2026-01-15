---
name: migration-advisor
description: |
  【触发条件】综合所有分析报告生成迁移建议时使用
  【核心产出】${run_dir}/reports/migration-strategy.md
  【不触发】单个报告生成、查询特定建议
allowed-tools: Read, Write, Bash
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
---

# Migration Advisor - 迁移建议生成器

## 职责边界

- **输入**: 所有分析和审计报告（Phase 3/4 产出）
- **输出**: `.claude/migration/reports/migration-strategy.md`
- **核心能力**: 综合分析、优先级排序、可执行路线图生成

## 执行流程

### Step 1: 读取所有分析报告

```bash
# 创建报告目录
mkdir -p .claude/migration/reports

# 定义报告文件路径
tech_stack=".claude/migration/context/tech-stack.json"
backend_analysis=".claude/migration/analysis/backend-analysis.md"
frontend_analysis=".claude/migration/analysis/frontend-analysis.md"
dependency_map=".claude/migration/analysis/dependency-map.md"
eol_report=".claude/migration/audit/eol-report.md"
tech_debt_report=".claude/migration/audit/tech-debt-report.md"
security_report=".claude/migration/audit/security-report.md"

# 验证文件存在性
required_files=("$tech_stack" "$backend_analysis" "$dependency_map" "$eol_report")
missing_files=()

for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    missing_files+=("$file")
  fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
  echo "❌ 缺少必要报告文件："
  printf '%s\n' "${missing_files[@]}"
  exit 1
fi
```

### Step 2: 提取关键指标

```bash
# 从 tech-stack.json 提取
language=$(jq -r '.language' < "$tech_stack")
language_version=$(jq -r '.version' < "$tech_stack")

# 从 EOL 报告提取
high_risk_eol=$(grep -c "紧急度.*高" "$eol_report" || echo "0")
eol_primary=$(grep "建议升级到" "$eol_report" | head -1 | sed 's/.*建议升级到//')

# 从 backend-analysis 提取
quality_score=$(grep -oE "评分.*[0-9]/5" "$backend_analysis" | grep -oE "[0-9]" | head -1)
critical_issues=$(grep -oE "严重问题.*[0-9]+" "$backend_analysis" | grep -oE "[0-9]+" | tail -1 || echo "0")
tech_debt_hours=$(grep -oE "合计.*[0-9]+ 人时" "$backend_analysis" | grep -oE "[0-9]+" | tail -1 || echo "0")

# 从 dependency-map 提取
circular_deps=$(grep -c "循环依赖" "$dependency_map" || echo "0")
high_risk_deps=$(grep -c "CVSS.*[89]\.[0-9]" "$dependency_map" || echo "0")

# 从 security-report 提取
critical_vulns=$(grep -oE "严重.*[0-9]+" "$security_report" | grep -oE "[0-9]+" | head -1 || echo "0")
high_vulns=$(grep -oE "高危.*[0-9]+" "$security_report" | grep -oE "[0-9]+" | head -1 || echo "0")

# 从 tech-debt-report 提取（如果存在）
if [ -f "$tech_debt_report" ]; then
  total_debt_hours=$(grep -oE "总修复工时.*[0-9]+" "$tech_debt_report" | grep -oE "[0-9]+" | tail -1 || echo "$tech_debt_hours")
  god_classes=$(grep -c "God Class" "$tech_debt_report" || echo "0")
fi

# 计算总体风险评分（1-10）
risk_score=$(( (critical_issues > 0 ? 3 : 0) + \
               (critical_vulns > 0 ? 3 : 0) + \
               (high_risk_eol > 2 ? 2 : high_risk_eol > 0 ? 1 : 0) + \
               (circular_deps > 3 ? 2 : circular_deps > 0 ? 1 : 0) ))
```

### Step 3: 生成迁移策略矩阵

```bash
# 根据风险评分和质量评分确定迁移策略
determine_strategy() {
  local risk=$1
  local quality=$2

  if [ "$risk" -ge 7 ] || [ "$quality" -le 2 ]; then
    echo "激进式重写"
  elif [ "$risk" -ge 5 ] || [ "$quality" -le 3 ]; then
    echo "渐进式迁移"
  elif [ "$risk" -ge 3 ]; then
    echo "增量式升级"
  else
    echo "维护性升级"
  fi
}

strategy=$(determine_strategy "$risk_score" "$quality_score")

# 策略详细信息
case "$strategy" in
  "激进式重写")
    strategy_desc="项目质量差、技术债务高，建议新建项目重写核心业务"
    timeline="6-12 个月"
    risk_level="高"
    ;;
  "渐进式迁移")
    strategy_desc="分模块逐步迁移，使用 Strangler Fig 模式"
    timeline="4-8 个月"
    risk_level="中"
    ;;
  "增量式升级")
    strategy_desc="保持现有架构，逐步升级框架和依赖"
    timeline="2-4 个月"
    risk_level="低"
    ;;
  "维护性升级")
    strategy_desc="小幅度升级，主要处理安全漏洞和 EOL 组件"
    timeline="1-2 个月"
    risk_level="极低"
    ;;
esac
```

### Step 4: 提取所有报告的 P0/P1 任务

```bash
# 提取 P0 任务（立即处理）
p0_tasks=()

# 从 EOL 报告提取
if grep -q "P0" "$eol_report"; then
  while IFS= read -r line; do
    p0_tasks+=("EOL-P0: $line")
  done < <(sed -n '/### P0/,/### P1/p' "$eol_report" | grep "^1\." | head -3)
fi

# 从安全报告提取
if grep -q "### P0" "$security_report"; then
  while IFS= read -r line; do
    p0_tasks+=("SEC-P0: $line")
  done < <(sed -n '/### P0/,/### P1/p' "$security_report" | grep "^1\." | head -3)
fi

# 从依赖报告提取
if grep -q "### P0" "$dependency_map"; then
  while IFS= read -r line; do
    p0_tasks+=("DEP-P0: $line")
  done < <(sed -n '/### P0/,/### P1/p' "$dependency_map" | grep "^1\." | head -3)
fi

# 提取 P1 任务（高优先级）
p1_tasks=()

if grep -q "### P1" "$backend_analysis"; then
  while IFS= read -r line; do
    p1_tasks+=("CODE-P1: $line")
  done < <(sed -n '/### P1/,/### P2/p' "$backend_analysis" | grep "^1\." | head -3)
fi

if grep -q "### P1" "$security_report"; then
  while IFS= read -r line; do
    p1_tasks+=("SEC-P1: $line")
  done < <(sed -n '/### P1/,/### P2/p' "$security_report" | grep "^1\." | head -3)
fi
```

### Step 5: 生成分阶段执行计划

```bash
# 根据策略生成阶段
case "$strategy" in
  "激进式重写")
    phases='
### 阶段 1：风险降级（1-2 周）
- 修复所有严重安全漏洞（P0）
- 升级高危依赖
- 外部化敏感配置

### 阶段 2：新项目准备（1 个月）
- 搭建新项目骨架（最新框架）
- 设计新架构（DDD/微服务）
- 建立 CI/CD 流水线

### 阶段 3：核心业务迁移（3-4 个月）
- 识别核心业务模块
- 重写业务逻辑（TDD）
- 并行运行新旧系统

### 阶段 4：数据迁移（1-2 个月）
- 数据清洗和迁移
- 双写验证
- 流量切换

### 阶段 5：遗留系统下线（1 个月）
- 监控新系统稳定性
- 逐步关闭旧系统
- 文档归档
'
    ;;
  "渐进式迁移")
    phases='
### 阶段 1：安全加固（1-2 周）
- 修复严重安全漏洞
- 升级高危依赖
- 修复 EOL 组件

### 阶段 2：技术债清理（1-2 个月）
- 拆分 God Classes
- 修复循环依赖
- 提升测试覆盖率

### 阶段 3：框架升级（2-3 个月）
- 升级到过渡版本（如 Spring Boot 2.7）
- 统一配置方式
- 回归测试

### 阶段 4：目标版本迁移（2-3 个月）
- 升级到目标版本（如 Spring Boot 3.2）
- 适配 API 变更
- 性能优化
'
    ;;
  "增量式升级")
    phases='
### 阶段 1：安全和 EOL 修复（1-2 周）
- 修复严重安全漏洞
- 升级 EOL 组件
- 依赖版本统一

### 阶段 2：小版本升级（1 个月）
- 升级框架小版本（如 4.3 → 4.5）
- 修复弃用 API
- 回归测试

### 阶段 3：大版本升级（1-2 个月）
- 升级到下一个大版本
- 适配 Breaking Changes
- 性能验证

### 阶段 4：优化和巩固（1 个月）
- 代码质量提升
- 文档更新
- 知识转移
'
    ;;
  "维护性升级")
    phases='
### 阶段 1：安全修复（1 周）
- 修复严重安全漏洞
- 升级高危依赖

### 阶段 2：EOL 组件升级（2-3 周）
- 升级即将 EOL 的组件
- 回归测试

### 阶段 3：小幅优化（1 个月）
- 修复已知 Bug
- 小幅性能优化
- 文档更新
'
    ;;
esac
```

### Step 6: 生成最终迁移策略报告

```bash
cat > .claude/migration/reports/migration-strategy.md <<EOF
# 迁移策略建议

> 生成时间: $(date '+%Y-%m-%d %H:%M:%S')
> 项目: ${language} ${language_version}
> 综合风险评分: ${risk_score}/10

## 执行摘要

### 当前状态评估

| 维度         | 评分/数量     | 状态     |
| ------------ | ------------- | -------- |
| 代码质量     | ${quality_score}/5 星      | ${quality_score:-未知} |
| 严重问题     | ${critical_issues} 个      | $([ "$critical_issues" -gt 0 ] && echo "⚠️ 需修复" || echo "✅ 良好") |
| 安全漏洞     | 严重 ${critical_vulns} + 高危 ${high_vulns} | $([ "$critical_vulns" -gt 0 ] && echo "⚠️ 需修复" || echo "✅ 良好") |
| EOL 风险     | ${high_risk_eol} 个高风险  | $([ "$high_risk_eol" -gt 0 ] && echo "⚠️ 需升级" || echo "✅ 良好") |
| 循环依赖     | ${circular_deps} 个        | $([ "$circular_deps" -gt 0 ] && echo "⚠️ 需解耦" || echo "✅ 良好") |
| 技术债务     | ${tech_debt_hours} 人时    | $([ "$tech_debt_hours" -gt 100 ] && echo "⚠️ 较高" || echo "✅ 可控") |

### 推荐策略

**${strategy}**

- **描述**: ${strategy_desc}
- **预估工期**: ${timeline}
- **风险等级**: ${risk_level}

## 优先级任务清单

### P0 任务（立即处理，1 周内）

$(printf '%s\n' "${p0_tasks[@]}" | head -10)

**说明**: P0 任务为安全漏洞、EOL 组件、严重 Bug，延迟处理将导致生产风险

### P1 任务（高优先级，1 个月内）

$(printf '%s\n' "${p1_tasks[@]}" | head -10)

**说明**: P1 任务为代码质量问题、中等安全风险，影响开发效率和系统稳定性

## 分阶段执行计划

${phases}

## 资源需求评估

### 人力需求

| 阶段   | 前端工程师 | 后端工程师 | 测试工程师 | DevOps | 总计 |
| ------ | ---------- | ---------- | ---------- | ------ | ---- |
| 阶段 1 | 0          | 1          | 0.5        | 0.5    | 2    |
| 阶段 2 | 1          | 2          | 1          | 0.5    | 4.5  |
| 阶段 3 | 1          | 2          | 1          | 1      | 5    |
| 阶段 4 | 0.5        | 1          | 1          | 0.5    | 3    |

**总计**: 约 ${timeline} 工期，峰值 5 人

### 预算估算

| 项目         | 金额（元） | 说明               |
| ------------ | ---------- | ------------------ |
| 人力成本     | 估算       | 按工期和人数计算   |
| 工具和服务   | 50,000     | CI/CD、监控、云服务|
| 测试环境     | 30,000     | 服务器、数据库     |
| 培训         | 20,000     | 新技术栈培训       |
| 应急预留     | 50,000     | 不可预见风险       |
| **总预算**   | **估算**   | 建议预留 20% 缓冲  |

## 风险分析

### 高风险项

$([ "$critical_vulns" -gt 0 ] && echo "1. **安全漏洞**: ${critical_vulns} 个严重漏洞可能导致数据泄露")
$([ "$high_risk_eol" -gt 2 ] && echo "2. **EOL 组件**: ${high_risk_eol} 个组件已 EOL，无安全补丁")
$([ "$circular_deps" -gt 3 ] && echo "3. **循环依赖**: ${circular_deps} 个循环依赖可能导致重构困难")

### 风险缓解措施

1. **技术风险**: 建立回滚机制，保持新旧系统并行
2. **进度风险**: 采用敏捷方法，每 2 周交付可演示版本
3. **质量风险**: 提升测试覆盖率到 80%+，强制 Code Review
4. **人员风险**: 关键模块双人协作，知识共享会议

## 成功标准

### 技术指标

- [ ] 代码质量评分达到 4/5 星以上
- [ ] 单元测试覆盖率 ≥80%
- [ ] 严重安全漏洞清零
- [ ] EOL 组件全部升级
- [ ] 循环依赖全部解除

### 业务指标

- [ ] 系统响应时间 <500ms（P95）
- [ ] 月度故障率 <0.1%
- [ ] 新功能交付周期缩短 30%
- [ ] 生产事故减少 50%

## 关键决策点

### 决策 1: 是否引入微服务

**场景**: 如果项目复杂度高、团队规模 >10 人

**建议**:
- **是**: 采用 DDD + 微服务，团队独立开发
- **否**: 保持单体架构，专注业务迁移

**判断依据**: 项目代码行数 >50K 且模块耦合严重

### 决策 2: 数据库是否升级

**场景**: 当前数据库版本已 EOL

**建议**:
- **立即升级**: 如果 EOL <3 个月
- **计划升级**: 如果 EOL 3-6 个月
- **暂缓**: 如果 EOL >6 个月且无安全漏洞

**当前状态**: ${eol_primary}

## 下一步行动

### 本周行动项

1. [ ] 召集项目启动会，对齐迁移目标
2. [ ] 分配 P0 任务给团队成员
3. [ ] 建立每日站会机制
4. [ ] 搭建迁移项目看板（Jira/Trello）

### 本月行动项

1. [ ] 完成所有 P0 任务
2. [ ] 完成阶段 1 全部任务
3. [ ] 制定详细的阶段 2 计划
4. [ ] 进行第一次里程碑复盘

## 参考文档

- [后端架构分析](../analysis/backend-analysis.md)
- [前端架构分析](../analysis/frontend-analysis.md)
- [依赖关系分析](../analysis/dependency-map.md)
- [EOL 状态检查](../audit/eol-report.md)
- [安全审计报告](../audit/security-report.md)
- [技术债务报告](../audit/tech-debt-report.md)

---

**文档版本**: 1.0
**下次更新**: 每阶段结束后更新
**维护者**: 迁移项目负责人
EOF

echo "✅ 迁移策略报告已生成: .claude/migration/reports/migration-strategy.md"
```

## 输出示例（Java 项目）

```markdown
# 迁移策略建议

> 生成时间: 2026-01-13 15:30:00
> 项目: Java 8
> 综合风险评分: 7/10

## 执行摘要

### 当前状态评估

| 维度     | 评分/数量       | 状态      |
| -------- | --------------- | --------- |
| 代码质量 | 3/5 星          | 中等      |
| 严重问题 | 3 个            | ⚠️ 需修复 |
| 安全漏洞 | 严重 2 + 高危 5 | ⚠️ 需修复 |
| EOL 风险 | 3 个高风险      | ⚠️ 需升级 |
| 循环依赖 | 2 个            | ⚠️ 需解耦 |
| 技术债务 | 70 人时         | ✅ 可控   |

### 推荐策略

**渐进式迁移**

- **描述**: 分模块逐步迁移，使用 Strangler Fig 模式
- **预估工期**: 4-8 个月
- **风险等级**: 中

## 优先级任务清单

### P0 任务（立即处理，1 周内）

1. SEC-P0: SQL 注入修复（5 处）- 8 人时
2. SEC-P0: 反序列化漏洞修复 - 4 人时
3. EOL-P0: Log4j 1.2.17 → 2.20.0 - 4 人时
4. DEP-P0: commons-fileupload 1.3.1 → 1.5 - 2 人时

### P1 任务（高优先级，1 个月内）

1. CODE-P1: Spring 4.3 → Spring Boot 2.7 - 160 人时
2. SEC-P1: 访问控制缺失修复（12 处）- 16 人时
3. DEP-P1: MySQL Connector 5.1.47 → 8.0.33 - 3 人时

## 分阶段执行计划

### 阶段 1：安全加固（1-2 周）

- 修复严重安全漏洞
- 升级高危依赖
- 修复 EOL 组件

### 阶段 2：技术债清理（1-2 个月）

- 拆分 God Classes
- 修复循环依赖
- 提升测试覆盖率

### 阶段 3：框架升级（2-3 个月）

- 升级到过渡版本（Spring Boot 2.7）
- 统一配置方式
- 回归测试

### 阶段 4：目标版本迁移（2-3 个月）

- 升级到目标版本（Spring Boot 3.2）
- 适配 API 变更
- 性能优化

## 关键决策点

### 决策 1: 是否引入微服务

**场景**: 项目代码 45K 行，模块耦合中等

**建议**: **否** - 保持单体架构，专注框架升级

### 决策 2: 数据库是否升级

**当前状态**: MySQL 5.7（EOL: 2023-10-31，已 EOL）

**建议**: **立即升级** - MySQL 5.7 → 8.0
```

## Gate 检查

- [x] 读取所有必要报告（backend/frontend/dependency/eol/security）
- [x] 关键指标提取准确（质量评分、漏洞数、EOL 数）
- [x] 风险评分基于量化指标（1-10 分）
- [x] 策略选择基于风险和质量评分（4 种策略）
- [x] P0/P1 任务从各报告提取并汇总
- [x] 分阶段计划根据策略动态生成
- [x] 资源需求评估包含人力和预算
- [x] 成功标准可量化

**失败处理**: 如果缺少必要报告文件，输出缺失列表并终止

## 返回值

```json
{
  "status": "success",
  "strategy_file": ".claude/migration/reports/migration-strategy.md",
  "summary": {
    "strategy": "渐进式迁移",
    "timeline": "4-8 个月",
    "risk_score": 7,
    "p0_count": 4,
    "p1_count": 3
  }
}
```

## 策略选择矩阵

| 风险评分 | 质量评分 | 推荐策略   |
| -------- | -------- | ---------- |
| ≥7 或 ≤2 | 任意     | 激进式重写 |
| 5-6 或 3 | 任意     | 渐进式迁移 |
| 3-4      | 任意     | 增量式升级 |
| <3       | ≥4       | 维护性升级 |

## 风险评分计算规则

```bash
risk_score =
  (有严重问题 ? 3 : 0) +
  (有严重漏洞 ? 3 : 0) +
  (高风险EOL数 >2 ? 2 : >0 ? 1 : 0) +
  (循环依赖数 >3 ? 2 : >0 ? 1 : 0)
```
