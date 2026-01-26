# 后端架构模式

## 概述

本文档定义了后端架构分析中常用的架构模式和设计决策指南。

## 分层架构模式

### 三层架构

```
┌─────────────────────────────────────┐
│          Presentation Layer         │  ← Controllers, API Routes
├─────────────────────────────────────┤
│           Business Layer            │  ← Services, Use Cases
├─────────────────────────────────────┤
│            Data Layer               │  ← Repositories, Models
└─────────────────────────────────────┘
```

| 层级   | 职责                | 典型组件                             |
| ------ | ------------------- | ------------------------------------ |
| 表现层 | 处理 HTTP 请求/响应 | Controllers, Middleware, DTOs        |
| 业务层 | 核心业务逻辑        | Services, Use Cases, Domain Models   |
| 数据层 | 数据持久化          | Repositories, ORMs, Database Clients |

### 六边形架构（Ports & Adapters）

```
                    ┌─────────────┐
           ┌────────│   Driving   │────────┐
           │        │   Adapters  │        │
           │        └──────┬──────┘        │
           │               │               │
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────────┐    ┌──────────┐
    │   REST   │───▶│              │◀───│  GraphQL │
    │   API    │    │    Domain    │    │   API    │
    └──────────┘    │    Core      │    └──────────┘
                    │              │
    ┌──────────┐    │   (Ports)    │    ┌──────────┐
    │   CLI    │───▶│              │◀───│  Events  │
    └──────────┘    └──────┬───────┘    └──────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ Database │    │  Cache   │    │ External │
    │ Adapter  │    │ Adapter  │    │   API    │
    └──────────┘    └──────────┘    └──────────┘
           │        │   Driven   │        │
           └────────│   Adapters │────────┘
                    └────────────┘
```

**优势**：

- 业务逻辑与技术细节解耦
- 易于测试（可 Mock 适配器）
- 技术栈替换成本低

## API 设计模式

### RESTful API

| HTTP 方法 | 用途     | 示例                |
| --------- | -------- | ------------------- |
| GET       | 获取资源 | `GET /users/123`    |
| POST      | 创建资源 | `POST /users`       |
| PUT       | 完整更新 | `PUT /users/123`    |
| PATCH     | 部分更新 | `PATCH /users/123`  |
| DELETE    | 删除资源 | `DELETE /users/123` |

**URL 设计原则**：

- 使用复数名词：`/users` 而非 `/user`
- 层级关系：`/users/123/orders`
- 筛选用查询参数：`/users?status=active`
- 版本控制：`/api/v1/users`

### GraphQL

```graphql
type Query {
  user(id: ID!): User
  users(filter: UserFilter, pagination: PaginationInput): UserConnection!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
}

type Subscription {
  userCreated: User!
}
```

**适用场景**：

- 客户端需要灵活查询
- 多端（Web/Mobile）不同数据需求
- 减少 Over-fetching/Under-fetching

### RPC (gRPC)

```protobuf
service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc CreateUser(CreateUserRequest) returns (User);
  rpc ListUsers(ListUsersRequest) returns (stream User);
}
```

**适用场景**：

- 微服务间通信
- 高性能要求
- 强类型需求

## 数据访问模式

### Repository 模式

```typescript
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}

class PostgresUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
  // ...
}
```

### Unit of Work 模式

```typescript
interface UnitOfWork {
  users: UserRepository;
  orders: OrderRepository;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
```

### CQRS（命令查询分离）

```
                Commands                          Queries
                   │                                 │
                   ▼                                 ▼
            ┌──────────────┐                 ┌──────────────┐
            │   Command    │                 │    Query     │
            │   Handlers   │                 │   Handlers   │
            └──────┬───────┘                 └──────┬───────┘
                   │                                 │
                   ▼                                 ▼
            ┌──────────────┐                 ┌──────────────┐
            │    Write     │    Sync/Event   │    Read      │
            │    Model     │───────────────▶ │    Model     │
            │  (Postgres)  │                 │ (Elasticsearch)│
            └──────────────┘                 └──────────────┘
```

**适用场景**：

- 读写负载差异大
- 复杂查询需求
- 事件溯源架构

## 认证授权模式

### JWT 认证

```typescript
// 生成 Token
const accessToken = jwt.sign({ userId: user.id, role: user.role }, SECRET_KEY, {
  expiresIn: "15m",
});

const refreshToken = jwt.sign({ userId: user.id }, REFRESH_SECRET, {
  expiresIn: "7d",
});
```

**Token 刷新流程**：

```
Client                   Server
  │                        │
  │──── Access Token ─────▶│
  │◀─── 401 Expired ───────│
  │                        │
  │── Refresh Token ──────▶│
  │◀── New Access Token ───│
```

### RBAC（基于角色的访问控制）

```typescript
enum Role {
  ADMIN = "admin",
  USER = "user",
  GUEST = "guest",
}

const permissions = {
  [Role.ADMIN]: ["users:read", "users:write", "users:delete"],
  [Role.USER]: ["users:read", "profile:write"],
  [Role.GUEST]: ["public:read"],
};

function authorize(requiredPermission: string) {
  return (req, res, next) => {
    const userPermissions = permissions[req.user.role];
    if (!userPermissions.includes(requiredPermission)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
```

## 错误处理模式

### 统一错误格式

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  path: string;
}

// 示例响应
{
  "code": "USER_NOT_FOUND",
  "message": "User with id 123 not found",
  "timestamp": "2024-01-19T10:00:00Z",
  "path": "/api/users/123"
}
```

### 错误分类

| 类型       | HTTP 状态码 | 处理方式               |
| ---------- | ----------- | ---------------------- |
| 验证错误   | 400         | 返回字段级错误详情     |
| 认证错误   | 401         | 返回登录提示           |
| 授权错误   | 403         | 返回权限不足提示       |
| 未找到     | 404         | 返回资源不存在         |
| 业务错误   | 422         | 返回业务规则违反详情   |
| 服务器错误 | 500         | 记录日志，返回通用错误 |

## 缓存模式

### Cache-Aside

```typescript
async function getUser(id: string): Promise<User> {
  // 1. 查缓存
  const cached = await redis.get(`user:${id}`);
  if (cached) return JSON.parse(cached);

  // 2. 查数据库
  const user = await db.user.findById(id);

  // 3. 写缓存
  await redis.set(`user:${id}`, JSON.stringify(user), "EX", 3600);

  return user;
}
```

### Write-Through

```typescript
async function updateUser(id: string, data: UpdateUserDto): Promise<User> {
  // 1. 更新数据库
  const user = await db.user.update(id, data);

  // 2. 同步更新缓存
  await redis.set(`user:${id}`, JSON.stringify(user), "EX", 3600);

  return user;
}
```

### Cache Invalidation

```typescript
async function deleteUser(id: string): Promise<void> {
  // 1. 删除数据库
  await db.user.delete(id);

  // 2. 删除缓存
  await redis.del(`user:${id}`);

  // 3. 删除关联缓存
  await redis.del(`user:${id}:orders`);
}
```

## 消息队列模式

### 发布/订阅

```typescript
// Publisher
await messageQueue.publish("user.created", {
  userId: user.id,
  email: user.email,
  createdAt: new Date(),
});

// Subscriber
messageQueue.subscribe("user.created", async (message) => {
  await sendWelcomeEmail(message.email);
  await createDefaultSettings(message.userId);
});
```

### 任务队列

```typescript
// Producer
await jobQueue.add(
  "send-email",
  {
    to: user.email,
    template: "welcome",
    data: { name: user.name },
  },
  {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
  },
);

// Worker
jobQueue.process("send-email", async (job) => {
  await emailService.send(job.data);
});
```

## 微服务模式

### 服务发现

| 模式       | 实现                 | 适用场景       |
| ---------- | -------------------- | -------------- |
| 客户端发现 | Eureka, Consul       | 自管理基础设施 |
| 服务端发现 | AWS ALB, K8s Service | 云原生环境     |
| DNS 发现   | Route53, CoreDNS     | 简单场景       |

### 熔断器

```typescript
const breaker = new CircuitBreaker(paymentService.charge, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
});

breaker.fallback(() => ({ status: "pending", message: "稍后重试" }));

const result = await breaker.fire(order);
```

### Saga 模式（分布式事务）

```
┌───────┐    ┌───────┐    ┌───────┐    ┌───────┐
│ Order │───▶│Payment│───▶│ Stock │───▶│Shipping│
│Service│    │Service│    │Service│    │Service │
└───┬───┘    └───┬───┘    └───┬───┘    └───┬───┘
    │            │            │            │
    ▼            ▼            ▼            ▼
 Create      Charge       Reserve       Ship
  Order      Payment       Stock       Package
    │            │            │            │
    │◀───────────│◀───────────│◀───────────│
    │  Compensate│ Compensate │ Compensate │
    │   (Refund) │ (Release)  │  (Cancel)  │
```

## 选型决策矩阵

| 场景         | 推荐模式         | 原因     |
| ------------ | ---------------- | -------- |
| 简单 CRUD    | 三层架构 + REST  | 成熟简单 |
| 复杂业务逻辑 | 六边形架构 + DDD | 可维护性 |
| 高并发读     | CQRS + 缓存      | 读写分离 |
| 微服务       | 事件驱动 + Saga  | 松耦合   |
| BFF 场景     | GraphQL          | 灵活查询 |
