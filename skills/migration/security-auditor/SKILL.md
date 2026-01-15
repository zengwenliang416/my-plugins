---
name: security-auditor
description: |
  【触发条件】扫描代码安全漏洞时使用（必须调用 Codex）
  【核心产出】${run_dir}/audit/security-report.md
  【不触发】单个漏洞查询、依赖漏洞检查（用 dependency-mapper）
allowed-tools: Task, Read, Write, Bash
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
---

# Security Auditor - 安全审计器

## 职责边界

- **输入**: `.claude/migration/context/tech-stack.json` + 项目根路径
- **输出**: `.claude/migration/audit/security-report.md`
- **核心能力**: OWASP Top 10 检测、CVE 关联、CVSS 评分、合规性检查（委托 Codex）

## 执行流程

### Step 1: 准备安全扫描上下文

```bash
# 读取技术栈信息
tech_stack=$(cat .claude/migration/context/tech-stack.json)
language=$(jq -r '.language' <<< "$tech_stack")
version=$(jq -r '.version' <<< "$tech_stack")

# 提取框架信息
backend_frameworks=$(jq -r '.frameworks.backend[].name' <<< "$tech_stack" | paste -sd ',' -)
frontend_frameworks=$(jq -r '.frameworks.frontend[].name' <<< "$tech_stack" | paste -sd ',' -)

# 读取依赖漏洞信息（如果存在）
if [ -f .claude/migration/analysis/dependency-map.md ]; then
  dependency_cves=$(grep -oE "CVE-[0-9]{4}-[0-9]+" .claude/migration/analysis/dependency-map.md | sort -u | paste -sd ',' -)
else
  dependency_cves="未检测"
fi

project_root=$(pwd)
```

### Step 2: 调用 Codex 进行安全扫描

**强制使用 codex-cli**（后台执行）：

```bash
# 构造扫描提示词
scan_prompt=$(cat <<EOF
【任务】：扫描 ${language} 项目的安全漏洞，重点关注 OWASP Top 10

【上下文】：
- 语言: ${language} ${version}
- 后端框架: ${backend_frameworks}
- 前端框架: ${frontend_frameworks}
- 项目路径: ${project_root}
- 已知依赖 CVE: ${dependency_cves}

【扫描维度】：

## 1. OWASP Top 10 (2021)

### A01: Broken Access Control
- **检测**：
  - 未经授权访问敏感操作
  - 缺失权限验证
  - IDOR（不安全的直接对象引用）
- **示例**（Java）：
  \`\`\`java
  // ❌ 漏洞：未验证用户是否有权限访问该订单
  @GetMapping("/order/{id}")
  public Order getOrder(@PathVariable Long id) {
      return orderService.findById(id);
  }
  \`\`\`

### A02: Cryptographic Failures
- **检测**：
  - 明文存储敏感数据（密码、API Key）
  - 弱加密算法（MD5, SHA-1, DES）
  - 硬编码密钥

### A03: Injection
- **检测**：
  - SQL 注入（String 拼接）
  - NoSQL 注入
  - OS 命令注入
  - LDAP 注入
  - XPath 注入
- **示例**（Java）：
  \`\`\`java
  // ❌ SQL 注入
  String sql = "SELECT * FROM users WHERE username = '" + username + "'";
  \`\`\`

### A04: Insecure Design
- **检测**：
  - 缺失速率限制
  - 未限制资源消耗
  - 缺失业务逻辑验证

### A05: Security Misconfiguration
- **检测**：
  - 默认账户/密码
  - 详细错误信息泄露
  - 不必要的功能启用
  - 缺失 CORS 配置

### A06: Vulnerable and Outdated Components
- **检测**：
  - 关联依赖 CVE（来自 dependency-mapper）
  - 使用已知漏洞版本

### A07: Identification and Authentication Failures
- **检测**：
  - 弱密码策略
  - 缺失 MFA
  - Session 固定攻击
  - 明文传输凭证

### A08: Software and Data Integrity Failures
- **检测**：
  - 反序列化漏洞
  - 未验证的输入
  - CI/CD 缺失签名验证

### A09: Security Logging and Monitoring Failures
- **检测**：
  - 敏感操作未记录日志
  - 日志包含敏感信息（密码、令牌）
  - 缺失异常监控

### A10: Server-Side Request Forgery (SSRF)
- **检测**：
  - 未验证的 URL 输入
  - 内网地址访问

## 2. 框架特定漏洞

**Java/Spring**：
- Spring4Shell（CVE-2022-22965）
- Spring Security 配置错误
- @PreAuthorize 缺失

**JavaScript/Node.js**：
- Prototype Pollution
- XSS（dangerouslySetInnerHTML, innerHTML）
- CSRF Token 缺失

**Python/Django**：
- Django ORM SQL 注入（raw queries）
- SSTI（Server-Side Template Injection）
- Pickle 反序列化

## 3. 敏感信息泄露

- 硬编码密码/API Key
- Git 提交历史包含密钥
- 配置文件明文存储
- 日志输出敏感数据

## 4. 合规性检查

- **GDPR**: 个人数据处理、删除机制
- **PCI-DSS**: 信用卡数据处理
- **HIPAA**: 医疗数据保护（如适用）

【输出格式】：
Markdown 文档，包含：
1. 安全概览（总漏洞数、CVSS 分布）
2. OWASP Top 10 检测结果（**必须附带** 文件路径:行号）
3. 严重漏洞列表（CVSS ≥7.0）
4. 中等漏洞列表（CVSS 4.0-6.9）
5. CVE 关联（与依赖漏洞关联）
6. 修复优先级建议（分阶段）
7. 合规性评估

【要求】：
- 所有漏洞必须附带具体位置
- CVSS 评分基于 CVSS v3.1 标准
- 修复建议包含代码示例
- 优先级考虑业务影响
EOF
)

# 调用 Codex（后台执行）
Task(
  skill: "codex-cli",
  description: "Security vulnerability scanning",
  run_in_background: true,
  prompt: "$scan_prompt"
)

# 保存任务 ID
task_id=$!
echo "$task_id" > .claude/migration/tmp/security-audit-task-id.txt
```

### Step 3: 等待 Codex 完成并获取结果

```bash
# 读取任务 ID
task_id=$(cat .claude/migration/tmp/security-audit-task-id.txt)

# 等待任务完成（阻塞，失败时重试）
max_retries=3
retry_count=0

while [ $retry_count -lt $max_retries ]; do
  codex_output=$(TaskOutput(task_id: "$task_id", block: true, timeout: 600000))

  if [ -n "$codex_output" ]; then
    break
  fi

  retry_count=$((retry_count + 1))
  echo "⚠️ 第 $retry_count 次重试 Codex 安全扫描..."
  sleep 10
done

# 重试失败后终止
if [ -z "$codex_output" ]; then
  echo "❌ 重试 $max_retries 次后仍失败，终止扫描"
  exit 1
fi

# 保存原始输出
mkdir -p .claude/migration/audit/raw
echo "$codex_output" > .claude/migration/audit/raw/security-audit-codex.md
```

### Step 4: Claude 重构和补充

```bash
# Claude 负责：
# 1. 验证文件路径和行号的准确性
# 2. 关联依赖 CVE（与 dependency-mapper 结果对比）
# 3. 统一 CVSS 评分标准
# 4. 补充修复代码示例
# 5. 生成可执行的修复路线图

# 提取关键指标
critical_vulns=$(echo "$codex_output" | grep -c "CVSS.*[89]\\.[0-9]")
high_vulns=$(echo "$codex_output" | grep -c "CVSS.*7\\.[0-9]")
medium_vulns=$(echo "$codex_output" | grep -c "CVSS.*[456]\\.[0-9]")

# 验证
if [ "$critical_vulns" -eq 0 ] && [ "$high_vulns" -eq 0 ]; then
  echo "✅ 未检测到严重或高危漏洞"
fi
```

### Step 5: 生成最终安全报告

```bash
# 创建审计目录
mkdir -p .claude/migration/audit

# 写入最终报告
cat > .claude/migration/audit/security-report.md <<EOF
# 安全审计报告

> 扫描对象: ${project_name} (${language} ${version})
> 扫描时间: $(date '+%Y-%m-%d %H:%M:%S')
> 扫描工具: Codex + OWASP ZAP 概念
> 标准: OWASP Top 10 (2021) + CVSS v3.1

## 安全概览

### 漏洞统计

| 严重程度 | 数量 | CVSS 范围 | 优先级 |
| -------- | ---- | --------- | ------ |
| 严重     | ${c} | 9.0-10.0  | P0     |
| 高危     | ${h} | 7.0-8.9   | P1     |
| 中危     | ${m} | 4.0-6.9   | P2     |
| 低危     | ${l} | 0.1-3.9   | P3     |
| **合计** | ${t} | -         | -      |

### OWASP Top 10 分布

${owasp_distribution_chart}

## 严重漏洞（CVSS ≥9.0）

${critical_vulnerabilities}

## 高危漏洞（CVSS 7.0-8.9）

${high_vulnerabilities}

## 中等漏洞（CVSS 4.0-6.9）

${medium_vulnerabilities}

## CVE 关联分析

### 依赖漏洞关联

${dependency_cve_correlation}

### 框架漏洞

${framework_vulnerabilities}

## 修复优先级建议

### P0（立即修复，1 周内）

${p0_fixes}

### P1（高优先级，1 个月内）

${p1_fixes}

### P2（中优先级，季度内）

${p2_fixes}

## 合规性评估

### GDPR 合规性

${gdpr_compliance}

### PCI-DSS 合规性（如适用）

${pci_compliance}

## 安全加固建议

### 代码层面

${code_hardening}

### 配置层面

${config_hardening}

### 基础设施层面

${infra_hardening}

---

**报告版本**: 1.0
**数据来源**: Codex 深度分析 + OWASP 标准
**下次扫描**: 季度扫描（每 3 个月）或重大变更后
**参考**: https://owasp.org/Top10/
EOF

echo "✅ 安全审计报告已生成: .claude/migration/audit/security-report.md"
```

## Java 项目输出示例（精简版）

````markdown
# 安全审计报告

> 扫描对象: Legacy ERP System (Java 8 + Spring 4.3)

## 安全概览

| 严重程度 | 数量 | CVSS 范围 | 优先级 |
| -------- | ---- | --------- | ------ |
| 严重     | 2    | 9.0-10.0  | P0     |
| 高危     | 5    | 7.0-8.9   | P1     |
| 中危     | 12   | 4.0-6.9   | P2     |
| **合计** | 19   | -         | -      |

## 严重漏洞（CVSS ≥9.0）

### V-001: SQL 注入（A03:2021-Injection）

- **文件**: `com.example.erp.dao.UserDao:89`
- **CVSS**: 9.8（严重）
- **代码**:
  ```java
  String sql = "SELECT * FROM users WHERE username = '" + username + "'";
  Statement stmt = conn.createStatement();
  ResultSet rs = stmt.executeQuery(sql);
  ```
````

- **影响**: 攻击者可读取/篡改/删除数据库
- **修复**:
  ```java
  String sql = "SELECT * FROM users WHERE username = ?";
  PreparedStatement pstmt = conn.prepareStatement(sql);
  pstmt.setString(1, username);
  ResultSet rs = pstmt.executeQuery();
  ```
- **优先级**: P0（1 周内）

### V-002: 反序列化漏洞（A08:2021-Software and Data Integrity Failures）

- **文件**: `com.example.erp.util.SerializationUtil:45`
- **CVSS**: 9.0（严重）
- **代码**:
  ```java
  ObjectInputStream ois = new ObjectInputStream(new FileInputStream(file));
  Object obj = ois.readObject(); // 未验证
  ```
- **影响**: 远程代码执行（RCE）
- **修复**: 使用白名单验证 + JSON 替代
- **优先级**: P0（1 周内）

## 高危漏洞（CVSS 7.0-8.9）

### V-003: 访问控制缺失（A01:2021-Broken Access Control）

- **文件**: `com.example.erp.controller.OrderController:67`
- **CVSS**: 8.6（高危）
- **代码**:
  ```java
  @GetMapping("/order/{id}")
  public Order getOrder(@PathVariable Long id) {
      return orderService.findById(id); // 未验证用户权限
  }
  ```
- **影响**: 用户可访问他人订单（IDOR）
- **修复**:
  ```java
  @GetMapping("/order/{id}")
  @PreAuthorize("@orderSecurity.canAccess(#id)")
  public Order getOrder(@PathVariable Long id) {
      return orderService.findById(id);
  }
  ```

## CVE 关联分析

### 依赖漏洞关联

| CVE 编号         | 组件               | CVSS | 状态   | 关联漏洞 |
| ---------------- | ------------------ | ---- | ------ | -------- |
| CVE-2016-1000031 | commons-fileupload | 9.8  | 已修复 | V-004    |
| CVE-2020-5421    | spring-webmvc      | 8.6  | 已修复 | V-005    |

**注**: 详细依赖漏洞见 `.claude/migration/analysis/dependency-map.md`

## 修复优先级建议

### P0（立即修复，1 周内）

1. **V-001: SQL 注入（5 处）**
   - 工时: 8 人时
   - 风险: 数据泄露
   - 修复: 全部改用 PreparedStatement

2. **V-002: 反序列化漏洞**
   - 工时: 4 人时
   - 风险: RCE
   - 修复: 改用 JSON + 白名单验证

### P1（高优先级，1 个月内）

1. **V-003: 访问控制缺失（12 处）**
   - 工时: 16 人时
   - 风险: 数据越权访问
   - 修复: 添加 @PreAuthorize 注解

## 合规性评估

### GDPR 合规性

| 要求         | 状态 | 问题                       |
| ------------ | ---- | -------------------------- |
| 数据加密存储 | ❌   | 用户密码使用 MD5（弱算法） |
| 删除机制     | ⚠️   | 缺失"被遗忘权"接口         |
| 数据最小化   | ✅   | 符合                       |

**建议**: 升级到 bcrypt/Argon2 + 实现数据删除 API

## 安全加固建议

### 代码层面

1. **输入验证**: 所有用户输入必须验证（白名单）
2. **输出编码**: HTML/SQL/JS 上下文分别编码
3. **参数化查询**: 禁止 String 拼接 SQL

### 配置层面

1. **Spring Security 升级**: 4.x → 5.x（启用 CSRF）
2. **HTTPS 强制**: 配置 HSTS
3. **敏感配置外部化**: 密钥移至环境变量

````

## Node.js 项目输出示例

```markdown
# 安全审计报告

> 扫描对象: Admin Dashboard (Node.js 16 + Express 4)

## 严重漏洞

### V-001: XSS 漏洞（A03:2021-Injection）

- **文件**: `src/views/user-profile.ejs:23`
- **CVSS**: 7.4（高危）
- **代码**:
  ```html
  <div>Welcome, <%= username %></div>
````

- **影响**: 攻击者可注入脚本
- **修复**:
  ```html
  <div>Welcome, <%- escapeHtml(username) %></div>
  ```

### V-002: Prototype Pollution

- **文件**: `src/utils/merge.js:15`
- **CVSS**: 8.1（高危）
- **代码**:
  ```javascript
  function merge(target, source) {
    for (let key in source) {
      target[key] = source[key]; // 危险
    }
  }
  ```
- **影响**: 对象原型污染 → 权限提升
- **修复**: 使用 `Object.assign()` 或检查 `hasOwnProperty`

````

## Gate 检查

- [x] Codex 已成功返回安全扫描结果
- [x] 所有漏洞包含 `文件路径:行号`
- [x] CVSS 评分基于 CVSS v3.1 标准
- [x] 关联了 dependency-mapper 的 CVE
- [x] 修复建议分优先级（P0/P1/P2/P3）
- [x] 修复建议包含代码示例
- [x] 合规性评估完整

**失败处理**: 如果 Codex 超时或失败，自动重试最多 3 次（每次间隔 10 秒），全部失败后终止扫描

## 返回值

```json
{
  "status": "success",
  "security_report": ".claude/migration/audit/security-report.md",
  "summary": {
    "critical_count": 2,
    "high_count": 5,
    "medium_count": 12,
    "low_count": 8,
    "primary_recommendation": "立即修复 SQL 注入和反序列化漏洞"
  },
  "codex_session_id": "saved_in_state_file"
}
````

## CVSS v3.1 评分参考

| 评分     | 严重程度 | 优先级 | 修复时间 |
| -------- | -------- | ------ | -------- |
| 9.0-10.0 | 严重     | P0     | 1 周内   |
| 7.0-8.9  | 高危     | P1     | 1 个月内 |
| 4.0-6.9  | 中危     | P2     | 季度内   |
| 0.1-3.9  | 低危     | P3     | 年度内   |

## 多语言支持

| 语言       | 检测重点                       | 检测工具                     |
| ---------- | ------------------------------ | ---------------------------- |
| Java       | SQL 注入、反序列化、Spring配置 | SpotBugs, Find Security Bugs |
| JavaScript | XSS、Prototype Pollution、CSRF | ESLint Security, Snyk        |
| Python     | SQL 注入、SSTI、Pickle反序列化 | Bandit, Safety               |
| Go         | SQL 注入、竞态条件、不安全反射 | gosec, govulncheck           |

## 并行执行支持

```bash
# 在 Phase 4 中与 eol-checker、tech-debt-scanner 并行执行
Task(skill="eol-checker", run_in_background=true)
Task(skill="tech-debt-scanner", run_in_background=true)
Task(skill="security-auditor", run_in_background=true)

# 等待全部完成
wait_all_tasks()
```
