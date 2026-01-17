# Audit Checklist Reference

代码审计检查清单：安全、性能、可维护性。

---

## 1. 安全审计

### 1.1 OWASP Top 10

| 漏洞 | 检查项 | 严重性 |
|------|--------|--------|
| 注入攻击 | SQL/命令注入、XSS | 🔴 Critical |
| 身份认证 | 弱密码、会话管理 | 🔴 Critical |
| 敏感数据泄露 | 明文存储、日志泄露 | 🔴 Critical |
| XXE | XML 外部实体 | 🟠 High |
| 访问控制 | 越权访问 | 🔴 Critical |
| 安全配置 | 默认配置、错误信息 | 🟠 High |
| XSS | 反射型、存储型 | 🟠 High |
| 不安全反序列化 | 对象注入 | 🟠 High |
| 组件漏洞 | 过时依赖 | 🟡 Medium |
| 日志监控 | 审计日志不足 | 🟡 Medium |

### 1.2 安全代码模式

**SQL 注入防护:**
```typescript
// ❌ 危险
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ 安全
const query = 'SELECT * FROM users WHERE id = ?';
db.query(query, [userId]);
```

**XSS 防护:**
```typescript
// ❌ 危险
element.innerHTML = userInput;

// ✅ 安全
element.textContent = userInput;
// 或使用 DOMPurify
element.innerHTML = DOMPurify.sanitize(userInput);
```

**命令注入防护:**
```typescript
// ❌ 危险
exec(`ls ${userInput}`);

// ✅ 安全
execFile('ls', [userInput]);
```

### 1.3 敏感数据检查

| 数据类型 | 检查项 |
|----------|--------|
| 密码 | 不应明文存储/日志 |
| API Keys | 不应硬编码 |
| Token | 应有过期机制 |
| PII | 应加密存储 |

---

## 2. 性能审计

### 2.1 性能问题清单

| 问题 | 表现 | 严重性 |
|------|------|--------|
| N+1 查询 | 循环中数据库查询 | 🟠 High |
| 内存泄漏 | 未清理资源 | 🟠 High |
| 同步阻塞 | 阻塞主线程 | 🟠 High |
| 大数组操作 | 无分页/虚拟化 | 🟡 Medium |
| 重复计算 | 无缓存/memo | 🟡 Medium |
| Bundle 过大 | 未 tree-shaking | 🟡 Medium |

### 2.2 性能代码模式

**N+1 查询:**
```typescript
// ❌ N+1 问题
const users = await db.users.findAll();
for (const user of users) {
  user.posts = await db.posts.findByUserId(user.id);
}

// ✅ 批量查询
const users = await db.users.findAll({
  include: [{ model: Post }]
});
```

**内存泄漏:**
```typescript
// ❌ 未清理
useEffect(() => {
  const subscription = api.subscribe(handler);
}, []);

// ✅ 清理订阅
useEffect(() => {
  const subscription = api.subscribe(handler);
  return () => subscription.unsubscribe();
}, []);
```

**缓存使用:**
```typescript
// ❌ 重复计算
function Component({ items }) {
  const total = items.reduce((sum, i) => sum + i.price, 0);
}

// ✅ 使用 memo
function Component({ items }) {
  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.price, 0),
    [items]
  );
}
```

---

## 3. 可维护性审计

### 3.1 代码质量指标

| 指标 | 阈值 | 说明 |
|------|------|------|
| 函数长度 | ≤20 行 | 过长需拆分 |
| 函数参数 | ≤3 个 | 过多需封装 |
| 嵌套深度 | ≤3 层 | 过深需重构 |
| 圈复杂度 | ≤10 | 过高需简化 |
| 重复代码 | 0% | 应提取公共代码 |

### 3.2 代码风格

| 检查项 | 规则 |
|--------|------|
| 命名规范 | camelCase/PascalCase |
| 类型注解 | 完整的 TypeScript 类型 |
| 注释质量 | 解释"为什么"而非"是什么" |
| 错误处理 | 明确的错误边界 |
| 导入顺序 | 外部 → 内部 → 相对路径 |

### 3.3 架构检查

| 检查项 | 说明 |
|--------|------|
| 单一职责 | 每个模块只做一件事 |
| 依赖方向 | 高层不依赖低层实现 |
| 接口隔离 | 不强迫依赖不需要的方法 |
| 循环依赖 | 不应有循环导入 |

---

## 4. 审计 Prompt 模板

### 4.1 Codex 安全审计

```
你是一位资深安全工程师。审计以下代码变更的安全性。

## 代码变更

${changes.md}

## 审计要求

1. **漏洞扫描**
   - 检查 OWASP Top 10
   - 识别注入风险
   - 检查认证授权

2. **敏感数据**
   - 检查硬编码密钥
   - 检查日志泄露
   - 检查数据加密

3. **修复建议**
   - 提供具体修复代码
   - 说明风险等级

输出格式：Markdown
```

### 4.2 Gemini 性能审计

```
你是一位前端性能专家。审计以下代码变更的性能影响。

## 代码变更

${changes.md}

## 审计要求

1. **渲染性能**
   - 检查不必要的重渲染
   - 检查大列表处理

2. **资源加载**
   - 检查 bundle 大小影响
   - 检查懒加载机会

3. **优化建议**
   - 提供具体优化代码
   - 预估性能提升

输出格式：Markdown
```

---

## 5. 审计报告模板

### 5.1 audit-{model}.md 结构

```markdown
---
model: codex | gemini
audited_at: 2026-01-17T12:00:00Z
focus: security | performance | ux
severity_summary:
  critical: 0
  high: 1
  medium: 2
  low: 3
---

# 代码审计报告

## 审计摘要

**审计范围**: [文件列表]
**审计重点**: [安全/性能/UX]
**总体评分**: [A-F]

## 发现的问题

### 🔴 Critical (0)

无

### 🟠 High (1)

#### [问题标题]

**位置**: `file:line`
**描述**: [问题描述]
**风险**: [风险说明]
**修复建议**:

\`\`\`typescript
// 修复代码
\`\`\`

### 🟡 Medium (2)

...

### 🟢 Low (3)

...

## 优秀实践

[代码中做得好的地方]

## 改进建议

[综合改进建议]

## 验证清单

- [ ] 问题 1 已修复
- [ ] 问题 2 已修复
- [ ] 重新审计通过
```

---

## 6. 自动化检查

### 6.1 静态分析工具

| 工具 | 用途 | 命令 |
|------|------|------|
| ESLint | JS/TS lint | `npx eslint .` |
| TypeScript | 类型检查 | `npx tsc --noEmit` |
| npm audit | 依赖漏洞 | `npm audit` |
| Snyk | 安全扫描 | `snyk test` |

### 6.2 集成脚本

```bash
#!/bin/bash
# audit-check.sh

echo "Running TypeScript check..."
npx tsc --noEmit

echo "Running ESLint..."
npx eslint --ext .ts,.tsx src/

echo "Running npm audit..."
npm audit --audit-level=high

echo "Done."
```

---

## 7. 审计工作流

```
1. 收集变更文件
   ↓
2. 运行静态分析
   ↓
3. 调用外部模型审计
   ↓
4. 汇总审计结果
   ↓
5. 生成修复建议
   ↓
6. 验证修复效果
```
