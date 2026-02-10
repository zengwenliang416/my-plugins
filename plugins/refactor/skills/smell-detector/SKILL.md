---
name: smell-detector
description: |
  【触发条件】重构工作流第一步：检测目标代码中的代码气味。
  【核心产出】输出 ${run_dir}/smells.json 和 ${run_dir}/smells-report.md。
  【不触发】直接重构（用 refactor-executor）、影响分析（用 impact-analyzer）。
  【先问什么】目标路径过于宽泛时，询问具体范围
  【MUST】auggie-mcp 语义分析 + LSP 符号分析，必须使用。
  【Legacy 模式】legacy=true 时，额外检测遗留系统特有气味。
  [Resource Usage] Use references/, assets/.
allowed-tools:
  - Write
  - LSP
  - Bash
  - Skill
  - Read
  - mcp__auggie-mcp__codebase-retrieval
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 command 传入）
  - name: target
    type: string
    required: true
    description: 检测目标路径（文件或目录）
  - name: legacy
    type: boolean
    required: false
    description: 是否启用遗留系统气味检测模式（默认 false）
---

# Smell Detector - 代码气味检测原子技能

## 🚨 CRITICAL: MUST USE TOOLS

```
┌─────────────────────────────────────────────────────────────────┐
│  📦 代码分析                                                     │
│     ✅ 必须使用: auggie-mcp → LSP                                │
│     ❌ 禁止使用: 直接 Read 猜测                                   │
│                                                                  │
│  📊 度量计算                                                     │
│     ✅ 使用 LSP.documentSymbol 获取函数/类结构                   │
│     ✅ 使用行数、参数数等指标判断                                │
│                                                                  │
│  ⚠️  必须对每个目标文件调用 LSP，不能跳过！                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## MCP 工具集成

| MCP 工具              | 用途                             | 触发条件        |
| --------------------- | -------------------------------- | --------------- |
| `auggie-mcp`          | 语义分析代码结构和依赖关系       | 🚨 必须首先使用 |

## 执行流程



```
  thought: "规划代码气味检测策略。需要：1) 分析目标范围 2) 确定检测维度 3) 设定阈值标准 4) 规划符号分析 5) 规划报告结构",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**思考步骤**：

1. **目标范围分析**：确定检测的文件和目录范围
2. **检测维度确定**：选择适用的代码气味类型
3. **阈值标准设定**：根据项目特性设定检测阈值
4. **符号分析规划**：确定需要深入分析的关键符号
5. **报告结构规划**：确定输出格式和优先级排序

### Step 1: 获取目标文件列表

```bash
# 如果是目录，获取所有代码文件
find ${target} -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" \) | head -50
```

### Step 2: 语义分析（auggie-mcp）

🚨 **必须执行**

```
mcp__auggie-mcp__codebase-retrieval({
  "information_request": "分析 ${target} 中的代码结构：
    - 识别过大的类（超过 300 行或 10+ 方法）
    - 识别过长的函数（超过 50 行）
    - 识别高度耦合的模块
    - 识别重复代码模式
    - 分析依赖关系复杂度"
})
```

### Step 3: LSP 符号分析（🚨 MUST EXECUTE）

**对每个目标文件必须调用 LSP：**

```
# 1. 获取文件结构
LSP(operation="documentSymbol", filePath="<file>", line=1, character=1)

# 2. 对每个函数/类，检查：
#    - 参数数量
#    - 行数范围
#    - 嵌套深度
```

**检测指标**：

| 气味类型     | 检测方法                    | 阈值               |
| ------------ | --------------------------- | ------------------ |
| 过长函数     | LSP.documentSymbol + 行数   | > 50 行            |
| 过大类       | LSP.documentSymbol + 方法数 | > 10 方法 或 300行 |
| 过长参数列表 | LSP.documentSymbol          | > 5 参数           |
| 重复代码     | auggie-mcp 相似度分析       | > 80% 相似         |
| 散弹式修改   | LSP.findReferences          | > 10 处修改点      |
| 依恋情结     | auggie-mcp 调用分析         | 外部调用 > 内部    |
| 数据泥团     | auggie-mcp 参数模式分析     | 重复参数组 > 3 处  |
| 过度耦合     | auggie-mcp 依赖分析         | 依赖 > 10 模块     |

### Step 3.5: 🆕 遗留系统气味检测（legacy=true 时执行）

**仅当 legacy=true 时执行此步骤。**

#### 前端遗留气味

| 气味类型         | 检测方法          | 检测模式                                     |
| ---------------- | ----------------- | -------------------------------------------- |
| jQuery Spaghetti | Grep + auggie-mcp | `$('.xxx')` 散落各处，无组件化               |
| Global State     | Grep              | `window.xxx` 全局变量                        |
| Callback Hell    | auggie-mcp        | 多层嵌套回调（> 3 层）                       |
| Inline Styles    | Grep              | `style=` 属性混乱                            |
| Script Tag Soup  | Grep              | 多个 `<script>` 标签依赖顺序                 |
| $scope Pollution | Grep + auggie-mcp | AngularJS `$scope` 滥用，未使用 controllerAs |
| Missing Bundler  | 文件检测          | 无 webpack/vite/rollup 配置                  |

**检测命令示例**：

```bash
# jQuery 检测
grep -r "\$\(['\"]" --include="*.js" --include="*.html" ${target} | wc -l

# 全局变量检测
grep -r "window\." --include="*.js" ${target} | grep -v "window.location" | wc -l

# AngularJS $scope 检测
grep -r "\$scope" --include="*.js" ${target} | wc -l
```

#### 后端遗留气味

| 气味类型           | 检测方法          | 检测模式                                    |
| ------------------ | ----------------- | ------------------------------------------- |
| Monolithic Ball    | auggie-mcp        | 无清晰模块边界，单一入口点承载所有功能      |
| Shared Database    | auggie-mcp        | 多个服务直接访问同一数据库表                |
| Sync Everything    | Grep + auggie-mcp | 无异步处理，全同步阻塞调用                  |
| No API Versioning  | Grep              | API 路径无版本号 `/api/users` vs `/api/v1/` |
| Hardcoded Config   | Grep              | 配置值写死在代码中（数据库连接、端口等）    |
| Session State      | auggie-mcp        | 有状态服务，依赖内存 session                |
| Raw SQL Everywhere | Grep              | 原始 SQL 散落各处，无 ORM/QueryBuilder      |
| Missing DI         | auggie-mcp        | 无依赖注入，硬编码实例化                    |

**检测命令示例**：

```bash
# 硬编码配置检测
grep -rE "(localhost|127\.0\.0\.1|:3306|:5432)" --include="*.php" --include="*.java" ${target}

# 原始 SQL 检测
grep -rE "SELECT|INSERT|UPDATE|DELETE" --include="*.php" --include="*.java" ${target} | grep -v "ORM\|Repository" | wc -l
```

#### 遗留系统专用 auggie-mcp 查询

🚨 **legacy=true 时必须执行**

```
mcp__auggie-mcp__codebase-retrieval({
  "information_request": "分析 ${target} 中的遗留系统特征：
    - 识别 jQuery/AngularJS/Backbone 等老旧前端框架使用
    - 识别 PHP/JSP/ASP 等传统后端技术
    - 识别单体架构模式
    - 识别共享数据库反模式
    - 识别缺少依赖注入的硬编码实例化
    - 识别配置硬编码问题
    - 识别缺少 API 版本控制"
})
```

#### 遗留技术栈文档查询（context7）

🚨 **legacy=true 时必须执行**

```
# 查询源技术栈的已知问题和迁移建议
mcp__context7__query-docs({
  libraryId: "${source_framework_id}",
  query: "common issues, migration guide, deprecation warnings"
})
```

### Step 3.6: 多模型增强检测（可选）

**后端代码气味增强检测（codex-cli）**：

```
Skill(skill="codex-cli", args="--role smell-detector --prompt '检测 ${target} 中的后端代码气味：Long Method, God Class, Feature Envy, Shotgun Surgery' --sandbox read-only")
```

**前端组件气味增强检测（gemini-cli）**：

```
Skill(skill="gemini-cli", args="--role component-analyst --prompt '检测 ${target} 中的前端组件气味：God Component, Prop Drilling, CSS Bloat, Accessibility Issues'")
```

**使用条件**：

- 当 auggie-mcp + LSP 检测结果不足时
- 当需要更深入的语义分析时
- 根据文件类型选择 codex（后端）或 gemini（前端）

### Step 4: 生成检测结果

**写入 `${run_dir}/smells.json`**：

```json
{
  "timestamp": "2026-01-19T12:00:00Z",
  "target": "${target}",
  "total_files": 15,
  "total_smells": 8,
  "smells": [
    {
      "id": "SMELL-001",
      "type": "long_method",
      "severity": "high",
      "location": {
        "file": "src/services/UserService.ts",
        "line": 45,
        "symbol": "processUserData"
      },
      "metrics": {
        "lines": 120,
        "threshold": 50
      },
      "description": "函数 processUserData 有 120 行，超过建议的 50 行限制",
      "suggestion": "考虑提取子方法"
    },
    {
      "id": "SMELL-002",
      "type": "god_class",
      "severity": "critical",
      "location": {
        "file": "src/core/AppManager.ts",
        "line": 1,
        "symbol": "AppManager"
      },
      "metrics": {
        "methods": 25,
        "lines": 800,
        "threshold_methods": 10,
        "threshold_lines": 300
      },
      "description": "类 AppManager 有 25 个方法和 800 行代码，职责过重",
      "suggestion": "考虑按职责拆分为多个类"
    }
  ],
  "summary": {
    "by_type": {
      "long_method": 3,
      "god_class": 1,
      "long_parameter_list": 2,
      "duplicated_code": 2
    },
    "by_severity": {
      "critical": 1,
      "high": 3,
      "medium": 2,
      "low": 2
    },
    "by_category": {
      "general": 8,
      "legacy_frontend": 0,
      "legacy_backend": 0
    }
  },
  "legacy_mode": false,
  "legacy_smells": []
}
```

### Step 5: 生成可读报告

**写入 `${run_dir}/smells-report.md`**：

```markdown
# 代码气味检测报告

## 检测概览

| 指标     | 值                                  |
| -------- | ----------------------------------- |
| 目标     | ${target}                           |
| 文件数   | 15                                  |
| 气味总数 | 8                                   |
| 严重级别 | 1 Critical, 3 High, 2 Medium, 2 Low |

## 按类型统计

| 气味类型     | 数量 | 严重程度    |
| ------------ | ---- | ----------- |
| 过长函数     | 3    | 🔴 High     |
| 过大类       | 1    | 🔴 Critical |
| 过长参数列表 | 2    | 🟡 Medium   |
| 重复代码     | 2    | 🟡 Medium   |

## 详细发现

### 🔴 Critical: God Class

**位置**: `src/core/AppManager.ts:1`
**符号**: `AppManager`
**指标**: 25 方法 / 800 行（阈值: 10 方法 / 300 行）

**问题描述**:
类 AppManager 承担了过多职责，包括配置管理、状态管理、事件处理等。

**建议**:
考虑按职责拆分：

- `ConfigManager` - 配置管理
- `StateManager` - 状态管理
- `EventBus` - 事件处理

---

### 🔴 High: Long Method

**位置**: `src/services/UserService.ts:45`
**符号**: `processUserData`
**指标**: 120 行（阈值: 50 行）

**问题描述**:
函数过长，包含多个逻辑步骤，难以理解和维护。

**建议**:
提取以下子方法：

- `validateUserInput()` - 输入验证
- `transformUserData()` - 数据转换
- `persistUserData()` - 数据持久化

---

## 检测方法验证

- [x] auggie-mcp 语义分析
- [x] LSP.documentSymbol 结构分析
- [x] 行数/方法数度量
- [x] 参数数量检查

---

## 🆕 遗留系统气味（仅 legacy 模式）

### 前端遗留气味

| 气味类型         | 位置             | 实例数 | 严重程度  |
| ---------------- | ---------------- | ------ | --------- |
| jQuery Spaghetti | src/js/\*.js     | 45     | 🔴 High   |
| Global State     | src/js/app.js    | 12     | 🔴 High   |
| $scope Pollution | src/controllers/ | 28     | 🟡 Medium |

### 后端遗留气味

| 气味类型          | 位置              | 实例数 | 严重程度    |
| ----------------- | ----------------- | ------ | ----------- |
| Hardcoded Config  | src/config.php    | 8      | 🔴 Critical |
| Raw SQL           | src/models/\*.php | 23     | 🔴 High     |
| No API Versioning | routes/api.php    | 1      | 🟡 Medium   |

---

检测时间: ${timestamp}
下一步: 调用 refactor-suggester 生成重构建议
```

---

## 代码气味目录

详见 `references/smell-catalog.md`

## 质量门控

### 工具使用验证

- [ ] 调用了 `mcp__auggie-mcp__codebase-retrieval` 至少 1 次
- [ ] 对每个目标文件调用了 `LSP.documentSymbol`
- [ ] 生成了 `smells.json`
- [ ] 生成了 `smells-report.md`

### 产出质量验证

- [ ] 每个气味有明确的位置信息
- [ ] 每个气味有度量数据
- [ ] 每个气味有改进建议
- [ ] 按严重程度排序

---

## 约束

- 不生成重构建议（交给 refactor-suggester）
- 不执行重构（交给 refactor-executor）
- 不分析影响范围（交给 impact-analyzer）
- **必须使用 auggie-mcp 和 LSP，不能直接读文件猜测**
