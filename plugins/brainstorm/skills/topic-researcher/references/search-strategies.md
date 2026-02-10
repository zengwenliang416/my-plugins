# External Search Strategies

Search templates and filtering strategies for different topic types.

## Topic Categories and Search Templates

### Product Innovation

Applicable to: New product design, feature innovation, product improvement

```bash
# Industry innovation
grok-search search "{product_type} innovation 2026" --max-results 5

# Startup trends
grok-search search "{product_type} startup ideas funding 2025-2026" --max-results 5

# User pain points
grok-search search "{product_type} user complaints reviews problems" --max-results 5

# Competitor analysis
grok-search search "{product_type} competitors comparison features" --max-results 5
```

### Process Optimization

Applicable to: Workflow improvement, efficiency enhancement, automation

```bash
# Best practices
grok-search search "{process} best practices case study" --max-results 5

# Automation tools
grok-search search "{process} automation tools comparison 2026" --max-results 5

# Bottleneck analysis
grok-search search "{process} bottleneck inefficiency solutions" --max-results 5

# Industry benchmarks
grok-search search "{process} industry benchmark metrics KPI" --max-results 5
```

### Market Trends

Applicable to: Market analysis, consumer insights, trend forecasting

```bash
# Market reports
grok-search search "{market} market trends 2026 report forecast" --max-results 5

# Consumer behavior
grok-search search "{market} consumer behavior changes preferences" --max-results 5

# Emerging technologies
grok-search search "{market} emerging technology impact disruption" --max-results 5

# Regulatory updates
grok-search search "{market} regulation policy changes 2026" --max-results 5
```

### Technology Exploration

Applicable to: Technology selection, architecture design, technical innovation

```bash
# Technology trends
grok-search search "{technology} trends 2026 roadmap" --max-results 5

# Implementation cases
grok-search search "{technology} implementation case study production" --max-results 5

# Performance comparison
grok-search search "{technology} benchmark comparison performance" --max-results 5

# Ecosystem
grok-search search "{technology} ecosystem tools libraries frameworks" --max-results 5
```

### User Experience

Applicable to: UX improvement, design innovation, usability research

```bash
# Design trends
grok-search search "{domain} UX design trends 2026" --max-results 5

# User research
grok-search search "{domain} user research insights findings" --max-results 5

# Accessibility
grok-search search "{domain} accessibility WCAG improvements" --max-results 5

# Emotional design
grok-search search "{domain} emotional design user delight" --max-results 5
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
grok-search search "{problem} solution in {other_industry}" --max-results 5

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
