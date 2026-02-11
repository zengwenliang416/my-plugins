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

## 上下文加载策略（渐进式，节省 token）

1. 先定位目标范围（目录/文件），优先处理高风险目录，不全量扫描整个仓库。
2. 先读 `references/smell-catalog.md` 的相关章节，再按检测结果补充细节。
3. 仅在 legacy=true 时执行遗留气味检测与技术栈查询；默认跳过 legacy 分支。
4. 结果输出优先复用 `assets/smells.template.json` 与 `assets/smells-report.template.md`。

**重要**：避免一次性读取全部说明与大样例，使用“先概要、后细节”的按需加载流程。

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

输出结构以 `assets/smells.template.json` 为准，至少包含：

- `timestamp`、`target`、`legacy_mode`
- `summary.files_scanned`、`summary.total_smells`、`summary.by_severity`、`summary.by_type`
- `smells[]`：每项包含 `id/type/severity/file/line_start/line_end/description/metrics`
- `legacy_smells[]`：仅在 legacy=true 时填充

最小示例（字段可扩展）：

```json
{
  "timestamp": "2026-01-19T12:00:00Z",
  "target": "${target}",
  "legacy_mode": false,
  "summary": {
    "files_scanned": 15,
    "total_smells": 1
  },
  "smells": [
    {
      "id": "SMELL-001",
      "type": "long_method",
      "severity": "high",
      "file": "src/services/example.ts",
      "line_start": 45,
      "line_end": 120,
      "description": "函数过长，建议拆分",
      "metrics": {
        "lines": 75
      }
    }
  ],
  "legacy_smells": []
}
```

### Step 5: 生成可读报告

**写入 `${run_dir}/smells-report.md`**：

报告结构以 `assets/smells-report.template.md` 为准，至少包含：

1. 检测概览（目标、扫描文件数、气味总数、严重级别分布）
2. 按类型统计（类型、数量、严重程度）
3. Top 高风险发现（包含位置、指标、问题描述、建议）
4. 检测方法验证（auggie-mcp / LSP 是否执行）
5. legacy=true 时追加“遗留系统气味”章节

建议按严重程度排序输出（critical > high > medium > low），便于下一步交给 `refactor-suggester`。

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
