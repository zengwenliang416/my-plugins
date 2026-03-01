# Decision Tree

## Purpose

Defines deterministic branching for architecture synthesis.

## Branches

1. Input gate
   - If `run_dir` is empty, stop with `INVALID_ARGUMENT`.
   - Otherwise continue.
2. Task type gate
   - `fullstack`: require both `codex-plan.md` and `gemini-plan.md`.
   - `backend`: require `codex-plan.md`.
   - `frontend`: require `gemini-plan.md`.
   - Other values: stop with `INVALID_TASK_TYPE`.
3. Baseline evidence gate
   - Require `requirements.md` and `context.md`.
   - Missing files stop with `MISSING_REQUIRED_INPUT`.
4. Conflict gate
   - If model plans disagree on hard constraints, keep both options and flag `open_decisions`.
   - If no conflict, produce a single recommended architecture path.
5. Output gate
   - Write outputs defined in `output-contract.md`.
   - Return `ready` status through stdout JSON contract.
