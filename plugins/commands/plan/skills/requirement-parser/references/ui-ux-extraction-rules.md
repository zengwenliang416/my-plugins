# UI/UX 提取规则

## 概述

本文档定义了从需求描述中提取 UI/UX 相关信息的规则，用于指导 Gemini 进行前端分析。

## 视觉线索提取

### 组件关键词识别

| 关键词              | 组件类型           | 设计考量                 |
| ------------------- | ------------------ | ------------------------ |
| modal, 弹窗, 对话框 | Dialog/Modal       | 遮罩、关闭方式、焦点陷阱 |
| drawer, 抽屉        | Drawer             | 方向、宽度、动画         |
| toast, 提示, 通知   | Toast/Notification | 位置、持续时间、类型     |
| dropdown, 下拉      | Dropdown/Select    | 搜索、多选、分组         |
| tab, 标签页         | Tabs               | 切换动画、懒加载         |
| table, 表格         | Table              | 排序、筛选、分页         |
| form, 表单          | Form               | 验证、布局、提交         |
| card, 卡片          | Card               | 阴影、悬停效果           |
| list, 列表          | List               | 虚拟滚动、加载更多       |
| menu, 菜单          | Menu               | 层级、键盘导航           |

### 样式关键词识别

| 关键词              | 样式类型 | 实现方式                 |
| ------------------- | -------- | ------------------------ |
| dark mode, 暗色模式 | 主题     | CSS 变量、主题切换       |
| 响应式              | 布局     | 媒体查询、容器查询       |
| 渐变, gradient      | 背景     | linear-gradient          |
| 阴影, shadow        | 深度     | box-shadow               |
| 圆角, rounded       | 边框     | border-radius            |
| 毛玻璃, blur        | 效果     | backdrop-filter          |
| 动画, animation     | 过渡     | CSS animation/transition |

## 交互建模

### 动态行为识别

| 行为描述                  | 交互类型 | 技术实现              |
| ------------------------- | -------- | --------------------- |
| 拖拽, drag-and-drop       | 拖放     | react-dnd, dnd-kit    |
| 无限滚动, infinite scroll | 滚动加载 | Intersection Observer |
| 实时, real-time           | 实时更新 | WebSocket, SSE        |
| 自动保存, auto-save       | 延迟提交 | debounce              |
| 撤销/重做, undo/redo      | 状态历史 | 命令模式              |
| 搜索建议, autocomplete    | 自动完成 | 防抖搜索              |
| 图片裁剪, crop            | 图片编辑 | cropperjs             |
| 文件上传, upload          | 文件处理 | 拖放上传、进度条      |

### 状态管理识别

| 状态类型 | 识别特征         | 推荐方案        |
| -------- | ---------------- | --------------- |
| 表单状态 | 输入、验证、提交 | React Hook Form |
| 列表状态 | CRUD、分页、筛选 | React Query     |
| 用户状态 | 登录、权限、偏好 | Zustand/Context |
| UI 状态  | 开关、加载、错误 | useState        |
| URL 状态 | 筛选、分页、搜索 | URL params      |

## 设备与无障碍

### 响应式断点

| 断点 | 宽度      | 典型设备        |
| ---- | --------- | --------------- |
| xs   | < 640px   | 手机竖屏        |
| sm   | >= 640px  | 手机横屏        |
| md   | >= 768px  | 平板竖屏        |
| lg   | >= 1024px | 平板横屏/笔记本 |
| xl   | >= 1280px | 桌面显示器      |
| 2xl  | >= 1536px | 大屏显示器      |

### 无障碍要求

| WCAG 等级 | 要求       | 实现要点           |
| --------- | ---------- | ------------------ |
| A         | 基本可访问 | 替代文本、键盘可用 |
| AA        | 增强可访问 | 颜色对比、焦点可见 |
| AAA       | 完全可访问 | 手语视频、扩展音频 |

### 无障碍检查清单

| 检查项     | 说明                        |
| ---------- | --------------------------- |
| 键盘导航   | Tab 顺序合理，焦点可见      |
| 屏幕阅读器 | 语义化 HTML，ARIA 标签      |
| 颜色对比   | 文本与背景对比度 >= 4.5:1   |
| 触摸目标   | 最小 44x44px                |
| 错误提示   | 不仅依赖颜色区分            |
| 动画       | 支持 prefers-reduced-motion |

## 设计系统映射

### 通用术语到组件库的映射

| 通用术语 | Material UI    | Ant Design | shadcn/ui |
| -------- | -------------- | ---------- | --------- |
| 按钮     | Button         | Button     | Button    |
| 输入框   | TextField      | Input      | Input     |
| 选择器   | Select         | Select     | Select    |
| 日期选择 | DatePicker     | DatePicker | Calendar  |
| 对话框   | Dialog         | Modal      | Dialog    |
| 抽屉     | Drawer         | Drawer     | Sheet     |
| 表格     | DataGrid       | Table      | Table     |
| 标签页   | Tabs           | Tabs       | Tabs      |
| 步骤条   | Stepper        | Steps      | Steps     |
| 进度条   | LinearProgress | Progress   | Progress  |

### 设计 Token 映射

| 设计概念 | CSS 变量示例       | 用途           |
| -------- | ------------------ | -------------- |
| 主色     | --color-primary    | 主要操作、品牌 |
| 成功色   | --color-success    | 成功状态       |
| 警告色   | --color-warning    | 警告状态       |
| 错误色   | --color-error      | 错误状态       |
| 背景色   | --color-background | 页面背景       |
| 表面色   | --color-surface    | 卡片背景       |
| 文字色   | --color-text       | 正文文字       |
| 边框色   | --color-border     | 分隔线         |

## 输出格式

### UI/UX 需求提取模板

```markdown
## UI/UX 需求提取

### 组件清单

| 组件      | 类型     | 交互       | 无障碍要求 |
| --------- | -------- | ---------- | ---------- |
| LoginForm | 表单     | 提交、验证 | 焦点管理   |
| UserMenu  | 下拉菜单 | 点击展开   | 键盘导航   |

### 交互流程

1. 用户点击登录按钮
2. 显示登录表单
3. 输入验证
4. 提交成功/失败反馈

### 响应式策略

| 断点    | 布局调整 |
| ------- | -------- |
| mobile  | 单列布局 |
| desktop | 双列布局 |

### 动画需求

| 元素  | 动画类型 | 持续时间 |
| ----- | -------- | -------- |
| Modal | 淡入淡出 | 200ms    |
| Toast | 滑入滑出 | 150ms    |

### 无障碍合规

- 目标等级: WCAG 2.1 AA
- 关键要求: [列表]
```
