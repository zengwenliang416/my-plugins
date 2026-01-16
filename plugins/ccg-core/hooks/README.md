# Claude Code Hooks

智能 Hook 系统 - 自动化工作流增强。

## 目录结构

```
hooks/
├── security/           # 安全防护
│   ├── bash-guard.sh       # 危险命令拦截
│   ├── killshell-guard.sh  # KillShell 拦截
│   └── protect-sensitive.sh # 敏感文件保护
├── quality/            # 代码质量
│   ├── auto-format.sh      # 自动代码格式化
│   ├── lint-check.sh       # 代码 Lint 检查
│   └── ts-check.sh         # TypeScript 类型检查
├── git/                # Git 相关
│   ├── git-status-reminder.sh  # Git 状态提醒
│   └── pr-claude-md-check.sh   # PR 检查
├── logging/            # 日志与备份
│   ├── mcp-logger.sh       # MCP 调用日志
│   └── auto-backup.sh      # 自动备份
├── session/            # 会话管理
│   ├── session-init.sh     # 会话初始化
│   └── stop-check.sh       # 任务完成检查+通知
├── evaluation/         # 评估钩子
│   └── unified-eval.sh         # 意图评估 + 工具优先级
├── routing/            # 智能路由
│   └── auggie-priority.sh  # auggie-mcp/LSP 优先提醒
├── collaboration/      # 多模型协作
│   └── codex-guard.sh      # Codex 只读强制
└── sanitize/           # 敏感内容处理
    └── config.json         # 脱敏配置
```

## Hook 事件

| 事件             | 说明               |
| ---------------- | ------------------ |
| SessionStart     | 会话初始化         |
| UserPromptSubmit | 用户提交 prompt 时 |
| PreToolUse       | 工具调用前         |
| PostToolUse      | 工具调用后         |
| Stop             | 会话结束时         |

## 已注册 Hooks

| Hook            | 触发时机                | 目录        | 功能                      |
| --------------- | ----------------------- | ----------- | ------------------------- |
| unified-eval    | UserPromptSubmit        | evaluation/ | 意图评估 + 工具优先级注入 |
| auggie-priority | PreToolUse:Grep\|Glob   | routing/    | auggie-mcp/LSP 优先提醒   |
| killshell-guard | PreToolUse:KillShell    | security/   | 保护多模型协作任务        |
| auto-backup     | PreToolUse:Write        | logging/    | 自动备份文件              |
| mcp-logger      | PreToolUse:mcp\_\_.\*   | logging/    | MCP 调用日志              |
| auto-format     | PostToolUse:Write\|Edit | quality/    | 自动代码格式化            |
| stop-check      | Stop                    | session/    | 任务完成检查+通知         |

## 未注册但可用的 Hooks

| Hook                | 目录           | 功能            | 用途                 |
| ------------------- | -------------- | --------------- | -------------------- |
| protect-sensitive   | security/      | 敏感文件保护    | 阻止访问 .env 等文件 |
| lint-check          | quality/       | 代码 Lint 检查  | ESLint/Flake8 等     |
| ts-check            | quality/       | TypeScript 检查 | 类型错误检测         |
| git-status-reminder | git/           | Git 状态提醒    | 变更文件提醒         |
| pr-claude-md-check  | git/           | PR 检查         | 检查 CLAUDE.md 更新  |
| codex-guard         | collaboration/ | Codex 只读强制  | 确保 Codex 安全调用  |
| session-init        | session/       | 会话初始化      | 项目环境检测         |

## 安装依赖

```bash
cd ~/.claude/hooks
npm install
```

## 启用未注册的 Hook

编辑 `~/.claude/settings.json`，在对应事件下添加 Hook：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "$HOME/.claude/hooks/quality/lint-check.sh",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

## Stop Hook - 任务完成通知

### 功能

- 检查 TodoList 是否全部完成（阻止未完成时结束）
- 发送桌面通知（ClaudeNotifier.app）
- 发送远程推送通知（可选）

### 环境变量配置

在 `~/.claude/settings.json` 的 `env` 字段中配置：

```json
{
  "env": {
    "CLAUDE_NOTIFY_CHANNEL": "bark",
    "BARK_KEY": "your-device-key"
  }
}
```

### 推送渠道

| 渠道     | 环境变量                                  | 说明         |
| -------- | ----------------------------------------- | ------------ |
| Bark     | `BARK_KEY`, `BARK_SERVER`                 | iOS 原生推送 |
| Telegram | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`  | 跨平台       |
| ntfy     | `NTFY_TOPIC`, `NTFY_SERVER`, `NTFY_TOKEN` | 开源自托管   |

## 故障排除

### 权限问题

```bash
chmod +x ~/.claude/hooks/**/*.sh
```

### TypeScript 执行失败

```bash
cd ~/.claude/hooks && npm install
```
