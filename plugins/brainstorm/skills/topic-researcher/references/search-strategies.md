# Exa Search Strategies

Search templates and filtering strategies for different topic types.

## Topic Categories and Search Templates

### Product Innovation

Applicable to: New product design, feature innovation, product improvement

```bash
# Industry innovation
exa search "{product_type} innovation 2026" --content --limit 5

# Startup trends
exa search "{product_type} startup ideas funding 2025-2026" --content --limit 5

# User pain points
exa search "{product_type} user complaints reviews problems" --content --limit 5

# Competitor analysis
exa search "{product_type} competitors comparison features" --content --limit 5
```

### Process Optimization

Applicable to: Workflow improvement, efficiency enhancement, automation

```bash
# Best practices
exa search "{process} best practices case study" --content --limit 5

# Automation tools
exa search "{process} automation tools comparison 2026" --content --limit 5

# Bottleneck analysis
exa search "{process} bottleneck inefficiency solutions" --content --limit 5

# Industry benchmarks
exa search "{process} industry benchmark metrics KPI" --content --limit 5
```

### Market Trends

Applicable to: Market analysis, consumer insights, trend forecasting

```bash
# Market reports
exa search "{market} market trends 2026 report forecast" --content --limit 5

# Consumer behavior
exa search "{market} consumer behavior changes preferences" --content --limit 5

# Emerging technologies
exa search "{market} emerging technology impact disruption" --content --limit 5

# Regulatory updates
exa search "{market} regulation policy changes 2026" --content --limit 5
```

### Technology Exploration

Applicable to: Technology selection, architecture design, technical innovation

```bash
# Technology trends
exa search "{technology} trends 2026 roadmap" --content --limit 5

# Implementation cases
exa search "{technology} implementation case study production" --content --limit 5

# Performance comparison
exa search "{technology} benchmark comparison performance" --content --limit 5

# Ecosystem
exa search "{technology} ecosystem tools libraries frameworks" --content --limit 5
```

### User Experience

Applicable to: UX improvement, design innovation, usability research

```bash
# Design trends
exa search "{domain} UX design trends 2026" --content --limit 5

# User research
exa search "{domain} user research insights findings" --content --limit 5

# Accessibility
exa search "{domain} accessibility WCAG improvements" --content --limit 5

# Emotional design
exa search "{domain} emotional design user delight" --content --limit 5
```

## Search Result Filtering Strategies

### Timeliness Weight

| Publication Time | Weight | Description                        |
| ---------------- | ------ | ---------------------------------- |
| < 6 months       | High   | Latest trends, prioritize citation |
| 6-12 months      | Medium | Valid reference                    |
| 1-2 years        | Low    | Verify if still valid              |
| > 2 years        | Lowest | Historical reference only          |

### Source Priority

| Source Type                       | Priority   | Description               |
| --------------------------------- | ---------- | ------------------------- |
| Official documentation            | ⭐⭐⭐⭐⭐ | Most authoritative        |
| Industry reports                  | ⭐⭐⭐⭐   | Reliable data             |
| Tech blogs (well-known companies) | ⭐⭐⭐⭐   | Rich practical experience |
| Academic papers                   | ⭐⭐⭐     | Theoretical support       |
| Personal blogs                    | ⭐⭐       | Requires cross-validation |
| Social media                      | ⭐         | Trend awareness only      |

### Information Quality Check

✅ Valid information characteristics:

- Supported by specific data or cases
- Traceable sources
- Opinions backed by evidence
- Author has relevant background

❌ Low-quality information characteristics:

- Pure opinion without evidence
- Advertorial content
- Outdated information
- Unknown sources

## Cross-Industry Search Strategies

### Analogy Search Templates

```bash
# Learn from other industries
exa search "{problem} solution in {other_industry}" --content --limit 5

# Examples:
# "checkout optimization in gaming industry"
# "user onboarding in fintech"
# "subscription model in media industry"
```

### Recommended Cross-Industry Mappings

| Original Domain | Recommended Reference Domain | Reason                                           |
| --------------- | ---------------------------- | ------------------------------------------------ |
| E-commerce      | Gaming, Finance              | Conversion rate optimization, payment experience |
| SaaS            | Consumer goods, Media        | Subscription model, user retention               |
| Healthcare      | Aviation, Nuclear            | Safety procedures, error prevention              |
| Education       | Gaming, Entertainment        | Engagement, incentive mechanisms                 |
| Logistics       | Manufacturing, Retail        | Efficiency optimization, inventory management    |

## Search Result Integration Principles

1. **Deduplicate and merge**: Keep only the best source for similar content
2. **Mark contradictions**: Annotate conflicts when different sources have opposing views
3. **Identify gaps**: Record areas not covered by searches
4. **Extract insights**: Derive 1-2 actionable insights from each result
