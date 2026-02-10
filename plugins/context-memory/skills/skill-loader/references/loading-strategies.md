# Skill Loading Strategies

## 加载模式

### Full Mode (完整加载)

```
适用场景:
- 首次使用技能
- 需要完整理解技能
- 有足够上下文空间

加载内容:
├── SKILL.md (完整)
├── references/*.md (全部)
└── scripts/* (按需)
```

### Summary Mode (摘要加载)

```
适用场景:
- 快速查看技能列表
- 上下文空间紧张
- 已熟悉技能

加载内容:
└── SKILL.md (仅 frontmatter)
```

### Selective Mode (选择性加载)

```
适用场景:
- 特定功能查询
- 中等上下文空间
- 部分使用技能

加载内容:
├── SKILL.md (完整)
└── references/* (按需)
```

## 缓存策略

| 缓存级别 | 有效期   | 说明         |
| -------- | -------- | ------------ |
| Memory   | 会话期间 | 避免重复加载 |
| File     | 24小时   | 跨会话缓存   |
| None     | -        | 总是重新加载 |

## Token 预算分配

```
技能加载预算: 10,000 tokens

分配示例:
├── 核心 SKILL.md: 3000
├── 主要 reference: 2000
├── 次要 references: 3000
└── 预留: 2000
```

## 智能加载

### 基于任务的预加载

```typescript
// 任务类型 → 预加载技能
const preloadMap = {
  代码分析: ["codex-cli", "code-map-generator"],
  文档生成: ["gemini-cli", "doc-full-generator"],
  调试: ["codex-cli", "session-compactor"],
};
```

### 依赖链加载

```
doc-full-generator
    │
    ├── 依赖 codex-cli → 预加载
    ├── 依赖 gemini-cli → 预加载
    └── 可选外部检索技能（如 grok-search）→ 按需加载
```
