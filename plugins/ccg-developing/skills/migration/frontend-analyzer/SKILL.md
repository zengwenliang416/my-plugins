---
name: frontend-analyzer
description: |
  【触发条件】分析前端代码结构和质量时使用（必须调用 Gemini）
  【核心产出】${run_dir}/analysis/frontend-analysis.md
  【不触发】后端分析、纯 API 项目
allowed-tools: Task, Read, Write, Bash
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
---

# Frontend Analyzer - 前端分析器

## 职责边界

- **输入**: `.claude/migration/context/tech-stack.json` + 项目根路径
- **输出**: `.claude/migration/analysis/frontend-analysis.md`
- **核心能力**: UI 组件分析、性能评估、用户体验优化建议（委托 Gemini）

## 执行流程

### Step 1: 准备分析上下文

```bash
# 读取技术栈信息
tech_stack=$(cat .claude/migration/context/tech-stack.json)
frontend_framework=$(jq -r '.frameworks.frontend[0].name // "None"' <<< "$tech_stack")
frontend_version=$(jq -r '.frameworks.frontend[0].version // "N/A"' <<< "$tech_stack")

# 判断是否有前端
if [ "$frontend_framework" = "None" ] || [ "$frontend_framework" = "null" ]; then
  echo "⚠️ 未检测到前端框架，跳过前端分析"
  exit 0
fi

# 识别前端类型
case "$frontend_framework" in
  "React")
    focus_areas="组件设计,Hooks使用,性能优化,状态管理"
    key_files="src/components/**/*.{jsx,tsx},src/pages/**/*.{jsx,tsx}"
    ;;
  "Vue.js"|"Vue")
    focus_areas="组件设计,Composition API,响应式,Vuex/Pinia"
    key_files="src/components/**/*.vue,src/views/**/*.vue"
    ;;
  "Angular")
    focus_areas="模块设计,RxJS,依赖注入,组件生命周期"
    key_files="src/app/**/*.component.ts,src/app/**/*.html"
    ;;
  "JSP"|"Thymeleaf"|"EJS")
    focus_areas="模板结构,XSS防护,前后端分离建议"
    key_files="src/main/webapp/**/*.jsp,templates/**/*.html"
    ;;
  *)
    focus_areas="HTML结构,CSS组织,JavaScript模块化"
    key_files="*.html,*.css,*.js"
    ;;
esac

# 统计前端文件
frontend_files=$(find . -name "*.jsx" -o -name "*.tsx" -o -name "*.vue" -o -name "*.jsp" 2>/dev/null | wc -l)
if [ "$frontend_files" -eq 0 ]; then
  echo "⚠️ 未检测到前端文件，跳过前端分析"
  exit 0
fi

echo "检测到前端文件: $frontend_files 个"
project_root=$(pwd)
```

### Step 2: 调用 Gemini 进行前端分析

**强制使用 gemini-cli**（后台执行）：

```bash
# 构造分析提示词
analysis_prompt=$(cat <<EOF
【任务】：分析前端代码的结构、性能和用户体验

【上下文】：
- 框架: ${frontend_framework} ${frontend_version}
- 项目路径: ${project_root}
- 文件数量: ${frontend_files} 个

【分析维度】：

## 1. 组件设计分析
- 组件职责划分（展示型 vs 容器型）
- 组件复用性评估
- Props 设计合理性
- 组件层级深度（>5 层警告）

## 2. 性能问题
**React 特定**：
- 未使用 useMemo/useCallback 导致重复渲染
- 大列表未使用虚拟化（react-window/react-virtualized）
- useEffect 依赖数组问题

**Vue 特定**：
- v-for 未使用 key 或 key 不唯一
- 计算属性 vs 方法使用不当
- 响应式数据过度嵌套

**通用问题**：
- 图片未优化（尺寸、格式）
- 未使用懒加载
- CSS/JS 资源未压缩
- 未实现代码分割

## 3. 状态管理
**React**：
- Redux/Zustand/Context 使用规范性
- 全局状态 vs 局部状态设计
- 异步数据处理模式

**Vue**：
- Vuex/Pinia store 设计
- 模块化程度
- Getters/Actions 使用

## 4. 样式设计
- CSS 组织方式（CSS Modules/Styled Components/Tailwind）
- 响应式设计实现（媒体查询、Flex/Grid）
- 主题切换支持
- CSS 冗余和重复

## 5. 用户体验
- 加载状态反馈（Loading/Skeleton）
- 错误处理展示
- 表单验证体验
- 无障碍支持（ARIA）
- 移动端适配

## 6. 代码质量
- TypeScript 使用情况（类型覆盖率）
- ESLint 规则遵守情况
- 组件平均行数
- 单元测试覆盖率

【输出格式】：
Markdown 文档，包含：
1. 前端技术栈概览
2. UI 组件结构（组件树）
3. 性能问题列表（**必须附带** 文件路径:行号）
4. 用户体验改进建议
5. 代码质量评分（1-5 星）
6. 现代化迁移建议

【要求】：
- 所有问题必须附带具体位置
- 性能问题需给出具体优化方案
- 用户体验建议基于行业最佳实践
EOF
)

# 调用 Gemini（后台执行）
Task(
  skill: "gemini-cli",
  description: "Frontend architecture analysis",
  run_in_background: true,
  prompt: "$analysis_prompt"
)

# 保存任务 ID
task_id=$!
echo "$task_id" > .claude/migration/tmp/frontend-analysis-task-id.txt
```

### Step 3: 等待 Gemini 完成并获取结果

```bash
# 读取任务 ID
task_id=$(cat .claude/migration/tmp/frontend-analysis-task-id.txt)

# 等待任务完成（阻塞，失败时重试）
max_retries=3
retry_count=0

while [ $retry_count -lt $max_retries ]; do
  gemini_output=$(TaskOutput(task_id: "$task_id", block: true, timeout: 600000))

  if [ -n "$gemini_output" ]; then
    break
  fi

  retry_count=$((retry_count + 1))
  echo "⚠️ 第 $retry_count 次重试 Gemini 分析..."
  sleep 10
done

# 重试失败后终止
if [ -z "$gemini_output" ]; then
  echo "❌ 重试 $max_retries 次后仍失败，终止分析"
  exit 1
fi

# 保存原始输出
mkdir -p .claude/migration/analysis/raw
echo "$gemini_output" > .claude/migration/analysis/raw/frontend-analysis-gemini.md
```

### Step 4: Claude 重构和补充

```bash
# Claude 负责：
# 1. 验证 Gemini 输出的准确性
# 2. 补充性能优化具体方案
# 3. 统一术语和格式
# 4. 确保建议可操作

# 提取关键指标
component_count=$(echo "$gemini_output" | grep -oE "组件数量[：:] *[0-9]+" | grep -oE "[0-9]+" | head -1)
performance_issues=$(echo "$gemini_output" | grep -c "性能问题")
ux_issues=$(echo "$gemini_output" | grep -c "用户体验")

# 验证关键指标
if [ -z "$component_count" ]; then
  echo "⚠️ 警告：Gemini 未统计组件数量"
fi
```

### Step 5: 生成最终分析报告

```bash
# 创建分析目录
mkdir -p .claude/migration/analysis

# 写入最终报告
cat > .claude/migration/analysis/frontend-analysis.md <<EOF
# 前端架构分析报告

> 分析对象: ${project_name} (${frontend_framework} ${frontend_version})
> 生成时间: $(date '+%Y-%m-%d %H:%M:%S')
> 分析工具: Gemini + ${linting_tools}

## 技术栈概览

### 核心框架

- **框架**: ${frontend_framework} ${frontend_version}
- **状态管理**: ${state_management}
- **样式方案**: ${styling_solution}
- **构建工具**: ${build_tool}

### 组件统计

| 指标           | 数值           | 评估     |
| -------------- | -------------- | -------- |
| 总组件数       | ${count}       | -        |
| 平均组件行数   | ${avg_lines}   | ${level} |
| 最大组件行数   | ${max_lines}   | ${level} |
| TypeScript 占比| ${ts_percent}% | ${level} |

## 组件结构

### 组件树（核心路由）

\`\`\`
${component_tree}
\`\`\`

### 组件分类

${component_categories}

## 性能问题

### 严重问题

${performance_critical}

### 优化建议

${performance_suggestions}

## 用户体验评估

**总体评分**: ${ux_stars} (${ux_score}/5)

### 优势

${ux_pros}

### 改进点

${ux_improvements}

## 代码质量

**总体评分**: ${quality_stars} (${quality_score}/5)

### 优势

${quality_pros}

### 改进点

${quality_improvements}

## 现代化迁移建议

### 阶段一：性能优化（2-4 周）

${phase1_tasks}

### 阶段二：代码重构（1-2 个月）

${phase2_tasks}

### 阶段三：技术升级（2-3 个月）

${phase3_tasks}

---

**文档版本**: 1.0
**数据来源**: Gemini 深度分析 + Claude 重构
**下次更新**: UI 重构完成后
EOF

echo "✅ 前端分析报告已生成: .claude/migration/analysis/frontend-analysis.md"
```

## React 项目输出示例（精简版）

````markdown
# 前端架构分析报告

> 分析对象: Admin Dashboard (React 17.0.2)

## 技术栈概览

- **框架**: React 17.0.2 ⚠️ (推荐升级到 18.x)
- **状态管理**: Redux + Redux Toolkit
- **样式方案**: CSS Modules + Ant Design
- **构建工具**: Webpack 5

### 组件统计

| 指标            | 数值 | 评估    |
| --------------- | ---- | ------- |
| 总组件数        | 87   | -       |
| 平均组件行数    | 156  | 偏高    |
| 最大组件行数    | 487  | ⚠️ 过大 |
| TypeScript 占比 | 35%  | ⚠️ 偏低 |

## 性能问题

### P0-001: 大列表未虚拟化

- **文件**: `src/components/UserTable.jsx:45`
- **问题**: 渲染 1000+ 行数据未使用虚拟滚动
- **影响**: 初次渲染耗时 >3s
- **修复**: 使用 react-window

  ```jsx
  import { FixedSizeList } from "react-window";

  <FixedSizeList height={600} itemCount={users.length} itemSize={50}>
    {Row}
  </FixedSizeList>;
  ```
````

### P0-002: 缺少 useMemo 导致重复计算

- **文件**: `src/components/Dashboard.jsx:78`
- **问题**: 每次渲染都重新计算统计数据
- **修复**: 使用 useMemo
  ```jsx
  const stats = useMemo(() => calculateStats(data), [data]);
  ```

## 用户体验评估

**总体评分**: ⭐⭐⭐⭐ (4/5)

### 优势

✅ 响应式设计良好，支持移动端
✅ 加载状态反馈完整

### 改进点

1. **表单验证反馈不及时**：部分表单失焦才显示错误
2. **缺少骨架屏**：数据加载时显示空白
3. **错误边界缺失**：组件错误导致整个应用崩溃

## 现代化迁移建议

### 阶段一：性能优化（2-4 周）

- 大列表添加虚拟滚动
- 关键组件添加 useMemo/useCallback
- 图片懒加载 + WebP 格式

### 阶段二：代码重构（1-2 个月）

- 拆分大组件（>300 行）
- 迁移到 TypeScript（目标 80%+）
- 统一状态管理模式

### 阶段三：技术升级（2-3 个月）

- React 17 → React 18（Concurrent Mode）
- Webpack → Vite（开发体验提升）
- 引入 React Query（数据获取）

````

## JSP 老旧项目输出示例

```markdown
# 前端架构分析报告

> 分析对象: Legacy ERP (JSP + jQuery 1.12)

## 技术栈概览

- **视图技术**: JSP ⚠️ (强烈建议前后端分离)
- **前端库**: jQuery 1.12 ⚠️ (EOL: 2016)
- **样式**: Bootstrap 3

### 文件统计

| 指标       | 数值 | 评估     |
| ---------- | ---- | -------- |
| JSP 文件   | 234  | -        |
| 平均行数   | 487  | ⚠️ 过大  |
| JavaScript | 混写 | ⚠️ 难维护|

## 严重问题

### P0-001: XSS 漏洞风险

- **文件**: `src/main/webapp/user/list.jsp:89`
- **问题**: 直接输出用户输入未转义
- **代码**: `<div>${user.name}</div>`
- **修复**: 使用 `<c:out value="${user.name}" />`

### P0-002: 前后端耦合严重

- **影响**: 无法独立开发和部署
- **修复**: 迁移到 RESTful API + React/Vue

## 现代化迁移建议

### 阶段一：安全修复（1 周）

- 修复所有 XSS 漏洞
- 添加 CSRF Token

### 阶段二：前后端分离准备（1 个月）

- 后端暴露 RESTful API
- 前端改为 AJAX 调用

### 阶段三：前端重写（3-6 个月）

- JSP → React 18 + Ant Design
- jQuery → React Hooks
- Bootstrap 3 → Tailwind CSS
````

## Gate 检查

- [x] Gemini 已成功返回分析结果
- [x] 组件数量统计完整
- [x] 性能问题包含 `文件路径:行号` 和具体优化方案
- [x] 用户体验评分基于行业标准
- [x] 迁移建议分阶段且技术栈明确
- [x] 老旧技术（JSP/jQuery）有特殊处理

**失败处理**: 如果 Gemini 超时或失败，自动重试最多 3 次（每次间隔 10 秒），全部失败后终止分析

## 返回值

```json
{
  "status": "success",
  "analysis_file": ".claude/migration/analysis/frontend-analysis.md",
  "summary": {
    "framework": "React 17.0.2",
    "component_count": 87,
    "performance_issues": 5,
    "ux_score": 4,
    "primary_recommendation": "React 17 → 18 + 性能优化"
  },
  "gemini_session_id": "saved_in_state_file"
}
```

## 多框架支持

| 框架     | 分析重点                 | 检测工具               |
| -------- | ------------------------ | ---------------------- |
| React    | Hooks、性能、状态管理    | ESLint, React DevTools |
| Vue.js   | 响应式、Composition API  | Vue DevTools           |
| Angular  | RxJS、依赖注入、模块设计 | TSLint                 |
| JSP/老旧 | XSS防护、前后端分离建议  | OWASP ZAP              |

## 并行执行支持

```bash
# 在 Phase 3 中与 backend-analyzer、dependency-mapper 并行执行
Task(skill="backend-analyzer", run_in_background=true)
Task(skill="frontend-analyzer", run_in_background=true)
Task(skill="dependency-mapper", run_in_background=true)

# 等待全部完成
wait_all_tasks()
```
