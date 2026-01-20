# Codex CLI Recipes - 后端重构配方

## 角色配置

| 角色                 | 用途           | 沙箱模式  |
| -------------------- | -------------- | --------- |
| `smell-detector`     | 代码气味检测   | read-only |
| `refactoring-expert` | 重构方案生成   | read-only |
| `impact-analyst`     | 影响范围分析   | read-only |
| `safety-reviewer`    | 重构安全性审查 | read-only |
| `legacy-analyst`     | 遗留系统分析   | read-only |

---

## 配方 1: 代码气味检测

### 场景

分析代码文件，识别常见代码气味。

### 命令

```bash
~/.claude/bin/codeagent-wrapper codex \
  --workdir ${PROJECT_DIR} \
  --role smell-detector \
  --prompt "${PROMPT}" \
  --sandbox read-only
```

### 提示词模板

```
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
```

### 预期输出

```json
[
  {
    "type": "long_method",
    "severity": "high",
    "location": {
      "file": "src/services/user.ts",
      "line": 42,
      "symbol": "processUserData"
    },
    "metrics": {
      "lines": 120,
      "cyclomatic_complexity": 15
    },
    "suggestion": "Extract validation, transformation, and persistence into separate methods"
  }
]
```

---

## 配方 2: Extract Method

### 场景

从长方法中提取独立子方法。

### 提示词模板

```
## 任务
执行 Extract Method 重构。

## 目标
- 文件: ${target_file}
- 函数: ${target_method}
- 行范围: ${start_line}-${end_line}

## 要提取的逻辑
${logic_description}

## 要求
1. 提取独立的子方法
2. 保持函数签名兼容
3. 添加必要的参数传递
4. 保持错误处理一致
5. 新方法命名要有意义

## 输出格式
仅输出 unified diff：
--- a/${file}
+++ b/${file}
@@ ... @@
...
```

---

## 配方 3: Extract Class

### 场景

从臃肿的类中提取独立的类。

### 提示词模板

```
## 任务
执行 Extract Class 重构。

## 目标
- 文件: ${target_file}
- 类: ${target_class}

## 要提取的职责
${responsibilities_to_extract}

## 要求
1. 创建新类承担分离的职责
2. 建立适当的依赖关系（组合/依赖注入）
3. 更新所有引用
4. 保持公共 API 兼容
5. 遵循单一职责原则

## 输出格式
多个 unified diff：
1. 新类文件
2. 原类修改
3. 引用更新
```

---

## 配方 4: Move Method

### 场景

将方法移动到更合适的类。

### 提示词模板

```
## 任务
执行 Move Method 重构。

## 目标
- 源文件: ${source_file}
- 源类: ${source_class}
- 目标文件: ${target_file}
- 目标类: ${target_class}
- 方法: ${method_name}

## 移动原因
${reason}

## 要求
1. 移动方法到目标类
2. 更新所有调用点
3. 处理依赖关系
4. 保持接口兼容
5. 考虑访问修饰符

## 输出格式
unified diff
```

---

## 配方 5: Introduce Parameter Object

### 场景

将过长的参数列表重构为参数对象。

### 提示词模板

```
## 任务
执行 Introduce Parameter Object 重构。

## 目标
- 文件: ${target_file}
- 函数: ${target_method}
- 当前参数: ${parameters}

## 要求
1. 创建参数对象类/接口
2. 更新函数签名
3. 更新所有调用点
4. 添加类型定义
5. 考虑默认值和可选参数

## 参数对象建议名称
${suggested_name}

## 输出格式
unified diff
```

---

## 配方 6: 安全性审查

### 场景

审查重构方案的安全性。

### 提示词模板

```
## 任务
审查重构的安全性。

## 重构计划
${refactoring_plan}

## 变更文件
${changed_files}

## 审查维度
1. 功能保持：重构后行为是否一致
2. 边界条件：是否处理了所有边界情况
3. 错误处理：异常处理是否完整
4. 并发安全：是否引入竞态条件
5. 向后兼容：公共 API 是否兼容
6. 性能影响：是否引入性能问题

## 输出格式
JSON：
{
  "safe": boolean,
  "risk_level": "low/medium/high/critical",
  "issues": [
    {
      "type": "issue_type",
      "severity": "severity",
      "location": "file:line",
      "description": "...",
      "fix": "..."
    }
  ],
  "recommendations": [...]
}
```

---

## 配方 7: 遗留系统分析

### 场景

分析遗留后端系统架构。

### 提示词模板

```
## 角色
你是遗留系统现代化专家，精通 Strangler Fig Pattern 和渐进式迁移。

## 任务
分析后端遗留代码，识别现代化机会。

## 源技术栈
${source_stack}

## 目标技术栈
${target_stack}

## 分析维度
1. 架构模式：识别当前架构模式（单体/分层/模块化）
2. 耦合分析：识别高耦合模块和循环依赖
3. 边界识别：找出可独立迁移的"接缝"（seams）
4. 数据层：分析数据访问模式和 ORM 使用
5. API 层：评估现有 API 的 REST/RPC 程度
6. 技术债务：标记过时依赖、反模式、安全漏洞

## 输出格式
JSON：
{
  "architecture_pattern": "monolithic|layered|modular|microservices",
  "coupling_hotspots": [...],
  "migration_seams": [...],
  "technical_debt": [...],
  "recommended_strategy": "strangler_fig|big_bang|incremental"
}
```

---

## 会话管理

### 启动新会话

```bash
result=$(~/.claude/bin/codeagent-wrapper codex \
  --role refactoring-expert \
  --prompt "$PROMPT" \
  --sandbox read-only)
SESSION_ID=$(echo "$result" | grep SESSION_ID | cut -d= -f2)
```

### 继续会话

```bash
~/.claude/bin/codeagent-wrapper codex \
  --role refactoring-expert \
  --prompt "$FOLLOW_UP_PROMPT" \
  --session "$SESSION_ID" \
  --sandbox read-only
```

---

## 最佳实践

### DO

- ✅ 始终使用 `--sandbox read-only`
- ✅ 保存 SESSION_ID 以便后续追问
- ✅ Claude 必须审查所有 patch 后再应用
- ✅ 验证重构后功能一致性

### DON'T

- ❌ 不要使用 `--yolo` 或写入沙箱
- ❌ 不要直接应用 patch 不审查
- ❌ 不要跳过安全性验证
- ❌ 不要盲从 Codex 输出

---

## 参考

- Martin Fowler - Refactoring
- Michael Feathers - Working Effectively with Legacy Code
- Joshua Kerievsky - Refactoring to Patterns
