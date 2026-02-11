# Legacy Runtime Cleanup Report

Date: 2026-02-11
Scope: project-local `.claude/*/runs` directories under `ccg-workflows`

## Commands Executed

1. Pre-cleanup dry-run:

```bash
./scripts/cleanup-legacy-runs.sh
```

2. One-time execute cleanup:

```bash
./scripts/cleanup-legacy-runs.sh --execute
```

3. Post-cleanup verification:

```bash
./scripts/cleanup-legacy-runs.sh
```

## Before / After Metrics

| Metric | Before Cleanup | After Cleanup | Delta |
| --- | ---: | ---: | ---: |
| Legacy run roots (`.claude/<plugin>/runs`) | 7 | 0 | -7 |
| Legacy run directories (timestamp-level) | 43 | 0 | -43 |
| Disk usage (KB) | 57,584 | 0 | -57,584 |

Reclaimed size: **57,584 KB**

## Target Roots Removed

- `.claude/brainstorm/runs`
- `.claude/committing/runs`
- `.claude/developing/runs`
- `.claude/imaging/runs`
- `.claude/planning/runs`
- `.claude/reviewing/runs`
- `.claude/ui-design/runs`

## Notes

- The first execute run removed all listed targets but exited with a post-cleanup stats bug (`find: : No such file or directory`).
- The cleanup script was patched to handle empty target sets safely and rerun successfully.
- Final dry-run confirms zero remaining legacy run roots and zero legacy disk usage.
