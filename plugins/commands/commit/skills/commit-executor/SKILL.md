---
name: commit-executor
description: |
  【触发条件】commit 工作流最后一步：执行 git commit。
  【核心产出】输出 ${run_dir}/commit-result.json，包含提交哈希和结果。
  【不触发】生成消息（用 message-generator）、分析变更（用 change-analyzer）。
  【先问什么】pre-commit hook 失败时，询问是否跳过 hook 或修复问题
allowed-tools:
  - Read
  - Write
  - Bash
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（包含 commit-message.md）
  - name: options
    type: string
    required: false
    description: Git commit 选项 JSON（如 '{"no_verify": true, "amend": false}'）
---

# Commit Executor - 提交执行原子技能

## 职责边界

- **输入**: `run_dir`（包含 `commit-message.md`）+ `options`
- **输出**: `${run_dir}/commit-result.json`
- **单一职责**: 只执行 git commit，不做分析，不生成消息

---

## 执行流程

### Step 1: 读取提交信息

读取 `${run_dir}/commit-message.md`，提取：
- 标题（`## 标题` 下的内容）
- 正文（`## 正文` 下的内容）
- Footer（`## Footer` 下的内容，如有）

### Step 2: 解析选项

从 `options` 参数解析（如有）：

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `no_verify` | 跳过 git hooks | false |
| `amend` | 修改上次提交 | false |
| `signoff` | 添加 Signed-off-by | false |
| `dry_run` | 模拟执行 | false |

### Step 3: 验证暂存区

```bash
# 检查是否有暂存变更（amend 模式除外）
git diff --cached --quiet
```

如果没有暂存变更且不是 amend 模式，报错退出。

### Step 4: 构建提交命令

构建 git commit 命令：

```bash
git commit \
  -m "标题" \
  -m "正文" \
  ${no_verify:+--no-verify} \
  ${amend:+--amend} \
  ${signoff:+--signoff}
```

**重要**：使用 HEREDOC 格式传递多行消息：

```bash
git commit -m "$(cat <<'EOF'
feat(components): ✨ 新增 Button 组件

新增可复用的 Button 组件，支持多种样式和尺寸。

变更文件:
- src/components/Button.tsx: 组件实现

Closes #123
EOF
)"
```

### Step 5: 执行提交

执行 git commit 命令。

**如果 dry_run=true**：
- 不执行实际提交
- 输出模拟结果

### Step 6: 收集结果

提交成功后，获取结果信息：

```bash
# 获取提交哈希
git rev-parse HEAD

# 获取简短哈希
git rev-parse --short HEAD

# 获取当前分支
git branch --show-current

# 获取变更统计
git show --stat --oneline HEAD
```

### Step 7: 写入结果

使用 Write 工具将结果写入 `${run_dir}/commit-result.json`：

**成功示例**：
```json
{
  "success": true,
  "commit_hash": "abc123def456...",
  "commit_hash_short": "abc123d",
  "commit_message_title": "feat(components): ✨ 新增 Button 组件",
  "committed_at": "2026-01-16T10:30:00Z",
  "branch": "feature/button",
  "files_committed": 2,
  "insertions": 80,
  "deletions": 0
}
```

**失败示例**：
```json
{
  "success": false,
  "error": "hook_failed",
  "error_message": "pre-commit hook 返回非零退出码",
  "hook_output": "ESLint found 3 errors...",
  "suggestion": "使用 --no-verify 跳过 hooks，或修复错误后重试"
}
```

---

## 错误处理

| 错误类型 | 处理方式 |
|----------|----------|
| 不是 Git 仓库 | 报错退出 |
| 无暂存变更 | 报错退出（amend 除外） |
| Hook 失败 | 记录错误，建议使用 --no-verify |
| 冲突 | 报错退出，提示解决冲突 |

---

## 返回值

执行完成后，返回：

**成功**：
```
✅ 提交成功！

📝 消息: ${commit_message_title}
📦 哈希: ${commit_hash_short}
🔀 分支: ${branch}
📊 变更: ${files_committed} 个文件，+${insertions}/-${deletions} 行

输出: ${run_dir}/commit-result.json
```

**失败**：
```
❌ 提交失败

错误: ${error_message}
建议: ${suggestion}

输出: ${run_dir}/commit-result.json
```

---

## 约束

- 不做变更分析（交给 change-analyzer）
- 不生成提交消息（交给 message-generator）
- 使用 HEREDOC 格式传递多行消息，确保格式正确
- 不使用 `-i` 等交互式选项
- 不执行 `git push`（由用户决定）
