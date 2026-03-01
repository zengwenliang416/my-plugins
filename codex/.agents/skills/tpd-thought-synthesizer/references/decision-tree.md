# Decision Tree

## Entry Gate
- Require `depth` in `{light, deep, ultra}`.
- Require at least one `${run_dir}/explore-*.json` file.

## Branches
1. **No explore artifact found** -> `STATUS: FAILURE`.
2. **depth=light** -> summarize only dominant constraints and top risks.
3. **depth=deep** -> include dependency graph and conflict resolution notes.
4. **depth=ultra** -> include exhaustive assumptions, fallback paths, and unresolved questions.
5. **Model thought files missing** -> continue with boundary evidence only and flag reduced confidence.

## Exit Criteria
- **Success:** synthesis scope matches selected depth and includes traceable constraints.
- **Failure:** invalid depth or missing exploration evidence.
