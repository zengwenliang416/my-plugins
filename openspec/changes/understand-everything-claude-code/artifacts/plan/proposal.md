# Proposal: Understand Everything Claude Code

## Summary

制定一个彻底了解 everything-claude-code 项目的学习计划，通过 5 阶段渐进式学习方法，从基础概念到高级功能逐步掌握。

## Target Project

- **Path**: `/Users/wenliang_zeng/workspace/open_sources/ccg-workflows/git-repos/everything-claude-code`
- **Type**: Claude Code Plugin/Extension Project
- **Source**: GitHub - affaan-m/everything-claude-code

## Objectives

1. 理解项目的核心功能和设计目的
2. 掌握项目的架构和模块划分
3. 明确各模块之间的依赖关系
4. 制定有效的学习路径
5. 识别最佳实践和设计模式

## Scope

### In Scope

- 项目结构分析
- 组件类型学习 (rules, skills, agents, commands, hooks)
- 依赖关系图谱
- 学习顺序优化
- 关键陷阱识别
- 实践验证步骤

### Out of Scope

- Claude Code 核心代码贡献
- 修改 everything-claude-code 项目
- 创建动手练习或教程
- 分析外部指南内容
- 深入 Windows 特定问题
- 全面覆盖 Go 相关功能

## Thinking Phase Conclusion

**Core Answer**: 5 阶段渐进式学习法

1. **Phase 1 (Foundation)**: 理解项目概况和插件系统基础
2. **Phase 2 (Core Concepts)**: 掌握各组件类型的文件格式
3. **Phase 3 (Integration Patterns)**: 理解组件间如何协作
4. **Phase 4 (Practical Usage)**: 动手安装和使用插件
5. **Phase 5 (Advanced Features)**: 深入高级功能

**Confidence**: High (8.0/10)

## Key Constraints

| ID  | Constraint                           | Impact                        |
| --- | ------------------------------------ | ----------------------------- |
| H1  | 禁止在 plugin.json 中添加 hooks 字段 | v2.1+ 重复检测错误            |
| H2  | Claude Code CLI v2.1.0+ 最低要求     | hooks 自动加载行为            |
| H3  | YAML frontmatter 必需                | Agents/Skills/Commands 格式   |
| H4  | Agents 只能使用声明的工具            | tools 数组限制                |
| H5  | Rules 无法通过插件分发               | 需手动复制到 ~/.claude/rules/ |

## Success Criteria

- [ ] 可执行的详细任务列表
- [ ] 每个任务有明确的验证标准
- [ ] 包含完整的风险评估
- [ ] PBT 属性已提取
- [ ] 通过 OpenSpec 验证
