# Gemini UI 调用配方（脚本入口版）

统一通过脚本入口调用：`scripts/invoke-gemini-ui.ts`。

## 基础命令

```bash
npx tsx scripts/invoke-gemini-ui.ts --role ui_designer --prompt "你的任务描述"
```

可选参数：
- `--image <path>`: 视觉分析输入图片
- `--dimension <type>`: 分析维度（如 `visual`、`color`、`component`）
- `--session <id>`: 继续多轮会话

## 参考图分析（第一轮）

```bash
npx tsx scripts/invoke-gemini-ui.ts \
  --role analyzer \
  --image "${image_path}" \
  --dimension visual \
  --prompt "分析该 UI 的布局结构、层级和间距，输出可执行规格。"
```

## 配色分析（继续会话）

```bash
npx tsx scripts/invoke-gemini-ui.ts \
  --role analyzer \
  --image "${image_path}" \
  --dimension color \
  --session "${SESSION_ID}" \
  --prompt "提取完整配色系统，输出 HEX 和对比度。"
```

## 组件分析（继续会话）

```bash
npx tsx scripts/invoke-gemini-ui.ts \
  --role analyzer \
  --image "${image_path}" \
  --dimension component \
  --session "${SESSION_ID}" \
  --prompt "提取组件清单、状态变化、圆角/阴影/字号等规格。"
```

## 风格推荐

```bash
npx tsx scripts/invoke-gemini-ui.ts \
  --role ui_designer \
  --prompt "基于需求文档给出 A/B/C 三套风格方案，包含 token 与取舍。"
```

## 前端原型生成

```bash
npx tsx scripts/invoke-gemini-ui.ts \
  --role frontend \
  --prompt "根据设计规格生成 React + TypeScript + Tailwind 原型代码。"
```

## 使用约束

- 不直接调用 wrapper 可执行文件，统一走 `invoke-gemini-ui.ts`。
- 需要多轮上下文时复用 `--session`。
- 输出必须可落地：颜色用 HEX，尺寸用 px/rem，组件规格可执行。
