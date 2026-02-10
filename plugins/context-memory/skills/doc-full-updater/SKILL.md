---
name: doc-full-updater
description: |
  【触发条件】/memory update-full [path] 或需要全量更新文档时
  【核心产出】更新后的完整文档集
  【专属用途】
    - 比对代码与文档差异
    - 全量重新生成过时文档
    - 保留用户自定义内容
    - 更新所有交叉引用
  【强制工具】Skill(codex-cli), Skill(gemini-cli)
  【不触发】文档已是最新时
  【先问什么】默认先确认输入范围、输出格式与约束条件
  [Resource Usage] Use references/, assets/, scripts/ (entry: `scripts/update-docs.ts`).
allowed-tools:
  - Skill
  - Read
  - Write
  - Glob
arguments:
  - name: path
    type: string
    required: false
    default: "docs/"
    description: 文档目录路径
  - name: force
    type: boolean
    default: false
    description: 强制更新所有文档
  - name: preserve_custom
    type: boolean
    default: true
    description: 保留用户自定义章节
---

# Doc Full Updater - 文档全量更新器

## Script Entry

```bash
npx tsx scripts/update-docs.ts [args]
```

## Resource Usage

- Reference docs: `references/update-patterns.md`
- Assets: `assets/updater-config.json`
- Execution script: `scripts/update-docs.ts`

## 执行流程

```
1. 扫描现有文档
   Glob("{path}/**/*.md")
       │
       ▼
2. 分析源代码变更
   - 获取源文件 hash
   - 比对文档记录的 hash
   - 识别过时文档
       │
       ▼
3. 提取用户自定义内容
   - 识别 <!-- CUSTOM --> 标记
   - 保存自定义章节
       │
       ▼
4. 重新生成文档
   ┌─────────────────────────────────┐
   │ codex-cli: 分析源代码变更       │
   │     ↓                           │
   │ gemini-cli: 重新生成文档内容    │
   │     ↓                           │
   │ 合并用户自定义内容              │
   └─────────────────────────────────┘
       │
       ▼
5. 更新交叉引用
   - 检查内部链接有效性
   - 更新引用路径
       │
       ▼
6. 写入更新后的文档
   - 备份原文档
   - 写入新内容
   - 更新 hash 记录
```

## 变更检测

### 源文件 Hash 跟踪

```json
// .claude/memory/docs/source-hashes.json
{
  "docs/api/auth.md": {
    "source_files": {
      "src/services/auth.ts": "abc123",
      "src/routes/auth.ts": "def456"
    },
    "doc_hash": "ghi789",
    "last_updated": "2024-01-20T08:00:00Z"
  }
}
```

### 变更类型

```
1. SOURCE_CHANGED - 源代码已修改
   → 需要重新生成

2. DOC_ONLY_CHANGED - 仅文档修改
   → 保持用户修改

3. BOTH_CHANGED - 两者都改
   → 合并处理

4. NO_CHANGE - 无变更
   → 跳过 (除非 --force)
```

## 用户自定义内容保护

### 标记语法

```markdown
## API Reference

<!-- AUTO-GENERATED -->

自动生成的 API 文档内容...

<!-- END-AUTO-GENERATED -->

<!-- CUSTOM -->

## 补充说明

这是用户添加的自定义内容，更新时会保留。

<!-- END-CUSTOM -->
```

### 保护策略

```javascript
function extractCustomSections(doc) {
  const customRegex = /<!-- CUSTOM -->([\s\S]*?)<!-- END-CUSTOM -->/g;
  const sections = [];
  let match;
  while ((match = customRegex.exec(doc)) !== null) {
    sections.push({
      content: match[1],
      position: match.index,
    });
  }
  return sections;
}

function mergeCustomSections(newDoc, customSections) {
  // 在新文档末尾或指定位置插入自定义内容
  return newDoc + "\n\n" + customSections.map((s) => s.content).join("\n\n");
}
```

## 交叉引用更新

### 检测断链

```javascript
function findBrokenLinks(doc, allDocs) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const broken = [];
  let match;
  while ((match = linkRegex.exec(doc)) !== null) {
    const [, text, href] = match;
    if (href.startsWith("./") || href.startsWith("../")) {
      if (!allDocs.includes(resolvedPath(href))) {
        broken.push({ text, href, position: match.index });
      }
    }
  }
  return broken;
}
```

### 自动修复

```
断链修复策略:
1. 查找相似路径的文档
2. 尝试智能匹配
3. 无法修复则标记为 TODO
```

## 输出报告

```markdown
# Documentation Update Report

**Updated**: 2024-01-20T10:00:00Z

## Summary

- Total documents: 25
- Updated: 8
- Skipped (no change): 15
- Failed: 2

## Updated Documents

| Document            | Reason         | Changes       |
| ------------------- | -------------- | ------------- |
| docs/api/auth.md    | Source changed | +45 -12 lines |
| docs/api/users.md   | Source changed | +23 -5 lines  |
| docs/guides/auth.md | References     | Links updated |

## Preserved Custom Sections

| Document         | Sections |
| ---------------- | -------- |
| docs/api/auth.md | 2        |

## Failed Updates

| Document              | Error            |
| --------------------- | ---------------- |
| docs/api/payments.md  | Source not found |
| docs/guides/deploy.md | Parse error      |

## Broken Links Found

- docs/guides/auth.md: [Config](./config.md) → File not found
```

## 使用示例

```bash
# 更新所有文档
/memory update-full

# 更新指定目录
/memory update-full docs/api/

# 强制全部更新
/memory update-full --force

# 不保留自定义内容
/memory update-full --no-preserve-custom
```

## 备份策略

```
更新前自动备份:
├── .claude/memory/docs/backups/
│   ├── 20240120-100000/
│   │   ├── api/
│   │   │   └── auth.md
│   │   └── manifest.json
│   └── latest → 20240120-100000/
```

## 降级策略

```
codex-cli 分析失败:
├── 使用静态分析识别变更
├── 标记为 "partial update"
└── 输出警告建议手动检查

gemini-cli 生成失败:
├── 保持原文档不变
├── 输出变更建议列表
└── 等待手动处理
```

## 与其他 Skills 的关系

```
doc-full-updater
    │
    ├── 读取 doc-planner 的规划
    ├── 使用 codex-cli/gemini-cli 生成
    └── 触发 doc-incremental-updater 处理细节
```
