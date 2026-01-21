---
name: doc-incremental-updater
description: |
  【触发条件】/memory update-related 或代码变更后自动触发
  【核心产出】增量更新的相关文档
  【专属用途】
    - 检测最近代码变更
    - 识别受影响的文档
    - 仅更新必要部分
    - 保持文档与代码同步
  【强制工具】Skill(codex-cli), git
  【不触发】无代码变更时
allowed-tools:
  - Skill
  - Read
  - Write
  - Glob
  - Bash
arguments:
  - name: since
    type: string
    required: false
    description: 变更起点 (commit hash 或时间)
  - name: dry_run
    type: boolean
    default: false
    description: 仅分析不更新
---

# Doc Incremental Updater - 文档增量更新器

## 执行流程

```
1. 获取代码变更
   git diff --name-only {since}..HEAD
   - 或最近一次提交的变更
       │
       ▼
2. 映射到文档
   - 根据 source-hashes.json
   - 找到关联的文档
       │
       ▼
3. 分析影响范围
   Skill("memory:codex-cli", prompt="change_impact")
   - 函数签名变更 → API 文档
   - 类型变更 → 类型文档
   - 依赖变更 → 使用文档
       │
       ▼
4. 生成差异更新
   - 仅更新变更部分
   - 保持其他内容不变
       │
       ▼
5. 应用更新
   - 精确替换章节
   - 更新时间戳
```

## 变更检测

### Git 集成

```bash
# 获取最近变更的文件
git diff --name-only HEAD~1..HEAD

# 获取指定范围的变更
git diff --name-only abc123..HEAD

# 获取时间范围内的变更
git log --since="1 day ago" --name-only --pretty=format:""
```

### 变更分类

```json
{
  "changed_files": [
    {
      "path": "src/services/auth.ts",
      "change_type": "modified",
      "diff_summary": {
        "added_lines": 15,
        "removed_lines": 3,
        "functions_changed": ["login", "validateToken"],
        "types_changed": ["AuthResult"]
      }
    }
  ],
  "affected_docs": [
    {
      "path": "docs/api/auth.md",
      "sections_to_update": ["login", "validateToken", "AuthResult"],
      "update_priority": "high"
    }
  ]
}
```

## 增量更新策略

### 章节级更新

```
文档结构:
├── ## Overview          ← 通常不变
├── ## Authentication    ← 可能更新
├── ## Endpoints
│   ├── ### GET /login   ← 需要更新 ✓
│   ├── ### POST /logout ← 不变
│   └── ### POST /refresh ← 不变
└── ## Examples          ← 可能更新
```

### 更新粒度

```
1. FUNCTION_CHANGED
   → 更新对应的 API 端点文档

2. TYPE_CHANGED
   → 更新参数/返回值表格

3. SIGNATURE_CHANGED
   → 更新函数签名和示例

4. DEPENDENCY_CHANGED
   → 更新依赖章节

5. FILE_ADDED
   → 触发新文档生成

6. FILE_DELETED
   → 标记文档为废弃
```

## 文档定位

### 源代码到文档映射

```json
// .claude/memory/docs/source-to-doc.json
{
  "src/services/auth.ts": {
    "docs": ["docs/api/auth.md", "docs/guides/authentication.md"],
    "sections": {
      "login": "docs/api/auth.md#login",
      "logout": "docs/api/auth.md#logout",
      "AuthResult": "docs/api/auth.md#types"
    }
  }
}
```

### 章节定位

```javascript
function locateSection(doc, sectionName) {
  const lines = doc.split("\n");
  let start = -1,
    end = -1;
  const headerRegex = new RegExp(`^###?\\s+.*${sectionName}`, "i");

  for (let i = 0; i < lines.length; i++) {
    if (headerRegex.test(lines[i])) {
      start = i;
      // 找到下一个同级或更高级标题
      const level = lines[i].match(/^#+/)[0].length;
      for (let j = i + 1; j < lines.length; j++) {
        if (/^#+/.test(lines[j])) {
          const nextLevel = lines[j].match(/^#+/)[0].length;
          if (nextLevel <= level) {
            end = j;
            break;
          }
        }
      }
      if (end === -1) end = lines.length;
      break;
    }
  }

  return { start, end };
}
```

## Dry Run 模式

```markdown
# Incremental Update Preview

**Analysis Time**: 2024-01-20T10:00:00Z
**Mode**: Dry Run (no changes applied)

## Changes Detected

| File                 | Type     | Functions            |
| -------------------- | -------- | -------------------- |
| src/services/auth.ts | Modified | login, validateToken |

## Affected Documents

| Document         | Sections       | Action |
| ---------------- | -------------- | ------ |
| docs/api/auth.md | login (L45-80) | Update |
| docs/api/auth.md | validateToken  | Update |

## Proposed Changes

### docs/api/auth.md

\`\`\`diff

- ### login(email: string, password: string): Promise<AuthResult>

* ### login(email: string, password: string, options?: LoginOptions): Promise<AuthResult>
  \`\`\`

---

Run without --dry-run to apply these changes.
```

## 使用示例

```bash
# 更新最近一次提交影响的文档
/memory update-related

# 指定起点
/memory update-related --since HEAD~5
/memory update-related --since abc123

# 预览模式
/memory update-related --dry-run

# 基于时间
/memory update-related --since "2024-01-19"
```

## 自动触发

### 集成 Git Hooks

```bash
# .git/hooks/post-commit
#!/bin/bash
# 自动触发增量文档更新
claude --skill "memory:doc-incremental-updater" --since HEAD~1
```

### CI/CD 集成

```yaml
# .github/workflows/docs.yml
on:
  push:
    branches: [main]

jobs:
  update-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Update documentation
        run: |
          claude --skill "memory:doc-incremental-updater" \
            --since ${{ github.event.before }}
```

## 冲突处理

```
当文档已被手动修改时:
1. 检测文档 hash 变更
2. 标记为冲突
3. 输出建议的更新内容
4. 等待人工确认合并
```

## 降级策略

```
codex-cli 分析失败:
├── 使用 git diff 输出
├── 简单文本匹配更新
└── 标记为 "partial update"

无法定位章节:
├── 追加到文档末尾
├── 标记为 TODO
└── 建议手动整合
```

## 与其他 Skills 的关系

```
代码提交
    │
    ▼
doc-incremental-updater (自动/手动)
    │
    ├── 小变更: 直接增量更新
    │
    └── 大变更: 触发 doc-full-updater
```

## 输出报告

```json
{
  "timestamp": "2024-01-20T10:00:00Z",
  "since": "abc123",
  "changes": {
    "files_changed": 3,
    "docs_updated": 2,
    "sections_updated": 5
  },
  "details": [
    {
      "doc": "docs/api/auth.md",
      "sections": ["login", "validateToken"],
      "lines_changed": 25
    }
  ],
  "warnings": [],
  "errors": []
}
```
