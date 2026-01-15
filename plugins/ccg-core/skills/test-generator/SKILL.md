---
name: test-generator
description: |
  【触发条件】当用户需要为现有代码生成测试、设计测试用例、提高测试覆盖率时使用。
  【核心产出】输出：单元测试代码、集成测试代码、测试用例矩阵、覆盖率分析。
  【不触发】不用于：TDD 工作流（改用 tdd）、代码审查（改用 code-reviewer）。
  【先问什么】若缺少：目标代码路径、测试框架、覆盖重点（边界/异常/正常），先提问补齐。
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, mcp__serena__find_symbol, mcp__serena__find_referencing_symbols, mcp__serena__get_symbols_overview, mcp__context7__resolve-library-id, mcp__context7__get-library-docs, mcp__codex__codex, mcp__exa__get_code_context_exa
---

# Test Generator - 测试生成助手

## 能力概述

- 分析代码结构，识别需要测试的公开接口
- 生成符合 AAA 模式的单元测试
- 设计全面的测试用例矩阵
- 提高测试覆盖率

## 可用脚本

### 1. 代码分析器

```bash
# 分析文件，提取可测试接口
python ~/.claude/skills/test-generator/scripts/analyze-testable.py \
  --file ./src/services/UserService.ts \
  --lang typescript

# 分析目录，生成测试计划
python ~/.claude/skills/test-generator/scripts/analyze-testable.py \
  --dir ./src/services \
  --output ./test-plan.md
```

### 2. 测试脚手架生成

```bash
# 生成 Jest 测试文件
bash ~/.claude/skills/test-generator/scripts/scaffold-test.sh \
  --source ./src/services/UserService.ts \
  --framework jest \
  --output ./tests/UserService.test.ts

# 生成 Pytest 测试文件
bash ~/.claude/skills/test-generator/scripts/scaffold-test.sh \
  --source ./src/user_service.py \
  --framework pytest \
  --output ./tests/test_user_service.py
```

### 3. 覆盖率分析

```bash
# 分析覆盖率报告，识别未覆盖代码
python ~/.claude/skills/test-generator/scripts/coverage-gaps.py \
  --report ./coverage/lcov.info \
  --source ./src
```

## MCP 工具使用

### serena 工具

- `find_symbol`: 定位被测函数/类
- `get_symbols_overview`: 分析模块公开接口
- `find_referencing_symbols`: 理解依赖关系

### context7 工具

- 查询 Jest/Pytest/Vitest 官方文档
- 获取测试框架最佳实践

### codex 工具

- 协作设计复杂测试用例
- 审查测试覆盖完整性

## 测试金字塔

```
        /\
       /  \     E2E Tests (10%)
      /----\    - 用户场景
     /      \   - 慢但全面
    /--------\  Integration Tests (20%)
   /          \ - 模块集成
  /------------\- API 测试
 /              \Unit Tests (70%)
/----------------\- 快速反馈
                  - 高覆盖率
```

## 测试用例设计方法

### 1. 等价类划分

```
输入：年龄（0-150 有效）

有效等价类：
- 0-17：未成年
- 18-59：成年
- 60-150：老年

无效等价类：
- < 0：负数
- > 150：超出范围
- 非数字：类型错误
```

### 2. 边界值分析

```
边界点：0, 1, 17, 18, 59, 60, 149, 150, 151

测试用例：
- age = -1 → 无效
- age = 0 → 有效（边界）
- age = 18 → 有效（成年边界）
- age = 150 → 有效（边界）
- age = 151 → 无效
```

### 3. 场景测试

```
场景：用户登录

正常流程：
1. 输入正确用户名密码 → 登录成功
2. 记住密码 → 自动填充

异常流程：
1. 用户名不存在 → 提示用户不存在
2. 密码错误 → 提示密码错误
3. 账户被锁定 → 提示被锁定
```

## 测试模板

参考文档：

- `templates/jest.md` - Jest/TypeScript 模板
- `templates/pytest.md` - Pytest/Python 模板
- `templates/go.md` - Go Testing 模板

## AAA 模式

```typescript
it("should create user successfully", async () => {
  // Arrange - 准备测试数据
  const userData = { username: "test", email: "test@example.com" };
  mockRepo.findByEmail.mockResolvedValue(null);

  // Act - 执行被测方法
  const result = await service.createUser(userData);

  // Assert - 验证结果
  expect(result.username).toBe("test");
  expect(mockRepo.create).toHaveBeenCalledWith(userData);
});
```

## 最佳实践

### 测试命名

- 使用 `should_期望行为_when_条件` 格式
- 测试名称应该是可执行的文档

### Mock 原则

- 只 Mock 外部依赖
- 不要 Mock 被测类本身
- 优先使用 Fake 而非 Stub

### 覆盖率目标

- 行覆盖率：80%+
- 分支覆盖率：75%+
- 关键路径：100%
