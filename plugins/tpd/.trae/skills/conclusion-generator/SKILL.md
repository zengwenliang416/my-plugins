---
name: conclusion-generator
description: |
  [Trigger] Thinking workflow Phase 5: Generate final conclusion and reasoning chain
  [Output] Outputs ${run_dir}/conclusion.md containing complete reasoning chain and final conclusion
  [Skip] None
  [Ask First] No need to ask, automatically executes
---

# Conclusion Generator - Conclusion Generation Atomic Skill

## Tool Integration

| Tool | Purpose | Trigger |
| -------- | ------- | ------- |

## Responsibility Boundary

Generate final conclusion and complete reasoning chain based on thought synthesis results.

- **Input**: `${run_dir}/synthesis.md`
- **Output**: `${run_dir}/conclusion.md`
- **Core Capability**: Reasoning chain construction, conclusion generation, confidence annotation

---

## 🚨 CRITICAL: Mandatory Tool Usage Rules

```
┌─────────────────────────────────────────────────────────────────┐
│  🎯 Conclusion Generation                                        │
│     ❌ Prohibited: Output conclusion without reasoning,         │
│        skip confidence annotation                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Execution Flow

```
  thought: "Planning conclusion generation strategy. Need: 1) Read synthesis 2) Review original question 3) Organize key evidence 4) Identify key assumptions 5) Build reasoning steps 6) Form core conclusion 7) Evaluate confidence 8) Identify limitations",
  thoughtNumber: 1,
  totalThoughts: 8,
  nextThoughtNeeded: true
})
```

**Thinking Steps**:

1. **Read Synthesis**: Get synthesis.md content
2. **Question Review**: Clarify what user really wants to solve
3. **Evidence Organization**: Extract key evidence supporting conclusion
4. **Assumption Identification**: List implicit assumptions in reasoning
5. **Reasoning Construction**: Arrange reasoning steps in logical order
6. **Conclusion Formation**: Distill core conclusion from reasoning chain
7. **Confidence Evaluation**: Comprehensively evaluate overall confidence
8. **Limitation Identification**: List limitations and scope of conclusion

### Step 1: Read Synthesis Results

```
使用 Read 工具读取 ${run_dir}/synthesis.md
使用 Read 工具读取 ${run_dir}/input.md  # Original question
```

### Step 2: Build Reasoning Chain

```
  thought: "Step 1: Review original question. Clarify what user really wants to solve, identify core requirements.",
  thoughtNumber: 2,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

  thought: "Step 2: Organize key evidence. From multi-model thinking and synthesis, extract key evidence and analysis supporting conclusion.",
  thoughtNumber: 3,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

  thought: "Step 3: Identify key assumptions. List implicit assumptions in reasoning, evaluate reliability of these assumptions.",
  thoughtNumber: 4,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

  thought: "Step 4: Build reasoning steps. Arrange reasoning steps in logical order, ensure each step has basis.",
  thoughtNumber: 5,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

  thought: "Step 5: Form core conclusion. Based on reasoning chain, distill core conclusion, ensure it directly answers original question.",
  thoughtNumber: 6,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

  thought: "Step 6: Evaluate confidence. Consider evidence strength, assumption reliability, model consensus to give overall confidence.",
  thoughtNumber: 7,
  totalThoughts: 8,
  nextThoughtNeeded: true
})

  thought: "Step 7: Identify limitations. List conclusion limitations, scope of applicability, and potential improvement directions.",
  thoughtNumber: 8,
  totalThoughts: 8,
  nextThoughtNeeded: false
})
```

### Step 3: Generate Conclusion Report

**Output path**: `${run_dir}/conclusion.md`

**Document template**:

```markdown
---
generated_at: { ISO 8601 timestamp }
generator_version: "1.0"
confidence: { high / medium / low }
reasoning_steps: { step count }
---

# Deep Thinking Conclusion

## Question Review

**Original Question**:
{User's original question}

**Question Essence**:
{What is the core requirement}

---

## Reasoning Chain

### Step 1: {Step Title}

**Reasoning Content**:
{Specific reasoning process}

**Basis**:

- {Basis 1}
- {Basis 2}

**Conclusion**: {This step's conclusion}

---

### Step 2: {Step Title}

{... same format ...}

---

### Step N: Final Derivation

**Reasoning Content**:
{Final derivation process}

**Comprehensive Basis**:

- From Claude: {basis}
- From Codex: {basis}
- From Gemini: {basis}

**Final Conclusion**: {Core conclusion}

---

## Core Conclusion

### Direct Answer

{Direct, concise answer to original question}

### Detailed Explanation

{Detailed explanation and background of conclusion}

### Key Points

1. **Point 1**: {Description}
2. **Point 2**: {Description}
3. **Point 3**: {Description}

---

## Confidence Analysis

### Overall Confidence: { High / Medium / Low }

**Confidence Explanation**:
{Why this confidence level}

### Confidence Breakdown

| Dimension              | Score (1-10) | Notes  |
| ---------------------- | ------------ | ------ |
| Evidence Sufficiency   | {score}      | {note} |
| Reasoning Rigor        | {score}      | {note} |
| Model Consensus        | {score}      | {note} |
| Assumption Reliability | {score}      | {note} |
| **Weighted Total**     | **{score}**  |        |

---

## Key Assumptions

### Assumption List

| #   | Assumption Content | Reliability  | Impact Scope  |
| --- | ------------------ | ------------ | ------------- |
| 1   | {Assumption 1}     | High/Med/Low | {Impact desc} |
| 2   | {Assumption 2}     | High/Med/Low | {Impact desc} |

### Assumption Risks

{How conclusion would change if certain assumptions don't hold}

---

## Limitations & Improvements

### Current Limitations

1. {Limitation 1}
2. {Limitation 2}
3. {Limitation 3}

### Scope of Applicability

- **Applicable**: {Scenarios where conclusion applies}
- **Not Applicable**: {Scenarios where conclusion doesn't apply}

### Further Exploration Directions

{Directions for deeper exploration}

---

## Summary

**One-Sentence Conclusion**:
{Most concise conclusion statement}

**Reasoning Chain Summary**:
{Question} → {Key Reasoning 1} → {Key Reasoning 2} → {Conclusion}

**Confidence**: { High / Medium / Low } | **Reasoning Steps**: { N }
```

---

## Quality Gates

### Tool Usage Verification

- [ ] Read synthesis.md and input.md files
- [ ] Produced conclusion.md file

### Output Quality Verification

- [ ] Each reasoning step has clear basis
- [ ] Core conclusion directly answers original question
- [ ] Confidence breakdown has reasonable explanation
- [ ] Key assumptions identified and evaluated
- [ ] Limitations and scope annotated

---

## Return Value

On success, return:

```json
{
  "status": "success",
  "output_file": "${run_dir}/conclusion.md",
  "confidence": "high",
  "reasoning_steps": 7,
  "one_line_conclusion": "One sentence conclusion",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "limitations_count": 3,
  "next_phase": {
    "phase": 6,
    "name": "delivery"
  }
}
```

---

## Constraints

- Conclusion must directly answer original question
- Must annotate confidence and assumptions
- Each reasoning step must have basis
- Clearly annotate limitations and scope
