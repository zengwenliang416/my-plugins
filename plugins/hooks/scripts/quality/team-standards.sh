#!/bin/bash
# =============================================================================
# team-standards.sh - 团队规范守门人 Hook
# =============================================================================
# 用途: 在 git 操作前检查是否符合团队规范
# 触发: PreToolUse:Bash (针对 git 命令)
# 类型: prompt (输出指令注入上下文)
# 优先级: P1 - 代码质量
# =============================================================================

# 读取 stdin 输入
input=$(cat)

# 提取命令
command=$(echo "$input" | jq -r '.tool_input.command // empty')

# 仅针对 git 相关命令触发
if ! echo "$command" | grep -qE "^git\s+(commit|branch|checkout|push)"; then
    exit 0
fi

cat << 'EOF'
📋 **团队规范检查**

在执行 git 操作前，请确保符合以下规范：

## 1. 分支命名规范
- `feat/xxx` - 新功能开发
- `fix/xxx` - Bug 修复
- `chore/xxx` - 构建/配置变更
- `docs/xxx` - 文档更新
- `refactor/xxx` - 代码重构
- `test/xxx` - 测试相关

## 2. Commit 消息格式 (Conventional Commits)
```
<type>(<scope>): <subject>

<body>
```

类型包括：feat, fix, docs, style, refactor, test, chore

示例：
- `feat(auth): add OAuth2 login support`
- `fix(api): handle null response correctly`
- `chore(deps): update typescript to 5.0`

## 3. 提交前检查
- 确认代码已通过 lint 检查
- 确认相关测试已通过
- 确认没有遗留 TODO/FIXME 标记

---
如果当前操作不符合规范，请先修正后再执行。
EOF
