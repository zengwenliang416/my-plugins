---
name: gemini-cli
description: |
  【触发条件】当需要分析设计图片、提取视觉元素、识别 UI 组件时使用。
  【触发关键词】图片分析、设计截图、参考图、UI 截图、视觉元素、配色提取、Gemini
  【核心能力】输出图片的设计分析结果（颜色、布局、组件、字体、图标）
  【不触发】代码生成、文本任务、非图片分析（改用 dev/gemini-cli）
  【注意】专注于视觉分析，每轮聚焦一个维度
allowed-tools:
  - Bash
  - Read
---

# Gemini CLI - UI 设计视觉分析

Design image analyzer via `gemini-cli`. **设计截图/参考图** → 结构化设计规格 → 供其他 Skills 使用。Context limit: **32k tokens**.

## 执行命令

```bash
# 首次调用（获取 SESSION_ID）
gemini-cli chat --image "${image_path}" --prompt "Your analysis request"

# 多轮对话（继续会话）
gemini-cli chat --image "${image_path}" --session "${SESSION_ID}" --prompt "Continue..."
```

## 强制协作流程

### Step 1: 首轮分析

```bash
gemini-cli chat --image "${image_path}" --prompt "
你是一位资深 UI/UX 设计师。请分析这张设计图：
1. 界面类型（网页、App、Dashboard 等）
2. 设计语言（Material、Apple HIG、扁平化等）
3. 视觉风格（极简、信息密集、装饰性）
4. 品牌调性
"
```

- 获取 SESSION_ID
- 记录整体风格判断

### Step 2: 深入分析（多轮）

```bash
gemini-cli chat --image "${image_path}" --session "${SESSION_ID}" --prompt "
继续分析：[配色/组件/字体/图标/布局]
请给出具体数值（HEX、px、rem）。
"
```

- ⚠️ 每轮聚焦单一维度
- 保持 SESSION_ID 连续

### Step 3: Claude 整合

1. 汇总 Gemini 多轮分析结果
2. 转换为可执行的设计规格（Tailwind 配置等）
3. 验证数据一致性
4. 输出结构化文档

## 分析维度

| 维度 | 分析内容 | 输出格式 |
|------|----------|----------|
| 整体风格 | 界面类型、设计语言、品牌调性 | 文本描述 |
| 配色系统 | 主色、辅助色、背景、文字、功能色 | HEX 值 |
| UI 组件 | 按钮、卡片、输入框等样式 | 圆角/阴影/边框 |
| 字体排版 | 字体家族、字号层级、字重 | px/rem |
| 图标系统 | 图标类型、粗细、推荐图标库 | 描述 + 推荐 |
| 布局规格 | 栅格、间距、容器宽度 | px |

## 会话管理

```bash
# 第一次调用 - 获取 SESSION_ID
result=$(gemini-cli chat --image "${image_path}" --prompt "..." 2>&1)
SESSION_ID=$(echo "$result" | grep -oE 'session[=:]\s*[a-zA-Z0-9-]+' | head -1 | cut -d= -f2)

# 后续调用 - 继续会话
gemini-cli chat --image "${image_path}" --session "$SESSION_ID" --prompt "..."
```

## 上下文管理 (32k 限制)

| 策略 | 方法 |
|------|------|
| 单维度分析 | 一次只分析一个方面（配色/组件/字体） |
| 结构化输出 | 要求 Gemini 输出表格或列表格式 |
| 多轮递进 | 整体 → 配色 → 组件 → 字体 → 图标 分步 |
| 会话续接 | 使用 `--session` 保持上下文 |

## 强制约束

| 必须执行 | 禁止事项 |
|----------|----------|
| ✅ 保存 SESSION_ID | ❌ 不传图片路径 |
| ✅ 每轮聚焦单一维度 | ❌ 一次问太多问题 |
| ✅ 输出用 HEX/px 标准格式 | ❌ 使用模糊的颜色描述 |
| ✅ Claude 整合后再输出 | ❌ 直接使用 Gemini 原始输出 |

## 输出格式

```json
{
  "success": true,
  "SESSION_ID": "uuid",
  "analysis": "Gemini 的分析结果"
}
```
