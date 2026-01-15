---
name: eol-checker
description: |
  【触发条件】检查技术栈 EOL（生命周期结束）状态时使用
  【核心产出】${run_dir}/audit/eol-report.md
  【不触发】单个框架版本查询
allowed-tools: Read, Write, Bash
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
---

# EOL Checker - 生命周期检查器

## 职责边界

- **输入**: `.claude/migration/context/tech-stack.json`
- **输出**: `.claude/migration/audit/eol-report.md`
- **核心能力**: 检测语言、框架、依赖的 EOL 状态，提供升级紧急度评估

## 执行流程

### Step 1: 读取技术栈信息

```bash
# 读取技术栈
tech_stack=$(cat .claude/migration/context/tech-stack.json)

# 提取关键信息
language=$(jq -r '.language' <<< "$tech_stack")
language_version=$(jq -r '.version' <<< "$tech_stack")
build_tool=$(jq -r '.buildTool' <<< "$tech_stack")

# 提取框架列表
backend_frameworks=$(jq -r '.frameworks.backend[]? | "\(.name):\(.version)"' <<< "$tech_stack")
frontend_frameworks=$(jq -r '.frameworks.frontend[]? | "\(.name):\(.version)"' <<< "$tech_stack")
```

### Step 2: 查询 EOL 数据库

**内置 EOL 数据库**（基于 endoflife.date 数据）：

```bash
# 创建 EOL 数据库（简化版）
declare -A eol_data

# Java EOL
eol_data["java:6"]="2018-12-31:high"
eol_data["java:7"]="2022-07-19:high"
eol_data["java:8"]="2030-12-31:low"
eol_data["java:11"]="2026-09-30:low"
eol_data["java:17"]="2029-09-30:low"

# Spring Framework EOL
eol_data["spring:3.x"]="2016-12-31:high"
eol_data["spring:4.3"]="2020-12-31:high"
eol_data["spring:5.3"]="2024-08-31:medium"
eol_data["spring:6.0"]="2025-08-31:low"

# Spring Boot EOL
eol_data["spring-boot:1.x"]="2019-08-01:high"
eol_data["spring-boot:2.0"]="2019-03-01:high"
eol_data["spring-boot:2.7"]="2025-08-24:medium"
eol_data["spring-boot:3.0"]="2023-11-24:high"
eol_data["spring-boot:3.2"]="2025-08-24:low"

# Node.js EOL
eol_data["node:12"]="2022-04-30:high"
eol_data["node:14"]="2023-04-30:high"
eol_data["node:16"]="2023-09-11:high"
eol_data["node:18"]="2025-04-30:medium"
eol_data["node:20"]="2026-04-30:low"

# React EOL（非官方 EOL，基于社区支持）
eol_data["react:16"]="2022-03-29:medium"
eol_data["react:17"]="2024-03-22:medium"
eol_data["react:18"]="2027-03-31:low"

# MySQL EOL
eol_data["mysql:5.5"]="2018-12-31:high"
eol_data["mysql:5.6"]="2021-02-28:high"
eol_data["mysql:5.7"]="2023-10-31:high"
eol_data["mysql:8.0"]="2026-04-30:low"

# 查询函数
check_eol() {
  local component=$1
  local version=$2
  local key="${component}:${version}"

  if [ -n "${eol_data[$key]}" ]; then
    echo "${eol_data[$key]}"
  else
    echo "unknown:unknown"
  fi
}
```

### Step 3: 分析 EOL 状态

```bash
# 分析语言
language_key="${language,,}:${language_version}"
language_eol=$(check_eol "${language,,}" "${language_version}")
language_eol_date=$(echo "$language_eol" | cut -d':' -f1)
language_urgency=$(echo "$language_eol" | cut -d':' -f2)

# 分析框架
declare -a eol_results

while IFS= read -r framework; do
  name=$(echo "$framework" | cut -d':' -f1 | tr '[:upper:]' '[:lower:]')
  version=$(echo "$framework" | cut -d':' -f2)

  # 简化版本号（4.3.25 → 4.3）
  major_minor=$(echo "$version" | cut -d'.' -f1-2)

  eol_info=$(check_eol "$name" "$major_minor")
  eol_date=$(echo "$eol_info" | cut -d':' -f1)
  urgency=$(echo "$eol_info" | cut -d':' -f2)

  # 计算距离 EOL 天数
  if [ "$eol_date" != "unknown" ]; then
    today=$(date +%s)
    eol_timestamp=$(date -d "$eol_date" +%s 2>/dev/null || echo "0")
    days_left=$(( (eol_timestamp - today) / 86400 ))
  else
    days_left="N/A"
  fi

  eol_results+=("${name}:${version}:${eol_date}:${urgency}:${days_left}")
done <<< "$backend_frameworks"
```

### Step 4: 生成 EOL 报告

```bash
# 创建审计目录
mkdir -p .claude/migration/audit

# 生成报告
cat > .claude/migration/audit/eol-report.md <<EOF
# EOL 状态检查报告

> 检查时间: $(date '+%Y-%m-%d %H:%M:%S')
> 数据来源: endoflife.date

## 总体风险评估

${risk_summary}

## 语言 EOL 状态

### ${language} ${language_version}

| 项目       | 值                 |
| ---------- | ------------------ |
| EOL 日期   | ${language_eol_date} |
| 剩余天数   | ${days_left} 天    |
| 紧急度     | ${language_urgency} |
| 建议升级到 | ${recommended_version} |

## 框架 EOL 状态

### 后端框架

${backend_eol_table}

### 前端框架

${frontend_eol_table}

## 高风险组件（立即升级）

${high_risk_components}

## 中风险组件（计划升级）

${medium_risk_components}

## 升级优先级建议

### P0（1 周内）

${p0_upgrades}

### P1（1 个月内）

${p1_upgrades}

### P2（季度内）

${p2_upgrades}

## 升级路径

${upgrade_paths}

---

**报告版本**: 1.0
**下次检查**: 季度检查（每 3 个月）
**参考**: https://endoflife.date
EOF

echo "✅ EOL 检查报告已生成: .claude/migration/audit/eol-report.md"
```

## Java 项目输出示例（精简版）

```markdown
# EOL 状态检查报告

> 检查时间: 2026-01-13 14:30:00

## 总体风险评估

⚠️ **高风险**: 3 个组件已 EOL，需立即升级
⚠️ **中风险**: 2 个组件即将 EOL（<6 个月）
✅ **低风险**: 1 个组件支持期充足

## 语言 EOL 状态

### Java 8

| 项目       | 值             |
| ---------- | -------------- |
| EOL 日期   | 2030-12-31     |
| 剩余天数   | 1813 天        |
| 紧急度     | 低             |
| 建议升级到 | Java 17（LTS） |

## 框架 EOL 状态

### 后端框架

| 框架             | 版本   | EOL 日期   | 剩余天数 | 紧急度 | 状态      |
| ---------------- | ------ | ---------- | -------- | ------ | --------- |
| Spring Framework | 4.3.25 | 2020-12-31 | -1840    | 高     | ⚠️ 已 EOL |
| Hibernate        | 5.2.17 | 2021-06-30 | -1658    | 高     | ⚠️ 已 EOL |
| MySQL Connector  | 5.1.47 | 2018-12-31 | -2571    | 高     | ⚠️ 已 EOL |
| Spring Boot      | -      | -          | -        | -      | 未使用    |

## 高风险组件（立即升级）

### Spring Framework 4.3.25 ⚠️ 已 EOL 1840 天

- **当前版本**: 4.3.25
- **EOL 日期**: 2020-12-31
- **风险**: 无安全补丁，已知漏洞累积
- **建议**: Spring 4.3 → Spring Boot 2.7（过渡版本） → Spring Boot 3.2
- **工时预估**: 160 人时（2-3 个月）
- **参考**: [Spring EOL 政策](https://spring.io/projects/spring-framework#support)

### Hibernate 5.2.17 ⚠️ 已 EOL 1658 天

- **当前版本**: 5.2.17
- **EOL 日期**: 2021-06-30
- **建议**: Hibernate 5.2 → 5.6 → 6.2
- **工时预估**: 40 人时（2-4 周）

## 升级优先级建议

### P0（1 周内）

1. **MySQL Connector 5.1.47 → 8.0.33**
   - 原因: EOL + 性能提升
   - 风险: 低（向下兼容）
   - 工时: 3 人时

### P1（1 个月内）

1. **Spring 4.3 → Spring Boot 2.7**
   - 原因: EOL + 安全漏洞
   - 风险: 中（需要重构配置）
   - 工时: 160 人时

### P2（季度内）

1. **Java 8 → Java 17**
   - 原因: 预备 Spring Boot 3
   - 风险: 中（语法兼容性）
   - 工时: 80 人时

## 升级路径

### 路径 1：渐进式升级（推荐）
```

阶段 1: MySQL Connector 5.1 → 8.0（1 周）
阶段 2: Hibernate 5.2 → 5.6（2 周）
阶段 3: Spring 4.3 → Boot 2.7（2 个月）
阶段 4: Java 8 → Java 11（1 个月）
阶段 5: Boot 2.7 → Boot 3.2 + Java 11 → 17（2 个月）

```

**优势**: 风险分散，每个阶段独立验证
**劣势**: 总工期长（6-7 个月）

### 路径 2：激进式升级

```

阶段 1: 同时升级 Spring Boot 3.2 + Java 17 + Hibernate 6.2（3 个月）
阶段 2: 验证和修复（1 个月）

```

**优势**: 总工期短（4 个月）
**劣势**: 风险集中，回滚困难
```

## Node.js 项目输出示例

```markdown
# EOL 状态检查报告

## 语言 EOL 状态

### Node.js 16.14.0

| 项目       | 值                |
| ---------- | ----------------- |
| EOL 日期   | 2023-09-11        |
| 剩余天数   | -854 天 ⚠️ 已 EOL |
| 紧急度     | 高                |
| 建议升级到 | Node.js 20（LTS） |

## 框架 EOL 状态

### 后端框架

| 框架    | 版本   | EOL 日期 | 紧急度 | 状态        |
| ------- | ------ | -------- | ------ | ----------- |
| Express | 4.18.2 | -        | 低     | ✅ 活跃维护 |

### 前端框架

| 框架  | 版本   | EOL 日期   | 剩余天数 | 紧急度 | 状态      |
| ----- | ------ | ---------- | -------- | ------ | --------- |
| React | 17.0.2 | 2024-03-22 | -296     | 中     | ⚠️ 已 EOL |

## 高风险组件

### Node.js 16 ⚠️ 已 EOL 854 天

- **建议**: Node.js 16 → Node.js 20（LTS，EOL: 2026-04-30）
- **工时**: 8 人时（1 周）
```

## Gate 检查

- [x] 语言 EOL 状态已检查
- [x] 所有框架 EOL 状态已检查
- [x] 剩余天数计算正确
- [x] 紧急度评估合理（高/中/低）
- [x] 升级路径分渐进式和激进式
- [x] 工时预估基于实际经验

**失败处理**: 如果 EOL 数据库未覆盖某个组件，标记为 "unknown" 并建议手动查询 endoflife.date

## 返回值

```json
{
  "status": "success",
  "eol_report": ".claude/migration/audit/eol-report.md",
  "summary": {
    "high_risk_count": 3,
    "medium_risk_count": 2,
    "low_risk_count": 1,
    "primary_recommendation": "立即升级 Spring 4.3 和 Hibernate 5.2"
  }
}
```

## EOL 数据库更新

**内置数据**:

- Java: 6, 7, 8, 11, 17
- Spring Framework: 3.x, 4.3, 5.3, 6.0
- Spring Boot: 1.x, 2.0, 2.7, 3.0, 3.2
- Node.js: 12, 14, 16, 18, 20
- React: 16, 17, 18
- MySQL: 5.5, 5.6, 5.7, 8.0

**扩展方法**:

```bash
# 可通过资源库扩展
.claude/migration/resources/eol-database.json
```

## 紧急度评级标准

| 紧急度 | 条件              | 建议行动时间 |
| ------ | ----------------- | ------------ |
| 高     | 已 EOL 或 <3 个月 | 1 周内       |
| 中     | 3-6 个月 EOL      | 1 个月内     |
| 低     | >6 个月 EOL       | 季度内       |
