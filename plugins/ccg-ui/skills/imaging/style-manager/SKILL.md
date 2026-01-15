---
name: style-manager
description: |
  【触发条件】需要管理图片风格模板时使用：列出、查看、创建模板。
  【核心产出】模板配置信息或新模板文件。
  【不触发】直接生成图片、提示词构建。
allowed-tools: Read, Write, Glob
---

# Style Manager - 风格模板管理原子技能

## 职责边界

- **输入**: 模板操作命令（list/get/create）
- **输出**: 模板信息或新模板文件
- **单一职责**: 只做模板管理，不生成图片

## 模板存储位置

```
~/.claude/skills/imaging/image-orchestrator/templates/
├── product.json    # 产品图模板
├── poster.json     # 海报模板
├── social.json     # 社交媒体模板
├── thumbnail.json  # 缩略图模板
└── custom/         # 用户自定义模板
```

## 模板格式

```json
{
  "name": "模板名称",
  "description": "模板描述",
  "prompt_template": "提示词模板，支持 {{variable}} 占位符",
  "defaults": {
    "model_tier": "pro | flash",
    "resolution": "1K | 2K | 4K",
    "aspect_ratio": "1:1 | 16:9 | 9:16 | 4:5 | ...",
    "enable_grounding": true | false
  },
  "placeholders": {
    "variable_name": {
      "description": "变量描述",
      "example": "示例值"
    }
  }
}
```

## 操作命令

### 1. 列出模板

```
操作: list
输出: 所有可用模板的名称和描述
```

返回格式：

```
可用模板:
- product: 专业产品摄影风格
- poster: 海报设计风格
- social: 社交媒体配图风格
- thumbnail: 视频缩略图风格
```

### 2. 查看模板详情

```
操作: get
参数: template_name
输出: 模板完整配置
```

### 3. 创建自定义模板

```
操作: create
参数:
  name: 模板名称
  description: 模板描述
  prompt_template: 提示词模板
  defaults: 默认参数
输出: ~/.claude/skills/imaging/image-orchestrator/templates/custom/{name}.json
```

## 内置模板

| 模板      | 用途     | 默认参数        |
| --------- | -------- | --------------- |
| product   | 产品摄影 | pro, 4K, 4:5    |
| poster    | 海报设计 | pro, 4K, 16:9   |
| social    | 社交配图 | pro, 2K, 1:1    |
| thumbnail | 缩略图   | flash, 1K, 16:9 |

## 返回值

### list 操作

```
可用模板 (4 个):

| 模板名称  | 描述             | 默认模型 | 分辨率 |
|-----------|------------------|----------|--------|
| product   | 专业产品摄影风格 | pro      | 4K     |
| poster    | 海报设计风格     | pro      | 4K     |
| social    | 社交媒体配图     | pro      | 2K     |
| thumbnail | 视频缩略图       | flash    | 1K     |
```

### get 操作

```
模板详情: product

描述: 专业产品摄影风格
提示词模板:
  Create a professional, high-end product photography shot of {{product}}...

默认参数:
  - 模型: pro
  - 分辨率: 4K
  - 宽高比: 4:5

占位符:
  - product: 产品名称和描述
    示例: "a sleek black coffee maker with chrome accents"
```

## 约束

- 不生成图片（交给 image-generator）
- 不构建提示词（交给 prompt-builder）
- 自定义模板存储在 custom/ 子目录
- 不能修改内置模板
