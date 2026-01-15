---
name: hypothesis-generator
description: |
  【触发条件】调试工作流第二步：基于症状生成可能的原因假设。
  【核心产出】输出 ${run_dir}/hypotheses.md，包含假设列表和验证方法。
  【不触发】症状收集（用 symptom-collector）、根因分析（用 root-cause-analyzer）。
allowed-tools: Read, Write, Bash, Task, Grep, mcp__auggie-mcp__codebase-retrieval
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

# Hypothesis Generator - 假设生成原子技能

## 职责边界

- **输入**: `${run_dir}/symptoms.md`
- **输出**:
  - 并行模式: `${run_dir}/hypotheses-{codex|gemini}.md`
  - 合并后: `${run_dir}/hypotheses.md`
- **单一职责**: 只做假设生成和验证方法设计，不做验证执行

## 执行流程

### Step 1: 读取症状报告

```bash
读取 ${run_dir}/symptoms.md
提取: 错误现象、堆栈跟踪、相关代码位置、环境信息
```

### Step 2: 错误分类

根据症状判断错误类型：

| 错误类型   | 特征                   | 常见原因       |
| ---------- | ---------------------- | -------------- |
| 运行时错误 | TypeError, NullPointer | 类型问题、空值 |
| 逻辑错误   | 结果不符合预期         | 条件判断、算法 |
| 并发问题   | 偶发、难复现           | 竞态、死锁     |
| 资源问题   | OOM、超时              | 泄漏、耗尽     |
| 配置问题   | 环境差异               | 配置错误、缺失 |

### Step 3: 并行调用外部模型分析

**Codex 分析 (后端/逻辑视角)**:

输出: `${run_dir}/hypotheses-codex.md`

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role debugger \
  --workdir $PROJECT_DIR \
  --prompt "基于以下症状文件，生成可能的原因假设:

症状报告路径: ${run_dir}/symptoms.md
请先读取该文件，然后基于内容分析。

要求:
1. 从技术实现角度分析
2. 考虑代码逻辑、数据流、异常处理
3. 每个假设包含验证方法
4. 按可能性排序

OUTPUT FORMAT:
## 假设列表 (后端视角)

### 假设 1: [假设名称]
- 可能性: 高/中/低
- 依据: [为什么这么认为]
- 验证方法: [如何验证]
- 预期结果: [验证通过/不通过的表现]
"
```

**Gemini 分析 (前端/用户视角)**:

输出: `${run_dir}/hypotheses-gemini.md`

```bash
~/.claude/bin/codeagent-wrapper gemini \
  --role debugger \
  --workdir $PROJECT_DIR \
  --prompt "基于以下症状文件，生成可能的原因假设:

症状报告路径: ${run_dir}/symptoms.md
请先读取该文件，然后基于内容分析。

要求:
1. 从用户交互角度分析
2. 考虑输入验证、状态管理、UI 渲染
3. 每个假设包含验证方法
4. 按可能性排序

OUTPUT FORMAT:
## 假设列表 (前端视角)
...
"
```

### Step 4: 综合假设

Claude 综合两份分析：

1. **去重合并** - 相似假设合并
2. **交叉验证** - 两个模型都提到的假设优先级更高
3. **排序** - 按可能性和验证难度排序
4. **设计验证计划** - 为每个假设设计具体验证步骤

### Step 5: 输出假设报告

将结果写入 `${run_dir}/hypotheses.md`：

````markdown
# 假设报告: <问题简述>

## 元信息

- 基于症状: symptoms.md
- 分析时间: [timestamp]
- 分析模型: Codex + Gemini

## 错误分类

- **类型**: 运行时错误 | 逻辑错误 | 并发问题 | 资源问题 | 配置问题
- **复杂度**: 简单 | 中等 | 复杂
- **预估原因数**: 单一 | 多因素

## 假设列表

### 假设 1: [假设名称] ⭐ 高优先级

| 属性   | 值                  |
| ------ | ------------------- |
| 可能性 | 高 (80%)            |
| 来源   | Codex + Gemini 一致 |
| 分类   | 运行时错误          |

**依据**:

- [证据 1: 从症状中的哪里看出]
- [证据 2: 代码分析结论]

**验证方法**:

```bash
# 验证命令或步骤
```
````

**预期结果**:

- 如果假设成立: [表现]
- 如果假设不成立: [表现]

---

### 假设 2: [假设名称]

| 属性   | 值       |
| ------ | -------- |
| 可能性 | 中 (50%) |
| 来源   | Codex    |
| 分类   | 逻辑错误 |

**依据**:

- [证据]

**验证方法**:

```bash
# 验证命令或步骤
```

---

### 假设 3: [假设名称]

...

## 验证计划

按以下顺序验证（由易到难、由高概率到低概率）：

| 顺序 | 假设   | 验证难度 | 预计时间 |
| ---- | ------ | -------- | -------- |
| 1    | 假设 1 | 低       | 5 分钟   |
| 2    | 假设 2 | 中       | 15 分钟  |
| 3    | 假设 3 | 高       | 30 分钟  |

## 排除的假设

以下假设因证据不足被排除：

- [假设 X]: [排除原因]

---

下一步: 调用 root-cause-analyzer 进行根因分析

```

## 返回值

执行完成后，返回：

```

假设生成完成。
输出文件: ${run_dir}/hypotheses.md

🔍 假设概要:

- 总假设数: X
- 高优先级: Y
- 错误类型: {运行时|逻辑|并发|资源|配置}

⭐ 最可能假设: [假设名称] (可能性: Z%)

下一步: 使用 /debugging:root-cause-analyzer 验证假设

```

## 质量门控

| 维度 | 标准 | 阈值 |
|------|------|------|
| 假设数量 | 生成足够的假设 | ≥3 |
| 验证方法 | 每个假设有验证方法 | 100% |
| 排序合理 | 按可能性排序 | ✅ |
| 双模型覆盖 | Codex + Gemini 都分析 | ✅ |

## 约束

- 不做症状收集（交给 symptom-collector）
- 不做验证执行（交给 root-cause-analyzer）
- 假设必须有依据，不凭空猜测
- 外部模型输出需要 Claude 综合验证
```
