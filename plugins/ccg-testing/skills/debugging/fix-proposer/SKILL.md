---
name: fix-proposer
description: |
  【触发条件】调试工作流第四步：基于根因生成修复方案和验证方法。
  【核心产出】输出 ${run_dir}/fix-proposal.md，包含修复代码和验证步骤。
  【不触发】根因分析（用 root-cause-analyzer）、代码实施（用 developing:code-implementer）。
allowed-tools: Read, Write, Bash, Task, Grep, Glob, LSP
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
  - name: model
    type: string
    required: true
    description: 模型类型（codex 或 gemini）
---

# Fix Proposer - 修复方案原子技能

## 职责边界

- **输入**: `${run_dir}/root-cause.md`
- **输出**:
  - 并行模式: `${run_dir}/fix-proposal-{codex|gemini}.md`
  - 合并后: `${run_dir}/fix-proposal.md`
- **单一职责**: 只做修复方案设计，不做代码实施

## 执行流程

### Step 1: 读取根因报告

```bash
读取 ${run_dir}/root-cause.md
提取: 根因描述、问题代码、错误链、影响评估
```

### Step 2: 分析修复影响

使用 LSP 分析修复的影响范围：

```bash
# 查找所有调用点
LSP findReferences <problem_function>

# 分析依赖关系
LSP incomingCalls <problem_function>

# 检查类型定义
LSP hover <symbol>
```

### Step 3: 设计修复方案

**并行调用外部模型**:

**Codex 方案 (安全/性能视角)**:

输出: `${run_dir}/fix-proposal-codex.md`

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role fixer \
  --workdir $PROJECT_DIR \
  --prompt "基于以下根因分析文件，设计修复方案:

根因报告路径: ${run_dir}/root-cause.md
请先读取该文件，然后基于内容设计修复方案。

要求:
1. 考虑安全性和性能影响
2. 最小化代码变更
3. 保持向后兼容
4. 提供回归测试建议

OUTPUT FORMAT:
## 修复方案 (安全/性能视角)

### 方案描述
[修复思路]

### 修复代码
\`\`\`diff
- 原代码
+ 修复代码
\`\`\`

### 影响评估
[对系统的影响]

### 测试建议
[需要的测试]
"
```

**Gemini 方案 (可读性/维护性视角)**:

输出: `${run_dir}/fix-proposal-gemini.md`

```bash
~/.claude/bin/codeagent-wrapper gemini \
  --role fixer \
  --workdir $PROJECT_DIR \
  --prompt "基于以下根因分析文件，设计修复方案:

根因报告路径: ${run_dir}/root-cause.md
请先读取该文件，关注可读性和维护性设计修复方案。"
```

### Step 4: 综合修复方案

Claude 综合两份方案：

1. **取长补短** - 结合安全性和可读性
2. **最小变更** - 选择影响最小的方案
3. **完善测试** - 合并测试建议
4. **代码审查** - 检查修复代码质量

### Step 5: 设计验证步骤

```markdown
## 验证计划

### 单元测试

- [ ] 测试正常路径
- [ ] 测试异常路径
- [ ] 测试边界条件

### 集成测试

- [ ] 测试与上游模块集成
- [ ] 测试与下游模块集成

### 回归测试

- [ ] 原有功能不受影响
- [ ] 原有测试全部通过

### 手动验证

- [ ] 复现步骤不再触发错误
- [ ] 监控指标正常
```

### Step 6: 输出修复方案

将结果写入 `${run_dir}/fix-proposal.md`：

````markdown
# 修复方案: <问题简述>

## 元信息

- 基于根因: root-cause.md
- 设计时间: [timestamp]
- 分析模型: Codex + Gemini

## 根因回顾

**根因**: [一句话描述]
**位置**: `src/services/query.ts:50`
**问题**: [问题描述]

## 修复方案

### 方案概述

| 属性     | 值       |
| -------- | -------- | -------- | -------- |
| 修复类型 | 代码修复 | 配置修复 | 架构调整 |
| 变更范围 | 单文件   | 多文件   | 跨模块   |
| 风险等级 | 低       | 中       | 高       |
| 预计耗时 | X 分钟   |

### 修复代码

**文件**: `src/services/query.ts`

```diff
async function queryData(sql: string) {
  const conn = await pool.getConnection();
+ try {
    const result = await conn.query(sql);
    if (!result) {
-     return null;
+     return null;
    }
-   conn.release();
    return result;
+ } finally {
+   conn.release();  // 确保连接始终释放
+ }
}
```
````

### 修复说明

1. **添加 try-finally**: 确保无论正常返回还是异常，连接都会释放
2. **移除条件释放**: 将 `conn.release()` 移到 finally 块
3. **保持逻辑不变**: 返回值和异常行为不变

### 影响评估

| 影响点 | 评估     |
| ------ | -------- |
| 性能   | 无影响   |
| 兼容性 | 完全兼容 |
| 依赖   | 无新依赖 |

### 备选方案

如果上述方案不适用，考虑：

**方案 B: 使用 async-using**

```typescript
async function queryData(sql: string) {
  await using conn = await pool.getConnection();
  const result = await conn.query(sql);
  return result || null;
}
```

- 优点: 更简洁
- 缺点: 需要 TypeScript 5.2+

## 验证计划

### 单元测试

```typescript
describe("queryData", () => {
  it("should release connection on success", async () => {
    const result = await queryData("SELECT 1");
    expect(pool.activeConnections).toBe(0);
  });

  it("should release connection on null result", async () => {
    const result = await queryData("SELECT * FROM empty");
    expect(result).toBeNull();
    expect(pool.activeConnections).toBe(0);
  });

  it("should release connection on error", async () => {
    await expect(queryData("INVALID")).rejects.toThrow();
    expect(pool.activeConnections).toBe(0);
  });
});
```

### 集成测试

- [ ] 高并发场景下连接池稳定
- [ ] 长时间运行无连接泄漏

### 回归测试

```bash
npm test                    # 全量测试
npm run test:integration    # 集成测试
```

### 手动验证

1. 按原复现步骤操作
2. 检查连接池监控指标
3. 观察 30 分钟无连接泄漏

## 预防措施

### 代码层面

1. 添加 ESLint 规则检测资源泄漏
2. 在代码审查中重点关注资源释放

### 监控层面

1. 添加连接池使用率告警
2. 定期检查连接泄漏

### 流程层面

1. 更新代码规范文档
2. 添加相关最佳实践到知识库

---

下一步:

- 应用修复: /developing:code-implementer
- 直接修复: 按上述 diff 手动修改

```

## 返回值

执行完成后，返回：

```

修复方案完成。
输出文件: ${run_dir}/fix-proposal.md

🔧 修复概要:

- 修复类型: 代码修复
- 变更文件: 1 个
- 风险等级: 低

📝 修复要点:

- 添加 try-finally 确保资源释放
- 单元测试已设计

下一步:

- 应用修复: /developing:code-implementer
- 手动修复: 按 diff 修改代码

```

## 质量门控

| 维度 | 标准 | 阈值 |
|------|------|------|
| 修复代码 | 是否有具体代码 | ✅ |
| 影响评估 | 是否评估影响 | ✅ |
| 验证计划 | 是否有测试方案 | ✅ |
| 预防措施 | 是否有预防建议 | ✅ |

## 约束

- 不做代码实施（交给 developing:code-implementer）
- 修复方案必须最小化变更
- 必须提供验证方法
- 必须评估影响范围
```
