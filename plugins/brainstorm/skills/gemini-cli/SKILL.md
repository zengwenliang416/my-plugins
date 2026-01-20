---
name: gemini-cli
description: |
  【触发条件】头脑风暴创意发散阶段，从用户/情感/体验视角生成创意
  【核心产出】10+ 个用户导向的创意（JSON 格式）
  【不触发】技术/架构视角创意（用 codex-cli）、主题研究（用 exa）
  【先问什么】无需询问，根据发散方法自动生成
allowed-tools:
  - Bash
  - Read
  - Task
---

# Gemini CLI - 头脑风暴用户视角

用户体验和创意设计专家视角的创意发散助手。通过 `codeagent-wrapper` 调用，专注于用户价值、情感体验、创新突破。

## 执行命令

```bash
# 标准调用
~/.claude/bin/codeagent-wrapper gemini \
  --role brainstorm \
  --prompt "$PROMPT"

# 后台并行执行
~/.claude/bin/codeagent-wrapper gemini \
  --role brainstorm \
  --prompt "$PROMPT" &
```

## 头脑风暴专用角色

| 角色 | 用途 | 说明 |
|------|------|------|
| brainstorm | 创意发散 | 用户视角生成创意 |
| evaluator | 创意评估 | 用户价值评估 |
| designer | 体验设计 | 将创意转化为用户体验方案 |

## 创意发散流程

### Step 1: 构建提示词

根据发散方法（SCAMPER/六顶思考帽/Auto）构建提示词：

```bash
PROMPT="
## 角色
你是资深用户体验设计师和创意专家，擅长用户洞察、情感设计、创新思维。

## 任务
基于以下研究背景，使用 ${METHOD} 方法生成用户导向的创意。

## 主题
${TOPIC}

## 研究背景
${RESEARCH_BRIEF_SUMMARY}

## 输出要求
生成至少 10 个创意，每个创意包含：
- id: 唯一标识（格式: G-1, G-2, ...）
- title: 简洁标题
- description: 2-3 句话描述
- user_value: 用户价值 1-5
- innovation_level: 创新程度（渐进/突破）
- emotional_appeal: 情感吸引力（实用/惊喜/愉悦/共鸣）
- source: \"gemini\"

## 输出格式
仅输出 JSON 数组，不要其他解释：
[{...}, {...}]
"
```

### Step 2: 调用 Gemini

```bash
~/.claude/bin/codeagent-wrapper gemini \
  --role brainstorm \
  --prompt "$PROMPT"
```

### Step 3: 解析输出

从 Gemini 响应中提取 JSON 创意列表。

## SCAMPER 方法提示词模板

详见 `references/gemini-prompts.md`

核心关注点：
- **S (替代)**: 用户的什么需求可以用新方式满足？
- **C (组合)**: 哪些体验可以融合创造惊喜？
- **A (调整)**: 其他行业的什么体验可以借鉴？
- **M (修改)**: 交互/视觉/情感如何增强？
- **P (另作他用)**: 产品还能服务什么场景？
- **E (删除)**: 用户的什么痛点可以彻底消除？
- **R (逆向)**: 传统假设可以打破吗？

## 六顶思考帽提示词模板

详见 `references/gemini-prompts.md`

核心关注点：
- **白帽**: 用户调研数据揭示了什么？
- **红帽**: 用户对产品的直觉感受？
- **黑帽**: 用户体验的风险和痛点？
- **黄帽**: 用户会喜欢什么特性？
- **绿帽**: 如何创造差异化体验？
- **蓝帽**: 用户旅程如何优化？

## 输出格式

```json
[
  {
    "id": "G-1",
    "title": "情感化反馈设计",
    "description": "为用户操作添加微交互动画和情感化文案，让每次交互都带来小惊喜。",
    "user_value": 4,
    "innovation_level": "渐进",
    "emotional_appeal": "愉悦",
    "source": "gemini"
  },
  {
    "id": "G-2",
    "title": "社交化学习路径",
    "description": "引入学习伙伴机制，用户可以组队学习、分享进度、互相激励。",
    "user_value": 5,
    "innovation_level": "突破",
    "emotional_appeal": "共鸣",
    "source": "gemini"
  }
]
```

## 并行执行

支持与 codex-cli 并行执行：

```bash
# 使用 Task tool 的 run_in_background=true
# Gemini 生成用户视角创意
# Codex 生成技术视角创意
# 两者并行执行，最后合并
```

## 强制约束

| 必须执行 | 禁止事项 |
|----------|----------|
| ✅ 输出必须是 JSON 格式 | ❌ 直接使用输出不审查 |
| ✅ 每个创意有完整元信息 | ❌ 省略必需字段 |
| ✅ 专注用户/体验视角 | ❌ 深入技术实现细节 |
| ✅ 后台执行用 Task tool | ❌ 擅自终止后台任务 |

## 与其他 Skill 协作

1. **exa** 提供研究背景
2. **codex-cli** 生成技术视角创意
3. **gemini-cli** 生成用户视角创意 ← 当前
4. 合并去重 → ideas-pool.md
