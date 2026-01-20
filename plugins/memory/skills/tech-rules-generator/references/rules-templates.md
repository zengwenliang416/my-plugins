# Tech Rules Templates Reference

## 规则文件结构

```yaml
---
name: {stack}-rules
version: 1.0.0
generated: {timestamp}
stack: {stack}
sources:
  - official: {official_url}
  - community: {community_urls}
---
```

## 通用章节模板

### 类型系统 (TypeScript/Python)

````markdown
## 类型系统

### 严格模式配置

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```
````

### 类型声明规范

**推荐:**

- 使用 interface 定义对象结构
- 使用 type 定义联合类型和工具类型
- 避免使用 any，优先使用 unknown

**示例:**

```typescript
// ✅ 推荐
interface User {
  id: string;
  name: string;
}

type Status = "pending" | "active";

// ❌ 避免
const data: any = fetch();
```

````

### 命名约定

```markdown
## 命名约定

| 类型 | 规范 | 示例 |
|------|------|------|
| 类/接口 | PascalCase | `UserService`, `IRepository` |
| 函数/方法 | camelCase | `getUserById`, `validateInput` |
| 变量 | camelCase | `userName`, `isActive` |
| 常量 | UPPER_SNAKE | `MAX_RETRY`, `API_URL` |
| 文件 | kebab-case | `user-service.ts` |
| 目录 | kebab-case | `auth-module/` |

### 文件命名模式

````

{feature}.{type}.{ext}

示例:

- user.service.ts
- user.controller.ts
- user.dto.ts
- user.test.ts

```

```

### 文件组织

```markdown
## 文件组织

### 推荐目录结构
```

src/
├── modules/ # 业务模块
│ ├── user/
│ │ ├── user.service.ts
│ │ ├── user.controller.ts
│ │ └── user.types.ts
│ └── auth/
├── shared/ # 共享代码
│ ├── utils/
│ ├── types/
│ └── constants/
├── config/ # 配置
└── index.ts # 入口

```

### 导入顺序

1. 外部依赖 (node_modules)
2. 内部模块 (@/)
3. 相对路径 (./)
4. 类型导入
```

### 错误处理

````markdown
## 错误处理

### 自定义错误类

```typescript
class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}
```
````

### Result 模式

```typescript
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

function parseJson<T>(json: string): Result<T> {
  try {
    return { ok: true, value: JSON.parse(json) };
  } catch (e) {
    return { ok: false, error: e as Error };
  }
}
```

### 错误处理原则

1. 不要忽略错误
2. 提供有意义的错误消息
3. 区分可恢复和不可恢复错误
4. 使用 try-catch 仅包裹可能抛出的代码

````

### 异步处理

```markdown
## 异步处理

### async/await 规范

```typescript
// ✅ 推荐
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new AppError('FETCH_FAILED', 'Failed to fetch user');
  }
  return response.json();
}

// ✅ 并行请求
const [users, roles] = await Promise.all([
  fetchUsers(),
  fetchRoles()
]);
````

### 避免的模式

```typescript
// ❌ 不必要的 await
const users = await Promise.all(ids.map((id) => getUser(id)));
// ✅ 正确
const users = await Promise.all(ids.map(getUser));

// ❌ 顺序执行可并行的请求
const user = await getUser(id);
const roles = await getRoles(id);
// ✅ 正确
const [user, roles] = await Promise.all([getUser(id), getRoles(id)]);
```

````

### 测试规范

```markdown
## 测试规范

### 文件组织

````

tests/
├── unit/ # 单元测试
│ └── services/
├── integration/ # 集成测试
└── e2e/ # 端到端测试

````

### 命名约定

```typescript
describe('UserService', () => {
  describe('getUserById', () => {
    it('should return user when exists', async () => {
      // Arrange
      const userId = 'test-id';

      // Act
      const result = await userService.getUserById(userId);

      // Assert
      expect(result).toBeDefined();
    });

    it('should throw when user not found', async () => {
      // ...
    });
  });
});
````

### 测试原则

1. 一个测试只验证一个行为
2. 使用 AAA (Arrange-Act-Assert) 模式
3. 测试名称描述预期行为
4. 避免测试实现细节

````

### 安全规范

```markdown
## 安全规范

### 输入验证

```typescript
// 使用 zod 进行验证
const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function createUser(input: unknown) {
  const validated = userSchema.parse(input);
  // ...
}
````

### 敏感数据处理

1. 不要在日志中输出敏感信息
2. 使用环境变量存储密钥
3. 加密敏感数据传输
4. 实施最小权限原则

### SQL 注入防护

```typescript
// ✅ 使用参数化查询
await db.query("SELECT * FROM users WHERE id = $1", [userId]);

// ❌ 避免字符串拼接
await db.query(`SELECT * FROM users WHERE id = '${userId}'`);
```

````

## 框架特定模板

### React 规则

```markdown
## React 特定规范

### 组件组织

````

components/
├── common/ # 通用组件
│ ├── Button/
│ │ ├── Button.tsx
│ │ ├── Button.test.tsx
│ │ └── index.ts
├── features/ # 功能组件
└── layouts/ # 布局组件

````

### Hooks 规范

```typescript
// 自定义 Hook 命名以 use 开头
function useUser(id: string) {
  const [user, setUser] = useState<User | null>(null);
  // ...
  return { user, isLoading };
}
````

### 性能优化

- 使用 useMemo 缓存复杂计算
- 使用 useCallback 缓存回调函数
- 使用 React.memo 避免不必要重渲染
- 使用 lazy 和 Suspense 实现代码分割

````

### NestJS 规则

```markdown
## NestJS 特定规范

### 模块组织

````

src/
├── modules/
│ └── user/
│ ├── user.module.ts
│ ├── user.controller.ts
│ ├── user.service.ts
│ ├── user.repository.ts
│ ├── dto/
│ │ ├── create-user.dto.ts
│ │ └── update-user.dto.ts
│ └── entities/
│ └── user.entity.ts

````

### DTO 验证

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
````

### 依赖注入

- 使用构造函数注入
- 避免循环依赖
- 使用 forwardRef 解决必要的循环引用

````

## 项目分析输出模板

```markdown
## 项目现有规范

### 检测到的约定

#### 命名风格
{detected_naming_patterns}

#### 目录结构
{detected_directory_structure}

#### 代码风格
{detected_code_style}

### 推荐调整

{recommendations}
````

## 规则索引结构

```json
{
  "rules": [
    {
      "stack": "typescript",
      "path": "typescript.md",
      "generated": "2024-01-20T08:00:00Z",
      "version": "1.0.0",
      "sources": ["official", "eslint-config"]
    }
  ],
  "last_updated": "2024-01-20T08:00:00Z"
}
```
