---
name: task-decomposer
description: |
  【触发条件】plan 工作流第四步：将架构方案分解为可执行任务
  【核心产出】输出 ${run_dir}/tasks.md
  【强制工具】Skill 调用 codex-cli 验证任务可行性
allowed-tools:
  - Read
  - Write
  - Skill
  - mcp__sequential-thinking__sequentialthinking
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
---

# Task Decomposer - 任务分解原子技能

## 职责边界

- **输入**: `run_dir` + `${run_dir}/architecture.md`
- **输出**: `${run_dir}/tasks.md`
- **单一职责**: 只做任务分解，不做风险评估

## MCP 工具集成

| MCP 工具              | 用途                            | 触发条件        |
| --------------------- | ------------------------------- | --------------- |
| `sequential-thinking` | 结构化任务分解，确保 WBS 完整性 | 🚨 每次执行必用 |

## 执行流程

### Step 0: 结构化分解规划（sequential-thinking）

🚨 **必须首先使用 sequential-thinking 规划分解策略**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "规划任务分解策略。需要确定：1) WBS 层级结构 2) 任务粒度 3) 依赖关系 4) 关键路径 5) 并行机会",
  thoughtNumber: 1,
  totalThoughts: 6,
  nextThoughtNeeded: true
})
```

**思考步骤**：

1. **架构组件识别**：从 architecture.md 提取所有组件
2. **WBS 层级设计**：确定分解层级（推荐 3-5 层）
3. **任务粒度验证**：确保每个任务 1-4 小时可完成
4. **依赖图构建**：识别 FS/SS/FF 依赖类型
5. **关键路径计算**：找出总浮动时间为 0 的任务链
6. **并行机会发现**：识别可并行执行的任务组

### Step 1: 读取输入

```bash
ARCHITECTURE=$(cat "${run_dir}/architecture.md")
REQUIREMENTS=$(cat "${run_dir}/requirements.md")
```

提取：

- 架构组件列表
- API 端点
- 前端组件
- 数据模型
- 功能需求

### Step 2: WBS 分解

遵循 WBS 100% 规则进行分解：

| 规则         | 说明                     |
| ------------ | ------------------------ |
| 100% 规则    | WBS 必须涵盖项目全部工作 |
| 可交付物导向 | 以交付物为主线           |
| 层级约束     | 推荐 3~5 层              |
| 任务粒度     | 可在 1-4 小时内完成      |

### Step 3: 依赖分析

构建任务依赖图（DAG）：

| 依赖类型              | 说明            | 示例              |
| --------------------- | --------------- | ----------------- |
| FS (Finish-to-Start)  | A 完成后 B 开始 | 模型 → API → 前端 |
| SS (Start-to-Start)   | A/B 同时开始    | 前后端并行        |
| FF (Finish-to-Finish) | A/B 同时结束    | 联调              |

### Step 4: 关键路径分析

识别关键路径（Critical Path）：

- 计算每个任务的最早开始/结束时间
- 识别总浮动时间为 0 的任务链
- 标记关键任务

### Step 5: Contract-First 策略

对于 fullstack 任务，应用 Contract-First 策略：

1. **定义 API 接口** (Swagger/TypeScript Types) - 作为契约
2. **创建 Mock 数据** - 允许前端立即开始
3. **并行开发**:
   - 后端: 实现真实 API
   - 前端: 使用 Mock 开发 UI
4. **集成联调** - 切换 Mock → 真实 API
5. **视觉回归测试** - Storybook / 截图测试

### Step 6: 调用外部模型验证

使用 Codex 验证任务可行性：

```
Skill(skill="dev:codex-cli", args="prompt=验证以下任务分解的可行性...")
```

### Step 7: 结构化输出

将分解结果写入 `${run_dir}/tasks.md`：

```markdown
# 任务分解

## 元信息

- 分解时间: [timestamp]
- 总任务数: [count]
- 关键路径长度: [duration]
- 并行度: [max parallel tasks]

## WBS 结构
```

项目根节点
├── 1. 基础设施
│ ├── 1.1 数据库设计
│ │ ├── T-001: 创建数据库迁移脚本
│ │ └── T-002: 实现 Prisma Schema
│ └── 1.2 认证系统
│ ├── T-003: 实现 JWT 工具
│ └── T-004: 创建认证中间件
├── 2. 后端开发
│ ├── 2.1 API 端点
│ │ ├── T-005: POST /api/auth/login
│ │ └── T-006: POST /api/auth/register
│ └── 2.2 业务逻辑
│ ├── T-007: AuthService
│ └── T-008: UserService
└── 3. 前端开发
├── 3.1 组件开发
│ ├── T-009: LoginForm 组件
│ └── T-010: RegisterForm 组件
└── 3.2 页面集成
└── T-011: 路由配置

````

## 执行阶段

### 阶段 1: 基础设施（无依赖）

| ID | 任务 | 类型 | 复杂度 | 预估 | DoD |
|----|-----|-----|-------|-----|-----|
| T-001 | 创建数据库迁移脚本 | backend | 2/5 | - | 迁移可执行 |
| T-002 | 实现 Prisma Schema | backend | 2/5 | - | 类型生成成功 |
| T-003 | 实现 JWT 工具 | backend | 3/5 | - | 单元测试通过 |
| T-004 | 创建认证中间件 | backend | 3/5 | - | 集成测试通过 |

### 阶段 2: 后端 API（依赖阶段 1）

| ID | 任务 | 类型 | 复杂度 | 依赖 | DoD |
|----|-----|-----|-------|-----|-----|
| T-005 | POST /api/auth/login | backend | 3/5 | T-003, T-004 | API 测试通过 |
| T-006 | POST /api/auth/register | backend | 3/5 | T-001, T-002 | API 测试通过 |

### 阶段 3: 前端开发（可与阶段 2 并行）

| ID | 任务 | 类型 | 复杂度 | 依赖 | DoD |
|----|-----|-----|-------|-----|-----|
| T-007 | API 接口类型定义 | frontend | 2/5 | 阶段 1 完成 | 类型正确 |
| T-008 | Mock 数据创建 | frontend | 2/5 | T-007 | Mock 可用 |
| T-009 | LoginForm 组件 | frontend | 3/5 | T-008 | Storybook 可用 |
| T-010 | RegisterForm 组件 | frontend | 3/5 | T-008 | Storybook 可用 |

### 阶段 4: 集成联调（依赖阶段 2, 3）

| ID | 任务 | 类型 | 复杂度 | 依赖 | DoD |
|----|-----|-----|-------|-----|-----|
| T-011 | 前后端集成联调 | fullstack | 3/5 | T-005, T-006, T-009, T-010 | E2E 测试通过 |
| T-012 | 路由配置 | frontend | 2/5 | T-011 | 导航正常 |

## 依赖关系图

```mermaid
graph LR
    T001[T-001: DB Migration] --> T002[T-002: Prisma Schema]
    T002 --> T006[T-006: Register API]
    T003[T-003: JWT Utils] --> T005[T-005: Login API]
    T004[T-004: Auth Middleware] --> T005
    T007[T-007: Types] --> T008[T-008: Mock]
    T008 --> T009[T-009: LoginForm]
    T008 --> T010[T-010: RegisterForm]
    T005 --> T011[T-011: Integration]
    T006 --> T011
    T009 --> T011
    T010 --> T011
    T011 --> T012[T-012: Routes]
````

## 关键路径

```
T-001 → T-002 → T-006 → T-011 → T-012
```

关键任务（不可延迟）: T-001, T-002, T-006, T-011, T-012

## 并行执行建议

| 并行组 | 任务                | 说明           |
| ------ | ------------------- | -------------- |
| 组 1   | T-001, T-003, T-004 | 基础设施并行   |
| 组 2   | T-005, T-006, T-007 | API + 类型并行 |
| 组 3   | T-009, T-010        | 组件并行       |

## 里程碑

| 里程碑           | 完成条件           | 验收标准               |
| ---------------- | ------------------ | ---------------------- |
| M1: 基础设施就绪 | T-001 ~ T-004 完成 | 数据库可连接，认证可用 |
| M2: API 可用     | T-005, T-006 完成  | Swagger 文档可访问     |
| M3: 前端原型     | T-009, T-010 完成  | Storybook 可演示       |
| M4: 功能完成     | 全部任务完成       | E2E 测试通过           |

## 任务卡详情

### T-001: 创建数据库迁移脚本

| 字段   | 值                 |
| ------ | ------------------ |
| ID     | T-001              |
| 名称   | 创建数据库迁移脚本 |
| 类型   | backend            |
| 复杂度 | 2/5                |
| 依赖   | 无                 |

**输入**:

- 数据模型设计

**输出**:

- prisma/migrations/xxx_init.sql

**验收标准**:

- [ ] 迁移脚本可执行
- [ ] 表结构符合设计

---

下一步: 调用 risk-assessor 进行风险评估

```

## 返回值

执行完成后，返回：

```

任务分解完成。
输出文件: ${run_dir}/tasks.md
总任务数: X 个
执行阶段: Y 个
关键路径: Z 个任务

下一步: 使用 plan:risk-assessor 进行风险评估

```

## 质量门控

- ✅ 遵循 WBS 100% 规则
- ✅ 每个任务有明确的 DoD
- ✅ 依赖关系形成 DAG（无循环）
- ✅ 识别了关键路径
- ✅ 任务粒度合理（1-4 小时）

## 约束

- 不做风险评估（交给 risk-assessor）
- 不生成代码（交给 dev 阶段）
- 任务必须可独立验证
- 依赖图必须是有向无环图
```
