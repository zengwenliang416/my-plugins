# 头脑风暴搜索模式

针对头脑风暴场景优化的 Exa 搜索策略。

## 五大搜索维度

### 1. 趋势搜索 (Trends)

**目的**: 了解领域最新动态和发展方向

```bash
# 模板
"{topic} trends 2026"
"{topic} future predictions"
"{topic} emerging technologies"

# 示例
"smart home trends 2026" --content --limit 5
"AI applications future predictions" --content --limit 5
```

**优质来源**:
- `--include techcrunch.com,wired.com,theverge.com`
- `--category news`

### 2. 案例搜索 (Case Studies)

**目的**: 学习成功案例和最佳实践

```bash
# 模板
"{topic} case study success story"
"{topic} best practices examples"
"{company} {topic} implementation"

# 示例
"subscription model case study success story" --content --limit 5
"gamification user engagement best practices" --content --limit 5
```

**优质来源**:
- `--include hbr.org,medium.com,forbes.com`
- `--category company`

### 3. 跨领域灵感 (Cross-Industry)

**目的**: 从其他行业借鉴创新思路

```bash
# 模板
"{problem} solution from {other_industry}"
"{topic} inspiration {industry_name}"
"how {industry} solved {similar_problem}"

# 示例
"checkout optimization from gaming industry" --content --limit 5
"user onboarding inspiration from hospitality" --content --limit 5
```

**推荐跨领域映射**:
| 原领域 | 借鉴领域 | 原因 |
|--------|----------|------|
| 电商 | 游戏、金融 | 转化率、支付体验 |
| SaaS | 消费品、媒体 | 订阅、留存 |
| 教育 | 游戏、娱乐 | 参与度、激励 |
| 医疗 | 航空、核能 | 安全流程 |

### 4. 问题与痛点 (Pain Points)

**目的**: 深入理解用户需求和市场空白

```bash
# 模板
"{topic} challenges problems"
"{topic} user complaints reviews"
"{topic} pain points frustrations"
"why {topic} fails"

# 示例
"remote work challenges problems" --content --limit 5
"fitness app user complaints reviews" --content --limit 5
```

**优质来源**:
- `--include reddit.com,quora.com`
- `--category tweet` (真实用户声音)

### 5. 创新机会 (Opportunities)

**目的**: 发现市场机会和创新方向

```bash
# 模板
"{topic} opportunities innovations"
"{topic} startups funding 2025-2026"
"{topic} disruption potential"
"underserved {topic} market"

# 示例
"eldercare technology opportunities innovations" --content --limit 5
"sustainable packaging startups funding 2025-2026" --content --limit 5
```

**优质来源**:
- `--include crunchbase.com,pitchbook.com`
- `--category company`

## 搜索组合策略

### 快速研究 (3 次搜索)

适用于时间有限或主题明确：

1. 趋势搜索 - 了解大方向
2. 案例搜索 - 学习成功经验
3. 跨领域搜索 - 获取灵感

### 深度研究 (5 次搜索)

适用于需要全面洞察：

1. 趋势搜索
2. 案例搜索
3. 跨领域搜索
4. 问题搜索 - 发现痛点
5. 机会搜索 - 识别空白

## 结果筛选优先级

### 时效性

| 发布时间 | 优先级 | 用途 |
|----------|--------|------|
| < 6 个月 | ⭐⭐⭐⭐⭐ | 最新趋势 |
| 6-12 个月 | ⭐⭐⭐⭐ | 有效参考 |
| 1-2 年 | ⭐⭐⭐ | 需验证 |
| > 2 年 | ⭐⭐ | 历史参考 |

### 来源权威性

| 来源类型 | 优先级 | 适用搜索 |
|----------|--------|----------|
| 行业报告 | ⭐⭐⭐⭐⭐ | 趋势、机会 |
| 知名媒体 | ⭐⭐⭐⭐ | 案例、趋势 |
| 学术论文 | ⭐⭐⭐⭐ | 问题、方法 |
| 公司博客 | ⭐⭐⭐ | 案例、实践 |
| 社交媒体 | ⭐⭐ | 痛点、反馈 |

## 常用域名过滤

### 趋势/新闻

```bash
--include techcrunch.com,wired.com,theverge.com,arstechnica.com
```

### 商业/案例

```bash
--include hbr.org,forbes.com,inc.com,fastcompany.com
```

### 技术/开发

```bash
--include github.com,dev.to,medium.com,stackoverflow.com
```

### 用户声音

```bash
--include reddit.com,quora.com,producthunt.com
```

### 研究/报告

```bash
--include mckinsey.com,gartner.com,forrester.com
```
