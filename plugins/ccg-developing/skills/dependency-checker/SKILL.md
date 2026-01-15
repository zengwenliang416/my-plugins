---
name: dependency-checker
description: |
  【触发条件】当需要检查依赖更新、安全漏洞、兼容性问题、或分析项目依赖关系时使用。
  【触发关键词】依赖检查、npm audit、安全漏洞、过时依赖、依赖更新、package升级、依赖分析
  【核心能力】扫描依赖 → 识别风险（过时/漏洞/兼容性） → 生成升级建议
  【不触发】普通 npm install、代码逻辑分析、性能分析
  【先问什么】若缺少：项目路径、检查范围（全部/仅生产依赖），先提问补齐
---

# Dependency Checker

项目依赖检查与分析工具。

## 工作流程

```
1. 检测包管理器 → 2. 扫描依赖状态 → 3. 评估风险等级 → 4. 生成升级建议
```

---

## 支持的包管理器

| 管理器 | 配置文件                          | 锁文件            |
| ------ | --------------------------------- | ----------------- |
| npm    | package.json                      | package-lock.json |
| yarn   | package.json                      | yarn.lock         |
| pnpm   | package.json                      | pnpm-lock.yaml    |
| pip    | requirements.txt / pyproject.toml | requirements.lock |
| cargo  | Cargo.toml                        | Cargo.lock        |

---

## 快速检查

```bash
# 一键检查（自动检测包管理器）
./scripts/check-deps.sh /path/to/project

# 仅生产依赖
./scripts/check-deps.sh /path/to/project --production
```

---

## 风险等级定义

| 等级 | 标准                          | 处理优先级 |
| ---- | ----------------------------- | ---------- |
| 严重 | 存在已知漏洞（CVE）且可被利用 | 立即修复   |
| 高   | 主版本落后 2+ 或有安全警告    | 本周内修复 |
| 中   | 次版本落后 3+                 | 近期规划   |
| 低   | 仅补丁版本落后                | 常规更新   |

---

## 升级策略

### 渐进式升级步骤

1. **补丁版本** → `npm update` (最安全)
2. **测试验证** → `npm test`
3. **次版本** → `npm install package@^2.0.0`
4. **主版本** → 仔细评估 Breaking Changes

### 升级前检查清单

- [ ] 阅读 CHANGELOG/Release Notes
- [ ] 检查 Breaking Changes
- [ ] 确认 peer dependencies 兼容
- [ ] 本地测试通过
- [ ] CI/CD 测试通过

---

## 输出格式

```markdown
## 依赖检查报告

### 严重风险 (立即处理)

| 包名   | 当前版本 | 建议版本 | 风险说明       |
| ------ | -------- | -------- | -------------- |
| lodash | 4.17.15  | 4.17.21  | CVE-2021-23337 |

### 升级命令

\`\`\`bash
npm install lodash@4.17.21
\`\`\`
```

---

## 工具脚本

| 脚本                    | 功能         | 用法                                            |
| ----------------------- | ------------ | ----------------------------------------------- |
| `scripts/check-deps.sh` | 一键依赖检查 | `./scripts/check-deps.sh <path> [--production]` |

---

## 参考文档导航

| 需要        | 读取                               |
| ----------- | ---------------------------------- |
| 命令速查    | `references/commands-reference.md` |
| CI 集成示例 | `references/commands-reference.md` |
