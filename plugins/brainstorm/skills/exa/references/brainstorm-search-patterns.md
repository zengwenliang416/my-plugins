# Brainstorm Search Patterns

Exa search strategies optimized for brainstorming scenarios.

## Five Search Dimensions

### 1. Trends

**Purpose**: Understand the latest dynamics and development directions in the field

```bash
# Template
"{topic} trends 2026"
"{topic} future predictions"
"{topic} emerging technologies"

# Examples
"smart home trends 2026" --content --limit 5
"AI applications future predictions" --content --limit 5
```

**Quality Sources**:

- `--include techcrunch.com,wired.com,theverge.com`
- `--category news`

### 2. Case Studies

**Purpose**: Learn from success stories and best practices

```bash
# Template
"{topic} case study success story"
"{topic} best practices examples"
"{company} {topic} implementation"

# Examples
"subscription model case study success story" --content --limit 5
"gamification user engagement best practices" --content --limit 5
```

**Quality Sources**:

- `--include hbr.org,medium.com,forbes.com`
- `--category company`

### 3. Cross-Industry Inspiration

**Purpose**: Borrow innovative ideas from other industries

```bash
# Template
"{problem} solution from {other_industry}"
"{topic} inspiration {industry_name}"
"how {industry} solved {similar_problem}"

# Examples
"checkout optimization from gaming industry" --content --limit 5
"user onboarding inspiration from hospitality" --content --limit 5
```

**Recommended Cross-Industry Mapping**:
| Original Industry | Reference Industry | Reason |
|-------------------|-------------------|--------|
| E-commerce | Gaming, Finance | Conversion rate, payment experience |
| SaaS | Consumer goods, Media | Subscription, retention |
| Education | Gaming, Entertainment | Engagement, incentives |
| Healthcare | Aviation, Nuclear | Safety processes |

### 4. Pain Points

**Purpose**: Deeply understand user needs and market gaps

```bash
# Template
"{topic} challenges problems"
"{topic} user complaints reviews"
"{topic} pain points frustrations"
"why {topic} fails"

# Examples
"remote work challenges problems" --content --limit 5
"fitness app user complaints reviews" --content --limit 5
```

**Quality Sources**:

- `--include reddit.com,quora.com`
- `--category tweet` (authentic user voices)

### 5. Opportunities

**Purpose**: Discover market opportunities and innovation directions

```bash
# Template
"{topic} opportunities innovations"
"{topic} startups funding 2025-2026"
"{topic} disruption potential"
"underserved {topic} market"

# Examples
"eldercare technology opportunities innovations" --content --limit 5
"sustainable packaging startups funding 2025-2026" --content --limit 5
```

**Quality Sources**:

- `--include crunchbase.com,pitchbook.com`
- `--category company`

## Search Combination Strategies

### Quick Research (3 searches)

Suitable for limited time or clear topics:

1. Trends search - Understand the big picture
2. Case studies search - Learn from successes
3. Cross-industry search - Get inspiration

### Deep Research (5 searches)

Suitable for comprehensive insights:

1. Trends search
2. Case studies search
3. Cross-industry search
4. Pain points search - Discover issues
5. Opportunities search - Identify gaps

## Result Filtering Priority

### Timeliness

| Publication Time | Priority   | Usage                |
| ---------------- | ---------- | -------------------- |
| < 6 months       | ⭐⭐⭐⭐⭐ | Latest trends        |
| 6-12 months      | ⭐⭐⭐⭐   | Valid reference      |
| 1-2 years        | ⭐⭐⭐     | Needs verification   |
| > 2 years        | ⭐⭐       | Historical reference |

### Source Authority

| Source Type      | Priority   | Applicable Search     |
| ---------------- | ---------- | --------------------- |
| Industry reports | ⭐⭐⭐⭐⭐ | Trends, opportunities |
| Major media      | ⭐⭐⭐⭐   | Cases, trends         |
| Academic papers  | ⭐⭐⭐⭐   | Problems, methods     |
| Company blogs    | ⭐⭐⭐     | Cases, practices      |
| Social media     | ⭐⭐       | Pain points, feedback |

## Common Domain Filters

### Trends/News

```bash
--include techcrunch.com,wired.com,theverge.com,arstechnica.com
```

### Business/Cases

```bash
--include hbr.org,forbes.com,inc.com,fastcompany.com
```

### Technology/Development

```bash
--include github.com,dev.to,medium.com,stackoverflow.com
```

### User Voices

```bash
--include reddit.com,quora.com,producthunt.com
```

### Research/Reports

```bash
--include mckinsey.com,gartner.com,forrester.com
```
