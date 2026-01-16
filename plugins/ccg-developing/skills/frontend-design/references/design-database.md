# 设计数据库

可搜索的设计资源库，涵盖风格、配色、字体、组件模式。

---

## UI 风格库 (57 种)

### 核心风格

#### glassmorphism

```yaml
name: Glassmorphism 2.0 (精致毛玻璃)
keywords: [glass, blur, translucent, frosted, modern, premium]
适用: 系统 UI、控制面板、高端产品
参考: macOS Sonoma, Raycast, Arc Browser, iOS Control Center
css: |
  backdrop-filter: blur(20px) saturate(180%);
  background: rgba(255,255,255,0.7);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 16px;
dark_variant: |
  background: rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.1);
tips:
  - 避免过度模糊影响可读性
  - 需要有质感的背景才能显效
  - 配合微妙渐变效果更佳
```

#### neubrutalism

```yaml
name: Neubrutalism (新野兽派)
keywords: [brutal, bold, stark, raw, punchy, edgy]
适用: 创意工具、独立产品、年轻用户
参考: Gumroad, Figma Community, Pitch, Notion Calendar
css: |
  border: 3px solid #000;
  border-radius: 0;
  box-shadow: 4px 4px 0 #000;
colors:
  黄+黑: ["#ffde59", "#000000"]
  粉+蓝: ["#ff6b9d", "#00d4ff"]
  橙+深蓝: ["#ff8c42", "#1a1a2e"]
tips:
  - 故意的"粗糙感"：不完美对齐
  - 手写风格元素增加个性
  - 高对比撞色是关键
```

#### bento-grid

```yaml
name: Bento Grid (便当盒布局)
keywords: [grid, asymmetric, modular, dashboard, apple]
适用: Dashboard、产品展示、Portfolio
参考: Apple 产品页, Linear, Vercel Dashboard, Stripe
css: |
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
tips:
  - 关键卡片用 span 2/3 放大突出
  - 次要信息压缩
  - 卡片间距保持一致 (16-24px)
```

#### dark-mode-first

```yaml
name: Dark Mode First (深色优先)
keywords: [dark, neon, developer, tech, modern]
适用: 开发者工具、SaaS 产品、技术品牌
参考: Vercel, Supabase, Railway, Linear
colors:
  背景: ["#0a0a0a", "#121212", "#1a1a1a"] # 避免纯黑
  文字: ["#fafafa"] # 避免纯白
  点缀: ["#00ff88", "#00d4ff", "#ff6b6b"] # 霓虹色
css: |
  --bg-primary: #0a0a0a;
  --bg-secondary: #141414;
  --text-primary: #fafafa;
  --text-secondary: #a1a1a1;
  --accent: #00ff88;
tips:
  - 使用微妙渐变边框增加质感
  - 霓虹色点缀要克制
```

#### terminal-ui

```yaml
name: Terminal UI (终端/代码编辑器风格)
keywords: [terminal, code, cli, developer, monospace]
适用: 开发者工具、技术产品、SaaS Dashboard、文档站点
参考: SkillsMP.com, GitHub Copilot, Warp Terminal, Raycast
elements:
  窗口装饰: 红黄绿三点 + 标题栏
  行号显示: 左侧灰色行号
  等宽字体: JetBrains Mono, Fira Code, Berkeley Mono
  语法高亮: 关键字橙色、字符串绿色、注释灰色
interaction:
  CLI按钮: "$ ai --search", "$ cd /categories"
  参数标签: "--filter", "--sort stars"
  状态指示: "● ready", "○ pending", "✓ done"
colors:
  dark:
    terminal-bg: "#1e1e1e"
    terminal-header: "#2d2d2d"
    btn-close: "#ff5f56"
    btn-minimize: "#ffbd2e"
    btn-maximize: "#27c93f"
    syntax-keyword: "#ff7b72"
    syntax-string: "#a5d6ff"
    syntax-variable: "#ffa657"
    syntax-comment: "#8b949e"
  light:
    terminal-bg: "#ffffff"
    terminal-header: "#f6f8fa"
    syntax-keyword: "#cf222e"
    syntax-string: "#0a3069"
```

#### editorial

```yaml
name: Editorial / Magazine (编辑/杂志风)
keywords: [magazine, typography, editorial, luxury, content]
适用: 内容平台、博客、作品集、奢侈品牌
参考: The Outline, Bloomberg, Apple Newsroom
css: |
  font-size: clamp(3rem, 8vw, 8rem);  /* 超大标题 */
tips:
  - 混合衬线+无衬线字体
  - 文字与图片重叠
  - 网格打破：元素突出边界
  - 大量留白
```

#### organic-shapes

```yaml
name: Organic Shapes (有机形状)
keywords: [blob, wave, organic, fluid, natural]
适用: 品牌官网、创意Agency、健康/生活方式产品
参考: Stripe, Loom, Notion, Webflow
elements:
  - SVG blob 背景装饰
  - clip-path 不规则形状
  - 柔和渐变 + 流体动画
tips:
  - 避免过于规则的几何形状
  - 渐变要柔和自然
```

### 扩展风格 (50+)

| 风格             | 关键词             | 适用场景             |
| ---------------- | ------------------ | -------------------- |
| neumorphism      | 软阴影、内凹、浮雕 | 设置面板、音乐播放器 |
| claymorphism     | 3D、粘土、圆润     | 儿童产品、游戏       |
| aurora           | 极光、渐变、流动   | 创意、艺术           |
| retro-tech       | 复古、CRT、像素    | 游戏、怀旧           |
| swiss-design     | 网格、几何、极简   | 企业、专业           |
| japanese-minimal | 和风、留白、禅意   | 生活方式、高端       |
| cyberpunk        | 霓虹、赛博、科幻   | 游戏、娱乐           |
| memphis          | 几何、波点、活泼   | 年轻、创意           |
| art-deco         | 几何、金色、奢华   | 奢侈品、高端         |
| bauhaus          | 基础形状、原色     | 教育、设计           |

---

## 配色方案库 (95 套)

### 按行业分类

#### SaaS / 技术

```yaml
vercel-dark:
  primary: "#000000"
  accent: "#0070f3"
  background: "#0a0a0a"
  text: "#fafafa"

linear-purple:
  primary: "#5e6ad2"
  accent: "#8b5cf6"
  background: "#0f0f10"
  text: "#e8e8e8"

supabase-green:
  primary: "#3ecf8e"
  accent: "#1c1c1c"
  background: "#1c1c1c"
  text: "#f8f8f8"
```

#### 金融 / 企业

```yaml
stripe-neutral:
  primary: "#635bff"
  accent: "#00d4ff"
  background: "#ffffff"
  text: "#0a2540"

fintech-trust:
  primary: "#1a365d"
  accent: "#2b6cb0"
  background: "#f7fafc"
  text: "#1a202c"
```

#### 电商 / 消费

```yaml
shopify-green:
  primary: "#96bf48"
  accent: "#5c6ac4"
  background: "#f4f6f8"
  text: "#212b36"

luxury-gold:
  primary: "#c9a962"
  accent: "#1a1a1a"
  background: "#fefefe"
  text: "#1a1a1a"
```

#### 健康 / 医疗

```yaml
healthcare-calm:
  primary: "#38b2ac"
  accent: "#4fd1c5"
  background: "#f0fff4"
  text: "#234e52"

wellness-earth:
  primary: "#8b7355"
  accent: "#c4a77d"
  background: "#faf8f5"
  text: "#3d3d3d"
```

### Mesh Gradient (多点渐变)

```css
/* Dark mesh */
background:
  radial-gradient(at 40% 20%, #ff6b6b33 0, transparent 50%),
  radial-gradient(at 80% 0%, #00d4ff33 0, transparent 50%),
  radial-gradient(at 0% 50%, #00ff8833 0, transparent 50%), #0a0a0a;

/* Light mesh */
background:
  radial-gradient(at 40% 20%, #ffd6e033 0, transparent 50%),
  radial-gradient(at 80% 0%, #d6f5ff33 0, transparent 50%),
  radial-gradient(at 0% 50%, #d6ffe033 0, transparent 50%), #ffffff;
```

---

## 字体搭配库 (56 组)

### 英文字体

| 用途 | 推荐                                                         | 避免                         |
| ---- | ------------------------------------------------------------ | ---------------------------- |
| 标题 | Satoshi, Cabinet Grotesk, Clash Display, General Sans, Migra | Inter, Roboto, Space Grotesk |
| 正文 | Plus Jakarta Sans, Outfit, DM Sans, Geist, Manrope           | Arial, Helvetica, system-ui  |
| 代码 | JetBrains Mono, Fira Code, Berkeley Mono, Monaspace          | Monaco, Consolas             |
| 衬线 | Fraunces, Playfair Display, Lora, Source Serif               | Times New Roman              |

### 中文字体

| 用途 | 推荐                                        |
| ---- | ------------------------------------------- |
| 标题 | 阿里巴巴普惠体 Bold、思源黑体 Heavy、得意黑 |
| 正文 | 思源黑体 Regular、阿里巴巴普惠体、霞鹜文楷  |
| 特殊 | 站酷快乐体、汉仪新人文宋                    |

### 经典搭配

```yaml
modern-tech:
  heading: "Satoshi"
  body: "Plus Jakarta Sans"
  code: "JetBrains Mono"

editorial-elegant:
  heading: "Clash Display"
  body: "Source Serif"
  accent: "Fraunces"

developer-focused:
  heading: "Geist"
  body: "Geist"
  code: "Geist Mono"
```

---

## 动效指南

### 时间函数

```css
/* 避免统一的 ease，使用差异化曲线 */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-in-out-circ: cubic-bezier(0.85, 0, 0.15, 1);

/* 差异化时长 */
--duration-fast: 150ms;
--duration-base: 250ms;
--duration-slow: 400ms;
--duration-slower: 600ms;
```

### 常用动效

```css
/* 页面加载：错开显示 */
.card {
  animation: fadeUp 0.6s var(--ease-out-expo) backwards;
}
.card:nth-child(n) {
  animation-delay: calc(n * 0.1s);
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 有意义的 Hover */
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}
```

---

## 组件模式

### Terminal Window

```tsx
const TerminalWindow = ({ title, children }) => (
  <div className="rounded-lg border border-[--terminal-border] overflow-hidden">
    <div className="flex items-center gap-2 px-4 py-3 bg-[--terminal-header]">
      <div className="flex gap-2">
        <span className="w-3 h-3 rounded-full bg-[--btn-close]" />
        <span className="w-3 h-3 rounded-full bg-[--btn-minimize]" />
        <span className="w-3 h-3 rounded-full bg-[--btn-maximize]" />
      </div>
      <span className="ml-2 text-sm text-[--text-secondary] font-mono">
        {title}
      </span>
    </div>
    <div className="p-4 bg-[--terminal-bg] font-mono text-sm">{children}</div>
  </div>
);
```

### CLI Button

```tsx
const CliButton = ({ command, active }) => (
  <button
    className={`
    px-3 py-1.5 rounded-md font-mono text-sm
    border border-[--terminal-border] transition-all duration-200
    ${
      active
        ? "bg-[--terminal-header] text-[--text-primary]"
        : "text-[--text-secondary] hover:bg-[--terminal-header]"
    }
  `}
  >
    <span className="text-[--syntax-variable]">$</span> {command}
  </button>
);
```

### Status Indicator

```tsx
const StatusDot = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 text-xs font-mono
    ${status === "ready" ? "text-green-500" : ""}
    ${status === "pending" ? "text-yellow-500" : ""}
    ${status === "error" ? "text-red-500" : ""}
  `}
  >
    <span className={`w-2 h-2 rounded-full bg-current`} />
    {status}
  </span>
);
```
