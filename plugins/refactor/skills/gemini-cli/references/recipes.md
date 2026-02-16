# Gemini CLI Recipes - 前端重构配方

## 角色配置

| 角色                     | 用途             | 上下文限制 |
| ------------------------ | ---------------- | ---------- |
| `component-analyst`      | 组件结构分析     | 32k tokens |
| `frontend-refactor`      | 前端重构方案生成 | 32k tokens |
| `style-optimizer`        | CSS/样式优化     | 32k tokens |
| `accessibility-reviewer` | 可访问性审查     | 32k tokens |

---

## 配方 1: 组件气味检测

### 场景

分析前端组件，识别常见组件气味。

### 命令

```bash
codeagent-wrapper gemini \
  --workdir ${PROJECT_DIR} \
  --role component-analyst \
  --prompt "${PROMPT}"
```

### 提示词模板

```
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
```

### 预期输出

```json
[
  {
    "type": "god_component",
    "severity": "high",
    "location": {
      "file": "src/components/Dashboard.tsx",
      "line": 1,
      "component": "Dashboard"
    },
    "suggestion": "Split into DashboardHeader, DashboardStats, DashboardChart"
  }
]
```

---

## 配方 2: Extract Component

### 场景

从大型组件中提取独立子组件。

### 提示词模板

```
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
5. 处理事件传递

## 技术栈
${tech_stack} (React/Vue/Svelte)

## 输出格式
1. 新组件完整代码
2. 父组件修改后代码
3. Props 接口定义
```

---

## 配方 3: CSS 重构优化

### 场景

优化 CSS/样式代码，消除冗余。

### 提示词模板

```
## 任务
优化 CSS/样式代码。

## 目标文件
${style_files}

## 优化维度
1. 消除重复样式
2. 提取共享变量（颜色、间距、字体）
3. 优化选择器性能
4. 改进响应式断点
5. 统一命名规范（BEM/CSS Modules）

## 技术栈
${css_framework} (Tailwind/CSS Modules/Styled Components)

## 输出格式
1. 优化后的样式代码
2. 变更说明
3. 提取的变量/主题
```

---

## 配方 4: 响应式重构

### 场景

将固定布局重构为响应式设计。

### 提示词模板

```
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
5. 考虑横竖屏切换

## 输出格式
响应式组件代码 + 样式修改
```

---

## 配方 5: 可访问性重构

### 场景

提升组件的可访问性合规。

### 提示词模板

```
## 任务
提升组件可访问性。

## 目标组件
${target_component}

## 检查维度
1. ARIA 属性完整性
2. 键盘导航支持
3. 颜色对比度 (WCAG AA)
4. 屏幕阅读器兼容
5. 焦点管理
6. 表单标签关联

## 目标标准
WCAG 2.1 Level AA

## 输出格式
JSON：
{
  "issues": [
    {
      "type": "missing_aria",
      "element": "button",
      "line": 25,
      "fix": "Add aria-label"
    }
  ],
  "fixes": [...],
  "code_changes": "修改后的代码"
}
```

---

## 配方 6: 状态管理重构

### 场景

重构组件状态管理，减少复杂度。

### 提示词模板

```
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
5. 分离 UI 状态和业务状态

## 输出格式
1. 重构后的组件代码
2. 状态管理代码（如有新增）
3. 变更说明
```

---

## 配方 7: 遗留前端分析

### 场景

分析遗留前端系统架构。

### 提示词模板

```
## 角色
你是前端架构专家，精通 SPA 迁移和组件化重构。

## 任务
分析前端遗留代码，设计现代化方案。

## 源技术栈
${source_stack}

## 目标技术栈
${target_stack}

## 分析维度
1. 框架识别：jQuery/AngularJS/Backbone/其他
2. 组件结构：是否有组件化，组件粒度如何
3. 状态管理：全局状态 vs 组件状态
4. 构建工具：Grunt/Gulp/Webpack/None
5. 样式架构：全局 CSS/SASS/CSS-in-JS
6. 依赖分析：过时库和安全漏洞

## 输出格式
JSON：
{
  "framework": "jquery|angularjs|backbone|none",
  "component_maturity": "none|partial|full",
  "state_management": "global|mixed|component",
  "build_system": "none|grunt|gulp|webpack|vite",
  "css_architecture": "global|modular|css-in-js",
  "migration_complexity": "low|medium|high|critical"
}
```

---

## 会话管理

### 启动新会话

```bash
result=$(codeagent-wrapper gemini \
  --role frontend-refactor \
  --prompt "$PROMPT")
SESSION_ID=$(echo "$result" | grep SESSION_ID | cut -d= -f2)
```

### 继续会话

```bash
codeagent-wrapper gemini \
  --role frontend-refactor \
  --prompt "$FOLLOW_UP_PROMPT" \
  --session "$SESSION_ID"
```

---

## 上下文管理策略

### 32k Token 限制应对

| 策略            | 描述                      | 适用场景   |
| --------------- | ------------------------- | ---------- |
| Atomic Design   | 一次重构一个组件          | 组件拆分   |
| Interface First | 只传接口，不传实现        | 大型组件   |
| Multi-turn      | 结构 → 样式 → 交互 分步   | 复杂重构   |
| Session Reuse   | 使用 --session 保持上下文 | 多步骤任务 |

---

## 最佳实践

### DO

- ✅ 保存 SESSION_ID 以便后续追问
- ✅ Claude 必须审查所有原型后再应用
- ✅ 验证可访问性
- ✅ 保持样式一致性

### DON'T

- ❌ 不要超过 32k 上下文
- ❌ 不要直接使用原型不审查
- ❌ 不要忽略响应式需求
- ❌ 不要引入不兼容的样式框架

---

## 参考

- React Patterns - https://reactpatterns.com/
- Vue Style Guide - https://vuejs.org/style-guide/
- WCAG 2.1 Guidelines
- Atomic Design by Brad Frost
