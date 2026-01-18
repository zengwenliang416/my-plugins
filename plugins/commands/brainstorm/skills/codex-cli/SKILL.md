---
name: codex-cli
description: |
  【触发条件】头脑风暴创意发散阶段，从技术/可行性视角生成创意
  【核心产出】10+ 个技术导向的创意（JSON 格式）
  【不触发】用户/情感视角创意（用 gemini-cli）、主题研究（用 exa）
  【先问什么】无需询问，根据发散方法自动生成
allowed-tools:
  - Bash
  - Read
  - Task
---

# Codex CLI - 头脑风暴技术视角

技术架构专家视角的创意发散助手。通过 `codeagent-wrapper` 调用，专注于技术可行性、系统架构、实现路径。

## 执行命令

```bash
# 标准调用
~/.claude/bin/codeagent-wrapper codex \
  --role brainstorm \
  --prompt "$PROMPT" \
  --sandbox read-only

# 后台并行执行
~/.claude/bin/codeagent-wrapper codex \
  --role brainstorm \
  --prompt "$PROMPT" \
  --sandbox read-only &
```

## 头脑风暴专用角色

| 角色 | 用途 | 说明 |
|------|------|------|
| brainstorm | 创意发散 | 技术视角生成创意 |
| evaluator | 创意评估 | 技术可行性评估 |
| architect | 方案设计 | 将创意转化为技术方案 |

## 创意发散流程

### Step 1: 构建提示词

根据发散方法（SCAMPER/六顶思考帽/Auto）构建提示词：

```bash
PROMPT="
## 角色
你是资深技术架构师，擅长系统设计、技术选型、可行性评估。

## 任务
基于以下研究背景，使用 ${METHOD} 方法生成技术导向的创意。

## 主题
${TOPIC}

## 研究背景
${RESEARCH_BRIEF_SUMMARY}

## 输出要求
生成至少 10 个创意，每个创意包含：
- id: 唯一标识（格式: C-1, C-2, ...）
- title: 简洁标题
- description: 2-3 句话描述
- technical_complexity: 技术复杂度 1-5
- timeline: 实现周期（短期/中期/长期）
- dependencies: 技术依赖列表
- source: \"codex\"

## 输出格式
仅输出 JSON 数组，不要其他解释：
[{...}, {...}]
"
```

### Step 2: 调用 Codex

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role brainstorm \
  --prompt "$PROMPT" \
  --sandbox read-only
```

### Step 3: 解析输出

从 Codex 响应中提取 JSON 创意列表。

## SCAMPER 方法提示词模板

详见 `references/codex-scamper-prompt.md`

核心关注点：
- **S (替代)**: 哪些技术/组件可以被替代？
- **C (组合)**: 哪些功能/服务可以组合？
- **A (调整)**: 其他领域的技术可以借鉴？
- **M (修改)**: 性能/规模如何调整？
- **P (另作他用)**: 现有技术能力还能解决什么？
- **E (删除)**: 哪些环节可以简化？
- **R (逆向)**: 流程/架构可以颠倒吗？

## 六顶思考帽提示词模板

详见 `references/codex-six-hats-prompt.md`

核心关注点：
- **白帽**: 需要什么数据验证假设？
- **红帽**: 技术团队对哪些方案有信心？
- **黑帽**: 技术风险和性能瓶颈？
- **黄帽**: 技术优势和可复用能力？
- **绿帽**: 新技术和架构创新？
- **蓝帽**: 技术实施优先级？

## 输出格式

```json
[
  {
    "id": "C-1",
    "title": "微服务化改造",
    "description": "将单体架构拆分为微服务，提高系统可扩展性和部署灵活性。",
    "technical_complexity": 4,
    "timeline": "长期",
    "dependencies": ["Docker", "Kubernetes", "API Gateway"],
    "source": "codex"
  },
  {
    "id": "C-2",
    "title": "缓存层优化",
    "description": "引入 Redis 缓存热点数据，减少数据库压力，提升响应速度。",
    "technical_complexity": 2,
    "timeline": "短期",
    "dependencies": ["Redis", "缓存策略设计"],
    "source": "codex"
  }
]
```

## 并行执行

支持与 gemini-cli 并行执行：

```bash
# 使用 Task tool 的 run_in_background=true
# Codex 生成技术视角创意
# Gemini 生成用户视角创意
# 两者并行执行，最后合并
```

## 强制约束

| 必须执行 | 禁止事项 |
|----------|----------|
| ✅ 使用 `--sandbox read-only` | ❌ 直接使用输出不审查 |
| ✅ 输出必须是 JSON 格式 | ❌ 生成非结构化文本 |
| ✅ 每个创意有完整元信息 | ❌ 省略必需字段 |
| ✅ 后台执行用 Task tool | ❌ 擅自终止后台任务 |

## 与其他 Skill 协作

1. **exa** 提供研究背景
2. **codex-cli** 生成技术视角创意 ← 当前
3. **gemini-cli** 生成用户视角创意
4. 合并去重 → ideas-pool.md
