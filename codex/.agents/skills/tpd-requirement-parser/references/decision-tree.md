# Decision Tree

## Entry Gate
- Require `run_dir`.
- Require at least one usable requirement source.

## Branches
1. **No source found** -> `STATUS: FAILURE`.
2. **Proposal source found** -> extract explicit requirements and assumptions.
3. **Thinking handoff source found** -> merge constraints and acceptance criteria into requirement set.
4. **Multiple sources found** -> deduplicate conflicts and keep source trace IDs.

## Exit Criteria
- **Success:** `requirements.md` can map every key requirement to at least one source.
- **Failure:** no reliable source for requirement extraction.
