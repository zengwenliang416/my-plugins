---
name: message-generator
description: |
  生成规范的 Conventional Commit 提交信息。
  读取 change-analyzer 输出，生成标题、正文、footer。
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（如 .claude/committing/runs/20260114T103000Z）
  - name: changes_analysis_path
    type: string
    required: true
    description: change-analyzer 输出的 changes-analysis.json 路径
  - name: options
    type: string
    required: false
    description: 用户选项，JSON 格式（如 '{"emoji": true, "type": "feat", "scope": "api"}'）
---

# message-generator - 提交信息生成器

## 职责

生成规范的 Conventional Commit 提交信息：

1. 读取 `changes-analysis.json`（change-analyzer 产出）
2. 提取 type、scope、文件清单
3. 生成简洁的提交标题（≤72 字符）
4. 生成详细的正文（列出变更文件）
5. 添加 footer（如 Closes #123）
6. 写入 `commit-message.md`

## 输入

- `run_dir`: 运行目录（包含 state.json）
- `changes_analysis_path`: change-analyzer 的输出文件路径
- `options`: 用户选项（可选）
  - `emoji`: 是否使用 emoji（默认 true）
  - `type`: 强制指定 type（覆盖分析结果）
  - `scope`: 强制指定 scope（覆盖分析结果）
  - `breaking`: 是否为 breaking change（默认 false）
  - `issue`: 关联的 issue 编号（如 123）
  - `signoff`: 是否添加 Signed-off-by（默认 false）

## 输出

输出到 `${run_dir}/commit-message.md`:

```markdown
# Commit Message

## 标题

feat(components): ✨ 新增 Button 组件

## 正文

新增可复用的 Button 组件，支持多种样式和尺寸：

- src/components/Button.tsx: 组件实现
- src/components/Button.test.tsx: 单元测试
- src/components/index.ts: 导出声明

变更统计: 2 个文件，+80/-0 行

## Footer

Closes #123
```

**Breaking Change 示例**:

```markdown
## 标题

feat(api)!: ✨ 修改响应数据格式

## 正文

将 API 响应字段从下划线命名改为驼峰命名。

BREAKING CHANGE: 所有 API 响应字段格式变更，客户端需要更新解析逻辑。

## Footer

Closes #456
```

## 执行逻辑

### Step 1: 读取分析结果

```bash
if [ ! -f "$changes_analysis_path" ]; then
    echo "❌ 错误：找不到分析结果文件: $changes_analysis_path"
    exit 1
fi

analysis=$(cat "$changes_analysis_path")

# 提取关键信息
primary_type=$(echo "$analysis" | jq -r '.primary_type')
primary_scope=$(echo "$analysis" | jq -r '.primary_scope')
analyzed_files=$(echo "$analysis" | jq -r '.analyzed_files')
complexity=$(echo "$analysis" | jq -r '.complexity')
```

### Step 2: 解析用户选项

```bash
# 默认选项
use_emoji=true
force_type=""
force_scope=""
is_breaking=false
issue_number=""
add_signoff=false

if [ -n "$options" ]; then
    use_emoji=$(echo "$options" | jq -r '.emoji // true')
    force_type=$(echo "$options" | jq -r '.type // ""')
    force_scope=$(echo "$options" | jq -r '.scope // ""')
    is_breaking=$(echo "$options" | jq -r '.breaking // false')
    issue_number=$(echo "$options" | jq -r '.issue // ""')
    add_signoff=$(echo "$options" | jq -r '.signoff // false')
fi

# 使用强制选项覆盖分析结果
commit_type="${force_type:-$primary_type}"
commit_scope="${force_scope:-$primary_scope}"
```

### Step 3: 选择 Emoji

```bash
get_emoji() {
    local type="$1"

    case "$type" in
        feat)     echo "✨" ;;
        fix)      echo "🐛" ;;
        docs)     echo "📝" ;;
        style)    echo "💄" ;;
        refactor) echo "♻️" ;;
        perf)     echo "⚡" ;;
        test)     echo "✅" ;;
        build)    echo "📦" ;;
        ci)       echo "👷" ;;
        chore)    echo "🔧" ;;
        revert)   echo "⏪" ;;
        *)        echo "🔨" ;;
    esac
}

emoji=$(get_emoji "$commit_type")
if [ "$use_emoji" != "true" ]; then
    emoji=""
fi
```

### Step 4: 生成标题

```bash
# 构建标题行
if [ -n "$commit_scope" ] && [ "$commit_scope" != "null" ] && [ "$commit_scope" != "root" ]; then
    title_prefix="$commit_type($commit_scope)"
else
    title_prefix="$commit_type"
fi

# Breaking change 标记
if [ "$is_breaking" = "true" ]; then
    title_prefix="${title_prefix}!"
fi

# 生成简短描述（这里简化，实际应该基于文件变更智能生成）
# 从分析结果获取建议描述
suggested_description=$(echo "$analysis" | jq -r '.commit_strategy.reason // "变更相关文件"' | head -c 50)

# 组合标题（emoji + 空格 + 描述）
if [ -n "$emoji" ]; then
    title="$title_prefix: $emoji $suggested_description"
else
    title="$title_prefix: $suggested_description"
fi

# 限制标题长度（≤72 字符）
if [ ${#title} -gt 72 ]; then
    title="${title:0:69}..."
fi
```

### Step 5: 生成正文

```bash
# 提取文件列表
files_by_type=$(echo "$analysis" | jq -r '.files_by_type')

body=""

# 添加变更说明
body+="变更文件清单:\n\n"

# 按类型分组列出文件
for type in $(echo "$files_by_type" | jq -r 'keys[]'); do
    files=$(echo "$files_by_type" | jq -r --arg type "$type" '.[$type] | .[] | .path')

    if [ -n "$files" ]; then
        # 添加类型标题
        type_emoji=$(get_emoji "$type")
        body+="**$type**:\n"

        # 列出文件
        while IFS= read -r file; do
            body+="- $file\n"
        done <<< "$files"

        body+="\n"
    fi
done

# 添加统计信息
# 这里需要从原始 changes-raw.json 读取 diff_stat
# 简化处理：从 changes_analysis_path 的父目录查找 changes-raw.json
changes_raw_path="$(dirname "$changes_analysis_path")/changes-raw.json"
if [ -f "$changes_raw_path" ]; then
    insertions=$(jq -r '.diff_stat.insertions' "$changes_raw_path")
    deletions=$(jq -r '.diff_stat.deletions' "$changes_raw_path")
    body+="\n变更统计: $analyzed_files 个文件，+$insertions/-$deletions 行\n"
fi
```

### Step 6: 生成 Footer

```bash
footer=""

# Breaking change 说明
if [ "$is_breaking" = "true" ]; then
    footer+="BREAKING CHANGE: [请在此描述不兼容变更]\n\n"
fi

# 关联 issue
if [ -n "$issue_number" ]; then
    footer+="Closes #$issue_number\n"
fi

# Signed-off-by
if [ "$add_signoff" = "true" ]; then
    git_user=$(git config user.name)
    git_email=$(git config user.email)
    footer+="\nSigned-off-by: $git_user <$git_email>\n"
fi
```

### Step 7: 写入提交信息文件

```bash
cat > "$run_dir/commit-message.md" <<EOF
# Commit Message

## 标题

$title

## 正文

$body

## Footer

${footer:-（无）}
EOF
```

### Step 8: 返回生成结果

```bash
echo "📝 提交信息生成完成"
echo "   - Type: $commit_type"
echo "   - Scope: ${commit_scope:-（无）}"
echo "   - 文件数: $analyzed_files"
echo "   - Breaking: $([ "$is_breaking" = "true" ] && echo "是" || echo "否")"
echo "   - 输出: $run_dir/commit-message.md"
```

## 使用示例

### 示例 1: 标准提交信息

**输入** (`changes-analysis.json`):

```json
{
  "primary_type": "feat",
  "primary_scope": "components",
  "analyzed_files": 2,
  "complexity": "low",
  "files_by_type": {
    "feat": [
      {
        "path": "src/components/Button.tsx",
        "scope": "components"
      },
      {
        "path": "src/components/Button.test.tsx",
        "scope": "components"
      }
    ]
  }
}
```

**调用**:

```
Skill("committing:message-generator",
     args="run_dir=.claude/committing/runs/20260114T103000Z changes_analysis_path=${RUN_DIR}/changes-analysis.json")
```

**产出** (`commit-message.md`):

```markdown
# Commit Message

## 标题

feat(components): ✨ 基于 2 个文件的分析，主要类型为 added

## 正文

变更文件清单:

**feat**:

- src/components/Button.tsx
- src/components/Button.test.tsx

变更统计: 2 个文件，+80/-0 行

## Footer

（无）
```

### 示例 2: 带选项的提交

**调用**:

```
Skill("committing:message-generator",
     args='run_dir=${RUN_DIR} changes_analysis_path=${RUN_DIR}/changes-analysis.json options={"type": "fix", "scope": "auth", "emoji": false, "issue": 456}')
```

**产出**:

```markdown
## 标题

fix(auth): 基于分析结果的描述

## Footer

Closes #456
```

### 示例 3: Breaking Change

**调用**:

```
Skill("committing:message-generator",
     args='run_dir=${RUN_DIR} changes_analysis_path=${RUN_DIR}/changes-analysis.json options={"breaking": true, "issue": 789}')
```

**产出**:

```markdown
## 标题

feat(api)!: ✨ 变更描述

## 正文

...

## Footer

BREAKING CHANGE: [请在此描述不兼容变更]

Closes #789
```

## Type 类型表

| Type       | Emoji | 说明                   |
| ---------- | ----- | ---------------------- |
| `feat`     | ✨    | 新功能                 |
| `fix`      | 🐛    | Bug 修复               |
| `docs`     | 📝    | 文档变更               |
| `style`    | 💄    | 代码格式（不影响逻辑） |
| `refactor` | ♻️    | 重构（非 feat/fix）    |
| `perf`     | ⚡    | 性能优化               |
| `test`     | ✅    | 测试相关               |
| `build`    | 📦    | 构建/依赖              |
| `ci`       | 👷    | CI 配置                |
| `chore`    | 🔧    | 其他杂项               |
| `revert`   | ⏪    | 回滚提交               |

## Conventional Commits 规则

| 部分   | 规则                                |
| ------ | ----------------------------------- |
| 标题行 | 不超过 72 字符                      |
| type   | 必填，见上方类型表                  |
| scope  | 可选，影响范围（如 api/ui/core）    |
| emoji  | 可选，对应 type                     |
| 描述   | 必填，祈使语气，简洁                |
| 正文   | 可选，详细说明变更                  |
| footer | 可选，关联 issue 或 BREAKING CHANGE |

## 错误处理

| 错误类型                     | 返回值     | 说明                           |
| ---------------------------- | ---------- | ------------------------------ |
| changes-analysis.json 不存在 | exit 1     | 依赖文件缺失                   |
| JSON 解析失败                | exit 1     | changes-analysis.json 格式错误 |
| run_dir 不存在               | exit 1     | 输出目录未初始化               |
| options 格式错误             | 使用默认值 | JSON 解析失败时忽略选项        |

## 在 Orchestrator 中的使用

### Phase 3: 生成提交信息阶段

```yaml
### Phase 3: 生成提交信息

1. 读取 state.json 获取 run_dir
2. 读取 steps.change-analyzer.output 获取 changes-analysis.json 路径
3. 读取用户选项（从 Command 层传入）
4. 调用 Skill("committing:message-generator",
            args="run_dir=${RUN_DIR} changes_analysis_path=${ANALYSIS_PATH} options=${OPTIONS}")
5. 读取 commit-message.md
6. 显示生成的提交信息给用户
7. AskUserQuestion: 是否使用此提交信息？
   - 是: 继续下一阶段
   - 否: 允许用户编辑或重新生成
   - 取消: 中止提交流程
8. 更新 state.json: steps.message-generator.status="done", output="${RUN_DIR}/commit-message.md"
```

### 用户编辑流程

```yaml
on_user_edit_request:
  - 保存当前 commit-message.md 为 commit-message.bak.md
  - 允许用户编辑 commit-message.md
  - 重新读取并验证格式
  - 继续提交流程
```

## 标题生成策略

### 基于文件类型的描述模板

| 文件类型      | 描述模板                 |
| ------------- | ------------------------ |
| tsx/jsx 组件  | "新增 {组件名} 组件"     |
| API 文件      | "添加 {端点名} 接口"     |
| utils/helpers | "重构 {模块名} 工具函数" |
| docs          | "更新 {文档主题} 文档"   |
| 配置文件      | "调整 {配置项} 配置"     |
| 测试文件      | "完善 {模块名} 测试用例" |

### 智能描述生成（未来扩展）

```bash
# 从文件名和路径提取语义
# src/components/Button.tsx → "新增 Button 组件"
# src/api/users.ts → "添加用户相关接口"
# docs/API.md → "更新 API 文档"
```

## 技术细节

### 标题长度控制

```bash
# 确保标题不超过 72 字符（Conventional Commits 推荐）
if [ ${#title} -gt 72 ]; then
    title="${title:0:69}..."
fi
```

### Breaking Change 标记

```
# 符合 Conventional Commits 规范
feat!: 描述           # Breaking change
feat(scope)!: 描述    # Breaking change with scope
```

### 多提交场景（未来扩展）

当 change-analyzer 建议拆分时，生成多个提交信息块：

```markdown
# Commit Messages (2)

## Commit 1 / 2

feat(components): ✨ 新增 Button 组件

...

## Commit 2 / 2

refactor(utils): ♻️ 重构工具函数

...
```

## 依赖

- **Bash**: 4.0+
- **jq**: JSON 处理
- **git**: 获取用户信息（用于 Signed-off-by）
- **change-analyzer**: 依赖其输出的 changes-analysis.json

## 限制

1. **描述生成简单**: 当前基于分析结果的 reason 字段，未深度生成语义描述
2. **不支持多语言**: 提交信息固定为中文
3. **模板固定**: 未支持自定义提交信息模板
4. **不验证语法**: 不检查提交信息是否符合项目规范

## 未来扩展

1. **智能描述生成**: 基于文件名、diff 内容生成更准确的描述
2. **多语言支持**: 支持英文提交信息
3. **模板系统**: 允许项目自定义提交信息格式
4. **交互式编辑**: 集成编辑器让用户直接修改
5. **历史学习**: 基于项目历史 commit 学习提交风格

## 参考

- 规范: `docs/orchestrator-contract.md` 第 3.2.4 节
- 状态文件: `skills/shared/workflow/STATE_FILE_V2.md`
- 映射表: `docs/orchestrator-to-skills-mapping.md` 第 91 行
- Conventional Commits: https://www.conventionalcommits.org/
- Angular Commit Guidelines: https://github.com/angular/angular/blob/main/CONTRIBUTING.md
