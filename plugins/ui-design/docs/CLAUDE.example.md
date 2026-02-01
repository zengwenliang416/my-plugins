# UI-Design Plugin Usage Guide

Always answer in 简体中文

## Available Skills

| Skill                  | Trigger              | Description           |
| ---------------------- | -------------------- | --------------------- |
| `/ui-design:ui-design` | "设计", "UI", "界面" | 完整 UI/UX 设计工作流 |

## Quick Start

```bash
# 从零开始设计
/ui-design 设计一个 SaaS 仪表盘页面

# 带参考图片
/ui-design --image=./reference.png 设计登录页面

# 优化现有界面
/ui-design --scenario=optimize 优化用户设置页面

# 指定技术栈
/ui-design --tech-stack=vue 设计电商首页
```

## Workflow Phases

10 个阶段的完整工作流：

```
1. 初始化        → 创建运行目录
2. 场景确认      → 询问设计场景和技术栈 (⏸️ Hard Stop)
2.5 图片分析    → 8 并行 Gemini 视觉分析（可选）
3. 需求分析      → auggie-mcp + Gemini 需求解析
4. 样式推荐      → 生成 3 套设计方案 + HTML 预览
5. 变体选择      → 用户选择方案 (⏸️ Hard Stop)
6. 设计生成      → 并行生成设计规格
7. UX 检查       → UX 准则验证（失败重试）
8. 代码生成      → Gemini 原型 + Claude 重构
9. 质量验证      → 代码质量 + 设计还原度
10. 交付总结     → 完成报告
```

## Agent Types

| Category   | Agents                                                       | Description            |
| ---------- | ------------------------------------------------------------ | ---------------------- |
| Analysis   | image-analyzer, requirement-analyzer, existing-code-analyzer | 分析类 Agent           |
| Design     | style-recommender, design-variant-generator                  | 设计类 Agent           |
| Validation | ux-guideline-checker, quality-validator                      | 验证类 Agent           |
| Generation | gemini-prototype-generator, claude-code-refactor             | 生成类 Agent（双模型） |

## Output Structure

```
.claude/ui-design/runs/${RUN_ID}/
├── requirements.md           # 需求分析
├── style-recommendations.md  # 样式推荐
├── previews/                 # HTML 预览
│   ├── index.html
│   ├── preview-A.html
│   ├── preview-B.html
│   └── preview-C.html
├── design-A.md               # 设计规格 A
├── design-B.md               # 设计规格 B
├── design-C.md               # 设计规格 C
├── ux-check-report.md        # UX 检查报告
├── code/
│   ├── gemini-raw/           # Gemini 原型
│   └── react-tailwind/       # 最终代码
└── quality-report.md         # 质量报告
```

## Dual-Model Collaboration

Phase 8 使用双模型协作：

```
┌─────────────────────────────────────────┐
│  Gemini Prototype  →  Claude Refactor  │
│  (70% quality)        (95% quality)    │
│       ↓                   ↓            │
│  gemini-raw/          final/           │
│  - 快速生成            - 移除冗余       │
│  - 完整结构            - 类型补全       │
│  - 基础类型            - 可访问性       │
└─────────────────────────────────────────┘
```

## Quality Gates

| Phase   | Gate         | Threshold |
| ------- | ------------ | --------- |
| Phase 7 | UX 通过率    | ≥ 80%     |
| Phase 7 | 高优先级问题 | = 0       |
| Phase 9 | 质量评分     | ≥ 7.5/10  |

## Resume Workflow

```bash
# 使用 run-id 断点续传
/ui-design --run-id=20260131T100000Z
```

## MCP Tools Used

| Tool                                           | Usage                            |
| ---------------------------------------------- | -------------------------------- |
| `mcp__gemini__gemini`                          | 图片分析、设计方案生成、代码原型 |
| `mcp__auggie-mcp__codebase-retrieval`          | 现有代码分析、组件检索           |
| `mcp__sequential-thinking__sequentialthinking` | 规划执行策略                     |
| `LSP`                                          | 组件符号分析、类型检查           |

## Shared Resources

```
plugins/ui-design/skills/_shared/
├── colors/           # 配色方案库
├── styles/           # 样式模板库
├── typography/       # 字体系统库
└── ux-guidelines/    # UX 准则参考
```
