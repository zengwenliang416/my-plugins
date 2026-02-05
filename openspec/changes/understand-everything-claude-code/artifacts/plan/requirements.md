# Requirement Specification

## Metadata

- Parse Time: 2026-02-02T09:35:00Z
- Task Type: documentation
- Frontend Weight: 0%
- Backend Weight: 0%
- Documentation Weight: 100%

## Requirement Overview

制定一个系统性的学习计划，通过 5 阶段渐进式方法彻底理解 everything-claude-code 项目的架构、组件和最佳实践。

## Functional Requirements

| ID     | Requirement Description    | Priority | Acceptance Criteria                                   |
| ------ | -------------------------- | -------- | ----------------------------------------------------- |
| FR-001 | 理解项目核心功能和设计目的 | P1       | 能清晰解释项目的价值定位和适用场景                    |
| FR-002 | 掌握项目架构和模块划分     | P1       | 能绘制组件层次图 (rules→skills→agents→commands→hooks) |
| FR-003 | 明确各模块之间的依赖关系   | P1       | 能追踪任意组件的调用链和数据流                        |
| FR-004 | 制定有效的学习路径         | P1       | 5 阶段计划包含具体文件、目标、检查点                  |
| FR-005 | 识别最佳实践和设计模式     | P2       | 文档化至少 5 个关键设计模式                           |
| FR-006 | 记录关键陷阱和约束         | P1       | 所有 Hard Constraints (H1-H7) 已文档化                |
| FR-007 | 包含实践验证步骤           | P2       | Phase 4 包含可执行的安装和测试命令                    |

## Non-Functional Requirements

| ID      | Category     | Constraint Description                                         |
| ------- | ------------ | -------------------------------------------------------------- |
| NFR-001 | Structure    | 5 阶段渐进式学习结构（Foundation → Advanced）                  |
| NFR-002 | Verification | 每阶段必须有明确的 Checkpoint 验证标准                         |
| NFR-003 | Coverage     | 覆盖全部 5 种组件类型 (rules, skills, agents, commands, hooks) |
| NFR-004 | Dependency   | 遵循组件层次依赖顺序                                           |
| NFR-005 | Completeness | 包含完整的风险评估                                             |
| NFR-006 | Testability  | PBT 属性已提取                                                 |
| NFR-007 | Validation   | 通过 OpenSpec 验证                                             |

## Constraints

### Hard Constraints (Must Comply)

| ID  | Constraint                           | Impact                        |
| --- | ------------------------------------ | ----------------------------- |
| H1  | 禁止在 plugin.json 中添加 hooks 字段 | v2.1+ 重复检测错误            |
| H2  | Claude Code CLI v2.1.0+ 最低要求     | hooks 自动加载行为            |
| H3  | YAML frontmatter 必需                | Agents/Skills/Commands 格式   |
| H4  | Agents 只能使用声明的工具            | tools 数组限制                |
| H5  | Rules 无法通过插件分发               | 需手动复制到 ~/.claude/rules/ |
| H6  | ${CLAUDE_PLUGIN_ROOT} 环境变量       | Hook 脚本路径解析             |
| H7  | Node.js 必需                         | 跨平台脚本运行                |

### Soft Constraints (Recommendations)

| ID  | Constraint   | Recommendation              |
| --- | ------------ | --------------------------- |
| S1  | MCP 数量限制 | <10 MCPs/project, <80 tools |
| S2  | 测试覆盖率   | 80%+ for TDD workflow       |
| S3  | 迭代检索轮次 | 最多 3 轮                   |
| S4  | 上下文窗口   | 复杂任务避免最后 20%        |

### Out of Scope

- Claude Code 核心代码贡献
- 修改 everything-claude-code 项目
- 创建动手练习或教程
- 分析外部指南内容
- 深入 Windows 特定问题
- 全面覆盖 Go 相关功能

## Assumptions & Dependencies

### Assumptions

- 用户已有 Claude Code CLI 基础使用经验
- 用户具备 Node.js 和 JavaScript 基础知识
- 目标项目代码库可访问且结构稳定

### Dependencies

- Claude Code CLI v2.1.0+
- Node.js runtime
- everything-claude-code 项目源码

## Items to Clarify

- [ ] 如何访问外部 Shorthand Guide？(Twitter URL)
- [ ] 没有 Task 工具时，代理间如何委托？
- [ ] Claude Code 版本兼容矩阵是什么？
- [ ] 继承的 instincts 如何与个人 instincts 交互？

## Risk Summary (from Thinking Phase)

| Level  | Risk             | Mitigation                       |
| ------ | ---------------- | -------------------------------- |
| HIGH   | 外部指南未分析   | 学习时自行阅读外部资源           |
| MEDIUM | 学习时间估计粗略 | 根据个人情况调整进度             |
| MEDIUM | 无动手练习       | 在 Phase 4 中实际操作补充        |
| LOW    | Windows 特定问题 | 跨平台脚本已设计，遇到问题时排查 |

---

Next step: Use tpd:architecture-analyzer to analyze architecture
