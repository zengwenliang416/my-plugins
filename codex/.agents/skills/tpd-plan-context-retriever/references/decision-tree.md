# Decision Tree

## Entry Gate
- Require `${run_dir}/requirements.md`.
- Optional input: `${run_dir}/../thinking/handoff.json`.

## Branches
1. **Requirements missing** -> `STATUS: FAILURE`.
2. **Requirements present + handoff present** -> include thinking constraints in evidence capture.
3. **Requirements present + handoff missing** -> continue with requirements-only context and mark reduced confidence.
4. **Semantic retrieval unavailable** -> fallback to local repository evidence and note degraded source quality.

## Exit Criteria
- **Success:** `context.md` and `meta/evidence-capture.json` are fully specified.
- **Failure:** no validated requirements source.
