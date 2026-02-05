# Constraints Resolution Document

## Metadata

- Resolution Time: 2026-02-02T10:05:00Z
- Resolution Method: Default Plan (Auto-applied)
- Ambiguities Resolved: 16/16

---

## Resolved Constraints

### C1: 验证方式约束

**Resolved Ambiguities**: A1, A2, A7, A8, A15

**Constraint Definition**:
每阶段必须产出可交付物作为验证证据：

| Phase   | Required Deliverable                                  | Verification Method              |
| ------- | ----------------------------------------------------- | -------------------------------- |
| Phase 1 | `notes/phase1-summary.md`                             | 包含 plugin.json 字段解释        |
| Phase 2 | `examples/my-agent.md` + `examples/my-skill/SKILL.md` | 符合 YAML frontmatter 格式       |
| Phase 3 | `notes/hook-trace.md`                                 | 完整追踪 SessionStart→SessionEnd |
| Phase 4 | `logs/install-output.txt` + `logs/test-results.txt`   | 命令执行成功无错误               |
| Phase 5 | `notes/continuous-learning-analysis.md`               | 解释 instinct 置信度机制         |

### C2: 时间分配约束

**Resolved Ambiguities**: A3, A4, A13

**Constraint Definition**:
使用小时制替代日历制：

| Phase   | Effort (Hours) | Exit Criteria              |
| ------- | -------------- | -------------------------- |
| Phase 1 | 2-4h           | 产出物完成 + 自测通过      |
| Phase 2 | 4-6h           | 两个示例文件通过格式验证   |
| Phase 3 | 3-5h           | Hook 追踪文档完整          |
| Phase 4 | 2-3h           | 安装成功 + 测试通过        |
| Phase 5 | 6-8h (上限)    | 分析文档完成 OR 时间盒到期 |

**Total Budget**: 17-26 小时

### C3: 前置条件约束

**Resolved Ambiguities**: A5, A6, A12, A16

**Constraint Definition**:
添加 Phase 0 环境验证检查清单：

````markdown
## Phase 0: Environment Validation (30 min)

### Technical Prerequisites

- [ ] CLI proficiency: 能执行 `cd`, `ls`, `cat`, `mkdir` 无障碍
- [ ] YAML/JSON: 能手写简单 YAML 配置文件
- [ ] Node.js: v18+ 已安装 (`node --version`)
- [ ] Claude Code CLI: v2.1.0+ 已安装 (`claude --version`)

### Environment Check Commands

```bash
node --version  # >= v18.0.0
claude --version  # >= 2.1.0
echo $CLAUDE_PLUGIN_ROOT  # 应有值或知道如何设置
```
````

### Skill Gap Handling

- 缺 CLI 基础 → 先完成 Linux/macOS CLI 入门教程
- 缺 YAML → 先阅读 YAML 速查表 (10 min)
- 缺 Node.js → 先安装 Node.js LTS 版本

````

### C4: 资源依赖约束

**Resolved Ambiguities**: A9, A10, A11, A14

**Constraint Definition**:

| Resource | Primary Access | Fallback Strategy |
|----------|---------------|-------------------|
| Target Repository | 本地已存在于指定路径 | `git clone https://github.com/affaan-m/everything-claude-code` |
| Shorthand Guide | Twitter URL（可选） | 跳过，使用项目内 README 作为替代 |
| Plugin Install | `claude plugin marketplace add` | 本地复制：`cp -r . ~/.claude/plugins/` |
| Network | 在线安装 | 离线模式：预下载 tarball |

**Repository Pinning**:
```bash
# 学习计划锚定版本
LEARNING_COMMIT="main"  # 或特定 hash
cd git-repos/everything-claude-code
git checkout $LEARNING_COMMIT
````

---

## Hard Constraints Summary (Inherited)

| ID  | Constraint                           | Impact                        | Status            |
| --- | ------------------------------------ | ----------------------------- | ----------------- |
| H1  | 禁止在 plugin.json 中添加 hooks 字段 | v2.1+ 重复检测错误            | ✅ Documented     |
| H2  | Claude Code CLI v2.1.0+ 最低要求     | hooks 自动加载行为            | ✅ Added to C3    |
| H3  | YAML frontmatter 必需                | Agents/Skills/Commands 格式   | ✅ Verified in C1 |
| H4  | Agents 只能使用声明的工具            | tools 数组限制                | ✅ Documented     |
| H5  | Rules 无法通过插件分发               | 需手动复制到 ~/.claude/rules/ | ✅ Documented     |
| H6  | ${CLAUDE_PLUGIN_ROOT} 环境变量       | Hook 脚本路径解析             | ✅ Added to C3    |
| H7  | Node.js 必需                         | 跨平台脚本运行                | ✅ Added to C3    |

---

## Soft Constraints (Inherited)

| ID  | Constraint   | Recommendation              | Status         |
| --- | ------------ | --------------------------- | -------------- |
| S1  | MCP 数量限制 | <10 MCPs/project, <80 tools | ✅ Noted       |
| S2  | 测试覆盖率   | 80%+ for TDD workflow       | N/A (学习任务) |
| S3  | 迭代检索轮次 | 最多 3 轮                   | N/A (学习任务) |
| S4  | 上下文窗口   | 复杂任务避免最后 20%        | ✅ Noted       |

---

## Resolution Audit Trail

All 16 ambiguities resolved via default plan:

- ✅ A1-A8: 验证方式 → C1
- ✅ A9-A11: 资源依赖 → C4
- ✅ A12-A16: 前置条件/时间 → C2, C3
