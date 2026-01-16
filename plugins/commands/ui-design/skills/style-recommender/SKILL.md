---
name: style-recommender
description: |
  【触发条件】需求分析完成后，根据需求推荐设计方案
  【核心产出】输出 ${run_dir}/style-recommendations.md，包含 2-3 套样式方案
  【不触发】用户已明确指定设计方案（如"就用 Glassmorphism"）
  【先问什么】requirements.md 不存在时，先调用 requirement-analyzer
  【🚨 强制】必须使用 gemini-cli 生成创意配色和样式方案
  【依赖】gemini-cli（参考 skills/gemini-cli/）
allowed-tools:
  - Read
  - Write
  - Bash
  - mcp__auggie-mcp__codebase-retrieval
  - LSP
  - WebSearch
  - WebFetch
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 command 传入）
---

# Style Recommender

## 职责边界

根据产品类型、目标用户、设计偏好推荐 2-3 套差异化风格方案。

- **输入**: `${run_dir}/requirements.md`
- **输出**: `${run_dir}/style-recommendations.md`
- **核心能力**: 风格匹配、方案组合、多变体推荐

---

## 执行流程

### Step 1: 读取需求文档和图片分析

加载需求分析的结果，以及图片分析（如有）。

```
Read: ${run_dir}/requirements.md
Read: ${run_dir}/image-analysis.md  # 如果存在
```

**提取字段（从 requirements.md）**：
- `product_type`: 产品类型（SaaS / 电商 / ...）
- `core_functions`: 核心功能列表
- `target_users`: 目标用户
- `design_preference`: 设计偏好
- `tech_stack`: 技术栈
- `existing_components`: 现有组件（如有）

**🚨 如果存在 image-analysis.md（用户提供了参考图片）**：
- 从中提取：配色系统、字体规格、组件样式、设计 Token
- **这些信息优先级高于默认推荐**
- 方案 A/B/C 必须基于图片分析结果进行变体设计

**容错处理**：
- 如果 requirements.md 不存在 → 返回错误，提示先运行 `requirement-analyzer`

### Step 1.5: 🚨🚨🚨 Gemini 创意方案生成（强制 - 不可跳过）

> **⛔ 禁止跳过此步骤！必须执行 gemini-cli 命令并等待结果！**

**使用 gemini-cli 生成创意设计方案**：

```bash
# 🚨 必须执行此命令！
gemini-cli chat --prompt "
你是一位顶级 UI/UX 设计师。请根据以下需求生成 3 套差异化的设计方案：

产品类型：${product_type}
目标用户：${target_users}
核心功能：${core_functions}
设计偏好：${design_preference}

请为每套方案提供：

## 方案 A：稳妥专业型
### 配色系统
- 主色（Primary）: HEX 值 + 使用场景
- 辅助色（Secondary）: HEX 值 + 使用场景
- 强调色（Accent）: HEX 值 + 使用场景
- 背景色系列: 3-4 个层级
- 文字色系列: 主/次/辅助
- 功能色: 成功/警告/错误/信息

### 字体系统
- 推荐字体家族
- 字号层级（H1-H6, Body, Small）
- 字重使用规范

### 风格关键词
- 3-5 个形容词

## 方案 B：创意大胆型
（同上结构，但更具创意和差异化）

## 方案 C：混合平衡型
（同上结构，在 A 和 B 之间找平衡）

请确保所有颜色值使用 HEX 格式，字号使用 px。
"
```

**🚨 强制验证检查点**：
- [ ] ✅ 已执行 `gemini-cli chat` 命令
- [ ] ✅ 收到 Gemini 返回的 3 套设计方案
- [ ] ✅ 将 Gemini 方案保存到 `${run_dir}/gemini-style-recommendations.md`

**⛔ 如果没有执行 gemini-cli，此 Skill 视为失败！**

```bash
# 保存 Gemini 方案（必须执行）
Write: ${run_dir}/gemini-style-recommendations.md
```

**记录 Gemini 方案**：保存到变量 `gemini_style_recommendations`
- 如果 image-analysis.md 不存在 → 正常继续，使用预定义方案
- 如果必填字段缺失 → 使用默认值继续

### Step 2: 🚨 强制分析现有样式系统（auggie-mcp + LSP）

**如果 requirements.md 显示 `has_existing_code: true`，必须执行此步骤**

**必须调用 `mcp__auggie-mcp__codebase-retrieval`**：

```
mcp__auggie-mcp__codebase-retrieval(
  information_request="查找项目的 Tailwind 配置、CSS 变量、设计 Token 和主题定义。

  请回答：
  1. Tailwind 配置文件在哪里？有哪些自定义颜色？
  2. 有哪些 CSS 变量或设计 Token？
  3. 现有的字体配置是什么？
  4. 有哪些间距、圆角、阴影定义？"
)
```

**如果发现 tailwind.config.js，必须调用 LSP**：

```
LSP(operation="documentSymbol", filePath="tailwind.config.js", line=1, character=1)
LSP(operation="hover", filePath="tailwind.config.js", line=5, character=10)
```

**产出**：
- `existing_colors`: 现有配色方案
- `existing_fonts`: 现有字体配置
- `existing_spacing`: 现有间距系统
- `existing_effects`: 现有圆角/阴影定义

**跳过条件**（仅以下情况可跳过）：
- requirements.md 显示 `has_existing_code: false`
- auggie-mcp 返回空结果

### Step 3: 构建推荐策略

基于需求和现有约束，确定推荐方向。

**推荐策略矩阵**：

| 产品类型 | 推荐样式              | 推荐配色            | 推荐字体        |
| -------- | --------------------- | ------------------- | --------------- |
| SaaS     | Glassmorphism, Swiss  | 中性色、蓝色系      | Sans-serif      |
| 电商     | Card Grid, Visual     | 暖色、高饱和度      | Friendly        |
| 社交     | Card Feed, Interactive| 活泼、渐变          | Casual Modern   |
| 工具     | Minimal, Functional   | 专业中性            | Geometric Sans  |
| 营销网站 | Hero Bold, Gradient   | 大胆、撞色          | Display Impact  |

**设计偏好映射**：

| 设计偏好 | 主推样式             | 辅助样式            |
| -------- | -------------------- | ------------------- |
| 简约     | Minimalist Swiss     | Glassmorphism       |
| 创意     | Neubrutalism         | Gradient Mesh       |
| 专业     | Swiss Design         | Stripe-like         |
| 年轻     | Neubrutalism         | Vibrant Colors      |
| 科技感   | Dark Mode First      | Terminal UI         |

### Step 4: 搜索设计灵感（可选）

使用 WebSearch 搜索最新设计趋势和案例。

```
WebSearch({
  query: "${product_type} ${design_preference} UI design trends 2026"
})
```

**提取信息**：
- 当前流行的设计趋势
- 行业标杆案例
- 配色/字体推荐

### Step 5: 生成三套方案

**方案 A: 稳妥专业型**
- **目标**: 快速上线，降低风险，适合企业客户
- **选择逻辑**:
  - 样式：成熟、广泛使用、案例丰富
  - 配色：中性色调（Neutral / Trust）
  - 字体：无衬线体，可读性优先

**方案 B: 创意大胆型**
- **目标**: 差异化，吸引年轻用户，适合营销
- **选择逻辑**:
  - 样式：视觉冲击力强
  - 配色：高对比度/撞色
  - 字体：Display 字体或几何字体

**方案 C: 混合平衡型**
- **目标**: 兼顾专业与个性
- **选择逻辑**:
  - 样式：混合两种风格
  - 配色：渐变色或双色调
  - 字体：主字体保守，标题字体个性

### Step 6: 生成推荐文档

**输出路径**：`${run_dir}/style-recommendations.md`

**文档模板**：

```markdown
---
generated_at: {ISO 8601 时间戳}
recommender_version: "2.0"
based_on: "${run_dir}/requirements.md"
variant_count: 3
---

# 设计方案推荐

## 需求摘要

**产品类型**: {SaaS}
**目标用户**: {企业客户}
**设计偏好**: {专业简约}
**技术栈**: {React + Tailwind}

---

## 方案 A: 稳妥专业型 ⭐ 推荐

### 整体定位

快速上线，降低风险，适合企业客户。专业、现代、值得信赖。

### 设计组合

#### 样式: Glassmorphism 2.0

- **描述**: 玻璃拟态设计风格，使用毛玻璃效果和半透明背景
- **适用场景**: 系统 UI, 控制面板, 高端产品
- **参考案例**: macOS Sonoma, Raycast, Arc Browser

**Tailwind 示例**：
```html
<div class="backdrop-blur-xl bg-white/70 border border-white/20 rounded-2xl shadow-lg dark:bg-black/50 dark:border-white/10">
  <!-- content -->
</div>
```

#### 配色: Vercel Dark

| Token     | Hex     | 用途         |
|-----------|---------|--------------|
| primary   | #000000 | 主按钮、链接 |
| secondary | #0070F3 | 次要操作     |
| accent    | #7928CA | 强调、CTA    |
| bg        | #FFFFFF | 主背景       |
| text      | #111827 | 主文本       |

**Tailwind 配置**：
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        secondary: '#0070F3',
        accent: '#7928CA',
      }
    }
  }
}
```

#### 字体: Plus Jakarta Sans

- **标题**: Plus Jakarta Sans Bold (700)
- **正文**: Plus Jakarta Sans Regular (400)
- **引入**: Google Fonts

**Tailwind 配置**：
```javascript
fontFamily: {
  sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
}
```

### 使用建议

- ✅ 适合：企业级产品、B2B SaaS、开发者工具
- ⚠️ 注意：玻璃拟态需要有质感的背景才能显效
- 🎯 核心优势：专业、现代、快速建立信任感

---

## 方案 B: 创意大胆型

### 整体定位

差异化竞争，吸引年轻用户，适合营销页面。大胆、独特、令人印象深刻。

### 设计组合

#### 样式: Neubrutalism

- **描述**: 新粗野主义设计风格，大胆色块+粗黑边框+硬阴影
- **适用场景**: 个性化产品, 创意网站, 年轻用户, 营销页面
- **参考案例**: Gumroad, Linear (early), Stripe Press

**Tailwind 示例**：
```html
<div class="bg-yellow-300 border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] hover:-translate-y-1">
  <!-- content -->
</div>
```

#### 配色: 黄+黑撞色

| Token   | Hex     | 用途       |
|---------|---------|------------|
| primary | #FFEB00 | 主色调     |
| secondary | #000000 | 边框、文字 |
| accent  | #FF0080 | 强调       |

#### 字体: Clash Display + Manrope

- **标题**: Clash Display Bold (700)
- **正文**: Manrope Medium (500)

### 使用建议

- ✅ 适合：营销网站、创意产品、Z世代用户
- ⚠️ 注意：不适合需要严肃/专业氛围的场景
- 🎯 核心优势：独特、吸睛、差异化

---

## 方案 C: 混合平衡型

### 整体定位

兼顾专业与个性，适合技术产品。科技感、灵活布局、开发者友好。

### 设计组合

#### 样式: Dark Mode First + Bento Grid

- **Dark Mode First**: 暗色优先设计，针对低光环境优化
- **Bento Grid**: 不规则栅格布局，灵活组织内容

#### 配色: Linear Purple

| Token   | Hex     | 用途       |
|---------|---------|------------|
| primary | #5E6AD2 | 主色调     |
| secondary | #8B5CF6 | 辅助       |
| accent  | #C026D3 | 强调       |
| gradient | #8B5CF6 → #C026D3 | 渐变 |

#### 字体: Geist Sans + Geist Mono

- **标题/正文**: Geist Sans
- **代码**: Geist Mono

### 使用建议

- ✅ 适合：技术产品、开发者工具、项目管理
- ⚠️ 注意：暗色模式需考虑可访问性
- 🎯 核心优势：科技感、专业与个性兼顾

---

## 推荐理由对比

| 维度           | 方案 A        | 方案 B          | 方案 C          |
| -------------- | ------------- | --------------- | --------------- |
| 上手难度       | ⭐⭐⭐ 简单   | ⭐⭐ 中等       | ⭐⭐ 中等       |
| 差异化程度     | ⭐⭐ 常见     | ⭐⭐⭐⭐⭐ 独特 | ⭐⭐⭐⭐ 较独特 |
| 企业接受度     | ⭐⭐⭐⭐⭐ 高 | ⭐⭐ 低         | ⭐⭐⭐⭐ 较高   |
| 年轻用户吸引力 | ⭐⭐⭐ 中等   | ⭐⭐⭐⭐⭐ 高   | ⭐⭐⭐⭐ 较高   |
| 技术复杂度     | ⭐⭐ 低       | ⭐⭐ 低         | ⭐⭐⭐ 中等     |

## 下一步建议

1. **选择方案**: 从 A/B/C 中选择一个或多个方案
2. **生成设计规格**: 调用 `design-variant-generator` 生成详细设计文档
3. **并行生成**: 如需对比，可同时生成多个方案的详细规格
```

### Step 7: 生成静态 HTML 预览页面

### 🚨🚨🚨 强制执行 - 必须生成静态 HTML 🚨🚨🚨

**❌ 禁止行为：**
- ❌ 跳过 HTML 生成
- ❌ 生成完整项目结构（package.json, node_modules 等）
- ❌ 只输出 markdown 不生成 HTML

**✅ 必须做的事：生成 4 个静态 HTML 文件**

**输出目录**：`${run_dir}/previews/`

### 立即执行：创建预览目录

```bash
mkdir -p ${run_dir}/previews
```

### 立即执行：为每个方案生成 HTML 文件

**使用 Write 工具**生成以下 4 个文件：

#### 文件 1: `${run_dir}/previews/preview-A.html`

根据方案 A 的配色和样式，生成完整的静态 HTML：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>方案 A - 稳妥专业型</title>
  <!-- Tailwind CDN - 无需安装 -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: '#000000',
            secondary: '#0070F3',
            accent: '#7928CA',
          },
          fontFamily: {
            sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
          }
        }
      }
    }
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="bg-white text-gray-900 font-sans">
  <!-- Header -->
  <header class="backdrop-blur-xl bg-white/70 border-b border-gray-200 sticky top-0 z-50">
    <nav class="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
      <div class="text-xl font-bold">Logo</div>
      <div class="flex gap-6">
        <a href="#" class="hover:text-secondary">产品</a>
        <a href="#" class="hover:text-secondary">方案</a>
        <a href="#" class="hover:text-secondary">价格</a>
      </div>
      <button class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-gray-800">开始使用</button>
    </nav>
  </header>

  <!-- Hero -->
  <section class="max-w-6xl mx-auto px-6 py-24 text-center">
    <h1 class="text-5xl font-bold mb-6">构建更好的产品</h1>
    <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">专业、现代、值得信赖的设计方案</p>
    <div class="flex gap-4 justify-center">
      <button class="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800">立即开始</button>
      <button class="border border-gray-300 px-6 py-3 rounded-lg font-medium hover:border-gray-400">了解更多</button>
    </div>
  </section>

  <!-- Cards -->
  <section class="max-w-6xl mx-auto px-6 py-16">
    <div class="grid grid-cols-3 gap-6">
      <div class="backdrop-blur-xl bg-white/70 border border-gray-200 rounded-2xl p-6 shadow-lg">
        <div class="w-12 h-12 bg-secondary/10 rounded-xl mb-4 flex items-center justify-center text-secondary">✦</div>
        <h3 class="text-lg font-semibold mb-2">功能特性 1</h3>
        <p class="text-gray-600">描述文字示例，展示产品的核心价值</p>
      </div>
      <div class="backdrop-blur-xl bg-white/70 border border-gray-200 rounded-2xl p-6 shadow-lg">
        <div class="w-12 h-12 bg-accent/10 rounded-xl mb-4 flex items-center justify-center text-accent">◆</div>
        <h3 class="text-lg font-semibold mb-2">功能特性 2</h3>
        <p class="text-gray-600">描述文字示例，展示产品的核心价值</p>
      </div>
      <div class="backdrop-blur-xl bg-white/70 border border-gray-200 rounded-2xl p-6 shadow-lg">
        <div class="w-12 h-12 bg-primary/10 rounded-xl mb-4 flex items-center justify-center">●</div>
        <h3 class="text-lg font-semibold mb-2">功能特性 3</h3>
        <p class="text-gray-600">描述文字示例，展示产品的核心价值</p>
      </div>
    </div>
  </section>

  <!-- Form -->
  <section class="max-w-md mx-auto px-6 py-16">
    <div class="backdrop-blur-xl bg-white/70 border border-gray-200 rounded-2xl p-8 shadow-lg">
      <h2 class="text-2xl font-bold mb-6 text-center">联系我们</h2>
      <input type="text" placeholder="您的姓名" class="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-secondary">
      <input type="email" placeholder="邮箱地址" class="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-secondary">
      <button class="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-gray-800">提交</button>
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t border-gray-200 py-8 text-center text-gray-600">
    © 2026 Your Company. All rights reserved.
  </footer>
</body>
</html>
```

#### 文件 2: `${run_dir}/previews/preview-B.html`

根据方案 B（Neubrutalism 黄+黑撞色）生成类似结构但完全不同风格的 HTML。

#### 文件 3: `${run_dir}/previews/preview-C.html`

根据方案 C（Dark Mode + Linear Purple）生成类似结构但完全不同风格的 HTML。

#### 文件 4: `${run_dir}/previews/index.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>设计方案对比</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen">
  <div class="max-w-7xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6">🎨 设计方案预览对比</h1>

    <!-- Tab 切换 -->
    <div class="flex gap-2 mb-6">
      <button onclick="showPreview('A')" class="tab px-6 py-3 bg-white rounded-lg shadow hover:shadow-md font-medium" id="tab-A">
        方案 A - 稳妥专业型
      </button>
      <button onclick="showPreview('B')" class="tab px-6 py-3 bg-white rounded-lg shadow hover:shadow-md font-medium" id="tab-B">
        方案 B - 创意大胆型
      </button>
      <button onclick="showPreview('C')" class="tab px-6 py-3 bg-white rounded-lg shadow hover:shadow-md font-medium" id="tab-C">
        方案 C - 混合平衡型
      </button>
    </div>

    <!-- 预览 iframe -->
    <iframe id="preview-frame" src="preview-A.html" class="w-full h-[700px] bg-white rounded-xl shadow-lg border-0"></iframe>

    <!-- 方案说明 -->
    <div class="mt-6 p-6 bg-white rounded-xl shadow">
      <div id="info-A">
        <h2 class="text-xl font-bold mb-2">方案 A: Glassmorphism 2.0</h2>
        <p class="text-gray-600">配色: Vercel Dark | 字体: Plus Jakarta Sans</p>
        <p class="mt-2">✅ 适合：企业级产品、B2B SaaS、开发者工具</p>
      </div>
      <div id="info-B" class="hidden">
        <h2 class="text-xl font-bold mb-2">方案 B: Neubrutalism</h2>
        <p class="text-gray-600">配色: 黄+黑撞色 | 字体: Clash Display</p>
        <p class="mt-2">✅ 适合：营销网站、创意产品、Z世代用户</p>
      </div>
      <div id="info-C" class="hidden">
        <h2 class="text-xl font-bold mb-2">方案 C: Dark Mode First</h2>
        <p class="text-gray-600">配色: Linear Purple | 字体: Geist Sans</p>
        <p class="mt-2">✅ 适合：技术产品、开发者工具、项目管理</p>
      </div>
    </div>
  </div>

  <script>
    function showPreview(variant) {
      document.getElementById('preview-frame').src = `preview-${variant}.html`;
      ['A', 'B', 'C'].forEach(v => {
        document.getElementById(`tab-${v}`).classList.toggle('ring-2', v === variant);
        document.getElementById(`tab-${v}`).classList.toggle('ring-blue-500', v === variant);
        document.getElementById(`info-${v}`).classList.toggle('hidden', v !== variant);
      });
    }
    showPreview('A');
  </script>
</body>
</html>
```

### 验证检查点（必须全部通过）

执行完成后，验证以下文件存在：

```bash
ls -la ${run_dir}/previews/
# 必须看到：
# - index.html
# - preview-A.html
# - preview-B.html
# - preview-C.html
```

**如果任何文件缺失，这是执行失败，必须补充生成！**

---

### Step 8: Gate 检查

验证推荐是否合理。

**检查项**：
- [ ] 至少生成 2 套方案
- [ ] 每套方案包含：样式 + 配色 + 字体
- [ ] 推荐理由充分（基于需求）
- [ ] 提供了代码示例
- [ ] **生成了 HTML 预览页面**

**通过标准**：所有检查项通过

---

## 返回值

成功时返回：
```json
{
  "status": "success",
  "output_file": "${run_dir}/style-recommendations.md",
  "preview_dir": "${run_dir}/previews/",
  "preview_index": "${run_dir}/previews/index.html",
  "variant_count": 3,
  "recommendations": [
    {
      "variant_id": "A",
      "style": "Glassmorphism 2.0",
      "color": "Vercel Dark",
      "typography": "Plus Jakarta Sans",
      "positioning": "稳妥专业型",
      "preview_file": "${run_dir}/previews/preview-A.html"
    },
    {
      "variant_id": "B",
      "style": "Neubrutalism",
      "color": "黄+黑撞色",
      "typography": "Clash Display + Manrope",
      "positioning": "创意大胆型",
      "preview_file": "${run_dir}/previews/preview-B.html"
    },
    {
      "variant_id": "C",
      "style": "Dark Mode First + Bento Grid",
      "color": "Linear Purple",
      "typography": "Geist Sans + Geist Mono",
      "positioning": "混合平衡型",
      "preview_file": "${run_dir}/previews/preview-C.html"
    }
  ]
}
```

---

## 约束

- **🚨 如果有现有代码，必须调用 auggie-mcp 分析样式系统**（Step 2）
- **🚨 如果发现 tailwind.config.js，必须调用 LSP 获取符号**（Step 2）
- **🚨 必须生成 4 个静态 HTML 预览文件**（Step 7）
- 仅当工具返回错误时才可降级
- 多样性: 确保推荐的 3 个方案有明显差异
- 对齐需求: 推荐理由必须引用 requirements.md 中的具体要素
- 代码实用性: 提供的代码示例必须可直接使用
- 现有约束: 如果有现有代码，推荐方案需要考虑兼容性

## 工具使用策略

### auggie-mcp 场景

- 查找现有的 Tailwind 配置
- 了解现有的 CSS 变量和设计 Token
- 理解项目的样式约定

### LSP 场景

- 获取 tailwind.config.js 的完整结构
- 查看自定义颜色/字体/间距定义

### 降级策略

如果 auggie-mcp 或 LSP 不可用：
1. 跳过现有样式分析
2. 在推荐文档中标记"未分析现有样式"
3. 推荐通用方案（不考虑现有约束）
