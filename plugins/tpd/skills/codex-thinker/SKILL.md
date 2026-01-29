---
name: codex-thinker
description: |
  [Trigger] Thinking workflow Phase 3: Use Codex-CLI for deep reasoning
  [Output] Outputs ${run_dir}/codex-thought.md containing Codex's reasoning process and conclusions
  [Skip] Light mode (unless --parallel is specified)
  [Ask First] No need to ask, automatically executes
  [🚨 Mandatory] Must use codeagent-wrapper codex command
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
    description: Reasoning intensity (low/high)
---

# Codex Thinker - Codex Reasoning Atomic Skill

## MCP Tool Integration

| MCP Tool              | Purpose                                    | Trigger              |
| --------------------- | ------------------------------------------ | -------------------- |
| `sequential-thinking` | Plan reasoning strategy, structured output | 🚨 Required per exec |

## External Tool Integration

| External Tool       | Purpose                       | Trigger                     |
| ------------------- | ----------------------------- | --------------------------- |
| `codeagent-wrapper` | Call Codex for deep reasoning | 🚨 Core execution, required |

## Responsibility Boundary

- **Input**: User question (read from `${run_dir}/input.md`)
- **Output**: `${run_dir}/codex-thought.md`
- **Core Capability**: Technical reasoning, code logic analysis, security review
- **Write Scope**: Only allowed to write to `${run_dir}` (in OpenSpec artifacts directory), prohibited from modifying project business code and other OpenSpec specifications

---

## 🚨 CRITICAL: Mandatory Tool Usage Rules

```
┌─────────────────────────────────────────────────────────────────┐
│  🤖 Codex Reasoning                                              │
│     ✅ Required: ~/.claude/bin/codeagent-wrapper codex          │
│     ✅ Required: mcp__sequential-thinking__sequentialthinking   │
│     ❌ Prohibited: Simulating Codex output, skipping Bash cmd   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Codex Reasoning Mode Description

| Level | Model Config        | Use Case                        | Token Budget |
| ----- | ------------------- | ------------------------------- | ------------ |
| low   | o4-mini + standard  | Medium complexity reasoning     | ~8k          |
| high  | o3 + high reasoning | Complex architecture, deep code | ~32k         |

---

## Execution Flow

### Step 0: Structured Reasoning Planning (sequential-thinking)

🚨 **Must first use sequential-thinking to plan reasoning strategy**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Planning Codex reasoning strategy. Need: 1) Read question 2) Build Codex prompt 3) Execute codeagent-wrapper 4) Parse output 5) Format and save",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**Thinking Steps**:

1. **Question Reading**: Get original question content
2. **Prompt Building**: Select prompt template based on level
3. **Codex Execution**: Call codeagent-wrapper codex
4. **Output Parsing**: Extract reasoning process and core conclusions
5. **Format and Save**: Write to codex-thought.md

### Step 1: Read Question

```
Read("${run_dir}/input.md")
```

### Step 2: Call Codex Reasoning

**Low Level (Medium Depth)**:

```bash
~/.claude/bin/codeagent-wrapper codex --prompt "
You are a senior technical expert. Please perform deep technical analysis on the following question:

Question: ${QUESTION}

Only output analysis conclusions, do not generate code/patches or modify any project files.

Please reason from the following perspectives:
1. Technical feasibility analysis
2. Implementation path derivation
3. Potential risk identification
4. Best practice recommendations

Please show your reasoning process, including:
- Logical derivation at each step
- Key assumption explanations
- Confidence assessment
"
```

**High Level (Maximum Depth)**:

```bash
~/.claude/bin/codeagent-wrapper codex --prompt "
You are a top-tier system architect. Please perform comprehensive deep analysis on the following complex question:

Question: ${QUESTION}

Only output analysis conclusions, do not generate code/patches or modify any project files.

Please perform reasoning at the following levels:

## Level 1: Problem Decomposition
- Identify core problem and sub-problems
- Establish dependencies between problems
- Determine resolution order

## Level 2: Solution Exploration
- Generate at least 3 possible solutions
- Analyze pros and cons of each solution
- Evaluate technical complexity and risks

## Level 3: Deep Reasoning
- Select optimal solution
- Derive implementation steps in detail
- Verify logical completeness

## Level 4: Security & Performance
- Security risk analysis
- Performance bottleneck prediction
- Scalability assessment

Please show the complete reasoning chain, including assumptions, derivations, and conclusions.
"
```

### Step 3: Parse and Save Results

**Output Path**: `${run_dir}/codex-thought.md`

**Document Template**:

```markdown
---
generated_at: { ISO 8601 timestamp }
model: codex-cli
level: { low / high }
session_id: { Codex session ID }
---

# Codex Reasoning Output

## Original Question

{Question content}

## Reasoning Configuration

- **Reasoning Level**: { low / high }
- **Model**: { o4-mini / o3 }
- **Execution Time**: { seconds }s

## Reasoning Process

### Question Understanding

{Codex's understanding of the question}

### Reasoning Steps

{Codex's reasoning steps, preserve original format}

### Key Assumptions

{Assumptions during reasoning}

### Core Conclusions

{Codex's core conclusions}

## Confidence Assessment

- **Overall Confidence**: { High / Medium / Low }
- **Uncertainty Points**: { list }

## Raw Output
```

{Codex raw return content}

```

```

---

## Error Handling

### Codex Call Failure

```bash
# Retry once
~/.claude/bin/codeagent-wrapper codex --prompt "..." --retry

# If still fails, record error and continue
echo "Codex call failed: ${ERROR}" > "${run_dir}/codex-thought.md"
```

### Timeout Handling

```bash
# Set timeout (high level 3 minutes, low level 1 minute)
timeout ${TIMEOUT}s ~/.claude/bin/codeagent-wrapper codex --prompt "..."
```

---

## Quality Gates

### Tool Usage Verification

- [ ] Called `mcp__sequential-thinking__sequentialthinking` at least 1 time
- [ ] Called `codeagent-wrapper codex` command
- [ ] Produced codex-thought.md file

### Output Quality Verification

- [ ] Contains reasoning process
- [ ] Contains core conclusions
- [ ] Contains confidence assessment
- [ ] Raw output saved

---

## Return Value

On success, return:

```json
{
  "status": "success",
  "output_file": "${run_dir}/codex-thought.md",
  "level": "high",
  "execution_time": 45.2,
  "confidence": "high",
  "key_conclusions": ["Conclusion 1", "Conclusion 2"]
}
```

On failure, return:

```json
{
  "status": "error",
  "error_type": "timeout",
  "message": "Codex reasoning timeout",
  "fallback": "Continue using other model results"
}
```

---

## Constraints

- Must use codeagent-wrapper codex command
- Must use sequential-thinking to plan execution strategy
- Must save raw output
- Do not block workflow after timeout
- High level maximum wait 3 minutes
