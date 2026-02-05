---
name: commit-executor
description: |
  【触发】Commit 工作流最后一步：执行 git commit
  【输出】${run_dir}/commit-result.json
  【询问】如果 hook 失败，询问是否跳过或修复
---

# Commit Executor

## 输入/输出

| 项目 | 值                                       |
| ---- | ---------------------------------------- |
| 输入 | `${run_dir}/commit-message.md` + options |
| 输出 | `${run_dir}/commit-result.json`          |

## 参数

- **run_dir** (必需): 运行目录（包含 commit-message.md）
- **options** (可选): JSON 选项 `{"no_verify": true, "amend": false}`

## 选项

| 选项      | 默认  | 说明               |
| --------- | ----- | ------------------ |
| no_verify | false | 跳过 hooks         |
| amend     | false | 修改上次提交       |
| signoff   | false | 添加 Signed-off-by |
| dry_run   | false | 仅模拟             |

## 执行

### 1. 读取 commit-message.md

提取: Title, Body, Footer

### 2. 验证暂存

```bash
git diff --cached --quiet
```

如果没有暂存变更则报错（amend 除外）

### 3. 执行提交

```bash
git commit -m "$(cat <<'EOF'
feat(components): ✨ 新增 Button 组件

新增可复用的 Button 组件。

变更文件:
- src/components/Button.tsx: 组件实现

Closes #123
EOF
)"
```

根据需要添加标志: `--no-verify`, `--amend`, `--signoff`

### 4. 收集结果

```bash
git rev-parse HEAD
git rev-parse --short HEAD
git branch --show-current
git show --stat --oneline HEAD
```

### 5. 写入 commit-result.json

```json
{
  "success": true,
  "commit_hash": "abc123...",
  "commit_hash_short": "abc123d",
  "commit_message_title": "feat(components): ✨ 新增 Button 组件",
  "branch": "feature/button",
  "files_committed": 2,
  "insertions": 80,
  "deletions": 0
}
```

## 错误处理

| 错误      | 处理                       |
| --------- | -------------------------- |
| No staged | 错误（amend 除外）         |
| Hook 失败 | 记录错误，建议 --no-verify |
| 冲突      | 错误，指示解决             |

## 返回

```
✅ 提交成功！
📝 ${title} | 📦 ${hash} | 🔀 ${branch} | 📊 ${files} files
Output: ${run_dir}/commit-result.json
```
