---
name: precheck-runner
description: |
  执行提交前的预检查（lint、build、test 等），验证代码质量。
  支持自定义检查列表和跳过模式。
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（如 .claude/committing/runs/20260114T103000Z）
  - name: skip
    type: boolean
    required: false
    default: false
    description: 是否跳过所有预检查（--no-verify 模式）
  - name: checks
    type: string
    required: false
    description: 要运行的检查列表，JSON 数组格式（如 '["lint","build"]'），不提供则使用默认配置
---

# precheck-runner - 提交预检查器

## 职责

在提交前执行代码质量检查：

1. 检测项目的包管理器（pnpm/npm/yarn）
2. 执行配置的检查命令（lint/build/test）
3. 记录检查结果到 `precheck-result.json`
4. 支持 `--no-verify` 跳过模式

## 输入

- `run_dir`: 运行目录（包含 state.json）
- `skip`: 是否跳过所有检查（默认 false）
- `checks`: 检查列表 JSON 数组（如 `["lint", "build"]`）

## 输出

输出到 `${run_dir}/precheck-result.json`:

```json
{
  "success": true,
  "skipped": false,
  "checks": [
    {
      "name": "lint",
      "command": "pnpm lint",
      "passed": true,
      "duration_ms": 1234,
      "output": "..."
    },
    {
      "name": "build",
      "command": "pnpm build",
      "passed": true,
      "duration_ms": 5678,
      "output": "..."
    }
  ],
  "summary": {
    "total": 2,
    "passed": 2,
    "failed": 0
  }
}
```

跳过模式输出：

```json
{
  "success": true,
  "skipped": true,
  "reason": "--no-verify 模式",
  "checks": []
}
```

## 执行逻辑

### Step 1: 检查跳过模式

```bash
if [ "$skip" = "true" ]; then
    cat > "$run_dir/precheck-result.json" <<EOF
{
  "success": true,
  "skipped": true,
  "reason": "--no-verify 模式",
  "checks": []
}
EOF
    echo "⏭️  跳过预检查（--no-verify 模式）"
    exit 0
fi
```

### Step 2: 检测包管理器

```bash
if [ -f "pnpm-lock.yaml" ]; then
    PKG_MANAGER="pnpm"
elif [ -f "yarn.lock" ]; then
    PKG_MANAGER="yarn"
elif [ -f "package-lock.json" ]; then
    PKG_MANAGER="npm"
else
    # 非 Node.js 项目，跳过
    cat > "$run_dir/precheck-result.json" <<EOF
{
  "success": true,
  "skipped": true,
  "reason": "非 Node.js 项目",
  "checks": []
}
EOF
    exit 0
fi
```

### Step 3: 确定检查列表

```bash
if [ -n "$checks" ]; then
    # 使用用户指定的检查列表
    CHECKS_ARRAY=$(echo "$checks" | jq -r '.[]')
else
    # 默认检查列表：读取 package.json 中的可用脚本
    CHECKS_ARRAY=$(jq -r '.scripts | keys[] | select(. == "lint" or . == "build" or . == "test")' package.json)
fi
```

### Step 4: 执行检查

```bash
results=()
for check in $CHECKS_ARRAY; do
    echo "🔍 运行检查: $check"

    start_time=$(date +%s%3N)
    command="$PKG_MANAGER $check"

    if output=$($command 2>&1); then
        passed=true
        duration=$(($(date +%s%3N) - start_time))
        echo "✅ $check 通过（${duration}ms）"
    else
        passed=false
        duration=$(($(date +%s%3N) - start_time))
        echo "❌ $check 失败（${duration}ms）"
    fi

    # 构建结果对象
    result=$(jq -n \
        --arg name "$check" \
        --arg command "$command" \
        --argjson passed "$passed" \
        --argjson duration "$duration" \
        --arg output "$output" \
        '{name: $name, command: $command, passed: $passed, duration_ms: $duration, output: $output}')

    results+=("$result")
done
```

### Step 5: 生成汇总结果

```bash
# 合并所有检查结果
checks_json=$(printf '%s\n' "${results[@]}" | jq -s '.')

# 计算统计信息
total=$(echo "$checks_json" | jq 'length')
passed=$(echo "$checks_json" | jq '[.[] | select(.passed == true)] | length')
failed=$(echo "$checks_json" | jq '[.[] | select(.passed == false)] | length')

# 判断整体成功
if [ "$failed" -eq 0 ]; then
    success=true
else
    success=false
fi

# 写入结果文件
cat > "$run_dir/precheck-result.json" <<EOF
{
  "success": $success,
  "skipped": false,
  "checks": $checks_json,
  "summary": {
    "total": $total,
    "passed": $passed,
    "failed": $failed
  }
}
EOF
```

### Step 6: 返回执行状态

```bash
if [ "$success" = "true" ]; then
    echo "✅ 所有预检查通过"
    exit 0
else
    echo "❌ 预检查失败：$failed 个检查未通过"
    exit 1
fi
```

## 使用示例

### 示例 1: 标准预检查

**调用**:

```
Skill("committing:precheck-runner",
     args="run_dir=.claude/committing/runs/20260114T103000Z")
```

**行为**:

1. 检测到 `pnpm-lock.yaml` → 使用 pnpm
2. 读取 `package.json` scripts → 发现 lint, build
3. 执行 `pnpm lint` ✅
4. 执行 `pnpm build` ✅
5. 写入 `precheck-result.json`

### 示例 2: 自定义检查列表

**调用**:

```
Skill("committing:precheck-runner",
     args='run_dir=.claude/committing/runs/20260114T103000Z checks=["lint","typecheck"]')
```

**行为**:

- 仅运行 `pnpm lint` 和 `pnpm typecheck`
- 跳过 build 和 test

### 示例 3: 跳过预检查

**调用**:

```
Skill("committing:precheck-runner",
     args="run_dir=.claude/committing/runs/20260114T103000Z skip=true")
```

**产出**:

```json
{
  "success": true,
  "skipped": true,
  "reason": "--no-verify 模式",
  "checks": []
}
```

### 示例 4: 非 Node.js 项目

**调用**:

```
Skill("committing:precheck-runner",
     args="run_dir=.claude/committing/runs/20260114T103000Z")
```

**行为**:

- 未找到 lock 文件 → 跳过
- 写入 `skipped: true, reason: "非 Node.js 项目"`

## 错误处理

| 错误类型          | 返回值               | 说明                        |
| ----------------- | -------------------- | --------------------------- |
| run_dir 不存在    | exit 1               | 运行目录未初始化            |
| package.json 无效 | exit 1               | JSON 解析失败               |
| 检查命令不存在    | 跳过该检查，继续执行 | 如 package.json 无该 script |
| 检查失败          | success: false       | 记录失败但不退出            |
| 部分检查失败      | success: false       | failed > 0                  |

## 在 Orchestrator 中的使用

### Phase 0: 预检查阶段

```yaml
### Phase 0: 预检查

1. 读取 state.json 获取 run_dir
2. 读取用户选项（是否 --no-verify）
3. 调用 Skill("committing:precheck-runner", args="run_dir=${RUN_DIR} skip=${SKIP}")
4. 读取 precheck-result.json
5. if success == false:
     - 更新 state.json: current_phase="precheck", steps.precheck.status="failed"
     - 输出失败的检查详情
     - AskUserQuestion: 是否忽略失败继续提交？
   else:
     - 更新 state.json: steps.precheck.status="done"
     - 继续下一阶段
```

### 错误恢复策略

```yaml
on_precheck_failed:
  - 显示失败的检查和输出
  - 提供选项：
    1. 中止提交（默认）
    2. 跳过预检查继续（高风险）
    3. 仅重新运行失败的检查
```

## 配置文件支持（未来扩展）

可以支持 `.claude/committing.local.md` 配置：

```yaml
---
precheck:
  enabled: true
  checks:
    - lint
    - build
  timeout_seconds: 300
  fail_fast: false # 是否在第一个失败时停止
---
```

**读取逻辑**:

```bash
config_file=".claude/committing.local.md"
if [ -f "$config_file" ]; then
    checks=$(sed -n '/^---$/,/^---$/p' "$config_file" | yq e '.precheck.checks' -)
fi
```

## 技术细节

### 包管理器检测优先级

| 文件                | 包管理器 | 优先级 |
| ------------------- | -------- | ------ |
| `pnpm-lock.yaml`    | pnpm     | 1      |
| `yarn.lock`         | yarn     | 2      |
| `package-lock.json` | npm      | 3      |

### 检查命令格式

```bash
# 标准格式
$PKG_MANAGER $check

# 示例
pnpm lint
npm run build
yarn test
```

### 超时控制（未来）

```bash
# 使用 timeout 命令
timeout 300 $command
```

## 依赖

- **Bash**: 4.0+
- **jq**: JSON 处理
- **包管理器**: pnpm/npm/yarn（项目依赖）

## 限制

1. **仅支持 Node.js 项目**: 需要 package.json 和 lock 文件
2. **同步执行**: 检查串行执行，不支持并行
3. **无超时控制**: 当前版本不限制单个检查的执行时间
4. **输出截断**: 检查输出可能很长，建议限制长度

## 参考

- 规范: `docs/orchestrator-contract.md` 第 3.2.1 节
- 状态文件: `skills/shared/workflow/STATE_FILE_V2.md`
- 映射表: `docs/orchestrator-to-skills-mapping.md` 第 88 行
- 模板: `skills/shared/workflow/ORCHESTRATOR_TEMPLATE.md`
