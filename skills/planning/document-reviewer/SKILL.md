---
name: document-reviewer
description: |
  【触发条件】规划工作流第四步：审查所有章节，识别问题和改进点。
  【核心产出】输出 ${run_dir}/review-report.md，包含审查结果和修复建议。
  【不触发】内容编写（用 content-writer）、文档润色（用 document-polisher）。
allowed-tools: Read, Write, Bash, Task, Grep
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
  - name: model
    type: string
    required: false
    description: 使用的模型（codex/gemini），用于并行审查
---

# Document Reviewer - 文档审查原子技能

## 职责边界

- **输入**: `${run_dir}` + `${run_dir}/chapter-*.md` 文件路径
- **输出**:
  - 并行模式: `${run_dir}/review-{codex|gemini}.md`
  - 合并后: `${run_dir}/review-report.md`
- **单一职责**: 只做审查和问题识别，不做内容修改

## 执行流程

### Step 1: 读取章节

```bash
读取 ${run_dir}/chapter-*.md
汇总: 所有章节内容、步骤数量、引用的文件
```

### Step 2: 并行调用外部模型审查

**Codex 审查 (技术层面)**:

输出: `${run_dir}/review-codex.md`

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role reviewer \
  --workdir $PROJECT_DIR \
  --prompt "审查实施计划的所有章节。

章节目录路径: ${run_dir}/
请先读取 chapter-*.md 文件，然后进行审查。

评审维度:
1. 技术可行性 - 方案是否可实现
2. 安全风险 - 是否存在安全隐患
3. 性能影响 - 是否有性能问题
4. 错误处理 - 异常情况是否考虑周全
5. 事实核查 - 是否存在虚构内容

OUTPUT FORMAT:
## 审查报告 (技术)

### 严重问题 (必须修复)
- [章节N] 问题描述

### 一般问题 (建议修复)
- [章节N] 问题描述

### 通过项
- [章节N] 符合要求

### 评分: X/5
"
```

**Gemini 审查 (用户体验层面)**:

输出: `${run_dir}/review-gemini.md`

```bash
~/.claude/bin/codeagent-wrapper gemini \
  --role reviewer \
  --workdir $PROJECT_DIR \
  --prompt "审查实施计划的所有章节。

章节目录路径: ${run_dir}/
请先读取 chapter-*.md 文件，然后进行审查。

评审维度:
1. 用户体验 - 对用户是否友好
2. 可访问性 - 是否考虑无障碍
3. 响应式设计 - 是否适配多端
4. 设计一致性 - 是否风格统一
5. 文档清晰度 - 步骤是否易于理解

OUTPUT FORMAT:
## 审查报告 (UX)

### 严重问题 (必须修复)
- [章节N] 问题描述

### 一般问题 (建议修复)
- [章节N] 问题描述

### 通过项
- [章节N] 符合要求

### 评分: X/5
"
```

### Step 3: 综合审查结果

Claude 合并两份审查报告：

1. **去重** - 合并重复问题
2. **分级** - 按严重程度排序
3. **归因** - 标注问题来源（技术/UX）
4. **建议** - 添加修复建议

### Step 4: 输出审查报告

将结果写入 `${run_dir}/review-report.md`：

```markdown
# 审查报告: <任务名>

## 元信息

- 审查章节: chapter-1.md, chapter-2.md, ...
- 审查时间: [timestamp]
- 审查模型: Codex (技术) + Gemini (UX)

## 审查结果

### 整体评分

| 维度       | Codex 评分 | Gemini 评分 | 综合评分 |
| ---------- | ---------- | ----------- | -------- |
| 技术可行性 | X/5        | -           | X/5      |
| 用户体验   | -          | Y/5         | Y/5      |
| 文档质量   | X/5        | Y/5         | Z/5      |
| **总分**   | **A/5**    | **B/5**     | **C/5**  |

### 严重问题 (必须修复)

| #   | 章节      | 问题类型 | 问题描述     | 修复建议             |
| --- | --------- | -------- | ------------ | -------------------- |
| 1   | chapter-2 | 技术     | SQL 注入风险 | 使用参数化查询       |
| 2   | chapter-3 | UX       | 缺少加载状态 | 添加 loading spinner |

### 一般问题 (建议修复)

| #   | 章节      | 问题类型 | 问题描述       | 修复建议     |
| --- | --------- | -------- | -------------- | ------------ |
| 3   | chapter-1 | 技术     | 未处理边界情况 | 添加空值检查 |

### 通过项

- [chapter-1] 数据模型设计合理
- [chapter-2] API 设计符合 RESTful 规范

## 结论

- **严重问题数**: X
- **一般问题数**: Y
- **建议**: ✅ APPROVE / 🔄 REQUEST_CHANGES / 💬 COMMENT
- **理由**: [一句话说明]

---

下一步:

- 如有严重问题: 返回 content-writer 修复
- 如无严重问题: 调用 document-polisher 润色
```

## 返回值

执行完成后，返回：

```
文档审查完成。
输出文件: ${run_dir}/review-report.md

📊 审查结果:
- 严重问题: X 个
- 一般问题: Y 个
- Codex 评分: A/5
- Gemini 评分: B/5
- 综合评分: C/5

建议: {APPROVE|REQUEST_CHANGES|COMMENT}

下一步: {返回修复|继续润色}
```

## 质量门控 (Gate 4)

| 维度       | 标准             | 阈值 |
| ---------- | ---------------- | ---- |
| 严重问题数 | 严重问题必须为 0 | = 0  |
| 技术审查   | Codex 审查通过   | ≥4/5 |
| UX 审查    | Gemini 审查通过  | ≥4/5 |

- 严重问题 = 0: 继续下一阶段
- 严重问题 > 0: 返回 content-writer 修复
- 迭代 > 3: 触发断路器

## 约束

- 不做内容修改（交给 content-writer）
- 不做文档润色（交给 document-polisher）
- 审查意见仅供参考，最终决策由用户做出
- 必须使用双模型交叉审查
