# Security-Audit Plugin Usage Guide v1.0

Always answer in Chinese (Simplified).

## Available Skills

| Skill                   | Trigger                         | Description                              |
| ----------------------- | ------------------------------- | ---------------------------------------- |
| `/security-audit:audit` | "audit", "security", "安全审计" | Cross-layer security audit (Native Team) |

## Quick Start

```bash
# Full project security audit
/security-audit Full security audit for the entire codebase

# Audit specific module
/security-audit Audit the authentication module

# Focused audit with output format
/security-audit --scope=module --output=report Audit API endpoints
```

## Architecture

Fan-Out/Fan-In + Debate pattern with cross-layer vulnerability validation:

```
Phase 1: Init (Lead)                    — mkdir, target scope discovery
Phase 2: Parallel Scanning (Team)       — 3 specialists scan independently
         ├─ code-scanner                — Static analysis (OWASP Top 10)
         ├─ dependency-checker          — CVE & supply chain risks
         └─ config-auditor              — Secrets & misconfigurations
Phase 3: Cross-Validation (Debate)      — Each specialist reviews others' findings
         ├─ code-scanner                — Check if config/dep findings have exploit paths
         ├─ dependency-checker          — Verify vulnerable deps are actually used
         └─ config-auditor              — Review for misconfiguration exploitation vectors
Phase 4: Synthesis (Lead)               — Weighted voting + attack chain analysis
Phase 5: Report (Lead)                  — Security report + remediation plan
```

## Team Architecture

```
                          ┌─────────────────┐
                          │  Lead (inline)  │
                          └────────┬────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
        ┌─────▼─────┐        ┌────▼────┐        ┌─────▼─────┐
        │code-scanner│        │dep-check│        │config-audit│
        │  (static)  │        │  (CVE)  │        │ (secrets)  │
        └─────┬──────┘        └────┬────┘        └─────┬─────┘
              │                    │                    │
              └────────────────────┼────────────────────┘
                                   │
                            [Debate Phase]
              ┌────────────────────┼────────────────────┐
              │                    │                    │
        ┌─────▼─────┐        ┌────▼────┐        ┌─────▼─────┐
        │Cross-Valid│        │Cross-Val│        │Cross-Valid│
        │  (scanner)│        │  (dep)  │        │ (config)  │
        └───────────┘        └─────────┘        └───────────┘
                                   │
                          ┌────────▼────────┐
                          │  Synthesis      │
                          │ (weighted vote) │
                          └─────────────────┘
```

## Agent Types

| Agent Name         | Subagent Type                     | Purpose                                |
| ------------------ | --------------------------------- | -------------------------------------- |
| code-scanner       | security-audit:code-scanner       | Static analysis, OWASP Top 10          |
| dependency-checker | security-audit:dependency-checker | npm audit, CVE scanning                |
| config-auditor     | security-audit:config-auditor     | Secrets, permissions, security headers |

## Scanning Coverage

### Code Scanner

- SQL Injection, XSS, SSRF, Path Traversal
- Broken Authentication & Authorization
- Command Injection, Code Injection
- Race Conditions in Financial Operations
- Insecure Deserialization
- Output: CRITICAL/HIGH/MEDIUM/LOW with PoC

### Dependency Checker

- Known CVEs (npm audit / yarn audit)
- Outdated packages with vulnerabilities
- Transitive dependency risks
- License compliance
- Output: CVE-ID, severity, fix versions

### Config Auditor

- Hardcoded secrets (API keys, passwords, tokens)
- Security headers (CSP, CORS, HSTS, X-Frame-Options)
- Environment variable usage
- .gitignore coverage for sensitive files
- Debug mode & error exposure
- Output: findings with remediation steps

## Cross-Validation (Debate Phase)

Each specialist reviews others' findings to identify attack chains:

| Validator          | Checks                                                         |
| ------------------ | -------------------------------------------------------------- |
| code-scanner       | Do config/dep findings have exploitable code paths?            |
| dependency-checker | Are vulnerable dependencies actually imported and used?        |
| config-auditor     | Can misconfigurations amplify code/dependency vulnerabilities? |

## Output Structure

```
.claude/runs/${RUN_ID}/
├── target-scope.md                    # Phase 1: Target discovery
├── scan-code.md                       # Phase 2: Code scanner findings
├── scan-dependencies.md               # Phase 2: Dependency checker findings
├── scan-config.md                     # Phase 2: Config auditor findings
├── cross-validation-code.md           # Phase 3: Code scanner debate
├── cross-validation-dependencies.md   # Phase 3: Dependency debate
├── cross-validation-config.md         # Phase 3: Config debate
└── security-report.md                 # Phase 4: Final report + remediation
```

## Quality Gates

| Gate                     | Threshold                    |
| ------------------------ | ---------------------------- |
| CRITICAL vulnerabilities | = 0                          |
| HIGH vulnerabilities     | All have remediation plan    |
| Dependency coverage      | >= 95% of package.json       |
| Config secret detection  | 100% sensitive files checked |

## Weighted Voting Rules

When specialists disagree during synthesis:

1. **Domain expert weight**: 2x vote on domain-specific conflicts
   - Code vulnerability conflicts → code-scanner 2x weight
   - Dependency conflicts → dependency-checker 2x weight
   - Config conflicts → config-auditor 2x weight

2. **Severity escalation**: If any specialist rates CRITICAL, escalate to CRITICAL

3. **Attack chain priority**: Cross-layer vulnerabilities (confirmed by 2+ specialists) get priority remediation

## Attack Chain Analysis

Lead synthesizes cross-layer attack scenarios:

```
Example:
[CRITICAL] Hardcoded JWT secret (config-auditor)
    ↓
[HIGH] JWT verification bypass in auth middleware (code-scanner)
    ↓
[MEDIUM] Admin privileges accessible via forged token (code-scanner)
    ↓
= CRITICAL ATTACK CHAIN: Full system compromise via config + auth bypass
```

## Report Format

```markdown
# Security Audit Report

**Date**: ${TIMESTAMP}
**Scope**: ${TARGET_SCOPE}
**Risk Level**: CRITICAL / HIGH / MEDIUM / LOW

## Executive Summary

- Total findings: X
- By severity: CRITICAL(X), HIGH(X), MEDIUM(X), LOW(X)
- Attack chains identified: X

## Attack Chains

[If cross-layer vulnerabilities found]

## Findings by Severity

### CRITICAL

1. [Title]
   - Category: [OWASP/CVE/Config]
   - Location: [file:line]
   - Description: ...
   - PoC: ...
   - Remediation: ...
   - Priority: P0

### HIGH

...

## Remediation Plan

1. [P0] Fix CRITICAL vulnerabilities (ETA: immediate)
2. [P1] Address HIGH findings (ETA: 1 week)
3. [P2] Resolve MEDIUM issues (ETA: 2 weeks)
4. [P3] Address LOW findings (ETA: backlog)

## Dependency Updates

[npm/yarn upgrade commands]

## Config Hardening Checklist

- [ ] Rotate exposed secrets
- [ ] Enable security headers
- [ ] Review CORS policy
- [ ] Disable debug mode in production
```

## Constraints

- **MUST NOT** invoke any agent types outside the Agent Type Restrictions table
- **MUST NOT** add improvised phases or steps
- **MUST NOT** take over specialist work (Lead only orchestrates & synthesizes)
- **MUST** use TeamCreate/TeamDelete for team lifecycle
- **MUST** wait with TaskOutput(block=true) — no timeout
- **MUST** complete cross-validation before synthesis
- **MUST** provide PoC for CRITICAL/HIGH findings
- **MUST** include remediation steps for all findings

## Resume Workflow

Not supported in v1.0 (stateless audit runs).
