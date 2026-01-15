---
name: skill-creator
description: |
  【触发条件】当用户要求创建新 skill、更新现有 skill、验收 skill 质量时使用。
  【核心产出】输出：符合 Agent Skills 规范的完整 skill 目录（SKILL.md + scripts/ + references/）。
  【不触发】不用于：使用已有 skill 执行任务（直接调用对应 skill）。
  【先问什么】若缺少：skill 用途、触发场景、期望输出格式，先提问补齐。
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Skill Creator - 技能创建助手

创建符合 Anthropic Agent Skills 规范的高质量技能包。

## 核心原则

### 1. Concise is Key（精简至上）

上下文窗口是共享资源。只添加 Claude 不知道的信息。

**默认假设**：Claude 已经很聪明，挑战每条信息："Claude 真的需要这个吗？"

### 2. Progressive Disclosure（渐进式披露）

三级加载系统：

| 级别 | 内容                   | 大小限制   | 加载时机     |
| ---- | ---------------------- | ---------- | ------------ |
| L1   | name + description     | ~100 words | 始终在上下文 |
| L2   | SKILL.md body          | <500 行    | 技能触发时   |
| L3   | references/ + scripts/ | 无限制     | 按需加载     |

### 3. 适当的自由度

| 自由度 | 适用场景              | 形式              |
| ------ | --------------------- | ----------------- |
| 高     | 多种方案都有效        | 文字指导          |
| 中     | 存在首选模式          | 伪代码/带参数脚本 |
| 低     | 操作易出错/一致性关键 | 具体脚本/少量参数 |

## 创建流程

### 步骤 1：理解技能需求

跳过条件：已有明确的使用模式。

**必问问题**（每次最多问 2-3 个）：

- 这个 skill 解决什么问题？
- 用户会怎么说来触发它？（收集关键词）
- 期望输出什么？（文件/报告/代码）

### 步骤 2：规划可复用资源

分析每个使用场景：

1. 从零执行需要什么？
2. 重复执行时哪些可复用？

| 资源类型      | 何时需要         | 示例            |
| ------------- | ---------------- | --------------- |
| `scripts/`    | 相同代码反复编写 | `rotate_pdf.ts` |
| `references/` | 需要参考的长文档 | `api_docs.md`   |
| `assets/`     | 输出中使用的文件 | `template.pptx` |

### 步骤 3：初始化技能

```bash
npx tsx ~/.claude/skills/skill-creator/scripts/init_skill.ts <skill-name> --path <output-dir>
```

脚本自动创建：

- SKILL.md 模板（含 frontmatter）
- scripts/、references/、assets/ 目录
- 示例文件（按需删除）

### 步骤 4：编写 SKILL.md

#### Frontmatter（必需）

```yaml
---
name: my-skill-name
description: |
  【触发条件】当用户要求 X/Y/Z（含关键词 keyword1/keyword2）时使用。
  【核心产出】输出：A + B + C。
  【不触发】不用于：XXX 场景（改用 other-skill）。
  【先问什么】若缺少：输入X、上下文Y，先提问补齐。
allowed-tools: Tool1, Tool2 # 可选
---
```

详细模板见 `references/description-template.md`。

#### Body 结构

````markdown
# Skill 名称

[一句话说明用途]

## 决策入口（推荐）

先回答关键问题，再进入具体流程：

- 静态还是动态？
- 是否需要 XXX？

## 工作流程

3-7 步的核心流程，每步明确输入输出。

## 脚本使用

**先运行 `--help`，不要先读源码**：

```bash
npx tsx scripts/xxx.ts --help
```
````

## 参考文档导航

- 需要 XXX → 读 `references/xxx.md`
- 需要 YYY → 读 `references/yyy.md`

````

### 步骤 5：验证技能

```bash
npx tsx ~/.claude/skills/skill-creator/scripts/validate_skill.ts <path/to/skill>
````

检查项：

- [ ] frontmatter 格式正确
- [ ] name 与目录名匹配
- [ ] description 包含触发条件
- [ ] SKILL.md < 500 行
- [ ] 无多余文档（README.md 等）

### 步骤 6：迭代优化

根据实际使用反馈调整：

1. 触发不准确 → 优化 description
2. 输出不一致 → 添加模板/示例
3. 流程太长 → 拆分到 references/

## 参考文档

- `references/description-template.md` - Description 4句式模板
- `references/workflows.md` - 工作流模式（顺序/条件）
- `references/output-patterns.md` - 输出格式模式（模板/示例）

## 禁止事项

- 创建 README.md、INSTALLATION_GUIDE.md、CHANGELOG.md
- 在 SKILL.md 中堆积长代码示例（下沉到 references/）
- description 写得过于简短或模糊
