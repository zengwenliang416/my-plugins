# Image Analysis Dimensions Reference

本文档包含图片分析的 8 个并行 Gemini 提示词模板和输出文档格式。

---

## 1. Gemini 提示词模板

### Round 1: 整体风格 + 布局

```
请分析这张设计图片：
你是一位资深 UI/UX 设计师。请仔细分析这张设计图片，提供详细信息：

## 整体风格
1. **界面类型**: 这是什么类型的界面？（网页、App、Dashboard、Landing Page、电商、后台管理、社交等）
2. **设计语言**: 使用了什么设计风格？（Material Design、Apple HIG、Fluent Design、扁平化、新拟态、玻璃拟态、暗黑模式等）
3. **视觉风格**: 是极简主义、信息密集型、还是装饰性的？
4. **品牌调性**: 专业商务、年轻活泼、高端奢华、科技感、亲和温暖？

## 页面布局
1. **整体结构**: 描述页面的布局结构（如：顶部导航 + 侧边栏 + 主内容区）
2. **栅格系统**: 看起来使用了几列布局？（2列、3列、12列栅格等）
3. **内容区域划分**: 列出所有可见的内容区域
4. **响应式特征**: 是否有响应式设计的迹象？

## 视觉层次
1. **主视觉焦点**: 页面中最突出的元素是什么？
2. **信息层级**: 信息是如何组织的？（F型、Z型、中心辐射等）
3. **留白策略**: 留白是紧凑还是宽松？

请用结构化格式详细回答。
```

---

### Round 2: 完整配色系统

```
请分析这张设计图的完整配色系统，请尽可能准确地识别所有颜色：

## 主要颜色（必须识别）
1. **主色（Primary）**: 品牌主色调（给出 HEX 值，如 #3B82F6）
2. **辅助色（Secondary）**: 次要颜色
3. **强调色（Accent）**: 用于 CTA 按钮、重要链接的颜色

## 中性色（必须识别）
4. **背景色**:
   - 页面主背景色
   - 卡片/模块背景色
   - 侧边栏背景色（如有）
5. **文字颜色**:
   - 主标题颜色
   - 正文颜色
   - 次要/辅助文字颜色
   - 链接颜色
6. **边框/分割线颜色**

## 功能色（如有）
7. **成功色（Success）**: 绿色系
8. **警告色（Warning）**: 黄/橙色系
9. **错误色（Error）**: 红色系
10. **信息色（Info）**: 蓝色系

## 配色方案分析
11. **配色类型**: 单色、互补色、类似色、三色、分裂互补？
12. **明暗模式**: 是亮色主题还是暗色主题？
13. **色彩心理**: 这套配色传达什么情感？

请用 HEX 格式给出所有颜色值，格式：#RRGGBB
```

---

### Round 3: 字体排版系统

```
请分析这张设计图的完整字体和排版系统：

## 字体识别
1. **主字体**: 看起来使用了什么字体？（Inter、Roboto、SF Pro、PingFang、思源黑体等）
2. **是否有多种字体**: 标题和正文是否使用不同字体？
3. **字体类型**: Sans-serif、Serif、等宽字体？

## 字体大小层级（估算 px 值）
- **超大标题（Hero）**: 如果有的话
- **H1 主标题**:
- **H2 副标题**:
- **H3 小标题**:
- **正文（Body）**:
- **小字（Small）**:
- **辅助文字（Caption）**:

## 字重使用
- **Bold/700**: 用在哪里？
- **Semibold/600**: 用在哪里？
- **Medium/500**: 用在哪里？
- **Regular/400**: 用在哪里？
- **Light/300**: 用在哪里？

## 行高和间距
- **行高比例**: 紧凑(1.2-1.3)、正常(1.4-1.5)、宽松(1.6-1.8)？
- **字间距**: 正常、略宽还是略窄？
- **段落间距**: 估算 px

## 文字样式
- **对齐方式**: 左对齐、居中、右对齐的使用场景
- **文字装饰**: 是否有下划线、删除线等
- **大小写**: 是否有全大写的使用

请给出尽可能准确的数值估算。
```

---

### Round 4: 间距系统

```
请详细分析这张设计图的间距系统：

## 基础间距单位
1. **基础单位**: 看起来使用了什么基础间距？（4px、8px、其他）
2. **间距倍数**: 间距是否遵循某种倍数规律？（如 4/8/12/16/24/32）

## 组件内部间距（Padding）
- **按钮内边距**: 水平/垂直
- **卡片内边距**: 上下左右
- **输入框内边距**: 水平/垂直
- **列表项内边距**:
- **表格单元格内边距**:

## 组件间距（Margin/Gap）
- **卡片之间的间距**:
- **列表项之间的间距**:
- **表单元素之间的间距**:
- **区块/模块之间的间距**:
- **栅格列间距（Gutter）**:

## 页面级间距
- **页面边距（Page Margin）**:
- **容器最大宽度**:
- **侧边栏宽度**:
- **顶部导航高度**:

## 间距规律总结
请归纳出间距的使用规律，例如：
- 小间距: 4px / 8px（元素内部、紧密关联）
- 中间距: 16px / 24px（组件间、卡片内）
- 大间距: 32px / 48px（区块间、页面边距）

请给出具体的 px 数值估算。
```

---

### Round 5: UI 组件识别

```
请详细分析这张设计图中的所有 UI 组件，列出你能看到的每一个组件：

## 导航组件
- 顶部导航栏（Header）: 高度、背景、Logo 位置、菜单项样式
- 侧边栏（Sidebar）: 宽度、折叠状态、菜单项样式
- 面包屑（Breadcrumb）
- 标签页（Tabs）
- 分页器（Pagination）

## 内容展示组件
- 卡片（Card）: 圆角大小、阴影深度、内边距、边框
- 列表（List）: 行高、分隔线、hover 效果
- 表格（Table）: 边框、斑马纹、表头样式
- 图表（Chart）: 类型、颜色、图例位置
- 头像（Avatar）: 形状、大小、边框
- 徽章（Badge）: 形状、大小、颜色

## 表单组件
- 输入框（Input）: 高度、圆角、边框颜色、placeholder 样式
- 按钮（Button）: 主要按钮、次要按钮、文字按钮的样式
- 选择器（Select/Dropdown）
- 复选框（Checkbox）
- 单选框（Radio）
- 开关（Switch）
- 日期选择器（DatePicker）

## 反馈组件
- 对话框（Modal/Dialog）
- 提示消息（Toast/Notification）
- 进度条（Progress）
- 加载状态（Loading/Spinner）
- 空状态（Empty State）

## 装饰元素
- 分割线样式
- 图片/插图风格
- 背景装饰（渐变、图案等）

对于每个组件，请描述其视觉样式（不含状态变化，状态在 Round 6 分析）。
```

---

### Round 6: 交互状态

```
请分析这张设计图中可能的交互状态：

## 按钮状态
1. **默认状态（Default）**: 正常显示的样式
2. **悬停状态（Hover）**: 鼠标悬停时的样式变化（颜色加深？阴影增加？）
3. **点击状态（Active/Pressed）**: 点击时的样式
4. **禁用状态（Disabled）**: 不可用时的样式（灰色？透明度降低？）
5. **加载状态（Loading）**: 正在处理时的样式

## 输入框状态
1. **默认状态**: 未聚焦时的边框、背景
2. **聚焦状态（Focus）**: 聚焦时的边框颜色、阴影
3. **错误状态（Error）**: 校验失败时的样式
4. **成功状态（Success）**: 校验通过时的样式
5. **禁用状态（Disabled）**: 不可编辑时的样式

## 链接/菜单项状态
1. **默认状态**:
2. **悬停状态（Hover）**:
3. **激活/选中状态（Active）**:
4. **已访问状态（Visited）**:

## 卡片/列表项状态
1. **默认状态**:
2. **悬停状态（Hover）**: 阴影变化？背景变化？
3. **选中状态（Selected）**:

## 反馈状态
1. **成功反馈**: 颜色、图标
2. **警告反馈**: 颜色、图标
3. **错误反馈**: 颜色、图标
4. **信息反馈**: 颜色、图标

请根据设计图的整体风格，推断可能的交互状态样式。如果图中没有明确显示，请基于设计一致性原则给出合理推断。
```

---

### Round 7: 图标系统

```
请分析这张设计图中的图标系统：

## 图标风格
1. **图标类型**: 线性图标、填充图标、双色图标、还是混合使用？
2. **图标粗细**: 细线(1px)、中等(1.5px)、粗线(2px)？
3. **图标圆角**: 直角、小圆角、大圆角？
4. **图标风格库**: 看起来像哪个图标库？（Heroicons、Lucide、Feather、Material Icons、FontAwesome 等）

## 图标列表
请列出你能看到的所有图标，包括：
- 导航图标（菜单、首页、设置等）
- 操作图标（编辑、删除、添加、搜索等）
- 状态图标（成功、警告、错误、信息等）
- 社交图标（如有）
- 其他功能图标

对于每个图标，描述：
- 图标名称/含义
- 大致尺寸
- 颜色

## 图标使用规范
1. **图标大小规范**: 使用了哪些尺寸？（16px、20px、24px、32px 等）
2. **图标颜色**: 单色还是多色？颜色值？
3. **图标与文字配合**: 图标在文字的哪个位置？间距多少？
```

---

### Round 8: 细节系统

```
请分析这张设计图的细节设计系统：

## 圆角系统（Border Radius）
1. **按钮圆角**: 估算 px 值
2. **卡片圆角**: 估算 px 值
3. **输入框圆角**: 估算 px 值
4. **头像圆角**: 完全圆形？还是圆角矩形？
5. **徽章/标签圆角**: 估算 px 值
6. **整体规律**: 是大圆角风格还是小圆角风格？

## 阴影系统（Box Shadow）
1. **卡片阴影**: 颜色、偏移、模糊度
2. **按钮阴影**: 是否有阴影？
3. **弹窗阴影**: 阴影层级
4. **悬停阴影**: 悬停时阴影是否加深？
5. **阴影颜色**: 纯黑色还是带色阴影？

## 边框系统（Border）
1. **边框粗细**: 1px？2px？
2. **边框颜色**: HEX 值
3. **边框样式**: 实线、虚线？
4. **哪些元素有边框**: 输入框、卡片、按钮？

## 透明度和层次
1. **是否使用透明度**: 遮罩层、毛玻璃效果？
2. **层次感**: 通过什么方式体现层次？（阴影、颜色深浅、边框）

## 特殊效果
1. **渐变**: 是否使用渐变？方向和颜色？
2. **毛玻璃**: 是否有 backdrop-blur 效果？
3. **动画暗示**: 是否有暗示动画的元素？

请给出具体的数值，方便转换为 CSS/Tailwind。
```

---

## 2. 输出文档模板

`${run_dir}/image-analysis.md` 使用以下结构：

```markdown
---
generated_at: {ISO 8601 时间戳}
analyzer_version: "2.0"
image_source: "${image_path}"
analysis_rounds: 8
---

# 图片设计分析报告

## 参考图片

原始文件: `${image_path}`
本地副本: `${run_dir}/reference-image.*`

## 1. 整体风格

**界面类型**: {Gemini Round 1 分析}
**设计语言**: {设计风格}
**视觉层次**: {层级组织}
**第一印象**: {情感关键词}

## 2. 配色系统

### 提取的颜色

| 用途 | 颜色值 | Tailwind 等效 | 预览 |
|------|--------|---------------|------|
| 主色 | #3B82F6 | blue-500 | ![](https://via.placeholder.com/20/3B82F6/3B82F6) |
| 辅助色 | #10B981 | emerald-500 | ![](https://via.placeholder.com/20/10B981/10B981) |
| 背景 | #F9FAFB | gray-50 | ![](https://via.placeholder.com/20/F9FAFB/F9FAFB) |
| 文字 | #111827 | gray-900 | ![](https://via.placeholder.com/20/111827/111827) |
| 强调 | #F59E0B | amber-500 | ![](https://via.placeholder.com/20/F59E0B/F59E0B) |

## 3. 字体排版

### 字体系统

| 层级 | 大小 | 字重 | 行高 | Tailwind |
|------|------|------|------|----------|
| H1 | 36px | Bold | 1.2 | text-4xl font-bold |
| H2 | 24px | Semibold | 1.3 | text-2xl font-semibold |
| H3 | 20px | Medium | 1.4 | text-xl font-medium |
| Body | 16px | Regular | 1.5 | text-base |
| Small | 14px | Regular | 1.5 | text-sm |
| Caption | 12px | Regular | 1.4 | text-xs |

## 4. 间距系统

### 间距规范

| 用途 | 数值 | Tailwind |
|------|------|----------|
| 基础单位 | 4px | 1 |
| 紧凑间距 | 8px | 2 |
| 标准间距 | 16px | 4 |
| 宽松间距 | 24px | 6 |
| 区块间距 | 32px | 8 |
| 页面边距 | 48px | 12 |

### 容器规格

- **最大宽度**: 1280px (max-w-7xl)
- **侧边栏宽度**: 240px
- **顶部导航高度**: 64px

## 5. 组件清单

### 识别到的组件

| 组件 | 描述 | 关键样式 |
|------|------|----------|
| Button | 主要操作按钮 | rounded-lg, shadow-sm, px-4 py-2 |
| Card | 内容卡片 | rounded-xl, shadow-md, p-6 |
| Input | 表单输入框 | rounded-md, border, px-3 py-2 |
| Avatar | 用户头像 | rounded-full, w-10 h-10 |
| Badge | 标签徽章 | rounded-full, px-2 py-1, text-xs |

## 6. 交互状态

### 按钮状态

| 状态 | 样式变化 |
|------|----------|
| Default | bg-primary text-white |
| Hover | bg-primary-600 (加深 10%) |
| Active | bg-primary-700 (加深 20%) |
| Disabled | opacity-50 cursor-not-allowed |
| Loading | opacity-70 + spinner |

### 输入框状态

| 状态 | 样式变化 |
|------|----------|
| Default | border-gray-300 |
| Focus | border-primary ring-2 ring-primary/20 |
| Error | border-red-500 ring-2 ring-red/20 |
| Disabled | bg-gray-100 cursor-not-allowed |

## 7. 图标系统

### 图标风格

| 属性 | 值 |
|------|-----|
| 类型 | 线性图标 |
| 粗细 | 1.5px |
| 圆角 | 圆角 |
| 推荐库 | Lucide / Heroicons |

### 图标尺寸规范

| 用途 | 尺寸 | Tailwind |
|------|------|----------|
| 小图标 | 16px | w-4 h-4 |
| 默认图标 | 20px | w-5 h-5 |
| 中等图标 | 24px | w-6 h-6 |
| 大图标 | 32px | w-8 h-8 |

## 8. 细节系统

### 圆角规范

| 元素 | 圆角 | Tailwind |
|------|------|----------|
| 按钮 | 8px | rounded-lg |
| 卡片 | 12px | rounded-xl |
| 输入框 | 6px | rounded-md |
| 头像 | 9999px | rounded-full |
| 徽章 | 9999px | rounded-full |

### 阴影规范

| 层级 | 阴影值 | Tailwind |
|------|--------|----------|
| 轻微 | 0 1px 2px rgba(0,0,0,0.05) | shadow-sm |
| 标准 | 0 4px 6px rgba(0,0,0,0.1) | shadow-md |
| 强调 | 0 10px 15px rgba(0,0,0,0.1) | shadow-lg |

### 边框规范

| 元素 | 边框 | Tailwind |
|------|------|----------|
| 输入框 | 1px solid #D1D5DB | border border-gray-300 |
| 卡片 | 无 | - |
| 分割线 | 1px solid #E5E7EB | border-t border-gray-200 |

## 9. 设计 Token 总结

\`\`\`json
{
  "colors": {
    "primary": "#3B82F6",
    "secondary": "#10B981",
    "background": "#F9FAFB",
    "foreground": "#111827",
    "muted": "#6B7280",
    "accent": "#F59E0B",
    "success": "#10B981",
    "warning": "#F59E0B",
    "error": "#EF4444"
  },
  "typography": {
    "fontFamily": "Inter, sans-serif",
    "sizes": {
      "h1": "2.25rem",
      "h2": "1.5rem",
      "h3": "1.25rem",
      "body": "1rem",
      "small": "0.875rem"
    }
  },
  "spacing": {
    "unit": "4px",
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px",
    "2xl": "48px"
  },
  "borderRadius": {
    "sm": "0.25rem",
    "md": "0.375rem",
    "lg": "0.5rem",
    "xl": "0.75rem",
    "2xl": "1rem",
    "full": "9999px"
  },
  "shadows": {
    "sm": "0 1px 2px rgba(0,0,0,0.05)",
    "md": "0 4px 6px rgba(0,0,0,0.1)",
    "lg": "0 10px 15px rgba(0,0,0,0.1)"
  }
}
\`\`\`

## 10. Gemini 分析原始记录

<details>
<summary>Round 1: 整体风格 + 布局</summary>

${gemini_round1}

</details>

<details>
<summary>Round 2: 配色系统</summary>

${gemini_round2}

</details>

<details>
<summary>Round 3: 字体排版</summary>

${gemini_round3}

</details>

<details>
<summary>Round 4: 间距系统</summary>

${gemini_round4}

</details>

<details>
<summary>Round 5: UI 组件</summary>

${gemini_round5}

</details>

<details>
<summary>Round 6: 交互状态</summary>

${gemini_round6}

</details>

<details>
<summary>Round 7: 图标系统</summary>

${gemini_round7}

</details>

<details>
<summary>Round 8: 细节系统</summary>

${gemini_round8}

</details>
```

---

## 3. Claude 综合分析要点

Claude 根据 Gemini 的 8 个并行分析结果，需要进行：

1. **验证一致性**: 检查 8 个分析结果是否互相一致
2. **补充细节**: 对模糊的描述进行具体化
3. **转换为可执行规格**: 将描述转换为 Tailwind/CSS 可用的值
4. **识别设计模式**: 归纳出可复用的设计模式
5. **推荐图标库**: 根据图标风格推荐最匹配的图标库
6. **构建 Design Token**: 整合所有分析结果为可用的设计令牌

**Claude 分析框架**：

```
根据 Gemini 的 8 个并行分析，我来总结并转换为可执行的设计规格：

1. 配色方案（Tailwind 格式）:
   - primary: → closest Tailwind color
   - secondary: ...
   - background: ...
   - foreground: ...
   - success/warning/error/info: ...

2. 字体规格（Tailwind 格式）:
   - fontFamily: ['Inter', 'sans-serif'] 或类似
   - fontSize: { xs: '0.75rem', sm: '0.875rem', base: '1rem', ... }
   - fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 }

3. 间距系统:
   - 基础单位: 4px
   - 间距梯度: 4/8/16/24/32/48
   - 容器宽度: max-w-7xl

4. 组件清单:
   - 需要实现的组件列表
   - 每个组件的关键样式特征
   - Tailwind 类名建议

5. 交互状态:
   - 按钮状态变化
   - 输入框状态变化
   - 悬停/激活效果

6. 图标系统:
   - 推荐图标库: Lucide / Heroicons / ...
   - 图标尺寸规范: { sm: 16, md: 20, lg: 24 }
   - 图标颜色: currentColor / 具体颜色

7. 细节系统:
   - 圆角规范
   - 阴影规范
   - 边框规范

8. 布局规格:
   - 容器宽度
   - 间距系统
   - 栅格系统
```
