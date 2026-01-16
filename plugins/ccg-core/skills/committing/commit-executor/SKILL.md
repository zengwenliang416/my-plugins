---
name: commit-executor
description: |
  执行 git commit，支持多种选项和错误处理。
  读取 commit-message.md，执行提交操作。
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（如 .claude/committing/runs/20260114T103000Z）
  - name: commit_message_path
    type: string
    required: true
    description: message-generator 输出的 commit-message.md 路径
  - name: options
    type: string
    required: false
    description: Git commit 选项，JSON 格式（如 '{"no_verify": true, "amend": false}'）
---

# commit-executor - 提交执行器

## 职责

执行 git commit 操作：

1. 读取 `commit-message.md`（message-generator 产出）
2. 提取标题和正文
3. 构建 git commit 命令
4. 执行提交
5. 记录提交结果到 `commit-result.json`
6. 返回提交哈希和摘要

## 输入

- `run_dir`: 运行目录（包含 state.json）
- `commit_message_path`: message-generator 的输出文件路径
- `options`: Git commit 选项（可选）
  - `no_verify`: 跳过 Git hooks（默认 false）
  - `amend`: 修改上次提交（默认 false）
  - `signoff`: 添加 Signed-off-by（默认 false）
  - `dry_run`: 仅模拟执行，不实际提交（默认 false）

## 输出

输出到 `${run_dir}/commit-result.json`:

```json
{
  "success": true,
  "commit_hash": "abc1234",
  "commit_hash_short": "abc1234",
  "commit_message_title": "feat(components): ✨ 新增 Button 组件",
  "committed_at": "2026-01-14T10:30:00Z",
  "branch": "feature/button",
  "files_committed": 2,
  "insertions": 80,
  "deletions": 0
}
```

失败示例：

```json
{
  "success": false,
  "error": "hook_failed",
  "error_message": "pre-commit hook 返回非零退出码",
  "hook_output": "ESLint found 3 errors...",
  "suggestion": "使用 --no-verify 跳过 hooks，或修复错误后重试"
}
```

## 执行逻辑

### Step 1: 验证 Git 仓库和状态

```bash
# 检查是否在 Git 仓库中
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo "❌ 错误：当前目录不是 Git 仓库"
    exit 1
fi

# 检查是否有已暂存的变更
if ! git diff --cached --quiet; then
    has_staged=true
else
    has_staged=false
    echo "⚠️  警告：没有已暂存的变更"
fi
```

### Step 2: 读取提交信息

```bash
if [ ! -f "$commit_message_path" ]; then
    echo "❌ 错误：找不到提交信息文件: $commit_message_path"
    exit 1
fi

# 提取标题（## 标题 下一行）
title=$(sed -n '/^## 标题$/,/^## /p' "$commit_message_path" | sed '1d;$d' | head -1)

# 提取正文（## 正文 到 ## Footer 之间）
body=$(sed -n '/^## 正文$/,/^## Footer$/p' "$commit_message_path" | sed '1d;$d')

# 提取 footer（## Footer 下的内容）
footer=$(sed -n '/^## Footer$/,/^$/p' "$commit_message_path" | sed '1d' | grep -v '^（无）$')

# 移除多余空行
body=$(echo "$body" | sed '/^$/N;/^\n$/D')
```

### Step 3: 解析选项

```bash
# 默认选项
no_verify=false
amend=false
signoff=false
dry_run=false

if [ -n "$options" ]; then
    no_verify=$(echo "$options" | jq -r '.no_verify // false')
    amend=$(echo "$options" | jq -r '.amend // false')
    signoff=$(echo "$options" | jq -r '.signoff // false')
    dry_run=$(echo "$options" | jq -r '.dry_run // false')
fi
```

### Step 4: 构建 git commit 命令

```bash
# 构建完整提交信息
commit_message="$title"

if [ -n "$body" ]; then
    commit_message="$commit_message

$body"
fi

if [ -n "$footer" ]; then
    commit_message="$commit_message

$footer"
fi

# 构建 git commit 参数
git_args=()

if [ "$no_verify" = "true" ]; then
    git_args+=(--no-verify)
fi

if [ "$amend" = "true" ]; then
    git_args+=(--amend)
fi

if [ "$signoff" = "true" ]; then
    git_args+=(--signoff)
fi

if [ "$dry_run" = "true" ]; then
    git_args+=(--dry-run)
fi
```

### Step 5: 执行提交

```bash
echo "🚀 执行 git commit..."

# 使用 HEREDOC 传递提交信息，避免引号转义问题
if commit_output=$(git commit "${git_args[@]}" -m "$(cat <<EOF
$commit_message
EOF
)" 2>&1); then
    success=true
    echo "✅ 提交成功"
else
    success=false
    error_code=$?
    echo "❌ 提交失败"
fi
```

### Step 6: 提取提交信息

```bash
if [ "$success" = "true" ]; then
    # 获取最新提交哈希
    commit_hash=$(git rev-parse HEAD)
    commit_hash_short=$(git rev-parse --short HEAD)

    # 获取分支名
    branch=$(git branch --show-current)

    # 获取提交统计
    stats=$(git show --stat --format="" HEAD | tail -1)
    files_committed=$(echo "$stats" | awk '{print $1}')
    insertions=$(echo "$stats" | grep -oP '\d+(?= insertion)' || echo 0)
    deletions=$(echo "$stats" | grep -oP '\d+(?= deletion)' || echo 0)

    # 生成结果
    cat > "$run_dir/commit-result.json" <<EOF
{
  "success": true,
  "commit_hash": "$commit_hash",
  "commit_hash_short": "$commit_hash_short",
  "commit_message_title": "$title",
  "committed_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "branch": "$branch",
  "files_committed": ${files_committed:-0},
  "insertions": ${insertions:-0},
  "deletions": ${deletions:-0}
}
EOF
else
    # 分析错误类型
    if echo "$commit_output" | grep -q "pre-commit"; then
        error_type="pre_commit_hook_failed"
        suggestion="使用 --no-verify 跳过 hooks，或修复 pre-commit 检查失败的问题"
    elif echo "$commit_output" | grep -q "commit-msg"; then
        error_type="commit_msg_hook_failed"
        suggestion="检查提交信息格式是否符合 commit-msg hook 的要求"
    elif echo "$commit_output" | grep -q "nothing to commit"; then
        error_type="nothing_to_commit"
        suggestion="没有变更需要提交，请先使用 git add 暂存文件"
    else
        error_type="unknown"
        suggestion="检查 git 状态和错误信息"
    fi

    # 生成错误结果
    cat > "$run_dir/commit-result.json" <<EOF
{
  "success": false,
  "error": "$error_type",
  "error_message": "$(echo "$commit_output" | head -1)",
  "hook_output": "$(echo "$commit_output" | tail -5)",
  "suggestion": "$suggestion"
}
EOF
fi
```

### Step 7: 返回执行结果

```bash
if [ "$success" = "true" ]; then
    echo "✅ 提交成功"
    echo "   - Commit: $commit_hash_short"
    echo "   - 分支: $branch"
    echo "   - 文件数: $files_committed"
    echo "   - 变更: +$insertions/-$deletions"
    echo "   - 输出: $run_dir/commit-result.json"
    exit 0
else
    echo "❌ 提交失败: $error_type"
    echo "   - 错误: $error_message"
    echo "   - 建议: $suggestion"
    echo "   - 输出: $run_dir/commit-result.json"
    exit 1
fi
```

## 使用示例

### 示例 1: 标准提交

**输入** (`commit-message.md`):

```markdown
# Commit Message

## 标题

feat(components): ✨ 新增 Button 组件

## 正文

变更文件清单:

**feat**:

- src/components/Button.tsx
- src/components/Button.test.tsx

变更统计: 2 个文件，+80/-0 行

## Footer

（无）
```

**调用**:

```
Skill("committing:commit-executor",
     args="run_dir=.claude/committing/runs/20260114T103000Z commit_message_path=${RUN_DIR}/commit-message.md")
```

**产出** (`commit-result.json`):

```json
{
  "success": true,
  "commit_hash": "abc1234567890abcdef1234567890abcdef12345",
  "commit_hash_short": "abc1234",
  "commit_message_title": "feat(components): ✨ 新增 Button 组件",
  "committed_at": "2026-01-14T10:30:00Z",
  "branch": "feature/button",
  "files_committed": 2,
  "insertions": 80,
  "deletions": 0
}
```

### 示例 2: 跳过 Hooks

**调用**:

```
Skill("committing:commit-executor",
     args='run_dir=${RUN_DIR} commit_message_path=${RUN_DIR}/commit-message.md options={"no_verify": true}')
```

**行为**:

- 执行 `git commit --no-verify`
- 跳过 pre-commit 和 commit-msg hooks

### 示例 3: 修改上次提交

**调用**:

```
Skill("committing:commit-executor",
     args='run_dir=${RUN_DIR} commit_message_path=${RUN_DIR}/commit-message.md options={"amend": true}')
```

**行为**:

- 执行 `git commit --amend`
- 替换最近一次提交

### 示例 4: Dry Run 模式

**调用**:

```
Skill("committing:commit-executor",
     args='run_dir=${RUN_DIR} commit_message_path=${RUN_DIR}/commit-message.md options={"dry_run": true}')
```

**行为**:

- 仅模拟执行，不实际创建提交
- 用于验证提交信息和暂存状态

### 示例 5: Hook 失败处理

**场景**: pre-commit hook 检测到 ESLint 错误

**产出** (`commit-result.json`):

```json
{
  "success": false,
  "error": "pre_commit_hook_failed",
  "error_message": "pre-commit hook returned non-zero exit code",
  "hook_output": "ESLint found 3 errors:\n  src/utils/helper.ts:10:5 - 'foo' is defined but never used",
  "suggestion": "使用 --no-verify 跳过 hooks，或修复 pre-commit 检查失败的问题"
}
```

## 错误类型和处理

| 错误类型                 | 说明                    | 建议                       |
| ------------------------ | ----------------------- | -------------------------- |
| `pre_commit_hook_failed` | pre-commit hook 失败    | 修复问题或使用 --no-verify |
| `commit_msg_hook_failed` | commit-msg hook 失败    | 检查提交信息格式           |
| `nothing_to_commit`      | 没有已暂存的变更        | 先使用 git add 暂存文件    |
| `detached_head`          | 处于 detached HEAD 状态 | 切换到分支或创建新分支     |
| `merge_conflict`         | 存在未解决的合并冲突    | 解决冲突后重试             |
| `unknown`                | 其他未知错误            | 检查 git 状态和错误信息    |

## 在 Orchestrator 中的使用

### Phase 4: 执行提交阶段

```yaml
### Phase 4: 执行提交

1. 读取 state.json 获取 run_dir
2. 读取 steps.message-generator.output 获取 commit-message.md 路径
3. 读取用户选项（从 Command 层传入）
4. 调用 Skill("committing:commit-executor",
            args="run_dir=${RUN_DIR} commit_message_path=${MESSAGE_PATH} options=${OPTIONS}")
5. 读取 commit-result.json
6. if success:
     - 显示提交成功信息（commit hash, 分支, 统计）
     - 更新 state.json: steps.commit-executor.status="done", output="${COMMIT_HASH}"
     - 询问用户：是否推送到远程？
   else:
     - 显示错误信息和建议
     - 更新 state.json: steps.commit-executor.status="failed", error="${ERROR}"
     - AskUserQuestion: 重试/跳过 hooks/中止
```

### 错误恢复流程

```yaml
on_commit_failed:
  - 显示错误类型和输出
  - 根据错误类型提供选项：
    1. pre_commit_hook_failed:
       - 选项1: 修复问题后重试（返回上一步）
       - 选项2: 跳过 hooks（--no-verify）
       - 选项3: 中止提交
    2. nothing_to_commit:
       - 选项1: 返回 change-collector 阶段
       - 选项2: 中止提交
    3. commit_msg_hook_failed:
       - 选项1: 编辑提交信息
       - 选项2: 跳过 hooks
       - 选项3: 中止提交
```

## Git Commit 选项详解

### --no-verify

```bash
git commit --no-verify

# 跳过以下 hooks:
# - pre-commit: 代码质量检查
# - commit-msg: 提交信息格式验证
# - prepare-commit-msg: 提交信息预处理
```

**使用场景**:

- 紧急修复需要快速提交
- Hooks 配置有问题需要临时绕过
- 已经手动验证过代码质量

**风险**: 可能提交不符合规范的代码

### --amend

```bash
git commit --amend

# 修改最近一次提交:
# - 替换提交信息
# - 添加遗漏的文件
# - 修改提交内容
```

**使用场景**:

- 提交后发现遗漏文件
- 提交信息有误需要修正
- 合并小的修复到上次提交

**风险**: 如果已推送到远程，需要 force push

### --signoff

```bash
git commit --signoff

# 添加 Signed-off-by 行:
# Signed-off-by: Your Name <your.email@example.com>
```

**使用场景**:

- 开源项目要求签署 DCO
- 公司要求提交签名
- 法律合规需求

## 提交信息格式处理

### HEREDOC 使用

```bash
# 正确做法：使用 HEREDOC 避免引号转义问题
git commit -m "$(cat <<'EOF'
feat(api): ✨ 添加新接口

新增用户管理接口:
- POST /api/users
- GET /api/users/:id

Closes #123
EOF
)"

# 错误做法：直接拼接字符串（会导致引号和换行符问题）
git commit -m "feat(api): ✨ 添加新接口\n\n新增用户管理接口..."
```

### 多行提交信息提取

```bash
# 从 Markdown 提取各部分
title=$(sed -n '/^## 标题$/,/^## /p' file.md | sed '1d;$d' | head -1)
body=$(sed -n '/^## 正文$/,/^## Footer$/p' file.md | sed '1d;$d')
footer=$(sed -n '/^## Footer$/,/^$/p' file.md | sed '1d')
```

## 技术细节

### 提交统计解析

```bash
# git show --stat 输出示例:
# 2 files changed, 80 insertions(+), 5 deletions(-)

stats=$(git show --stat --format="" HEAD | tail -1)
files=$(echo "$stats" | awk '{print $1}')
insertions=$(echo "$stats" | grep -oP '\d+(?= insertion)' || echo 0)
deletions=$(echo "$stats" | grep -oP '\d+(?= deletion)' || echo 0)
```

### Hook 输出捕获

```bash
# 捕获 stdout 和 stderr
if commit_output=$(git commit -m "message" 2>&1); then
    success=true
else
    success=false
    # commit_output 包含 hook 的错误输出
fi
```

### Dry Run 验证

```bash
git commit --dry-run -m "message"

# 仅验证，不创建提交:
# - 检查是否有已暂存的变更
# - 验证提交信息格式
# - 模拟执行 hooks（如果未 --no-verify）
```

## 依赖

- **Bash**: 4.0+
- **Git**: 2.0+
- **jq**: JSON 处理
- **sed/grep/awk**: 文本处理
- **message-generator**: 依赖其输出的 commit-message.md

## 限制

1. **不处理合并冲突**: 需要用户手动解决冲突
2. **不自动推送**: 提交成功后不自动 push（需用户确认）
3. **不验证远程状态**: 不检查是否需要先 pull
4. **不支持 GPG 签名**: 未集成 --gpg-sign 选项

## 未来扩展

1. **自动推送**: 提供选项在提交后自动 push
2. **GPG 签名**: 支持 --gpg-sign 选项
3. **远程状态检查**: 提交前检查是否需要 pull
4. **交互式 Rebase**: 支持 --fixup 和自动 rebase
5. **多提交执行**: 支持拆分提交场景的批量执行

## 参考

- 规范: `docs/orchestrator-contract.md` 第 3.2.5 节
- 状态文件: `skills/shared/workflow/STATE_FILE_V2.md`
- 映射表: `docs/orchestrator-to-skills-mapping.md` 第 92 行
- Git Commit 文档: `man git-commit`
- Git Hooks 文档: `man githooks`
