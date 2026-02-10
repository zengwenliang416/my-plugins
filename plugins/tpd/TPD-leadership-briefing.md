[System Instruction]
You are an expert visual storyteller and infographic designer.
I have a document below that I need to convert into a specific style of presentation.

YOUR TASK:
1.  **Analyze** the provided document "TPD Leadership Briefing".
2.  **Break it down** into a logical flow of 8-10 slides.
3.  **Generate a visual output** for EACH slide using the "Nano Banana Pro" style rules below.

🎨 STYLE RULES (Strictly Follow):
-   **Style:** Pure hand-drawn illustration, sketch lines, rough strokes, cartoon simplicity.
-   **Vibe:** Doodle / crayon / marker / pastel look. No realism/3D.
-   **Elements:** Use minimal, expressive cartoon icons, symbols, and arrows.
-   **Layout:** Landscape 16:9. Clean, with plenty of whitespace.
-   **Text:** Handwritten font style. Concise bullets (1-6 words).
-   **Emphasis:** Hand-drawn circles, stars, underlines (no digital UI).

OUTPUT FORMAT:
For each slide, produce a visual card that illustrates the key point.
If you are generating images directly, generate them.
If you are generating text descriptions/prompts for images, use this format for each slide:
---
**Slide [N]: [Title]**
*Visual Description:* [Describe the hand-drawn scene]
*Key Text:* [The exact text to appear on the image]
---

[DOCUMENT CONTENT STARTS HERE]

# TPD 工作流领导汇报介绍流程（面向管理层）

> 适用对象：技术负责人、研发管理层、架构委员会
> 
> 汇报目标：在 15 分钟内让管理层理解 TPD 的业务价值、治理机制、落地路径，并形成明确决策（试点范围/资源/节奏）

## 1. 结论先行（建议开场 30 秒）

**建议开场话术**：

“TPD 不是一个‘写代码工具’，而是一套把模糊需求变成可执行计划、再按最小可验证阶段落地的工程流程。它通过 Thinking → Plan → Dev 三段式，把研发过程从‘经验驱动’升级为‘约束驱动 + 可审计交付’，核心收益是减少返工、提升可预测性、并保留 Claude 的最终代码主权。”

---

## 2. 15 分钟汇报节奏（可直接照此讲）

| 时间 | 讲什么 | 领导最关心的问题 | 建议证据 |
| --- | --- | --- | --- |
| 0:00-1:30 | 为什么现在要做 | 现有研发流程痛点是否真实 | 需求到实现链路易失真、返工高 |
| 1:30-3:30 | TPD 是什么 | 它与普通 AI 编码有何不同 | 三阶段 + OpenSpec 产物交接 |
| 3:30-7:30 | 三阶段如何运转 | 是否可控、可追踪、可复盘 | thinking/plan/dev 各阶段产物 |
| 7:30-10:30 | 治理与风控 | 安全、质量、边界怎么管 | hard stop、side-effect review、审计 |
| 10:30-13:00 | 业务价值/KPI | 投入产出比如何衡量 | 周期、返工、缺陷、审计通过率 |
| 13:00-15:00 | 落地方案与决策请求 | 下一步怎么做 | 30/60/90 天计划 + 资源请求 |

---

## 3. 业务问题 → TPD 解法（管理层视角）

**常见痛点**：

- 需求描述与技术实现之间存在“语义漂移”，导致多轮返工。
- 计划阶段缺少明确约束，开发阶段才暴露关键问题。
- 多模型并行虽然快，但缺少治理容易引入不可控变更。

**TPD 对应解法**：

- Thinking 阶段先产出“约束集”，而不是直接产出方案。
- Plan 阶段把含糊决策点清零，形成 zero-decision plan。
- Dev 阶段只做最小可验证闭环，逐步推进，减少一次性大改风险。

---

## 4. 核心介绍流程（重点讲这 4 分钟）

### 4.1 Phase A - Thinking：先找边界与约束

**你要讲的重点**：

- 先做复杂度评估，自动路由思考深度（light/deep/ultra）。
- 按“上下文边界”并行探索，不按“角色想象”拍脑袋分析。
- 最终交付 handoff.json，作为下一阶段输入。

**管理价值翻译**：

- 提前暴露不确定性，降低后续返工概率。
- 问题定义更清晰，减少团队对齐成本。

### 4.2 Phase B - Plan：把“可讨论”变成“可执行”

**你要讲的重点**：

- 复用 thinking 产物，避免重复提问。
- Codex + Gemini 双模型并行做架构规划（后端/前端视角）。
- 做歧义清理 + PBT（性质测试）提取 + 风险评估，输出 plan.md。

**管理价值翻译**：

- 从“看起来能做”变成“有约束、有测试、有风险预案地做”。
- 计划可审计，便于跨团队协同。

### 4.3 Phase C - Dev：最小相位迭代交付

**你要讲的重点**：

- 必须加载 plan 阶段的 architecture/constraints/pbt/risks。
- 外部模型只生成 prototype diff，最终代码必须由 Claude 审查重构。
- 每轮只做 1~3 个任务闭环，经过 side-effect review 与双模型审计后再推进。

**管理价值翻译**：

- 小步快跑但不失控，质量门禁前置。
- 保持交付节奏，同时可回滚、可复盘、可追责。

### 4.4 数据连续性（连接三阶段的“证据链”）

**建议强调一句**：

“TPD 的关键不是多模型本身，而是跨阶段产物的连续传递：Thinking 的约束 → Plan 的可执行计划 → Dev 的最小闭环实现。”

---

## 5. 现场演示脚本（8 分钟版）

### 5.0 当前仓库可直接演示的 change-id（实证样例）

- 推荐使用：`integrate-cc-v2133-features`
- 该样例具备 `thinking + plan + dev` 三个 artifacts 目录，可完整讲清阶段交接。
- 若要展示“已完成实施代码变更”，需先在该 change 上继续跑 dev 实施步骤（当前可稳定展示到 `tasks-scope.md` 级别）。

### 5.1 演示目标

让领导在 8 分钟内看到：

1. 三阶段不是概念，而是有真实产物目录。
2. 每一步都有检查点，不会‘一路自动跑偏’。
3. 最终交付可追溯到每一个决策与约束。

### 5.2 演示步骤

```bash
# Step 0: 初始化（已完成可跳过）
/tpd:init

# Step 1: 约束探索
/tpd:thinking "如何为核心模块引入可灰度发布机制" --depth=deep

# Step 2: 生成零决策计划
/tpd:plan

# Step 3: 最小相位实现
/tpd:dev
```

### 5.3 演示时必须打开的产物

- `openspec/changes/integrate-cc-v2133-features/artifacts/thinking/handoff.json`
- `openspec/changes/integrate-cc-v2133-features/artifacts/plan/plan.md`
- `openspec/changes/integrate-cc-v2133-features/artifacts/dev/tasks-scope.md`
- （可选）`openspec/changes/integrate-cc-v2133-features/artifacts/dev/changes.md`（若已执行实际代码落地）

**讲解点**：上一个阶段的文件会被下一个阶段显式复用，不是“隐式记忆”。

---

## 6. 管理层可直接采纳的 KPI（建议先试点再固化）

| KPI | 定义 | 目标趋势 |
| --- | --- | --- |
| 需求歧义关闭时长 | 从需求提出到约束清零的时间 | 下降 |
| 计划返工率 | plan 通过后因歧义重开比例 | 下降 |
| 最小相位交付周期 | 每轮 1~3 任务闭环平均时长 | 下降 |
| 审计一次通过率 | dev 阶段审计无关键问题通过比例 | 上升 |
| 变更可追溯率 | 代码变更可映射到约束/任务的比例 | 上升 |

---

## 7. 风险与控制（管理层问得最多）

| 风险 | 表现 | 控制策略 |
| --- | --- | --- |
| 模型输出质量波动 | 原型质量不稳定 | 外部模型仅产出 prototype，Claude 统一审查重构 |
| 过度自动化导致越界 | 生成超 scope 代码 | tasks-scope + side-effect review + hard stop |
| 组织采用成本 | 团队不熟悉三阶段节奏 | 先小范围试点，模板化培训与复盘 |
| 进度焦虑 | 认为流程变长 | 用“返工率下降 + 缺陷前移”证明总周期优化 |

---

## 8. 30/60/90 天落地建议

### 0-30 天：试点验证

- 选择 1 个中复杂度需求进行全流程试点。
- 固化汇报模板、产物清单、评审节奏。
- 采集首轮 KPI 基线。

### 31-60 天：流程固化

- 扩展到 2~3 个团队，形成统一任务拆分标准。
- 将 hard stop 与审计结论纳入周会机制。
- 建立“异常案例库”（返工原因、越界原因、修复模式）。

### 61-90 天：规模化推广

- 形成组织级 SOP 与培训材料。
- 将 KPI 接入团队效能看板。
- 评估与其他插件（commit、refactor、context-memory）的端到端联动。

---

## 9. 汇报结尾（建议 45 秒）

**建议收尾话术**：

“我们建议将 TPD 作为高价值需求的标准研发流程：先把需求从‘可讨论’变成‘可执行’，再把实现从‘一次性大改’变成‘最小相位闭环’。请审批：一个 30 天试点窗口、一个试点业务域、以及每周 30 分钟复盘机制。我们将在第 4 周交付量化结果与是否扩面的决策建议。”

---

## 10. Source of Truth（汇报可引用证据）

- 插件注册与版本：`.claude-plugin/marketplace.json:15`
- TPD 插件元信息：`plugins/tpd/.claude-plugin/plugin.json:2`
- OpenSpec 实证样例（完整三阶段目录）：`openspec/changes/integrate-cc-v2133-features/artifacts/`
- Thinking 已完成状态：`openspec/changes/integrate-cc-v2133-features/artifacts/thinking/state.json`
- Plan 已完成状态：`openspec/changes/integrate-cc-v2133-features/artifacts/plan/state.json`
- Dev 当前最小相位范围：`openspec/changes/integrate-cc-v2133-features/artifacts/dev/tasks-scope.md`
- 三阶段命令入口：`plugins/tpd/commands/thinking.md:14`、`plugins/tpd/commands/plan.md:18`、`plugins/tpd/commands/dev.md:13`
- Thinking 阶段状态机与产物：`plugins/tpd/commands/thinking.md:91`
- Thinking → Plan 交接产物：`plugins/tpd/commands/thinking.md:229`
- Plan 阶段复用 thinking 产物：`plugins/tpd/commands/plan.md:109`
- Plan 阶段多模型并行规划：`plugins/tpd/commands/plan.md:205`
- Plan 阶段验证与交付：`plugins/tpd/commands/plan.md:344`
- Dev 阶段必须加载 plan 产物：`plugins/tpd/commands/dev.md:79`
- Dev 阶段 side-effect review 与审计：`plugins/tpd/commands/dev.md:168`
- TPD 架构总览与并行约束：`llmdoc/architecture/tpd-workflow.md:5`
- 用户操作与 hard stop 指南：`llmdoc/guides/how-to-use-tpd.md:31`
- 10 个 Agent 目录：`llmdoc/reference/tpd-agents.md:5`

[DOCUMENT CONTENT ENDS]

Now, please generate the visual PPT outline and storyboard based on the above document.