# Decision Tree

## Purpose

Defines deterministic selection and validation flow for prototype application.

## Branches

1. Input gate
   - If `run_dir` is missing, stop with `INVALID_ARGUMENT`.
2. Prototype gate
   - If neither `${run_dir}/prototype-codex.diff` nor `${run_dir}/prototype-gemini.diff` exists, stop with `NO_PROTOTYPE_DIFF`.
   - If one exists, use it as primary source.
   - If both exist, process codex and gemini diffs in deterministic filename order.
3. Constraints gate
   - If `constraints_ref` is provided, the file must exist.
   - If `pbt_ref` is provided, the file must exist.
4. Scope gate
   - Reject changes outside approved task scope.
   - Keep unresolved conflicts in `changes.md` as pending items.
5. Output gate
   - Produce outputs from `output-contract.md` and return `ready` JSON.
