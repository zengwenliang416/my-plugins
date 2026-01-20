# Exa Search - Memory Plugin Search Strategies

## 搜索类别

### best-practices (最佳实践)

**用途**: 获取技术栈的生产级最佳实践

**查询模板**:

```
{technology} best practices production {year}
{technology} design patterns enterprise
{technology} performance optimization guide
```

**过滤策略**:

- 优先官方文档
- 高质量技术博客 (Medium Engineering, dev.to verified)
- 知名公司技术博客
- 最近 2 年内容

**示例查询**:

- `TypeScript best practices production 2024`
- `React performance optimization guide`
- `Node.js microservices design patterns`

---

### docs (API 文档)

**用途**: 获取官方 API 文档和参考

**查询模板**:

```
{framework} API documentation official
{library} reference documentation
{tool} configuration guide official
```

**过滤策略**:

- 仅官方域名
- 优先 latest/stable 版本
- 排除社区镜像

**示例查询**:

- `Express.js API documentation official`
- `PostgreSQL reference documentation`
- `Docker configuration guide official`

---

### examples (代码示例)

**用途**: 获取高质量代码示例

**查询模板**:

```
{technology} example implementation github
{pattern} code example {language}
{feature} tutorial with code
```

**过滤策略**:

- GitHub stars > 100
- 最近更新 < 1 年
- 有完整 README
- 有测试覆盖

**示例查询**:

- `React hooks example implementation github`
- `authentication JWT example Node.js`
- `GraphQL resolver tutorial with code`

---

### tutorials (教程)

**用途**: 获取详细教程和指南

**查询模板**:

```
{technology} tutorial step by step
{feature} guide beginner to advanced
how to {task} {technology}
```

**过滤策略**:

- 完整度高的教程
- 有代码示例
- 最近 18 个月

**示例查询**:

- `Kubernetes deployment tutorial step by step`
- `Next.js SSR guide beginner to advanced`
- `how to setup CI/CD GitHub Actions`

---

## 技术栈特定策略

### 前端

```yaml
React:
  docs: "react.dev documentation"
  patterns: "React patterns 2024"
  hooks: "React hooks examples github"

Vue:
  docs: "vuejs.org documentation"
  patterns: "Vue 3 composition API patterns"

Angular:
  docs: "angular.io documentation"
  patterns: "Angular best practices enterprise"
```

### 后端

```yaml
Node.js:
  docs: "nodejs.org API documentation"
  patterns: "Node.js production best practices"
  security: "Node.js security guide OWASP"

Python:
  docs: "docs.python.org"
  web: "FastAPI documentation official"
  patterns: "Python clean architecture"

Go:
  docs: "go.dev documentation"
  patterns: "Go project layout standard"
  web: "Go REST API best practices"
```

### 数据库

```yaml
PostgreSQL:
  docs: "postgresql.org documentation"
  optimization: "PostgreSQL query optimization"

MongoDB:
  docs: "mongodb.com documentation"
  patterns: "MongoDB schema design patterns"

Redis:
  docs: "redis.io documentation"
  patterns: "Redis caching strategies"
```

### DevOps

```yaml
Docker:
  docs: "docs.docker.com"
  best-practices: "Docker production best practices"

Kubernetes:
  docs: "kubernetes.io documentation"
  patterns: "Kubernetes deployment patterns"

AWS:
  docs: "docs.aws.amazon.com"
  patterns: "AWS well-architected framework"
```

---

## 质量过滤

### 可信来源列表

```yaml
official:
  - "*.dev" (react.dev, go.dev)
  - "*.io" (kubernetes.io, angular.io)
  - "docs.*" (docs.python.org)
  - "*.org" (nodejs.org, postgresql.org)

engineering_blogs:
  - "engineering.fb.com"
  - "netflixtechblog.com"
  - "blog.google"
  - "aws.amazon.com/blogs"
  - "engineering.atspotify.com"

community:
  - "github.com" (stars > 100)
  - "dev.to" (verified authors)
  - "medium.com" (engineering publications)
```

### 排除列表

```yaml
exclude:
  - 过期内容 (> 3 years for fast-moving tech)
  - 低质量聚合站
  - SEO 垃圾站
  - 未经验证的论坛回答
```

---

## 查询优化

### 关键词扩展

```
原始: "React state management"
扩展: "React state management 2024 Redux Zustand comparison production"
```

### 上下文增强

```
原始: "authentication"
增强: "authentication {detected_framework} JWT OAuth best practices"
```

### 版本限定

```
原始: "Next.js routing"
限定: "Next.js 14 app router documentation"
```
