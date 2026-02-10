---
name: gemini-cli
description: |
  【触发条件】重构工作流中需要前端组件重构、CSS 优化、UI 结构改进时使用。
  【核心产出】输出重构后的 React/Vue/HTML/CSS 代码，上下文限制 32k tokens
  【不触发】后端逻辑重构、API 重构、数据库操作（改用 codex-cli）
  【先问什么】无需询问，由其他 skills 调用
  [Resource Usage] Use references/, assets/, and scripts/ (`scripts/invoke-gemini.ts`).
allowed-tools:
  - Bash
  - Read
  - Task
---

# Gemini CLI - 重构工作流前端专家

Frontend refactoring expert via `scripts/invoke-gemini.ts`. **UI/组件/样式重构** → React/Vue/CSS 原型 → Claude review & apply. Context limit: **32k tokens**.

## Script Entry

```bash
npx tsx scripts/invoke-gemini.ts --role "<role>" --prompt "<prompt>" [--workdir "<path>"] [--session "<id>"]
```

## Resource Usage

- Prompt recipes: `references/recipes.md`
- Output constraints: `assets/output-formats.md`
- Execution script: `scripts/invoke-gemini.ts`

## 执行命令

```bash
# 标准调用
npx tsx scripts/invoke-gemini.ts \
  --workdir /path/to/project \
  --role frontend-refactor \
  --prompt "Your refactoring task"

# 后台并行执行
npx tsx scripts/invoke-gemini.ts --prompt "$PROMPT" &
```

## 重构专用角色

| 角色                   | 用途             | 命令示例                        |
| ---------------------- | ---------------- | ------------------------------- |
| component-analyst      | 组件结构分析     | `--role component-analyst`      |
| frontend-refactor      | 前端重构方案生成 | `--role frontend-refactor`      |
| style-optimizer        | CSS/样式优化     | `--role style-optimizer`        |
| accessibility-reviewer | 可访问性审查     | `--role accessibility-reviewer` |

---

## 重构场景提示词模板

### 场景 1: 组件气味检测

```bash
npx tsx scripts/invoke-gemini.ts \
  --role component-analyst \
  --prompt "
## 任务
分析以下前端组件的代码气味。

## 目标文件
${component_files}

## 检测维度
1. God Component (>300 行或 >5 个职责)
2. Prop Drilling (层级 >3 层的 props 传递)
3. CSS Bloat (冗余/重复样式)
4. Missing Memoization (不必要的重渲染)
5. Accessibility Issues (缺少 ARIA/语义化)
6. Responsiveness Issues (非响应式布局)
7. State Management Smell (本地状态过多)
8. Component Coupling (组件间过度耦合)

## 输出格式
JSON 数组，每个气味包含：
- type: 气味类型
- severity: critical/high/medium/low
- location: {file, line, component}
- suggestion: 改进建议
"
```

### 场景 2: Extract Component 重构

```bash
npx tsx scripts/invoke-gemini.ts \
  --role frontend-refactor \
  --prompt "
## 任务
执行 Extract Component 重构。

## 目标
- 文件: ${target_file}
- 组件: ${target_component}
- 要提取的部分: ${extract_description}

## 要求
1. 创建独立的子组件
2. 定义清晰的 Props 接口
3. 保持样式隔离
4. 确保状态管理正确

## 技术栈
${tech_stack} (React/Vue/Svelte)

## 输出格式
新组件代码 + 父组件修改
"
```

### 场景 3: CSS 重构优化

```bash
npx tsx scripts/invoke-gemini.ts \
  --role style-optimizer \
  --prompt "
## 任务
优化 CSS/样式代码。

## 目标文件
${style_files}

## 优化维度
1. 消除重复样式
2. 提取共享变量
3. 优化选择器性能
4. 改进响应式断点
5. 统一命名规范

## 技术栈
${css_framework} (Tailwind/CSS Modules/Styled Components)

## 输出格式
优化后的样式代码 + 变更说明
"
```

### 场景 4: 响应式重构

```bash
npx tsx scripts/invoke-gemini.ts \
  --role frontend-refactor \
  --prompt "
## 任务
重构为响应式设计。

## 目标组件
${target_component}

## 断点要求
- Mobile: <768px
- Tablet: 768px-1024px
- Desktop: >1024px

## 要求
1. Mobile-first 设计
2. 保持语义化结构
3. 优化触摸交互
4. 处理图片响应式

## 输出格式
响应式组件代码 + 样式修改
"
```

### 场景 5: 可访问性重构

```bash
npx tsx scripts/invoke-gemini.ts \
  --role accessibility-reviewer \
  --prompt "
## 任务
提升组件可访问性。

## 目标组件
${target_component}

## 检查维度
1. ARIA 属性完整性
2. 键盘导航支持
3. 颜色对比度
4. 屏幕阅读器兼容
5. 焦点管理

## 输出格式
JSON：
{
  \"issues\": [...],
  \"fixes\": [...],
  \"code_changes\": \"修改后的代码\"
}
"
```

### 场景 6: 状态管理重构

```bash
npx tsx scripts/invoke-gemini.ts \
  --role frontend-refactor \
  --prompt "
## 任务
重构组件状态管理。

## 目标组件
${target_component}

## 当前问题
${state_issues}

## 要求
1. 提升状态到合适层级
2. 使用 Context/Redux/Zustand（按需）
3. 优化重渲染
4. 添加 memoization

## 输出格式
重构后的组件代码
"
```

---

## MUST: 协作流程

### Step 1: Gemini 分析/生成

```bash
result=$(npx tsx scripts/invoke-gemini.ts \
  --role frontend-refactor \
  --prompt "$REFACTOR_PROMPT")
SESSION_ID=$(echo "$result" | grep SESSION_ID | cut -d= -f2)
```

### Step 2: Claude 审查重构

1. 审查 Gemini 返回的组件代码
2. 验证样式一致性
3. 检查可访问性
4. 优化命名和结构

### Step 3: 应用修改

使用 Edit 工具应用审查后的修改。

### Step 4: 验证

```bash
npx tsx scripts/invoke-gemini.ts \
  --role accessibility-reviewer \
  --prompt "验证重构结果：[组件摘要]" \
  --session "$SESSION_ID"
```

---

## 上下文管理 (32k 限制)

| 策略            | 方法                        |
| --------------- | --------------------------- |
| Atomic Design   | 一次重构一个组件            |
| Interface First | 只传接口，不传完整实现      |
| Multi-turn      | 结构 → 样式 → 交互 分步重构 |
| Session Reuse   | 使用 `--session` 保持上下文 |

---

## 会话管理

```bash
# 第一次调用 - 获取 SESSION_ID
result=$(npx tsx scripts/invoke-gemini.ts --prompt "...")
SESSION_ID=$(echo "$result" | grep SESSION_ID | cut -d= -f2)

# 后续调用 - 继续会话
npx tsx scripts/invoke-gemini.ts --prompt "..." --session "$SESSION_ID"
```

---

## MUST: 约束条件

| 必须执行                  | 禁止事项                |
| ------------------------- | ----------------------- |
| ✅ 保存 SESSION_ID        | ❌ 直接使用原型不审查   |
| ✅ 原型必须经 Claude 重构 | ❌ 超过 32k 上下文      |
| ✅ 后台执行用 Task tool   | ❌ 擅自终止后台任务     |
| ✅ 验证可访问性           | ❌ 忽略响应式需求       |
| ✅ 保持样式一致性         | ❌ 引入不兼容的样式框架 |

---

## 输出格式

```json
{
  "success": true,
  "SESSION_ID": "uuid",
  "agent_messages": "component code, styles, or analysis result"
}
```

---

SESSION_ID=xxx
