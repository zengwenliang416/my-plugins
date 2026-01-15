---
name: security-scanner
description: |
  【触发条件】代码审查第一步：扫描安全漏洞。
  【核心产出】输出 ${run_dir}/security-findings.json。
  【不触发】质量检查（用 quality-analyzer）、报告生成（用 report-generator）。
allowed-tools: Read, Grep, Glob, Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
---

# Security Scanner - 安全扫描原子技能

## 职责边界

- **输入**: `${run_dir}/target.txt` 或代码路径
- **输出**: `${run_dir}/security-findings.json`
- **单一职责**: 只做安全扫描，不做质量检查

## 扫描模式

### 1. SQL 注入

```bash
Grep pattern="(query|execute|raw)\s*\(" glob="*.{ts,js,py,go,java}"
```

检查项：

- 字符串拼接构建 SQL
- 未使用参数化查询
- 动态表名/列名未验证

### 2. XSS（跨站脚本）

```bash
Grep pattern="innerHTML|dangerouslySetInnerHTML|v-html" glob="*.{tsx,jsx,vue}"
```

检查项：

- 用户输入未转义
- 直接插入 HTML

### 3. 命令注入

```bash
Grep pattern="exec\(|spawn\(|system\(|eval\(" glob="*.{ts,js,py,sh}"
```

检查项：

- shell=True 使用
- 未验证的用户输入

### 4. 硬编码密钥

```bash
Grep pattern="(password|secret|key|token|api_key)\s*=\s*['\"][^'\"]{8,}['\"]" -i
```

检查项：

- 硬编码密码/密钥
- 敏感配置未使用环境变量

### 5. 认证/授权

检查项：

- 密码哈希算法（bcrypt/argon2）
- Session/Token 安全性
- 权限检查完整性

## 输出格式

```json
{
  "scan_type": "security",
  "target": "扫描路径",
  "timestamp": "ISO时间戳",
  "findings": [
    {
      "id": "SEC-001",
      "severity": "critical | high | medium | low",
      "category": "SQL_INJECTION | XSS | CMD_INJECTION | HARDCODED_SECRET | AUTH",
      "location": "file.ts:42",
      "description": "问题描述",
      "evidence": "相关代码片段",
      "recommendation": "修复建议"
    }
  ],
  "summary": {
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0,
    "total": 0
  }
}
```

## 严重程度定义

| 级别     | 触发条件         | 示例                 |
| -------- | ---------------- | -------------------- |
| critical | 可直接利用的漏洞 | SQL 注入、RCE        |
| high     | 需条件利用的漏洞 | XSS、CSRF            |
| medium   | 间接安全风险     | 硬编码密钥、弱加密   |
| low      | 安全建议         | 缺少 HTTPS、日志泄露 |

## 忽略规则

跳过以下目录：

- `node_modules/`, `vendor/`
- `dist/`, `build/`, `out/`
- `*.min.js`, `*.bundle.js`
- `*.test.ts`, `*.spec.js`

## 返回值

```
安全扫描完成。
输出文件: ${run_dir}/security-findings.json

发现问题:
- Critical: X
- High: X
- Medium: X
- Low: X

下一步: 使用 /reviewing:quality-analyzer 进行质量检查
```

## 约束

- 不做质量检查（交给 quality-analyzer）
- 不生成报告（交给 report-generator）
- 输出文件路径固定，便于下游技能读取
