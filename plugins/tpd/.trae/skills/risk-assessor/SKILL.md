---
name: risk-assessor
description: |
  [Trigger] Plan workflow Step 5: Assess technical risks and implementation obstacles
  [Output] Outputs ${run_dir}/risks.md
  [Mandatory Tool] codex-cli (security/performance review)
---

# Risk Assessor - Risk Assessment Atomic Skill

## Responsibility Boundary

- **Input**: `run_dir` + `${run_dir}/architecture.md` + `${run_dir}/tasks.md`
- **Output**: `${run_dir}/risks.md`
- **Single Responsibility**: Only do risk assessment, no plan integration

## Tool Integration

| Tool | Purpose | Trigger |
| -------- | ------- | ------- |

## Execution Flow

```
  thought: "Planning risk assessment strategy. Need: 1) Identify risk categories 2) Apply OWASP scoring 3) Calculate Likelihood 4) Calculate Impact 5) Develop mitigation strategies",
  thoughtNumber: 1,
  totalThoughts: 6,
  nextThoughtNeeded: true
})
```

**Thinking Steps**:

1. **Risk Category Scanning**: Technical/Security/Performance/Integration/Resource
2. **Threat Agent Analysis**: Skill/Motivation/Opportunity/Size
3. **Vulnerability Factor Assessment**: Discoverability/Exploitability/Awareness/Detection
4. **Technical Impact Calculation**: Confidentiality/Integrity/Availability/Accountability
5. **Business Impact Assessment**: Financial/Reputation/Compliance/Privacy
6. **Mitigation Strategy Matching**: Avoid/Transfer/Mitigate/Accept

### Step 1: Read Input

Read 工具读取 `${run_dir}/architecture.md`
Read 工具读取 `${run_dir}/tasks.md`
Read 工具读取 `${run_dir}/requirements.md`

Extract:

- Architecture decisions
- Technology choices
- Task dependencies
- Non-functional requirements

### Step 2: Risk Identification

Identify risks in the following categories:

| Risk Category    | Identification Source                | Example                      |
| ---------------- | ------------------------------------ | ---------------------------- |
| Technical Risk   | Architecture decisions, tech choices | New framework learning curve |
| Security Risk    | Authentication, data handling        | SQL injection, XSS           |
| Performance Risk | Data volume, concurrency             | Database bottleneck          |
| Integration Risk | Third-party deps, APIs               | External service instability |
| Resource Risk    | Skills, time                         | Lack of domain expert        |

### Step 3: Call External Model for Security Review

调用 /codex-cli，参数：prompt=Perform security risk analysis on the following architecture...

### Step 4: OWASP Risk Scoring

Apply OWASP risk scoring methodology:

#### Formula

```
Risk = Likelihood × Impact
```

#### Likelihood Factors

| Factor Category | Factor          | Score Range |
| --------------- | --------------- | ----------- |
| Threat Agent    | Skill Level     | 0-9         |
| Threat Agent    | Motivation      | 0-9         |
| Threat Agent    | Opportunity     | 0-9         |
| Threat Agent    | Size            | 0-9         |
| Vulnerability   | Discoverability | 0-9         |
| Vulnerability   | Exploitability  | 0-9         |
| Vulnerability   | Awareness       | 0-9         |
| Vulnerability   | Detection       | 0-9         |

Likelihood = (Factor Total) / 8

#### Impact Factors

| Factor Category  | Factor          | Score Range |
| ---------------- | --------------- | ----------- |
| Technical Impact | Confidentiality | 0-9         |
| Technical Impact | Integrity       | 0-9         |
| Technical Impact | Availability    | 0-9         |
| Technical Impact | Accountability  | 0-9         |
| Business Impact  | Financial       | 0-9         |
| Business Impact  | Reputation      | 0-9         |
| Business Impact  | Compliance      | 0-9         |
| Business Impact  | Privacy         | 0-9         |

Impact = max(Technical Impact Average, Business Impact Average)

#### Risk Levels

| Score | Level  |
| ----- | ------ |
| 0-3   | LOW    |
| 3-6   | MEDIUM |
| 6-9   | HIGH   |

### Step 5: Mitigation Strategies

Develop mitigation strategies for medium and high risks:

| Strategy Type | Description                  | Example                      |
| ------------- | ---------------------------- | ---------------------------- |
| Avoid         | Eliminate risk source        | Abandon unstable dependency  |
| Transfer      | Transfer risk to third party | Use managed service          |
| Mitigate      | Reduce impact or likelihood  | Add input validation         |
| Accept        | Accept the risk              | Risk acceptable and low cost |

### Step 6: Structured Output

使用 Edit 工具写入 `${run_dir}/risks.md`:

```markdown
# Risk Assessment

## Metadata

- Assessment Time: [timestamp]
- Total Risks: [count]
- High Risks: [count]
- Medium Risks: [count]

## Risk Summary

| Level  | Count | Requires Immediate Action |
| ------ | ----- | ------------------------- |
| HIGH   | X     | ✅ Yes                    |
| MEDIUM | Y     | ⚠️ Recommended            |
| LOW    | Z     | Acceptable                |

## High Priority Risks

### R-001: Database migration affects existing data

| Property        | Value                                      |
| --------------- | ------------------------------------------ |
| ID              | R-001                                      |
| Category        | Technical Risk                             |
| Scenario        | Database schema change may cause data loss |
| Affected Assets | User table data                            |

#### OWASP Scoring

| Factor                 | Score   | Description                   |
| ---------------------- | ------- | ----------------------------- |
| **Likelihood Factors** |         |                               |
| Skill Level            | 3       | Requires DBA knowledge        |
| Motivation             | 5       | Development pressure          |
| Opportunity            | 7       | Migration is required         |
| Size                   | 5       | Internal dev team             |
| Discoverability        | 8       | Migration reveals immediately |
| Exploitability         | 6       | Bad script triggers it        |
| Awareness              | 7       | Common issue                  |
| Detection              | 4       | Discoverable via testing      |
| **Likelihood**         | **5.6** | MEDIUM                        |
| **Impact Factors**     |         |                               |
| Confidentiality        | 2       | No leak involved              |
| Integrity              | 9       | Data may be lost              |
| Availability           | 7       | Service may be interrupted    |
| Accountability         | 3       | Traceable                     |
| Financial              | 5       | Recovery costs needed         |
| Reputation             | 6       | User trust damaged            |
| Compliance             | 4       | May violate SLA               |
| Privacy                | 3       | No privacy leak               |
| **Impact**             | **5.9** | MEDIUM                        |
| **Risk Score**         | **5.8** | MEDIUM (near HIGH)            |

#### Mitigation Strategy

| Strategy | Measure                      | Owner   | Verification        |
| -------- | ---------------------------- | ------- | ------------------- |
| Mitigate | Validate in staging first    | DBA     | Migration test pass |
| Mitigate | Prepare rollback script      | Backend | Rollback executable |
| Mitigate | Backup data before migration | DevOps  | Backup confirmed    |

#### Residual Risk

After mitigation measures:

- New Likelihood: 3.5 (LOW-MEDIUM)
- Residual Risk Score: 3.5 × 5.9 = 2.1 (LOW)

---

### R-002: JWT Secret Leak

[Similar format...]

## Medium Priority Risks

### R-003: Third-party OAuth Service Instability

[Risk details...]

## Low Priority Risks

### R-004: UI Rendering Performance

[Risk details...]

## Risk Matrix

|                       | Low Impact | Medium Impact | High Impact |
| --------------------- | ---------- | ------------- | ----------- |
| **High Likelihood**   |            | R-003         |             |
| **Medium Likelihood** |            | R-001         | R-002       |
| **Low Likelihood**    | R-004      |               |             |

## Risk Register

| ID    | Risk         | Category  | Likelihood | Impact | Score | Level  | Control         | Status  |
| ----- | ------------ | --------- | ---------- | ------ | ----- | ------ | --------------- | ------- |
| R-001 | DB Migration | Technical | 5.6        | 5.9    | 5.8   | MEDIUM | Backup+Rollback | Pending |
| R-002 | JWT Leak     | Security  | 3.5        | 8.0    | 5.6   | MEDIUM | Key rotation    | Pending |

## Security Review Results (Codex)

[Codex security analysis output]

## Recommended Actions

### Must Handle (Blocks Release)

1. R-001: Prepare database migration rollback plan
2. R-002: Implement JWT secret rotation mechanism

### Should Handle (Before Release)

3. R-003: Add OAuth service circuit breaker

### Can Defer

4. R-004: Optimize rendering performance

---

Next step: Call plan-synthesizer to integrate plan
```

## Return Value

After execution, return:

```
Risk assessment complete.
Output file: ${run_dir}/risks.md
Total risks: X
High risks: Y
Medium risks: Z

Next step: Use /plan-synthesizer to integrate plan
```

## Quality Gates

- ✅ Called external model for security review
- ✅ Applied OWASP risk scoring
- ✅ Each risk has mitigation strategy
- ✅ Generated risk matrix
- ✅ Marked release-blocking risks

## Constraints

- Must call codex-cli for security review
- Do not do plan integration (delegated to plan-synthesizer)
- High risks must have mitigation strategies
- Scoring must have basis, no arbitrary scoring
