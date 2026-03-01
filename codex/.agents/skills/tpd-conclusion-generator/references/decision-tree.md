# Decision Tree

## Purpose

Defines deterministic conclusion assembly from thinking artifacts.

## Branches

1. Input gate
   - Require `${run_dir}/synthesis.md`.
   - Missing file stops with `MISSING_SYNTHESIS`.
2. Clarification gate
   - If `${run_dir}/clarifications.md` exists, merge into unresolved item tracking.
   - If not present, continue with synthesis-only baseline.
3. Completeness gate
   - Validate sections: `constraints`, `risks`, `success_criteria`.
   - Missing sections stop with `INCOMPLETE_SYNTHESIS`.
4. Open-question gate
   - Unresolved assumptions are promoted to planning questions.
5. Output gate
   - Produce `conclusion.md` and return `ready` JSON.
