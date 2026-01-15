# RESTful API 设计规范

## URL 设计原则

### 1. 使用名词复数表示资源

```
✅ GET /users
✅ GET /articles
✅ GET /order-items

❌ GET /getUsers
❌ GET /user
❌ GET /orderItems
```

### 2. 使用 kebab-case

```
✅ /user-profiles
✅ /order-items

❌ /userProfiles
❌ /user_profiles
```

### 3. 资源层级表示关系

```
# 用户的订单
GET /users/{userId}/orders

# 订单的商品
GET /orders/{orderId}/items

# 最多两层嵌套
GET /users/{userId}/orders/{orderId}
# 而非
❌ GET /users/{userId}/orders/{orderId}/items/{itemId}/reviews
```

### 4. 使用查询参数进行过滤

```
# 过滤
GET /products?category=electronics&status=active

# 分页
GET /products?page=1&pageSize=20

# 排序
GET /products?sort=createdAt&order=desc

# 字段选择
GET /products?fields=id,name,price
```

## HTTP 方法语义

| 方法   | 操作     | 幂等性 | 安全性 | 典型响应码 |
| ------ | -------- | ------ | ------ | ---------- |
| GET    | 读取     | ✅     | ✅     | 200, 404   |
| POST   | 创建     | ❌     | ❌     | 201, 400   |
| PUT    | 完整替换 | ✅     | ❌     | 200, 404   |
| PATCH  | 部分更新 | ❌     | ❌     | 200, 404   |
| DELETE | 删除     | ✅     | ❌     | 204, 404   |

## 响应格式

### 成功响应

```json
// 单个资源
{
  "id": "123",
  "name": "Product",
  "createdAt": "2024-01-01T00:00:00Z"
}

// 列表 (带分页)
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  }
}
```

### 错误响应

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  }
}
```

## 状态码使用

### 2xx 成功

- `200 OK`: 通用成功
- `201 Created`: 资源创建成功
- `204 No Content`: 成功但无返回内容（DELETE）

### 4xx 客户端错误

- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未认证
- `403 Forbidden`: 无权限
- `404 Not Found`: 资源不存在
- `409 Conflict`: 资源冲突
- `422 Unprocessable Entity`: 语义错误

### 5xx 服务端错误

- `500 Internal Server Error`: 服务器错误
- `502 Bad Gateway`: 网关错误
- `503 Service Unavailable`: 服务不可用

## 版本控制

```
# URL 路径版本（推荐）
GET /api/v1/users
GET /api/v2/users

# Header 版本
Accept: application/vnd.api+json; version=1
```

## 认证

```http
# Bearer Token
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

# API Key
X-API-Key: your-api-key
```

## HATEOAS（可选）

```json
{
  "id": "123",
  "name": "Product",
  "_links": {
    "self": { "href": "/products/123" },
    "category": { "href": "/categories/456" },
    "reviews": { "href": "/products/123/reviews" }
  }
}
```

## 最佳实践

1. **一致性**: 保持命名和结构一致
2. **幂等性**: PUT/DELETE 应该是幂等的
3. **无状态**: 每个请求包含所有必要信息
4. **安全性**: 使用 HTTPS，验证所有输入
5. **文档**: 使用 OpenAPI 规范文档
6. **版本**: 从 v1 开始，谨慎升级
