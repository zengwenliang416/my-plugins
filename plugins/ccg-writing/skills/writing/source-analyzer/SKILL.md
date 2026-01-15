---
name: source-analyzer
description: |
  【触发条件】写作工作流第一步：分析素材来源，提取核心信息。
  【核心产出】输出 ${run_dir}/analysis.md，包含主题分析、关键点、素材清单。
  【不触发】直接写作请求（用 writer-agent）、提纲生成（用 outliner）。
allowed-tools: Read, Write, WebSearch, WebFetch, mcp__exa__web_search_exa, mcp__ddg-search__search
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
---

# Source Analyzer - 素材分析原子技能

## 职责边界

- **输入**: `${run_dir}` + 主题描述 或 素材文件路径
- **输出**: `${run_dir}/analysis.md`
- **单一职责**: 只做素材分析，不生成提纲或正文

## 执行流程

### Step 1: 解析输入

```
if 输入是文件路径:
    读取文件内容作为素材
else:
    将输入作为主题描述
```

### Step 2: 素材收集

根据主题，使用搜索工具收集相关资料：

1. 使用 `mcp__exa__web_search_exa` 进行语义搜索（优先）
2. 使用 `mcp__ddg-search__search` 补充搜索
3. 使用 `WebFetch` 获取关键页面详情

### Step 3: 结构化分析

分析收集的素材，提取：

- **核心主题**: 一句话概括
- **关键论点**: 3-5 个核心观点
- **素材清单**: 引用来源及其价值
- **目标受众**: 适合的读者群体
- **写作角度**: 建议的切入点

### Step 4: 输出文件

将分析结果写入 `${run_dir}/analysis.md`：

```markdown
# 素材分析报告

## 主题

[一句话概括]

## 关键论点

1. [论点1]
2. [论点2]
3. [论点3]

## 素材清单

| 来源 | 类型 | 核心价值 | 链接 |
| ---- | ---- | -------- | ---- |
| ...  | ...  | ...      | ...  |

## 目标受众

[受众描述]

## 建议写作角度

- 角度1: [描述]
- 角度2: [描述]

---

生成时间: [timestamp]
下一步: 调用 outliner 生成提纲
```

## 返回值

执行完成后，返回：

```
素材分析完成。
输出文件: .claude/writing/analysis.md
下一步: 使用 /writing:outliner 生成提纲
```

## 约束

- 不做提纲生成（交给 outliner）
- 不做正文写作（交给 writer-agent）
- 素材清单必须包含引用来源
- 输出文件路径固定，便于下游技能读取
