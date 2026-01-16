---
name: test-writer
description: |
  【触发条件】测试工作流第三步：基于用例设计编写测试代码。
  【核心产出】输出测试文件到项目测试目录，记录到 ${run_dir}/test-code.md。
  【不触发】用例设计（用 test-case-designer）、测试执行（用 test-runner）。
allowed-tools: Read, Write, Edit, Bash, Task, Glob, LSP
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
---

# Test Writer - 测试编写原子技能

## 职责边界

- **输入**: `${run_dir}` + `${run_dir}/test-cases.md` 文件路径 + 测试框架
- **输出**: 测试文件 + `${run_dir}/test-code.md` 记录
- **单一职责**: 只做测试代码编写，不做执行验证

## 执行流程

### Step 1: 读取用例设计

```bash
读取 ${run_dir}/test-cases.md
提取: 用例矩阵、Mock 需求、验证步骤
```

### Step 2: 确定测试框架和模板

| 语言       | 框架        | 模板              |
| ---------- | ----------- | ----------------- |
| TypeScript | Jest/Vitest | AAA + describe/it |
| Python     | pytest      | AAA + fixtures    |
| Go         | testing     | Table-driven      |
| Rust       | cargo test  | #[test]           |

### Step 3: 生成测试代码

**并行调用外部模型**:

**Codex (后端/逻辑测试)**:

````bash
~/.claude/bin/codeagent-wrapper codex \
  --role tester \
  --workdir $PROJECT_DIR \
  --prompt "基于以下用例设计，编写测试代码:

用例设计:
<test-cases.md 内容>

测试框架: [framework]

要求:
1. 使用 AAA 模式
2. 正确设置 Mock
3. 清晰的测试命名
4. 完整的断言

OUTPUT FORMAT:
```typescript
// 测试代码
```"
````

**Gemini (前端/集成测试)**:

```bash
~/.claude/bin/codeagent-wrapper gemini \
  --role tester \
  --workdir $PROJECT_DIR \
  --prompt "..."
```

### Step 4: Claude 代码审查和重构

Claude 综合外部模型输出：

1. **代码规范** - 统一命名和格式
2. **断言完善** - 补充遗漏的断言
3. **Mock 优化** - 确保 Mock 正确
4. **去除冗余** - 精简重复代码

### Step 5: 写入测试文件

**Jest/Vitest 示例**:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createUser } from "../src/services/user";
import { db } from "../src/db";
import { emailService } from "../src/services/email";

vi.mock("../src/db");
vi.mock("../src/services/email");

describe("createUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create user successfully", async () => {
    // Arrange
    const userData = { name: "Alice", email: "alice@example.com" };
    vi.mocked(db.users.findByEmail).mockResolvedValue(null);
    vi.mocked(db.users.create).mockResolvedValue({ id: 1, ...userData });

    // Act
    const result = await createUser(userData);

    // Assert
    expect(result.id).toBe(1);
    expect(result.name).toBe("Alice");
    expect(db.users.create).toHaveBeenCalledWith(userData);
    expect(emailService.sendWelcome).toHaveBeenCalledWith("alice@example.com");
  });

  it("should throw ValidationError when email is empty", async () => {
    // Arrange
    const userData = { name: "Alice", email: "" };

    // Act & Assert
    await expect(createUser(userData)).rejects.toThrow("Email is required");
  });

  it("should throw DuplicateError when email exists", async () => {
    // Arrange
    const userData = { name: "Alice", email: "existing@example.com" };
    vi.mocked(db.users.findByEmail).mockResolvedValue({ id: 1 });

    // Act & Assert
    await expect(createUser(userData)).rejects.toThrow("Email already exists");
  });
});
```

**Pytest 示例**:

```python
import pytest
from unittest.mock import Mock, patch
from services.user import create_user

@pytest.fixture
def mock_db():
    with patch('services.user.db') as mock:
        yield mock

@pytest.fixture
def mock_email():
    with patch('services.user.email_service') as mock:
        yield mock

class TestCreateUser:
    def test_create_user_successfully(self, mock_db, mock_email):
        # Arrange
        user_data = {'name': 'Alice', 'email': 'alice@example.com'}
        mock_db.users.find_by_email.return_value = None
        mock_db.users.create.return_value = {'id': 1, **user_data}

        # Act
        result = create_user(user_data)

        # Assert
        assert result['id'] == 1
        assert result['name'] == 'Alice'
        mock_email.send_welcome.assert_called_once_with('alice@example.com')

    def test_raise_error_when_email_empty(self, mock_db):
        # Arrange
        user_data = {'name': 'Alice', 'email': ''}

        # Act & Assert
        with pytest.raises(ValueError, match='Email is required'):
            create_user(user_data)
```

### Step 6: 输出测试代码记录

写入 `${run_dir}/test-code.md`：

```markdown
# 测试代码记录: <目标模块>

## 元信息

- 基于用例: test-cases.md
- 编写时间: [timestamp]
- 测试框架: [framework]

## 生成的测试文件

| 文件                | 用例数 | 行数 |
| ------------------- | ------ | ---- |
| tests/user.test.ts  | 5      | 120  |
| tests/order.test.ts | 5      | 100  |

## 测试结构

### tests/user.test.ts
```

describe('createUser')
├── it('should create user successfully')
├── it('should throw ValidationError when email is empty')
├── it('should throw DuplicateError when email exists')
├── it('should throw ValidationError when name is empty')
└── it('should throw ValidationError when name too long')

```

## Mock 设置

| Mock | 类型 | 配置 |
|------|------|------|
| db | vi.mock | 自动 mock |
| emailService | vi.mock | 自动 mock |

---

下一步: 使用 testing:test-runner 执行测试
```

## 返回值

```
测试代码编写完成。
输出文件:
- tests/user.test.ts (5 用例)
- tests/order.test.ts (5 用例)
- ${run_dir}/test-code.md (记录)

📝 编写概要:
- 测试文件: X 个
- 总用例数: Y 个
- 总代码行: Z 行

下一步: 使用 /testing:test-runner 执行测试
```

## 质量门控

| 维度      | 标准                    | 阈值 |
| --------- | ----------------------- | ---- |
| 用例覆盖  | 所有设计用例都有代码    | 100% |
| AAA 模式  | 遵循 Arrange-Act-Assert | ✅   |
| Mock 正确 | Mock 配置正确           | ✅   |
| 命名规范  | 测试名称清晰            | ✅   |
