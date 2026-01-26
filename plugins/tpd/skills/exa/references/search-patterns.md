# Exa Search Patterns Reference

Exa AI 搜索模式和查询优化指南。

---

## 1. 搜索模式

### 1.1 基础搜索

```bash
# 关键词搜索
exa search "React hooks best practices"

# 带过滤的搜索
exa search "TypeScript generics" --num-results 10
```

### 1.2 高级搜索

```bash
# 限定域名
exa search "useEffect cleanup" site:react.dev

# 限定时间
exa search "Next.js 14 features" --start-date 2024-01-01

# 组合过滤
exa search "authentication JWT" site:auth0.com OR site:okta.com
```

---

## 2. 查询模板

### 2.1 API 文档查询

```
[库名] [方法名] api reference site:[官方文档域名]
```

**示例**:
- `React useState api reference site:react.dev`
- `Express middleware api site:expressjs.com`
- `Prisma findMany api site:prisma.io`

### 2.2 最佳实践查询

```
[技术] best practices [年份] site:[权威来源]
```

**示例**:
- `React performance best practices 2026 site:react.dev`
- `TypeScript error handling best practices`
- `Node.js security best practices site:nodejs.org`

### 2.3 错误解决查询

```
"[错误信息]" solution [技术名]
```

**示例**:
- `"Cannot read property of undefined" solution React`
- `"ECONNREFUSED" fix Node.js`
- `"Type 'X' is not assignable" TypeScript`

### 2.4 迁移指南查询

```
[库名] migration guide v[旧版本] to v[新版本]
```

**示例**:
- `React migration guide v17 to v18`
- `Next.js app router migration from pages`
- `Tailwind CSS upgrade guide v3 to v4`

### 2.5 对比查询

```
[技术A] vs [技术B] comparison [年份]
```

**示例**:
- `React vs Vue comparison 2026`
- `REST vs GraphQL pros cons`
- `pnpm vs npm vs yarn comparison`

---

## 3. 来源优先级

### 3.1 权威来源排序

| 优先级 | 来源类型 | 示例域名 |
|--------|----------|----------|
| 1 | 官方文档 | react.dev, nodejs.org |
| 2 | GitHub 仓库 | github.com |
| 3 | 知名博客 | dev.to, medium.com |
| 4 | Stack Overflow | stackoverflow.com |
| 5 | 技术论坛 | reddit.com/r/programming |

### 3.2 域名过滤

**推荐域名**:
```
site:react.dev OR site:nodejs.org OR site:typescriptlang.org
```

**排除域名**:
```
-site:w3schools.com -site:geeksforgeeks.org
```

---

## 4. 搜索优化

### 4.1 精确匹配

```
# 使用引号精确匹配
"exact phrase to match"

# 示例
"useCallback dependency array" React
```

### 4.2 通配符

```
# 使用 * 匹配任意词
"React * component" tutorial

# 示例
"TypeScript * type" inference
```

### 4.3 布尔操作

```
# AND (默认)
React hooks

# OR
React OR Vue hooks

# NOT
React hooks -class
```

---

## 5. 场景化查询

### 5.1 新功能开发

```
目标: 了解如何实现某功能

查询模板:
1. "[功能名] implementation [框架]"
2. "[功能名] tutorial [框架] site:[官方文档]"
3. "[功能名] example code [框架]"

示例:
- "infinite scroll implementation React"
- "authentication implementation Next.js site:nextjs.org"
- "drag and drop example React dnd"
```

### 5.2 Bug 修复

```
目标: 解决特定错误

查询模板:
1. "错误信息" solution
2. "错误信息" [框架] fix
3. "错误信息" site:github.com/[仓库]/issues

示例:
- "Hydration failed" solution Next.js
- "Maximum update depth exceeded" React fix
- "CORS error" site:github.com/axios/axios/issues
```

### 5.3 性能优化

```
目标: 优化应用性能

查询模板:
1. "[框架] performance optimization"
2. "[框架] [问题] performance fix"
3. "[指标] improvement [框架]"

示例:
- "React performance optimization techniques"
- "Next.js slow initial load fix"
- "LCP improvement React"
```

### 5.4 架构设计

```
目标: 了解架构最佳实践

查询模板:
1. "[架构模式] [框架] example"
2. "[应用类型] architecture [框架]"
3. "scalable [应用类型] design patterns"

示例:
- "clean architecture React example"
- "microservices architecture Node.js"
- "scalable SaaS design patterns"
```

---

## 6. 结果处理

### 6.1 结果筛选

| 字段 | 用途 |
|------|------|
| title | 快速判断相关性 |
| url | 验证来源可信度 |
| snippet | 预览内容质量 |
| date | 检查时效性 |

### 6.2 内容提取

```markdown
## 搜索结果

### [标题]

**来源**: [URL]
**日期**: [发布日期]

**关键内容**:
[提取的核心信息]

**代码示例**:
\`\`\`typescript
// 提取的代码
\`\`\`
```

---

## 7. 错误处理

### 7.1 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 无结果 | 查询太具体 | 放宽条件 |
| 结果不相关 | 关键词不准确 | 调整关键词 |
| 结果过时 | 未限制时间 | 添加时间过滤 |
| API 限制 | 请求过频 | 降低频率 |

### 7.2 降级策略

```
Exa 失败 → WebSearch → WebFetch
```

---

## 8. 集成示例

### 8.1 Skill 调用

```bash
# 基础调用
exa search "React 18 new features"

# 带参数调用
exa search "Next.js middleware" --num-results 5 --start-date 2025-01-01
```

### 8.2 输出格式

```json
{
  "results": [
    {
      "title": "React 18 New Features",
      "url": "https://react.dev/blog/react-18",
      "snippet": "React 18 introduces...",
      "published_date": "2025-03-01"
    }
  ],
  "total": 10,
  "query": "React 18 new features"
}
```

---

## 9. 最佳实践

### 9.1 查询建议

- ✅ 使用具体的技术术语
- ✅ 限定官方文档域名
- ✅ 添加时间过滤（近 1-2 年）
- ✅ 优先搜索英文内容
- ❌ 避免过于宽泛的查询
- ❌ 避免使用过多关键词

### 9.2 结果验证

- 检查来源可信度
- 验证内容时效性
- 交叉验证多个来源
- 优先采纳官方文档
