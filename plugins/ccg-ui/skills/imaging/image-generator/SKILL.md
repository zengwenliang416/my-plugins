---
name: image-generator
description: |
  【触发条件】图片工作流第二步：调用 Gemini API 生成图片。
  【核心产出】输出图片文件到 ${run_dir}/images/ 目录。
  【不触发】提示词构建（用 prompt-builder）、模板管理（用 style-manager）。
allowed-tools: Read, Write, Bash
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
---

# Image Generator - 图片生成原子技能

## 职责边界

- **输入**: run_dir（包含 `${run_dir}/prompt.json`）或直接提示词
- **输出**: `${run_dir}/images/*.png` + `${run_dir}/result.json`
- **单一职责**: 只做 API 调用和图片保存

## 环境要求

```bash
# 必需的环境变量
export GEMINI_API_KEY="your-api-key"

# 脚本位置
~/.claude/skills/imaging/image-orchestrator/scripts/banana_image_exec.ts
```

## 执行流程

### Step 1: 读取配置

```bash
PROMPT_FILE="${run_dir}/prompt.json"
if [ -f "$PROMPT_FILE" ]; then
    PROMPT=$(jq -r '.prompt' "$PROMPT_FILE")
    MODEL=$(jq -r '.model // "pro"' "$PROMPT_FILE")
    ASPECT_RATIO=$(jq -r '.aspectRatio // "1:1"' "$PROMPT_FILE")
    RESOLUTION=$(jq -r '.resolution // "4K"' "$PROMPT_FILE")
else
    # 使用传入的参数
    PROMPT="${PROMPT:-}"
    MODEL="${MODEL:-pro}"
    ASPECT_RATIO="${ASPECT_RATIO:-1:1}"
    RESOLUTION="${RESOLUTION:-4K}"
fi
```

### Step 2: 创建输出目录

```bash
mkdir -p "${run_dir}/images"
```

### Step 3: 调用生成脚本

```bash
npx tsx ~/.claude/skills/imaging/image-orchestrator/scripts/banana_image_exec.ts \
  -p "$PROMPT" \
  -m "$MODEL" \
  -a "$ASPECT_RATIO" \
  -r "$RESOLUTION" \
  -o "${run_dir}/images" \
  $EXTRA_FLAGS
```

### Step 4: 处理结果

解析脚本输出的 JSON，提取图片路径：

```json
{
  "success": true,
  "images": [
    {
      "path": "${run_dir}/images/banana_pro_xxx.png",
      "model": "gemini-3-pro-image-preview"
    }
  ]
}
```

### Step 5: 输出结果文件

将生成结果写入 `${run_dir}/result.json`：

```json
{
  "success": true,
  "images": [
    {
      "path": "${run_dir}/images/banana_pro_xxx.png",
      "model": "gemini-3-pro-image-preview",
      "prompt": "使用的提示词"
    }
  ],
  "metadata": {
    "model": "pro",
    "aspectRatio": "16:9",
    "resolution": "4K",
    "duration": 5234,
    "timestamp": "ISO时间戳"
  },
  "promptFile": "${run_dir}/prompt.json"
}
```

## 模型选择

| 模型  | 速度 | 分辨率  | 适用场景           |
| ----- | ---- | ------- | ------------------ |
| flash | 2-3s | ≤1024px | 快速草图、迭代     |
| pro   | 5-8s | ≤4K     | 最终交付、专业作品 |

## 错误处理

| 错误           | 处理                        |
| -------------- | --------------------------- |
| API Key 未设置 | 返回错误，提示设置环境变量  |
| 内容被过滤     | 返回错误，建议调整描述      |
| API 调用失败   | 重试 1 次，仍失败则返回错误 |
| 超时           | 30 秒超时，返回错误         |

## 返回值

执行完成后，返回：

```
图片生成完成。
输出文件:
- ${run_dir}/images/banana_pro_xxx.png
- ${run_dir}/result.json

模型: [gemini-3-pro-image-preview]
耗时: [X.X] 秒

下一步:
- 查看生成的图片
- 如需调整，修改 prompt.json 后重新生成
```

## 约束

- 不做提示词优化（交给 prompt-builder）
- 不管理模板（交给 style-manager）
- 复用现有 banana_image_exec.ts 脚本
- 必须输出 result.json 用于追溯
- 所有路径使用 `${run_dir}/` 前缀
