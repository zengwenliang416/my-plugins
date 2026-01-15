# 技术栈实现指南

支持 8 种技术栈的前端实现指南。

---

## 技术栈选择

| 栈              | 适用场景                 | 默认 |
| --------------- | ------------------------ | ---- |
| `html-tailwind` | 静态页面、原型、简单项目 | ✅   |
| `react`         | SPA、复杂交互、组件库    |      |
| `nextjs`        | SSR/SSG、SEO 需求、全栈  |      |
| `vue`           | 渐进式、中小项目         |      |
| `svelte`        | 高性能、轻量级           |      |
| `swiftui`       | iOS/macOS 原生           |      |
| `react-native`  | 跨平台移动应用           |      |
| `flutter`       | 跨平台高性能             |      |

---

## html-tailwind (默认)

### 基础模板

```html
<!DOCTYPE html>
<html lang="zh-CN" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>页面标题</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            fontFamily: {
              sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
              mono: ["JetBrains Mono", "monospace"],
            },
            colors: {
              primary: "#0070f3",
              accent: "#00ff88",
            },
          },
        },
      };
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono&display=swap"
      rel="stylesheet"
    />
  </head>
  <body class="bg-[#0a0a0a] text-[#fafafa] font-sans antialiased">
    <!-- 内容 -->
  </body>
</html>
```

### Tailwind 配置扩展

```javascript
// tailwind.config.js
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "slide-in": "slideIn 0.4s ease-out",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: 0, transform: "translateX(-10px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
};
```

---

## React

### 组件结构

```tsx
// components/ui/Card.tsx
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "glass" | "brutal";
}

export function Card({ children, className, variant = "default" }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg p-6 transition-all duration-300",
        {
          "bg-white/5 border border-white/10": variant === "default",
          "bg-white/10 backdrop-blur-xl border border-white/20":
            variant === "glass",
          "bg-yellow-400 border-3 border-black shadow-[4px_4px_0_#000]":
            variant === "brutal",
        },
        className,
      )}
    >
      {children}
    </div>
  );
}
```

### Hook 模式

```tsx
// hooks/useTheme.ts
import { useState, useEffect } from "react";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, toggle };
}
```

---

## Next.js

### App Router 结构

```
app/
├── layout.tsx          # 根布局
├── page.tsx            # 首页
├── globals.css         # 全局样式
├── (marketing)/        # 路由组
│   ├── page.tsx
│   └── pricing/page.tsx
└── components/
    └── ui/
```

### 服务端组件

```tsx
// app/page.tsx
import { Card } from "@/components/ui/Card";

async function getData() {
  // 服务端数据获取
}

export default async function Page() {
  const data = await getData();

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Card>{/* 内容 */}</Card>
    </main>
  );
}
```

### Metadata

```tsx
// app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "网站标题",
  description: "网站描述",
  openGraph: {
    title: "网站标题",
    description: "网站描述",
    images: ["/og-image.png"],
  },
};
```

---

## Vue 3

### Composition API

```vue
<script setup lang="ts">
import { ref, computed } from "vue";

interface Props {
  variant?: "default" | "glass" | "brutal";
}

const props = withDefaults(defineProps<Props>(), {
  variant: "default",
});

const cardClasses = computed(() => ({
  "bg-white/5 border border-white/10": props.variant === "default",
  "bg-white/10 backdrop-blur-xl": props.variant === "glass",
  "bg-yellow-400 border-3 border-black": props.variant === "brutal",
}));
</script>

<template>
  <div class="rounded-lg p-6 transition-all" :class="cardClasses">
    <slot />
  </div>
</template>
```

---

## Svelte

### 组件

```svelte
<script lang="ts">
  export let variant: 'default' | 'glass' | 'brutal' = 'default';

  $: classes = {
    default: 'bg-white/5 border border-white/10',
    glass: 'bg-white/10 backdrop-blur-xl border border-white/20',
    brutal: 'bg-yellow-400 border-3 border-black shadow-brutal',
  }[variant];
</script>

<div class="rounded-lg p-6 transition-all {classes}">
  <slot />
</div>

<style>
  .shadow-brutal {
    box-shadow: 4px 4px 0 #000;
  }
</style>
```

---

## SwiftUI

### 视图

```swift
import SwiftUI

struct GlassCard: View {
    var body: some View {
        VStack {
            Text("内容")
                .foregroundColor(.white)
        }
        .padding()
        .background(.ultraThinMaterial)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.white.opacity(0.2), lineWidth: 1)
        )
    }
}

struct BrutalButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .fontWeight(.bold)
                .foregroundColor(.black)
                .padding(.horizontal, 24)
                .padding(.vertical, 12)
                .background(Color.yellow)
                .overlay(
                    Rectangle()
                        .stroke(Color.black, lineWidth: 3)
                )
                .offset(x: -4, y: -4)
                .background(Color.black.offset(x: 4, y: 4))
        }
    }
}
```

---

## React Native

### 组件

```tsx
import { View, Text, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";

export function GlassCard({ children }) {
  return (
    <BlurView intensity={80} style={styles.card}>
      <View style={styles.content}>{children}</View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  content: {
    padding: 24,
  },
});
```

---

## Flutter

### Widget

```dart
class GlassCard extends StatelessWidget {
  final Widget child;

  const GlassCard({required this.child});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.1),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: Colors.white.withOpacity(0.2),
            ),
          ),
          padding: EdgeInsets.all(24),
          child: child,
        ),
      ),
    );
  }
}
```

---

## 通用规范

### 间距系统

```
4px  - 微距 (图标与文字)
8px  - 小间距 (相关元素)
16px - 中间距 (组内元素)
24px - 大间距 (组件之间)
32px - 区块间距
48px - 大区块
64px - 章节间距
```

### 响应式断点

```css
/* Mobile First */
sm: 640px   /* 手机横屏 */
md: 768px   /* 平板 */
lg: 1024px  /* 小屏电脑 */
xl: 1280px  /* 桌面 */
2xl: 1536px /* 大屏 */
```

### 无障碍

- 对比度: 文本 4.5:1, 大文本 3:1
- 焦点指示: 明显的 focus ring
- 键盘导航: Tab 顺序合理
- ARIA 标签: 交互元素必须标注
