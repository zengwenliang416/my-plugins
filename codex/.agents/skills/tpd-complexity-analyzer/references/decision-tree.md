# Decision Tree

## Purpose

Defines deterministic complexity scoring and depth routing.

## Branches

1. Input gate
   - Require `${run_dir}/input.md`.
   - Missing file stops with `MISSING_INPUT`.
2. Scoring gate
   - Evaluate three dimensions from text signals:
     - scope breadth
     - ambiguity level
     - risk sensitivity
   - Total score range is `1..10`.
3. Routing gate
   - `1..3` => `light`
   - `4..6` => `deep`
   - `7..10` => `ultra`
4. Confirmation gate
   - Score `4..6` also sets `needs_confirmation=true` for depth confirmation.
5. Output gate
   - Emit contract JSON and target artifact path.
