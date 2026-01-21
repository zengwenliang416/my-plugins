# Documentation Update Patterns Reference

## 变更检测

### Hash 跟踪

```json
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

| 类型             | 描述         | 处理方式            |
| ---------------- | ------------ | ------------------- |
| SOURCE_CHANGED   | 源代码已修改 | 需要重新生成        |
| DOC_ONLY_CHANGED | 仅文档修改   | 保持用户修改        |
| BOTH_CHANGED     | 两者都改     | 合并处理            |
| NO_CHANGE        | 无变更       | 跳过 (除非 --force) |

## 用户自定义内容保护

### 标记语法

```markdown
## API Reference

<!-- AUTO-GENERATED -->

自动生成的内容...

<!-- END-AUTO-GENERATED -->

<!-- CUSTOM -->

用户自定义内容（更新时保留）

<!-- END-CUSTOM -->
```

### 保护策略

1. 识别 `<!-- CUSTOM -->` 标记
2. 提取自定义章节内容
3. 重新生成自动部分
4. 合并自定义内容到新文档

## 交叉引用更新

### 链接类型

| 类型     | 示例           | 检查方式       |
| -------- | -------------- | -------------- |
| 相对链接 | `./auth.md`    | 文件存在检查   |
| 锚点链接 | `#endpoints`   | 标题存在检查   |
| 绝对路径 | `/docs/api.md` | 项目根路径检查 |

### 断链修复

1. 查找相似路径的文档
2. 尝试智能匹配
3. 无法修复则标记为 TODO

## 备份策略

```
.claude/memory/docs/backups/
├── 20240120-100000/
│   ├── api/
│   │   └── auth.md
│   └── manifest.json
└── latest → 20240120-100000/
```

### manifest.json

```json
{
  "timestamp": "2024-01-20T10:00:00Z",
  "files": ["api/auth.md", "api/users.md"],
  "reason": "full_update"
}
```

## 更新报告

```markdown
# Documentation Update Report

**Updated**: 2024-01-20T10:00:00Z

## Summary

- Total documents: 25
- Updated: 8
- Skipped: 15
- Failed: 2

## Preserved Custom Sections

| Document | Sections |
| -------- | -------- |
| auth.md  | 2        |

## Broken Links Found

- docs/guides/auth.md: [Config](./config.md)
```
