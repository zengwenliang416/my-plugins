# 功能域开发流程指南

**版本**: v1.0
**更新日期**: 2026-01-13
**适用范围**: 基于四层架构（Hook→Command→Agent→Skill）的功能域开发

---

## 目录

1. [开发流程概览](#开发流程概览)
2. [阶段一：规划与设计](#阶段一规划与设计)
3. [阶段二：核心组件实施](#阶段二核心组件实施)
4. [阶段三：资源库建设](#阶段三资源库建设)
5. [阶段四：验证与交付](#阶段四验证与交付)
6. [最佳实践](#最佳实践)
7. [常见问题](#常见问题)

---

## 开发流程概览

### 完整开发周期

```
规划阶段 (1-2 天)
    ↓
核心组件实施 (3-5 天)
    ↓
资源库建设 (2-3 天)
    ↓
验证与交付 (1 天)
```

### 四层架构映射

| 层级        | 组件          | 职责                 | 开发顺序        |
| ----------- | ------------- | -------------------- | --------------- |
| **Hook**    | patterns.json | 意图识别、自动触发   | 第 4 步         |
| **Command** | /command-name | 用户入口、参数解析   | 第 5 步（可选） |
| **Agent**   | orchestrator  | 工作流编排、状态管理 | 第 2 步         |
| **Skill**   | atomic skills | 原子能力、单一职责   | 第 1 步         |

### 核心原则

- ✅ **自下而上开发**：Skill → Agent → Hook → Command
- ✅ **文件驱动通信**：组件间通过文件路径传递数据
- ✅ **状态持久化**：使用 `.local.md` 文件保存工作流状态
- ✅ **并行优先**：设计支持并行执行的 Skills
- ✅ **质量门禁**：每个阶段设置验证条件（Gate）

---

## 阶段一：规划与设计

**目标**：明确功能域的核心价值、架构设计、组件拆分

**产出**：完整的实施计划文档

### Step 1.1: 需求分析

**输入**：

- 用户需求或参考项目
- 类似功能域的实现案例

**输出**：

- 核心价值描述（3-5 个关键特性）
- 用户场景清单（2-3 个典型场景）
- 技术约束说明

**示例**：

```markdown
## 核心价值

- **设计智能库**：57 种 UI 样式、95 套色板、56 组字体对、98 条 UX 准则
- **并行变体生成**：生成 2-3 个不同风格的设计方案供选择
- **双模型协作**：Gemini 快速原型 + Claude 精简重构
- **状态驱动**：支持断点恢复，所有中间产物可追溯
- **技术栈支持**：React + Tailwind、Vue + Tailwind
```

### Step 1.2: 组件拆分

**原则**：

1. **单一职责**：每个 Skill 只做一件事
2. **可组合性**：Skills 可独立运行也可组合
3. **可并行性**：识别可并行执行的 Skills

**拆分方法**：

**方法 1：工作流阶段拆分**

```
需求分析 → 方案生成 → 验证检查 → 代码实施 → 质量验证
```

**方法 2：功能域拆分**

```
数据获取 | 数据转换 | 数据验证 | 数据输出
```

**方法 3：并行任务拆分**

```
变体 A 生成 ⚡
变体 B 生成 ⚡  → 汇总 → 用户选择
变体 C 生成 ⚡
```

**输出**：Skills 清单

| Skill 名称               | 职责     | 输入                            | 输出                | 并行支持 |
| ------------------------ | -------- | ------------------------------- | ------------------- | -------- |
| requirement-analyzer     | 需求分析 | 用户描述                        | requirements.md     | ❌       |
| style-recommender        | 样式推荐 | requirements.md                 | recommendations.md  | ❌       |
| design-variant-generator | 设计生成 | recommendations.md + variant_id | design-{variant}.md | ✅       |
| ux-guideline-checker     | UX 检查  | design-{variant}.md             | ux-report.md        | ❌       |
| code-generator           | 代码生成 | design-{variant}.md             | code/               | ❌       |
| quality-validator        | 质量验证 | code/                           | quality-report.md   | ❌       |

### Step 1.3: 工作流设计

**设计要素**：

1. **Phases**：将工作流分为 5-8 个阶段
2. **Gates**：每个阶段的验证条件
3. **Hard Stops**：需要用户交互的位置
4. **Circuit Breaker**：失败处理机制

**模板**：

```
Phase 0: 初始化
  - 创建工作目录
  - 初始化状态文件
  - 询问用户选项（Hard Stop）

Phase 1: [阶段名称]
  - 调用 Skill A
  - Gate 1: [验证条件]
  - 失败处理: 重试 3 次

Phase 2: [阶段名称]
  - 调用 Skill B
  - Gate 2: [验证条件]

Phase 3: [并行阶段]（可选）
  - 并行调用 Skill C1 & C2 & C3
  - Gate 3: 所有任务完成
  - Hard Stop: 用户选择结果

...

Phase N: 交付
  - 展示完整产物
  - Hard Stop: 用户确认
```

**输出**：工作流流程图（Markdown 格式）

### Step 1.4: 文件结构规划

**目录结构模板**：

```
.claude/
├── skills/{domain}/                 # 功能域目录
│   ├── {skill-1}/
│   │   └── SKILL.md                 # Skill 定义
│   ├── {skill-2}/
│   │   └── SKILL.md
│   └── _shared/                     # 共享资源
│       ├── {resources}/             # 资源库（可选）
│       ├── scripts/                 # 工具脚本
│       │   └── package.json
│       ├── docs/                    # 文档
│       └── index.json               # 资源索引（可选）
│
├── agents/{domain}-orchestrator/    # 主编排器
│   └── SKILL.md
│
├── {domain}/                        # 产物目录
│   ├── artifact-1.md
│   ├── artifact-2.json
│   └── output/
│
└── {domain}.local.md                # 状态文件
```

**文件命名规范**：

- Skills: `{verb}-{noun}` (如 `analyze-requirement`, `generate-variant`)
- Agent: `{domain}-orchestrator` (如 `ui-ux-design-orchestrator`)
- 产物: 描述性名称，使用连字符 (如 `style-recommendations.md`)
- 状态文件: `{domain}.local.md`

### Step 1.5: 编写实施计划

**计划文档结构**：

```markdown
# {功能域} 实施计划

## 一、Skills 拆分清单

（详细描述每个 Skill 的职责、输入输出、关键逻辑）

## 二、Agent 编排逻辑

（完整的工作流流程图和 Phase 描述）

## 三、文件存储结构

（目录树和文件说明）

## 四、Hook 触发配置

（patterns.json 配置和触发场景示例）

## 五、实施步骤

（分步骤的实施指南）

## 六、验证方法

（端到端验证场景和检查清单）
```

**保存位置**：`.claude/plans/{plan-name}.md`

---

## 阶段二：核心组件实施

**目标**：实现所有 Skills 和 Agent，确保核心工作流可运行

**开发顺序**：自下而上（Skill → Agent → Hook）

### Step 2.1: 创建目录结构

```bash
# 创建 Skills 目录
mkdir -p ~/.claude/skills/{domain}/{skill-1,skill-2,...}

# 创建 Agent 目录
mkdir -p ~/.claude/agents/{domain}-orchestrator

# 创建共享资源目录
mkdir -p ~/.claude/skills/{domain}/_shared/{resources,scripts,docs}

# 创建产物目录
mkdir -p ~/.claude/{domain}
```

### Step 2.2: 实现 Skills（自下而上）

#### Skill 模板

````yaml
---
name: {skill-name}
description: |
  【触发条件】何时使用这个技能
  【核心产出】输出什么成果
  【不触发】不适用的场景
allowed-tools: Read, Write, Bash, Grep, Glob, ...
---

# {Skill 名称}

## 职责边界

[单一职责描述]

- **输入**: [输入文件路径或参数]
- **输出**: [输出文件路径]
- **核心能力**: [关键功能]

## 执行流程

### Step 1: [步骤名称]

[详细描述]

```bash
# 命令示例
````

### Step 2: [步骤名称]

[详细描述]

## Gate 检查（如适用）

- [ ] 条件 1
- [ ] 条件 2

## 返回值

[描述返回内容或文件路径]

## 示例

**输入**：

```
[示例输入]
```

**输出**：

```
[示例输出]
```

````

#### 开发顺序

1. **独立 Skills**：无依赖的 Skills（如数据获取、验证类）
2. **依赖 Skills**：依赖其他 Skills 输出的 Skills
3. **并行 Skills**：可并行执行的 Skills（确保参数化）

**并行 Skill 设计要点**：
```yaml
# 支持 variant_id 参数
name: design-variant-generator
description: |
  根据推荐方案生成详细设计规格
  支持并行执行：可同时生成 variant_id=A/B/C
````

### Step 2.3: 实现 Agent（编排器）

#### Agent 模板

````yaml
---
name: {domain}-orchestrator
description: |
  【触发条件】用户需要完整{功能}流程时使用
  【核心产出】完整的{功能}流程，输出所有产物
  【不触发】单独的分析、单独的生成
allowed-tools: Read, Write, Bash, Task, Skill, AskUserQuestion
---

# {Domain} Orchestrator - {功能}编排器

## 职责边界

统一编排 {功能} 工作流，提供完整的端到端流程。

- **输入**: 用户需求 / 选项
- **输出**: 完整产物目录
- **核心能力**: 编排原子 Skills、状态管理、用户交互

## 状态文件

工作流状态保存在 `.claude/{domain}.local.md`：

```yaml
---
workflow_version: "1.0"
workflow_id: "YYYYMMDD-{domain}-NNN"
goal: "用户目标描述"
current_phase: "init | phase1 | phase2 | ... | done"
iterations:
  phase1: 0
  phase2: 0
max_iterations: 3

options:
  option_1: value
  option_2: value

artifacts:
  artifact_1: "path/to/file1.md"
  artifact_2: "path/to/file2.json"

subtasks:
  - id: "task-1"
    status: "pending | running | completed | failed"
    output: "path/to/output"

checkpoint:
  last_successful_phase: "phase1"

quality_metrics:
  metric_1: 0.85
  metric_2: 7.5

created_at: "timestamp"
updated_at: "timestamp"
---

# 任务备注

当前进展和用户选择记录
````

## 执行流程

### Phase 0: 初始化

```bash
mkdir -p .claude/{domain}
```

**创建状态文件**：`.claude/{domain}.local.md`

**询问用户选项**（Hard Stop）：

- 选项 1: [描述]
- 选项 2: [描述]

### Phase 1: [阶段名称]

```
调用: Skill("{skill-name}")
输入: [描述]
输出: [文件路径]
```

**Gate 1**:

- [ ] 条件 1
- [ ] 条件 2

**失败处理**: 最多重试 3 次

### Phase 2: [并行阶段]（可选）

```
并行启动 N 个 subagent：

Task(subagent_type="{skill-name}", param=A) &
Task(subagent_type="{skill-name}", param=B) &
Task(subagent_type="{skill-name}", param=C)

wait_all()
```

**Gate 2**:

- [ ] 所有任务完成

**Hard Stop**: 展示结果，用户选择

### Phase N: 交付

展示完整产物：

- 产物 1: [路径]
- 产物 2: [路径]

**Hard Stop**: 用户确认满意

## Circuit Breaker

- 单阶段最大重试: 3 次
- 累计失败阈值: 5 次（暂停并请求用户介入）
- 超时保护: 单阶段 10 分钟

## 返回值

```
{功能}完成！

📊 统计信息:
[关键指标]

📝 产物清单:
[文件列表]

🔄 后续操作:
[建议的下一步]
```

````

#### 关键实现细节

**1. 状态管理**
```python
# 伪代码示例
def update_state(phase, data):
    state = read_state(".claude/{domain}.local.md")
    state["current_phase"] = phase
    state["artifacts"].update(data)
    state["updated_at"] = now()
    write_state(".claude/{domain}.local.md", state)
````

**2. 并行执行**

```python
# 使用 Task 工具并行调用
results = parallel_execute([
    Task(skill="variant-generator", param="A"),
    Task(skill="variant-generator", param="B"),
    Task(skill="variant-generator", param="C")
])
```

**3. Gate 检查**

```python
def check_gate(conditions):
    for condition in conditions:
        if not condition.is_met():
            raise GateFailure(condition.message)
    return True
```

**4. 用户交互（Hard Stop）**

```python
# 使用 AskUserQuestion 工具
choice = ask_user([
    {"label": "选项 A", "description": "..."},
    {"label": "选项 B", "description": "..."},
])
```

### Step 2.4: 单元测试

**测试每个 Skill**：

```bash
# 手动调用测试
Skill("{skill-name}")

# 验证输出
ls .claude/{domain}/
cat .claude/{domain}/{output-file}
```

**测试 Agent**：

```bash
# 完整流程测试
Skill("{domain}-orchestrator")

# 验证状态文件
cat .claude/{domain}.local.md
```

---

## 阶段三：资源库建设

**目标**：构建功能域所需的资源库（如适用）

**适用场景**：

- ✅ 设计风格库（UI/UX）
- ✅ 代码模板库（代码生成）
- ✅ 规则库（验证检查）
- ✅ 示例库（学习参考）

### Step 3.1: 确定资源类型

**资源分类**：

| 类型     | 格式              | 示例               |
| -------- | ----------------- | ------------------ |
| 静态数据 | YAML/JSON         | 设计风格、配色方案 |
| 模板     | Markdown/Code     | 代码模板、文档模板 |
| 规则     | YAML              | UX 准则、代码规范  |
| 脚本     | TypeScript/Python | 搜索引擎、转换工具 |

### Step 3.2: 设计资源结构

**YAML 资源模板**：

```yaml
# styles/example-style.yaml
name: Example Style
keywords: [modern, clean, professional]
适用场景: [企业官网, SaaS 产品, 管理后台]
参考案例: [Example 1, Example 2]

# 核心内容
content:
  key1: value1
  key2: value2

# 使用指南
tips:
  - 提示 1
  - 提示 2
```

**JSON 索引模板**：

```json
{
  "version": "1.0.0",
  "last_updated": "YYYY-MM-DD",
  "total_count": {
    "category_1": 23,
    "category_2": 17
  },
  "resources": [
    {
      "id": "category-resource-name",
      "domain": "category",
      "name": "Resource Name",
      "file_path": "category/resource-name.yaml",
      "keywords": ["keyword1", "keyword2"],
      "description": "简短描述"
    }
  ]
}
```

### Step 3.3: 实现搜索引擎（如需要）

**搜索脚本模板** (`scripts/search_resources.ts`):

```typescript
#!/usr/bin/env -S npx tsx

import * as fs from "fs";
import * as path from "path";

interface SearchOptions {
  domain?: string;
  query?: string;
  limit?: number;
}

function loadIndex(): any {
  const indexPath = path.join(__dirname, "..", "index.json");
  return JSON.parse(fs.readFileSync(indexPath, "utf-8"));
}

function searchResources(options: SearchOptions) {
  const index = loadIndex();
  let results = index.resources;

  // 领域过滤
  if (options.domain) {
    results = results.filter((r) => r.domain === options.domain);
  }

  // 关键词匹配
  if (options.query) {
    const keywords = options.query.toLowerCase().split(" ");
    results = results.filter((r) => {
      const text =
        `${r.name} ${r.keywords.join(" ")} ${r.description}`.toLowerCase();
      return keywords.some((kw) => text.includes(kw));
    });
  }

  // 相关性排序
  results.sort(
    (a, b) =>
      calculateRelevance(b, options.query) -
      calculateRelevance(a, options.query),
  );

  // 限制结果数量
  if (options.limit) {
    results = results.slice(0, options.limit);
  }

  return results;
}

function calculateRelevance(item: any, query?: string): number {
  if (!query) return 0;
  let score = 0;
  const keywords = query.toLowerCase().split(" ");

  keywords.forEach((kw) => {
    if (item.name?.toLowerCase().includes(kw)) score += 3;
    if (item.keywords?.some((k) => k.toLowerCase().includes(kw))) score += 2;
    if (item.description?.toLowerCase().includes(kw)) score += 1;
  });

  return score;
}

// CLI 入口
const args = process.argv.slice(2);
const options: SearchOptions = {};

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace("--", "");
  const value = args[i + 1];

  if (key === "domain") options.domain = value;
  else if (key === "query") options.query = value;
  else if (key === "limit") options.limit = parseInt(value);
}

const results = searchResources(options);
console.log(JSON.stringify(results, null, 2));
```

**package.json**:

```json
{
  "name": "{domain}-resources",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "tsx": "^4.0.0",
    "yaml": "^2.0.0"
  }
}
```

### Step 3.4: 填充资源内容

**资源创建策略**：

1. **MVP 资源**（最小可用）：
   - 每个分类 2-3 个示例资源
   - 覆盖主要用例
   - 快速验证流程

2. **完整资源**（生产级）：
   - 参考计划目标数量（如 20+ 样式、15+ 配色）
   - 覆盖多个行业/场景
   - 提供详细说明和示例

**开发顺序**：

```
MVP 资源（2-3 项）
    ↓
验证搜索和调用
    ↓
扩充资源库（目标数量）
    ↓
更新索引文件
```

### Step 3.5: 更新资源索引

**索引生成脚本** (`scripts/generate_index.ts`):

```typescript
#!/usr/bin/env -S npx tsx

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

function generateIndex() {
  const index = {
    version: "1.0.0",
    last_updated: new Date().toISOString().split('T')[0],
    total_count: {},
    resources: []
  };

  const categories = ['styles', 'colors', 'typography', ...];

  categories.forEach(category => {
    const dir = path.join(__dirname, '..', category);
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.yaml'));
    index.total_count[category] = files.length;

    files.forEach(file => {
      const content = yaml.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
      index.resources.push({
        id: `${category}-${path.basename(file, '.yaml')}`,
        domain: category,
        name: content.name,
        file_path: `${category}/${file}`,
        keywords: content.keywords || [],
        description: content.description || ''
      });
    });
  });

  fs.writeFileSync(
    path.join(__dirname, '..', 'index.json'),
    JSON.stringify(index, null, 2)
  );

  console.log(`✅ 索引生成完成：${index.resources.length} 项资源`);
}

generateIndex();
```

---

## 阶段四：验证与交付

**目标**：确保系统完整可用，所有组件通过验证

### Step 4.1: Hook 配置

**更新 patterns.json**：

```json
{
  "intents": {
    "{domain}-intent": {
      "command": "/{domain}:{domain}-orchestrator",
      "keywords": ["关键词1", "关键词2", "keyword1", "keyword2"],
      "skills": ["{skill-1}", "{skill-2}"],
      "confidence_boost": ["boost-term-1", "boost-term-2"]
    }
  }
}
```

**触发场景示例**：
| 用户输入 | 触发意图 | 说明 |
|---------|---------|------|
| "关键词1 + 关键词2" | ✅ {domain} | 命中多个关键词 |
| "boost-term-1" | ✅ {domain} | 置信度提升 |
| "无关输入" | ❌ 不触发 | 无匹配关键词 |

### Step 4.2: 单元测试

**测试清单**：

**✅ Skills 测试**

```bash
# 测试每个 Skill
for skill in {skill-1} {skill-2} ...; do
  echo "测试 $skill"
  Skill("$skill")
done
```

**✅ Agent 测试**

```bash
# 手动触发完整流程
Skill("{domain}-orchestrator")

# 验证状态文件
cat .claude/{domain}.local.md

# 验证产物文件
ls -la .claude/{domain}/
```

**✅ 资源库测试**

```bash
# 测试搜索脚本
cd ~/.claude/skills/{domain}/_shared/scripts
npx tsx search_resources.ts --domain {category} --query "test" --limit 5

# 验证索引完整性
cat ~/.claude/skills/{domain}/_shared/index.json | jq '.resources | length'
```

**✅ Hook 测试**

```bash
# 验证 JSON 语法
cat ~/.claude/hooks/evaluation/patterns.json | jq empty

# 模拟用户输入（手动测试）
# 输入包含关键词的需求，观察是否自动触发
```

### Step 4.3: 端到端验证

**验证场景**：

**场景 1：从零开始**

```
用户输入: "{domain} 需求描述"

预期流程:
1. ✅ Hook 识别关键词 → 触发 {domain} 意图
2. ✅ 启动 {domain}-orchestrator
3. ✅ Phase 0: 询问用户选项
4. ✅ Phase 1-N: 执行所有阶段
5. ✅ 交付完整产物
```

**场景 2：优化现有**（如适用）

```
用户输入: "优化 {existing-item}"

预期流程:
1. ✅ 识别优化场景
2. ✅ 分析现有内容
3. ✅ 生成改进方案
```

**验证检查清单**：

- [ ] 所有 Skill SKILL.md 文件存在
- [ ] Agent SKILL.md 文件存在
- [ ] 状态文件正确创建和更新
- [ ] 所有产物文件生成
- [ ] 资源索引包含所有资源
- [ ] 搜索脚本返回正确结果
- [ ] Hook 配置语法正确
- [ ] 端到端场景测试通过

### Step 4.4: 编写验证报告

**报告结构** (`{DOMAIN}_VALIDATION_REPORT.md`):

```markdown
# {功能域} 验证报告

**验证日期**: YYYY-MM-DD
**版本**: v1.0.0

## 一、执行摘要

✅ 所有验证项通过

### 核心指标

| 指标        | 目标 | 实际 | 状态 |
| ----------- | ---- | ---- | ---- |
| Skills 数量 | N    | N    | ✅   |
| Agent 数量  | 1    | 1    | ✅   |
| 资源数量    | X+   | Y    | ✅   |

## 二、组件验证

### Skills 验证

[列出所有 Skills 及其验证状态]

### Agent 验证

[Agent 工作流验证]

### 资源库验证

[资源统计和测试结果]

## 三、功能验证

### 搜索引擎测试

[测试用例和结果]

### Hook 触发测试

[触发场景验证]

### 端到端测试

[完整场景测试结果]

## 四、质量门禁验证

### Gate 检查点

[所有 Gate 的验证结果]

### Circuit Breaker

[断路器配置和测试]

## 五、性能指标

[关键性能数据]

## 六、已知限制

[当前不支持的功能]

## 七、建议与改进

### 短期改进

### 中期改进

### 长期改进

## 八、结论

✅ 系统已就绪，可投入使用
```

### Step 4.5: 提交代码

**提交策略**：

**单次提交**（推荐小型功能域）：

```bash
git add .
git commit -m "✨ feat({domain}): 新增完整{功能}工作流系统

- 新增 N 个 Skills
- 新增主编排器 Agent
- 构建资源库（X 项资源）
- 更新 Hook 配置
- 完成端到端验证"
```

**分批提交**（推荐大型功能域）：

```bash
# 提交 1: Skills
git add .claude/skills/{domain}/
git commit -m "✨ feat({domain}): 新增 {N} 个原子 Skills"

# 提交 2: Agent
git add .claude/agents/{domain}-orchestrator/
git commit -m "✨ feat({domain}): 新增主编排器 Agent"

# 提交 3: 资源库
git add .claude/skills/{domain}/_shared/
git commit -m "📚 feat({domain}): 构建资源库（X 项资源）"

# 提交 4: Hook 配置
git add .claude/hooks/evaluation/patterns.json
git commit -m "⚙️ feat({domain}): 更新 Hook 配置，新增意图识别"

# 提交 5: 文档
git add .claude/{domain}/VALIDATION_REPORT.md
git commit -m "📝 docs({domain}): 添加验证报告"
```

---

## 最佳实践

### 1. 文件驱动通信

**❌ 错误**：Skills 间直接传递数据

```python
# 不要这样做
result = skill_a.execute(input)
skill_b.execute(result)  # 直接传递内存数据
```

**✅ 正确**：通过文件路径传递

```python
# 应该这样做
skill_a_output = ".claude/{domain}/output-a.json"
skill_a.execute(input, output=skill_a_output)

skill_b_input = skill_a_output
skill_b.execute(input=skill_b_input)
```

**好处**：

- 可追溯：所有中间产物都保存
- 可恢复：工作流中断后可从文件恢复
- 可调试：每个阶段的输出可单独检查

### 2. 状态持久化

**必需字段**：

```yaml
---
workflow_version: "1.0" # 工作流版本
workflow_id: "unique-id" # 唯一标识
current_phase: "phase-name" # 当前阶段
artifacts: # 产物路径
  key: "path/to/file"
checkpoint: # 断点信息
  last_successful_phase: "phase1"
created_at: "timestamp"
updated_at: "timestamp"
---
```

**更新时机**：

- ✅ 每个 Phase 开始时
- ✅ 每个 Phase 完成时
- ✅ 发生错误时
- ✅ 用户交互时

### 3. 并行执行设计

**参数化 Skill**：

```yaml
name: variant-generator
description: |
  支持并行：variant_id = A | B | C

执行示例：
  Task(skill="variant-generator", param="variant_id=A") &
  Task(skill="variant-generator", param="variant_id=B") &
  Task(skill="variant-generator", param="variant_id=C")
```

**独立输出**：

```yaml
# 每个并行任务输出到独立文件
output:
  variant_A: ".claude/{domain}/design-A.md"
  variant_B: ".claude/{domain}/design-B.md"
  variant_C: ".claude/{domain}/design-C.md"
```

### 4. Gate 检查设计

**原则**：

- ✅ 每个 Phase 有明确的成功条件
- ✅ 失败时提供清晰的错误信息
- ✅ 设置最大重试次数

**示例**：

```yaml
Gate 1: 需求清晰度
  条件:
    - product_type 已识别
    - core_function 已识别
    - target_user 已识别
    - confidence ≥ 0.75
  失败处理:
    - 重试: 最多 3 次
    - 超出重试: 请求用户补充信息
```

### 5. 用户交互设计

**Hard Stop 位置**：

- ✅ 初始化（询问选项）
- ✅ 多选择分支（用户选择方案）
- ✅ 最终交付（用户确认）

**使用 AskUserQuestion 工具**：

```python
choice = ask_user([
    {
        "question": "请选择设计方案",
        "header": "设计方案",
        "options": [
            {"label": "方案 A（稳妥）", "description": "..."},
            {"label": "方案 B（创意）", "description": "..."},
            {"label": "方案 C（平衡）", "description": "..."}
        ],
        "multiSelect": False
    }
])
```

### 6. 资源库设计

**YAML 优于 JSON**（对于配置和数据）：

- ✅ 可读性更强
- ✅ 支持注释
- ✅ 更简洁的语法

**索引优化**：

- ✅ 提供快速搜索能力
- ✅ 包含足够的元数据（keywords, description）
- ✅ 支持多维度过滤（domain, industry, style）

### 7. 错误处理

**分层错误处理**：

```
Skill 层: 具体错误（文件不存在、格式错误）
    ↓
Agent 层: 阶段错误（Gate 失败、重试超限）
    ↓
Hook 层: 意图错误（无匹配意图）
```

**Circuit Breaker 配置**：

```yaml
circuit_breaker:
  single_phase_max_retry: 3 # 单阶段最大重试
  total_failure_threshold: 5 # 累计失败阈值
  timeout_per_phase: 600000 # 单阶段超时（毫秒）
```

### 8. 文档完整性

**必需文档**：

- ✅ 实施计划（.claude/plans/）
- ✅ 验证报告（技能目录下）
- ✅ 开发流程指南（本文档）
- ✅ SKILL.md（每个组件）

**可选文档**：

- references/ - 参考资料
- examples/ - 使用示例
- FAQ.md - 常见问题

---

## 常见问题

### Q1: 何时应该创建新的功能域？

**应该创建新功能域**：

- ✅ 功能逻辑独立，与现有功能域无重叠
- ✅ 有明确的用户价值和使用场景
- ✅ 需要 3+ 个原子 Skills 配合完成
- ✅ 有专门的资源库或知识库

**不应该创建新功能域**：

- ❌ 功能可以作为现有功能域的一个 Skill
- ❌ 只是现有功能的参数变体
- ❌ 功能过于简单（1-2 个操作即可完成）

### Q2: Skill 和 Agent 的界限在哪里？

**Skill**：

- 单一职责
- 无状态（或状态简单）
- 可独立运行
- 不编排其他 Skills

**Agent**：

- 工作流编排
- 状态管理
- 调用多个 Skills
- 处理用户交互

**反例**：不要创建只调用一个 Skill 的 Agent

### Q3: 资源库是否必需？

**需要资源库**：

- ✅ 功能依赖大量静态数据（设计风格、规则库）
- ✅ 数据需要频繁更新和扩展
- ✅ 需要搜索和过滤能力

**不需要资源库**：

- ❌ 功能主要是数据转换和流程控制
- ❌ 数据可以通过 API 实时获取
- ❌ 数据量很小（< 10 项）

### Q4: 如何决定并行执行的粒度？

**适合并行**：

- ✅ 任务间无依赖关系
- ✅ 任务耗时较长（> 30 秒）
- ✅ 任务输出独立（不需要汇总）

**不适合并行**：

- ❌ 任务有先后依赖
- ❌ 任务很快（< 10 秒）
- ❌ 需要实时用户反馈

**最佳实践**：2-5 个并行任务

### Q5: 如何设计合理的 Gate？

**Good Gate**：

- ✅ 可验证（能编程检查）
- ✅ 有意义（真正影响后续流程）
- ✅ 有补救（失败后可重试或修正）

**Bad Gate**：

- ❌ 主观判断（如"质量好不好"）
- ❌ 无意义（总是通过）
- ❌ 无补救（失败即终止）

**示例**：

```yaml
✅ Good Gate:
  - JSON 格式有效
  - 至少包含 2 个方案
  - confidence ≥ 0.75

❌ Bad Gate:
  - 结果看起来不错
  - 用户可能满意
  - 没有明显错误
```

### Q6: 状态文件应该保存哪些信息？

**必需信息**：

- workflow_id（唯一标识）
- current_phase（当前阶段）
- artifacts（产物路径）
- checkpoint（断点信息）

**推荐信息**：

- options（用户选项）
- iterations（重试计数）
- quality_metrics（质量指标）

**不要保存**：

- ❌ 大量数据内容（应保存在独立文件）
- ❌ 临时变量
- ❌ 日志信息

### Q7: 如何测试 Hook 触发？

**方法 1：日志监控**

```bash
tail -f ~/.claude/logs/intent-router.log
```

**方法 2：手动测试**

```
输入包含关键词的句子，观察是否触发对应 Agent
```

**方法 3：单元测试**

```bash
# 验证 JSON 语法
cat ~/.claude/hooks/evaluation/patterns.json | jq empty
```

### Q8: 多模型协作如何设计？

**推荐模式**：

```
Step 1: Gemini 生成原型（快速、创意）
  ↓
Step 2: Claude 重构（精简、规范）
  ↓
Step 3: 质量验证
```

**关键点**：

- ✅ 外部模型输出视为"脏原型"
- ✅ Claude 必须重构后才交付
- ✅ 明确各模型的优势领域

---

## 总结

### 核心流程回顾

```
1. 规划与设计（1-2 天）
   - 需求分析
   - 组件拆分
   - 工作流设计
   - 文件结构规划
   - 编写实施计划

2. 核心组件实施（3-5 天）
   - 创建目录结构
   - 实现 Skills（自下而上）
   - 实现 Agent（编排器）
   - 单元测试

3. 资源库建设（2-3 天）
   - 确定资源类型
   - 设计资源结构
   - 实现搜索引擎
   - 填充资源内容
   - 更新资源索引

4. 验证与交付（1 天）
   - Hook 配置
   - 单元测试
   - 端到端验证
   - 编写验证报告
   - 提交代码
```

### 关键原则

1. ✅ **自下而上开发**：Skill → Agent → Hook
2. ✅ **文件驱动通信**：组件间通过文件路径传递
3. ✅ **状态持久化**：使用 .local.md 保存状态
4. ✅ **并行优先**：设计支持并行的 Skills
5. ✅ **质量门禁**：每阶段设置 Gate 验证
6. ✅ **用户中心**：关键节点设置 Hard Stop
7. ✅ **完整文档**：每个组件有清晰的 SKILL.md

### 成功标准

- ✅ 所有 Skills 独立可运行
- ✅ Agent 可完成端到端流程
- ✅ Hook 自动触发正确
- ✅ 资源库可搜索（如适用）
- ✅ 所有测试通过
- ✅ 验证报告完整

---

**文档版本**: v1.0
**最后更新**: 2026-01-13
**维护者**: Claude Code Team
