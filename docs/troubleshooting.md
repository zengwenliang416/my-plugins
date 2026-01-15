# 并行执行故障排查指南

## 概述

本文档提供并行执行系统常见问题的诊断和解决方案，帮助快速定位和修复故障。

## 快速诊断清单

当遇到问题时，按以下顺序检查：

```bash
# 1. 检查全局活跃任务数
for f in .claude/*/*.local.md; do
  active=$(yq eval '.parallel_execution.active_tasks' "$f" 2>/dev/null)
  [ "$active" -gt 0 ] && echo "$f: $active 活跃"
done

# 2. 检查失败任务
for f in .claude/*/*.local.md; do
  failed=$(yq eval '.parallel_execution.failed_tasks' "$f" 2>/dev/null)
  [ "$failed" -gt 0 ] && echo "$f: $failed 失败"
done

# 3. 检查最近的失败日志
ls -lt .claude/logs/failure-*.log 2>/dev/null | head -5

# 4. 验证状态文件格式
for f in .claude/*/*.local.md; do
  yq eval '.' "$f" > /dev/null 2>&1 || echo "❌ $f 格式错误"
done

# 5. 检查孤儿任务（运行中但无对应 orchestrator）
claude task list | grep -E "codex|gemini"
```

## 常见问题分类

### 1. 后台任务启动失败

#### 症状

```
❌ 错误: 无法启动后台任务
Error: Failed to spawn background process
```

#### 原因分析

1. **并发槽位已满**（最常见）
   - 系统最多支持 8 个并发任务
   - 其他 orchestrators 正在运行

2. **codeagent-wrapper 不可用**
   - 二进制文件缺失或权限错误
   - 路径配置错误

3. **环境变量缺失**
   - `CLAUDE_PLUGIN_ROOT` 未设置
   - `CODEX_MODEL` 或 `GEMINI_MODEL` 配置错误

#### 解决方案

**步骤 1: 检查并发槽位**

```bash
# 统计全局活跃任务
total_active=0
for f in .claude/*/*.local.md; do
  active=$(yq eval '.parallel_execution.active_tasks' "$f" 2>/dev/null || echo 0)
  total_active=$((total_active + active))
done

echo "全局活跃任务: $total_active / 8"

if [ "$total_active" -ge 8 ]; then
  echo "⚠️ 并发槽位已满，等待其他任务完成"
  # 查看哪些任务正在运行
  for f in .claude/*/*.local.md; do
    domain=$(yq eval '.domain' "$f")
    active=$(yq eval '.parallel_execution.active_tasks' "$f")
    [ "$active" -gt 0 ] && echo "  $domain: $active 活跃"
  done
fi
```

**步骤 2: 验证 codeagent-wrapper**

```bash
# 检查二进制文件
ls -lh "${CLAUDE_PLUGIN_ROOT}/src/codeagent-wrapper/codeagent-wrapper"

# 检查执行权限
[ -x "${CLAUDE_PLUGIN_ROOT}/src/codeagent-wrapper/codeagent-wrapper" ] \
  && echo "✅ 可执行" \
  || echo "❌ 无执行权限"

# 修复权限（如需要）
chmod +x "${CLAUDE_PLUGIN_ROOT}/src/codeagent-wrapper/codeagent-wrapper"
```

**步骤 3: 检查环境变量**

```bash
# 验证必需的环境变量
echo "CLAUDE_PLUGIN_ROOT: ${CLAUDE_PLUGIN_ROOT:-未设置}"
echo "CODEX_MODEL: ${CODEX_MODEL:-未设置}"
echo "GEMINI_MODEL: ${GEMINI_MODEL:-未设置}"

# 如果未设置，添加到 ~/.bashrc 或 ~/.zshrc
export CLAUDE_PLUGIN_ROOT="$HOME/.claude"
export CODEX_MODEL="gpt-4"
export GEMINI_MODEL="gemini-pro"
```

**步骤 4: 手动测试**

```bash
# 测试 Codex 调用
"${CLAUDE_PLUGIN_ROOT}/src/codeagent-wrapper/codeagent-wrapper" \
  --backend codex \
  --prompt "hello" \
  --output /tmp/test-codex.md

# 检查输出
cat /tmp/test-codex.md
```

---

### 2. 任务长时间无响应

#### 症状

```
🔄 运行中 (5m 30s) → 10m → 20m → ...
任务状态一直是 running，但没有进展
```

#### 原因分析

1. **外部 API 超时**
   - Codex/Gemini API 响应慢或无响应
   - 网络连接问题

2. **任务卡在某个步骤**
   - Prompt 过于复杂，模型思考时间长
   - 输出文件写入阻塞

3. **进程僵死**
   - codeagent-wrapper 进程异常退出
   - 但状态文件未更新

#### 解决方案

**步骤 1: 检查任务输出**

```bash
# 方法 1: 使用 claude 命令
claude task output task_abc123

# 方法 2: 检查后台任务列表
claude task list

# 方法 3: 直接读取输出文件
cat .claude/developing/analysis-codex.md
# 如果文件为空或只有部分内容，说明任务还在执行
```

**步骤 2: 查找进程**

```bash
# 查找 codeagent-wrapper 进程
ps aux | grep codeagent-wrapper

# 输出示例:
# user  12345  0.5  1.2  /path/to/codeagent-wrapper --backend codex ...

# 如果没有对应进程，说明进程已退出但状态未更新
```

**步骤 3: 终止僵死任务**

```bash
# 查找 task_id
task_id=$(yq eval '.subtasks[] | select(.status == "running") | .task_id' .claude/developing.local.md)

# 尝试获取任务输出（非阻塞）
claude task output "$task_id" --no-wait

# 如果任务已失效，手动标记为失败
yq eval -i ".subtasks[] |= (select(.task_id == \"$task_id\") | .status = \"failed\" | .error = \"Task timeout or process died\")" .claude/developing.local.md
yq eval -i '.parallel_execution.active_tasks -= 1' .claude/developing.local.md
yq eval -i '.parallel_execution.failed_tasks += 1' .claude/developing.local.md
```

**步骤 4: 记录失败日志**

```bash
# 手动记录失败
cat > .claude/logs/failure-$(date +%Y%m%d-%H%M%S).log << EOF
timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)
workflow: developing
phase: feature_analysis
task_id: $task_id
backend: codex
error: |
  Task unresponsive for > 20 minutes
  No process found, likely crashed or timed out
EOF
```

---

### 3. SESSION_ID 提取失败

#### 症状

```
⚠️ 警告: 无法提取 SESSION_ID
sessions.codex.current: null
```

#### 原因分析

1. **输出格式不符合约定**
   - 外部模型未在第一行返回 `SESSION_ID: xxx`
   - 格式错误（如 `SessionID:` 或 `SESSION_ID=`）

2. **输出文件为空**
   - 任务失败但未报错
   - 文件写入权限问题

3. **正则表达式错误**
   - 提取脚本使用的正则不匹配实际格式

#### 解决方案

**步骤 1: 检查输出文件内容**

```bash
# 查看前 5 行
head -5 .claude/developing/analysis-codex.md

# 预期格式:
# SESSION_ID: session_abc123
#
# 分析结果:
# ...
```

**步骤 2: 验证提取逻辑**

```bash
# 测试正则表达式
SESSION_ID=$(head -1 .claude/developing/analysis-codex.md | grep -oP 'SESSION_ID: \K\S+')

if [ -z "$SESSION_ID" ]; then
  echo "❌ 提取失败"
  echo "第一行内容:"
  head -1 .claude/developing/analysis-codex.md
else
  echo "✅ 提取成功: $SESSION_ID"
fi
```

**步骤 3: 手动修复**

```bash
# 如果格式错误但有 session_id，手动提取
# 例如: "SessionID: abc123" 或 "session_id=abc123"

# 手动设置到状态文件
yq eval -i '.sessions.codex.current = "session_abc123"' .claude/developing.local.md
yq eval -i '.sessions.codex.history += ["session_abc123"]' .claude/developing.local.md
```

**步骤 4: 更新 prompt 模板**

如果外部模型持续返回错误格式，更新 prompt 明确要求：

```yaml
parallel_tasks:
  - id: codex-analysis
    prompt: |
      **重要**: 输出的第一行必须是: SESSION_ID: <your_session_id>

      分析以下需求:
      ${REQUIREMENT}
```

---

### 4. 状态文件损坏

#### 症状

```
Error parsing YAML: mapping values are not allowed here
  at line 45, column 10
```

#### 原因分析

1. **手动编辑错误**
   - 直接编辑状态文件时破坏了 YAML 语法
   - 缩进错误、引号不匹配

2. **并发写入冲突**
   - 多个进程同时修改状态文件
   - 文件锁机制失效

3. **部分写入**
   - 进程崩溃时正在写入
   - 磁盘空间不足导致写入中断

#### 解决方案

**步骤 1: 验证 YAML 语法**

```bash
# 使用 yq 验证
yq eval '.' .claude/developing.local.md > /dev/null

# 如果报错，查看具体位置
yq eval '.' .claude/developing.local.md 2>&1 | head -10
```

**步骤 2: 从备份恢复**

```bash
# 查找备份（如果有）
ls -lt .claude/developing.local.md.bak* 2>/dev/null

# 恢复最近的备份
cp .claude/developing.local.md.bak.1 .claude/developing.local.md

# 验证恢复后的文件
yq eval '.' .claude/developing.local.md > /dev/null && echo "✅ 恢复成功"
```

**步骤 3: 重建状态文件**

如果没有备份，重建最小可用状态：

```bash
cat > .claude/developing.local.md << 'EOF'
---
workflow_version: "2.0"
domain: "developing"
workflow_id: "dev-recovery-20260113-143000"
goal: "恢复工作流"
created_at: "2026-01-13T14:30:00Z"
updated_at: "2026-01-13T14:30:00Z"
current_phase: "init"

parallel_execution:
  max_concurrency: 8
  active_tasks: 0
  completed_tasks: 0
  failed_tasks: 0

sessions:
  codex:
    current: null
    history: []
  gemini:
    current: null
    history: []

subtasks: []

artifacts:
  requirement: null
  analysis_codex: null
  analysis_gemini: null
  implementation_plan: null
  code_codex: null
  code_gemini: null
  final_code: null
  test_report: null

checkpoint:
  last_successful_phase: null
  pending_review: false
---

# 工作流内容
## Phase 1: Init
工作流已重建，请重新开始。
EOF

# 验证
yq eval '.' .claude/developing.local.md > /dev/null && echo "✅ 重建成功"
```

**步骤 4: 启用自动备份**

```bash
# 创建备份脚本
cat > "${CLAUDE_PLUGIN_ROOT}/scripts/ops/backup-states.sh" << 'EOF'
#!/bin/bash
# 自动备份所有状态文件

BACKUP_DIR=".claude/backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

for state_file in .claude/*/*.local.md; do
  if [ -f "$state_file" ]; then
    cp "$state_file" "$BACKUP_DIR/$(basename $state_file).$(date +%H%M%S)"
  fi
done

echo "✅ 状态文件已备份到 $BACKUP_DIR"

# 清理 7 天前的备份
find .claude/backups/ -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null
EOF

chmod +x "${CLAUDE_PLUGIN_ROOT}/scripts/ops/backup-states.sh"

# 添加到 crontab（每小时备份）
(crontab -l 2>/dev/null; echo "0 * * * * ${CLAUDE_PLUGIN_ROOT}/scripts/ops/backup-states.sh") | crontab -
```

---

### 5. 输出文件缺失

#### 症状

```
❌ 错误: 输出文件不存在
Expected: .claude/developing/analysis-codex.md
```

#### 原因分析

1. **任务失败未创建文件**
   - 外部模型调用失败
   - 但状态标记为 `completed`

2. **路径配置错误**
   - YAML 中的 `output` 路径错误
   - 变量替换失败

3. **权限问题**
   - 目录不存在
   - 写入权限不足

#### 解决方案

**步骤 1: 检查目录结构**

```bash
# 验证输出目录存在
ls -la .claude/developing/

# 如果不存在，创建
mkdir -p .claude/developing/
```

**步骤 2: 检查任务实际输出**

```bash
# 查看后台任务的标准输出/错误
claude task output task_abc123 --full

# 查找可能的错误信息
grep -i "error\|failed\|permission denied" <<< "$(claude task output task_abc123 --full)"
```

**步骤 3: 验证 YAML 配置**

```yaml
# 检查 .claude/developing.local.md 中的 parallel_tasks
parallel_tasks:
  - id: codex-feature-analysis
    backend: codex
    output: .claude/developing/analysis-codex.md # ← 确认路径正确
```

**步骤 4: 手动创建占位文件**

如果任务确实失败但需要继续流程：

```bash
# 创建占位输出
cat > .claude/developing/analysis-codex.md << 'EOF'
SESSION_ID: session_placeholder

❌ 此文件为占位符，原任务失败未生成输出。

失败原因: [手动填写]

建议操作: [手动填写]
EOF

# 更新状态为失败
yq eval -i '.subtasks[0].status = "failed"' .claude/developing.local.md
yq eval -i '.subtasks[0].error = "Task failed to produce output"' .claude/developing.local.md
```

---

### 6. 并行任务结果不一致

#### 症状

```
Codex 说: 使用 REST API
Gemini 说: 使用 GraphQL API

合并时无法决定使用哪个方案
```

#### 原因分析

1. **prompt 模糊或矛盾**
   - 两个模型理解的任务目标不同
   - Prompt 未明确约束

2. **角色分工不清**
   - Codex 和 Gemini 分析了相同的内容
   - 应该互补而非重复

3. **上下文不足**
   - 缺少必要的背景信息
   - 模型基于不同假设

#### 解决方案

**步骤 1: 比较输出差异**

```bash
# 并排查看两个输出
diff -y .claude/developing/analysis-codex.md .claude/developing/analysis-gemini.md | less

# 或使用更友好的工具
code --diff .claude/developing/analysis-codex.md .claude/developing/analysis-gemini.md
```

**步骤 2: 明确角色分工**

修改 prompt 使分工更清晰：

```yaml
# ❌ 错误：两个模型做相同的事
parallel_tasks:
  - id: codex-analysis
    prompt: "分析需求并提出技术方案"

  - id: gemini-analysis
    prompt: "分析需求并提出技术方案"  # ← 重复！

# ✅ 正确：各司其职
parallel_tasks:
  - id: codex-backend-analysis
    prompt: |
      【后端技术专家】
      分析以下需求的后端实现方案：
      ${REQUIREMENT}

      **只关注**: API 设计、数据库、认证、性能

  - id: gemini-frontend-analysis
    prompt: |
      【前端 UX 专家】
      分析以下需求的前端实现方案：
      ${REQUIREMENT}

      **只关注**: UI 组件、交互流程、响应式布局、可访问性
```

**步骤 3: 增加约束**

```yaml
parallel_tasks:
  - id: codex-backend-analysis
    prompt: |
      **技术约束**:
      - 必须使用现有的 Express.js 框架
      - 数据库限定为 PostgreSQL
      - 认证方式: JWT

      在此约束下分析后端实现方案。
```

**步骤 4: 人工仲裁**

如果输出仍然冲突，orchestrator 应暂停并询问用户：

```typescript
// 检测冲突
if (codexOutput.includes("REST") && geminiOutput.includes("GraphQL")) {
  // 暂停并询问用户
  await AskUserQuestion({
    questions: [
      {
        question: "发现技术方案冲突，请选择：",
        header: "API 风格",
        options: [
          { label: "REST API", description: "Codex 推荐，成熟稳定" },
          { label: "GraphQL API", description: "Gemini 推荐，灵活高效" },
          { label: "混合方案", description: "部分使用 REST，部分使用 GraphQL" },
        ],
        multiSelect: false,
      },
    ],
  });
}
```

---

### 7. 进度显示异常

#### 症状

```
🔄 并行执行中
活跃: -1 / 2  ← 负数！
完成: 3
失败: 0
```

#### 原因分析

1. **状态更新不一致**
   - 更新了 `subtasks[].status` 但未同步 `parallel_execution` 统计
   - 多次减少 `active_tasks`

2. **并发更新冲突**
   - 两个进程同时修改状态文件
   - 后者覆盖了前者的更新

#### 解决方案

**步骤 1: 重新计算统计**

```bash
# 从 subtasks 数组重新计算
state_file=".claude/developing.local.md"

active=$(yq eval '[.subtasks[] | select(.status == "running")] | length' "$state_file")
completed=$(yq eval '[.subtasks[] | select(.status == "completed")] | length' "$state_file")
failed=$(yq eval '[.subtasks[] | select(.status == "failed")] | length' "$state_file")

# 更新统计
yq eval -i ".parallel_execution.active_tasks = $active" "$state_file"
yq eval -i ".parallel_execution.completed_tasks = $completed" "$state_file"
yq eval -i ".parallel_execution.failed_tasks = $failed" "$state_file"

echo "✅ 统计已修复: 活跃 $active | 完成 $completed | 失败 $failed"
```

**步骤 2: 验证一致性**

创建验证脚本：

```bash
#!/bin/bash
# scripts/ops/validate-state-consistency.sh

state_file="$1"

if [ ! -f "$state_file" ]; then
  echo "❌ 状态文件不存在: $state_file"
  exit 1
fi

# 从字段读取
declared_active=$(yq eval '.parallel_execution.active_tasks' "$state_file")
declared_completed=$(yq eval '.parallel_execution.completed_tasks' "$state_file")
declared_failed=$(yq eval '.parallel_execution.failed_tasks' "$state_file")

# 从数组计算
actual_active=$(yq eval '[.subtasks[] | select(.status == "running")] | length' "$state_file")
actual_completed=$(yq eval '[.subtasks[] | select(.status == "completed")] | length' "$state_file")
actual_failed=$(yq eval '[.subtasks[] | select(.status == "failed")] | length' "$state_file")

# 比较
inconsistent=false

if [ "$declared_active" -ne "$actual_active" ]; then
  echo "⚠️ active_tasks 不一致: 声明 $declared_active, 实际 $actual_active"
  inconsistent=true
fi

if [ "$declared_completed" -ne "$actual_completed" ]; then
  echo "⚠️ completed_tasks 不一致: 声明 $declared_completed, 实际 $actual_completed"
  inconsistent=true
fi

if [ "$declared_failed" -ne "$actual_failed" ]; then
  echo "⚠️ failed_tasks 不一致: 声明 $declared_failed, 实际 $actual_failed"
  inconsistent=true
fi

if [ "$inconsistent" = true ]; then
  echo ""
  echo "建议运行修复脚本:"
  echo "  yq eval -i \".parallel_execution.active_tasks = $actual_active\" \"$state_file\""
  echo "  yq eval -i \".parallel_execution.completed_tasks = $actual_completed\" \"$state_file\""
  echo "  yq eval -i \".parallel_execution.failed_tasks = $actual_failed\" \"$state_file\""
  exit 1
else
  echo "✅ 状态一致性验证通过"
  exit 0
fi
```

**步骤 3: 自动修复**

将验证和修复集成到 orchestrator 启动流程：

```typescript
// orchestrator 启动时自动验证
async function validateAndFixState(stateFile: string) {
  const result = await Bash({
    command: `${CLAUDE_PLUGIN_ROOT}/scripts/ops/validate-state-consistency.sh "${stateFile}"`,
    description: "验证状态文件一致性",
  });

  if (result.exit_code !== 0) {
    console.log("⚠️ 发现状态不一致，自动修复...");
    await Bash({
      command: `${CLAUDE_PLUGIN_ROOT}/scripts/ops/fix-state-consistency.sh "${stateFile}"`,
      description: "修复状态文件一致性",
    });
  }
}
```

---

### 8. 孤儿任务清理

#### 症状

```
claude task list 显示有 5 个任务在运行
但所有状态文件的 active_tasks 都是 0
```

#### 原因分析

1. **orchestrator 崩溃**
   - 后台任务仍在运行
   - 但状态文件未更新

2. **手动终止**
   - 用户 Ctrl+C 终止 orchestrator
   - 后台任务未被清理

3. **状态文件丢失**
   - 删除或损坏了状态文件
   - 但后台任务仍在系统中

#### 解决方案

**步骤 1: 识别孤儿任务**

```bash
#!/bin/bash
# scripts/ops/find-orphan-tasks.sh

echo "查找孤儿任务..."
echo ""

# 从状态文件收集所有 task_id
declared_tasks=$(
  for f in .claude/*/*.local.md; do
    yq eval '.subtasks[].task_id' "$f" 2>/dev/null
  done | sort -u
)

# 从 Claude Code 获取实际运行的任务
actual_tasks=$(
  claude task list | grep -oP 'task_[a-zA-Z0-9]+' | sort -u
)

# 找出差异
orphan_tasks=$(comm -13 <(echo "$declared_tasks") <(echo "$actual_tasks"))

if [ -z "$orphan_tasks" ]; then
  echo "✅ 未发现孤儿任务"
else
  echo "⚠️ 发现以下孤儿任务:"
  echo "$orphan_tasks"
fi
```

**步骤 2: 清理孤儿任务**

```bash
#!/bin/bash
# scripts/ops/cleanup-orphans.sh

orphans=$(${CLAUDE_PLUGIN_ROOT}/scripts/ops/find-orphan-tasks.sh | grep -oP 'task_[a-zA-Z0-9]+')

if [ -z "$orphans" ]; then
  echo "✅ 无需清理"
  exit 0
fi

echo "准备清理 $(echo "$orphans" | wc -l) 个孤儿任务"
echo ""

for task_id in $orphans; do
  echo "清理 $task_id ..."

  # 尝试获取任务信息（不阻塞）
  claude task output "$task_id" --no-wait > "/tmp/orphan-$task_id.log" 2>&1

  # 终止任务（如果仍在运行）
  # 注意: Claude Code 可能没有直接的 kill 命令，需要通过系统命令
  ps aux | grep "$task_id" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null

  echo "  ✅ 已清理"
done

echo ""
echo "清理完成，日志保存到 /tmp/orphan-*.log"
```

**步骤 3: 定期清理**

```bash
# 添加到 crontab（每天凌晨 3 点清理）
(crontab -l 2>/dev/null; echo "0 3 * * * ${CLAUDE_PLUGIN_ROOT}/scripts/ops/cleanup-orphans.sh") | crontab -
```

---

## 运维工具

### 健康检查脚本

```bash
#!/bin/bash
# scripts/ops/health-check.sh

echo "=========================================="
echo " 并行执行系统健康检查"
echo "=========================================="
echo ""

# 1. 检查全局并发度
echo "【1】全局并发度检查"
total_active=0
for f in .claude/*/*.local.md; do
  active=$(yq eval '.parallel_execution.active_tasks' "$f" 2>/dev/null || echo 0)
  total_active=$((total_active + active))
done
echo "  活跃任务: $total_active / 8"
[ "$total_active" -le 8 ] && echo "  ✅ 正常" || echo "  ⚠️ 超过限制"
echo ""

# 2. 检查失败任务
echo "【2】失败任务检查"
total_failed=0
for f in .claude/*/*.local.md; do
  failed=$(yq eval '.parallel_execution.failed_tasks' "$f" 2>/dev/null || echo 0)
  if [ "$failed" -gt 0 ]; then
    domain=$(yq eval '.domain' "$f")
    echo "  ⚠️ $domain: $failed 失败"
    total_failed=$((total_failed + failed))
  fi
done
[ "$total_failed" -eq 0 ] && echo "  ✅ 无失败任务" || echo "  ⚠️ 总计 $total_failed 个失败"
echo ""

# 3. 检查状态文件格式
echo "【3】状态文件格式检查"
invalid_count=0
for f in .claude/*/*.local.md; do
  yq eval '.' "$f" > /dev/null 2>&1 || {
    echo "  ❌ $f 格式错误"
    invalid_count=$((invalid_count + 1))
  }
done
[ "$invalid_count" -eq 0 ] && echo "  ✅ 所有状态文件格式正确" || echo "  ❌ $invalid_count 个文件格式错误"
echo ""

# 4. 检查孤儿任务
echo "【4】孤儿任务检查"
orphan_count=$(${CLAUDE_PLUGIN_ROOT}/scripts/ops/find-orphan-tasks.sh | grep -c 'task_')
[ "$orphan_count" -eq 0 ] && echo "  ✅ 无孤儿任务" || echo "  ⚠️ 发现 $orphan_count 个孤儿任务"
echo ""

# 5. 检查磁盘空间
echo "【5】磁盘空间检查"
used=$(df -h .claude | tail -1 | awk '{print $5}' | tr -d '%')
echo "  .claude/ 所在分区使用率: ${used}%"
[ "$used" -lt 90 ] && echo "  ✅ 正常" || echo "  ⚠️ 空间不足"
echo ""

# 6. 检查日志大小
echo "【6】日志大小检查"
log_size=$(du -sh .claude/logs/ 2>/dev/null | awk '{print $1}')
echo "  日志目录大小: ${log_size:-0}"
echo "  ✅ 正常"
echo ""

# 总结
echo "=========================================="
echo " 健康检查完成"
echo "=========================================="
```

### 任务状态查询脚本

```bash
#!/bin/bash
# scripts/ops/task-status.sh

echo "=========================================="
echo " 并行任务状态总览"
echo "=========================================="
echo ""

for state_file in .claude/*/*.local.md; do
  if [ ! -f "$state_file" ]; then
    continue
  fi

  domain=$(yq eval '.domain' "$state_file")
  workflow_id=$(yq eval '.workflow_id' "$state_file")
  current_phase=$(yq eval '.current_phase' "$state_file")

  active=$(yq eval '.parallel_execution.active_tasks' "$state_file")
  completed=$(yq eval '.parallel_execution.completed_tasks' "$state_file")
  failed=$(yq eval '.parallel_execution.failed_tasks' "$state_file")

  # 只显示有活动的工作流
  if [ "$active" -gt 0 ] || [ "$completed" -gt 0 ] || [ "$failed" -gt 0 ]; then
    echo "[$domain] $workflow_id"
    echo "  阶段: $current_phase"
    echo "  任务: 活跃 $active | 完成 $completed | 失败 $failed"

    # 列出活跃任务详情
    if [ "$active" -gt 0 ]; then
      echo "  活跃任务:"
      yq eval '.subtasks[] | select(.status == "running") | "    - " + .id + " (" + .backend + ", " + .task_id + ")"' "$state_file"
    fi

    # 列出失败任务详情
    if [ "$failed" -gt 0 ]; then
      echo "  失败任务:"
      yq eval '.subtasks[] | select(.status == "failed") | "    - " + .id + ": " + .error' "$state_file"
    fi

    echo ""
  fi
done

echo "=========================================="
```

### 状态文件修复脚本

```bash
#!/bin/bash
# scripts/ops/fix-state-consistency.sh

state_file="$1"

if [ ! -f "$state_file" ]; then
  echo "❌ 状态文件不存在: $state_file"
  exit 1
fi

echo "修复状态文件: $state_file"

# 从 subtasks 重新计算
active=$(yq eval '[.subtasks[] | select(.status == "running")] | length' "$state_file")
completed=$(yq eval '[.subtasks[] | select(.status == "completed")] | length' "$state_file")
failed=$(yq eval '[.subtasks[] | select(.status == "failed")] | length' "$state_file")

# 更新
yq eval -i ".parallel_execution.active_tasks = $active" "$state_file"
yq eval -i ".parallel_execution.completed_tasks = $completed" "$state_file"
yq eval -i ".parallel_execution.failed_tasks = $failed" "$state_file"

# 更新时间戳
yq eval -i ".updated_at = \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"" "$state_file"

echo "✅ 修复完成: 活跃 $active | 完成 $completed | 失败 $failed"
```

---

## 调试模式

### 启用详细日志

```bash
# 设置环境变量启用调试
export CLAUDE_DEBUG=1
export PARALLEL_DEBUG=1

# 运行 orchestrator
/ccg:dev "测试功能"

# 查看详细日志
tail -f .claude/logs/debug-$(date +%Y%m%d).log
```

### 模拟模式

```bash
# 不调用真实外部模型，使用 mock 输出
export CODEX_MOCK=1
export GEMINI_MOCK=1

# Mock 输出会立即返回固定内容
/ccg:dev "测试功能"
```

---

## 紧急恢复

### 场景：所有状态文件损坏

```bash
# 1. 停止所有运行中的任务
pkill -f codeagent-wrapper

# 2. 清理后台任务
claude task list | grep -oP 'task_[a-zA-Z0-9]+' | xargs -I {} claude task kill {}

# 3. 归档损坏的状态文件
mkdir -p .claude/corrupted/$(date +%Y%m%d-%H%M%S)
mv .claude/*/*.local.md .claude/corrupted/$(date +%Y%m%d-%H%M%S)/

# 4. 从模板重建
for domain in developing debugging testing reviewing planning imaging writing; do
  cp .claude/templates/${domain}.local.md.template .claude/${domain}.local.md 2>/dev/null || true
done

# 5. 重新开始工作流
echo "✅ 状态已重置，可以重新开始"
```

---

## 联系支持

如果以上方案无法解决问题，请：

1. **收集诊断信息**:

   ```bash
   ${CLAUDE_PLUGIN_ROOT}/scripts/ops/health-check.sh > /tmp/diagnostic-report.txt
   ${CLAUDE_PLUGIN_ROOT}/scripts/ops/task-status.sh >> /tmp/diagnostic-report.txt
   ```

2. **查看完整日志**:

   ```bash
   tar -czf /tmp/claude-logs.tar.gz .claude/logs/
   ```

3. **提交 Issue**:
   - Repository: [你的仓库地址]
   - 附上: diagnostic-report.txt, claude-logs.tar.gz
   - 描述: 问题现象、复现步骤、期望行为

---

## 相关文档

- [并行执行用户指南](./parallel-execution-guide.md) - 快速入门和使用指南
- [最佳实践](./best-practices.md) - 避免常见问题的最佳实践
- [状态文件 V2 规范](../skills/shared/workflow/STATE_FILE_V2.md) - 状态文件格式详解
- [后台任务适配层](../skills/_shared/background/adapter.md) - 底层实现原理

---

## 更新历史

| 版本  | 日期       | 变更                                   |
| ----- | ---------- | -------------------------------------- |
| 1.0.0 | 2026-01-13 | 初始版本，覆盖 8 类常见问题 + 运维工具 |
