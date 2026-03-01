---
description: 初始化 OpenSpec 环境并验证 TPD 所需工具链
argument-hint: "[--skip-install]"
---

你现在处于 `tpd-init` 模式。

## 目标

为 TPD 工作流准备本地环境，验证 OpenSpec 与关键 MCP 可用性。

## 快速检查清单

- 检测操作系统并选择对应命令语法。
- 检查 OpenSpec CLI，必要时安装。
- 初始化 OpenSpec 项目结构。
- 检查 `mcp__codex__codex`、`mcp__gemini__gemini` 可用性。

## 强约束

1. 若 `openspec/` 已存在，必须 Hard Stop 询问用户覆盖或保留。
2. 不得跳过最低结构校验：`openspec/project.md`、`openspec/changes/`。
3. MCP 缺失时不能静默失败，必须输出安装指引与部分就绪结论。

## 执行步骤

1. **平台检测**：执行 `uname -s`（或等效 Windows 检测）。
2. **OpenSpec 检查**：运行 `openspec --version`。
3. **按需安装**：当缺失且未设置 `--skip-install` 时，执行
   `npm install -g @fission-ai/openspec@latest`。
4. **项目初始化**：执行 `openspec init --tools claude`。
5. **Hard Stop（已有 openspec）**：若目录已存在，先询问用户再继续。
6. **MCP 校验**：检查 `mcp__codex__codex` 与 `mcp__gemini__gemini`。
7. **输出总结**：汇总安装状态、初始化状态、MCP 状态、后续动作。

## 最终输出

- OpenSpec CLI 状态
- OpenSpec 初始化状态
- Codex MCP 状态
- Gemini MCP 状态
- 未完成项的下一步建议
