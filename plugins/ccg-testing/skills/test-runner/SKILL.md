---
name: test-runner
description: |
  【触发条件】测试工作流第四步：执行测试，收集结果，分析覆盖率。
  【核心产出】输出 ${run_dir}/results.md，包含测试结果和覆盖率报告。
  【不触发】测试编写（用 test-writer）、用例设计（用 test-case-designer）。
allowed-tools: Read, Write, Bash, Grep, Glob
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
---

# Test Runner - 测试执行原子技能

## 职责边界

- **输入**: `${run_dir}` + `${run_dir}/test-code.md` 文件路径 + 测试命令
- **输出**: `${run_dir}/results.md`
- **单一职责**: 只做测试执行和结果分析，不做测试修复

## 执行流程

### Step 1: 读取测试代码记录

```bash
读取 ${run_dir}/test-code.md
提取: 测试文件列表、测试框架、预期用例数
```

### Step 2: 执行测试

**自动检测测试框架**:

```bash
# 检测 package.json
if 存在 package.json:
    if "vitest" in devDependencies:
        npx vitest run --reporter=verbose --coverage
    elif "jest" in devDependencies:
        npx jest --verbose --coverage
    elif "mocha" in devDependencies:
        npx mocha --reporter spec

# 检测 Python
elif 存在 pytest.ini 或 pyproject.toml:
    pytest -v --cov --cov-report=term-missing

# 检测 Go
elif 存在 go.mod:
    go test -v -cover ./...

# 检测 Rust
elif 存在 Cargo.toml:
    cargo test --verbose
```

### Step 3: 解析测试结果

**Jest/Vitest 输出解析**:

```
✓ should create user successfully (5ms)
✓ should throw ValidationError when email is empty (2ms)
✗ should throw DuplicateError when email exists (3ms)
  Expected: "Email already exists"
  Received: "Duplicate entry"
```

**Pytest 输出解析**:

```
tests/test_user.py::TestCreateUser::test_create_user_successfully PASSED
tests/test_user.py::TestCreateUser::test_raise_error_when_email_empty PASSED
tests/test_user.py::TestCreateUser::test_duplicate_email FAILED
```

### Step 4: 分析覆盖率

```bash
# 解析覆盖率报告
if 存在 coverage/lcov-report/index.html:
    提取行覆盖率、分支覆盖率、函数覆盖率
elif 存在 coverage.xml:
    解析 XML 报告
elif 存在 cover.out (Go):
    go tool cover -func=cover.out
```

### Step 5: 输出测试结果

写入 `${run_dir}/results.md`：

```markdown
# 测试结果报告: <目标模块>

## 元信息

- 基于测试: test-code.md
- 执行时间: [timestamp]
- 测试框架: [framework]
- 执行命令: [command]

## 执行摘要

| 指标     | 值   |
| -------- | ---- |
| 总用例数 | 10   |
| 通过     | 8    |
| 失败     | 1    |
| 跳过     | 1    |
| 执行时间 | 2.5s |

## 测试结果

### ✅ 通过的测试 (8/10)

| 测试                                                          | 耗时 |
| ------------------------------------------------------------- | ---- |
| createUser › should create user successfully                  | 5ms  |
| createUser › should throw ValidationError when email is empty | 2ms  |
| calculateDiscount › should return 0 for normal user           | 1ms  |
| ...                                                           | ...  |

### ❌ 失败的测试 (1/10)

#### createUser › should throw DuplicateError when email exists

**错误信息**:
```

Expected: "Email already exists"
Received: "Duplicate entry"

````

**失败位置**: tests/user.test.ts:45

**可能原因**:
1. 错误消息不匹配
2. 实现代码错误消息与测试期望不一致

**修复建议**:
- 检查 `createUser` 函数的错误消息
- 或修改测试期望值

### ⏭️ 跳过的测试 (1/10)

| 测试 | 原因 |
|------|------|
| integration › should send email | 需要外部服务 |

## 覆盖率报告

### 总体覆盖率

| 指标 | 覆盖率 | 状态 |
|------|--------|------|
| 行覆盖率 | 85% | ✅ (≥80%) |
| 分支覆盖率 | 72% | ⚠️ (<75%) |
| 函数覆盖率 | 90% | ✅ (≥80%) |

### 文件级覆盖率

| 文件 | 行 | 分支 | 未覆盖行 |
|------|-----|------|---------|
| src/services/user.ts | 90% | 80% | 35-40 |
| src/services/order.ts | 80% | 65% | 50-55, 70 |

### 未覆盖代码分析

#### src/services/user.ts:35-40

```typescript
// 未覆盖: 异常处理分支
if (error.code === 'TIMEOUT') {
  logger.error('Database timeout');
  throw new TimeoutError('Database operation timed out');
}
````

**建议**: 添加超时场景测试

## TDD 循环状态

### 当前循环

| 阶段     | 状态            |
| -------- | --------------- |
| RED      | ✅ 已完成       |
| GREEN    | ⚠️ 1 个测试失败 |
| REFACTOR | ⏳ 待执行       |

### 下一步行动

1. 修复失败的测试 `createUser › should throw DuplicateError`
2. 提高分支覆盖率到 75%+
3. 添加超时场景测试

---

下一步选项:

- [A] 修复失败测试 → 回到 test-writer
- [B] 补充测试用例 → 回到 test-case-designer
- [C] 完成测试流程 → 生成最终报告

```

## 返回值

```

测试执行完成。
输出文件: ${run_dir}/results.md

📊 执行结果:
✅ 通过: 8/10
❌ 失败: 1/10
⏭️ 跳过: 1/10

📈 覆盖率:

- 行覆盖率: 85% ✅
- 分支覆盖率: 72% ⚠️
- 函数覆盖率: 90% ✅

下一步:

- 修复失败测试: /testing:test-writer
- 完成流程: /testing:test-orchestrator --finalize

```

## 质量门控

| 维度 | 标准 | 阈值 |
|------|------|------|
| 测试通过率 | 所有测试通过 | 100% |
| 行覆盖率 | 行覆盖率达标 | ≥80% |
| 分支覆盖率 | 分支覆盖率达标 | ≥75% |
| 执行时间 | 测试执行快速 | <30s |
```
