# OpenAPI Patterns Reference

## 框架路由识别

### Express

```typescript
// 标准路由
app.get("/users", getAllUsers);
app.post("/users", createUser);
app.get("/users/:id", getUserById);
app.put("/users/:id", updateUser);
app.delete("/users/:id", deleteUser);

// Router 模式
const router = express.Router();
router.get("/", handler);
router.post("/", handler);

// 中间件链
app.get("/protected", authMiddleware, handler);
```

### NestJS

```typescript
@Controller("users")
export class UsersController {
  @Get()
  findAll(@Query("page") page: number) {}

  @Get(":id")
  findOne(@Param("id") id: string) {}

  @Post()
  create(@Body() dto: CreateUserDto) {}

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateUserDto) {}

  @Delete(":id")
  remove(@Param("id") id: string) {}
}
```

### Fastify

```typescript
// 声明式
fastify.get(
  "/users",
  {
    schema: {
      querystring: { page: { type: "integer" } },
      response: { 200: UserSchema },
    },
  },
  handler,
);

// Route 配置
fastify.route({
  method: "POST",
  url: "/users",
  schema: { body: CreateUserSchema },
  handler,
});
```

## OpenAPI 结构

### 基础模板

```yaml
openapi: 3.0.3
info:
  title: API Title
  version: 1.0.0
  description: API Description

servers:
  - url: http://localhost:3000
    description: Development

paths: {}

components:
  schemas: {}
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
```

### Path Item

```yaml
/users:
  get:
    summary: List users
    operationId: getUsers
    tags: [Users]
    parameters:
      - name: page
        in: query
        schema:
          type: integer
          default: 1
      - name: limit
        in: query
        schema:
          type: integer
          default: 20
    responses:
      "200":
        description: Success
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/UserList"
```

### Request Body

```yaml
requestBody:
  required: true
  content:
    application/json:
      schema:
        $ref: "#/components/schemas/CreateUser"
    multipart/form-data:
      schema:
        type: object
        properties:
          file:
            type: string
            format: binary
```

### Responses

```yaml
responses:
  "200":
    description: Success
    content:
      application/json:
        schema:
          $ref: "#/components/schemas/User"
  "400":
    description: Bad Request
    content:
      application/json:
        schema:
          $ref: "#/components/schemas/Error"
  "401":
    description: Unauthorized
  "404":
    description: Not Found
  "500":
    description: Server Error
```

## Schema 定义

### 对象类型

```yaml
User:
  type: object
  required:
    - id
    - email
  properties:
    id:
      type: string
      format: uuid
    email:
      type: string
      format: email
    name:
      type: string
      maxLength: 100
    role:
      type: string
      enum: [admin, user, guest]
    createdAt:
      type: string
      format: date-time
```

### 数组类型

```yaml
UserList:
  type: object
  properties:
    items:
      type: array
      items:
        $ref: "#/components/schemas/User"
    total:
      type: integer
    page:
      type: integer
    pageSize:
      type: integer
```

### 组合类型

```yaml
# allOf - 继承
AdminUser:
  allOf:
    - $ref: "#/components/schemas/User"
    - type: object
      properties:
        permissions:
          type: array
          items:
            type: string

# oneOf - 多选一
Pet:
  oneOf:
    - $ref: "#/components/schemas/Cat"
    - $ref: "#/components/schemas/Dog"
  discriminator:
    propertyName: petType
```

## 认证配置

### Bearer Token

```yaml
securitySchemes:
  bearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT

security:
  - bearerAuth: []
```

### API Key

```yaml
securitySchemes:
  apiKey:
    type: apiKey
    in: header
    name: X-API-Key
```

### OAuth2

```yaml
securitySchemes:
  oauth2:
    type: oauth2
    flows:
      authorizationCode:
        authorizationUrl: https://auth.example.com/authorize
        tokenUrl: https://auth.example.com/token
        scopes:
          read: Read access
          write: Write access
```

## TypeScript 类型提取

### Interface → Schema

```typescript
interface User {
  id: string; // → type: string
  age: number; // → type: number
  active: boolean; // → type: boolean
  tags: string[]; // → type: array, items: { type: string }
  metadata?: object; // → additionalProperties (optional)
}
```

### 装饰器提取 (NestJS)

```typescript
@ApiProperty({ description: 'User email', example: 'user@example.com' })
email: string;

@ApiPropertyOptional({ default: 'user' })
role?: string;

@ApiResponse({ status: 200, type: User })
@ApiResponse({ status: 404, description: 'Not found' })
```

## 增量更新策略

```
1. 计算路由文件 hash
2. 比对上次扫描记录
3. 识别变更:
   - 新增端点
   - 修改端点
   - 删除端点
4. 合并更新:
   - 保留手动添加的 description
   - 保留手动添加的 examples
   - 更新参数和响应
```

## 降级策略

```
当 codex-cli 不可用时:
1. 使用正则提取路由定义
2. 解析 JSDoc 注释
3. 推断基础类型
4. 标记需要补充的字段
```
