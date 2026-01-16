# API 错误码定义

## 错误响应格式

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "用户可读的错误信息",
    "details": [],
    "requestId": "req-uuid-123"
  }
}
```

## 通用错误码 (1xxx)

| 错误码              | HTTP 状态码 | 说明               |
| ------------------- | ----------- | ------------------ |
| INTERNAL_ERROR      | 500         | 服务器内部错误     |
| SERVICE_UNAVAILABLE | 503         | 服务暂时不可用     |
| BAD_REQUEST         | 400         | 请求格式错误       |
| INVALID_JSON        | 400         | JSON 解析失败      |
| RATE_LIMITED        | 429         | 请求频率超限       |
| NOT_FOUND           | 404         | 资源不存在         |
| METHOD_NOT_ALLOWED  | 405         | 不支持的 HTTP 方法 |

## 认证错误码 (2xxx)

| 错误码           | HTTP 状态码 | 说明           |
| ---------------- | ----------- | -------------- |
| UNAUTHORIZED     | 401         | 未提供认证信息 |
| INVALID_TOKEN    | 401         | Token 无效     |
| TOKEN_EXPIRED    | 401         | Token 已过期   |
| FORBIDDEN        | 403         | 无权限访问     |
| ACCOUNT_DISABLED | 403         | 账号已禁用     |
| SESSION_EXPIRED  | 401         | 会话已过期     |

## 验证错误码 (3xxx)

| 错误码           | HTTP 状态码 | 说明         |
| ---------------- | ----------- | ------------ |
| VALIDATION_ERROR | 400         | 参数验证失败 |
| REQUIRED_FIELD   | 400         | 必填字段缺失 |
| INVALID_FORMAT   | 400         | 格式不正确   |
| OUT_OF_RANGE     | 400         | 值超出范围   |
| INVALID_ENUM     | 400         | 枚举值无效   |
| TOO_LONG         | 400         | 字符串过长   |
| TOO_SHORT        | 400         | 字符串过短   |

## 业务错误码 (4xxx)

| 错误码             | HTTP 状态码 | 说明         |
| ------------------ | ----------- | ------------ |
| DUPLICATE_ENTRY    | 409         | 记录已存在   |
| RESOURCE_CONFLICT  | 409         | 资源状态冲突 |
| UNPROCESSABLE      | 422         | 语义错误     |
| INSUFFICIENT_FUNDS | 422         | 余额不足     |
| QUOTA_EXCEEDED     | 422         | 配额超限     |
| DEPENDENCY_ERROR   | 424         | 依赖服务错误 |

## 验证错误详情格式

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "邮箱格式不正确",
        "value": "invalid-email"
      },
      {
        "field": "age",
        "code": "OUT_OF_RANGE",
        "message": "年龄必须在 0-150 之间",
        "value": 200,
        "constraints": {
          "min": 0,
          "max": 150
        }
      }
    ]
  }
}
```

## 错误码实现示例

### TypeScript

```typescript
export enum ErrorCode {
  // 通用
  INTERNAL_ERROR = "INTERNAL_ERROR",
  BAD_REQUEST = "BAD_REQUEST",
  NOT_FOUND = "NOT_FOUND",

  // 认证
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",

  // 验证
  VALIDATION_ERROR = "VALIDATION_ERROR",

  // 业务
  DUPLICATE_ENTRY = "DUPLICATE_ENTRY",
}

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number = 500,
    public details?: any[],
  ) {
    super(message);
  }

  static notFound(message = "资源不存在") {
    return new ApiError(ErrorCode.NOT_FOUND, message, 404);
  }

  static badRequest(message: string, details?: any[]) {
    return new ApiError(ErrorCode.BAD_REQUEST, message, 400, details);
  }

  static unauthorized(message = "未授权") {
    return new ApiError(ErrorCode.UNAUTHORIZED, message, 401);
  }
}
```

### Python (FastAPI)

```python
from enum import Enum
from fastapi import HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any

class ErrorCode(str, Enum):
    INTERNAL_ERROR = "INTERNAL_ERROR"
    BAD_REQUEST = "BAD_REQUEST"
    NOT_FOUND = "NOT_FOUND"
    UNAUTHORIZED = "UNAUTHORIZED"
    VALIDATION_ERROR = "VALIDATION_ERROR"

class ErrorDetail(BaseModel):
    field: str
    code: str
    message: str
    value: Optional[Any] = None

class ErrorResponse(BaseModel):
    code: ErrorCode
    message: str
    details: Optional[List[ErrorDetail]] = None
    request_id: Optional[str] = None

class ApiError(HTTPException):
    def __init__(
        self,
        code: ErrorCode,
        message: str,
        status_code: int = 500,
        details: Optional[List[ErrorDetail]] = None
    ):
        super().__init__(
            status_code=status_code,
            detail=ErrorResponse(
                code=code,
                message=message,
                details=details
            ).dict()
        )

    @classmethod
    def not_found(cls, message: str = "资源不存在"):
        return cls(ErrorCode.NOT_FOUND, message, 404)

    @classmethod
    def bad_request(cls, message: str, details=None):
        return cls(ErrorCode.BAD_REQUEST, message, 400, details)
```

## 最佳实践

1. **一致性**: 所有 API 使用相同的错误格式
2. **可读性**: message 应该用户友好
3. **可追踪**: 包含 requestId 便于调试
4. **详细信息**: 验证错误应包含字段级别的详情
5. **国际化**: code 用于前端国际化映射
6. **文档化**: 所有错误码都应在 API 文档中列出
