---
name: audit-reviewer
description: |
  [Trigger] Dev workflow step 5: Audit code changes to ensure quality and security.
  [Output] Outputs ${run_dir}/audit-{model}.md containing audit results and fix recommendations.
  [Skip] Code implementation (use code-implementer), prototype generation (use prototype-generator).
  [Ask First] If changes.md is missing, ask about the file scope to audit
  [Mandatory Tool] Must invoke codex-cli or gemini-cli Skill, Claude self-audit is prohibited.
allowed-tools:
  - Read
  - Write
  - Skill
  - mcp__sequential-thinking__sequentialthinking
arguments:
  - name: run_dir
    type: string
    required: true
    description: Run directory path (passed by orchestrator)
  - name: model
    type: string
    required: true
    description: Audit model (codex or gemini)
  - name: focus
    type: string
    required: false
    description: Audit focus (security,performance or ux,accessibility)
---

# Audit Reviewer - Audit Review Atomic Skill

## 🚨 CRITICAL: Must Invoke codex-cli or gemini-cli Skill

```
┌─────────────────────────────────────────────────────────────────┐
│  ❌ Prohibited: Claude doing audit itself (skipping external    │
│     model)                                                       │
│  ❌ Prohibited: Directly calling codeagent-wrapper via Bash     │
│  ✅ Required: Invoke codex-cli or gemini-cli via Skill tool     │
│                                                                  │
│  This is the core of multi-model collaboration!                  │
│  Claude cannot replace Codex/Gemini audit!                       │
│                                                                  │
│  Execution order (must follow):                                  │
│  1. Read changes.md                                              │
│  2. Skill invocation to codex-cli or gemini-cli                  │
│  3. Write external model output to audit-{model}.md              │
│                                                                  │
│  If Step 2 is skipped, the entire multi-model audit fails!       │
└─────────────────────────────────────────────────────────────────┘
```

## Responsibility Boundary

- **Input**: `run_dir` + `model` type + `focus`
- **Output**: `${run_dir}/audit-{codex|gemini}.md`
- **Single Responsibility**: Only do audit review, no code modifications

## MCP Tool Integration

| MCP Tool              | Purpose                                           | Trigger     |
| --------------------- | ------------------------------------------------- | ----------- |
| `sequential-thinking` | Structured audit strategy covering all dimensions | 🚨 Required |

## Execution Flow

### Step 0: Structured Audit Planning (sequential-thinking)

🚨 **Must first use sequential-thinking to plan audit strategy**

```
mcp__sequential-thinking__sequentialthinking({
  thought: "Planning code audit strategy. Need: 1) Understand change scope 2) Determine audit perspective 3) Identify critical paths 4) Check security/performance 5) Evaluate maintainability",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})
```

**Thinking Steps**:

1. **Change Scope Understanding**: Extract changed files and code from changes.md
2. **Audit Perspective**: Determine security/UX perspective based on model parameter
3. **Critical Path Identification**: Identify high-risk code paths
4. **Security/Performance Check**: Check OWASP Top 10 and performance issues
5. **Maintainability Assessment**: Evaluate code quality and maintainability

### Step 1: Read Change List

```bash
Read ${run_dir}/changes.md
Extract: Changed file list, added/modified/deleted code
```

### Step 2: Determine Audit Perspective

Determine audit focus based on model type:

| Model  | Skill      | Audit Perspective | Focus Areas                                       |
| ------ | ---------- | ----------------- | ------------------------------------------------- |
| Codex  | codex-cli  | Backend/Security  | Vulnerabilities, performance, errors, edge cases  |
| Gemini | gemini-cli | Frontend/UX       | Accessibility, responsive, UX, design consistency |

### Step 3: Invoke External Model Skill (🚨 Required)

**🚨🚨🚨 This is the critical step!**

**❌ Prohibited Actions:**

- ❌ Using Bash tool to call codeagent-wrapper
- ❌ Doing audit analysis yourself
- ❌ Skipping Skill and writing audit report directly

**✅ Only Correct Approach: Use Skill tool**

**For Codex model (security/performance audit), execute immediately:**

```
Skill(skill="codex-cli", args="--role reviewer --prompt 'Review code changes. Change list path: ${RUN_DIR}/changes.md. Please read that file first, then review code. Review focus: Security vulnerabilities (SQL injection/XSS/CSRF), performance issues (N+1/memory leaks), error handling, edge cases. Output: 1.Issue list (Critical>Major>Minor) 2.Fix recommendations 3.Score (1-5) 4.Recommendation (APPROVE/REQUEST_CHANGES/COMMENT)'")
```

**For Gemini model (UX/accessibility audit), execute immediately:**

```
Skill(skill="gemini-cli", args="--role reviewer --prompt 'Review frontend code changes. Change list path: ${RUN_DIR}/changes.md. Please read that file first, then review code. Review focus: Accessibility (ARIA/keyboard navigation), responsive design, user experience, design consistency. Output: 1.Issue list (Critical>Major>Minor) 2.Fix recommendations 3.Score (1-5) 4.Recommendation (APPROVE/REQUEST_CHANGES/COMMENT)'")
```

**⚠️ If you find yourself doing audit analysis instead of invoking Skill, stop immediately and use Skill tool instead!**

### Step 4: Structured Output

Write audit results to `${run_dir}/audit-{model}.md`:

```markdown
# {Codex|Gemini} Audit Report

## Audit Information

- Model: {codex|gemini}
- Perspective: {Backend/Security|Frontend/UX}
- Audit Time: [timestamp]

## Audit Results

### Overall Score

| Dimension              | Score   | Notes |
| ---------------------- | ------- | ----- |
| Security/Accessibility | X/5     | ...   |
| Performance/Responsive | X/5     | ...   |
| Code Quality           | X/5     | ...   |
| Maintainability        | X/5     | ...   |
| **Total**              | **X/5** | ...   |

### Issue List

#### Critical (Must Fix)

| #   | File:Line     | Issue Description  | Fix Recommendation      |
| --- | ------------- | ------------------ | ----------------------- |
| 1   | src/foo.ts:25 | SQL injection risk | Use parameterized query |

#### Major (Should Fix)

| #   | File:Line     | Issue Description   | Fix Recommendation |
| --- | ------------- | ------------------- | ------------------ |
| 2   | src/bar.ts:10 | Unhandled exception | Add try-catch      |

#### Minor (Optional Fix)

| #   | File:Line      | Issue Description | Fix Recommendation        |
| --- | -------------- | ----------------- | ------------------------- |
| 3   | src/utils.ts:5 | Unclear naming    | Use more descriptive name |

### Highlights

- [Commendable implementation]
- [Good code practices]

## Conclusion

- **Recommendation**: ✅ APPROVE / 🔄 REQUEST_CHANGES / 💬 COMMENT
- **Rationale**: [One sentence explanation]

---

Based on changes: changes.md
Next step: Synthesize audit results to determine delivery readiness
```

## Parallel Execution (Background Mode)

Supports dual-model parallel audit, coordinated by orchestrator using Task tool:

```
# Orchestrator invocation
Task(skill="audit-reviewer", args="run_dir=${RUN_DIR} model=codex focus=security,performance", run_in_background=true) &
Task(skill="audit-reviewer", args="run_dir=${RUN_DIR} model=gemini focus=ux,accessibility", run_in_background=true) &
wait
# Synthesize both audit reports
```

## Return Value

Upon completion, return:

```
{Model} audit complete.
Output file: ${run_dir}/audit-{model}.md

📊 Audit Results:
- Critical: X
- Major: Y
- Minor: Z
- Total Score: A/5

Recommendation: {APPROVE|REQUEST_CHANGES|COMMENT}

Next step: Wait for all audits to complete for synthesis
```

## Quality Gates

- ✅ Audit covers all changed files
- ✅ Critical issues must be fixed to pass
- ✅ Total score ≥ 3/5 to pass
- ✅ Both model audit opinions are considered

## Constraints

- No code modifications (handled by code-implementer)
- No prototype generation (handled by prototype-generator)
- Audit opinions are for reference, final decision by user
- External model audit requires Claude synthesis evaluation

## 🚨 Mandatory Tool Verification

**After executing this Skill, the following conditions must be met:**

| Check Item            | Requirement | Verification Method                  |
| --------------------- | ----------- | ------------------------------------ |
| Skill invocation      | Required    | Check codex-cli or gemini-cli called |
| External model output | Required    | audit-{model}.md contains response   |
| Claude self-audit     | Prohibited  | Cannot skip Skill and write directly |
| Direct Bash codeagent | Prohibited  | Must invoke via Skill tool           |

**If codex-cli or gemini-cli Skill was not invoked, this Skill execution fails!**
