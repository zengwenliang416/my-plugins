---
name: tdd
description: |
  【触发条件】当用户需要采用 TDD 工作流、实现新功能前先写测试、修复 Bug 前先写回归测试时使用。
  【核心产出】输出：测试用例代码、TDD 红-绿-重构循环指导、测试覆盖建议。
  【不触发】不用于：为现有代码补充测试（改用 test-generator）、代码审查（改用 code-reviewer）。
  【先问什么】若缺少：功能需求描述、测试框架、期望行为，先提问补齐。
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# TDD - 测试驱动开发助手

## 功能概述

指导测试驱动开发 (Test-Driven Development) 工作流，确保在编写实现代码之前先编写测试。

## TDD 核心循环

```
    ┌─────────────┐
    │   RED       │  1. 写一个失败的测试
    │  (失败测试)  │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │   GREEN     │  2. 写最少代码使测试通过
    │  (通过测试)  │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │  REFACTOR   │  3. 重构代码保持测试通过
    │   (重构)    │
    └──────┬──────┘
           │
           └─────────► 回到 RED
```

## 可执行脚本

本 Skill 包含以下可执行脚本（位于 `scripts/` 目录）：

| 脚本                 | 用途               | 执行方式                                 |
| -------------------- | ------------------ | ---------------------------------------- |
| `run-tests.sh`       | 自动检测并运行测试 | `bash scripts/run-tests.sh [目录]`       |
| `coverage-report.sh` | 生成测试覆盖率报告 | `bash scripts/coverage-report.sh [目录]` |

## 工作流程

### 1. RED - 编写失败测试

```python
# 先写测试，明确期望行为
def test_calculate_discount_for_premium_user():
    """高级用户应获得 20% 折扣"""
    user = User(membership="premium")
    order = Order(total=100)

    discount = calculate_discount(user, order)

    assert discount == 20.0  # 期望值
```

**运行测试验证失败**:

```bash
pytest test_discount.py -v
# FAILED - calculate_discount 尚未实现
```

### 2. GREEN - 最小实现

```python
# 写最少代码使测试通过
def calculate_discount(user, order):
    if user.membership == "premium":
        return order.total * 0.2
    return 0
```

**运行测试验证通过**:

```bash
pytest test_discount.py -v
# PASSED
```

### 3. REFACTOR - 重构优化

```python
# 重构但保持测试通过
DISCOUNT_RATES = {
    "premium": 0.20,
    "gold": 0.15,
    "silver": 0.10,
}

def calculate_discount(user, order):
    rate = DISCOUNT_RATES.get(user.membership, 0)
    return order.total * rate
```

**确保测试仍然通过**:

```bash
pytest test_discount.py -v
# PASSED
```

## TDD 最佳实践

### 测试命名

```python
# 格式: test_[被测方法]_[场景]_[期望结果]
def test_login_with_invalid_password_returns_error():
    ...

def test_order_total_with_discount_applied_correctly():
    ...
```

### 测试结构 (AAA 模式)

```python
def test_something():
    # Arrange - 准备
    user = create_test_user()

    # Act - 执行
    result = user.perform_action()

    # Assert - 断言
    assert result == expected_value
```

### 测试金字塔

```
        /\
       /  \      E2E 测试 (少量)
      /────\
     /      \    集成测试 (适量)
    /────────\
   /          \  单元测试 (大量)
  /────────────\
```

## 常见测试场景

### 边界条件

```python
def test_empty_list():
    assert process([]) == []

def test_single_item():
    assert process([1]) == [1]

def test_maximum_items():
    assert process(list(range(1000))) == ...
```

### 异常处理

```python
def test_invalid_input_raises_error():
    with pytest.raises(ValueError, match="Invalid input"):
        process(None)
```

### Mock 外部依赖

```python
def test_send_notification(mocker):
    mock_email = mocker.patch('services.email.send')

    notify_user(user_id=1, message="Hello")

    mock_email.assert_called_once_with(
        to="user@example.com",
        body="Hello"
    )
```

## TDD 检查清单

### 开始前

- [ ] 理解需求和期望行为
- [ ] 确定测试策略和范围
- [ ] 准备测试环境

### RED 阶段

- [ ] 测试描述了期望行为
- [ ] 测试运行并失败
- [ ] 失败原因是功能未实现

### GREEN 阶段

- [ ] 只写使测试通过的最少代码
- [ ] 不添加额外功能
- [ ] 测试通过

### REFACTOR 阶段

- [ ] 消除重复代码
- [ ] 改善可读性
- [ ] 所有测试仍然通过

## 常用测试框架

| 语言       | 框架       | 命令            |
| ---------- | ---------- | --------------- |
| Python     | pytest     | `pytest -v`     |
| JavaScript | Jest       | `npm test`      |
| TypeScript | Vitest     | `npm run test`  |
| Go         | testing    | `go test ./...` |
| Rust       | cargo test | `cargo test`    |

## 参考文档

- `test-patterns.md` - 测试模式集合
- `mocking-strategies.md` - Mock 策略指南
