# Incremental Update Patterns Reference

## Git 集成

### 变更获取

```bash
# 最近一次提交
git diff --name-only HEAD~1..HEAD

# 指定范围
git diff --name-only abc123..HEAD

# 时间范围
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
  ]
}
```

## 更新粒度

| 变更类型           | 影响         | 更新范围          |
| ------------------ | ------------ | ----------------- |
| FUNCTION_CHANGED   | 函数实现变更 | 对应 API 端点文档 |
| TYPE_CHANGED       | 类型定义变更 | 参数/返回值表格   |
| SIGNATURE_CHANGED  | 函数签名变更 | 函数签名和示例    |
| DEPENDENCY_CHANGED | 依赖关系变更 | 依赖章节          |
| FILE_ADDED         | 新增文件     | 触发新文档生成    |
| FILE_DELETED       | 删除文件     | 标记文档为废弃    |

## 章节级更新

### 文档结构

```markdown
## Overview ← 通常不变

## Authentication ← 可能更新

## Endpoints

### GET /login ← 需要更新 ✓

### POST /logout ← 不变

### POST /refresh ← 不变

## Examples ← 可能更新
```

### 定位算法

1. 匹配标题正则
2. 找到同级或更高级标题
3. 提取章节范围
4. 替换内容

## 源代码到文档映射

```json
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

## Dry Run 输出

```markdown
# Incremental Update Preview

**Mode**: Dry Run (no changes applied)

## Changes Detected

| File    | Type     | Functions            |
| ------- | -------- | -------------------- |
| auth.ts | Modified | login, validateToken |

## Affected Documents

| Document | Sections       | Action |
| -------- | -------------- | ------ |
| auth.md  | login (L45-80) | Update |

## Proposed Changes

### docs/api/auth.md

\`\`\`diff

- ### login(email: string, password: string)

* ### login(email: string, password: string, options?: LoginOptions)
  \`\`\`
```

## 冲突处理

```
当文档已被手动修改时:
1. 检测文档 hash 变更
2. 标记为冲突
3. 输出建议的更新内容
4. 等待人工确认合并
```
