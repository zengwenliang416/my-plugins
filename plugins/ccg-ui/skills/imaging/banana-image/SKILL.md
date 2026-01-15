---
name: banana-image
description: |
  【触发条件】当用户要求生成图片、创建海报、制作缩略图、编辑图片时使用。
  关键词：生成图片、/image、产品图、海报、缩略图、4K、高清。
  【核心产出】高质量 AI 生成图片（最高 4K 分辨率）。
  【不触发】纯文本任务、代码生成、不涉及图片的设计讨论。
  【先问什么】若缺少：图片描述、分辨率偏好、宽高比，先提问补齐。
allowed-tools: Skill
---

# Banana Image - AI 图片生成

这是一个轻量级入口，委托给 `imaging/image-orchestrator` 执行。

## 使用方式

```
/banana-image [图片描述]
```

## 执行流程

1. 调用 `imaging:image-orchestrator` 技能
2. 传入用户图片描述
3. 由编排器协调原子技能完成生成

## 实际执行

**立即调用**:

```
Skill: imaging:image-orchestrator
参数:
  description: $ARGUMENTS
```

## 工作流阶段

| 阶段      | 原子技能        | 产出文件                    |
| --------- | --------------- | --------------------------- |
| 1. 提示词 | prompt-builder  | .claude/imaging/prompt.json |
| 2. 生成   | image-generator | .claude/imaging/images/     |
| 3. 模板   | style-manager   | 模板管理                    |

## 参数选项

| 选项 | 说明     | 示例                        |
| ---- | -------- | --------------------------- |
| -m   | 模型选择 | `-m pro` 或 `-m flash`      |
| -a   | 宽高比   | `-a 16:9` 或 `-a 1:1`       |
| -r   | 分辨率   | `-r 4K` 或 `-r 1080p`       |
| -t   | 使用模板 | `-t product` 或 `-t poster` |

## 历史记录

- v2.0: 重构为原子技能组合模式，资源整合到 imaging/
- v1.0: 独立子模块模式（已归档）
