# Execution Strategies - 执行策略指南

## 执行模式对比

| 模式        | 描述                         | 适用场景     | 风险控制 |
| ----------- | ---------------------------- | ------------ | -------- |
| analyze     | 仅分析，不执行               | 评估重构影响 | 最安全   |
| auto        | 自动执行低风险，高风险需确认 | 日常重构     | 平衡     |
| interactive | 每个操作逐一确认             | 高风险重构   | 最严格   |

---

## 模型路由规则

### 后端重构 → Codex CLI

**适用文件类型**:

- `.ts`, `.js` (非 JSX/TSX)
- `.py`, `.go`, `.java`, `.rs`
- `.sql`, `.graphql`

**适用重构类型**:

- Extract Method
- Extract Class
- Move Method
- Introduce Parameter Object
- 数据库相关重构

### 前端重构 → Gemini CLI

**适用文件类型**:

- `.tsx`, `.jsx`
- `.vue`, `.svelte`
- `.css`, `.scss`, `.less`
- `.html`

**适用重构类型**:

- Extract Component
- CSS Optimization
- Accessibility Fix
- State Refactoring
- 响应式布局调整

---

## 执行顺序策略

### 依赖排序原则

```
1. 被依赖的模块先重构
2. 叶子节点模块优先
3. 核心模块最后重构
4. 同优先级按风险排序（低风险先）
```

### 示例

```
Module A (核心) ← Module B ← Module C (叶子)
                ↖ Module D (叶子)

执行顺序: C → D → B → A
```

---

## 验证策略

### 每次重构后必须验证

| 检查项   | 方法                      | 失败处理 |
| -------- | ------------------------- | -------- |
| 语法检查 | `tsc --noEmit` / `eslint` | 回滚     |
| 类型检查 | `tsc --noEmit`            | 回滚     |
| 单元测试 | `npm test -- --related`   | 警告     |
| 导入检查 | LSP + auggie-mcp          | 修复     |

### 批量执行后验证

```bash
# TypeScript 项目
npm run typecheck
npm run lint
npm test

# Python 项目
mypy .
pytest

# Go 项目
go build ./...
go test ./...
```

---

## 回滚机制

### 自动回滚条件

1. 语法检查失败
2. 类型检查失败
3. 核心测试失败

### 回滚步骤

```bash
# 1. 使用 git 恢复
git checkout -- ${modified_files}

# 2. 记录失败原因
echo "Rollback: ${reason}" >> ${run_dir}/rollback.log

# 3. 继续下一个重构（如果独立）
continue_next_refactoring()
```

---

## 安全检查清单

### 执行前检查

- [ ] 工作目录干净（无未提交变更）
- [ ] 测试套件通过
- [ ] 有足够的磁盘空间
- [ ] Git 可用（用于回滚）

### 高风险重构额外检查

- [ ] 用户已确认
- [ ] 有完整的影响分析
- [ ] 有回滚计划
- [ ] 非生产环境

---

## Codex CLI 调用模板

```
Skill(skill="codex-cli", args="--role refactoring-expert --prompt '
## 角色
你是代码重构专家，精通安全重构技术。

## 任务
执行以下重构操作：

## 重构详情
- 类型: ${type}
- 目标文件: ${file}
- 目标符号: ${symbol}
- 操作步骤: ${steps}

## 约束
- 保持功能行为不变
- 不引入新的依赖
- 保持代码风格一致
- 输出 unified diff 格式

## 输出格式
仅输出 diff，不要其他解释
' --sandbox read-only")
```

---

## Gemini CLI 调用模板

```
Skill(skill="gemini-cli", args="--role frontend-refactor --prompt '
## 角色
你是前端重构专家，精通组件设计和 CSS 架构。

## 任务
执行以下前端重构操作：

## 重构详情
- 类型: ${type}
- 目标组件: ${component}
- 目标文件: ${file}
- 操作步骤: ${steps}

## 约束
- 保持组件功能不变
- 保持样式一致性
- 确保可访问性
- 确保响应式兼容

## 输出格式
输出重构后的完整组件代码
'")
```

---

## 错误处理

| 错误类型          | 处理方式                    |
| ----------------- | --------------------------- |
| Codex/Gemini 超时 | 重试 1 次，失败则跳过       |
| Diff 格式错误     | 尝试解析，失败则跳过        |
| 文件不存在        | 跳过并记录                  |
| 权限错误          | 停止执行，通知用户          |
| 测试失败          | 警告，继续执行（auto 模式） |

---

## 参考资源

- Martin Fowler - Refactoring: Improving the Design of Existing Code
- Michael Feathers - Working Effectively with Legacy Code
- Kent Beck - Test-Driven Development
