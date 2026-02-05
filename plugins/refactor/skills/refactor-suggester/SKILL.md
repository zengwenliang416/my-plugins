---
name: refactor-suggester
description: |
  【触发条件】重构工作流第二步：根据代码气味生成重构建议。
  【核心产出】输出 ${run_dir}/suggestions.json。
  【不触发】代码气味检测（用 smell-detector）、重构执行（用 refactor-executor）。
  【先问什么】smells.json 不存在时，询问是否先执行检测
  【MUST】codex-cli 生成技术建议，必须使用。
  【Legacy 模式】legacy=true 时，额外生成迁移相关的重构建议。
allowed-tools:
  - Write
  - Read
  - Skill
  - mcp__auggie-mcp__codebase-retrieval
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 command 传入）
  - name: legacy
    type: boolean
    required: false
    description: 是否启用遗留系统迁移建议模式（默认 false）
---

# Refactor Suggester - 重构建议生成原子技能

## 🚨 CRITICAL: MUST USE TOOLS

```
┌─────────────────────────────────────────────────────────────────┐
│  📋 建议生成                                                     │
│     ✅ 必须使用: codex-cli skill 生成后端技术建议                │
│     ✅ 可选使用: gemini-cli skill 生成前端组件建议               │
│     ❌ 禁止: Claude 自己猜测重构方案                              │
│                                                                  │
│  📊 模式匹配                                                     │
│     ✅ 根据气味类型匹配重构模式                                  │
│     ✅ 参考 references/refactoring-patterns.md                   │
│                                                                  │
│  ⚠️  必须调用 codex-cli，前端气味需调用 gemini-cli！            │
└─────────────────────────────────────────────────────────────────┘
```

---

## MCP 工具集成

| MCP 工具              | 用途                           | 触发条件        |
| --------------------- | ------------------------------ | --------------- |
| `auggie-mcp`          | 分析代码上下文，验证建议可行性 | 🚨 必须使用     |

## 前置检查

1. 验证 `${run_dir}/smells.json` 存在
2. 如果不存在，提示用户先执行 smell-detector

## 执行流程



```
  thought: "规划重构建议策略。需要：1) 分析气味类型 2) 匹配重构模式 3) 评估可行性 4) 排序优先级 5) 生成执行计划",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

### Step 1: 读取代码气味数据

```bash
smells=$(cat "${run_dir}/smells.json")
```

解析每个气味的类型、位置、严重程度。

### Step 2: 气味到重构模式映射

**后端代码气味：**

| 代码气味     | 推荐重构模式                                      |
| ------------ | ------------------------------------------------- |
| 过长函数     | Extract Method                                    |
| 过大类       | Extract Class, Move Method                        |
| 过长参数列表 | Introduce Parameter Object, Preserve Whole Object |
| 重复代码     | Extract Method, Pull Up Method                    |
| 散弹式修改   | Move Method, Move Field                           |
| 依恋情结     | Move Method                                       |
| 数据泥团     | Extract Class, Introduce Parameter Object         |
| 过度耦合     | Extract Interface, Dependency Injection           |
| 条件复杂度   | Replace Conditional with Polymorphism             |
| Switch 语句  | Replace Type Code with Subclasses                 |

**前端组件气味：**

| 组件气味           | 推荐重构模式                                          |
| ------------------ | ----------------------------------------------------- |
| God Component      | Extract Component, Split by Responsibility            |
| Prop Drilling      | Context/Store, Composition Pattern                    |
| CSS Bloat          | Extract Shared Styles, CSS Variables, Utility Classes |
| Missing Memo       | React.memo, useMemo, useCallback                      |
| Accessibility      | Add ARIA, Semantic HTML, Keyboard Navigation          |
| Responsiveness     | Mobile-first, Breakpoint System                       |
| State Smell        | Lift State, Custom Hooks, State Management            |
| Component Coupling | Extract Interface, Dependency Injection               |

### Step 2.5: 🆕 遗留系统迁移模式映射（legacy=true 时执行）

**仅当 legacy=true 时执行此步骤。**

首先读取遗留系统分析结果：

```bash
# 读取 legacy-analyzer 的产出
legacy_analysis=$(cat "${run_dir}/legacy-analysis.md")
migration_plan=$(cat "${run_dir}/migration-plan.json")
```

**前端遗留系统迁移模式：**

| 遗留气味         | 迁移策略                                          | 目标技术栈        |
| ---------------- | ------------------------------------------------- | ----------------- |
| jQuery Spaghetti | Incremental Component Migration, Adapter Pattern  | React/Vue/Angular |
| Global State     | Module Pattern → State Management Migration       | Redux/Vuex/Pinia  |
| Callback Hell    | Promise/async-await Migration, Observable Pattern | Modern ES6+       |
| $scope Pollution | ngUpgrade → Angular (ControllerAs → Component)    | Angular 17+       |
| Inline Styles    | CSS Extraction → CSS-in-JS/Utility Classes        | Tailwind/Styled   |
| Script Tag Soup  | Module Bundler Integration (Webpack/Vite)         | ES Modules        |
| Missing Bundler  | Build System Introduction                         | Vite/Webpack      |

**后端遗留系统迁移模式：**

| 遗留气味           | 迁移策略                                         | 目标架构              |
| ------------------ | ------------------------------------------------ | --------------------- |
| Monolithic Ball    | Strangler Fig Pattern, Domain Decomposition      | Microservices/Modular |
| Shared Database    | Database per Service, Event Sourcing             | Service-Oriented      |
| Sync Everything    | Message Queue Integration, Event-Driven          | Async Architecture    |
| No API Versioning  | API Gateway + Version Header                     | REST/GraphQL          |
| Hardcoded Config   | Configuration Externalization (Env/Consul/Vault) | 12-Factor App         |
| Session State      | Stateless Service + External Session Store       | Cloud Native          |
| Raw SQL Everywhere | ORM/QueryBuilder Introduction                    | TypeORM/Prisma        |
| Missing DI         | Dependency Injection Container                   | IoC Container         |
| COBOL Copybooks    | DTO Classes + Data Mapper                        | Java/TypeScript       |

**迁移策略到重构步骤的转换：**

| 迁移策略                      | 具体重构步骤                                                |
| ----------------------------- | ----------------------------------------------------------- |
| Strangler Fig Pattern         | 1. 引入 API Gateway 2. 创建新服务 3. 渐进路由 4. 下线旧代码 |
| Incremental Component         | 1. 包装旧组件 2. 并行运行 3. 逐个替换 4. 移除桥接层         |
| Database per Service          | 1. 定义边界 2. 数据复制 3. 双写过渡 4. 切换读取             |
| Configuration Externalization | 1. 提取配置 2. 环境变量 3. 配置中心 4. 热重载               |

### Step 3: 调用 Codex 生成详细建议

🚨 **必须通过 Skill 工具调用 codex-cli**

```
Skill(skill="codex-cli", args="--role refactoring-expert --prompt '${CODEX_PROMPT}' --sandbox read-only")
```

**CODEX_PROMPT 构建**：

```
## 角色
你是代码重构专家，精通 Martin Fowler 的重构技术。

## 任务
基于以下代码气味分析，生成详细的重构建议。

## 代码气味
${smells_summary}

## 输出要求
为每个气味生成重构建议，包含：
- refactoring_type: 重构类型（Extract Method, Extract Class 等）
- target: 目标符号
- steps: 详细执行步骤
- before_code: 重构前代码片段
- after_code: 重构后代码片段
- risk_level: 风险等级 (low/medium/high/critical)
- estimated_effort: 预估工作量

## 输出格式
仅输出 JSON 数组：
[{...}, {...}]
```

### Step 3.3: 🆕 遗留系统迁移建议（legacy=true 时执行）

🚨 **legacy=true 时必须额外执行此步骤**

**调用 Codex 生成迁移建议：**

```
Skill(skill="codex-cli", args="--role legacy-migration-expert --prompt '${MIGRATION_PROMPT}' --sandbox read-only")
```

**MIGRATION_PROMPT 构建**：

```
## 角色
你是遗留系统现代化专家，精通 Strangler Fig Pattern 和渐进式迁移。

## 任务
基于以下遗留系统分析，生成技术栈迁移的详细重构建议。

## 遗留系统分析
${legacy_analysis_summary}

## 迁移计划
${migration_plan_summary}

## 遗留代码气味
${legacy_smells}

## 输出要求
为每个迁移阶段生成重构建议，包含：
- migration_type: 迁移类型（strangler_fig, lift_shift, replatform, rebuild）
- source_tech: 源技术
- target_tech: 目标技术
- seam: 迁移接缝位置
- steps: 详细执行步骤
- rollback_plan: 回滚方案
- risk_level: 风险等级
- estimated_effort: 预估工作量
- dependencies: 前置依赖

## 输出格式
仅输出 JSON 数组：
[{...}, {...}]
```

**调用 Gemini 生成前端迁移建议：**

```
Skill(skill="gemini-cli", args="--role frontend-migration-expert --prompt '${FRONTEND_MIGRATION_PROMPT}'")
```

**FRONTEND_MIGRATION_PROMPT 构建**：

```
## 角色
你是前端遗留系统迁移专家，精通 jQuery/AngularJS 到现代框架的迁移。

## 任务
基于以下前端遗留气味，生成组件化迁移建议。

## 前端遗留气味
${legacy_frontend_smells}

## 目标技术栈
${target_stack}

## 输出要求
为每个前端迁移任务生成建议，包含：
- migration_type: 迁移类型（component_wrap, incremental_replace, full_rewrite）
- source_pattern: 源代码模式（jQuery selector, AngularJS directive 等）
- target_pattern: 目标代码模式（React component, Vue SFC 等）
- bridge_code: 过渡期桥接代码
- steps: 详细执行步骤
- coexistence_strategy: 共存策略

## 输出格式
仅输出 JSON 数组：
[{...}, {...}]
```

### Step 3.5: 调用 Gemini 生成前端建议（可选）

**使用条件**：

- 检测到前端组件气味（God Component, Prop Drilling, CSS Bloat 等）
- 目标文件包含 `.tsx`, `.jsx`, `.vue`, `.svelte`, `.css`, `.scss` 等

🚨 **当存在前端气味时，必须通过 Skill 工具调用 gemini-cli**

```
Skill(skill="gemini-cli", args="--role frontend-refactor --prompt '${GEMINI_PROMPT}'")
```

**GEMINI_PROMPT 构建**：

```
## 角色
你是前端重构专家，精通组件设计和 CSS 架构优化。

## 任务
基于以下前端代码气味分析，生成详细的重构建议。

## 组件气味
${frontend_smells_summary}

## 输出要求
为每个气味生成重构建议，包含：
- refactoring_type: 重构类型（Extract Component, CSS Optimization 等）
- target: 目标组件/文件
- steps: 详细执行步骤
- before_code: 重构前代码片段
- after_code: 重构后代码片段
- risk_level: 风险等级 (low/medium/high/critical)
- accessibility_impact: 可访问性影响
- responsive_impact: 响应式影响

## 输出格式
仅输出 JSON 数组：
[{...}, {...}]
```

### Step 4: 验证建议可行性（auggie-mcp）

🚨 **必须执行**

```
mcp__auggie-mcp__codebase-retrieval({
  "information_request": "验证以下重构建议的可行性：
    - 检查目标符号是否存在
    - 检查是否有测试覆盖
    - 检查是否有循环依赖风险
    - 检查是否影响公共 API"
})
```

### Step 5: 生成建议结果

**写入 `${run_dir}/suggestions.json`**：

```json
{
  "timestamp": "2026-01-19T12:00:00Z",
  "total_suggestions": 5,
  "suggestions": [
    {
      "id": "REF-001",
      "smell_id": "SMELL-001",
      "type": "extract_method",
      "target": {
        "file": "src/services/UserService.ts",
        "symbol": "processUserData",
        "line": 45
      },
      "description": "将 processUserData 方法拆分为三个子方法",
      "risk_level": "low",
      "confidence": 0.95,
      "steps": [
        {
          "order": 1,
          "action": "提取输入验证逻辑",
          "target_name": "validateUserInput",
          "lines": "48-65"
        },
        {
          "order": 2,
          "action": "提取数据转换逻辑",
          "target_name": "transformUserData",
          "lines": "66-95"
        },
        {
          "order": 3,
          "action": "提取持久化逻辑",
          "target_name": "persistUserData",
          "lines": "96-120"
        }
      ],
      "before_snippet": "async processUserData(data: UserInput) {\n  // 120 lines of code\n}",
      "after_snippet": "async processUserData(data: UserInput) {\n  this.validateUserInput(data);\n  const transformed = this.transformUserData(data);\n  await this.persistUserData(transformed);\n}",
      "estimated_effort": "30 minutes",
      "test_impact": {
        "affected_tests": ["UserService.test.ts"],
        "coverage_status": "covered"
      }
    },
    {
      "id": "REF-002",
      "smell_id": "SMELL-002",
      "type": "extract_class",
      "target": {
        "file": "src/core/AppManager.ts",
        "symbol": "AppManager",
        "line": 1
      },
      "description": "将 AppManager 拆分为三个职责明确的类",
      "risk_level": "high",
      "confidence": 0.85,
      "steps": [
        {
          "order": 1,
          "action": "创建 ConfigManager 类",
          "methods_to_move": ["loadConfig", "saveConfig", "getConfig"]
        },
        {
          "order": 2,
          "action": "创建 StateManager 类",
          "methods_to_move": ["getState", "setState", "resetState"]
        },
        {
          "order": 3,
          "action": "创建 EventBus 类",
          "methods_to_move": ["emit", "on", "off"]
        },
        {
          "order": 4,
          "action": "更新 AppManager 引用",
          "affected_files": 15
        }
      ],
      "estimated_effort": "4 hours",
      "test_impact": {
        "affected_tests": ["AppManager.test.ts", "integration/*.test.ts"],
        "coverage_status": "partial"
      }
    }
  ],
  "summary": {
    "by_type": {
      "extract_method": 3,
      "extract_class": 1,
      "introduce_parameter_object": 1
    },
    "by_risk": {
      "low": 3,
      "medium": 1,
      "high": 1
    },
    "total_estimated_effort": "6 hours"
  },
  "legacy_mode": false,
  "migration_suggestions": []
}
```

---

## 重构模式参考

详见 `references/refactoring-patterns.md`

## 质量门控

### 工具使用验证

- [ ] 调用了 codex-cli skill 生成建议
- [ ] 调用了 `mcp__auggie-mcp__codebase-retrieval` 验证可行性
- [ ] 生成了 `suggestions.json`

### 产出质量验证

- [ ] 每个建议关联到具体气味
- [ ] 每个建议有详细执行步骤
- [ ] 每个建议有风险评估
- [ ] 按优先级排序

---

## 约束

- 不检测代码气味（交给 smell-detector）
- 不执行重构（交给 refactor-executor）
- 不分析影响范围（交给 impact-analyzer）
- **必须通过 codex-cli skill 生成建议，不能自己猜测**
