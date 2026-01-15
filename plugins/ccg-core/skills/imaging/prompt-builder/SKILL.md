---
name: prompt-builder
description: |
  【触发条件】图片工作流第一步：构建优化后的图片生成提示词。
  【核心产出】输出 ${run_dir}/prompt.json，包含完整提示词配置。
  【不触发】直接生成图片（用 image-generator）、模板管理（用 style-manager）。
allowed-tools: Read, Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
  - name: description
    type: string
    required: true
    description: 用户图片描述
  - name: template
    type: string
    required: false
    description: 模板名称（可选）
  - name: use_default_prompt
    type: boolean
    required: false
    description: 是否使用默认提示词模板
---

# Prompt Builder - 提示词构建原子技能

## 职责边界

- **输入**: run_dir + 用户描述 + 模板名称（可选）+ 变量（可选）
- **输出**: `${run_dir}/prompt.json`
- **单一职责**: 只做提示词构建，不调用生成 API

## 执行流程

### Step 1: 解析输入

```
if 指定模板:
    加载模板配置
    替换模板变量
else:
    使用用户原始描述
```

### Step 2: 提示词优化

根据用户描述，自动优化提示词：

| 检测关键词 | 自动添加                                            |
| ---------- | --------------------------------------------------- |
| 产品、商品 | "professional product photography, studio lighting" |
| 海报、宣传 | "high-quality poster design, eye-catching"          |
| 头像、人物 | "portrait style, detailed facial features"          |
| 风景、自然 | "landscape photography, natural lighting"           |
| 卡通、手绘 | "cartoon style, hand-drawn illustration"            |

### Step 3: 参数推断

根据描述自动推断最佳参数：

```
if "4K" or "高清" in 描述:
    resolution = "4K"
    model = "pro"
elif "快速" or "草图" in 描述:
    resolution = "1K"
    model = "flash"
else:
    resolution = "4K"
    model = "pro"

if "横版" or "16:9" in 描述:
    aspectRatio = "16:9"
elif "竖版" or "9:16" in 描述:
    aspectRatio = "9:16"
elif "产品" in 描述:
    aspectRatio = "4:5"
else:
    aspectRatio = "1:1"
```

### Step 4: 输出文件

将构建结果写入 `${run_dir}/prompt.json`：

```json
{
  "prompt": "优化后的完整提示词",
  "negativePrompt": "排除内容（可选）",
  "model": "pro | flash",
  "aspectRatio": "1:1",
  "resolution": "4K",
  "systemInstruction": "系统指令（可选）",
  "template": "使用的模板名称（可选）",
  "variables": { "key": "value" },
  "metadata": {
    "originalInput": "用户原始输入",
    "timestamp": "ISO时间戳"
  }
}
```

## 默认提示词模板

当用户选择使用默认模板时，合并以下前缀：

```
请根据输入内容提取核心主题与要点，生成一张卡通风格的信息图：
- 采用手绘风格，横版（16:9）构图
- 加入少量简洁的卡通元素、图标或名人画像
- 所有图像、文字必须使用手绘风格
- 信息精简，突出关键词与核心概念，多留白

请根据输入的内容生成图片：
[用户输入]
```

## 返回值

执行完成后，返回：

```
提示词构建完成。
输出文件: ${run_dir}/prompt.json
模型: [pro/flash]
宽高比: [aspectRatio]
分辨率: [resolution]

下一步: 使用 /imaging:image-generator 生成图片
```

## 约束

- 不调用生成 API（交给 image-generator）
- 不管理模板（交给 style-manager）
- 输出文件路径使用 `${run_dir}/`，便于下游技能读取
- 必须保留原始输入用于追溯
