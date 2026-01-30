---
description: "Commit workflow: collect → analyze → branch → message → commit"
argument-hint: "[--no-verify] [--amend] [--scope] [--type] [--no-changelog] [--version] [--skip-branch] [--branch]"
allowed-tools: [Skill, AskUserQuestion, Read, Bash]
---

# /commit

## 🚨 Execution Rules

**FULLY AUTOMATED. NO STOPPING BETWEEN PHASES.**

| ❌ Forbidden                   | ✅ Required                          |
| ------------------------------ | ------------------------------------ |
| Stop after Skill completes     | After Skill → IMMEDIATELY call next  |
| Ask "continue?" between phases | Hard stops ONLY at Phase 4 & 7.2     |
| Output intermediate results    | Phases 1→2→3→3.5 as atomic operation |

---

## Flow

```
1   Initialize      → mkdir RUN_DIR
2   Collect         → Skill("change-collector")      ─┐
3   Analyze         → Skill("change-analyzer")        │ AUTO
3.5 Branch          → Skill("branch-creator")        ─┘
4   Confirm         → AskUserQuestion ⏸️ HARD STOP
    ├─ Single → 5 → 5.5 → 6 → 7
    └─ Split  → 4B → 5.5 → 7
5   Message         → Skill("message-generator")
5.5 Changelog       → Skill("changelog-generator")
6   Commit          → Skill("commit-executor")
7   Deliver         → Summary + Next action ⏸️ HARD STOP
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

### Phase 2→3→3.5: Auto-Execute Chain

```
Skill("change-collector", "run_dir=${RUN_DIR}")  → changes-raw.json
  ↓ NO STOP
Skill("change-analyzer", "run_dir=${RUN_DIR}")   → changes-analysis.json
  ↓ NO STOP
Skill("branch-creator", "run_dir=${RUN_DIR}")    → branch-info.json
  ↓ → Phase 4
```

### Phase 4: Confirm ⏸️

Show: type, scope, files, complexity → User chooses: accept / customize / cancel / split

### Phase 4B: Split Mode

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

### Phase 5: Generate Message

```
Skill("message-generator", "run_dir=${RUN_DIR} options=${OPTIONS}")
```

→ User confirms → AUTO-CONTINUE

### Phase 5.5: Changelog

```
Skill("changelog-generator", "run_dir=${RUN_DIR} version=${VERSION}")
```

Skip only if: `--no-changelog` OR (test/ci/chore + user confirms)

### Phase 6: Execute

```
Skill("commit-executor", "run_dir=${RUN_DIR} options=${OPTIONS}")
```

### Phase 7: Deliver ⏸️

**7.1 Summary:**

```
🎉 Commit completed!
📝 ${title} | 🔀 ${branch} | 📦 ${hash} | 📊 ${files} files
```

**7.2 Next Action (if new branch):**

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
