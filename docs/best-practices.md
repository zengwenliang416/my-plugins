# 并行执行最佳实践

## 概述

本文档提供并行执行系统的最佳实践指南，帮助团队高效、可靠地使用多模型协作能力。

## 核心原则

### 1. 正确理解角色分工

#### Codex 的优势领域

- **后端逻辑分析**：复杂算法、业务规则、数据流
- **安全审查**：SQL 注入、XSS、CSRF、权限控制
- **性能优化**：数据库查询、缓存策略、算法复杂度
- **技术准确性**：API 设计、架构决策、技术细节

#### Gemini 的优势领域

- **前端 UI/UX**：React 组件、Tailwind CSS、响应式设计
- **可读性审查**：代码风格、注释质量、文档结构
- **可访问性**：ARIA 标签、键盘导航、屏幕阅读器
- **用户体验**：交互设计、错误提示、加载状态

#### 选择策略

```bash
# 场景 1: 纯后端任务 → 使用 Codex（无需并行）
codex-cli "优化用户认证流程的数据库查询"

# 场景 2: 纯前端任务 → 使用 Gemini（无需并行）
gemini-cli "设计登录表单的响应式布局"

# 场景 3: 全栈任务 → 并行执行（dev-orchestrator）
/ccg:dev "实现用户注册功能"
# → Codex: 后端 API + 数据库
# → Gemini: 前端表单 + 验证反馈
```

### 2. 合理控制并发度

#### 全局并发限制

**硬性约束**: 系统最多支持 8 个并发后台任务。

**建议策略**:

- 单个 orchestrator：≤ 2 个并发任务（Phase 内的 Codex + Gemini）
- 多个 orchestrators 同时运行：手动协调并发度
- 长时间任务：使用断点恢复，避免占用槽位

**反模式**:

```bash
# ❌ 错误：同时启动 5 个 orchestrators（可能超过 8 并发）
/ccg:dev "功能 A" &
/ccg:debug "Bug B" &
/ccg:review "PR C" &
/ccg:test "模块 D" &
/ccg:plan "方案 E" &
```

**正确做法**:

```bash
# ✅ 正确：串行启动，或确保并发度 ≤ 8
/ccg:dev "功能 A"   # 等待完成
/ccg:debug "Bug B"  # 再启动下一个
```

#### 监控并发状态

```bash
# 实时查看活跃任务数
for f in .claude/*/*.local.md; do
  active=$(yq eval '.parallel_execution.active_tasks' "$f" 2>/dev/null || echo 0)
  if [ "$active" -gt 0 ]; then
    echo "$f: $active 活跃任务"
  fi
done

# 输出示例:
# .claude/developing.local.md: 2 活跃任务
# .claude/debugging.local.md: 1 活跃任务
# 总计: 3 活跃任务（还可以启动 5 个）
```

### 3. 断点恢复策略

#### 何时需要断点恢复

- **长时间任务**：预计 > 5 分钟的分析或生成
- **不稳定网络**：远程 API 调用可能中断
- **资源受限**：本地机器需要重启或释放资源
- **多任务切换**：需要暂停当前任务处理紧急事项

#### 状态文件中的关键字段

```yaml
# .claude/developing.local.md
parallel_execution:
  active_tasks: 2 # 当前运行中的任务数

subtasks:
  - id: codex-feature-analysis
    status: running
    task_id: task_abc123 # ← 断点恢复的关键
    started_at: "2026-01-13T14:30:00Z"

  - id: gemini-feature-analysis
    status: completed
    task_id: task_def456
    completed_at: "2026-01-13T14:32:00Z"
```

#### 恢复流程

**自动恢复**（推荐）:

```typescript
// orchestrator 内部自动检测
const subtask = state.subtasks.find((t) => t.status === "running");
if (subtask?.task_id) {
  // 恢复后台任务
  const result = await TaskOutput({ task_id: subtask.task_id, block: true });
  // 继续后续流程
}
```

**手动恢复**:

```bash
# 1. 查看状态文件，找到 task_id
yq eval '.subtasks[] | select(.status == "running") | .task_id' .claude/developing.local.md

# 2. 手动查询任务结果
claude task output task_abc123

# 3. 更新状态文件
yq eval -i '.subtasks[0].status = "completed"' .claude/developing.local.md
yq eval -i '.subtasks[0].completed_at = "2026-01-13T14:35:00Z"' .claude/developing.local.md
```

#### 注意事项

- **task_id 持久化**：必须在后台任务启动后立即保存到状态文件
- **状态同步**：恢复后更新 `status`, `completed_at`, `output` 字段
- **错误处理**：如果 `task_id` 已失效（任务被清理），视为失败并记录到 failed_tasks

### 4. SESSION_ID 管理

#### 为什么需要 SESSION_ID

**问题**：Codex/Gemini 每次调用都是独立会话，无法记住上下文。

**解决**：通过 `SESSION_ID` 参数将多次调用串联成连续对话。

#### 提取与存储

**约定**：外部模型必须在输出的第一行返回 `SESSION_ID: xxx`。

**提取示例**:

```bash
# 从输出文件提取
SESSION_ID=$(head -1 .claude/developing/analysis-codex.md | grep -oP 'SESSION_ID: \K\S+')

# 存储到状态文件
yq eval -i ".sessions.codex.current = \"$SESSION_ID\"" .claude/developing.local.md
yq eval -i ".sessions.codex.history += [\"$SESSION_ID\"]" .claude/developing.local.md
```

**验证**:

```bash
# 检查是否成功存储
yq eval '.sessions.codex.current' .claude/developing.local.md
# 输出: session_abc123
```

#### 会话延续

**后续调用传入 SESSION_ID**:

```bash
# Phase 5 继续使用 Phase 2 的会话
SESSION_ID=$(yq eval '.sessions.codex.current' .claude/developing.local.md)

codex-cli \
  --session "$SESSION_ID" \
  --prompt "继续优化之前分析的性能瓶颈" \
  run_in_background=true
```

#### SESSION_ID 生命周期

```yaml
sessions:
  codex:
    current: session_xyz # 当前活跃会话
    history: # 历史会话（用于审计和回溯）
      - session_abc
      - session_def
      - session_xyz
```

- **current**: 最新会话 ID，用于下次调用
- **history**: 所有会话 ID，按时间顺序排列
- **清理**: 工作流完成后，`current` 置为 `null`，`history` 保留

### 5. 错误处理与重试

#### 不重试原则

**设计决策**：后台任务失败时，**不自动重试**，直接标记为失败。

**理由**:

1. **避免级联失败**：重试可能导致长时间阻塞
2. **明确错误信息**：立即失败便于快速定位问题
3. **用户决策权**：是否重试由用户根据错误原因决定

#### 失败检测

```bash
# 检查失败任务
failed=$(yq eval '.parallel_execution.failed_tasks' .claude/developing.local.md)
if [ "$failed" -gt 0 ]; then
  echo "⚠️ 发现 $failed 个失败任务"
  yq eval '.subtasks[] | select(.status == "failed")' .claude/developing.local.md
fi
```

#### 失败日志

**自动记录**:

```yaml
# .claude/logs/failure-20260113-143000.log
timestamp: 2026-01-13T14:30:00Z
workflow: developing
phase: feature_analysis
task_id: codex-feature-analysis
backend: codex
error: |
  Task execution timeout after 600s
  Last output: "Analyzing database schema..."
```

**日志位置**: `.claude/logs/failure-*.log`

#### 手动重试

```bash
# 1. 查看错误详情
cat .claude/logs/failure-20260113-143000.log

# 2. 修复问题（如调整 prompt、增加超时时间）

# 3. 重置任务状态
yq eval -i '.subtasks[0].status = "pending"' .claude/developing.local.md
yq eval -i '.subtasks[0].error = null' .claude/developing.local.md
yq eval -i '.parallel_execution.failed_tasks -= 1' .claude/developing.local.md

# 4. 重新启动 orchestrator
/ccg:dev "继续功能分析"
```

### 6. 进度监控

#### 实时查看进度

**详细模式**（多行）:

```bash
source "${CLAUDE_PLUGIN_ROOT}/skills/_shared/ui/progress.sh"
print_parallel_progress ".claude/developing.local.md"
```

**输出示例**:

```
🔄 并行执行中 (Phase: feature_analysis)

┌────────────────────────────────────────────────────────────┐
│ codex-feature-analy  [████████░░] 🔄 运行中 (1m 23s) [codex] │
│ gemini-feature-anal  [██████████] ✅ 完成   (1m 05s) [gemini] │
└────────────────────────────────────────────────────────────┘

📊 统计: 活跃 1/2 | 完成 1 | 失败 0 | 总计 2
```

**简洁模式**（单行）:

```bash
print_simple_progress ".claude/developing.local.md"
# 输出: 🔄 进度: [████████████░░░░░░░░] 60% | 活跃: 1 | 完成: 1 | 失败: 0
```

#### 后台监控

**场景**：需要同时执行其他任务，不希望阻塞终端。

```bash
# 启动后台监控（每 2 秒刷新一次）
MONITOR_PID=$(start_progress_monitor ".claude/developing.local.md" 2)
echo "后台监控已启动 (PID: $MONITOR_PID)"

# 执行其他任务
git status
npm run build

# 停止监控
stop_progress_monitor "$MONITOR_PID"
echo "后台监控已停止"

# 显示最终进度
print_parallel_progress ".claude/developing.local.md"
```

#### 跨 orchestrator 聚合

**需求**：同时运行多个 orchestrators，希望统一查看进度。

**实现**:

```bash
#!/bin/bash
# scripts/ops/aggregate-progress.sh

echo "📊 全局并行任务状态:"
echo ""

total_active=0
total_completed=0
total_failed=0

for state_file in .claude/*/*.local.md; do
  if [ -f "$state_file" ]; then
    domain=$(yq eval '.domain' "$state_file")
    active=$(yq eval '.parallel_execution.active_tasks' "$state_file")
    completed=$(yq eval '.parallel_execution.completed_tasks' "$state_file")
    failed=$(yq eval '.parallel_execution.failed_tasks' "$state_file")

    if [ "$active" -gt 0 ] || [ "$completed" -gt 0 ] || [ "$failed" -gt 0 ]; then
      echo "[$domain] 活跃: $active | 完成: $completed | 失败: $failed"
      total_active=$((total_active + active))
      total_completed=$((total_completed + completed))
      total_failed=$((total_failed + failed))
    fi
  fi
done

echo ""
echo "全局总计: 活跃 $total_active | 完成 $total_completed | 失败 $total_failed"
echo "剩余并发槽位: $((8 - total_active))"
```

### 7. 性能优化

#### 任务颗粒度

**粗颗粒度**（不推荐）:

```yaml
# ❌ 单个任务包含过多工作
parallel_tasks:
  - id: codex-full-analysis
    prompt: |
      1. 分析需求
      2. 设计架构
      3. 编写代码
      4. 生成测试
      5. 编写文档
```

**细颗粒度**（推荐）:

```yaml
# ✅ 拆分为独立任务
parallel_tasks:
  - id: codex-backend-analysis
    prompt: "分析后端 API 需求"

  - id: gemini-frontend-analysis
    prompt: "分析前端 UI 需求"
```

**原则**:

- 单个任务耗时 < 5 分钟
- 任务间依赖尽量少
- 避免"单点瓶颈"（一个任务特别慢）

#### 预热策略

**问题**：首次调用外部模型有冷启动延迟（~10s）。

**解决**：在非关键路径提前预热。

```bash
# 在用户确认需求后，立即预热（不等结果）
codex-cli --prompt "hello" run_in_background=true &
gemini-cli --prompt "hello" run_in_background=true &

# 后续并行任务启动更快
```

#### 输出文件大小控制

**问题**：输出文件过大（> 1MB）会拖慢读取和解析。

**解决**:

1. **限制输出长度**：在 prompt 中明确要求"输出不超过 500 行"
2. **分段输出**：将大型分析拆分为多个小文件
3. **结构化输出**：使用 JSON/YAML 而非纯文本

```yaml
# 示例：限制输出长度
parallel_tasks:
  - id: codex-analysis
    prompt: |
      分析以下代码的性能瓶颈：
      ${CODE}

      **输出要求**:
      - 使用 JSON 格式
      - 仅列出 Top 5 瓶颈
      - 每个瓶颈不超过 50 字描述
```

### 8. 调试技巧

#### 查看后台任务输出

```bash
# 方法 1: 使用 claude 命令
claude task output task_abc123

# 方法 2: 直接读取输出文件
cat .claude/developing/analysis-codex.md

# 方法 3: 实时监控（tail -f 方式）
watch -n 2 "tail -20 .claude/developing/analysis-codex.md"
```

#### 验证状态文件一致性

```bash
#!/bin/bash
# scripts/ops/validate-state.sh

state_file=".claude/developing.local.md"

# 1. 检查 YAML 语法
yq eval '.' "$state_file" > /dev/null
if [ $? -ne 0 ]; then
  echo "❌ YAML 语法错误"
  exit 1
fi

# 2. 检查必需字段
workflow_version=$(yq eval '.workflow_version' "$state_file")
if [ "$workflow_version" != "2.0" ]; then
  echo "❌ workflow_version 不是 2.0"
  exit 1
fi

# 3. 检查并行执行统计一致性
active=$(yq eval '.parallel_execution.active_tasks' "$state_file")
actual_active=$(yq eval '[.subtasks[] | select(.status == "running")] | length' "$state_file")
if [ "$active" -ne "$actual_active" ]; then
  echo "⚠️ active_tasks ($active) 与实际运行任务数 ($actual_active) 不一致"
fi

echo "✅ 状态文件验证通过"
```

#### 模拟并行执行

**测试场景**：不启动真实后台任务，快速验证工作流逻辑。

```bash
# 创建 mock 后台任务适配层
cat > /tmp/mock-adapter.sh << 'EOF'
#!/bin/bash
# 模拟后台任务启动（立即返回 task_id）
echo "task_mock_$RANDOM"

# 模拟输出文件
sleep 2
echo "SESSION_ID: session_mock_$RANDOM" > "$OUTPUT_FILE"
echo "分析结果: ..." >> "$OUTPUT_FILE"
EOF

chmod +x /tmp/mock-adapter.sh

# 在 orchestrator 中使用 mock 适配层
export CODEX_WRAPPER="/tmp/mock-adapter.sh"
export GEMINI_WRAPPER="/tmp/mock-adapter.sh"

# 运行测试
/ccg:dev "测试功能"
```

### 9. 团队协作

#### 共享状态文件

**场景**：多人协作，共享 `.claude/` 目录。

**最佳实践**:

1. **版本控制**：将 `.claude/` 加入 Git（排除临时文件）

   ```gitignore
   # .gitignore
   .claude/logs/
   .claude/*/images/
   .claude/*/*.tmp
   ```

2. **冲突避免**：每人使用独立的 workflow_id

   ```yaml
   # Alice 的工作流
   workflow_id: "dev-alice-20260113-143000"

   # Bob 的工作流
   workflow_id: "dev-bob-20260113-143100"
   ```

3. **状态同步**：定期 `git pull` 获取最新状态

#### 代码审查

**推荐流程**:

```bash
# 1. 开发者生成分析报告
/ccg:review "审查 PR #123"

# 2. 分享状态文件和产物
git add .claude/reviewing.local.md .claude/reviewing/
git commit -m "review: Add review report for PR #123"
git push

# 3. 审查者查看报告
git pull
cat .claude/reviewing/report.md

# 4. 讨论和改进
# 基于 Codex 和 Gemini 的双重视角进行讨论
```

#### 知识库建设

**将工作流产物沉淀为团队知识**:

```bash
# 示例：将优秀的设计方案归档
cp .claude/ui-ux-design/design-final.md docs/design-patterns/user-profile-card.md
git add docs/design-patterns/
git commit -m "docs: Add user profile card design pattern"
```

### 10. 安全考虑

#### 敏感信息保护

**禁止在 prompt 中包含**:

- API keys / tokens
- 密码 / credentials
- 个人身份信息 (PII)
- 内部 IP / 域名

**使用占位符**:

```yaml
parallel_tasks:
  - id: codex-api-review
    prompt: |
      审查以下 API 设计的安全性：
      ${API_SPEC}  # ← 文件内容，不直接暴露敏感信息

      **注意**: 请忽略代码中的 token 和密钥，假设它们已安全存储。
```

#### 输出审计

**工作流产物可能包含敏感信息**，发布前审计：

```bash
# 检查是否泄露敏感信息
grep -r "password\|secret\|token\|key" .claude/developing/

# 清理敏感日志
sed -i 's/Bearer [a-zA-Z0-9_-]*/Bearer [REDACTED]/g' .claude/logs/*.log
```

#### 访问控制

```bash
# 限制状态文件权限（仅所有者可读写）
chmod 600 .claude/*/*.local.md

# 限制日志目录权限
chmod 700 .claude/logs/
```

## 反模式总结

### ❌ 不要做的事情

1. **过度并行**：启动超过 8 个并发任务
2. **忽略角色分工**：让 Codex 处理 CSS，让 Gemini 处理算法
3. **跳过验证**：不检查 SESSION_ID 是否提取成功
4. **手动合并**：直接编辑状态文件而不使用 `yq`
5. **隐藏错误**：失败任务不记录日志
6. **长时间阻塞**：单个任务运行超过 10 分钟不设置断点
7. **状态不一致**：更新 `subtasks` 但不更新 `parallel_execution`
8. **重复启动**：不检查已有 `task_id` 就启动新任务

### ✅ 推荐做法

1. **监控并发度**：使用 `aggregate-progress.sh` 实时查看
2. **明确角色**：根据任务特性选择 Codex 或 Gemini
3. **验证输出**：使用 `output-validator.sh` 检查格式
4. **自动化恢复**：利用 `task_id` 实现断点恢复
5. **结构化日志**：失败信息记录到 `.claude/logs/`
6. **定期健康检查**：运行 `health-check.sh`
7. **原子更新**：使用 `yq eval -i` 保证状态文件一致性
8. **幂等设计**：orchestrator 可以安全地重复执行

## 相关文档

- [并行执行用户指南](./parallel-execution-guide.md) - 快速入门和使用指南
- [故障排查指南](./troubleshooting.md) - 常见问题和解决方案
- [状态文件 V2 规范](../skills/shared/workflow/STATE_FILE_V2.md) - 状态文件格式详解
- [声明式并行 API](../skills/_shared/orchestrator/parallel.md) - API 参考文档
- [后台任务适配层](../skills/_shared/background/adapter.md) - 底层实现原理

## 更新历史

| 版本  | 日期       | 变更                         |
| ----- | ---------- | ---------------------------- |
| 1.0.0 | 2026-01-13 | 初始版本，覆盖 10 个最佳实践 |
