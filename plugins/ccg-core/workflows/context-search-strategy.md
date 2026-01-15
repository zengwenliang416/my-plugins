# 上下文搜索策略

## 概述

本文档定义了上下文收集的查询模板、结果管理规范和引用来源回写机制，确保信息收集的系统性和可追溯性。

## 渐进式上下文收集流程

### 核心哲学

- **问题驱动**: 基于关键疑问收集，而非机械执行固定流程
- **充分性优先**: 追求"足以支撑决策和规划"，而非"信息100%完整"
- **动态调整**: 根据实际需要决定深挖次数（建议 ≤ 3 次）
- **成本意识**: 每次深挖都要明确"为什么需要"和"解决什么疑问"

## 查询模板

### 内部代码检索 (LSP)

#### 文档符号查询

```typescript
LSP(
  (operation = "documentSymbol"),
  (filePath = "<目标文件路径>"),
  (line = 1),
  (character = 1),
);
```

#### 符号定义跳转

```typescript
LSP(
  operation="goToDefinition",
  filePath="<文件路径>",
  line=<行号>,
  character=<列号>
)
```

#### 代码模式搜索

```bash
Grep(
  pattern="<正则表达式>",
  path="<限定目录>",
  glob="*.ts",
  output_mode="content"
)
```

#### 引用分析查询

```typescript
LSP(
  operation="findReferences",
  filePath="<文件路径>",
  line=<行号>,
  character=<列号>
)
```

#### 调用层级分析

```typescript
LSP(
  operation="incomingCalls",
  filePath="<文件路径>",
  line=<行号>,
  character=<列号>
)
```

### 第三方库文档 (context7)

#### 库 ID 解析

```bash
mcp__context7__resolve-library-id(
  libraryName="<库名称>"
)
```

#### 文档获取

```bash
mcp__context7__get-library-docs(
  context7CompatibleLibraryID="<库ID>",
  topic="<聚焦主题>",
  page=1
)
```

### 代码示例 (exa skill)

> **注意**: exa 已迁移为 skill，由 hooks 自动触发

#### 搜索

```bash
npx tsx ~/.claude/skills/exa/scripts/exa_exec.ts \
  search --query "<搜索关键词>" --num 10
```

#### 直接回答

```bash
npx tsx ~/.claude/skills/exa/scripts/exa_exec.ts \
  answer --query "<问题>"
```

### 通用搜索 (ddg-search)

```bash
mcp__ddg-search__search(
  query="<关键词> site:<官方域名>",
  max_results=10
)
```

## 结果存储规范

### 文件命名约定

| 阶段       | 文件名                            | 用途               |
| ---------- | --------------------------------- | ------------------ |
| 初步扫描   | `.claude/context-initial.json`    | 结构化快速扫描结果 |
| 针对性深挖 | `.claude/context-question-N.json` | 第 N 次深挖结果    |
| 知识沉淀   | `.claude/knowledge/<主题>.md`     | 长期复用的知识文档 |

### JSON 结构模板

```json
{
  "timestamp": "2025-01-01T00:00:00Z",
  "query_type": "symbol_search|pattern_search|doc_fetch",
  "query_params": {},
  "results": [],
  "observations": "",
  "open_questions": [],
  "sources": []
}
```

## 引用来源回写

### 来源标注格式

```markdown
> [来源: <工具名> | <查询参数摘要> | <时间戳>]
> <引用内容>
```

### 示例

```markdown
> [来源: LSP.goToDefinition | file="src/services/UserService.ts" line=45 | 2025-01-01]
> 用户登录方法位于 src/services/UserService.ts:45

> [来源: context7 | library="/vercel/next.js" topic="routing" | 2025-01-01]
> Next.js 13+ 使用 App Router 作为默认路由方案
```

## 充分性检查清单

在进入任务规划前，必须完成以下检查：

- [ ] 我能定义清晰的接口契约吗？（输入输出、参数约束、返回值类型）
- [ ] 我理解关键技术选型的理由吗？（为什么用这个方案？）
- [ ] 我识别了主要风险点吗？（并发、边界条件、性能瓶颈）
- [ ] 我知道如何验证实现吗？（测试框架、验证方式、覆盖标准）

### 决策

- 全部打勾 → 收集完成，进入任务规划和实施
- 有未打勾 → 列出缺失信息，补充 1 次针对性深挖

## 深挖成本控制

| 深挖次数 | 状态 | 操作建议               |
| -------- | ---- | ---------------------- |
| 1-2 次   | 正常 | 继续针对性收集         |
| 3 次     | 提醒 | 评估成本，考虑是否足够 |
| 4+ 次    | 警告 | 建议停止，避免过度收集 |

## 回溯补充机制

允许"先规划 → 发现不足 → 补充上下文 → 完善实现"的迭代：

1. 在规划或实施阶段发现信息缺口
2. 记录到 `operations-log.md`
3. 补充 1 次针对性收集
4. 更新相关 context 文件
5. 继续实施

## 禁止事项

- 跳过结构化快速扫描直接深挖
- 跳过充分性检查强行规划
- 深挖时不说明理由和预期
- 上下文文件写入错误路径（必须是 `.claude/` 而非 `~/.claude/`）
- 不记录引用来源
