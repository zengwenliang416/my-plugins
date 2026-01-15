---
name: change-collector
description: |
  收集 git 变更信息（status、diff、统计），为后续分析提供原始数据。
  支持检测文件类型、变更类型和作用域。
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（如 .claude/committing/runs/20260114T103000Z）
  - name: include_unstaged
    type: boolean
    required: false
    default: false
    description: 是否包含未暂存的变更（默认只收集已暂存）
---

# change-collector - Git 变更收集器

## 职责

收集当前 Git 仓库的变更信息：

1. 执行 `git status --porcelain` 获取文件状态
2. 执行 `git diff --staged` 获取暂存区变更
3. 执行 `git diff` 获取工作区变更（可选）
4. 统计变更行数和文件数
5. 识别文件类型和作用域
6. 写入结构化数据到 `changes-raw.json`

## 输入

- `run_dir`: 运行目录（包含 state.json）
- `include_unstaged`: 是否包含未暂存变更（默认 false）

## 输出

输出到 `${run_dir}/changes-raw.json`:

```json
{
  "timestamp": "2026-01-14T10:30:00Z",
  "branch": "main",
  "staged": [
    {
      "status": "M",
      "path": "src/utils/helper.ts",
      "type": "modified",
      "file_type": "typescript",
      "scope": "utils"
    },
    {
      "status": "A",
      "path": "src/components/Button.tsx",
      "type": "added",
      "file_type": "tsx",
      "scope": "components"
    }
  ],
  "unstaged": [],
  "untracked": [
    {
      "status": "??",
      "path": "temp.log",
      "type": "untracked",
      "file_type": "log"
    }
  ],
  "diff_stat": {
    "files_changed": 2,
    "insertions": 45,
    "deletions": 12
  },
  "has_staged": true,
  "has_unstaged": false,
  "has_untracked": true
}
```

## 执行逻辑

### Step 1: 验证 Git 仓库

```bash
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo "❌ 错误：当前目录不是 Git 仓库"
    exit 1
fi
```

### Step 2: 获取当前分支

```bash
BRANCH=$(git branch --show-current)
if [ -z "$BRANCH" ]; then
    BRANCH="detached HEAD"
fi
```

### Step 3: 收集文件状态

```bash
# 使用 --porcelain 格式获取稳定输出
status_output=$(git status --porcelain)

staged_files=()
unstaged_files=()
untracked_files=()

while IFS= read -r line; do
    # 解析状态码（前两个字符）
    status_code="${line:0:2}"
    file_path="${line:3}"

    # 识别文件类型
    file_ext="${file_path##*.}"

    # 识别作用域（取文件路径的第二级目录）
    scope=$(echo "$file_path" | cut -d'/' -f2)

    case "$status_code" in
        "M "|"A "|"D "|"R "|"C ")
            # 已暂存的变更
            staged_files+=("$line")
            ;;
        " M"|" D")
            # 未暂存的变更
            unstaged_files+=("$line")
            ;;
        "??")
            # 未跟踪的文件
            untracked_files+=("$line")
            ;;
    esac
done <<< "$status_output"
```

### Step 4: 解析文件对象

```bash
parse_file_entry() {
    local line="$1"
    local status_code="${line:0:2}"
    local file_path="${line:3}"

    # 去除状态码中的空格
    status_code=$(echo "$status_code" | tr -d ' ')

    # 文件类型识别
    case "${file_path##*.}" in
        ts|tsx|js|jsx) file_type="typescript" ;;
        py) file_type="python" ;;
        go) file_type="go" ;;
        md) file_type="markdown" ;;
        json) file_type="json" ;;
        yaml|yml) file_type="yaml" ;;
        *) file_type="other" ;;
    esac

    # 作用域提取（src/components/Button.tsx → components）
    if [[ "$file_path" =~ ^([^/]+)/([^/]+) ]]; then
        scope="${BASH_REMATCH[2]}"
    else
        scope="root"
    fi

    # 变更类型映射
    case "$status_code" in
        M) type="modified" ;;
        A) type="added" ;;
        D) type="deleted" ;;
        R) type="renamed" ;;
        C) type="copied" ;;
        ??) type="untracked" ;;
        *) type="unknown" ;;
    esac

    # 输出 JSON 对象
    jq -n \
        --arg status "$status_code" \
        --arg path "$file_path" \
        --arg type "$type" \
        --arg file_type "$file_type" \
        --arg scope "$scope" \
        '{status: $status, path: $path, type: $type, file_type: $file_type, scope: $scope}'
}
```

### Step 5: 获取 diff 统计

```bash
# 获取已暂存变更的统计
if [ ${#staged_files[@]} -gt 0 ]; then
    diff_stat=$(git diff --staged --numstat | awk '
        {
            insertions += $1
            deletions += $2
            files++
        }
        END {
            printf "{\"files_changed\": %d, \"insertions\": %d, \"deletions\": %d}", files, insertions, deletions
        }
    ')
else
    diff_stat='{"files_changed": 0, "insertions": 0, "deletions": 0}'
fi
```

### Step 6: 构建输出 JSON

```bash
# 解析所有文件为 JSON 数组
staged_json=$(printf '%s\n' "${staged_files[@]}" | while read line; do
    parse_file_entry "$line"
done | jq -s '.')

unstaged_json=$(printf '%s\n' "${unstaged_files[@]}" | while read line; do
    parse_file_entry "$line"
done | jq -s '.')

untracked_json=$(printf '%s\n' "${untracked_files[@]}" | while read line; do
    parse_file_entry "$line"
done | jq -s '.')

# 生成完整结果
cat > "$run_dir/changes-raw.json" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "branch": "$BRANCH",
  "staged": $staged_json,
  "unstaged": $unstaged_json,
  "untracked": $untracked_json,
  "diff_stat": $diff_stat,
  "has_staged": $([ ${#staged_files[@]} -gt 0 ] && echo true || echo false),
  "has_unstaged": $([ ${#unstaged_files[@]} -gt 0 ] && echo true || echo false),
  "has_untracked": $([ ${#untracked_files[@]} -gt 0 ] && echo true || echo false)
}
EOF
```

### Step 7: 返回收集结果

```bash
echo "📊 变更收集完成"
echo "   - 已暂存: ${#staged_files[@]} 个文件"
echo "   - 未暂存: ${#unstaged_files[@]} 个文件"
echo "   - 未跟踪: ${#untracked_files[@]} 个文件"
echo "   - 输出: $run_dir/changes-raw.json"
```

## 使用示例

### 示例 1: 标准收集（仅已暂存）

**调用**:

```
Skill("committing:change-collector",
     args="run_dir=.claude/committing/runs/20260114T103000Z")
```

**Git 状态**:

```
M  src/utils/helper.ts
A  src/components/Button.tsx
 M docs/README.md
?? temp.log
```

**产出** (`changes-raw.json`):

```json
{
  "timestamp": "2026-01-14T10:30:00Z",
  "branch": "feature/button",
  "staged": [
    {
      "status": "M",
      "path": "src/utils/helper.ts",
      "type": "modified",
      "file_type": "typescript",
      "scope": "utils"
    },
    {
      "status": "A",
      "path": "src/components/Button.tsx",
      "type": "added",
      "file_type": "tsx",
      "scope": "components"
    }
  ],
  "unstaged": [],
  "untracked": [
    {
      "status": "??",
      "path": "temp.log",
      "type": "untracked",
      "file_type": "log",
      "scope": "root"
    }
  ],
  "diff_stat": {
    "files_changed": 2,
    "insertions": 45,
    "deletions": 12
  },
  "has_staged": true,
  "has_unstaged": false,
  "has_untracked": true
}
```

### 示例 2: 包含未暂存变更

**调用**:

```
Skill("committing:change-collector",
     args="run_dir=.claude/committing/runs/20260114T103000Z include_unstaged=true")
```

**行为**:

- 同时收集 `staged` 和 `unstaged` 数组
- `has_unstaged` 为 true
- unstaged 数组包含工作区变更

### 示例 3: 空仓库状态

**Git 状态**: `nothing to commit, working tree clean`

**产出**:

```json
{
  "timestamp": "2026-01-14T10:30:00Z",
  "branch": "main",
  "staged": [],
  "unstaged": [],
  "untracked": [],
  "diff_stat": {
    "files_changed": 0,
    "insertions": 0,
    "deletions": 0
  },
  "has_staged": false,
  "has_unstaged": false,
  "has_untracked": false
}
```

## 错误处理

| 错误类型         | 返回值         | 说明                   |
| ---------------- | -------------- | ---------------------- |
| 不是 Git 仓库    | exit 1         | `git rev-parse` 失败   |
| run_dir 不存在   | exit 1         | 输出目录未初始化       |
| git 命令失败     | exit 1         | 如权限问题、仓库损坏   |
| 无变更（空提交） | success 但提示 | 所有数组为空，提示用户 |
| JSON 解析失败    | exit 1         | jq 命令失败            |

## 在 Orchestrator 中的使用

### Phase 1: 收集变更阶段

```yaml
### Phase 1: 收集 Git 变更

1. 读取 state.json 获取 run_dir
2. 调用 Skill("committing:change-collector", args="run_dir=${RUN_DIR}")
3. 读取 changes-raw.json
4. 检查 has_staged:
   - false: 提示"无暂存变更"，询问是否先执行 git add
   - true: 继续下一阶段
5. 更新 state.json: steps.change-collector.status="done", output="${RUN_DIR}/changes-raw.json"
```

### 无变更检测

```yaml
on_no_changes:
  - 检查 changes-raw.json 的 has_staged
  - if false:
      - 列出 untracked 和 unstaged 文件
      - AskUserQuestion:
        1. 自动暂存所有变更 (git add -A)
        2. 手动选择文件暂存
        3. 中止提交
```

### 未暂存变更警告

```yaml
on_unstaged_changes:
  - if has_unstaged == true:
      - 警告："有未暂存的变更，当前提交不会包含它们"
      - 列出 unstaged 文件
      - 提供选项：继续/暂存/取消
```

## 文件类型识别扩展

```bash
# 扩展更多文件类型
case "${file_path##*.}" in
    ts|tsx) file_type="typescript" ;;
    js|jsx) file_type="javascript" ;;
    py) file_type="python" ;;
    go) file_type="go" ;;
    rs) file_type="rust" ;;
    java|kt) file_type="jvm" ;;
    md|mdx) file_type="markdown" ;;
    json|json5) file_type="json" ;;
    yaml|yml) file_type="yaml" ;;
    toml) file_type="toml" ;;
    sh|bash) file_type="shell" ;;
    Dockerfile) file_type="docker" ;;
    *) file_type="other" ;;
esac
```

## 作用域识别规则

| 路径模式                    | 识别作用域   |
| --------------------------- | ------------ |
| `src/components/Foo.tsx`    | `components` |
| `docs/README.md`            | `docs`       |
| `tests/unit/helper.test.ts` | `tests`      |
| `package.json`              | `root`       |
| `.github/workflows/ci.yml`  | `.github`    |

## Git Status 状态码映射

| 状态码 | 含义           | type      |
| ------ | -------------- | --------- |
| `M `   | 已暂存的修改   | modified  |
| `A `   | 已暂存的新增   | added     |
| `D `   | 已暂存的删除   | deleted   |
| `R `   | 已暂存的重命名 | renamed   |
| `C `   | 已暂存的复制   | copied    |
| ` M`   | 未暂存的修改   | modified  |
| ` D`   | 未暂存的删除   | deleted   |
| `??`   | 未跟踪         | untracked |
| `MM`   | 暂存后又修改   | modified  |

## 技术细节

### Porcelain 格式

```bash
# 使用 --porcelain 获取机器可读的输出
git status --porcelain

# 格式：XY PATH
# X: 暂存区状态
# Y: 工作区状态
```

### Diff Numstat 格式

```bash
git diff --staged --numstat

# 输出示例：
# 5    3    src/utils/helper.ts
# 40   9    src/components/Button.tsx
# ↑插入 ↑删除 ↑文件路径
```

### 性能优化

- 避免多次调用 git 命令，一次性收集所有信息
- 使用管道和 awk 进行高效统计
- JSON 构建使用 jq 确保格式正确

## 依赖

- **Bash**: 4.0+
- **Git**: 2.0+
- **jq**: JSON 处理
- **awk**: 文本统计

## 限制

1. **不处理冲突标记**: 合并冲突需要用户手动解决
2. **不验证文件有效性**: 不检查文件是否包含语法错误
3. **作用域识别简单**: 仅基于路径，不分析代码内容
4. **大仓库性能**: 超过 1000 个变更文件时可能较慢

## 参考

- 规范: `docs/orchestrator-contract.md` 第 3.2.2 节
- 状态文件: `skills/shared/workflow/STATE_FILE_V2.md`
- 映射表: `docs/orchestrator-to-skills-mapping.md` 第 89 行
- Git Status 文档: `man git-status`
