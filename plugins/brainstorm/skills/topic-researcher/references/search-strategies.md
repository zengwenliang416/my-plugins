# Exa 搜索策略

针对不同主题类型的搜索模板和筛选策略。

## 主题分类与搜索模板

### 产品创新类

适用于：新产品设计、功能创新、产品改进

```bash
# 行业创新
exa search "{product_type} innovation 2026" --content --limit 5

# 创业公司动向
exa search "{product_type} startup ideas funding 2025-2026" --content --limit 5

# 用户痛点
exa search "{product_type} user complaints reviews problems" --content --limit 5

# 竞品分析
exa search "{product_type} competitors comparison features" --content --limit 5
```

### 流程优化类

适用于：工作流改进、效率提升、自动化

```bash
# 最佳实践
exa search "{process} best practices case study" --content --limit 5

# 自动化工具
exa search "{process} automation tools comparison 2026" --content --limit 5

# 瓶颈分析
exa search "{process} bottleneck inefficiency solutions" --content --limit 5

# 行业标杆
exa search "{process} industry benchmark metrics KPI" --content --limit 5
```

### 市场趋势类

适用于：市场分析、消费者洞察、趋势预测

```bash
# 市场报告
exa search "{market} market trends 2026 report forecast" --content --limit 5

# 消费者行为
exa search "{market} consumer behavior changes preferences" --content --limit 5

# 新兴技术
exa search "{market} emerging technology impact disruption" --content --limit 5

# 监管动态
exa search "{market} regulation policy changes 2026" --content --limit 5
```

### 技术探索类

适用于：技术选型、架构设计、技术创新

```bash
# 技术趋势
exa search "{technology} trends 2026 roadmap" --content --limit 5

# 实践案例
exa search "{technology} implementation case study production" --content --limit 5

# 性能对比
exa search "{technology} benchmark comparison performance" --content --limit 5

# 生态系统
exa search "{technology} ecosystem tools libraries frameworks" --content --limit 5
```

### 用户体验类

适用于：UX 改进、设计创新、可用性研究

```bash
# 设计趋势
exa search "{domain} UX design trends 2026" --content --limit 5

# 用户研究
exa search "{domain} user research insights findings" --content --limit 5

# 可访问性
exa search "{domain} accessibility WCAG improvements" --content --limit 5

# 情感设计
exa search "{domain} emotional design user delight" --content --limit 5
```

## 搜索结果筛选策略

### 时效性权重

| 发布时间 | 权重 | 说明 |
|----------|------|------|
| < 6 个月 | 高 | 最新趋势，优先引用 |
| 6-12 个月 | 中 | 有效参考 |
| 1-2 年 | 低 | 需验证是否仍有效 |
| > 2 年 | 最低 | 仅作历史参考 |

### 来源优先级

| 来源类型 | 优先级 | 说明 |
|----------|--------|------|
| 官方文档 | ⭐⭐⭐⭐⭐ | 最权威 |
| 行业报告 | ⭐⭐⭐⭐ | 数据可靠 |
| 技术博客（知名公司） | ⭐⭐⭐⭐ | 实践经验丰富 |
| 学术论文 | ⭐⭐⭐ | 理论支撑 |
| 个人博客 | ⭐⭐ | 需交叉验证 |
| 社交媒体 | ⭐ | 仅作趋势感知 |

### 信息质量检查

✅ 有效信息特征：
- 有具体数据或案例支撑
- 来源可追溯
- 观点有论据支持
- 作者有相关背景

❌ 低质量信息特征：
- 纯观点无论据
- 广告软文
- 信息过时
- 来源不明

## 跨领域搜索策略

### 类比搜索模板

```bash
# 从其他行业借鉴
exa search "{problem} solution in {other_industry}" --content --limit 5

# 例如：
# "checkout optimization in gaming industry"
# "user onboarding in fintech"
# "subscription model in media industry"
```

### 推荐跨领域映射

| 原领域 | 推荐借鉴领域 | 原因 |
|--------|--------------|------|
| 电商 | 游戏、金融 | 转化率优化、支付体验 |
| SaaS | 消费品、媒体 | 订阅模式、用户留存 |
| 医疗 | 航空、核能 | 安全流程、错误预防 |
| 教育 | 游戏、娱乐 | 参与度、激励机制 |
| 物流 | 制造业、零售 | 效率优化、库存管理 |

## 搜索结果整合原则

1. **去重合并**：相似内容只保留最优来源
2. **矛盾标注**：不同来源观点冲突时，标注争议
3. **空白识别**：记录搜索未覆盖的领域
4. **启发提取**：每条结果提炼 1-2 条可行动洞察
