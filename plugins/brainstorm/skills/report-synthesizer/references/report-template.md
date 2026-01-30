# Brainstorming Report Template

## Brief Version

```markdown
# {topic} - Brainstorming Report

**Date**: {date}
**Participating Models**: Codex, Gemini
**Divergence Method**: {method}
**Total Ideas**: {total_ideas}

---

## 🎯 Core Insights

{A paragraph summarizing the core findings and conclusions of this brainstorming session, about 100-150 words}

---

## 🏆 Top 3 Solutions

### 1. {title} ⭐ {score}

**Description**: {Brief description, 1-2 sentences}

**Highlights**: {Core advantages}

**Next Step**: {Immediately actionable item}

---

### 2. {title} ⭐ {score}

**Description**: {Brief description}

**Highlights**: {Core advantages}

**Next Step**: {Immediately actionable item}

---

### 3. {title} ⭐ {score}

**Description**: {Brief description}

**Highlights**: {Core advantages}

**Next Step**: {Immediately actionable item}

---

## 📋 Next Steps

- [ ] **This Week**: {Most urgent action item}
- [ ] **This Week**: {Second most urgent action item}
- [ ] **Next Week**: {Action item requiring preparation}
- [ ] **This Month**: {Mid-term action item}

---

> 📁 Full Report: `{run_dir}/`
>
> Contains complete materials including research brief, idea pool, evaluation details, etc.
```

---

## Detailed Version

```markdown
---
generated_at: { timestamp }
topic: "{topic}"
method: "{method}"
total_ideas: { total_ideas }
top_ideas: 5
format: detailed
---

# {topic} - Complete Brainstorming Report

## 1. Executive Summary

### 1.1 Problem Definition

**Core Problem**: {research_brief.core_problem}

**Keywords**: `{keyword1}`, `{keyword2}`, `{keyword3}`

### 1.2 Key Constraints

| Constraint Type | Details                 |
| --------------- | ----------------------- |
| Time            | {Time constraint}       |
| Resources       | {Resource constraint}   |
| Technology      | {Technology constraint} |
| Other           | {Other constraints}     |

### 1.3 Results Overview

| Metric             | Value            |
| ------------------ | ---------------- |
| Research Findings  | {N} trends/cases |
| Generated Ideas    | {M}              |
| Filtered Solutions | Top 5            |
| Average Score      | {avg_score}      |

---

## 2. Research Findings

{If research-brief.md exists}

### 2.1 Market Trends

| Trend     | Description   | Relevance  |
| --------- | ------------- | ---------- |
| {Trend 1} | {Description} | ⭐⭐⭐⭐⭐ |
| {Trend 2} | {Description} | ⭐⭐⭐⭐   |
| {Trend 3} | {Description} | ⭐⭐⭐⭐   |

**Key Insights**: {Core insights extracted from trends}

### 2.2 Case Analysis

| Case     | Company   | Key Approach | Results   |
| -------- | --------- | ------------ | --------- |
| {Case 1} | {Company} | {Approach}   | {Results} |
| {Case 2} | {Company} | {Approach}   | {Results} |
| {Case 3} | {Company} | {Approach}   | {Results} |

**Takeaways**:

- {Takeaway 1}
- {Takeaway 2}

### 2.3 Cross-Industry Inspiration

| Source Domain | Inspiration Point   | Transferable Application |
| ------------- | ------------------- | ------------------------ |
| {Domain 1}    | {Inspiration point} | {Application method}     |
| {Domain 2}    | {Inspiration point} | {Application method}     |

{Otherwise display}

> ℹ️ This brainstorming session skipped the research phase (--skip-research)

{/If}

---

## 3. Ideas Overview

### 3.1 Mind Map

{evaluation.mermaid_mindmap}

### 3.2 Category Statistics

| Category               | Count | Percentage | Representative Idea |
| ---------------------- | ----- | ---------- | ------------------- |
| Product Features       | {n1}  | {%}        | {Representative}    |
| User Experience        | {n2}  | {%}        | {Representative}    |
| Technical Architecture | {n3}  | {%}        | {Representative}    |
| Business Model         | {n4}  | {%}        | {Representative}    |
| Operations Strategy    | {n5}  | {%}        | {Representative}    |

### 3.3 Source Distribution

| Source | Count      | Characteristics              |
| ------ | ---------- | ---------------------------- |
| Codex  | {n_codex}  | Strong technical feasibility |
| Gemini | {n_gemini} | High user value              |
| Merged | {n_merged} | Dual perspective fusion      |

---

## 4. Evaluation Results

### 4.1 Evaluation Criteria

**Mode**: {criteria}

| Dimension   | Weight | Description                |
| ----------- | ------ | -------------------------- |
| Impact      | {w1}%  | Impact/Value               |
| Feasibility | {w2}%  | Feasibility/Difficulty     |
| Innovation  | {w3}%  | Innovation/Differentiation |
| Alignment   | {w4}%  | Fit                        |

### 4.2 Evaluation Matrix

{evaluation.mermaid_quadrant}

**Matrix Interpretation**:

- **Execute First**: {List idea IDs}
- **Strategic Reserve**: {List idea IDs}
- **Quick Experiment**: {List idea IDs}
- **Temporarily Shelve**: {List idea IDs}

### 4.3 Ranking Overview

| Rank | ID   | Idea    | Impact | Feasibility | Innovation | Alignment | Total Score |
| ---- | ---- | ------- | ------ | ----------- | ---------- | --------- | ----------- |
| 🥇   | {id} | {title} | {i}    | {f}         | {n}        | {a}       | **{score}** |
| 🥈   | {id} | {title} | {i}    | {f}         | {n}        | {a}       | **{score}** |
| 🥉   | {id} | {title} | {i}    | {f}         | {n}        | {a}       | **{score}** |
| 4    | {id} | {title} | {i}    | {f}         | {n}        | {a}       | **{score}** |
| 5    | {id} | {title} | {i}    | {f}         | {n}        | {a}       | **{score}** |

---

## 5. Top 5 Solutions Detailed

### 5.1 🥇 Solution One: {title}

**ID**: {id}
**Source**: {source}
**Overall Score**: ⭐ {score}

#### Description

{Detailed description, 3-5 sentences}

#### Evaluation Details

| Dimension   | Score  | Rationale   |
| ----------- | ------ | ----------- |
| Impact      | ⭐×{n} | {Rationale} |
| Feasibility | ⭐×{n} | {Rationale} |
| Innovation  | ⭐×{n} | {Rationale} |
| Alignment   | ⭐×{n} | {Rationale} |

#### Advantages

- {Advantage 1}
- {Advantage 2}
- {Advantage 3}

#### Risks & Challenges

- {Risk 1}
- {Risk 2}

#### Implementation Recommendations

1. **Step One**: {Specific action}
2. **Step Two**: {Specific action}
3. **Step Three**: {Specific action}

#### Resource Requirements

| Resource Type | Requirement   |
| ------------- | ------------- |
| Personnel     | {Description} |
| Time          | {Description} |
| Budget        | {Description} |
| Technology    | {Description} |

---

### 5.2 🥈 Solution Two: {title}

{Same structure as above...}

---

### 5.3 🥉 Solution Three: {title}

{Same structure as above...}

---

### 5.4 Solution Four: {title}

{Simplified version, only includes description, score, core advantages, and next step}

---

### 5.5 Solution Five: {title}

{Simplified version}

---

## 6. Risks & Blind Spots

### 6.1 Identified Risks

| Risk     | Level     | Impact Scope | Mitigation Measures |
| -------- | --------- | ------------ | ------------------- |
| {Risk 1} | 🔴 High   | {Scope}      | {Measures}          |
| {Risk 2} | 🟡 Medium | {Scope}      | {Measures}          |
| {Risk 3} | 🟢 Low    | {Scope}      | {Measures}          |

### 6.2 Potential Blind Spots

**Factors Not Fully Considered**:

- {Blind spot 1}
- {Blind spot 2}

**Requires Further Validation**:

- {Assumption 1}
- {Assumption 2}

**Recommended Additional Research**:

- {Research direction 1}
- {Research direction 2}

---

## 7. Next Steps

### 7.1 Immediate Actions (This Week)

- [ ] {Action item 1} - Owner: {TBD}
- [ ] {Action item 2} - Owner: {TBD}
- [ ] {Action item 3} - Owner: {TBD}

### 7.2 Short-term Plan (Within 1 Month)

- [ ] {Action item 1}
- [ ] {Action item 2}
- [ ] {Action item 3}

### 7.3 Mid-term Plan (Within 1 Quarter)

- [ ] {Action item 1}
- [ ] {Action item 2}

### 7.4 Decision Points

| Timeline | Decision Content | Basis   |
| -------- | ---------------- | ------- |
| {Date}   | {Decision 1}     | {Basis} |
| {Date}   | {Decision 2}     | {Basis} |

---

## Appendix

### A. Complete Idea List

<details>
<summary>Click to expand ({total_ideas} ideas)</summary>

{ideas_pool.complete_list}

</details>

### B. Raw Research Data

<details>
<summary>Click to expand search records</summary>

{research_brief.raw_search_results}

</details>

### C. Model Collaboration Records

| Model  | Contribution | Characteristics |
| ------ | ------------ | --------------- |
| Codex  | {n} ideas    | Technical depth |
| Gemini | {n} ideas    | User insights   |

### D. Workflow Execution Records

| Phase               | Status | Output File          |
| ------------------- | ------ | -------------------- |
| Phase 1: Research   | ✅     | research-brief.md    |
| Phase 2: Divergence | ✅     | ideas-pool.md        |
| Phase 3: Evaluation | ✅     | evaluation.md        |
| Phase 4: Report     | ✅     | brainstorm-report.md |

---

> 📅 Generated at: {timestamp}
>
> 📁 Complete working directory: `{run_dir}/`
```

---

## Field Filling Guide

### Score Display Conversion

| Score   | Display    |
| ------- | ---------- |
| 5.0     | ⭐⭐⭐⭐⭐ |
| 4.0-4.9 | ⭐⭐⭐⭐   |
| 3.0-3.9 | ⭐⭐⭐     |
| 2.0-2.9 | ⭐⭐       |
| 1.0-1.9 | ⭐         |

### Risk Level Colors

| Level  | Icon | Criteria                                |
| ------ | ---- | --------------------------------------- |
| High   | 🔴   | May lead to failure                     |
| Medium | 🟡   | Requires attention and contingency plan |
| Low    | 🟢   | Controllable minor issues               |

### Timeline Recommendations

- **This Week**: Small actions that can be started immediately
- **This Month**: Actions requiring preparation and coordination
- **This Quarter**: Actions requiring resource investment
- **Decision Points**: Nodes requiring adjustment based on results
