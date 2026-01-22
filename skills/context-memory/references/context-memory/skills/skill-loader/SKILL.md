---
name: skill-loader
description: |
  【触发条件】/memory skill-load <name> 或需要加载技能文档时
  【核心产出】技能内容输出到上下文
  【专属用途】
    - 从 index.json 查找技能
    - 读取 SKILL.md 完整内容
    - 渐进式加载 references/
    - 输出格式化文档
  【强制工具】Read
  【不触发】技能不存在时
allowed-tools:
  - Read
  - Glob
arguments:
  - name: name
    type: string
    required: true
    description: 技能名称或模式 (支持通配符)
  - name: include_refs
    type: boolean
    default: false
    description: 是否包含 references/ 目录内容
  - name: format
    type: string
    default: "markdown"
    description: 输出格式 (markdown|json|compact)
---

# Skill Loader - 技能文档加载器

## 执行流程

```
1. 查找技能
   - 读取 .claude/skills/index.json
   - 按 name 精确匹配或通配符匹配
       │
       ▼
2. 读取主文档
   - 加载 SKILL.md 内容
   - 解析 frontmatter 和正文
       │
       ▼
3. 渐进式加载 (可选)
   如果 --include_refs:
   ├── 扫描 references/ 目录
   ├── 按优先级排序
   └── 逐个加载参考文档
       │
       ▼
4. 格式化输出
   - markdown: 完整 Markdown 文档
   - json: 结构化 JSON
   - compact: 仅关键信息
```

## 查找策略

### 精确匹配

```
/memory skill-load "context-loader"
→ 查找 name === "context-loader" 的技能
```

### 通配符匹配

```
/memory skill-load "codex-*"
→ 查找所有以 codex- 开头的技能

/memory skill-load "*-loader"
→ 查找所有以 -loader 结尾的技能
```

### 类别加载

```
/memory skill-load "category:memory"
→ 加载 memory 类别下的所有技能摘要
```

## 输出格式

### markdown (默认)

```markdown
# context-loader

**路径**: plugins/memory/skills/context-loader/SKILL.md
**类别**: memory

## 描述

加载项目上下文，支持语义检索和多模型分析...

## 参数

| 名称  | 类型   | 必需 | 默认   | 描述     |
| ----- | ------ | ---- | ------ | -------- |
| task  | string | 是   | -      | 任务描述 |
| depth | string | 否   | normal | 分析深度 |

## 允许工具

- mcp\_\_auggie-mcp\_\_codebase-retrieval
- Skill
- Write

---

[完整文档内容...]
```

### json

```json
{
  "name": "context-loader",
  "path": "plugins/memory/skills/context-loader/SKILL.md",
  "category": "memory",
  "description": "...",
  "arguments": [...],
  "allowed_tools": [...],
  "content": "...",
  "references": [
    {
      "name": "prompts-library.md",
      "content": "..."
    }
  ]
}
```

### compact

```
[context-loader] memory | 加载项目上下文
  args: task(required), depth(optional)
  tools: auggie-mcp, Skill, Write
```

## 渐进式加载

### references/ 优先级

```
1. README.md / index.md      (最高)
2. *-overview.md
3. *-guide.md
4. *-reference.md
5. 其他 .md 文件
6. scripts/ 目录             (最低)
```

### 加载策略

```
默认 (--include_refs=false):
└── 仅加载 SKILL.md

完整 (--include_refs=true):
├── SKILL.md
├── references/*.md (按优先级)
└── 提示: scripts/ 可用但未加载
```

## 缓存策略

```javascript
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟

function loadSkill(name, options) {
  const cacheKey = `${name}-${options.include_refs}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }

  const data = actualLoad(name, options);
  cache.set(cacheKey, { data, time: Date.now() });
  return data;
}
```

## 使用示例

```bash
# 加载单个技能
/memory skill-load "context-loader"

# 加载含参考文档
/memory skill-load "codex-cli" --include-refs

# JSON 格式输出
/memory skill-load "exa" --format json

# 加载类别摘要
/memory skill-load "category:memory"

# 通配符加载
/memory skill-load "*-generator"
```

## 错误处理

```
1. 技能不存在
   → 建议运行 skill-index 更新索引
   → 显示相似名称的技能

2. index.json 不存在
   → 自动触发 skill-indexer
   → 然后重试加载

3. 文件读取失败
   → 显示文件路径
   → 建议检查文件权限
```

## 与其他 Skills 的关系

```
skill-indexer → 生成 index.json
                    │
                    ▼
skill-loader ← 读取 index.json
    │
    ├── 供 context-loader 获取技能上下文
    ├── 供开发者查阅技能文档
    └── 供其他 Skills 动态加载依赖
```
