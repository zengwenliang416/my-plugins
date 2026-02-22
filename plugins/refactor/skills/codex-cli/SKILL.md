---
name: codex-cli
description: |
  [Trigger] When refactor workflow needs backend code analysis, smell detection, patch generation, or safety review.
  [Output] Read-only sandbox analysis → unified diff patch → Claude review then apply.
  [Skip] For frontend UI/CSS refactoring (use gemini-cli) or simple formatting.
  [Ask] No user input needed; invoked by other skills.
  [Resource Usage] Use references/, assets/, and scripts/ (`scripts/invoke-codex.ts`).
allowed-tools:
  - Bash
  - Read
  - Task
---

# Codex CLI - 重构工作流后端专家

Backend refactoring expert via `scripts/invoke-codex.ts`. **Read-only sandbox** → smell detection + unified diff patches → Claude review & apply.

## Script Entry

```bash
npx tsx scripts/invoke-codex.ts --role "<role>" --prompt "<prompt>" [--workdir "<path>"] [--session "<id>"] [--sandbox "read-only"]
```

## 执行命令

```bash
# 标准调用
npx tsx scripts/invoke-codex.ts \
  --workdir /path/to/project \
  --role refactoring-expert \
  --prompt "Your refactoring task" \
  --sandbox read-only

# 后台并行执行
npx tsx scripts/invoke-codex.ts --prompt "$PROMPT" --sandbox read-only &
```

## 重构专用角色

| 角色               | 用途           | 命令示例                    |
| ------------------ | -------------- | --------------------------- |
| smell-detector     | 代码气味检测   | `--role smell-detector`     |
| refactoring-expert | 重构方案生成   | `--role refactoring-expert` |
| impact-analyst     | 影响范围分析   | `--role impact-analyst`     |
| safety-reviewer    | 重构安全性审查 | `--role safety-reviewer`    |

---

## 重构场景提示词模板

### 场景 1: 代码气味检测

```bash
npx tsx scripts/invoke-codex.ts \
  --role smell-detector \
  --prompt "
## 任务
分析以下文件的代码气味。

## 目标文件
${file_list}

## 检测维度
1. Long Method (>50 行)
2. God Class (>10 方法 或 >300 行)
3. Long Parameter List (>5 参数)
4. Duplicated Code (>80% 相似)
5. Feature Envy (外部调用 > 内部调用)
6. Data Clumps (重复参数组)
7. Shotgun Surgery (散弹式修改)
8. Tight Coupling (过度耦合)

## 输出格式
JSON 数组，每个气味包含：
- type: 气味类型
- severity: critical/high/medium/low
- location: {file, line, symbol}
- metrics: 度量数据
- suggestion: 改进建议
" \
  --sandbox read-only
```

### 场景 2: Extract Method 重构

```bash
npx tsx scripts/invoke-codex.ts \
  --role refactoring-expert \
  --prompt "
## 任务
执行 Extract Method 重构。

## 目标
- 文件: ${target_file}
- 函数: ${target_method}
- 行范围: ${line_range}

## 要求
1. 提取独立的子方法
2. 保持函数签名兼容
3. 添加必要的参数传递
4. 保持错误处理一致

## 输出格式
仅输出 unified diff：
--- a/${file}
+++ b/${file}
@@ ... @@
...
" \
  --sandbox read-only
```

### 场景 3: Extract Class 重构

```bash
npx tsx scripts/invoke-codex.ts \
  --role refactoring-expert \
  --prompt "
## 任务
执行 Extract Class 重构。

## 目标
- 文件: ${target_file}
- 类: ${target_class}

## 要提取的职责
${responsibilities_to_extract}

## 要求
1. 创建新类承担分离的职责
2. 建立适当的依赖关系
3. 更新所有引用
4. 保持公共 API 兼容

## 输出格式
多个 unified diff（新文件和修改文件）
" \
  --sandbox read-only
```

### 场景 4: Move Method 重构

```bash
npx tsx scripts/invoke-codex.ts \
  --role refactoring-expert \
  --prompt "
## 任务
执行 Move Method 重构。

## 目标
- 源文件: ${source_file}
- 目标文件: ${target_file}
- 方法: ${method_name}

## 要求
1. 移动方法到目标类
2. 更新所有调用点
3. 处理依赖关系
4. 保持接口兼容

## 输出格式
unified diff
" \
  --sandbox read-only
```

### 场景 5: Introduce Parameter Object 重构

```bash
npx tsx scripts/invoke-codex.ts \
  --role refactoring-expert \
  --prompt "
## 任务
执行 Introduce Parameter Object 重构。

## 目标
- 文件: ${target_file}
- 函数: ${target_method}
- 参数列表: ${parameters}

## 要求
1. 创建参数对象类/接口
2. 更新函数签名
3. 更新所有调用点
4. 添加类型定义

## 输出格式
unified diff
" \
  --sandbox read-only
```

### 场景 6: 安全性审查

```bash
npx tsx scripts/invoke-codex.ts \
  --role safety-reviewer \
  --prompt "
## 任务
审查重构的安全性。

## 重构计划
${refactoring_plan}

## 审查维度
1. 功能保持：重构后行为是否一致
2. 边界条件：是否处理了所有边界情况
3. 错误处理：异常处理是否完整
4. 并发安全：是否引入竞态条件
5. 向后兼容：公共 API 是否兼容

## 输出格式
JSON：
{
  \"safe\": boolean,
  \"risk_level\": \"low/medium/high/critical\",
  \"issues\": [...],
  \"recommendations\": [...]
}
" \
  --sandbox read-only
```

---

## MUST: 协作流程

### Step 1: Codex 分析/生成

```bash
result=$(npx tsx scripts/invoke-codex.ts \
  --role refactoring-expert \
  --prompt "$REFACTOR_PROMPT" \
  --sandbox read-only)
SESSION_ID=$(echo "$result" | grep SESSION_ID | cut -d= -f2)
```

### Step 2: Claude 审查重构

1. 解析 Codex 返回的 diff
2. 验证重构逻辑正确性
3. 检查是否符合项目规范
4. 优化命名和结构

### Step 3: 应用修改

使用 Edit 工具应用审查后的修改。

### Step 4: 验证

```bash
npx tsx scripts/invoke-codex.ts \
  --role safety-reviewer \
  --prompt "验证重构结果：[变更摘要]" \
  --session "$SESSION_ID" \
  --sandbox read-only
```

---

## 会话管理

```bash
# 第一次调用 - 获取 SESSION_ID
result=$(npx tsx scripts/invoke-codex.ts --prompt "..." --sandbox read-only)
SESSION_ID=$(echo "$result" | grep SESSION_ID | cut -d= -f2)

# 后续调用 - 继续会话
npx tsx scripts/invoke-codex.ts --prompt "..." --session "$SESSION_ID"
```

---

## MUST: 约束条件

| 必须执行                      | 禁止事项                    |
| ----------------------------- | --------------------------- |
| ✅ 使用 `--sandbox read-only` | ❌ 直接应用 patch 不审查    |
| ✅ 保存 SESSION_ID            | ❌ 跳过安全性验证           |
| ✅ patch 必须经 Claude 审查   | ❌ 使用 `--yolo` 或写入沙箱 |
| ✅ 后台执行用 Task tool       | ❌ 擅自终止后台任务         |
| ✅ 验证重构后功能一致         | ❌ 盲从 Codex 输出          |

---

## 输出格式

```json
{
  "success": true,
  "SESSION_ID": "uuid",
  "agent_messages": "unified diff patch or analysis result"
}
```

---

SESSION_ID=xxx
