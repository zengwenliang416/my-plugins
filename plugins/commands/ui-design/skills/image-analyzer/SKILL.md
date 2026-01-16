---
name: image-analyzer
description: |
  【触发条件】UI/UX 设计工作流：用户提供参考图片时，使用 Gemini 分析图片设计元素
  【核心产出】输出 ${run_dir}/image-analysis.md，包含图片设计分析（颜色、布局、字体、组件）
  【不触发】没有提供图片的场景
  【🚨 强制】必须使用 gemini 命令 skill 分析图片，不可跳过
  【依赖】gemini 命令（参考 skills/gemini-cli/references/recipes.md）
allowed-tools:
  - Read
  - Write
  - Bash
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 command 传入）
  - name: image_path
    type: string
    required: true
    description: 参考图片的绝对路径
---

# Image Analyzer - 图片设计分析技能

## 🚨🚨🚨 强制执行规则（不可跳过）

**此 Skill 必须使用 gemini 命令 分析图片**

**禁止以下行为：**
- ❌ 跳过 gemini 命令调用
- ❌ 自己猜测图片内容
- ❌ 不进行多轮分析
- ❌ 只做一次分析就结束

**必须遵守：**
- ✅ 使用 `gemini` 命令 进行图片分析
- ✅ 参考 `skills/gemini-cli/references/recipes.md` 中的 prompt 配方
- ✅ 进行至少 5 轮 Gemini 分析
- ✅ 保存 SESSION_ID 用于多轮对话
- ✅ 生成结构化分析文档

---

## 职责边界

- **输入**: 图片文件路径
- **输出**: `${run_dir}/image-analysis.md`
- **核心能力**: 编排 gemini 多轮视觉分析 + 设计元素整合
- **依赖**: `gemini` 命令（参考其 recipes.md 获取 prompt 模板）

---

## 执行流程

### Step 1: 验证图片文件

```bash
# 检查图片文件是否存在
if [ ! -f "${image_path}" ]; then
    echo "❌ 错误: 图片文件不存在: ${image_path}"
    exit 1
fi

# 检查文件类型
file_type=$(file --mime-type -b "${image_path}")
if [[ ! "$file_type" =~ ^image/ ]]; then
    echo "❌ 错误: 不是有效的图片文件: ${file_type}"
    exit 1
fi

# 复制图片到运行目录
cp "${image_path}" "${run_dir}/reference-image.$(basename ${image_path##*.})"
```

### Step 2: 🚨 第一轮分析（整体风格 + 布局）

**使用 gemini 命令**（参考 recipes.md 配方 1）：

```bash
gemini "请分析这张设计图片 ${image_path}：
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
"
```

**记录返回值**：保存 `SESSION_ID` 和分析结果到 `gemini_round1`

### Step 3: 🚨 第二轮 Gemini 分析（完整配色系统）

**基于第一轮回答，继续深入分析配色**：

```bash
gemini "请继续分析这张图片 ${image_path}：
继续分析这张设计图的完整配色系统，请尽可能准确地识别所有颜色：

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

## 渐变和特效（如有）
11. **渐变**: 是否使用了渐变？方向和颜色是什么？
12. **阴影颜色**: 阴影是什么颜色和透明度？
13. **玻璃效果**: 是否有毛玻璃/半透明效果？

## 配色方案分析
14. **配色类型**: 单色、互补色、类似色、三色、分裂互补？
15. **明暗模式**: 是亮色主题还是暗色主题？
16. **色彩心理**: 这套配色传达什么情感？

请用 HEX 格式给出所有颜色值，格式：#RRGGBB
"
```

**记录 Gemini 回答**：保存到变量 `gemini_round2`

### Step 4: 🚨 第三轮 Gemini 分析（UI 组件详细识别）

**继续识别所有 UI 组件**：

```bash
gemini "请继续分析这张图片 ${image_path}：
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

对于每个组件，请描述：
1. 具体样式（圆角 px、阴影层级、边框粗细）
2. 颜色使用
3. 大致尺寸
4. 状态变化（hover、active、disabled 如果可见）
"
```

**记录 Gemini 回答**：保存到变量 `gemini_round3`

### Step 5: 🚨 第四轮 Gemini 分析（字体排版系统）

**分析字体和排版**：

```bash
gemini "请继续分析这张图片 ${image_path}：
继续分析这张设计图的完整字体和排版系统：

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
"
```

**记录 Gemini 回答**：保存到变量 `gemini_round4`

### Step 6: 🚨 第五轮 Gemini 分析（图标系统）

**分析图标风格**：

```bash
gemini "请继续分析这张图片 ${image_path}：
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
"
```

**记录 Gemini 回答**：保存到变量 `gemini_round5`

### Step 7: Claude 综合分析（多轮讨论总结）

**Claude 根据 Gemini 的 5 轮分析，进行总结和补充**：

基于 Gemini 的分析结果，Claude 需要：

1. **验证一致性**: 检查 Gemini 的回答是否前后一致
2. **补充细节**: 对模糊的描述进行具体化
3. **转换为可执行规格**: 将描述转换为 Tailwind/CSS 可用的值
4. **识别设计模式**: 归纳出可复用的设计模式
5. **推荐图标库**: 根据图标风格推荐最匹配的图标库

**Claude 分析要点**：

```
根据 Gemini 的 5 轮分析，我来总结并转换为可执行的设计规格：

1. 配色方案（Tailwind 格式）:
   - primary: ${gemini_color_primary} → closest Tailwind color
   - secondary: ...
   - background: ...
   - foreground: ...
   - success/warning/error/info: ...

2. 字体规格（Tailwind 格式）:
   - fontFamily: ['Inter', 'sans-serif'] 或类似
   - fontSize: { xs: '0.75rem', sm: '0.875rem', base: '1rem', ... }
   - fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 }

3. 组件清单:
   - 需要实现的组件列表
   - 每个组件的关键样式特征
   - Tailwind 类名建议

4. 图标系统:
   - 推荐图标库: Lucide / Heroicons / ...
   - 图标尺寸规范: { sm: 16, md: 20, lg: 24 }
   - 图标颜色: currentColor / 具体颜色

5. 布局规格:
   - 容器宽度
   - 间距系统
   - 栅格系统
```

### Step 8: 生成分析文档

**使用 Write 工具输出 `${run_dir}/image-analysis.md`**：

```markdown
---
generated_at: {ISO 8601 时间戳}
analyzer_version: "1.0"
image_source: "${image_path}"
analysis_rounds: 5
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

### Tailwind 配置建议

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          50: '#EFF6FF',
          // ... 完整色阶
        },
        // ...
      }
    }
  }
}
```

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

### 字体推荐

- **首选**: Inter, -apple-system, BlinkMacSystemFont
- **备选**: Segoe UI, Roboto, Helvetica Neue

## 4. 组件清单

### 识别到的组件

| 组件 | 描述 | 关键样式 |
|------|------|----------|
| Button | 主要操作按钮 | rounded-lg, shadow-sm, px-4 py-2 |
| Card | 内容卡片 | rounded-xl, shadow-md, p-6 |
| Input | 表单输入框 | rounded-md, border, px-3 py-2 |
| Avatar | 用户头像 | rounded-full, w-10 h-10 |
| Badge | 标签徽章 | rounded-full, px-2 py-1, text-xs |
| ... | ... | ... |

### 组件样式特征

- **圆角风格**: {大圆角/小圆角/直角}
- **阴影使用**: {重阴影/轻阴影/无阴影}
- **边框风格**: {有边框/无边框}
- **间距特征**: {紧凑/宽松}

## 5. 布局规格

### 页面结构

```
┌────────────────────────────────────┐
│              Header                │ 64px
├────────────────────────────────────┤
│  Sidebar  │       Content          │
│   240px   │       flex-1           │
│           │                        │
│           │                        │
└───────────┴────────────────────────┘
```

### 间距系统

- **基础单位**: 4px (Tailwind 默认)
- **组件间距**: 16px / 24px / 32px
- **内边距**: 16px / 24px
- **栅格间隙**: 24px

## 5.5 图标系统

### 图标风格

| 属性 | 值 | 说明 |
|------|-----|------|
| 类型 | 线性图标 / 填充图标 | 主要图标类型 |
| 粗细 | 1.5px | 线条粗细 |
| 圆角 | 圆角 | 图标内部圆角 |
| 推荐库 | Lucide / Heroicons | 最匹配的图标库 |

### 图标尺寸规范

| 用途 | 尺寸 | Tailwind |
|------|------|----------|
| 小图标 | 16px | w-4 h-4 |
| 默认图标 | 20px | w-5 h-5 |
| 中等图标 | 24px | w-6 h-6 |
| 大图标 | 32px | w-8 h-8 |

### 识别到的图标列表

| 图标名称 | 位置 | 尺寸 | 颜色 |
|----------|------|------|------|
| 菜单 | 导航栏 | 24px | gray-600 |
| 搜索 | 顶部栏 | 20px | gray-500 |
| 设置 | 侧边栏 | 20px | gray-600 |
| ... | ... | ... | ... |

### 图标库安装建议

```bash
# 推荐: Lucide React
npm install lucide-react

# 或: Heroicons
npm install @heroicons/react
```

## 6. 设计 Token 总结

```json
{
  "colors": {
    "primary": "#3B82F6",
    "secondary": "#10B981",
    "background": "#F9FAFB",
    "foreground": "#111827",
    "muted": "#6B7280",
    "accent": "#F59E0B"
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
    "component": "16px",
    "section": "32px"
  },
  "borderRadius": {
    "sm": "0.25rem",
    "md": "0.5rem",
    "lg": "0.75rem",
    "xl": "1rem",
    "full": "9999px"
  },
  "shadows": {
    "sm": "0 1px 2px rgba(0,0,0,0.05)",
    "md": "0 4px 6px rgba(0,0,0,0.1)",
    "lg": "0 10px 15px rgba(0,0,0,0.1)"
  }
}
```

## 7. Gemini 分析原始记录

<details>
<summary>Round 1: 整体风格</summary>

${gemini_round1}

</details>

<details>
<summary>Round 2: 配色分析</summary>

${gemini_round2}

</details>

<details>
<summary>Round 3: 组件识别</summary>

${gemini_round3}

</details>

<details>
<summary>Round 4: 字体排版</summary>

${gemini_round4}

</details>

<details>
<summary>Round 5: 图标系统</summary>

${gemini_round5}

</details>
```

---

## 返回值

成功时返回：

```json
{
  "status": "success",
  "output_file": "${run_dir}/image-analysis.md",
  "analysis_rounds": 5,
  "extracted_info": {
    "style_type": "Modern SaaS Dashboard",
    "color_count": 5,
    "component_count": 12,
    "font_family": "Inter",
    "layout_type": "Sidebar + Content",
    "icon_library": "Lucide"
  }
}
```

---

## 约束

- **🚨 必须使用 gemini 命令 分析图片**
- **🚨 必须进行至少 5 轮分析**
- **🚨 必须保存 Gemini 原始回答**
- 不自己猜测图片内容
- 输出的颜色值必须转换为 HEX 格式
- 输出的字体大小必须转换为 px 或 rem

## 验证检查点

执行完成后，自检以下内容：

- [ ] gemini 命令被调用了至少 5 次
- [ ] `${run_dir}/image-analysis.md` 已生成
- [ ] 文档包含配色系统表格
- [ ] 文档包含组件清单
- [ ] 文档包含图标系统部分
- [ ] 文档包含 Gemini 原始记录（5 轮）

**如果任一检查失败，必须重新执行！**
