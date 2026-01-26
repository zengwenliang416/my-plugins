---
description: "OpenSpec 初始化：检测系统 → 安装 openspec → 初始化项目 → 校验 MCP 工具"
argument-hint: "[--skip-install]"
allowed-tools:
  - Bash
  - AskUserQuestion
  - Read
  - Write
---

# /tpd:init - OpenSpec 初始化

## 🚨 执行规则

- 必须先检测操作系统，并按系统调整命令
- 每一步成功后再进入下一步
- 不覆盖已有配置，必要时先询问用户
- 失败时给出明确可执行的修复建议

---

## Step 1: 检测操作系统

- 使用 `uname -s`（Linux/macOS）或环境变量判断 Windows
- 告知用户检测到的系统类型
- 若为 Windows，后续命令使用 PowerShell 语法

---

## Step 2: 检查并安装 OpenSpec

1. 检查是否已安装：
   - Linux/macOS: `command -v openspec` 或 `openspec --version`
   - Windows: `where openspec` 或 `openspec --version`

2. 若未安装且未传入 `--skip-install`，执行：

```bash
npm install -g @fission-ai/openspec@latest
```

3. 安装后再次执行 `openspec --version` 验证

---

## Step 3: 初始化 OpenSpec

在项目根目录执行：

```bash
openspec init --tools claude
```

- 若 `openspec/` 已存在：先询问是否覆盖或跳过
- 验证目录结构存在：`openspec/project.md`、`openspec/changes/`

---

## Step 4: 校验 MCP 工具可用性

检查以下 MCP 工具是否可用：

- `mcp__codex__codex`
- `mcp__gemini__gemini`

若不可用，提示安装来源：

- Codex MCP: https://github.com/GuDaStudio/codexmcp
- Gemini MCP: https://github.com/GuDaStudio/geminimcp

说明：这些 MCP 会在 /tpd:plan 与 /tpd:dev 中使用。

---

## Step 5: 输出初始化摘要

输出检查结果：

- OpenSpec 安装：✓ / ✗
- 项目初始化：✓ / ✗
- Codex MCP：✓ / ✗
- Gemini MCP：✓ / ✗

若有未完成项，列出下一步操作。
