# Context Loading Priority Rules

## 优先级层次

| 优先级 | 类型         | 说明              | Token 预算 |
| ------ | ------------ | ----------------- | ---------- |
| 1      | Rules        | 编码规范/安全规则 | 5000       |
| 2      | Code Map     | 项目结构概览      | 8000       |
| 3      | Skills Index | 可用技能列表      | 3000       |
| 4      | Recent Docs  | 最近文档          | 10000      |
| 5      | Custom       | 用户自定义        | 剩余       |

## 加载策略

### 增量加载

```
首次加载:
├── 加载 Rules (必须)
├── 加载 Code Map (必须)
├── 加载 Skills Index (必须)
└── 按需加载 Docs

后续加载:
├── 检查缓存有效性
├── 仅加载变更部分
└── 合并到现有上下文
```

### 优先级覆盖

```yaml
# .claude/memory/context-config.yaml
overrides:
  - pattern: "src/security/**"
    priority: 1 # 安全相关文件优先
  - pattern: "tests/**"
    priority: 8 # 测试文件降级
```

## Token 预算分配

```
总预算: 100,000 tokens

分配:
├── 系统提示: 10,000 (固定)
├── 上下文: 50,000 (可配置)
├── 会话历史: 30,000 (动态)
└── 响应预留: 10,000 (固定)
```

## 智能截断

当超出预算时:

1. 保留完整的 Rules
2. Code Map 截断到核心模块
3. Skills 只保留索引
4. Docs 按相关性排序截断
