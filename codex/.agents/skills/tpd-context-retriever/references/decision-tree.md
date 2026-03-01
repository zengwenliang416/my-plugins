# Decision Tree

## Purpose

Defines deterministic context retrieval branching for dev phase.

## Branches

1. Argument gate
   - Require `run_dir`.
   - Optional `mode` defaults to `full`.
2. Mode gate
   - `full`: gather complete context from scope artifacts.
   - `incremental`: require `base_context` and retrieve only missing evidence.
   - Other values stop with `INVALID_MODE`.
3. Scope gate
   - Require `${run_dir}/tasks.md` as scope anchor.
   - Missing scope file stops with `MISSING_TASK_SCOPE`.
4. Evidence gate
   - Retrieved context must include file paths and symbol-level evidence.
5. Output gate
   - Emit context artifact and readiness JSON contract.
