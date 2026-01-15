---
name: migration-intent-router
event: UserPromptSubmit
description: |
  检测用户是否要进行老旧代码迁移分析
  如果检测到相关意图，自动触发 migration-init-orchestrator
enabled: true
priority: 150
---

# Migration Intent Router Hook

## 执行逻辑

当用户提交消息时，按以下步骤执行：

### Step 1: 检测迁移分析意图

检查用户消息是否包含以下**强关键词**（任意一个即触发）：

- "迁移分析" / "代码迁移" / "项目迁移"
- "框架升级" / "技术栈升级"
- "老旧项目" / "遗留项目" / "legacy"
- "migration init" / "/ccg:migration-init"
- "迁移方案" + ("分析" 或 "评估" 或 "生成")

或**弱关键词组合**（需同时出现）：

- "Spring 4" + "升级"
- "Java 8" + "迁移"
- "老代码" + "分析"
- "技术债" + "评估"
- "EOL" + "组件"

**排除场景**（即使包含关键词也不触发）：

- 包含 "查看" / "show" / "read" + "报告" → 仅查看现有报告
- 包含 "审查" / "review" → 代码审查意图，非迁移分析
- 包含 "讨论" / "如何" / "怎么" 但不包含动作动词 → 咨询讨论，非执行意图

### Step 2: 检查现有分析状态

如果检测到迁移分析意图：

1. 使用 Read 工具检查 `.claude/migration/init.local.md` 文件是否存在

2. 如果文件存在：
   - 读取 `status:` 字段值
   - 如果 status = "completed"：
     - 向用户报告："检测到已存在的迁移分析报告"
     - 使用 AskUserQuestion 询问：
       ```
       问题："发现已有迁移分析报告，如何处理？"
       选项：
         1. 重新分析（覆盖现有报告）
         2. 查看现有报告
         3. 继续当前对话（不启动分析）
       ```
     - 等待用户选择
     - 如果选择 1：继续执行 Step 3
     - 如果选择 2：使用 Read 工具读取 `.claude/migration/reports/SUMMARY.md` 并展示给用户，结束流程
     - 如果选择 3：结束流程，继续正常对话

   - 如果 status = "in_progress"：
     - 向用户报告："检测到未完成的迁移分析流程"
     - 使用 AskUserQuestion 询问：
       ```
       问题："发现未完成的迁移分析，如何处理？"
       选项：
         1. 继续未完成的流程
         2. 重新开始
         3. 取消
       ```
     - 等待用户选择
     - 如果选择 1 或 2：继续执行 Step 3
     - 如果选择 3：结束流程

3. 如果文件不存在：直接执行 Step 3

### Step 3: 触发迁移分析 Agent

1. 向用户报告："🔍 检测到迁移初始化请求，启动自动分析流程..."

2. 使用 Task 工具调用 migration-init-orchestrator Agent：

   ```
   subagent_type: "migration-init-orchestrator"
   description: "Migration analysis"
   prompt: "执行 7 阶段迁移初始化分析流程"
   ```

3. Agent 完成后，向用户报告：
   - "✅ 迁移分析完成！生成了以下文档："
   - 列出生成的关键文件：
     - `.claude/migration/reports/SUMMARY.md` - 总结报告
     - `.claude/migration/reports/migration-strategy.md` - 迁移策略
     - `CLAUDE.md` - 项目根文档
     - 模块文档数量（如有）

### Step 4: 未匹配时的处理

如果用户消息不匹配任何触发条件：

- 不进行任何操作
- 让后续流程正常处理用户请求

## 触发示例

### 示例 1: 自然语言触发

```
用户: 帮我分析一下这个老旧项目的迁移方案
Hook: 匹配 "老旧项目" + "迁移方案" + "分析"
结果: 检查现有状态 → 触发 migration-init-orchestrator
```

### 示例 2: 命令触发

```
用户: /ccg:migration-init
Hook: 匹配 "/ccg:migration-init"
结果: 触发 migration-init-orchestrator
```

### 示例 3: 已有报告

```
用户: 重新分析迁移方案
Hook: 匹配 "迁移方案" + 发现 status="completed"
结果: 询问用户 → 根据选择决定是否重新分析
```

### 示例 4: 不触发

```
用户: 查看迁移分析报告
Hook: 匹配关键词但包含 "查看" 排除词
结果: 不触发（让用户自行读取报告）
```

```
用户: 审查迁移相关的代码
Hook: 匹配关键词但包含 "审查" 排除词
结果: 不触发（代码审查意图）
```

## 优先级说明

priority: 150 - 高于通用 intent-router (100)，确保迁移分析意图优先识别
