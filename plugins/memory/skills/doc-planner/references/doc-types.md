# Documentation Types Reference

## 文档类型识别

### API 文档

| 触发条件  | 文件特征                         |
| --------- | -------------------------------- |
| 路由定义  | `router`, `controller`, `routes` |
| REST 端点 | `@Get`, `@Post`, `app.get`       |
| 注释标记  | `@api`, `@route`, `@endpoint`    |
| 文件名    | `*api*`, `*route*`, `*endpoint*` |

**输出结构:**

```
├── Overview
├── Authentication
├── Endpoints
│   ├── GET /resource
│   └── POST /resource
├── Examples
└── Error Codes
```

### 组件文档

| 触发条件   | 文件特征                            |
| ---------- | ----------------------------------- |
| React/Vue  | `.tsx`, `.vue`, `.component.ts`     |
| Props 定义 | `interface Props`, `defineProps`    |
| 导出组件   | `export default`, `export function` |

**输出结构:**

```
├── Overview
├── Props/API
├── Usage Examples
├── Variants
└── Accessibility
```

### 指南文档

| 触发条件 | 文件特征             |
| -------- | -------------------- |
| 复杂逻辑 | 高圈复杂度模块       |
| 集成点   | 第三方服务连接       |
| 配置系统 | `config`, `settings` |
| 工作流   | 多步骤流程           |

**输出结构:**

```
├── Introduction
├── Prerequisites
├── Step-by-Step
├── Troubleshooting
└── FAQ
```

## 优先级计算

### 评分维度

| 维度       | 权重 | 说明                      |
| ---------- | ---- | ------------------------- |
| 代码复杂度 | 30%  | 函数数、依赖数、圈复杂度  |
| 使用频率   | 30%  | 被引用次数、公共接口数    |
| 变更频率   | 20%  | 最近提交次数、作者数量    |
| 文档状态   | 20%  | 缺失5/过时4/不完整3/完整1 |

### 优先级阈值

```
score > 4.0 → critical
score > 3.0 → high
score > 2.0 → medium
score ≤ 2.0 → low
```

## 依赖排序

```
拓扑排序规则:
1. 无依赖文档优先
2. 同层按优先级排序
3. 循环依赖打断最低优先级边
```
