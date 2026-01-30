# Research Brief Output Template

## Template Structure

````markdown
---
generated_at: { timestamp }
topic: "{topic}"
search_count: { N }
deep_mode: { true/false }
---

# Topic Research Brief

## 1. Topic Analysis

**Core Problem**: {One sentence describing the problem the user wants to solve or the direction to explore}

**Keywords**: `{keyword1}`, `{keyword2}`, `{keyword3}`, `{keyword4}`

**Domain Category**: {Product/Technology/Market/Process/Experience}

**Constraints**:

- {User-provided limitation 1}
- {User-provided limitation 2}
- {Time/budget/technical constraints}

---

## 2. External Trends

### 2.1 Industry Trends

| Trend        | Description         | Source                 | Relevance  |
| ------------ | ------------------- | ---------------------- | ---------- |
| {Trend name} | {Brief description} | [{Source name}]({url}) | ⭐⭐⭐⭐⭐ |
| {Trend name} | {Brief description} | [{Source name}]({url}) | ⭐⭐⭐⭐   |
| {Trend name} | {Brief description} | [{Source name}]({url}) | ⭐⭐⭐     |

**Key Insights**:

> {1-2 core insights extracted from the trends}

### 2.2 Related Cases

| Case        | Company/Product | Key Approach    | Results              | Source            |
| ----------- | --------------- | --------------- | -------------------- | ----------------- |
| {Case name} | {Company name}  | {Core approach} | {Quantified results} | [{Source}]({url}) |
| {Case name} | {Company name}  | {Core approach} | {Quantified results} | [{Source}]({url}) |
| {Case name} | {Company name}  | {Core approach} | {Quantified results} | [{Source}]({url}) |

**Takeaways**:

- {Takeaway 1}
- {Takeaway 2}

### 2.3 Cross-Industry Inspiration

| Source Domain | Inspiration Point           | Transferable Application        |
| ------------- | --------------------------- | ------------------------------- |
| {Domain name} | {Approach from that domain} | {How to apply to current topic} |
| {Domain name} | {Approach from that domain} | {How to apply to current topic} |

---

## 3. Problems & Opportunities {deep_mode ? '' : '(Unlock with Deep Mode)'}

{If deep_mode = true}

### 3.1 Identified Problems

| Problem   | Impact               | Current Solution    | Room for Improvement    |
| --------- | -------------------- | ------------------- | ----------------------- |
| {Problem} | {Impact description} | {Existing solution} | {Improvement direction} |

### 3.2 Potential Opportunities

| Opportunity   | Market Size/Impact | Competition   | Entry Difficulty |
| ------------- | ------------------ | ------------- | ---------------- |
| {Opportunity} | {Size}             | {Competition} | {Difficulty}     |

{Otherwise display}

> 💡 Use the `--deep` parameter to unlock in-depth analysis of problems and opportunities

---

## 4. Divergent Direction Suggestions

Based on the above research, the following directions are recommended for creative divergence:

### Direction 1: {Direction Name}

**Description**: {One sentence description}

**Rationale**: {Why this direction is recommended}

**Potential Idea Types**: {Feature innovation/Experience optimization/Business model/...}

### Direction 2: {Direction Name}

**Description**: {One sentence description}

**Rationale**: {Why this direction is recommended}

**Potential Idea Types**: {Feature innovation/Experience optimization/Business model/...}

### Direction 3: {Direction Name}

**Description**: {One sentence description}

**Rationale**: {Why this direction is recommended}

**Potential Idea Types**: {Feature innovation/Experience optimization/Business model/...}

---

## 5. Research Limitations

- **Uncovered Areas**: {Aspects not covered by the search}
- **Information Timeliness**: {Parts where information may be outdated}
- **Needs Verification**: {Assumptions that need further validation}

---

## Appendix: Raw Search Results

<details>
<summary>Click to expand search records</summary>

### Search 1: Trend Search

**Query**: `{query}`
**Time**: {timestamp}
**Result Count**: {N}

```json
{exa_results_json}
```
````

### Search 2: Case Search

**Query**: `{query}`
**Time**: {timestamp}
**Result Count**: {N}

```json
{exa_results_json}
```

### Search 3: Cross-Industry Search

**Query**: `{query}`
**Time**: {timestamp}
**Result Count**: {N}

```json
{exa_results_json}
```

{If deep_mode}

### Search 4: Problem Search

**Query**: `{query}`
**Time**: {timestamp}
**Result Count**: {N}

```json
{exa_results_json}
```

### Search 5: Opportunity Search

**Query**: `{query}`
**Time**: {timestamp}
**Result Count**: {N}

```json
{exa_results_json}
```

{/If}

</details>
```

## Field Filling Guide

### Relevance Scoring

- ⭐⭐⭐⭐⭐: Directly relevant, can be applied immediately
- ⭐⭐⭐⭐: Highly relevant, usable with minor adjustments
- ⭐⭐⭐: Moderately relevant, requires transformation
- ⭐⭐: Indirectly relevant, for reference
- ⭐: Weakly relevant, for awareness only

### Keyword Extraction Principles

1. Prioritize extracting noun-based keywords
2. Include domain/technology/user-related terms
3. Avoid overly broad words (e.g., "good", "fast", "user")
4. 3-5 keywords are ideal

### Case Selection Criteria

1. Prioritize cases with quantifiable results
2. Prioritize well-known companies/products
3. Prioritize cases from the past 2 years
4. Diversity: different scales, different regions
