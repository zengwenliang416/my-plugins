# CCG Plugins

Claude Code Guide 插件集合 - 模块化设计，按需安装。

## 插件列表

| 插件 | 说明 | Skills |
|------|------|--------|
| **ccg-core** | 核心工作流命令 (必装) | 4 |
| ccg-developing | 开发/架构/迁移/代码审查 | 39 |
| ccg-testing | 测试生成/调试分析 | 12 |
| ccg-writing | 规划/写作/文章/社交帖子 | 20 |
| ccg-ui | UI/UX 设计/图像生成 | 11 |
| ccg-office | PDF/DOCX/XLSX/PPTX 处理 | 5 |
| ccg-tools | Codex/Gemini/Exa 集成 | 4 |

## 安装

```bash
# 只装核心 (推荐大多数用户)
claude plugins add ./plugins/ccg-core

# 按需追加
claude plugins add ./plugins/ccg-developing   # 开发辅助
claude plugins add ./plugins/ccg-testing      # 测试工具
claude plugins add ./plugins/ccg-tools        # 多模型协作
```

## 核心命令 (ccg-core)

| 命令 | 说明 |
|------|------|
| `/commit` | 规范提交工作流 |
| `/debug` | 调试工作流 |
| `/dev` | 开发工作流 |
| `/plan` | 规划工作流 |
| `/review` | 代码审查工作流 |
| `/test` | 测试工作流 |
| `/init` | 项目初始化分析 |
| `/ccg:*` | Git 工具集 (worktree/pr/rollback/...) |

## 扩展命令

| 插件 | 命令 |
|------|------|
| ccg-writing | `/article`, `/social-post` |
| ccg-ui | `/image`, `/ui-design` |

## 架构

```
plugins/
├── ccg-core/           # 必装
│   ├── commands/       # 工作流入口
│   ├── agents/         # 编排器
│   ├── skills/         # 共享工具
│   └── hooks/          # 自动化钩子
├── ccg-developing/     # 可选
├── ccg-testing/        # 可选
├── ccg-writing/        # 可选
├── ccg-ui/             # 可选
├── ccg-office/         # 可选
└── ccg-tools/          # 可选
```

## 许可证

MIT
