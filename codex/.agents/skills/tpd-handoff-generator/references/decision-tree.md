# Decision Tree

## Entry Gate
- Require `run_dir` and `proposal_id`.
- Require `${run_dir}/conclusion.md` and `${run_dir}/synthesis.md`.

## Branches
1. **Any required input missing** -> return `STATUS: FAILURE` and list missing paths.
2. **All required inputs present** -> build both markdown and JSON handoff payloads.
3. **Manifest update blocked** (missing `${run_dir}/meta/`) -> create target path before writing.

## Exit Criteria
- **Success:** `handoff.md`, `handoff.json`, and `meta/artifact-manifest.json` are all planned.
- **Failure:** At least one required prerequisite is missing.
