# Decision Tree

## Entry Gate
- Require `${run_dir}/architecture.md` and `${run_dir}/constraints.md`.
- `task_type` defaults to `fullstack`.

## Branches
1. **Input missing** -> `STATUS: FAILURE`.
2. **task_type=frontend** -> prioritize UI flow, accessibility, and client-state checks.
3. **task_type=backend** -> prioritize API, data, and integration checks.
4. **task_type=fullstack** -> split cross-layer tasks with explicit dependency links.
5. **Unknown task_type** -> `STATUS: FAILURE`.

## Exit Criteria
- **Success:** `tasks.md` and `pbt.md` contain complete dependency-aware task set.
- **Failure:** missing baseline artifacts or invalid `task_type`.
