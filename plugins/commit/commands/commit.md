---
description: "Commit workflow: investigate → parallel analyze → synthesize → branch → message → commit"
argument-hint: "[--no-verify] [--amend] [--scope] [--type] [--no-changelog] [--version] [--skip-branch] [--branch]"
allowed-tools: [Task, Skill, AskUserQuestion, Read, Bash]
---

# /commit

## 🚨 Execution Rules

**FULLY AUTOMATED. NO STOPPING BETWEEN PHASES.**

| ❌ Forbidden                    | ✅ Required                              |
| ------------------------------- | ---------------------------------------- |
| Stop after Task/Skill completes | After Task/Skill → IMMEDIATELY call next |
| Ask "continue?" between phases  | Hard stops ONLY at Phase 6 & 10          |
| Output intermediate results     | Phases 1→2→3→4→5 as atomic operation     |

---

## Flow

```
1   Initialize      → mkdir RUN_DIR
2   Investigate     → Task("change-investigator")    ─┐
3   Parallel Analyze                                   │
    ├─ Task("semantic-analyzer", run_in_background)    │ PARALLEL
    └─ Task("symbol-analyzer", run_in_background)     ─┤
4   Synthesize      → Skill("analysis-synthesizer")  ─┘
5   Branch          → Skill("branch-creator")
6   Confirm         → AskUserQuestion ⏸️ HARD STOP
    ├─ Single → 7 → 8 → 9 → 10
    └─ Split  → 6B → 8 → 10
7   Message         → Skill("message-generator")
8   Changelog       → Skill("changelog-generator")
9   Execute         → Task("commit-worker")
10  Deliver         → Summary + Next action ⏸️ HARD STOP
```

---

## Arguments

| Flag              | Description        |
| ----------------- | ------------------ |
| `--no-verify`     | Skip git hooks     |
| `--amend`         | Amend last commit  |
| `--scope <name>`  | Set scope          |
| `--type <type>`   | Force type         |
| `--no-changelog`  | Skip CHANGELOG     |
| `--version <ver>` | Set version        |
| `--skip-branch`   | Use current branch |
| `--branch <name>` | Custom branch name |

---

## Phase Details

### Phase 1: Initialize

```bash
RUN_DIR=".claude/committing/runs/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p ${RUN_DIR}
```

### Phase 2: Investigate

```
Task(
  subagent_type="general-purpose",
  prompt="Execute change-investigator agent. Read plugins/commit/agents/change-investigator.md for instructions. run_dir=${RUN_DIR}",
  description="investigate changes"
)
```

Output: `${RUN_DIR}/changes-raw.json`, `${RUN_DIR}/investigation-summary.md`

### Phase 3: Parallel Analyze 🔀

**CRITICAL: Launch BOTH agents in a SINGLE message with TWO Task tool calls.**

```
// In ONE message, call BOTH:
Task(
  subagent_type="general-purpose",
  prompt="Execute semantic-analyzer agent. Read plugins/commit/agents/semantic-analyzer.md for instructions. run_dir=${RUN_DIR}",
  description="semantic analysis",
  run_in_background=true
)

Task(
  subagent_type="general-purpose",
  prompt="Execute symbol-analyzer agent. Read plugins/commit/agents/symbol-analyzer.md for instructions. run_dir=${RUN_DIR}",
  description="symbol analysis",
  run_in_background=true
)
```

**Wait for BOTH to complete before Phase 4.**

Output: `${RUN_DIR}/semantic-analysis.json`, `${RUN_DIR}/symbol-analysis.json`

### Phase 4: Synthesize

```
Skill("analysis-synthesizer", "run_dir=${RUN_DIR}")
```

Merges parallel analysis results into unified `changes-analysis.json`.

Output: `${RUN_DIR}/changes-analysis.json`

### Phase 5: Branch

```
Skill("branch-creator", "run_dir=${RUN_DIR}")
```

Output: `${RUN_DIR}/branch-info.json` + new branch (if needed)

### Phase 6: Confirm ⏸️

Show: type, scope, files, complexity → User chooses: accept / customize / cancel / split

### Phase 6B: Split Mode

```bash
git reset HEAD
for commit in commits:
    git add ${files}
    git commit -m "$(cat <<'EOF'
    ${type}(${scope}): ${emoji} ${title}

    ${body}
    EOF
    )"
```

| Type     | Emoji | Type   | Emoji |
| -------- | ----- | ------ | ----- |
| feat     | ✨    | test   | ✅    |
| fix      | 🐛    | build  | 📦    |
| docs     | 📝    | ci     | 👷    |
| style    | 💄    | chore  | 🔧    |
| refactor | ♻️    | revert | ⏪    |
| perf     | ⚡    |        |       |

### Phase 7: Generate Message

```
Skill("message-generator", "run_dir=${RUN_DIR} options=${OPTIONS}")
```

→ User confirms → AUTO-CONTINUE

### Phase 8: Changelog

```
Skill("changelog-generator", "run_dir=${RUN_DIR} version=${VERSION}")
```

Skip only if: `--no-changelog` OR (test/ci/chore + user confirms)

### Phase 9: Execute

```
Task(
  subagent_type="general-purpose",
  prompt="Execute commit-worker agent. Read plugins/commit/agents/commit-worker.md for instructions. run_dir=${RUN_DIR} options=${OPTIONS}",
  description="execute commit"
)
```

### Phase 10: Deliver ⏸️

**10.1 Summary:**

```
🎉 Commit completed!
📝 ${title} | 🔀 ${branch} | 📦 ${hash} | 📊 ${files} files
```

**10.2 Next Action (if new branch):**

| Option     | Action                              |
| ---------- | ----------------------------------- |
| Push & PR  | `git push -u` → `/ccg:pr`           |
| Merge back | `git checkout ${prev} && git merge` |
| Push only  | `git push -u`                       |
| Done       | End                                 |

---

## Errors

| Error       | Solution             |
| ----------- | -------------------- |
| No staged   | Suggest `git add`    |
| Hook failed | Fix or `--no-verify` |

---

## Agent Type Restrictions

This command ONLY uses the following agent types via the `Task` tool:

| Agent Type                   | Usage                                     |
| ---------------------------- | ----------------------------------------- |
| `commit:change-investigator` | Phase 2: Rapid git change investigation   |
| `commit:semantic-analyzer`   | Phase 3: Semantic analysis (parallel)     |
| `commit:symbol-analyzer`     | Phase 3: Symbol-level analysis (parallel) |
| `commit:commit-worker`       | Phase 9: Execute git commit               |

Any other `subagent_type` values are **forbidden** in this command.
