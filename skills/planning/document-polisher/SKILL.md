---
name: document-polisher
description: |
  【触发条件】规划工作流第五步：统一格式风格，生成最终文档。
  【核心产出】输出 ${run_dir}/final.md，包含合并后的完整计划。
  【不触发】文档审查（用 document-reviewer）、任务规划（用 task-planner）。
allowed-tools: Read, Write, Edit
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
---

# Document Polisher - 文档润色原子技能

## 职责边界

- **输入**: `${run_dir}` + `${run_dir}/chapter-*.md` + `${run_dir}/review-report.md` 文件路径
- **输出**: `${run_dir}/final.md`
- **单一职责**: 只做格式统一和合并，不做内容审查

## 执行流程

### Step 1: 读取输入

```bash
读取 ${run_dir}/outline.md
读取 ${run_dir}/chapter-*.md
读取 ${run_dir}/review-report.md (可选)
```

### Step 2: 格式统一

确保所有章节格式一致：

| 检查项   | 标准                                      |
| -------- | ----------------------------------------- | ------ |
| 标题层级 | H1 用于文档标题，H2 用于章节，H3 用于步骤 |
| 代码块   | 统一使用三反引号，指定语言                |
| 列表风格 | 统一使用 - 无序列表                       |
| 表格对齐 | 统一使用                                  | 分隔符 |
| 链接格式 | 统一使用 [text](url) 格式                 |

### Step 3: 合并章节

将所有章节合并为一个完整文档：

1. **添加目录** - 自动生成 TOC
2. **添加过渡** - 章节间添加过渡说明
3. **统一编号** - 确保步骤编号连续

### Step 4: Ralph Loop 适配 (可选)

如果需要 `--loop` 模式执行：

```markdown
## 完成条件

当以下条件全部满足时，输出 <promise>COMPLETE</promise>:

1. <条件1>
2. <条件2>
3. 所有测试通过
```

### Step 5: 输出最终文档

将结果写入 `${run_dir}/final.md`：

````markdown
# 📋 实施计划: <任务名>

## 目录

1. [概览](#概览)
2. [阶段 1: 数据模型](#阶段-1-数据模型)
3. [阶段 2: API 层](#阶段-2-api-层)
4. [风险与缓解](#风险与缓解)
5. [完成条件](#完成条件)

## 概览

| 属性       | 值            |
| ---------- | ------------- |
| 任务名     | <任务描述>    |
| 总子任务数 | N             |
| 预估复杂度 | X/5           |
| 关键路径   | A → B → C → D |
| 审查状态   | ✅ APPROVED   |

## 阶段 1: 数据模型

### Task 1.1: 创建 Comment 模型

- [ ] **操作**: 定义 Comment 接口
- **文件**: `src/models/comment.ts`
- **代码**:
  ```typescript
  export interface Comment {
    id: string;
    // ...
  }
  ```
````

- **验证**: `npx tsc --noEmit`
- **完成条件**: 编译通过

### Task 1.2: 更新 Prisma Schema

- [ ] **操作**: 添加 Comment 模型
- **文件**: `prisma/schema.prisma`
- **验证**: `npx prisma validate`
- **完成条件**: Schema 无错误

## 阶段 2: API 层

...

## 风险与缓解

| 风险 | 影响     | 缓解措施 |
| ---- | -------- | -------- |
| ...  | 高/中/低 | ...      |

## 完成条件

当以下条件全部满足时，任务完成:

1. 所有 Task 标记为 ✅
2. 类型检查通过
3. 测试覆盖率 > 80%
4. 代码审查通过

---

生成时间: [timestamp]
产出文件: outline.md, materials.md, chapter-\*.md, review-report.md, final.md

```

## 返回值

执行完成后，返回：

```

文档润色完成。
输出文件: ${run_dir}/final.md

📄 文档概要:

- 总阶段数: X
- 总任务数: Y
- 文档字数: Z

下一步: 等待用户确认并交付

```

## 质量门控 (Gate 5)

| 维度 | 标准 | 阈值 |
|------|------|------|
| 格式一致 | 所有章节格式是否统一 | ✅ |
| 风格统一 | 语言风格是否一致 | ✅ |
| 可执行性 | 是否可直接用于执行 | ✅ |
| 目录正确 | TOC 链接是否有效 | ✅ |

- 全部通过: 继续交付
- 任一不通过: 迭代润色
- 迭代 > 3: 触发断路器

## 约束

- 不做内容修改（只做格式调整）
- 不做审查判断（交给 document-reviewer）
- 保持原有内容的完整性
- 目录链接必须可用
```
