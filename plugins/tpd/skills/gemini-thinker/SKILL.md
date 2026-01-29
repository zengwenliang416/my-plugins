---
name: gemini-thinker
description: |
  [Trigger] Thinking workflow Phase 3: Use Gemini Deep Think for deep reasoning
  [Output] Outputs ${run_dir}/gemini-thought.md containing Gemini's reasoning process and conclusions
  [Skip] Light mode (unless --parallel is specified)
  [Ask First] No need to ask, automatically executes
  [🚨 Mandatory] Must use codeagent-wrapper gemini command
allowed-tools:
  - Read
  - Write
  - Bash
  - mcp__sequential-thinking__sequentialthinking
arguments:
  - name: run_dir
    type: string
    required: true
    description: Run directory path
  - name: level
    type: string
    required: true
    description: Thinking depth (medium/high)
---

# Gemini Thinker - Gemini Reasoning Atomic Skill

## MCP Tool Integration

| MCP Tool              | Purpose                                    | Trigger              |
| --------------------- | ------------------------------------------ | -------------------- |
| `sequential-thinking` | Plan reasoning strategy, structured output | 🚨 Required per exec |

## External Tool Integration

| External Tool       | Purpose                | Trigger                     |
| ------------------- | ---------------------- | --------------------------- |
| `codeagent-wrapper` | Call Gemini Deep Think | 🚨 Core execution, required |

## Responsibility Boundary

- **Input**: User question (read from `${run_dir}/input.md`)
- **Output**: `${run_dir}/gemini-thought.md`
- **Core Capability**: Creative perspectives, parallel thinking streams, user experience analysis
- **Write Scope**: Only allowed to write to `${run_dir}` (in OpenSpec artifacts directory), prohibited from modifying project business code and other OpenSpec specifications

---

## 🚨 CRITICAL: Mandatory Tool Usage Rules

```
┌─────────────────────────────────────────────────────────────────┐
│  🤖 Gemini Deep Think                                            │
│     ✅ Required: ~/.claude/bin/codeagent-wrapper gemini         │
│     ✅ Required: mcp__sequential-thinking__sequentialthinking   │
│     ❌ Prohibited: Simulating Gemini output, skipping Bash cmd  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Gemini Deep Think Mode Description

| Level  | Config                 | Features                        | Token Budget |
| ------ | ---------------------- | ------------------------------- | ------------ |
| medium | thinking_level: medium | Balanced mode, moderate depth   | ~16k         |
| high   | thinking_level: high   | Maximum depth, parallel streams | ~32k         |

**Gemini Unique Capabilities**:

- **Parallel Thinking Streams**: Generate multiple ideas simultaneously and synthesize
- **Multi-perspective Analysis**: Examine problems from different angles
- **Creative Generation**: Excels at unconventional solutions

---

## Execution Flow

### Step 0: Structured Reasoning Planning (sequential-thinking)

🚨 **Must first use sequential-thinking to plan reasoning strategy**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Planning Gemini reasoning strategy. Need: 1) Read question 2) Build Gemini prompt 3) Execute codeagent-wrapper 4) Parse output 5) Format and save",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**Thinking Steps**:

1. **Question Reading**: Get original question content
2. **Prompt Building**: Select prompt template based on level
3. **Gemini Execution**: Call codeagent-wrapper gemini
4. **Output Parsing**: Extract parallel thinking streams and synthesized conclusions
5. **Format and Save**: Write to gemini-thought.md

### Step 1: Read Question

```
Read("${run_dir}/input.md")
```

### Step 2: Call Gemini Deep Think

**Medium Level**:

```bash
~/.claude/bin/codeagent-wrapper gemini --prompt "
You are a creative problem-solving expert. Please perform multi-angle deep analysis on the following question:

Question: ${QUESTION}

Only output analysis conclusions, do not generate code/patches or modify any project files.

Please think from the following perspectives:

## Perspective 1: Conventional Analysis
- What is the standard solution?
- Pros and cons of mainstream approaches

## Perspective 2: User Experience
- What does the user really need?
- How to optimize the experience?

## Perspective 3: Innovative Thinking
- Are there unconventional solutions?
- What experience can be borrowed from other fields?

Please synthesize the above perspectives and provide your analysis and recommendations.
"
```

**High Level (Deep Think Mode)**:

```bash
~/.claude/bin/codeagent-wrapper gemini --prompt "
You are a top-tier innovation consultant with deep knowledge across domains. Please use parallel thinking to comprehensively analyze the following complex question:

Question: ${QUESTION}

Only output analysis conclusions, do not generate code/patches or modify any project files.

Please initiate parallel thinking streams, analyzing deeply from the following 5 dimensions simultaneously:

## Thinking Stream 1: Problem Essence
- What is the essence of this problem?
- Difference between surface needs and deep needs
- Where are the problem boundaries?

## Thinking Stream 2: Existing Solution Review
- Common industry practices
- Limitations of these practices
- Why existing solutions may not be good enough

## Thinking Stream 3: Innovation Possibilities
- Inspiration borrowed from other industries
- Counter-intuitive solutions
- What would you do without any constraints

## Thinking Stream 4: Practical Considerations
- Implementation feasibility analysis
- Resource and time constraints
- Risk and reward balance

## Thinking Stream 5: Long-term Impact
- Long-term value to users
- Scalability and maintainability
- Future evolution path

Please synthesize results from 5 thinking streams, identify consensus and divergence points, and provide comprehensive recommendations.
"
```

### Step 3: Parse and Save Results

**Output Path**: `${run_dir}/gemini-thought.md`

**Document Template**:

```markdown
---
generated_at: { ISO 8601 timestamp }
model: gemini-cli
level: { medium / high }
session_id: { Gemini session ID }
---

# Gemini Reasoning Output

## Original Question

{Question content}

## Reasoning Configuration

- **Thinking Depth**: { medium / high }
- **Model**: Gemini 2.5 Deep Think
- **Execution Time**: { seconds }s
- **Parallel Stream Count**: { 3 / 5 }

## Multi-perspective Analysis

### Perspective/Thinking Stream 1: {Name}

{Analysis content}

### Perspective/Thinking Stream 2: {Name}

{Analysis content}

### Perspective/Thinking Stream 3: {Name}

{Analysis content}

{... more perspectives ...}

## Synthesized Analysis

### Consensus Points

{Consistent conclusions across perspectives}

### Divergence Points

{Different viewpoints across perspectives and reasons}

### Innovative Highlights

{Unconventional findings or recommendations}

## Core Conclusions

{Gemini's core conclusions}

## Confidence Assessment

- **Overall Confidence**: { High / Medium / Low }
- **Highest Confidence Perspective**: { perspective name }
- **Needs Further Exploration**: { list }

## Raw Output
```

{Gemini raw return content}

```

```

---

## Error Handling

### Gemini Call Failure

```bash
# Retry once
~/.claude/bin/codeagent-wrapper gemini --prompt "..." --retry

# If still fails, record error and continue
echo "Gemini call failed: ${ERROR}" > "${run_dir}/gemini-thought.md"
```

### Timeout Handling

```bash
# Set timeout (high level 3 minutes, medium level 1.5 minutes)
timeout ${TIMEOUT}s ~/.claude/bin/codeagent-wrapper gemini --prompt "..."
```

---

## Quality Gates

### Tool Usage Verification

- [ ] Called `mcp__sequential-thinking__sequentialthinking` at least 1 time
- [ ] Called `codeagent-wrapper gemini` command
- [ ] Produced gemini-thought.md file

### Output Quality Verification

- [ ] Contains multi-perspective analysis
- [ ] Contains synthesized analysis
- [ ] Contains core conclusions
- [ ] Raw output saved

---

## Return Value

On success, return:

```json
{
  "status": "success",
  "output_file": "${run_dir}/gemini-thought.md",
  "level": "high",
  "execution_time": 38.5,
  "parallel_streams": 5,
  "confidence": "high",
  "innovative_insights": ["Insight 1", "Insight 2"]
}
```

On failure, return:

```json
{
  "status": "error",
  "error_type": "api_error",
  "message": "Gemini API call failed",
  "fallback": "Continue using other model results"
}
```

---

## Constraints

- Must use codeagent-wrapper gemini command
- Must use sequential-thinking to plan execution strategy
- Must save raw output
- Do not block workflow after timeout
- Preserve parallel thinking stream structure
- High level maximum wait 3 minutes
