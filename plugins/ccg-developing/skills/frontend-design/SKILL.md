---
name: frontend-design
description: |
  【触发条件】当用户要求构建网页组件、页面、仪表盘、着陆页、UI 设计时使用。
  【触发关键词】网站、页面、仪表盘、React、HTML、CSS、UI、Tailwind、组件、界面
  【核心能力】数据库驱动的设计决策 + 多技术栈支持 + 专业质量检查
  【不触发】纯后端逻辑、API 开发、数据库设计
  【先问什么】若缺少：产品类型、设计风格偏好、技术栈，先提问补齐
---

# Frontend Design

创建独特、生产级的前端界面，**数据库驱动** + **严格避免 AI 通用美学**。

## 工作流程

```
1. 分析需求 → 2. 搜索设计库 → 3. 生成代码 → 4. 质量检查
```

### Step 1: 分析需求

从用户请求中提取：

| 维度       | 提取内容                     | 默认值        |
| ---------- | ---------------------------- | ------------- |
| 产品类型   | SaaS/电商/金融/医疗/教育/... | 通用 Web      |
| 风格关键词 | 极简/毛玻璃/野兽派/暗黑/...  | 现代极简      |
| 技术栈     | React/Vue/Next.js/Svelte/... | html-tailwind |
| 特殊需求   | 暗色模式/响应式/动画/...     | 响应式        |

### Step 2: 搜索设计库

运行搜索脚本查询相关设计资源：

```bash
npx tsx scripts/search_design.ts --help
npx tsx scripts/search_design.ts --query "SaaS dashboard glassmorphism"
npx tsx scripts/search_design.ts --domain style --query "dark mode"
npx tsx scripts/search_design.ts --domain color --industry fintech
```

**可搜索领域**：

- `style` - 57 种 UI 风格（毛玻璃、野兽派、便当盒布局...）
- `color` - 95 套行业配色方案
- `typography` - 56 组字体搭配
- `component` - 常用组件模式
- `animation` - 动效指南
- `stack` - 技术栈实现指南

### Step 3: 生成代码

根据搜索结果 + 技术栈指南生成代码。

**技术栈指南**：读取 `references/stack-guidelines.md`

**代码规范**：

- 使用 SVG 图标，禁止 emoji
- 确保对比度（亮色/暗色模式）
- 交互元素添加 cursor 反馈
- 防止 hover 时布局抖动

### Step 4: 质量检查

交付前必须通过检查清单：读取 `references/quality-checklist.md`

---

## 设计禁区（AI 通用美学）

| 类别 | 禁用元素                                |
| ---- | --------------------------------------- |
| 字体 | Inter, Roboto, Arial, system-ui 默认    |
| 颜色 | 紫色渐变 + 白底、千篇一律的 primary-500 |
| 布局 | 居中卡片 + 大圆角 + 浅阴影、对称三列    |
| 动效 | 统一 300ms ease-in-out、hover:scale-105 |

---

## 快速决策入口

**问**：什么类型的产品？

- SaaS/开发者工具 → Dark Mode First / Terminal UI
- 电商/消费品 → Bento Grid / Organic Shapes
- 金融/企业 → 极简专业 / Editorial
- 创意/独立 → Neubrutalism / 大胆撞色

**问**：需要什么风格？

- 现代科技感 → 读 `design-database.md#glassmorphism`
- 大胆有个性 → 读 `design-database.md#neubrutalism`
- 内容优先 → 读 `design-database.md#editorial`
- 开发者向 → 读 `design-database.md#terminal-ui`

---

## 参考文档导航

| 需要               | 读取                              |
| ------------------ | --------------------------------- |
| 风格/配色/字体详情 | `references/design-database.md`   |
| 技术栈实现代码     | `references/stack-guidelines.md`  |
| 交付前检查         | `references/quality-checklist.md` |
| 搜索设计资源       | `scripts/search_design.ts --help` |

---

## 核心原则

1. **数据驱动** - 先搜索设计库，再做决策
2. **风格统一** - 选定方向后贯彻到底
3. **细节精致** - 间距、对齐、过渡都要打磨
4. **拒绝平庸** - 宁可大胆出错，不要 AI 通用风
