---
name: gemini-cli
description: |
  【触发条件】当需要分析设计图片、提取视觉元素、识别 UI 组件时使用。
  【核心产出】输出图片的设计分析结果（颜色、布局、组件、字体、图标）
  【不触发】代码生成、文本任务、非图片分析（改用 dev/gemini-cli）
  【先问什么】image_path 参数缺失时，询问要分析的设计图片路径
allowed-tools:
  - Bash
  - Read
---

# Gemini CLI - UI 设计视觉分析

Design image analyzer via `gemini` CLI or `codeagent-wrapper gemini`. **设计截图/参考图** → 结构化设计规格 → 供其他 Skills 使用。Context limit: **32k tokens**.

## 执行命令

### 🚨 统一使用 codeagent-wrapper（推荐）

```bash
# 图片分析 - 在 prompt 中提及图片路径，Gemini 会自动使用 read_file 工具
~/.claude/bin/codeagent-wrapper gemini --prompt "请分析这张设计图片 ${image_path}：[你的分析请求]"

# 文本任务 - 可指定角色
~/.claude/bin/codeagent-wrapper gemini --role frontend --prompt "你的任务描述"
```

### 原生 gemini 命令（仅供参考）

```bash
# 注意：prompt 必须用 -p 参数传递，不能直接放在命令后面
gemini -y -p "请分析这张设计图片 ${image_path}：[你的分析请求]"
```

## 强制协作流程

### Step 1: 首轮分析（图片）

```bash
# 使用 codeagent-wrapper 分析图片
~/.claude/bin/codeagent-wrapper gemini --prompt "请分析这张设计图片 ${image_path}：

你是一位资深 UI/UX 设计师。请分析：
1. 界面类型（网页、App、Dashboard 等）
2. 设计语言（Material、Apple HIG、扁平化等）
3. 视觉风格（极简、信息密集、装饰性）
4. 品牌调性
"
```

- 记录整体风格判断
- 保存分析结果
- 保存 SESSION_ID 用于后续调用

### Step 2: 深入分析（多轮）

```bash
# 继续分析配色/组件/字体/图标/布局，使用 --session 保持上下文
~/.claude/bin/codeagent-wrapper gemini --session "$SESSION_ID" --prompt "请继续分析这张图片 ${image_path}，聚焦于配色系统：
请给出具体数值（HEX、px、rem）。
"
```

- ⚠️ 每轮聚焦单一维度
- 使用 `--session` 保持上下文连续

### Step 3: Claude 整合

1. 汇总 Gemini 多轮分析结果
2. 转换为可执行的设计规格（Tailwind 配置等）
3. 验证数据一致性
4. 输出结构化文档

## 分析维度

| 维度     | 分析内容                               | 输出格式    |
| -------- | -------------------------------------- | ----------- |
| 整体风格 | 界面类型、设计语言、品牌调性           | 文本描述    |
| 配色系统 | 主色、辅助色、背景、文字、功能色       | HEX 值      |
| UI 组件  | 按钮、卡片、输入框等样式               | 圆角/阴影   |
| 字体排版 | 字体家族、字号层级、字重               | px/rem      |
| 图标系统 | 图标类型、粗细、推荐图标库             | 描述 + 推荐 |
| 布局规格 | 栅格、间距、容器宽度                   | px          |

## 命令选择指南

| 任务类型     | 推荐命令                                            | 原因                   |
| ------------ | --------------------------------------------------- | ---------------------- |
| 图片分析     | `codeagent-wrapper gemini --prompt "分析图片..."`   | 统一接口、会话管理     |
| 文本生成     | `codeagent-wrapper gemini --prompt "..."`           | 角色注入、会话管理     |
| 代码生成     | `codeagent-wrapper gemini --role frontend`          | 前端专业角色           |
| 设计方案     | `codeagent-wrapper gemini --role analyzer`          | 分析角色               |

## 强制约束

| 必须执行                                 | 禁止事项                     |
| ---------------------------------------- | ---------------------------- |
| ✅ 统一使用 `codeagent-wrapper gemini`   | ❌ 直接用 `gemini "prompt"`  |
| ✅ 每轮聚焦单一维度                      | ❌ 一次问太多问题            |
| ✅ 输出用 HEX/px 标准格式                | ❌ 使用模糊的颜色描述        |
| ✅ Claude 整合后再输出                   | ❌ 直接使用 Gemini 原始输出  |
| ✅ 使用 `--session` 保持多轮上下文       | ❌ 每轮重新启动会话          |

## 输出格式

```json
{
  "success": true,
  "analysis": "Gemini 的分析结果"
}
```
