# Gemini CLI 视觉分析配方

## 快速参考

```bash
# 图片分析（原生 gemini 命令）
gemini "请分析这张设计图片 ${image_path}：[你的分析请求]" -o text -y

# 文本任务（codeagent-wrapper）
~/.claude/bin/codeagent-wrapper gemini --role frontend --prompt "你的任务"
```

## 配方 1：整体风格分析

```bash
gemini "请分析这张设计图片 ${image_path}：

你是一位资深 UI/UX 设计师。请分析这张设计图：

## 整体风格
1. **界面类型**: 网页/App/Dashboard/Landing Page/电商/后台管理？
2. **设计语言**: Material/Apple HIG/Fluent/扁平化/新拟态/玻璃拟态？
3. **视觉风格**: 极简主义/信息密集/装饰性？
4. **品牌调性**: 专业商务/年轻活泼/高端奢华/科技感？

## 页面布局
1. **整体结构**: 顶部导航 + 侧边栏 + 主内容区？
2. **栅格系统**: 2列/3列/12列栅格？
3. **内容区域**: 列出所有可见区域
4. **响应式**: 是否有响应式设计迹象？

请用结构化格式回答。" -o text -y
```

## 配方 2：配色系统提取

```bash
gemini "请继续分析这张图片 ${image_path}，提取完整配色系统，用 HEX 格式：

## 主要颜色
- 主色（Primary）: #______
- 辅助色（Secondary）: #______
- 强调色（Accent）: #______

## 中性色
- 页面背景: #______
- 卡片背景: #______
- 主标题颜色: #______
- 正文颜色: #______
- 辅助文字: #______
- 边框/分割线: #______

## 功能色
- 成功色: #______
- 警告色: #______
- 错误色: #______
- 信息色: #______

## 渐变（如有）
- 渐变方向和颜色

请给出准确的 HEX 值。" -o text -y
```

## 配方 3：UI 组件识别

```bash
gemini "请分析这张图片 ${image_path} 中的所有 UI 组件：

## 导航组件
- Header: 高度、背景、Logo 位置
- Sidebar: 宽度、菜单项样式
- Tabs/Breadcrumb（如有）

## 内容组件
- Card: 圆角(px)、阴影深度、内边距
- List: 行高、分隔线
- Table: 边框、斑马纹
- Avatar: 形状、大小

## 表单组件
- Input: 高度、圆角、边框颜色
- Button: 主要/次要/文字按钮样式
- Select/Checkbox/Switch（如有）

## 反馈组件
- Modal/Toast/Progress（如有）

对每个组件给出具体样式值（px）。" -o text -y
```

## 配方 4：字体排版分析

```bash
gemini "请分析这张图片 ${image_path} 的字体排版系统：

## 字体识别
- 主字体: Inter/Roboto/SF Pro/思源黑体？
- 是否多字体混用？

## 字号层级（估算 px）
| 层级 | 大小 | 字重 | 行高 |
|------|------|------|------|
| H1 | __px | ____ | ____ |
| H2 | __px | ____ | ____ |
| H3 | __px | ____ | ____ |
| Body | __px | ____ | ____ |
| Small | __px | ____ | ____ |
| Caption | __px | ____ | ____ |

## 字重使用
- Bold/700: 用在哪里？
- Semibold/600: 用在哪里？
- Medium/500: 用在哪里？
- Regular/400: 用在哪里？

请给出准确的数值估算。" -o text -y
```

## 配方 5：图标系统分析

```bash
gemini "请分析这张图片 ${image_path} 的图标系统：

## 图标风格
1. **类型**: 线性/填充/双色/混合？
2. **粗细**: 细线(1px)/中等(1.5px)/粗线(2px)？
3. **圆角**: 直角/小圆角/大圆角？
4. **推荐库**: Lucide/Heroicons/Feather/Material Icons？

## 图标列表
请列出所有可见图标：
| 图标名 | 位置 | 尺寸 | 颜色 |
|--------|------|------|------|
| 菜单 | 导航栏 | __px | #______ |
| 搜索 | 顶部 | __px | #______ |
| ... | ... | ... | ... |

## 尺寸规范
- 小图标: __px
- 默认: __px
- 大图标: __px" -o text -y
```

## 配方 6：布局规格提取

```bash
gemini "请分析这张图片 ${image_path} 的布局规格：

## 页面结构
- Header 高度: __px
- Sidebar 宽度: __px（如有）
- 主内容区: flex-1 / __px

## 间距系统
- 基础单位: __px
- 组件间距: __px
- 内边距: __px
- 栅格间隙: __px

## 容器
- 最大宽度: __px
- 边距: __px

请画出 ASCII 结构图。" -o text -y
```

## 多轮分析流程

```bash
# Round 1: 整体风格
gemini "请分析这张设计图片 ${image_path}：[配方1内容]" -o text -y

# Round 2: 配色
gemini "请继续分析这张图片 ${image_path}：[配方2内容]" -o text -y

# Round 3: 组件
gemini "请分析这张图片 ${image_path}：[配方3内容]" -o text -y

# Round 4: 字体
gemini "请分析这张图片 ${image_path}：[配方4内容]" -o text -y

# Round 5: 图标
gemini "请分析这张图片 ${image_path}：[配方5内容]" -o text -y
```

## 输出转换示例

### Gemini 原始输出 → Tailwind 配置

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',  // Gemini 提取
          50: '#EFF6FF',
          // ...
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],  // Gemini 识别
      },
      borderRadius: {
        DEFAULT: '0.5rem',  // Gemini: 8px
        lg: '0.75rem',      // Gemini: 12px
      }
    }
  }
}
```
