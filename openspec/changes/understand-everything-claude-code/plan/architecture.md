# Unified Architecture Design: Understand Everything Claude Code

## Metadata

- Analysis Time: 2026-02-02T10:15:00Z
- Analysis Model: Codex + Gemini (Dual Model)
- Task Type: fullstack (documentation/learning)
- Integration Mode: Backend + Frontend perspectives merged

---

## Architecture Overview

everything-claude-code 是一个生产级 Claude Code 插件，实现了 **5 层组件架构**：Hooks（确定性）→ Rules（约束）→ Skills（领域知识）→ Agents（执行）→ Commands（入口）。学习此项目需要理解从用户交互到底层脚本执行的完整数据流。

---

## 1. Backend Architecture (Codex Analysis)

### 1.1 Plugin System API

| Endpoint                          | Type   | Description           |
| --------------------------------- | ------ | --------------------- |
| `.claude-plugin/plugin.json`      | Static | 插件清单（组件路径）  |
| `.claude-plugin/marketplace.json` | Static | 市场发现目录          |
| `hooks/hooks.json`                | Static | Hook 配置（自动加载） |

### 1.2 Data Model

```typescript
// Plugin Manifest
interface PluginManifest {
  name: string;
  version: string;
  description: string;
  skills?: string[];   // 目录路径数组
  agents?: string[];   // 文件路径数组
  // ⚠️ NO hooks field (auto-loaded)
}

// Hook Configuration
interface HookConfig {
  hooks: {
    PreToolUse?: HookEntry[];
    PostToolUse?: HookEntry[];
    PreCompact?: HookEntry[];
    SessionStart?: HookEntry[];
    SessionEnd?: HookEntry[];
    Stop?: HookEntry[];
  };
}

// Hook I/O
stdin (JSON) --> Hook Script --> stdout (JSON)
                    |
                    v
               stderr (User Messages)
Exit Code: 0 = continue, 1 = block
```

### 1.3 Component Directory Structure

```
everything-claude-code/
├── .claude-plugin/           # Plugin Registration Layer
│   ├── plugin.json           # Manifest
│   └── marketplace.json      # Discovery
├── hooks/                    # Deterministic Automation Layer
│   └── hooks.json            # 6 event types
├── scripts/                  # Execution Engine Layer
│   ├── lib/                  # Shared utilities
│   │   ├── utils.js          # Core (readStdinJson, log, output)
│   │   └── package-manager.js # PM detection
│   └── hooks/                # Hook implementations
│       ├── session-start.js
│       └── session-end.js
├── agents/                   # Task Execution Layer (12)
├── skills/                   # Domain Knowledge Layer (12+)
├── commands/                 # Entry Point Layer (18+)
├── rules/                    # Constraint Layer (6)
└── contexts/                 # Dynamic Injection
```

### 1.4 Security Strategy

| Aspect             | Implementation                   |
| ------------------ | -------------------------------- |
| Script Sandboxing  | Node.js 标准权限                 |
| Command Validation | Matcher 表达式过滤               |
| Secret Detection   | `security.md` 规则强制无硬编码   |
| Exit Code Control  | Hook 可阻止危险操作 (exit 1)     |
| Path Scoping       | `${CLAUDE_PLUGIN_ROOT}` 限定路径 |

---

## 2. Frontend Architecture (Gemini Analysis)

### 2.1 User Interaction Architecture

#### User Personas

| Persona     | Entry Point               | Goal       |
| ----------- | ------------------------- | ---------- |
| New Adopter | README, `/plugin install` | 快速上手   |
| Daily User  | `/tdd`, `/plan`           | 高效工作流 |
| Power User  | Skills, Hooks 配置        | 自动化定制 |
| Contributor | 插件结构                  | 添加新能力 |

#### User Journey Stages

```
Discovery → Basic Usage → Integration Understanding → Customization → Mastery
```

### 2.2 Key UX Patterns

| Pattern              | Implementation                             | Purpose        |
| -------------------- | ------------------------------------------ | -------------- |
| **WAIT 确认**        | `/plan` 实施前等待用户确认                 | 防止意外操作   |
| **YAML Frontmatter** | 所有组件统一元数据格式                     | 一致的发现机制 |
| **反馈令牌**         | `[Hook]`, `[CRITICAL]`, `[WARNING]`        | 标准化输出     |
| **渐进复杂度**       | Commands → Agents → Skills → Rules → Hooks | 分层学习       |

### 2.3 Feedback Token Design

| Token        | Meaning       | Example                       |
| ------------ | ------------- | ----------------------------- |
| `[Hook]`     | Hook 系统消息 | `[Hook] BLOCKED: reason`      |
| `[CRITICAL]` | 必须修复      | `[CRITICAL] API key exposed`  |
| `[WARNING]`  | 建议修复      | `[WARNING] console.log found` |
| `✓` / `✅`   | 成功          | `Tests passed ✓`              |
| `✕` / `❌`   | 失败          | `Coverage below 80% ✕`        |

### 2.4 Component Categories (User Mental Model)

| Category    | Commands                                | Purpose            |
| ----------- | --------------------------------------- | ------------------ |
| Planning    | `/plan`                                 | 开始前：需求澄清   |
| Development | `/tdd`, `/build-fix`                    | 开发中：TDD 工作流 |
| Quality     | `/code-review`, `/refactor-clean`       | 开发后：验证       |
| Testing     | `/e2e`, `/verify`                       | E2E 测试           |
| Learning    | `/learn`, `/evolve`, `/instinct-status` | 模式提取           |

---

## 3. Cross-Cutting Concerns

### 3.1 API Contracts (Frontend-Backend)

| Interface       | Contract                     | Direction               |
| --------------- | ---------------------------- | ----------------------- |
| Command → Agent | YAML `name` 字段引用         | Commands invoke Agents  |
| Agent → Skill   | 上下文激活 (~50-80% 概率)    | Agents reference Skills |
| Tool → Hook     | JSON stdin/stdout            | Hooks intercept Tools   |
| Hook → Script   | `${CLAUDE_PLUGIN_ROOT}` 路径 | Hooks execute Scripts   |

### 3.2 Component Layer Hierarchy (Consensus)

```
┌──────────────────────────────────────────────────┐
│ Layer 5: Hooks (Deterministic, 100% fire rate)    │
│   PreToolUse, PostToolUse, SessionStart/End       │
├──────────────────────────────────────────────────┤
│ Layer 4: Rules (Always Active)                    │
│   security.md, coding-style.md, testing.md        │
├──────────────────────────────────────────────────┤
│ Layer 3: Skills (Probabilistic ~50-80%)           │
│   tdd-workflow, backend-patterns, security-review │
├──────────────────────────────────────────────────┤
│ Layer 2: Agents (Limited Tools)                   │
│   code-reviewer, planner, tdd-guide, architect    │
├──────────────────────────────────────────────────┤
│ Layer 1: Commands (User Entry Points)             │
│   /tdd, /plan, /code-review, /build-fix           │
└──────────────────────────────────────────────────┘
```

### 3.3 Session Lifecycle

```
SessionStart:
  1. Hook 触发
  2. 加载近期会话 (7 天)
  3. 检测包管理器
  4. 报告可用技能

During Session:
  1. PreToolUse hooks 拦截 Edit/Write
  2. suggest-compact.js 追踪编辑计数
  3. 建议手动压缩

SessionEnd:
  1. session-end.js 创建/更新会话文件
  2. evaluate-session.js 提取模式
  3. 更新 observations.jsonl
```

### 3.4 Error Handling Strategy

| Layer   | Error Format                        | Recovery       |
| ------- | ----------------------------------- | -------------- |
| Hooks   | `[Hook] BLOCKED: reason` + 恢复指令 | 用户按指令操作 |
| Agents  | `[CRITICAL/WARNING]` + 文件:行号    | 用户修复后重试 |
| Scripts | Exit code 1 + stderr 消息           | 检查环境配置   |

---

## 4. Architecture Decision Records

### ADR-001: Hook 字段禁止

**Status**: Decided

**Context**: Claude Code v2.1+ 从 `hooks/hooks.json` 自动加载 hooks。

**Decision**: 禁止在 `plugin.json` 中添加 `hooks` 字段。

**Rationale**:

- 避免 v2.1+ 重复检测错误
- 保持声明式纯净性
- 符合新版本约定

**Consequences**:

- Hook 配置必须放在 `hooks/hooks.json`
- 旧版本需要手动迁移

### ADR-002: 5 层渐进式学习

**Status**: Decided

**Context**: 项目包含多种组件类型，需要系统性学习路径。

**Decision**: 采用 Hybrid Learning（分层方法）。

**Rationale**:

- 匹配项目显式 5 层架构
- 每层有明确边界和验证点
- 依赖自然从 Layer 5 流向 Layer 1

**Consequences**:

- 学习需遵循层级顺序
- 每阶段有明确检查点

### ADR-003: 小时制时间分配

**Status**: Decided

**Context**: "Day" 单位模糊，不同用户学习速度不同。

**Decision**: 使用小时制（2-4h/阶段）替代日历制。

**Rationale**:

- 基于工作量而非日历
- 适应不同学习节奏
- 可验证的时间盒

**Consequences**:

- 总预算 17-26 小时
- Phase 5 有 8h 上限

---

## 5. Quality Attributes

| Attribute  | Target             | Verification Method |
| ---------- | ------------------ | ------------------- |
| 可学习性   | 5 阶段完成率 100%  | Checkpoint 验证     |
| 可验证性   | 每阶段有产出物     | 文件存在检查        |
| 时间控制   | 17-26h 总预算      | 时间盒跟踪          |
| 覆盖完整性 | 5 种组件类型全覆盖 | Checklist 审计      |
| 约束遵从   | H1-H7 全部遵守     | PBT 属性验证        |

---

## 6. Integration Points Summary

| Source      | Target              | Integration Type        |
| ----------- | ------------------- | ----------------------- |
| plugin.json | Claude Code CLI     | 静态加载                |
| hooks.json  | Hook Engine         | 自动发现 (v2.1+)        |
| Commands    | Agents              | YAML 引用               |
| Agents      | Skills              | 上下文激活              |
| Hooks       | Scripts             | `${CLAUDE_PLUGIN_ROOT}` |
| Sessions    | ~/.claude/sessions/ | JSON 持久化             |

---

## Conclusion

该统一架构文档整合了：

1. **Codex 后端视角**: 插件系统、Hook 机制、脚本执行、数据流
2. **Gemini 前端视角**: 用户旅程、UX 模式、反馈设计、渐进复杂度
3. **跨切面关注点**: API 契约、会话生命周期、错误处理

**关键共识**:

- 5 层组件架构（Hooks → Rules → Skills → Agents → Commands）
- 分层渐进式学习路径
- YAML Frontmatter 统一格式
- H1-H7 硬约束必须遵守

---

Next step: Call task-decomposer for task decomposition
