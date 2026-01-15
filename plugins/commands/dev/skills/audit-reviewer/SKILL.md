---
name: audit-reviewer
description: |
  【触发条件】开发工作流第五步：审计代码变更，确保质量和安全。
  【核心产出】输出 ${run_dir}/audit-{model}.md，包含审计结果和修复建议。
  【不触发】代码实施（用 code-implementer）、原型生成（用 prototype-generator）。
allowed-tools: Read, Write, Bash, Task, Grep
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
  - name: model
    type: string
    required: true
    description: 审计模型（codex 或 gemini）
---

# Audit Reviewer - 审计审查原子技能

## 职责边界

- **输入**: `run_dir` + `model` 类型
- **输出**: `${run_dir}/audit-{codex|gemini}.md`
- **单一职责**: 只做审计审查，不做代码修改

## 执行流程

### Step 1: 读取变更清单

```bash
读取 ${run_dir}/changes.md
提取: 变更文件列表、新增/修改/删除的代码
```

### Step 2: 确定审计视角

根据模型类型确定审计重点：

| 模型   | 审计视角  | 关注点                                     |
| ------ | --------- | ------------------------------------------ |
| Codex  | 后端/安全 | 安全漏洞、性能问题、错误处理、边界条件     |
| Gemini | 前端/UX   | 可访问性、响应式设计、用户体验、设计一致性 |

### Step 3: 调用外部模型审计

```bash
~/.claude/bin/codeagent-wrapper {codex|gemini} \
  --role reviewer \
  --workdir $PROJECT_DIR \
  --prompt "
审查代码变更。

变更清单文件路径: .claude/developing/changes.md
请先读取该文件获取变更文件列表，然后读取实际变更的代码文件进行审查。

审查重点 ({后端/安全|前端/UX}):
- {安全漏洞检查|可访问性检查}
- {性能问题分析|响应式设计检查}
- {错误处理评估|用户体验评估}
- {边界条件测试|设计一致性}

输出格式:
1. 问题清单（按严重程度排序）
2. 每个问题的修复建议
3. 整体评分（1-5）
4. 是否建议合并
"
```

### Step 4: 结构化输出

将审计结果写入 `.claude/developing/audit-{model}.md`：

```markdown
# {Codex|Gemini} 审计报告

## 审计信息

- 模型: {codex|gemini}
- 视角: {后端/安全|前端/UX}
- 审计时间: [timestamp]

## 审计结果

### 整体评分

| 维度            | 评分    | 说明 |
| --------------- | ------- | ---- |
| 安全性/可访问性 | X/5     | ...  |
| 性能/响应式     | X/5     | ...  |
| 代码质量        | X/5     | ...  |
| 可维护性        | X/5     | ...  |
| **总分**        | **X/5** | ...  |

### 问题清单

#### Critical（必须修复）

| #   | 文件:行号     | 问题描述     | 修复建议       |
| --- | ------------- | ------------ | -------------- |
| 1   | src/foo.ts:25 | SQL 注入风险 | 使用参数化查询 |

#### Major（建议修复）

| #   | 文件:行号     | 问题描述   | 修复建议       |
| --- | ------------- | ---------- | -------------- |
| 2   | src/bar.ts:10 | 未处理异常 | 添加 try-catch |

#### Minor（可选修复）

| #   | 文件:行号      | 问题描述   | 修复建议           |
| --- | -------------- | ---------- | ------------------ |
| 3   | src/utils.ts:5 | 命名不清晰 | 改为更具描述性名称 |

### 亮点

- [值得肯定的实现]
- [良好的代码实践]

## 结论

- **建议**: ✅ APPROVE / 🔄 REQUEST_CHANGES / 💬 COMMENT
- **理由**: [一句话说明]

---

基于变更: changes.md
下一步: 综合审计结果决定是否交付
```

## 并行执行

支持双模型并行审计（由编排器协调）：

```bash
# 编排器中的调用
Task(audit-reviewer, model=codex, run_in_background=true) &
Task(audit-reviewer, model=gemini, run_in_background=true) &
wait
# 综合两份审计报告
```

## 返回值

执行完成后，返回：

```
{模型} 审计完成。
输出文件: .claude/developing/audit-{model}.md

📊 审计结果:
- Critical: X 个
- Major: Y 个
- Minor: Z 个
- 总分: A/5

建议: {APPROVE|REQUEST_CHANGES|COMMENT}

下一步: 等待所有审计完成后综合评估
```

## 质量门控

- ✅ 审计覆盖所有变更文件
- ✅ Critical 问题必须修复才能通过
- ✅ 总分 ≥ 3/5 才能通过
- ✅ 两个模型的审计意见综合考虑

## 约束

- 不做代码修改（交给 code-implementer）
- 不生成原型（交给 prototype-generator）
- 审计意见仅供参考，最终决策由用户做出
- 外部模型的审计需要 Claude 综合评估
