# 功能域开发快速参考

**速查版本** - 用于快速回顾开发流程的核心要点

---

## 🚀 开发四步法

```
1️⃣ 规划     →  2️⃣ Skills   →  3️⃣ Agent    →  4️⃣ Hook
(1-2 天)       (3-5 天)       (1 天)         (0.5 天)
```

---

## 📋 检查清单

### 阶段一：规划 ✅

- [ ] 明确核心价值（3-5 个特性）
- [ ] 拆分 Skills（5-8 个）
- [ ] 设计工作流（5-8 个 Phases）
- [ ] 规划文件结构
- [ ] 编写实施计划文档

### 阶段二：Skills ✅

- [ ] 创建目录结构
- [ ] 实现所有 Skills（SKILL.md）
- [ ] 单元测试每个 Skill
- [ ] 验证输入输出正确

### 阶段三：Agent ✅

- [ ] 创建 orchestrator（SKILL.md）
- [ ] 实现状态管理（.local.md）
- [ ] 实现 Phase 编排
- [ ] 添加 Gate 检查
- [ ] 添加 Hard Stops
- [ ] 端到端测试

### 阶段四：Hook ✅

- [ ] 更新 patterns.json
- [ ] 添加 28+ 关键词
- [ ] 验证 JSON 语法
- [ ] 手动测试触发

### 阶段五：资源库（可选）✅

- [ ] 创建 MVP 资源（2-3 项）
- [ ] 实现搜索脚本
- [ ] 扩充到目标数量
- [ ] 生成 index.json
- [ ] 测试搜索功能

### 阶段六：交付 ✅

- [ ] 编写验证报告
- [ ] 运行所有测试
- [ ] 提交代码
- [ ] 更新文档

---

## 📁 必需文件模板

### 1. Skill 模板

**位置**: `.claude/skills/{domain}/{skill-name}/SKILL.md`

```yaml
---
name: {skill-name}
description: |
  【触发条件】何时使用
  【核心产出】输出什么
  【不触发】不适用场景
allowed-tools: Read, Write, Bash
---

# {Skill 名称}

## 职责边界
- **输入**: [描述]
- **输出**: [文件路径]

## 执行流程

### Step 1: [步骤]
[描述]

## Gate 检查
- [ ] 条件

## 返回值
[描述]
```

### 2. Agent 模板

**位置**: `.claude/agents/{domain}-orchestrator/SKILL.md`

```yaml
---
name: {domain}-orchestrator
description: |
  【触发条件】完整流程
  【核心产出】所有产物
  【不触发】单独操作
allowed-tools: Read, Write, Bash, Task, Skill, AskUserQuestion
---

# {Domain} Orchestrator

## 执行流程

### Phase 0: 初始化
- 创建状态文件
- Hard Stop: 询问用户选项

### Phase 1-N: 执行
- 调用 Skills
- Gate 检查
- 更新状态

### Phase N: 交付
- Hard Stop: 用户确认
```

### 3. 状态文件模板

**位置**: `.claude/{domain}.local.md`

```yaml
---
workflow_id: "YYYYMMDD-{domain}-NNN"
current_phase: "phase-name"
artifacts:
  key: "path/to/file"
checkpoint:
  last_successful_phase: "phase1"
created_at: "timestamp"
updated_at: "timestamp"
---
# 任务备注
[当前进展]
```

### 4. Hook 配置模板

**位置**: `.claude/hooks/evaluation/patterns.json`

```json
{
  "intents": {
    "{domain}": {
      "command": "/{domain}:{domain}-orchestrator",
      "keywords": ["关键词1", "关键词2"],
      "skills": ["{skill-1}", "{skill-2}"],
      "confidence_boost": ["术语1", "术语2"]
    }
  }
}
```

---

## 🎯 关键原则速记

### 开发顺序

```
Skill → Agent → Hook → Command
（自下而上，从原子到编排）
```

### 通信方式

```
文件路径 > 内存数据
（持久化 > 临时）
```

### 状态管理

```
每个 Phase 开始/结束时更新 .local.md
（断点恢复、可追溯）
```

### 并行设计

```
参数化 Skill + 独立输出文件
（variant_id=A/B/C → design-A/B/C.md）
```

### Gate 设计

```
可验证 + 有意义 + 有补救
（代码检查 > 主观判断）
```

### 用户交互

```
Hard Stop: 初始化 + 多选择 + 交付确认
（3 个关键节点）
```

---

## 🛠️ 常用命令

### 创建目录结构

```bash
mkdir -p ~/.claude/skills/{domain}/{skill-1,skill-2,skill-3}/_shared/{resources,scripts,docs}
mkdir -p ~/.claude/agents/{domain}-orchestrator
mkdir -p ~/.claude/{domain}
```

### 测试 Skills

```bash
# 单个测试
Skill("{skill-name}")

# 批量测试
for skill in skill-1 skill-2 skill-3; do
  echo "测试 $skill" && Skill("$skill")
done
```

### 测试 Agent

```bash
Skill("{domain}-orchestrator")
cat .claude/{domain}.local.md
ls -la .claude/{domain}/
```

### 测试资源库

```bash
cd ~/.claude/skills/{domain}/_shared/scripts
npx tsx search_resources.ts --domain {category} --query "test" --limit 5
cat ../index.json | jq '.resources | length'
```

### 验证 Hook

```bash
cat ~/.claude/hooks/evaluation/patterns.json | jq '.intents["{domain}"]'
cat ~/.claude/hooks/evaluation/patterns.json | jq empty
```

---

## ⚡ 并行执行模式

### 设计并行 Skill

```yaml
name: variant-generator
description: |
  支持并行：通过 variant_id 参数区分

# Agent 中调用
Task(skill="variant-generator", param="variant_id=A") &
Task(skill="variant-generator", param="variant_id=B") &
Task(skill="variant-generator", param="variant_id=C")
```

### 独立输出

```yaml
output:
  A: ".claude/{domain}/output-A.md"
  B: ".claude/{domain}/output-B.md"
  C: ".claude/{domain}/output-C.md"
```

---

## 🚦 Gate 检查模板

```yaml
Gate 1: [名称]
  条件:
    - [ ] 条件 1（可编程验证）
    - [ ] 条件 2（可编程验证）
    - [ ] 指标 ≥ 阈值
  失败处理:
    - 重试: 最多 3 次
    - 超限: 请求用户介入
```

---

## 📊 质量标准

### Skills

- ✅ SKILL.md 完整
- ✅ 单一职责
- ✅ 独立可运行
- ✅ 输入输出明确

### Agent

- ✅ 5-8 个 Phases
- ✅ 每个 Phase 有 Gate
- ✅ 状态持久化
- ✅ 3 个 Hard Stops

### 资源库

- ✅ YAML 格式
- ✅ 统一结构
- ✅ index.json 索引
- ✅ 搜索脚本可用

### Hook

- ✅ 28+ 关键词
- ✅ JSON 语法正确
- ✅ 触发测试通过

---

## 🐛 常见错误

### ❌ 错误 1: Skills 直接传递数据

```python
# 不要这样
result = skill_a()
skill_b(result)
```

**✅ 正确**:

```python
skill_a(output=".claude/{domain}/output-a.json")
skill_b(input=".claude/{domain}/output-a.json")
```

### ❌ 错误 2: Agent 只调用一个 Skill

**✅ 正确**: Agent 应编排 3+ 个 Skills

### ❌ 错误 3: 状态文件未更新

**✅ 正确**: 每个 Phase 开始/结束时更新

### ❌ 错误 4: Gate 无法编程验证

**✅ 正确**: 使用可量化的条件（长度、数量、阈值）

### ❌ 错误 5: 忘记 Circuit Breaker

**✅ 正确**: 设置最大重试和累计失败阈值

---

## 📈 开发进度追踪

### 第 1 天

- [ ] 需求分析
- [ ] 组件拆分
- [ ] 工作流设计
- [ ] 编写实施计划

### 第 2-3 天

- [ ] 创建目录结构
- [ ] 实现独立 Skills
- [ ] 单元测试

### 第 4-5 天

- [ ] 实现依赖 Skills
- [ ] 实现 Agent
- [ ] 端到端测试

### 第 6-7 天

- [ ] 构建资源库（如需要）
- [ ] 实现搜索引擎
- [ ] 填充资源

### 第 8 天

- [ ] Hook 配置
- [ ] 完整验证
- [ ] 编写报告
- [ ] 提交代码

---

## 💡 最佳实践一句话

| 原则         | 一句话                                   |
| ------------ | ---------------------------------------- |
| **开发顺序** | 自下而上：先 Skill 后 Agent              |
| **通信方式** | 文件路径传递，不传内存数据               |
| **状态管理** | 每个 Phase 更新 .local.md                |
| **并行执行** | 参数化 + 独立输出文件                    |
| **质量门禁** | 每阶段 Gate，可验证可补救                |
| **用户交互** | 3 个 Hard Stop：初始化、选择、确认       |
| **错误处理** | Circuit Breaker: 3 次重试 + 5 次累计阈值 |
| **文档完整** | SKILL.md + 实施计划 + 验证报告           |

---

## 📞 紧急救援

### 问题：Skill 调用失败

```bash
# 检查 SKILL.md 是否存在
ls ~/.claude/skills/{domain}/{skill-name}/SKILL.md

# 检查语法
cat ~/.claude/skills/{domain}/{skill-name}/SKILL.md | head -20
```

### 问题：Agent 无法编排

```bash
# 检查 Agent SKILL.md
cat ~/.claude/agents/{domain}-orchestrator/SKILL.md

# 检查状态文件
cat .claude/{domain}.local.md
```

### 问题：Hook 不触发

```bash
# 验证 JSON 语法
cat ~/.claude/hooks/evaluation/patterns.json | jq empty

# 查看日志
tail -f ~/.claude/logs/intent-router.log
```

### 问题：搜索无结果

```bash
# 验证索引
cat ~/.claude/skills/{domain}/_shared/index.json | jq '.resources | length'

# 测试搜索
cd ~/.claude/skills/{domain}/_shared/scripts
npx tsx search_resources.ts --limit 5
```

---

## 🔗 相关文档

- **完整流程**: [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md)
- **验证报告**: [VALIDATION_REPORT.md](../VALIDATION_REPORT.md)
- **实施计划**: `~/.claude/plans/{plan-name}.md`

---

**版本**: v1.0
**更新**: 2026-01-13
