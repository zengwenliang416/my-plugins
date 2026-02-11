# Thinking Handoff: Understand Everything Claude Code

## Summary

通过 5 阶段渐进式学习（基础 → 核心概念 → 集成模式 → 实践使用 → 高级功能），遵循组件层次依赖顺序，可系统性地彻底理解 everything-claude-code 项目。

---

## Learning Plan (5 Phases)

### Phase 1: Foundation (Day 1)

**Objectives**: 理解项目概况和插件系统基础

**Files to Study**:

- `README.md` - 项目概览、结构、安装指南
- `.claude-plugin/plugin.json` - 插件清单结构
- `.claude-plugin/marketplace.json` - 市场注册机制

**Key Concepts**:

- 组件层次: rules → skills → agents → commands → hooks
- 插件安装方式: marketplace add vs manual copy

**External Resource**:

- Shorthand Guide (Twitter) - 标注为 "Read this first"

**Checkpoint**: 能够解释 plugin.json 中各字段的作用

---

### Phase 2: Core Concepts (Day 2-3)

**Objectives**: 掌握各组件类型的文件格式和约定

**Files to Study**:

- `agents/planner.md` - Agent 模板示例
- `skills/tdd-workflow/SKILL.md` - Skill 模板示例
- `commands/tdd.md` - Command 模板示例
- `hooks/hooks.json` - Hook 配置结构
- `rules/security.md` - Rule 格式示例

**Key Concepts**:

- YAML frontmatter 格式 (name, description, tools, model)
- 7 种 Hook 事件类型
- Skills 概率触发 (50-80%) vs Hooks 确定触发 (100%)

**CRITICAL**:

- ⚠️ **禁止**在 plugin.json 中添加 hooks 字段 (导致 v2.1+ 重复检测错误)

**Checkpoint**: 能够创建一个简单的 agent 和 skill 文件

---

### Phase 3: Integration Patterns (Day 4-5)

**Objectives**: 理解组件间如何协作

**Files to Study**:

- `scripts/hooks/session-start.js` - Hook 实现示例
- `scripts/hooks/session-end.js` - Session 生命周期
- `scripts/lib/utils.js` - 跨平台工具函数
- `scripts/lib/package-manager.js` - 包管理器检测

**Key Concepts**:

- SessionStart → SessionEnd 生命周期
- 工具限制: Agents 只能使用 tools 数组中声明的工具
- 跨平台 Node.js 脚本模式

**Checkpoint**: 能够追踪一个 hook 从触发到执行的完整流程

---

### Phase 4: Practical Usage (Day 6)

**Objectives**: 动手安装和使用插件

**Tasks**:

1. 安装插件:
   ```bash
   claude plugin marketplace add affaan-m/everything-claude-code
   claude plugin install everything-claude-code@everything-claude-code
   ```
2. 验证 slash 命令注册 (使用 /help 或命令面板)
3. 配置包管理器: `node scripts/setup-package-manager.js --detect`
4. 运行测试套件: `node tests/run-all.js`

**Checkpoint**: 插件安装成功，命令可用，测试通过

---

### Phase 5: Advanced Features (Week 2+)

**Objectives**: 深入高级功能

**Files to Study**:

- `skills/continuous-learning-v2/` - Instinct 学习系统
- `skills/iterative-retrieval/` - 子代理上下文检索模式
- `skills/eval-harness/` - 评估框架
- `mcp-configs/mcp-servers.json` - MCP 服务器配置
- `contexts/` - 动态上下文注入

**Key Concepts**:

- Instinct 置信度评分 (0.3-0.9)
- 迭代检索模式 (最多 3 轮)
- MCP 数量限制 (<10 per project, <80 tools)

**Checkpoint**: 能够解释 continuous-learning-v2 的工作原理

---

## Constraints

### Hard Constraints

| ID  | Constraint                           | Impact                        |
| --- | ------------------------------------ | ----------------------------- |
| H1  | 禁止在 plugin.json 中添加 hooks 字段 | v2.1+ 重复检测错误            |
| H2  | Claude Code CLI v2.1.0+ 最低要求     | hooks 自动加载行为            |
| H3  | YAML frontmatter 必需                | Agents/Skills/Commands 格式   |
| H4  | Agents 只能使用声明的工具            | tools 数组限制                |
| H5  | Rules 无法通过插件分发               | 需手动复制到 ~/.claude/rules/ |
| H6  | ${CLAUDE_PLUGIN_ROOT} 环境变量       | Hook 脚本路径解析             |
| H7  | Node.js 必需                         | 跨平台脚本运行                |

### Soft Constraints

| ID  | Constraint   | Recommendation              |
| --- | ------------ | --------------------------- |
| S1  | MCP 数量限制 | <10 MCPs/project, <80 tools |
| S2  | 测试覆盖率   | 80%+ for TDD workflow       |
| S3  | 迭代检索轮次 | 最多 3 轮                   |
| S4  | 上下文窗口   | 复杂任务避免最后 20%        |

---

## Non-Goals

1. 不贡献 Claude Code 核心代码
2. 不修改 everything-claude-code 项目
3. 不创建动手练习或教程
4. 不分析外部指南内容
5. 不深入 Windows 特定问题
6. 不全面覆盖 Go 相关功能

---

## Success Criteria

- [x] 学习计划覆盖全部 5 种组件类型
- [x] 遵循组件依赖顺序
- [x] 每阶段有明确目标和具体文件
- [x] 关键陷阱已记录
- [x] 前置条件明确
- [x] 包含实践验证步骤
- [x] 提供置信度评估

---

## Open Questions

1. 如何访问外部 Shorthand Guide？(Twitter URL)
2. 没有 Task 工具时，代理间如何委托？
3. Claude Code 版本兼容矩阵是什么？
4. 继承的 instincts 如何与个人 instincts 交互？

---

## Risks

| Level  | Risk             | Mitigation                       |
| ------ | ---------------- | -------------------------------- |
| HIGH   | 外部指南未分析   | 学习时自行阅读外部资源           |
| MEDIUM | 学习时间估计粗略 | 根据个人情况调整进度             |
| MEDIUM | 无动手练习       | 在 Phase 4 中实际操作补充        |
| LOW    | Windows 特定问题 | 跨平台脚本已设计，遇到问题时排查 |

---

## Confidence Assessment

**Overall**: High (8.0/10)

| Dimension              | Score | Notes             |
| ---------------------- | ----- | ----------------- |
| Evidence Sufficiency   | 8     | 4 边界全覆盖      |
| Reasoning Rigor        | 8     | 依赖分析推导      |
| Model Consensus        | 9     | Codex/Gemini 一致 |
| Assumption Reliability | 7     | 外部指南未分析    |

---

## Next Steps

此交接文档已准备就绪，可用于：

1. **直接使用**: 按照 5 阶段计划学习 everything-claude-code
2. **进入 /tpd:plan**: 如果需要更详细的任务分解
3. **定制调整**: 根据个人背景调整学习顺序和深度
