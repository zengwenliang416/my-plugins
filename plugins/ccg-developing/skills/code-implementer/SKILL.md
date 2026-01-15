---
name: code-implementer
description: |
  【触发条件】开发工作流第四步：重构原型代码并实施到项目中。
  【核心产出】输出 ${run_dir}/changes.md，包含实际应用的代码变更清单。
  【不触发】原型生成（用 prototype-generator）、审计审查（用 audit-reviewer）。
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, LSP
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
---

# Code Implementer - 代码实施原子技能

## 职责边界

- **输入**: `run_dir`（包含 `${run_dir}/prototype.diff`）
- **输出**: 实际代码变更 + `${run_dir}/changes.md`
- **单一职责**: 只做代码重构和实施，不做分析或审计
- **核心原则**: Claude 是最终交付者，原型只是参考

## 执行流程

### Step 1: 读取原型

```bash
读取 ${run_dir}/prototype.diff
解析: 涉及的文件、变更内容、新增/删除
```

### Step 2: 原型审查（Claude 主导）

**不直接应用 diff，而是审查重构**：

| 检查项         | 动作           |
| -------------- | -------------- |
| 代码风格不一致 | 调整为项目风格 |
| 冗余代码       | 精简删除       |
| 类型定义缺失   | 补充类型       |
| 错误处理不足   | 增强处理       |
| 安全漏洞       | 修复           |
| 过度设计       | 简化           |

### Step 3: 使用 LSP 确认影响范围

修改前必须：

```bash
# 对每个要修改的符号
LSP findReferences <symbol> # 确认影响范围
LSP goToDefinition <symbol> # 确认定义位置
```

### Step 4: 逐步实施

```bash
for each 文件变更 in 重构后的方案:
    读取目标文件
    使用 Edit 工具应用变更
    验证变更正确性
```

### Step 5: 验证

```bash
# 类型检查（如适用）
if [ -f "tsconfig.json" ]; then
    npx tsc --noEmit
fi

# 语法检查（如适用）
if [ -f "package.json" ]; then
    npm run lint 2>/dev/null || true
fi
```

### Step 6: 输出变更清单

将实施结果写入 `.claude/developing/changes.md`：

```markdown
# 代码实施报告

## 实施概述

- 基于原型: prototype.diff
- 实施时间: [timestamp]
- 重构程度: [轻度/中度/重度]

## 变更清单

### 新增文件

| 文件       | 说明       | 行数 |
| ---------- | ---------- | ---- |
| src/new.ts | 新功能实现 | 50   |

### 修改文件

| 文件             | 变更类型 | 说明           |
| ---------------- | -------- | -------------- |
| src/foo.ts:20-35 | 新增方法 | 添加 newMethod |
| src/bar.ts:10    | 修改导入 | 引入新依赖     |

### 删除文件

无

## 与原型的差异

| 原型内容     | 实施调整         | 原因         |
| ------------ | ---------------- | ------------ |
| 直接抛出异常 | 包装为自定义错误 | 统一错误处理 |
| any 类型     | 具体类型定义     | 类型安全     |

## 验证结果

- [x] 类型检查通过
- [x] 语法检查通过
- [ ] 单元测试（待运行）

---

下一步: 调用 audit-reviewer 进行审计
```

## 返回值

执行完成后，返回：

```
代码实施完成。
输出文件: .claude/developing/changes.md
变更文件: X 个
新增行数: +Y
删除行数: -Z

✅ 类型检查: 通过
✅ 语法检查: 通过

下一步: 使用 /developing:audit-reviewer 进行审计
```

## 质量门控

- ✅ 所有变更已应用
- ✅ 类型检查通过
- ✅ 无破坏性变更（除非明确要求）
- ✅ 代码风格符合项目规范

## 约束

- **代码主权**: 不直接应用外部模型的 diff，必须审查重构
- 不做需求分析（交给 multi-model-analyzer）
- 不做原型生成（交给 prototype-generator）
- 不做审计（交给 audit-reviewer）
- 修改前必须用 LSP 确认影响范围
- 每个变更必须可追溯（记录在 changes.md）
