---
name: change-analyzer
description: |
  分析 git 变更的类型、作用域、拆分建议。
  读取 change-collector 输出，生成结构化分析结果。
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（如 .claude/committing/runs/20260114T103000Z）
  - name: changes_raw_path
    type: string
    required: true
    description: change-collector 输出的 changes-raw.json 路径
  - name: analyze_depth
    type: string
    required: false
    default: standard
    description: 分析深度（quick/standard/detailed），默认 standard
---

# change-analyzer - 变更分析器

## 职责

分析 git 变更，提供提交策略建议：

1. 读取 `changes-raw.json`（change-collector 产出）
2. 识别变更类型（feat/fix/refactor/style/docs/test）
3. 提取作用域（components/utils/api 等）
4. 评估是否需要拆分提交
5. 生成拆分建议（如需要）
6. 写入分析结果到 `changes-analysis.json`

## 输入

- `run_dir`: 运行目录（包含 state.json）
- `changes_raw_path`: change-collector 的输出文件路径
- `analyze_depth`: 分析深度
  - `quick`: 快速分析，仅基本类型识别
  - `standard`: 标准分析，包含拆分建议（默认）
  - `detailed`: 详细分析，包含 diff 内容分析

## 输出

输出到 `${run_dir}/changes-analysis.json`:

```json
{
  "timestamp": "2026-01-14T10:30:00Z",
  "analyzed_files": 3,
  "primary_type": "feat",
  "primary_scope": "components",
  "secondary_types": ["refactor", "style"],
  "scopes": ["components", "utils"],
  "complexity": "medium",
  "should_split": false,
  "split_recommendation": null,
  "commit_strategy": {
    "suggested_type": "feat",
    "suggested_scope": "components",
    "confidence": "high",
    "reason": "3个文件均为新增组件，作用域一致"
  },
  "files_by_type": {
    "feat": [
      {
        "path": "src/components/Button.tsx",
        "scope": "components",
        "file_type": "tsx",
        "change_type": "added"
      }
    ],
    "refactor": [
      {
        "path": "src/utils/helper.ts",
        "scope": "utils",
        "file_type": "typescript",
        "change_type": "modified"
      }
    ]
  }
}
```

拆分建议示例（当 should_split 为 true）：

```json
{
  "should_split": true,
  "reason": "包含多个独立功能，建议拆分为 2 个提交",
  "split_recommendation": {
    "commits": [
      {
        "type": "feat",
        "scope": "components",
        "files": ["src/components/Button.tsx"],
        "description": "新增 Button 组件",
        "priority": 1
      },
      {
        "type": "refactor",
        "scope": "utils",
        "files": ["src/utils/helper.ts"],
        "description": "重构工具函数",
        "priority": 2
      }
    ],
    "execution": "git add src/components/Button.tsx && git commit, then git add src/utils/helper.ts && git commit"
  }
}
```

## 执行逻辑

### Step 1: 读取原始变更数据

```bash
if [ ! -f "$changes_raw_path" ]; then
    echo "❌ 错误：找不到变更数据文件: $changes_raw_path"
    exit 1
fi

changes_raw=$(cat "$changes_raw_path")

# 检查是否有已暂存变更
has_staged=$(echo "$changes_raw" | jq -r '.has_staged')
if [ "$has_staged" != "true" ]; then
    echo "❌ 错误：没有已暂存的变更"
    cat > "$run_dir/changes-analysis.json" <<EOF
{
  "error": "no_staged_changes",
  "message": "没有已暂存的变更，请先使用 git add 暂存文件"
}
EOF
    exit 1
fi

# 提取已暂存文件
staged_files=$(echo "$changes_raw" | jq -r '.staged')
```

### Step 2: 分析变更类型

```bash
analyze_change_type() {
    local file_path="$1"
    local change_type="$2"  # added/modified/deleted
    local file_type="$3"

    # 根据变更类型初步判断
    case "$change_type" in
        added)
            # 新增文件通常是 feat
            echo "feat"
            ;;
        deleted)
            # 删除文件通常是 refactor 或 chore
            echo "refactor"
            ;;
        modified)
            # 修改文件需要更细粒度分析
            # 这里简化处理，根据文件类型判断
            case "$file_type" in
                markdown)
                    echo "docs"
                    ;;
                json|yaml)
                    echo "chore"
                    ;;
                test|spec)
                    echo "test"
                    ;;
                *)
                    # 默认为 feat（可以扩展为分析 diff 内容）
                    echo "feat"
                    ;;
            esac
            ;;
    esac
}
```

### Step 3: 提取作用域

```bash
# 作用域已在 change-collector 中识别，直接读取
scopes=$(echo "$staged_files" | jq -r '.[].scope' | sort -u | jq -R . | jq -s .)
primary_scope=$(echo "$scopes" | jq -r '.[0]')
```

### Step 4: 分析是否需要拆分

```bash
analyze_split_need() {
    local staged_files_json="$1"

    # 规则 1: 不同作用域的文件建议拆分
    unique_scopes=$(echo "$staged_files_json" | jq -r '.[].scope' | sort -u | wc -l)
    if [ "$unique_scopes" -gt 1 ]; then
        echo "true"
        return
    fi

    # 规则 2: 不同变更类型（feat + fix）建议拆分
    # 但 feat + style、feat + test 可以放一起
    types=$(echo "$staged_files_json" | jq -r '.[].type' | sort -u)
    has_feat=$(echo "$types" | grep -c "added" || true)
    has_fix=$(echo "$types" | grep -c "modified" || true)
    has_delete=$(echo "$types" | grep -c "deleted" || true)

    if [ "$has_feat" -gt 0 ] && [ "$has_delete" -gt 0 ]; then
        echo "true"
        return
    fi

    # 规则 3: 文件数超过 10 个，建议拆分
    file_count=$(echo "$staged_files_json" | jq 'length')
    if [ "$file_count" -gt 10 ]; then
        echo "true"
        return
    fi

    # 规则 4: 变更行数超过 300 行，建议拆分
    total_changes=$(jq -r '.diff_stat.insertions + .diff_stat.deletions' "$changes_raw_path")
    if [ "$total_changes" -gt 300 ]; then
        echo "true"
        return
    fi

    echo "false"
}

should_split=$(analyze_split_need "$staged_files")
```

### Step 5: 生成拆分建议（如需要）

```bash
generate_split_recommendation() {
    local staged_files_json="$1"

    # 按作用域分组
    scopes=$(echo "$staged_files_json" | jq -r '.[].scope' | sort -u)

    commits=()
    priority=1

    for scope in $scopes; do
        # 提取该作用域的文件
        scope_files=$(echo "$staged_files_json" | jq --arg scope "$scope" '[.[] | select(.scope == $scope)]')

        # 分析该组的主要类型
        primary_type=$(echo "$scope_files" | jq -r '.[].type' | sort | uniq -c | sort -rn | head -1 | awk '{print $2}')

        # 映射 change type 到 commit type
        case "$primary_type" in
            added) commit_type="feat" ;;
            modified) commit_type="fix" ;;
            deleted) commit_type="refactor" ;;
            *) commit_type="chore" ;;
        esac

        # 构建提交对象
        commit=$(jq -n \
            --arg type "$commit_type" \
            --arg scope "$scope" \
            --argjson files "$(echo "$scope_files" | jq '[.[].path]')" \
            --arg description "$(echo "$scope" | sed 's/^./\u&/') 相关变更" \
            --argjson priority "$priority" \
            '{type: $type, scope: $scope, files: $files, description: $description, priority: $priority}')

        commits+=("$commit")
        priority=$((priority + 1))
    done

    # 合并为 JSON 数组
    printf '%s\n' "${commits[@]}" | jq -s '.'
}

if [ "$should_split" = "true" ]; then
    split_commits=$(generate_split_recommendation "$staged_files")
    split_reason="包含多个独立作用域或功能，建议拆分提交"
else
    split_commits="null"
    split_reason="null"
fi
```

### Step 6: 确定提交策略

```bash
# 统计各类型文件数
files_by_type=$(echo "$staged_files" | jq 'group_by(.type) | map({(.[0].type): .}) | add')

# 确定主要类型（文件数最多的类型）
primary_type=$(echo "$staged_files" | jq -r '.[].type' | sort | uniq -c | sort -rn | head -1 | awk '{print $2}')

# 映射到 conventional commit type
case "$primary_type" in
    added) suggested_type="feat" ;;
    modified) suggested_type="fix" ;;
    deleted) suggested_type="refactor" ;;
    *) suggested_type="chore" ;;
esac

# 计算复杂度
file_count=$(echo "$staged_files" | jq 'length')
total_changes=$(jq -r '.diff_stat.insertions + .diff_stat.deletions' "$changes_raw_path")

if [ "$file_count" -le 3 ] && [ "$total_changes" -le 50 ]; then
    complexity="low"
    confidence="high"
elif [ "$file_count" -le 10 ] && [ "$total_changes" -le 300 ]; then
    complexity="medium"
    confidence="medium"
else
    complexity="high"
    confidence="low"
fi
```

### Step 7: 生成分析结果

```bash
cat > "$run_dir/changes-analysis.json" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "analyzed_files": $file_count,
  "primary_type": "$suggested_type",
  "primary_scope": "$primary_scope",
  "scopes": $scopes,
  "complexity": "$complexity",
  "should_split": $should_split,
  "split_recommendation": $([ "$should_split" = "true" ] && echo "{\"commits\": $split_commits, \"reason\": \"$split_reason\"}" || echo "null"),
  "commit_strategy": {
    "suggested_type": "$suggested_type",
    "suggested_scope": "$primary_scope",
    "confidence": "$confidence",
    "reason": "基于 $file_count 个文件的分析，主要类型为 $primary_type"
  },
  "files_by_type": $files_by_type
}
EOF
```

### Step 8: 返回分析结果

```bash
echo "📊 变更分析完成"
echo "   - 文件数: $file_count"
echo "   - 主要类型: $suggested_type"
echo "   - 主要作用域: $primary_scope"
echo "   - 复杂度: $complexity"
echo "   - 是否拆分: $([ "$should_split" = "true" ] && echo "是" || echo "否")"
echo "   - 输出: $run_dir/changes-analysis.json"
```

## 使用示例

### 示例 1: 单一功能提交

**输入** (`changes-raw.json`):

```json
{
  "staged": [
    {
      "status": "A",
      "path": "src/components/Button.tsx",
      "type": "added",
      "file_type": "tsx",
      "scope": "components"
    },
    {
      "status": "A",
      "path": "src/components/Button.test.tsx",
      "type": "added",
      "file_type": "tsx",
      "scope": "components"
    }
  ],
  "diff_stat": {
    "files_changed": 2,
    "insertions": 80,
    "deletions": 0
  }
}
```

**调用**:

```
Skill("committing:change-analyzer",
     args="run_dir=.claude/committing/runs/20260114T103000Z changes_raw_path=${RUN_DIR}/changes-raw.json")
```

**产出** (`changes-analysis.json`):

```json
{
  "timestamp": "2026-01-14T10:30:00Z",
  "analyzed_files": 2,
  "primary_type": "feat",
  "primary_scope": "components",
  "scopes": ["components"],
  "complexity": "low",
  "should_split": false,
  "split_recommendation": null,
  "commit_strategy": {
    "suggested_type": "feat",
    "suggested_scope": "components",
    "confidence": "high",
    "reason": "基于 2 个文件的分析，主要类型为 added"
  }
}
```

### 示例 2: 需要拆分的多功能提交

**输入** (`changes-raw.json`):

```json
{
  "staged": [
    {
      "path": "src/components/Button.tsx",
      "type": "added",
      "scope": "components"
    },
    {
      "path": "src/utils/helper.ts",
      "type": "modified",
      "scope": "utils"
    },
    {
      "path": "docs/README.md",
      "type": "modified",
      "scope": "docs"
    }
  ],
  "diff_stat": {
    "files_changed": 3,
    "insertions": 120,
    "deletions": 15
  }
}
```

**产出**:

```json
{
  "should_split": true,
  "split_recommendation": {
    "commits": [
      {
        "type": "feat",
        "scope": "components",
        "files": ["src/components/Button.tsx"],
        "description": "Components 相关变更",
        "priority": 1
      },
      {
        "type": "fix",
        "scope": "utils",
        "files": ["src/utils/helper.ts"],
        "description": "Utils 相关变更",
        "priority": 2
      },
      {
        "type": "docs",
        "scope": "docs",
        "files": ["docs/README.md"],
        "description": "Docs 相关变更",
        "priority": 3
      }
    ],
    "reason": "包含多个独立作用域或功能，建议拆分提交"
  }
}
```

### 示例 3: 快速分析模式

**调用**:

```
Skill("committing:change-analyzer",
     args="run_dir=${RUN_DIR} changes_raw_path=${RUN_DIR}/changes-raw.json analyze_depth=quick")
```

**行为**:

- 跳过拆分建议生成
- 仅输出基本类型和作用域
- 执行速度更快

## 错误处理

| 错误类型                | 返回值 | 说明                      |
| ----------------------- | ------ | ------------------------- |
| changes-raw.json 不存在 | exit 1 | 依赖文件缺失              |
| 无已暂存变更            | exit 1 | has_staged 为 false       |
| JSON 解析失败           | exit 1 | changes-raw.json 格式错误 |
| run_dir 不存在          | exit 1 | 输出目录未初始化          |

## 在 Orchestrator 中的使用

### Phase 2: 分析变更阶段

```yaml
### Phase 2: 分析变更

1. 读取 state.json 获取 run_dir
2. 读取 steps.change-collector.output 获取 changes-raw.json 路径
3. 调用 Skill("committing:change-analyzer",
            args="run_dir=${RUN_DIR} changes_raw_path=${CHANGES_RAW_PATH}")
4. 读取 changes-analysis.json
5. 检查 should_split:
   - true: 显示拆分建议，询问用户是否拆分
   - false: 继续下一阶段
6. 更新 state.json: steps.change-analyzer.status="done", output="${RUN_DIR}/changes-analysis.json"
```

### 拆分建议处理

```yaml
on_split_recommended:
  - 显示 split_recommendation.commits 列表
  - AskUserQuestion:
    1. 按建议拆分（默认）
    2. 忽略建议，单次提交
    3. 手动拆分（中止，让用户自己操作）
  - if 选择拆分:
      - 保存拆分计划到 state.json
      - 逐个执行拆分提交
```

## 拆分规则详解

| 规则            | 触发条件                     | 理由             |
| --------------- | ---------------------------- | ---------------- |
| 多作用域        | 涉及 2+ 个不同作用域         | 逻辑隔离         |
| 新增+删除混合   | 同时有 added 和 deleted 文件 | 可能是功能迁移   |
| 大变更集        | 文件数 > 10 或变更行数 > 300 | 降低 review 难度 |
| feat + fix 混合 | 同时有新功能和 bug 修复      | 避免混淆变更意图 |
| 不同文件类型    | 代码 + 文档 + 配置混合       | 按职责分离       |

## 技术细节

### 类型映射表

| Git Change Type | Commit Type | 说明      |
| --------------- | ----------- | --------- |
| added           | feat        | 新增功能  |
| modified        | fix         | 修复/改进 |
| deleted         | refactor    | 重构/移除 |
| renamed         | refactor    | 重构      |

### 复杂度评估

```
low: ≤3 文件 && ≤50 行变更
medium: ≤10 文件 && ≤300 行变更
high: >10 文件 || >300 行变更
```

### 置信度评估

```
high: 单一作用域 && 单一类型 && low 复杂度
medium: 单一作用域 || medium 复杂度
low: 多作用域 && high 复杂度
```

## 依赖

- **Bash**: 4.0+
- **jq**: JSON 处理
- **change-collector**: 依赖其输出的 changes-raw.json

## 限制

1. **不分析 diff 内容**: 当前仅基于文件路径和元数据分析
2. **类型推断简单**: 未深度分析代码变更语义
3. **作用域识别有限**: 仅基于路径，不理解业务逻辑
4. **拆分建议保守**: 倾向于提示拆分，避免漏过风险

## 未来扩展

1. **Diff 内容分析**: 使用 `_shared/content:diff-generator` 分析具体变更
2. **语义分析**: 识别函数/类名变更，判断是重构还是新功能
3. **依赖分析**: 检测文件间依赖关系，提供更智能的拆分建议
4. **历史学习**: 基于项目 commit 历史学习提交模式

## 参考

- 规范: `docs/orchestrator-contract.md` 第 3.2.3 节
- 状态文件: `skills/shared/workflow/STATE_FILE_V2.md`
- 映射表: `docs/orchestrator-to-skills-mapping.md` 第 90 行
- Conventional Commits: https://www.conventionalcommits.org/
