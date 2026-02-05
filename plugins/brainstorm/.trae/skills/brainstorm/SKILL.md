# /brainstorm - AI 协作头脑风暴

头脑风暴工作流：主题研究 → 创意生成 → 创意评估 → 报告生成

## 使用方法

```bash
# 快速开始
/brainstorm "程序员解压玩具"

# 深度研究模式
/brainstorm "2026 智能家居趋势" --deep

# 指定发散方法
/brainstorm "优化结账流程" --method=scamper

# 恢复会话
/brainstorm --run-id=20260118T090000Z
```

## 执行规则

**必须按顺序调用智能体执行各阶段。**

**约束：**

- 必须调用智能体（不能直接生成创意）
- 验证输出文件后再进入下一阶段
- 不能跳过阶段（--skip-research 除外）

---

## Phase 0: 初始化

1. 解析参数：
   - TOPIC: 用户输入的主题
   - DEEP: 深度研究模式 (--deep)
   - METHOD: 发散方法 (scamper/hats/auto，默认 auto)
   - SKIP_RESEARCH: 跳过研究阶段 (--skip-research)
   - RUN_ID: 恢复会话 (--run-id=xxx)

2. 创建运行目录：

   ```bash
   RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
   RUN_DIR=".trae/runs/brainstorm/${RUN_ID}"
   mkdir -p "$RUN_DIR"
   ```

3. 确认执行计划

---

## Phase 1: 主题研究

调用 @topic-researcher，参数：

- run_dir: ${RUN_DIR}
- topic: ${TOPIC}
- deep: ${DEEP}

**跳过条件：**

- 用户指定 --skip-research
- research-brief.md 已存在于 RUN_DIR

**验证：** `${RUN_DIR}/research-brief.md` 存在，包含趋势、案例、建议

---

## Phase 2: 创意生成

调用 @idea-generator，参数：

- run_dir: ${RUN_DIR}
- method: ${METHOD}

**验证：**

- `${RUN_DIR}/ideas-pool.md` 存在
- 包含 20+ 创意

---

## Phase 3: 创意评估

调用 @idea-evaluator，参数：

- run_dir: ${RUN_DIR}
- criteria: balanced（或用户指定）

**验证：**

- `${RUN_DIR}/evaluation.md` 存在
- 包含 Mermaid 思维导图和 Top 5 排名

**强制停止：** 展示 Top 5，确认后再继续

---

## Phase 4: 报告生成

调用 /report-synthesizer，参数：

- run_dir: ${RUN_DIR}
- format: detailed（或 brief）

**验证：** `${RUN_DIR}/brainstorm-report.md` 存在

---

## Phase 5: 交付

输出完成摘要：

```
头脑风暴完成！

主题: ${TOPIC}
研究模式: ${DEEP ? '深度' : '快速'}
发散方法: ${METHOD}

结果:
- 研究发现: N 个趋势/案例
- 生成创意: M 个
- Top 5 方案: 已完成

产出文件:
  ${RUN_DIR}/
  ├── research-brief.md    # 研究简报
  ├── ideas-pool.md        # 创意池 (20+ 创意)
  ├── evaluation.md        # 评估 (含思维导图)
  └── brainstorm-report.md # 最终报告
```

---

## 特殊情况

### 恢复会话

如果指定 --run-id：

1. 检查 RUN_DIR 是否存在
2. 检查各阶段产出
3. 从缺失的阶段继续

### 宽泛主题

如果主题缺乏具体性：

- topic-researcher 会询问用户具体方向
- 或在 Phase 0 询问约束条件

### 快速模式

快速执行：

- --skip-research 跳过研究阶段
- --method=auto 自动选择最佳发散方法
