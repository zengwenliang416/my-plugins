---
name: speech-ppt-unified-style
description: |
  【触发条件】当用户需要为中文演讲场景生成 PPT 大纲、统一风格的图片提示时使用。
  【核心产出】输出：分页面 PPT 结构、讲稿提纲、banana-image 可用的 image_prompt。
  【不触发】不用于：通用 PPT 制作（改用 pptx）、纯文档写作（改用 content-writer）。
  【先问什么】若缺少：演讲主题、目标受众、演讲时长，先提问补齐。
allowed-tools: Read, mcp__banana-image__generate_image, mcp__sequential-thinking__sequentialthinking
---

# Speech PPT Unified Style - 演讲型统一风格 PPT 生成助手

## 概述

这个 Skill 用于在用户只提供「一个主题」或「一小段文字」时，自动设计一套 **适合现场演讲、风格统一、结构清晰** 的 PPT 方案。

### 核心特点

- 默认输出 **中文**，面向比赛路演、分享会、教学场景等演讲型 PPT
- 内置两个核心内容模块：
  - **内容构思的三大深坑**：痛点不痛、解决方案自说自话、价值空洞
  - **表达呈现的四大雷区**：PPT 当成演讲稿、语言技术化、缺乏故事线、演示环节薄弱
- 为每一页 PPT 生成适合 `banana-image` 使用的 `image_prompt`，方便统一视觉风格

## 触发场景

当用户提出的请求类似于：

- 「帮我做一个关于 AI 项目汇报避坑的演讲 PPT」
- 「给一个主题，帮我设计一套适合现场讲解的 PPT，并帮我想好图片」
- 「我只有一个大概想法，想讲'内容构思的三大深坑和表达呈现的四大雷区'，帮我出完整大纲」
- 涉及演讲、路演、项目汇报、PPT 设计、坑/雷区/避坑/表达方式等关键词

且工作环境中可能已接入 `banana-image` MCP 时，你应该启用本 Skill。

## MCP 工具说明

| 工具                                | 用途                           |
| ----------------------------------- | ------------------------------ |
| `mcp__banana-image__generate_image` | 根据 image_prompt 生成页面配图 |
| `mcp__sequential-thinking__*`       | 深度分析演讲结构和逻辑         |

## 工作流程

### 1. 识别输入类型

**主题型输入**：

- 例如：「AI 编程大赛演讲避坑指南」

**描述型输入**：

- 例如：「想教学生如何避免 AI 项目汇报里的内容和 PPT 表达问题」

**处理方式**：

- 简短假设受众与时长（例如：评委/学生，20–30 分钟）
- 不要频繁向用户追问细节，除非必要

### 2. 确定是否使用默认结构

**使用默认结构的条件**（见 `content-structure.md`）：

- 主题与「演讲、项目汇报、内容表达、PPT、路演」相关
- 提到坑、雷区、避坑、表达方式等关键词

**调整结构的条件**：

- 主题完全不同（如技术原理分享）
- 保留「Why–How–What」故事结构和统一输出格式
- 适度简化或调整「三大深坑 / 四大雷区」模块

### 3. 生成输出

1. 先给出「整体结构概览」
2. 按每一页 PPT 输出，严格使用 `output-format.md` 中的字段
3. 遵循 `visual-rules.md` 中的视觉规范生成 `image_prompt`

### 4. 图片生成（可选）

如果用户需要实际生成图片，使用 banana-image：

```
mcp__banana-image__generate_image(
  prompt="<image_prompt内容>",
  model_tier="pro",
  resolution="2k",
  aspect_ratio="16:9"
)
```

## 参考文档

- `output-format.md` - 逐页输出格式规范
- `content-structure.md` - 默认内容结构模板
- `visual-rules.md` - 视觉与 banana-image 协同规则
- `example-slides.md` - 完整示例输出

## 通用约束

无论什么主题，始终保证：

| 要求            | 说明                           |
| --------------- | ------------------------------ |
| key_points 简洁 | 2-4 条短句，不变成小作文       |
| 详细说明位置    | 放在 speaker_notes             |
| 语言风格        | 口语化、易讲易记               |
| 整体结构        | 遵循「Why → How → What」故事线 |

## 示例用法

```
/skill:speech-ppt-unified-style
帮我设计一个关于"AI编程大赛项目汇报避坑指南"的演讲PPT
```

输出：直接生成完整的 PPT 页面列表，不需要解释过程。
