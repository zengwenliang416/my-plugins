---
description: "Cross-layer security audit with 3 specialist agents + cross-validation debate + remediation synthesis"
argument-hint: "[target] [--scope=module|full] [--output=report|pr-comment]"
allowed-tools:
  - Task
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - TeamCreate
  - TeamDelete
  - TaskCreate
  - TaskUpdate
  - TaskList
  - TaskGet
  - TaskOutput
  - SendMessage
  - AskUserQuestion
  - mcp__auggie-mcp__codebase-retrieval
---

# /security-audit - Cross-Layer Security Audit

## Execution Model

```
Auto-execute (no prompt):
  Phase 1 → Phase 2 → Phase 3 → Phase 4

No hard stops (stateless audit run)
```

## Phase Overview

```
Phase 1: Init                       → Create RUN_DIR, discover target scope
Phase 2: Parallel Scanning (Team)   → 3 specialists scan independently
                                      code-scanner: Static analysis
                                      dependency-checker: CVE scanning
                                      config-auditor: Config & secrets
Phase 3: Cross-Validation (Debate)  → Each specialist reviews others' findings
                                      Identify attack chains across layers
Phase 4: Synthesis                  → Weighted voting + remediation plan
Phase 5: Report                     → Security report + summary
```

---

## Phase 1: Init

### Argument Parsing

| Option           | Description                       | Default |
| ---------------- | --------------------------------- | ------- |
| `--scope=value`  | Audit scope (module/full)         | full    |
| `--output=value` | Output format (report/pr-comment) | report  |
| `target`         | Target module/path                | .       |

### Run Directory Creation

```bash
# Derive CHANGE_ID: kebab-case from audit target
# Examples: "audit-payment-service", "audit-auth-endpoints"
# Fallback: "audit-$(date +%Y%m%d-%H%M%S)"
CHANGE_ID="audit-${slug_from_target}"
RUN_DIR="openspec/changes/${CHANGE_ID}"
mkdir -p "$RUN_DIR"
```

**OpenSpec scaffold** — write immediately after `mkdir`:

- `${RUN_DIR}/proposal.md`: `# Change:` title, `## Why` (audit purpose), `## What Changes` (audit deliverables), `## Impact`
- `${RUN_DIR}/tasks.md`: one numbered section per phase (Init, Parallel Scanning, Cross-Validation, Synthesis, Report) with `- [ ]` items

Mark items `[x]` as each phase completes.

### Target Scope Discovery

Use `mcp__auggie-mcp__codebase-retrieval` to discover security-relevant code:

- Authentication & authorization modules
- API endpoints & route handlers
- Database query builders
- User input handlers
- File upload handlers
- Payment & financial operations
- Session & token management
- Configuration files (.env, config/\*.js, etc.)
- Dependency files (package.json, package-lock.json, yarn.lock)

Write discovery results to `${RUN_DIR}/target-scope.md`:

```markdown
# Security Audit Target Scope

**Timestamp**: ${TIMESTAMP}
**Scope**: ${SCOPE}
**Target**: ${TARGET}

## Discovered Security-Relevant Files

### Authentication & Authorization

- [file paths]

### API Endpoints

- [file paths]

### Database Operations

- [file paths]

### User Input Handlers

- [file paths]

### Configuration

- [file paths]

### Dependencies

- package.json
- package-lock.json / yarn.lock
```

---

## Phase 2: Parallel Scanning (Lead Inline Orchestration)

**Lead executes all steps directly** (not delegated to a coordinator Task). This ensures visibility.

### Step 1: Create Team & Tasks

```
TeamCreate(team_name="security-audit-team", description="Cross-layer security audit with debate pattern")
```

Create 6 tasks with dependencies:

```
# Phase A: Independent scanning (parallel)
TaskCreate(subject="Code security scan", description="Static analysis for OWASP Top 10 vulnerabilities. run_dir=${RUN_DIR}", activeForm="Scanning code")             # 1
TaskCreate(subject="Dependency vulnerability scan", description="CVE scanning and supply chain analysis. run_dir=${RUN_DIR}", activeForm="Scanning dependencies")  # 2
TaskCreate(subject="Configuration audit", description="Secrets detection and config hardening check. run_dir=${RUN_DIR}", activeForm="Auditing configuration")     # 3

# Phase B: Cross-validation (blocked by all Phase A tasks)
TaskCreate(subject="Cross-validate from code perspective", description="Review dependency + config findings for exploit paths. run_dir=${RUN_DIR}", activeForm="Cross-validating code")         # 4
TaskUpdate(taskId="4", addBlockedBy=["1", "2", "3"])
TaskCreate(subject="Cross-validate from dependency perspective", description="Verify vulnerable deps are actually used in code. run_dir=${RUN_DIR}", activeForm="Cross-validating dependencies") # 5
TaskUpdate(taskId="5", addBlockedBy=["1", "2", "3"])
TaskCreate(subject="Cross-validate from config perspective", description="Review for misconfiguration exploitation vectors. run_dir=${RUN_DIR}", activeForm="Cross-validating config")         # 6
TaskUpdate(taskId="6", addBlockedBy=["1", "2", "3"])
```

### Step 2: Spawn 3 Specialist Agents (parallel, background)

```
Task(subagent_type="security-audit:code-scanner", name="code-scanner", team_name="security-audit-team",
  description="Static code security scanner",
  prompt="You are code-scanner on team security-audit-team.
  Read plugins/security-audit/agents/scanning/code-scanner.md for your full instructions.
  run_dir=${RUN_DIR}
  Phase A: Claim task 1, analyze code for OWASP Top 10 vulnerabilities, write scan-code.md, mark completed.
  Phase B: When task 4 unblocks, claim it, read scan-dependencies.md and scan-config.md, identify exploitable attack paths, write cross-validation-code.md, mark completed.",
  run_in_background=true)

Task(subagent_type="security-audit:dependency-checker", name="dependency-checker", team_name="security-audit-team",
  description="Dependency vulnerability checker",
  prompt="You are dependency-checker on team security-audit-team.
  Read plugins/security-audit/agents/scanning/dependency-checker.md for your full instructions.
  run_dir=${RUN_DIR}
  Phase A: Claim task 2, run npm audit and analyze dependencies, write scan-dependencies.md, mark completed.
  Phase B: When task 5 unblocks, claim it, read scan-code.md and scan-config.md, verify if vulnerable deps are used, write cross-validation-dependencies.md, mark completed.",
  run_in_background=true)

Task(subagent_type="security-audit:config-auditor", name="config-auditor", team_name="security-audit-team",
  description="Configuration security auditor",
  prompt="You are config-auditor on team security-audit-team.
  Read plugins/security-audit/agents/scanning/config-auditor.md for your full instructions.
  run_dir=${RUN_DIR}
  Phase A: Claim task 3, audit configuration for secrets and misconfigurations, write scan-config.md, mark completed.
  Phase B: When task 6 unblocks, claim it, read scan-code.md and scan-dependencies.md, identify misconfiguration exploitation paths, write cross-validation-config.md, mark completed.",
  run_in_background=true)
```

### Step 3: Wait for All Agents to Complete

**MUST wait** — do NOT take over specialist work. Lead's only job here is waiting.

```
# Block-wait for all 3 background agents to finish (no timeout)
TaskOutput(task_id=code_scanner_id, block=true)
TaskOutput(task_id=dependency_checker_id, block=true)
TaskOutput(task_id=config_auditor_id, block=true)
```

After all 3 return, verify via TaskList that all 6 tasks (Phase A + Phase B) are completed.

**FORBIDDEN**: Lead must NOT perform scanning itself. If an agent fails, re-spawn it — do not replace it.

### Step 4: Shutdown Team

```
SendMessage(type="shutdown_request", recipient="code-scanner", content="Scan complete")
SendMessage(type="shutdown_request", recipient="dependency-checker", content="Scan complete")
SendMessage(type="shutdown_request", recipient="config-auditor", content="Scan complete")
TeamDelete()
```

### Outputs

- `${RUN_DIR}/scan-code.md` (Phase A)
- `${RUN_DIR}/scan-dependencies.md` (Phase A)
- `${RUN_DIR}/scan-config.md` (Phase A)
- `${RUN_DIR}/cross-validation-code.md` (Phase B)
- `${RUN_DIR}/cross-validation-dependencies.md` (Phase B)
- `${RUN_DIR}/cross-validation-config.md` (Phase B)

---

## Phase 3: Synthesis (Lead)

Read all 6 reports and synthesize findings.

### Weighted Voting Rules

When specialists disagree on severity or exploitability:

1. **Domain expert weight**: 2x vote on domain-specific conflicts
   - Code vulnerability conflicts → code-scanner 2x weight
   - Dependency conflicts → dependency-checker 2x weight
   - Config conflicts → config-auditor 2x weight

2. **Severity escalation**: If any specialist rates CRITICAL, escalate to CRITICAL

3. **2/3 majority**: For non-domain conflicts, use 2/3 majority rule

4. **Quantifiable data**: For measurable issues (CVE scores, CVSS), adopt calculated value

5. **Subjective disagreement**: Mark `[CONTESTED, manual review recommended]`

### Attack Chain Analysis

Identify cross-layer attack scenarios by connecting findings across specialists:

```
Example:
[CRITICAL] Hardcoded JWT secret in config/auth.js (config-auditor)
    ↓ [CONFIRMED BY code-scanner]
[HIGH] JWT verification bypass in middleware/auth.js (code-scanner)
    ↓ [CONFIRMED BY code-scanner]
[MEDIUM] Admin route accessible without proper auth check (code-scanner)
    ↓
= CRITICAL ATTACK CHAIN: Full privilege escalation via config + auth bypass
```

Attack chain criteria:

- Requires 2+ findings from different specialists
- Confirmed exploitable path during cross-validation
- Combined severity >= HIGH

### Remediation Priority

Assign priority levels:

- **P0 (Critical)**: CRITICAL severity OR attack chains → Fix immediately
- **P1 (High)**: HIGH severity standalone issues → Fix within 1 week
- **P2 (Medium)**: MEDIUM severity → Fix within 2 weeks
- **P3 (Low)**: LOW severity → Backlog

---

## Phase 4: Report (Lead)

Write `${RUN_DIR}/security-report.md`:

```markdown
# Security Audit Report

**Date**: ${TIMESTAMP}
**Scope**: ${SCOPE}
**Target**: ${TARGET}
**Risk Level**: [CRITICAL / HIGH / MEDIUM / LOW]

## Executive Summary

- Total findings: X
- By severity: CRITICAL(X), HIGH(X), MEDIUM(X), LOW(X)
- Attack chains identified: X
- Priority distribution: P0(X), P1(X), P2(X), P3(X)

## Risk Assessment

Overall risk level is determined by:

- CRITICAL findings > 0 → CRITICAL
- HIGH findings > 0 OR attack chains > 0 → HIGH
- MEDIUM findings > 0 → MEDIUM
- Only LOW findings → LOW

## Attack Chains

[If cross-layer vulnerabilities found]

### Attack Chain 1: [Title]

**Risk**: CRITICAL
**Impact**: [Description of potential damage]

**Attack Path**:

1. [Finding 1] (${specialist}) - ${severity}
   ↓
2. [Finding 2] (${specialist}) - ${severity}
   ↓
3. [Impact]

**Remediation**:

- [Step 1]
- [Step 2]

---

## Findings by Severity

### CRITICAL

#### 1. [Title]

- **Category**: [OWASP A01 / CVE-XXXX / Config]
- **Specialist**: ${specialist}
- **Location**: ${file}:${line}
- **Description**: ...
- **PoC**: ...
- **Remediation**: ...
- **Priority**: P0

### HIGH

[...]

### MEDIUM

[...]

### LOW

[...]

---

## Remediation Plan

### Immediate Actions (P0)

1. [Action] - [ETA: immediate]
2. [Action] - [ETA: immediate]

### Short-term (P1)

1. [Action] - [ETA: 1 week]
2. [Action] - [ETA: 1 week]

### Medium-term (P2)

1. [Action] - [ETA: 2 weeks]
2. [Action] - [ETA: 2 weeks]

### Backlog (P3)

1. [Action] - [ETA: future sprint]

---

## Dependency Updates

\`\`\`bash

# Critical dependency fixes

npm update ${package}@${version}

# Full npm audit fix

npm audit fix

# Or for yarn

yarn upgrade ${package}@${version}
\`\`\`

---

## Config Hardening Checklist

- [ ] Rotate exposed secrets (${count} found)
- [ ] Enable security headers (${count} missing)
- [ ] Review CORS policy
- [ ] Disable debug mode in production
- [ ] Remove hardcoded credentials
- [ ] Update .gitignore for sensitive files

---

## Specialist Agreement

### Consensus Findings

[Findings where all 3 specialists agreed]

### Contested Findings

[Findings with specialist disagreement - recommend manual review]

---

## Appendix

### Scan Coverage

- Files scanned: ${count}
- Lines of code analyzed: ${count}
- Dependencies checked: ${count}
- Config files reviewed: ${count}

### Tools Used

- Static analysis: ESLint security rules, custom pattern matching
- Dependency scanning: npm audit / yarn audit
- Secret detection: Regex patterns for API keys, passwords, tokens

### False Positive Rate

[If applicable, note any findings marked as false positives during cross-validation]
```

### Display Summary to User

```
🔒 Security Audit Complete

Risk Level: ${RISK_LEVEL}

Findings:
  CRITICAL: ${count}
  HIGH: ${count}
  MEDIUM: ${count}
  LOW: ${count}

Attack Chains: ${count}

Remediation Priority:
  P0 (Immediate): ${count}
  P1 (1 week): ${count}
  P2 (2 weeks): ${count}
  P3 (Backlog): ${count}

Full report: ${RUN_DIR}/security-report.md

Next steps:
1. Review attack chains (highest risk)
2. Address P0 findings immediately
3. Plan remediation for P1/P2 findings
4. Update dependencies: npm audit fix
```

---

## Run Directory Structure

```
openspec/changes/${CHANGE_ID}/
├── target-scope.md                     # Phase 1: Target discovery
├── scan-code.md                        # Phase 2A: Code scanner findings
├── scan-dependencies.md                # Phase 2A: Dependency checker findings
├── scan-config.md                      # Phase 2A: Config auditor findings
├── cross-validation-code.md            # Phase 2B: Code scanner debate
├── cross-validation-dependencies.md    # Phase 2B: Dependency debate
├── cross-validation-config.md          # Phase 2B: Config debate
└── security-report.md                  # Phase 3: Final report
```

---

## Agent Type Restrictions

This command uses the following agent types:

| Agent Type                          | Usage                                  |
| ----------------------------------- | -------------------------------------- |
| `security-audit:code-scanner`       | Phase 2: Static code analysis          |
| `security-audit:dependency-checker` | Phase 2: CVE and supply chain scanning |
| `security-audit:config-auditor`     | Phase 2: Configuration security audit  |

All agents participate in both Phase A (independent scan) and Phase B (cross-validation).

---

## Constraints

- **MUST NOT** invoke any agent types outside the Agent Type Restrictions table
- **MUST NOT** add improvised phases or steps
- **MUST NOT** take over specialist work (Lead only orchestrates & synthesizes)
- **MUST** use TeamCreate/TeamDelete for team lifecycle
- **MUST** wait with TaskOutput(block=true) — no timeout
- **MUST** complete cross-validation before synthesis
- **MUST** provide PoC for CRITICAL/HIGH findings
- **MUST** include remediation steps for all findings
- **MUST** identify and highlight attack chains across layers
- **MUST** use weighted voting for conflict resolution
