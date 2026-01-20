# Style Library Reference

本文档包含 style-recommender 使用的设计模板和 HTML 预览示例。

---

## 1. 推荐策略矩阵

### 产品类型推荐

| 产品类型 | 推荐样式              | 推荐配色            | 推荐字体        |
| -------- | --------------------- | ------------------- | --------------- |
| SaaS     | Glassmorphism, Swiss  | 中性色、蓝色系      | Sans-serif      |
| 电商     | Card Grid, Visual     | 暖色、高饱和度      | Friendly        |
| 社交     | Card Feed, Interactive| 活泼、渐变          | Casual Modern   |
| 工具     | Minimal, Functional   | 专业中性            | Geometric Sans  |
| 营销网站 | Hero Bold, Gradient   | 大胆、撞色          | Display Impact  |

### 设计偏好映射

| 设计偏好 | 主推样式             | 辅助样式            |
| -------- | -------------------- | ------------------- |
| 简约     | Minimalist Swiss     | Glassmorphism       |
| 创意     | Neubrutalism         | Gradient Mesh       |
| 专业     | Swiss Design         | Stripe-like         |
| 年轻     | Neubrutalism         | Vibrant Colors      |
| 科技感   | Dark Mode First      | Terminal UI         |

---

## 2. 方案输出模板

`${run_dir}/style-recommendations.md` 使用以下结构：

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
\`\`\`html
<div class="backdrop-blur-xl bg-white/70 border border-white/20 rounded-2xl shadow-lg dark:bg-black/50 dark:border-white/10">
  <!-- content -->
</div>
\`\`\`

#### 配色: Vercel Dark

| Token     | Hex     | 用途         |
|-----------|---------|--------------|
| primary   | #000000 | 主按钮、链接 |
| secondary | #0070F3 | 次要操作     |
| accent    | #7928CA | 强调、CTA    |
| bg        | #FFFFFF | 主背景       |
| text      | #111827 | 主文本       |

**Tailwind 配置**：
\`\`\`javascript
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
\`\`\`

#### 字体: Plus Jakarta Sans

- **标题**: Plus Jakarta Sans Bold (700)
- **正文**: Plus Jakarta Sans Regular (400)
- **引入**: Google Fonts

**Tailwind 配置**：
\`\`\`javascript
fontFamily: {
  sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
}
\`\`\`

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
\`\`\`html
<div class="bg-yellow-300 border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] hover:-translate-y-1">
  <!-- content -->
</div>
\`\`\`

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

---

## 3. HTML 预览模板

### 3.1 方案 A 预览 (preview-A.html)

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

### 3.2 方案 B 预览 (preview-B.html)

根据 Neubrutalism 风格（黄+黑撞色、Clash Display 字体）生成类似结构的 HTML。

主要差异：
- 背景色：`bg-yellow-300`
- 边框：`border-4 border-black`
- 阴影：`shadow-[8px_8px_0_rgba(0,0,0,1)]`
- 按钮悬停：`hover:-translate-y-1`

### 3.3 方案 C 预览 (preview-C.html)

根据 Dark Mode + Linear Purple 风格生成类似结构的 HTML。

主要差异：
- 背景色：`bg-gray-900`
- 文字色：`text-white`
- 主色调：`text-violet-500`、`bg-violet-600`
- 渐变：`bg-gradient-to-r from-violet-500 to-fuchsia-500`

### 3.4 对比索引页 (index.html)

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
