---
name: style-recommender
description: |
  【触发条件】需求分析完成后，根据需求推荐设计方案
  【核心产出】输出 ${run_dir}/style-recommendations.md，包含 2-3 套样式方案
  【不触发】用户已明确指定设计方案（如"就用 Glassmorphism"）
  【先问什么】requirements.md 不存在时，先调用 requirement-analyzer
allowed-tools: Read, Write, Bash
arguments:
  - name: run_dir
    type: string
    required: true
    description: 运行目录路径（由 orchestrator 传入）
---

# Style Recommender

## 职责边界

搜索设计资源库，根据产品类型、目标用户、设计偏好推荐 2-3 套风格方案。

- **输入**: `${run_dir}/requirements.md`
- **输出**: `${run_dir}/style-recommendations.md`
- **核心能力**: 资源检索、方案匹配、多变体推荐

## 执行流程

### Step 1: 读取需求文档

加载需求分析的结果。

**操作**：

```typescript
Read: ${run_dir}/requirements.md
```

**提取字段**：

- `product_type`: 产品类型（SaaS / 电商 / ...）
- `core_functions`: 核心功能列表
- `target_users`: 目标用户
- `design_preference`: 设计偏好
- `tech_stack`: 技术栈

**容错处理**：

- 如果文件不存在 → 返回错误，提示先运行 `requirement-analyzer`
- 如果必填字段缺失 → 使用默认值继续

### Step 2: 构建搜索查询

基于需求生成搜索关键词。

**搜索策略矩阵**：

| 产品类型 | 推荐样式关键词              | 推荐配色关键词            | 推荐字体关键词      |
| -------- | --------------------------- | ------------------------- | ------------------- |
| SaaS     | "modern professional clean" | "SaaS neutral trust"      | "sans-serif clean"  |
| 电商     | "card grid visual"          | "vibrant warm conversion" | "friendly readable" |
| 社交     | "card feed interactive"     | "playful vibrant"         | "casual modern"     |
| 工具     | "minimal functional"        | "professional neutral"    | "geometric sans"    |
| 营销网站 | "hero bold gradient"        | "attention bold"          | "display impact"    |

**设计偏好映射**：

| 设计偏好 | 样式修饰词                     | 典型样式                        |
| -------- | ------------------------------ | ------------------------------- |
| 简约     | "minimal swiss clean"          | Minimalist Swiss, Glassmorphism |
| 创意     | "bold creative unique"         | Neubrutalism, Gradient Mesh     |
| 专业     | "professional trust corporate" | Swiss Design, Stripe-like       |
| 年轻     | "playful vibrant bold"         | Neubrutalism, Vibrant Colors    |
| 科技感   | "tech modern futuristic"       | Dark Mode First, Terminal UI    |

**生成查询示例**：

```typescript
// 示例：SaaS 产品 + 专业简约
查询组合: 样式查询: "SaaS modern professional clean minimal";
配色查询: "SaaS neutral trust professional";
字体查询: "sans-serif clean modern geometric";
```

### Step 3: 调用搜索脚本

使用 search_resources.ts 检索资源库。

**搜索步骤**：

**3.1 搜索样式**

```bash
cd ~/.claude/skills/ui-ux/_shared/scripts
npx tsx search_resources.ts \
  --domain style \
  --query "{样式查询关键词}" \
  --limit 5
```

**3.2 搜索配色方案**

```bash
npx tsx search_resources.ts \
  --domain color \
  --industry "{行业}" \
  --query "{配色查询关键词}" \
  --limit 5
```

如果 industry 未指定或搜索结果 < 3，降级为通用搜索：

```bash
npx tsx search_resources.ts \
  --domain color \
  --query "{配色查询关键词}" \
  --limit 5
```

**3.3 搜索字体**

```bash
npx tsx search_resources.ts \
  --domain typography \
  --query "{字体查询关键词}" \
  --limit 5
```

**解析搜索结果**：

```typescript
// 搜索结果是 JSON 格式
const styleResults = JSON.parse(bash_output_1);
const colorResults = JSON.parse(bash_output_2);
const typographyResults = JSON.parse(bash_output_3);

// 提取相关性最高的前 3 个
const topStyles = styleResults.results.slice(0, 3);
const topColors = colorResults.results.slice(0, 3);
const topTypography = typographyResults.results.slice(0, 3);
```

### Step 4: 生成推荐方案

组合搜索结果，生成 2-3 套差异化方案。

**推荐策略**：

**方案 A: 稳妥专业型**

- **目标**: 快速上线，降低风险，适合企业客户
- **选择逻辑**:
  - 样式：相关性最高且参考案例知名
  - 配色：中性色调（Neutral / Trust）
  - 字体：无衬线体，可读性优先

**方案 B: 创意大胆型**

- **目标**: 差异化，吸引年轻用户，适合营销
- **选择逻辑**:
  - 样式：相关性次高但视觉冲击力强
  - 配色：高对比度/撞色
  - 字体：Display 字体或几何字体

**方案 C: 混合平衡型（可选）**

- **目标**: 兼顾专业与个性
- **选择逻辑**:
  - 样式：混合两种风格（如 Glassmorphism + Bento Grid）
  - 配色：渐变色或双色调
  - 字体：主字体保守，标题字体个性

**组合示例**：

```typescript
方案 A:
  样式: Glassmorphism 2.0
  配色: Vercel Dark (黑+蓝)
  字体: Plus Jakarta Sans (sans-serif)
  特点: 专业、现代、信任感

方案 B:
  样式: Neubrutalism
  配色: 黄+黑 撞色
  字体: Clash Display + Manrope
  特点: 大胆、独特、吸引注意力

方案 C:
  样式: Dark Mode First + Bento Grid
  配色: Linear Purple (紫色渐变)
  字体: Geist Sans + Geist Mono
  特点: 科技感、灵活布局、开发者友好
```

### Step 5: 读取资源详情

对于每个被选中的资源，读取完整 YAML 文件。

**操作**：

```typescript
// 对于每个推荐资源
for (resource in selectedResources) {
  const yamlPath = `~/.claude/skills/ui-ux/_shared/${resource.file_path}`
  Read: yamlPath
  解析 YAML → 提取详细信息
}
```

**提取字段**：

- 样式：CSS 代码、Tailwind 示例、使用技巧
- 配色：完整色板、渐变、Tailwind 配置
- 字体：字体族、字重、使用场景、引入方式

### Step 6: 生成推荐文档

将推荐方案整合为结构化文档。

**输出路径**：`${run_dir}/style-recommendations.md`

**文档模板**：

````markdown
---
generated_at: { ISO 8601 时间戳 }
recommender_version: "1.0"
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

**CSS 代码示例**：

```css
/* Light Mode */
backdrop-filter: blur(20px) saturate(180%);
background: rgba(255, 255, 255, 0.7);
border: 1px solid rgba(255, 255, 255, 0.2);
border-radius: 16px;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
```
````

**Tailwind 示例**：

```html
<div
  class="backdrop-blur-xl bg-white/70 border border-white/20 rounded-2xl shadow-lg dark:bg-black/50 dark:border-white/10"
>
  <!-- content -->
</div>
```

#### 配色: Vercel Dark

- **主色调**: #000000 (黑色)
- **辅助色**: #0070F3 (蓝色)
- **强调色**: #7928CA (紫色)
- **特点**: 极简、科技感、高对比度

**完整色板**：

```
████ Primary    #000000
████ Secondary  #0070F3
████ Accent     #7928CA
████ Background #000000
████ Surface    #111111
████ Text       #FFFFFF
████ Border     #333333
```

**Tailwind 配置**：

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: "#000000",
        secondary: "#0070F3",
        accent: "#7928CA",
      },
    },
  },
};
```

#### 字体: Plus Jakarta Sans

- **标题**: Plus Jakarta Sans Bold (700)
- **正文**: Plus Jakarta Sans Regular (400)
- **引入方式**: Google Fonts

```html
<!-- 引入字体 -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link
  href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

**Tailwind 配置**：

```javascript
fontFamily: {
  sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
}
```

### 使用建议

- ✅ 适合：企业级产品、B2B SaaS、开发者工具
- ⚠️ 注意：玻璃拟态需要有质感的背景才能显效，避免在纯白背景使用
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

**CSS 代码示例**：

```css
background: #ffeb00;
border: 4px solid #000000;
border-radius: 0;
box-shadow: 8px 8px 0 #000000;
transition: all 0.2s ease;
```

**Tailwind 示例**：

```html
<div
  class="bg-yellow-300 border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,1)] hover:shadow-[12px_12px_0_rgba(0,0,0,1)] hover:-translate-y-1"
>
  <!-- content -->
</div>
```

#### 配色: 黄+黑撞色

- **主色调**: #FFEB00 (亮黄)
- **辅助色**: #000000 (黑色)
- **强调色**: #FF0080 (粉红)
- **特点**: 高对比度、吸引注意力、年轻化

#### 字体: Clash Display + Manrope

- **标题**: Clash Display Bold (700)
- **正文**: Manrope Medium (500)
- **特点**: 几何感、现代、可读性好

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

- **主色调**: #5E6AD2 (紫色)
- **辅助色**: #8B5CF6 (亮紫)
- **强调色**: #C026D3 (品红)
- **渐变**: linear-gradient(to right, #8B5CF6, #C026D3)

#### 字体: Geist Sans + Geist Mono

- **标题/正文**: Geist Sans
- **代码**: Geist Mono
- **特点**: 几何清爽、开发者友好

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

1. **选择方案**: 从 A/B/C 中选择一个方案，或提出修改意见
2. **生成设计规格**: 调用 `design-variant-generator` 生成详细设计文档
3. **并行生成**: 如需对比，可同时生成多个方案的详细规格

````

### Step 7: Gate 检查

验证推荐是否合理。

**检查项**：
- [ ] 至少生成 2 套方案
- [ ] 每套方案包含：样式 + 配色 + 字体
- [ ] 推荐理由充分（基于需求）
- [ ] 提供了代码示例

**通过标准**：所有检查项通过

**如果失败**：
- 搜索结果不足 → 放宽搜索条件，或提供默认方案
- 资源文件缺失 → 仅提供 index.json 中的基本信息

## 返回值

成功时返回：
```json
{
  "status": "success",
  "output_file": "${run_dir}/style-recommendations.md",
  "variant_count": 3,
  "recommendations": [
    {
      "variant_id": "A",
      "style": "Glassmorphism 2.0",
      "color": "Vercel Dark",
      "typography": "Plus Jakarta Sans",
      "positioning": "稳妥专业型"
    },
    {
      "variant_id": "B",
      "style": "Neubrutalism",
      "color": "黄+黑撞色",
      "typography": "Clash Display + Manrope",
      "positioning": "创意大胆型"
    },
    {
      "variant_id": "C",
      "style": "Dark Mode First + Bento Grid",
      "color": "Linear Purple",
      "typography": "Geist Sans + Geist Mono",
      "positioning": "混合平衡型"
    }
  ]
}
````

## 错误处理

- **requirements.md 不存在**：返回错误，提示先运行 requirement-analyzer
- **搜索结果为空**：使用默认推荐（Glassmorphism + 中性色 + Sans Serif）
- **YAML 文件读取失败**：降级为仅使用 index.json 中的基本信息

## 使用示例

**场景: SaaS 产品推荐**

```
输入: requirements.md (产品类型=SaaS, 设计偏好=专业)

执行流程:
  1. Read: requirements.md
  2. 构建查询: "SaaS modern professional"
  3. 搜索样式: 返回 Glassmorphism, Minimalist Swiss, Dark Mode First
  4. 搜索配色: 返回 Vercel Dark, Stripe Neutral, Linear Purple
  5. 搜索字体: 返回 Plus Jakarta Sans, Inter, Geist Sans
  6. 组合方案:
     - 方案 A: Glassmorphism + Vercel Dark + Plus Jakarta Sans
     - 方案 B: Neubrutalism + 撞色 + Clash Display
     - 方案 C: Dark Mode First + Linear Purple + Geist Sans
  7. 读取资源详情 → 生成完整文档
  8. Gate 检查: 通过 ✅
```

## 注意事项

1. **多样性**: 确保推荐的 3 个方案有明显差异，避免雷同
2. **可行性**: 所有推荐的资源必须在资源库中存在
3. **对齐需求**: 推荐理由必须引用 requirements.md 中的具体要素
4. **代码实用性**: 提供的代码示例必须可直接使用
