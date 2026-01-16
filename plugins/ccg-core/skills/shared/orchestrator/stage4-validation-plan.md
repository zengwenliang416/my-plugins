# Stage 4 - 验证与运维规划

## 概述

**目标**: 验证并行执行系统的正确性、性能和可运维性

**时间**: 预计 4-6 小时

**任务数**: 4 个核心任务

## 任务列表

### Task 4.1: 集成测试套件

**目标**: 验证所有 9 个 orchestrators 的并行执行功能

**优先级**: 高

**输出**:

- `.claude/tests/orchestrator-integration-tests.sh`
- `.claude/tests/test-results/`

**测试覆盖**:

1. **dev-orchestrator**:
   - Phase 2 并行功能分析（Codex + Gemini）
   - Phase 5 并行代码生成（Codex + Gemini）
   - 断点恢复测试
   - SESSION_ID 持久化测试

2. **debug-orchestrator**:
   - Phase 2 并行假设生成（Codex + Gemini）
   - Phase 4 并行修复方案（Codex + Gemini）
   - Circuit breaker 测试

3. **test-orchestrator**:
   - Phase 2 并行测试生成（Codex + Gemini）
   - 测试执行和报告生成

4. **plan-orchestrator**:
   - Phase 4 并行文档审查（Codex + Gemini）
   - 技术准确性 vs 可读性审查

5. **review-orchestrator**:
   - Phase 3 并行代码审查（Codex + Gemini）
   - 安全/性能 vs UX/可访问性审查

6. **social-post-orchestrator**:
   - Phase 3 可选并行草稿生成（Codex + Gemini）
   - 技术深度 vs 通俗易懂草稿

7. **ui-ux-design-orchestrator**:
   - Phase 3 三变体并行生成（Codex + Gemini × 3）
   - 极简/现代/创意风格

8. **commit-orchestrator**:
   - V2 状态文件兼容性
   - 顺序流程验证

9. **image-orchestrator**:
   - V2 状态文件兼容性
   - 顺序流程验证

**测试方法**:

```bash
#!/bin/bash
# orchestrator-integration-tests.sh

set -euo pipefail

# 测试框架
run_test() {
  local test_name="$1"
  local test_cmd="$2"

  echo "🧪 测试: $test_name"

  if eval "$test_cmd"; then
    echo "  ✅ 通过"
    return 0
  else
    echo "  ❌ 失败"
    return 1
  fi
}

# Task 4.1.1: dev-orchestrator 并行测试
test_dev_parallel() {
  # 创建测试状态文件
  # 触发 Phase 2 并行
  # 验证 subtasks 数组
  # 验证 parallel_execution 统计
  # 验证输出文件存在
}

# Task 4.1.2: debug-orchestrator 并行测试
test_debug_parallel() {
  # ...
}

# ... 其他 orchestrator 测试 ...

# 执行所有测试
main() {
  local passed=0
  local failed=0

  run_test "dev-orchestrator Phase 2" "test_dev_parallel" && ((passed++)) || ((failed++))
  run_test "debug-orchestrator Phase 2" "test_debug_parallel" && ((passed++)) || ((failed++))
  # ...

  echo ""
  echo "📊 测试结果: $passed 通过, $failed 失败"

  if [[ $failed -gt 0 ]]; then
    exit 1
  fi
}

main "$@"
```

**验证指标**:

- [ ] 所有并行阶段正确启动后台任务
- [ ] subtasks 数组正确更新
- [ ] parallel_execution 统计准确
- [ ] SESSION_ID 正确提取和保存
- [ ] 输出文件按预期生成
- [ ] 断点恢复机制有效
- [ ] 错误处理符合规范（不重试不降级）

**预计时间**: 2-3 小时

---

### Task 4.2: 性能基准测试

**目标**: 量化并行执行的性能提升

**优先级**: 中

**输出**:

- `.claude/benchmarks/parallel-vs-serial.md`
- `.claude/benchmarks/results/`

**测试场景**:

| Orchestrator | 串行耗时估算 | 并行耗时估算 | 预期提速 |
| ------------ | ------------ | ------------ | -------- |
| dev          | ~14分钟      | ~7分钟       | 50%      |
| debug        | ~11分钟      | ~5.5分钟     | 50%      |
| test         | ~6分钟       | ~3分钟       | 50%      |
| plan         | ~5分钟       | ~3分钟       | 40%      |
| review       | ~6分钟       | ~3分钟       | 50%      |
| social-post  | ~8分钟       | ~4分钟       | 50%      |
| ui-ux-design | ~10分钟      | ~4分钟       | 60%      |

**基准测试脚本**:

```bash
#!/bin/bash
# parallel-vs-serial-benchmark.sh

benchmark_orchestrator() {
  local orchestrator="$1"
  local test_case="$2"

  # 串行模式（禁用并行）
  local start_serial=$(date +%s)
  run_orchestrator_serial "$orchestrator" "$test_case"
  local end_serial=$(date +%s)
  local serial_time=$((end_serial - start_serial))

  # 并行模式
  local start_parallel=$(date +%s)
  run_orchestrator_parallel "$orchestrator" "$test_case"
  local end_parallel=$(date +%s)
  local parallel_time=$((end_parallel - start_parallel))

  # 计算提速比
  local speedup=$(echo "scale=2; $serial_time / $parallel_time" | bc)
  local improvement=$(echo "scale=1; ($serial_time - $parallel_time) * 100 / $serial_time" | bc)

  echo "| $orchestrator | ${serial_time}s | ${parallel_time}s | ${speedup}x | ${improvement}% |"
}

# 运行所有基准测试
main() {
  echo "| Orchestrator | 串行耗时 | 并行耗时 | 提速比 | 性能提升 |"
  echo "| ------------ | -------- | -------- | ------ | -------- |"

  benchmark_orchestrator "dev" "simple_feature"
  benchmark_orchestrator "debug" "simple_bug"
  benchmark_orchestrator "test" "simple_module"
  # ...
}

main "$@"
```

**验证指标**:

- [ ] 平均性能提升 ≥ 40%
- [ ] dev-orchestrator 提速 ≥ 45%
- [ ] ui-ux-design-orchestrator 提速 ≥ 55%（3个并发任务）
- [ ] 无性能回退（并行不慢于串行）

**预计时间**: 1-2 小时

---

### Task 4.3: 运维监控工具

**目标**: 提供运维和故障排查工具

**优先级**: 中

**输出**:

- `.claude/scripts/ops/task-status.sh` - 任务状态查询
- `.claude/scripts/ops/cleanup-orphans.sh` - 孤儿任务清理
- `.claude/scripts/ops/health-check.sh` - 健康检查

**功能 1: 任务状态查询**

```bash
#!/bin/bash
# task-status.sh - 查询所有运行中的后台任务

show_all_tasks() {
  echo "🔍 所有运行中的后台任务"
  echo ""

  # 遍历所有状态文件
  for state_file in .claude/*/*.local.md; do
    if [[ -f "$state_file" ]]; then
      local domain=$(yq eval '.domain' "$state_file")
      local active=$(yq eval '.parallel_execution.active_tasks' "$state_file")

      if [[ $active -gt 0 ]]; then
        echo "📂 Domain: $domain"
        echo "   状态文件: $state_file"
        echo "   活跃任务: $active"
        echo ""

        # 列出所有任务
        yq eval '.subtasks[] | select(.status == "running")' "$state_file" -o=json | \
        jq -r '"   - " + .id + " (" + .backend + ") [task_id: " + .task_id + "]"'
        echo ""
      fi
    fi
  done
}

show_all_tasks
```

**功能 2: 孤儿任务清理**

```bash
#!/bin/bash
# cleanup-orphans.sh - 清理孤儿任务（状态为 running 但实际已停止）

cleanup_orphans() {
  local dry_run="${1:-false}"

  for state_file in .claude/*/*.local.md; do
    yq eval '.subtasks[] | select(.status == "running")' "$state_file" -o=json | \
    while IFS= read -r task; do
      local task_id=$(echo "$task" | jq -r '.task_id')
      local id=$(echo "$task" | jq -r '.id')

      # 检查任务是否真的在运行
      if ! claude task list | grep -q "$task_id"; then
        echo "⚠️  发现孤儿任务: $id (task_id: $task_id)"

        if [[ "$dry_run" == "false" ]]; then
          echo "   清理中..."
          # 更新状态为 failed
          yq eval "(.subtasks[] | select(.id == \"$id\") | .status) = \"failed\"" -i "$state_file"
          yq eval "(.subtasks[] | select(.id == \"$id\") | .error) = \"Task orphaned\"" -i "$state_file"
          yq eval '.parallel_execution.active_tasks -= 1' -i "$state_file"
          yq eval '.parallel_execution.failed_tasks += 1' -i "$state_file"
          echo "   ✅ 已标记为失败"
        else
          echo "   [dry-run] 将标记为失败"
        fi
      fi
    done
  done
}

# 使用方式
if [[ "${1:-}" == "--dry-run" ]]; then
  cleanup_orphans "true"
else
  read -p "确认清理孤儿任务? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    cleanup_orphans "false"
  fi
fi
```

**功能 3: 健康检查**

```bash
#!/bin/bash
# health-check.sh - 检查并行执行系统健康状态

health_check() {
  echo "🏥 并行执行系统健康检查"
  echo ""

  # 检查依赖工具
  echo "📦 依赖工具:"
  for tool in yq jq; do
    if command -v "$tool" &> /dev/null; then
      echo "  ✅ $tool"
    else
      echo "  ❌ $tool (未安装)"
    fi
  done
  echo ""

  # 检查并发槽位
  local total_active=0
  for state_file in .claude/*/*.local.md; do
    if [[ -f "$state_file" ]]; then
      local active=$(yq eval '.parallel_execution.active_tasks' "$state_file" 2>/dev/null || echo "0")
      total_active=$((total_active + active))
    fi
  done

  echo "🔢 并发槽位使用情况:"
  echo "   活跃任务总数: $total_active / 8"
  if [[ $total_active -le 8 ]]; then
    echo "   ✅ 正常"
  else
    echo "   ⚠️  超出最大并发限制"
  fi
  echo ""

  # 检查状态文件完整性
  echo "📋 状态文件完整性:"
  local valid=0
  local invalid=0

  for state_file in .claude/*/*.local.md; do
    if [[ -f "$state_file" ]]; then
      if yq eval '.' "$state_file" &> /dev/null; then
        ((valid++))
      else
        ((invalid++))
        echo "  ❌ 损坏: $state_file"
      fi
    fi
  done

  echo "   ✅ 有效: $valid"
  if [[ $invalid -gt 0 ]]; then
    echo "   ❌ 损坏: $invalid"
  fi
}

health_check
```

**验证指标**:

- [ ] 能正确查询所有运行中的任务
- [ ] 能识别并清理孤儿任务
- [ ] 健康检查覆盖关键指标
- [ ] 工具易于使用，输出清晰

**预计时间**: 1-2 小时

---

### Task 4.4: 用户文档和最佳实践

**目标**: 提供完整的用户文档和使用指南

**优先级**: 高

**输出**:

- `.claude/docs/parallel-execution-guide.md` - 用户指南
- `.claude/docs/best-practices.md` - 最佳实践
- `.claude/docs/troubleshooting.md` - 故障排查

**用户指南内容**:

1. **快速开始**
   - 什么是并行执行
   - 如何启用并行执行
   - 第一个并行工作流

2. **Orchestrator 指南**
   - 9 个 orchestrators 的并行能力
   - 如何选择合适的 orchestrator
   - 常用命令和参数

3. **状态管理**
   - V2 状态文件格式
   - 断点恢复机制
   - SESSION_ID 管理

4. **进度监控**
   - 使用统一进度显示接口
   - 后台监控模式
   - 简洁进度条

5. **错误处理**
   - 常见错误和解决方案
   - 孤儿任务清理
   - 健康检查

**最佳实践内容**:

1. **性能优化**
   - 合理使用并发槽位（≤8）
   - 避免过度并行
   - 选择合适的 orchestrator

2. **可靠性**
   - 使用断点恢复
   - 定期清理孤儿任务
   - 监控健康状态

3. **多模型协作**
   - Codex vs Gemini 角色分工
   - 何时使用并行分析
   - 如何合并多模型结果

4. **调试技巧**
   - 如何查看任务日志
   - 如何追踪 SESSION_ID
   - 如何排查卡住的任务

**故障排查内容**:

1. **任务无法启动**
   - 检查后台任务限制
   - 检查 codeagent-wrapper 可用性
   - 检查状态文件格式

2. **任务长时间无响应**
   - 检查外部模型状态
   - 查看任务日志
   - 使用 cleanup-orphans.sh

3. **进度显示异常**
   - 检查 yq/jq 安装
   - 检查状态文件格式
   - 验证 subtasks 数组

4. **SESSION_ID 提取失败**
   - 检查输出格式
   - 使用 output-validator.sh
   - 查看失败日志

**验证指标**:

- [ ] 文档覆盖所有核心功能
- [ ] 提供实用的示例代码
- [ ] 故障排查指南清晰易懂
- [ ] 最佳实践基于实际经验

**预计时间**: 2 小时

---

## Stage 4 总体规划

### 执行顺序

1. **优先**: Task 4.1（集成测试） + Task 4.4（用户文档）
   - 验证系统正确性
   - 提供使用指南

2. **次要**: Task 4.2（性能基准） + Task 4.3（运维工具）
   - 验证性能提升
   - 提供运维支持

### 里程碑

- **Milestone 1**: Task 4.1 完成 → 系统功能验证通过
- **Milestone 2**: Task 4.4 完成 → 用户可以开始使用
- **Milestone 3**: Task 4.2 + 4.3 完成 → 系统生产就绪

### 成功标准

- [ ] 所有 9 个 orchestrators 集成测试通过
- [ ] 平均性能提升 ≥ 40%
- [ ] 提供完整的用户文档和运维工具
- [ ] 无已知的高优先级 bug

### 风险

| 风险                 | 影响 | 缓解措施                     |
| -------------------- | ---- | ---------------------------- |
| 集成测试发现严重 bug | 高   | 预留 buffer 时间修复         |
| 性能提升未达预期     | 中   | 调整并发策略或模型选择       |
| 文档覆盖不全         | 低   | 基于实际测试补充遗漏场景     |
| 运维工具不够完善     | 低   | 后续迭代优化，先实现核心功能 |

---

## 下一步行动

1. 开始 Task 4.1: 创建集成测试框架
2. 并行开始 Task 4.4: 编写用户指南
3. 完成后进行 Task 4.2 和 4.3

**预计 Stage 4 总耗时**: 4-6 小时
