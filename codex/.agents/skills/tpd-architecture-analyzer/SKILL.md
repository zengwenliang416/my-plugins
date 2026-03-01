---
name: tpd-architecture-analyzer
description: "This skill synthesizes multi-model planning outputs into architecture artifacts, and it is not applicable when required plan inputs are missing."
allowed-tools:
  - Read
  - Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: Plan run directory
  - name: task_type
    type: string
    required: false
    description: fullstack, frontend, or backend
---

# tpd-architecture-analyzer

## Workflow

1. Run `scripts/run-tpd-architecture-analyzer.ts` to validate arguments and required inputs.
2. Select the branch in `references/decision-tree.md` from `task_type` and available planner outputs.
3. Integrate aligned architecture decisions and record unresolved conflicts.
4. Generate artifacts exactly as defined in `references/output-contract.md`.
5. Return execution status with explicit success or blocking reason.

## Decision Tree

1. Classify `task_type` as `fullstack`, `frontend`, or `backend`.
2. Validate planner artifact availability for the selected type.
3. If conflicts remain unresolved, mark them as open decisions before output.
4. Emit `architecture.md` and `constraints.md` only when all mandatory checks pass.

## References

- `references/decision-tree.md`
- `references/output-contract.md`
- `scripts/run-tpd-architecture-analyzer.ts`
