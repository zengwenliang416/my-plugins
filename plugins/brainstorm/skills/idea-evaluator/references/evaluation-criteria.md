# Idea Evaluation Criteria

## Evaluation Dimensions Explained

### Impact - Default Weight 35%

Evaluates the value and scope of influence an idea can produce.

| Score | Level     | Description                                          | Example                                   |
| ----- | --------- | ---------------------------------------------------- | ----------------------------------------- |
| 5     | Excellent | Completely solves core problem, wide-reaching impact | Disruptive product, changes user behavior |
| 4     | Good      | Significantly improves problem, substantial impact   | Major enhancement to core features        |
| 3     | Fair      | Partially solves problem, moderate impact            | Noticeable experience improvement         |
| 2     | Low       | Minor improvement, limited impact                    | Edge feature optimization                 |
| 1     | Minimal   | Almost no impact                                     | Nice to have                              |

**Evaluation Questions**:

- How important is the problem being solved?
- How many users will benefit?
- How long will the value last?
- Can it be quantitatively measured?

### Feasibility - Default Weight 35%

Evaluates implementation difficulty and resource requirements.

| Score | Level          | Description                                           | Time Reference        |
| ----- | -------------- | ----------------------------------------------------- | --------------------- |
| 5     | Very Easy      | Can be implemented with existing technology/resources | < 1 week              |
| 4     | Easy           | Minor new technology/resource learning                | 1-2 weeks             |
| 3     | Moderate       | Medium technical challenge                            | 2-4 weeks             |
| 2     | Difficult      | Significant challenge, requires new capabilities      | 1-3 months            |
| 1     | Very Difficult | Severe technical bottleneck, uncertain                | > 3 months or unknown |

**Evaluation Questions**:

- Is it technically achievable?
- What resources are needed?
- What dependencies and risks exist?
- Does the team have the capability?

### Innovation - Default Weight 20%

Evaluates the novelty and differentiation of the idea.

| Score | Level        | Description                                      | Market Impact                 |
| ----- | ------------ | ------------------------------------------------ | ----------------------------- |
| 5     | Disruptive   | Entirely new category/model                      | May redefine the market       |
| 4     | Breakthrough | Significant innovation, rarely seen in market    | Creates clear differentiation |
| 3     | Progressive  | Has innovation points, but not first-of-its-kind | Some differentiation          |
| 2     | Incremental  | Minor innovation, already exists in market       | Limited differentiation       |
| 1     | Imitative    | Almost no innovation                             | No differentiation            |

**Evaluation Questions**:

- Are there similar solutions in the market?
- Where is the innovation point?
- Can it create barriers?
- Will users be pleasantly surprised?

### Alignment - Default Weight 10%

Evaluates the match with goals and constraints.

| Score | Level         | Description                                          |
| ----- | ------------- | ---------------------------------------------------- |
| 5     | Perfect Match | Fully meets goals and constraints                    |
| 4     | High Match    | Major aspects align                                  |
| 3     | Basic Match   | Mostly aligned, minor deviations                     |
| 2     | Partial Match | Clear deviations                                     |
| 1     | Low Match     | Severely deviates from goals or violates constraints |

**Evaluation Questions**:

- Is it consistent with the original goal?
- Does it violate any constraints?
- Does it match existing capabilities?
- Is it aligned with strategic direction?

---

## Weight Preset Schemes

### balanced (Balanced Mode) - Default

Suitable for most scenarios, balances all dimensions.

```
Impact: 35%
Feasibility: 35%
Innovation: 20%
Alignment: 10%
```

**Applicable Scenarios**:

- Regular product iterations
- When no special preference exists
- When comprehensive trade-offs are needed

### impact (Impact Priority)

Suitable for scenarios pursuing maximum value.

```
Impact: 50%
Feasibility: 25%
Innovation: 15%
Alignment: 10%
```

**Applicable Scenarios**:

- When resources are abundant
- Pursuing breakthrough results
- Strategic projects

### feasibility (Feasibility Priority)

Suitable for resource-limited scenarios requiring quick validation.

```
Impact: 25%
Feasibility: 50%
Innovation: 15%
Alignment: 10%
```

**Applicable Scenarios**:

- When resources are tight
- Quick hypothesis validation
- MVP stage

### innovation (Innovation Priority)

Suitable for differentiation competition and exploratory projects.

```
Impact: 25%
Feasibility: 25%
Innovation: 40%
Alignment: 10%
```

**Applicable Scenarios**:

- Innovation-driven projects
- Differentiation competition
- Exploring new directions

---

## Composite Score Calculation

### Formula

```
Composite Score = (Impact × W_i) + (Feasibility × W_f) + (Innovation × W_n) + (Alignment × W_a)
```

### Example Calculation (balanced mode)

Idea C-1:

- Impact: 4.5
- Feasibility: 4.0
- Innovation: 3.5
- Alignment: 4.0

```
Composite Score = 4.5 × 0.35 + 4.0 × 0.35 + 3.5 × 0.20 + 4.0 × 0.10
               = 1.575 + 1.400 + 0.700 + 0.400
               = 4.075
```

### Score Range Interpretation

| Composite Score | Level     | Recommended Action                     |
| --------------- | --------- | -------------------------------------- |
| 4.5+            | Excellent | Prioritize execution, high attention   |
| 4.0-4.5         | Good      | Worth investing, careful planning      |
| 3.5-4.0         | Fair      | Can be considered, requires trade-offs |
| 3.0-3.5         | Average   | Keep as backup, low priority           |
| < 3.0           | Poor      | Shelve or abandon for now              |

---

## Evaluation Guidelines

### Avoiding Common Biases

1. **Halo Effect**: Don't favor ideas based on their source (Codex/Gemini)
2. **Anchoring Effect**: Evaluate each idea independently
3. **Bandwagon Effect**: Base evaluation on criteria, not comparison
4. **Confirmation Bias**: Objectively consider ideas that don't match expectations

### Evaluation Consistency

1. Use the same criteria for all ideas
2. Define reference points before scoring
3. Document evaluation rationale for review
4. When in doubt, use the middle value

### Handling Special Cases

**When information is insufficient**:

- Mark as "to be verified"
- Provide a range rather than precise value
- Explain in evaluation rationale

**When ideas overlap**:

- Evaluate the best version
- Note variant relationships
- Consider integration possibilities
