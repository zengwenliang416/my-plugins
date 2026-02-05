# PBT (Property-Based Testing) Properties

## Metadata

- Extraction Time: 2026-02-02T10:10:00Z
- Models: Codex + Gemini
- Total Properties: 25+

---

## Codex: Invariants by Phase

### Phase 0: Environment Validation

| ID   | Invariant                          | Falsification Strategy                       |
| ---- | ---------------------------------- | -------------------------------------------- |
| P0-1 | `node --version` ≥ v18.0.0         | 生成 `<18.0.0` 版本串或模拟 `node` 不存在    |
| P0-2 | `claude --version` ≥ 2.1.0         | 生成 `<2.1.0` 版本串或模拟 `claude` 不存在   |
| P0-3 | `CLAUDE_PLUGIN_ROOT` 必须有值      | 将环境变量置空/未设置                        |
| P0-4 | CLI 基础命令可用 (cd/ls/cat/mkdir) | 随机屏蔽任一命令或在只读目录执行 mkdir       |
| P0-5 | 能手写可解析的 YAML/JSON           | 生成结构性错误 YAML/JSON（缺冒号、缩进错层） |

### Phase 1: Foundation

| ID   | Invariant                                                 | Falsification Strategy             |
| ---- | --------------------------------------------------------- | ---------------------------------- |
| P1-1 | `notes/phase1-summary.md` 存在且包含 plugin.json 字段解释 | 缺失文件或内容中不出现任何字段解释 |
| P1-2 | 字段解释覆盖 `name`/`version`/`description`               | 遗漏其中任一字段解释               |
| P1-3 | 体现 `skills`/`agents` 为路径数组，不出现 `hooks` 字段    | 生成"允许 hooks 字段"的解释文本    |

### Phase 2: Core Concepts

| ID   | Invariant                                                             | Falsification Strategy              |
| ---- | --------------------------------------------------------------------- | ----------------------------------- |
| P2-1 | `my-agent.md` 包含 YAML frontmatter (`---` 起止，可解析)              | 删除 frontmatter 或注入不合法 YAML  |
| P2-2 | Agent frontmatter 包含 `name/description/tools/model`，`tools` 为数组 | 随机缺失字段或将 `tools` 设为字符串 |
| P2-3 | `SKILL.md` 包含 YAML frontmatter                                      | 删除 frontmatter 或破坏 YAML 语法   |
| P2-4 | Skill frontmatter 包含 `name/description`                             | 随机缺失 `name` 或 `description`    |
| P2-5 | 技能文件命名为 `SKILL.md`（大小写固定）                               | 重命名为 `skill.md`/`Skill.md`      |

### Phase 3: Integration Patterns

| ID   | Invariant                                                 | Falsification Strategy |
| ---- | --------------------------------------------------------- | ---------------------- |
| P3-1 | Hook trace 覆盖 `SessionStart → SessionEnd` 完整追踪      | 缺失任一阶段或顺序颠倒 |
| P3-2 | SessionStart 包含：触发、加载会话、检测包管理器、报告技能 | 随机移除其中任一步骤   |
| P3-3 | SessionEnd 包含：触发、持久化会话、evaluate-session       | 随机移除其中任一步骤   |
| P3-4 | Pre/Post Hook 顺序：Pre → Tool → Post → 输出              | 生成任意乱序流         |

### Phase 4: Practical Usage

| ID   | Invariant                                                 | Falsification Strategy          |
| ---- | --------------------------------------------------------- | ------------------------------- |
| P4-1 | `logs/install-output.txt` 与 `logs/test-results.txt` 存在 | 删除任一文件或替换为空目录      |
| P4-2 | 日志体现"命令执行成功无错误"                              | 注入 `error/fatal/Exit code: 1` |

### Phase 5: Advanced Features

| ID   | Invariant                                                    | Falsification Strategy      |
| ---- | ------------------------------------------------------------ | --------------------------- |
| P5-1 | Analysis 必须解释 instinct 置信度机制                        | 移除"instinct/置信度"关键词 |
| P5-2 | 连续学习路径顺序：Hooks → observations → instincts → /evolve | 打乱任一节点顺序            |

### Global: Component Hierarchy

| ID   | Invariant                                                         | Falsification Strategy |
| ---- | ----------------------------------------------------------------- | ---------------------- |
| PG-1 | 插件加载路径：marketplace.json → plugin.json → components → hooks | 生成乱序加载序列       |
| PG-2 | 组件依赖图：Commands → Agents → Skills → Hooks → Scripts          | 交换任意两层           |
| PG-3 | 层级架构：Hooks → Rules → Skills → Agents → Commands              | 随机置换层级           |

---

## Gemini: System Properties

### PROP-1: Manifest Schema Compliance

**Definition**: `plugin.json` 必须严格遵循 schema，禁止顶层 `hooks` 字段以确保声明式纯净性。

**Boundary Conditions**:

- `plugin.json` 包含 `hooks: []`, `hooks: {}`, `hooks: null`
- 其他对象内的嵌套 `hooks` 键（允许 vs 禁止）

### PROP-2: Runtime Version Compatibility

**Definition**: Claude CLI 环境必须报告语义版本 ≥ `2.1.0` 以保证 v2 插件架构支持。

**Boundary Conditions**:

- CLI 版本 `2.0.99`, `2.1.0`, `2.1.0-beta`, `3.0.0`
- 无效或缺失版本字符串

### PROP-3: Metadata Encapsulation Format

**Definition**: 所有可执行组件定义（agents, skills, commands）的 Markdown 必须以有效 YAML frontmatter 块开头（`---` 分隔）。

**Boundary Conditions**:

- 第一个 `---` 前有空白
- 缺失闭合 `---`
- frontmatter 内 YAML 语法无效
- 空 frontmatter

### PROP-4: Tool Access Confinement

**Definition**: Agent 执行上下文必须沙箱化，只能调用声明中明确列出的工具，防止未授权能力提升。

**Boundary Conditions**:

- 尝试调用未列在 `tools` 中的标准系统工具
- 尝试调用其他插件的工具
- 工具声明中使用通配符

### PROP-5: Rule Distribution Restriction

**Definition**: 插件架构必须严格忽略或拒绝任何尝试注入全局系统规则的配置，强制规则保持用户控制。

**Boundary Conditions**:

- 插件根目录存在 `rules/` 目录
- `plugin.json` 中存在 `rules` 键
- Agent 定义尝试引用外部规则文件

### PROP-6: Environment Context Availability

**Definition**: 执行环境必须在调用任何插件组件前填充 `CLAUDE_PLUGIN_ROOT` 环境变量为活动插件根目录的绝对路径。

**Boundary Conditions**:

- 变量未设置
- 变量设为空字符串
- 变量设为相对路径
- 变量指向不存在的目录

### PROP-7: Runtime Dependency Availability

**Definition**: 宿主系统必须通过系统 `PATH` 提供可访问的 Node.js 运行时环境以执行基于 JavaScript 的插件逻辑。

**Boundary Conditions**:

- `PATH` 中缺少 Node.js 二进制
- Node.js 版本低于插件要求
- `node` vs `nodejs` 二进制名称不同

---

## Property-Constraint Mapping

| Property             | Related Constraint               | Verification Type  |
| -------------------- | -------------------------------- | ------------------ |
| P0-1, P0-2, PROP-2   | H2 (CLI v2.1.0+)                 | Version check      |
| P0-3, PROP-6         | H6 (CLAUDE_PLUGIN_ROOT)          | Env var check      |
| P0-4, P0-5, PROP-7   | H7 (Node.js required)            | Runtime check      |
| P1-3, PROP-1         | H1 (No hooks in plugin.json)     | Schema validation  |
| P2-1 to P2-5, PROP-3 | H3 (YAML frontmatter required)   | Format validation  |
| P2-2, PROP-4         | H4 (Agents limited tools)        | Access control     |
| PROP-5               | H5 (Rules cannot be distributed) | Distribution check |

---

## Test Template (Pseudo-code)

```python
# Example: Property P1-3 verification
def test_no_hooks_in_plugin_json_explanation():
    summary = read_file("notes/phase1-summary.md")

    # Invariant: must not suggest hooks field is allowed
    assert "hooks" not in extract_allowed_fields(summary)

    # Invariant: must show skills/agents as path arrays
    assert mentions_path_array(summary, "skills")
    assert mentions_path_array(summary, "agents")

# Falsification: generate counterexample
def falsify_p1_3():
    return generate_text_containing("you can add hooks field to plugin.json")
```
