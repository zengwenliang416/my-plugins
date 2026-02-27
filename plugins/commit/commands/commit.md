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
    ├─ Task("semantic-analyzer")    │ PARALLEL (single message)
    └─ Task("symbol-analyzer")    ─┤
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

## Context Loading Policy（方案3：渐进式）

在每个阶段执行前，先读取 `plugins/commit/skills/_shared/references/_index.md`，并遵循：

1. 只加载当前阶段运行产物（`${RUN_DIR}` 下文件）和对应 skill 的最小参考文件。
2. 优先 JSON（结构化规则/映射），按需再加载 Markdown（解释性文档）。
3. 禁止跨阶段预加载（例如 Phase 2 不预读 message/changelog 规则）。
4. 输出优先复用 `assets/*.template.*`，避免在对话中展开大样例。

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

## Task Result Handling

Each `Task` call **blocks** until the teammate finishes and returns the result directly in the call response.

**FORBIDDEN — never do this:**
- MUST NOT call `TaskOutput` — this tool does not exist
- MUST NOT manually construct task IDs (e.g., `agent-name@worktree-id`)

**CORRECT — always use direct return:**
- The result comes from the `Task` call itself, no extra step needed

## Phase Details

### Phase 1: Initialize

```bash
# Derive CHANGE_ID: kebab-case from branch name or change scope
# Examples: "commit-feat-auth-login", "commit-fix-checkout-bug"
# Fallback: "commit-$(date +%Y%m%d-%H%M%S)"
CHANGE_ID="commit-${slug_from_scope}"
RUN_DIR="openspec/changes/${CHANGE_ID}"
mkdir -p "${RUN_DIR}"
```

**OpenSpec scaffold** — write immediately after `mkdir`:

- `${RUN_DIR}/proposal.md`: `# Change:` title, `## Why` (commit purpose), `## What Changes` (changes being committed), `## Impact`
- `${RUN_DIR}/tasks.md`: one numbered section per phase (Initialize, Investigate, Analyze, Synthesize, Branch, Commit) with `- [ ]` items

Mark items `[x]` as each phase completes.

### Phase 2: Investigate

```
Task(
  subagent_type="commit:change-investigator",
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
  subagent_type="commit:semantic-analyzer",
  prompt="Execute semantic-analyzer agent. Read plugins/commit/agents/semantic-analyzer.md for instructions. run_dir=${RUN_DIR}",
  description="semantic analysis"
)

Task(
  subagent_type="commit:symbol-analyzer",
  prompt="Execute symbol-analyzer agent. Read plugins/commit/agents/symbol-analyzer.md for instructions. run_dir=${RUN_DIR}",
  description="symbol analysis"
)
```

Both Task calls launched in a single message run concurrently.
Each Task call blocks until the teammate finishes.
Results are returned directly — no TaskOutput needed.

Output: `${RUN_DIR}/semantic-analysis.json`, `${RUN_DIR}/symbol-analysis.json`

### Phase 4: Synthesize

```
Skill("commit:analysis-synthesizer", "run_dir=${RUN_DIR}")
```

Merges parallel analysis results into unified `changes-analysis.json`.

Output: `${RUN_DIR}/changes-analysis.json`

### Phase 5: Branch

```
Skill("commit:branch-creator", "run_dir=${RUN_DIR}")
```

Output: `${RUN_DIR}/branch-info.json` + new branch (if needed)

### Phase 6: Confirm ⏸️

Show: type, scope, files, complexity → User chooses: accept / customize / cancel / split

### Phase 6B: Split Mode

```bash
git reset HEAD
jq -c '.split_recommendation.commits[]' "${RUN_DIR}/changes-analysis.json" | while IFS= read -r commit_json; do
  echo "${commit_json}" | jq -r '.files[]' | xargs git add

  type=$(echo "${commit_json}" | jq -r '.type')
  scope=$(echo "${commit_json}" | jq -r '.scope')
  emoji=$(echo "${commit_json}" | jq -r '.emoji // ""')
  title=$(echo "${commit_json}" | jq -r '.description')
  body=$(echo "${commit_json}" | jq -r '.body // ""')

  git commit -m "$(cat <<EOF
${type}(${scope}): ${emoji} ${title}

${body}
EOF
)"
done
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
Skill("commit:message-generator", "run_dir=${RUN_DIR} options=${OPTIONS}")
```

→ User confirms → AUTO-CONTINUE

### Phase 8: Changelog

```
Skill("commit:changelog-generator", "run_dir=${RUN_DIR} version=${VERSION}")
```

Skip only if: `--no-changelog` OR (test/ci/chore + user confirms)

### Phase 9: Execute

```
Task(
  subagent_type="commit:commit-worker",
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
