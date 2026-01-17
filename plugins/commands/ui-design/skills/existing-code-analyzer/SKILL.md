---
name: existing-code-analyzer
description: |
  【触发条件】优化现有界面场景，分析现有代码的设计和 UX 问题
  【核心产出】输出 ${run_dir}/code-analysis.md
  【不触发】从零设计场景
  【先问什么】缺少代码文件路径时，询问：需要分析哪个文件/目录
allowed-tools: Read, Grep, Glob, LSP, mcp__auggie-mcp__codebase-retrieval, AskUserQuestion
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
  - name: target_path
    type: string
    required: false
    description: 要分析的代码路径（文件或目录）
---

# Existing Code Analyzer

## 职责边界

分析现有 UI/UX 代码，识别设计模式、样式系统、可访问性问题，为优化提供依据。

- **输入**: 代码文件路径（单个文件或目录）
- **输出**: `${run_dir}/code-analysis.md`
- **核心能力**: 代码理解、样式提取、UX 问题检测

---

## 执行流程

### Step 1: 定位目标代码

**策略 1：用户明确指定路径**

```
用户输入: "分析 src/components/Dashboard.tsx"
→ 直接使用 Read 工具读取
```

**策略 2：用户提供模糊描述**

```
用户输入: "分析登录页面的代码"
→ 使用 mcp__auggie-mcp__codebase-retrieval 搜索 "login page component"
→ 使用 Glob 查找匹配文件: "**/Login*.{tsx,jsx,vue}"
→ 列出候选文件，让用户确认
```

**策略 3：用户未指定**

```
→ 使用 AskUserQuestion 询问：
   "请提供需要分析的文件路径或目录"
```

### Step 2: 分析组件结构

使用 LSP 工具深入理解代码结构。

**LSP 操作序列**：

1. **documentSymbol**：获取文件符号列表（函数组件、Props 接口、State 变量）
2. **goToDefinition**：跟踪依赖（样式系统、设计 token）
3. **findReferences**：分析使用范围（局部组件 vs 全局组件）

**输出数据结构**：

```json
{
  "component_name": "Dashboard",
  "component_type": "FunctionComponent",
  "props": ["userId", "data", "onRefresh"],
  "state_variables": ["loading", "error"],
  "child_components": ["Header", "Chart", "Table"],
  "styling_approach": "Tailwind CSS",
  "dependencies": ["react", "recharts", "date-fns"],
  "usage_count": 3,
  "scope": "global"
}
```

### Step 3: 识别样式系统

**3.1 识别样式技术**

使用 Grep 搜索样式模式：

```bash
# Tailwind CSS
Grep: className=["'].*?["']

# CSS Modules
Grep: import.*\.module\.css

# Styled Components
Grep: styled\.[a-z]+`
```

**3.2 提取配色方案**

```typescript
// 查找配置文件
Glob: "**/{tailwind.config,theme,colors}.{js,ts}"

// 提取色值模式
Grep: (bg|text|border)-(red|blue|green|gray|...)
Grep: #[0-9A-Fa-f]{6}

// 统计高频色值 → 推断主色调/辅助色/强调色
```

**3.3 识别字体系统**

```typescript
Grep: font-(sans|serif|mono)
Grep: text-(xs|sm|base|lg|xl|2xl|...)
```

**输出数据结构**：

```json
{
  "styling_tech": "Tailwind CSS",
  "color_palette": {
    "primary": "#3B82F6",
    "secondary": "#8B5CF6",
    "background": "#FFFFFF",
    "text": "#1F2937"
  },
  "typography": {
    "primary_font": "Inter",
    "scale": ["12px", "14px", "16px", "18px", "24px", "30px"]
  }
}
```

### Step 4: 检测 UX 问题

扫描代码中的常见 UX 问题。

> 📚 完整检测规则见 [references/analysis-checklist.md](references/analysis-checklist.md#1-ux-问题检测规则)

**检测类别**：

| 类别 | 检测项示例 |
|------|-----------|
| 可访问性 | 缺少 alt、按钮无标签、颜色对比度不足 |
| 响应式 | 固定宽度、无断点、小字号 |
| 性能 | 大图片、内联 Base64、未优化列表 |
| 一致性 | 魔法数字、不一致间距、混用样式方案 |

### Step 5: 生成分析报告

**输出路径**：`${run_dir}/code-analysis.md`

> 📚 完整文档模板见 [references/analysis-checklist.md](references/analysis-checklist.md#2-输出文档模板)

**报告包含**：
- 分析概览（文件数、代码行数、主组件）
- 当前设计系统（样式技术、配色、字体）
- UX 问题清单（按优先级分组）
- 改进建议（可访问性、响应式、性能、一致性）
- 组件结构和依赖分析
- 影响范围评估

### Step 6: Gate 检查

**检查项**：

- [ ] 成功识别样式技术
- [ ] 提取了配色方案（至少主色调）
- [ ] 识别了字体系统
- [ ] 检测了至少 1 种 UX 问题类型

**通过标准**：至少 3 项检查通过

---

## 返回值

```json
{
  "status": "success",
  "output_file": "${run_dir}/code-analysis.md",
  "analyzed_files": ["src/components/Dashboard.tsx"],
  "summary": {
    "styling_tech": "Tailwind CSS",
    "primary_color": "#3B82F6",
    "total_issues": 12,
    "high_priority_issues": 3
  }
}
```

---

## 错误处理

- **文件不存在**：提示用户提供正确路径，或使用 codebase-retrieval 搜索
- **LSP 不可用**：降级为纯文本分析（Grep + Read）
- **无法识别样式系统**：标记为 "未识别"，建议人工检查

## 注意事项

1. **优先使用 LSP**：比 Grep 更准确，能理解代码语义
2. **避免误报**：对检测到的问题进行二次验证
3. **保持客观**：只报告事实问题，不做主观设计建议
4. **可追溯**：所有问题必须指向具体代码位置（file:line）
