# CCG Workflows

Claude Code Guide 工作流编排器集合 - 提供完整的开发工作流自动化。

## 安装

```bash
# 克隆仓库
git clone https://github.com/your-username/ccg-workflows.git

# 链接到 Claude Code
ln -s $(pwd)/ccg-workflows ~/.claude/plugins/ccg-workflows

# 或使用 claude 命令
claude plugins add ./ccg-workflows
```

## 可用命令

| 命令 | 说明 |
|------|------|
| `/commit` | 规范提交工作流 |
| `/debug` | 调试工作流 |
| `/dev` | 开发工作流 |
| `/plan` | 规划工作流 |
| `/review` | 代码审查工作流 |
| `/test` | 测试工作流 |
| `/image` | 图片生成工作流 |
| `/init` | 项目初始化分析 |
| `/article` | 文章写作工作流 |
| `/social-post` | 社交媒体内容工作流 |
| `/ui-design` | UI/UX 设计工作流 |

## 子命令

| 命令 | 说明 |
|------|------|
| `/ccg:clean-branches` | 清理已合并分支 |
| `/ccg:worktree` | Git worktree 管理 |
| `/ccg:scaffold` | 脚手架生成 |
| `/ccg:rollback` | Git 回滚 |
| `/ccg:pr` | Pull Request 创建 |
| `/ccg:help` | 帮助信息 |

## 架构

```
Command → Orchestrator Agent → Domain Skills
```

- **Commands**: 用户入口，参数解析
- **Agents**: 工作流编排，协调 Skills
- **Skills**: 原子操作，可复用

## 许可证

MIT
