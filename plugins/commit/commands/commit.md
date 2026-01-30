---
description: "Standardized commit workflow: collect changes → analyze → create branch → generate message → commit"
argument-hint: "[--no-verify] [--amend] [--scope <scope>] [--type <type>] [--no-changelog] [--version <version>] [--skip-branch] [--branch <name>]"
allowed-tools:
  - Skill
  - AskUserQuestion
  - Read
  - Bash
---

# /commit - Standardized Commit Command

## 🚨🚨🚨 CRITICAL: Auto-Execute All Phases

**THIS IS A FULLY AUTOMATED WORKFLOW. DO NOT WAIT FOR USER INPUT BETWEEN PHASES.**

**Forbidden behaviors:**

- ❌ Stop after any Skill completes and wait for user
- ❌ Ask "should I continue?" or "what's next?"
- ❌ Output intermediate results and pause
- ❌ Wait for user confirmation between Phase 2→3→3.5

**Required behavior:**

- ✅ After each Skill returns, IMMEDIATELY call the next Skill
- ✅ Only stop at Phase 4 (user confirmation) and Phase 7 (final delivery)
- ✅ Treat Phase 1→2→3→3.5 as a single atomic operation

---

## Execution Flow (Must Complete Without Stopping)

**You must complete all phases below in order. After finishing each phase, immediately execute the next phase:**

```
Phase 1: Initialize        → Create RUN_DIR
Phase 2: Collect changes   → Skill("change-collector")
Phase 3: Analyze changes   → Skill("change-analyzer")  ← Must use LSP + auggie-mcp
Phase 3.5: Create branch   → Skill("branch-creator")   ← Create feature branch (optional)
Phase 4: Confirm message   → AskUserQuestion
                        ├─ Single commit → Phase 5 → 5.5 → 6 → 7
                        └─ Split commits → Phase 4B → 5.5 → 7
Phase 5: Generate message  → Skill("message-generator")
Phase 5.5: Update Changelog → Skill("changelog-generator")  ← Must run, create CHANGELOG.md
Phase 6: Execute commit    → Skill("commit-executor")
Phase 7: Deliver           → Output summary
```

**⚠️ Key rules:**

- 🚨 **AUTO-CONTINUE**: After each Skill completes, **IMMEDIATELY** call the next Skill. NO STOPPING.
- 🚨 **HARD STOPS ONLY AT**: Phase 4 (confirm message) and Phase 7 Step 2 (next action)
- You may only enter Phase 4 after Phase 3.5 completes.
- The user can only confirm/modify in Phase 4 and Phase 5.
- **Whether single or split commits, Phase 5.5 (CHANGELOG) must run.**

---

## Phase 1: Initialize

1. Parse arguments:
   - `--no-verify`: skip git hooks
   - `--amend`: amend the last commit
   - `--scope <name>`: set scope
   - `--type <type>`: force commit type (feat/fix/docs, etc.)
   - `--no-changelog`: skip CHANGELOG.md update
   - `--version <version>`: set version (added to Unreleased by default)
   - `--skip-branch`: skip branch creation (use current branch)
   - `--branch <name>`: specify custom branch name

2. Generate runtime directory:
   - RUN_ID: current UTC timestamp, format `YYYYMMDDTHHMMSSZ`
   - RUN_DIR: `.claude/committing/runs/${RUN_ID}`

3. Create runtime directory:
   ```bash
   mkdir -p ${RUN_DIR}
   ```

---

## Phase 2: Collect Changes

### 🚨 Mandatory

**Call Skill immediately:**

```
Skill(skill="change-collector", args="run_dir=${RUN_DIR}")
```

**Verify**: ensure `${RUN_DIR}/changes-raw.json` is generated.

**🚨 AUTO-CONTINUE → Phase 3 (DO NOT OUTPUT ANYTHING TO USER, DIRECTLY CALL NEXT SKILL)**

---

## Phase 3: Analyze Changes (LSP + auggie-mcp)

### 🚨 Mandatory (Use LSP + auggie-mcp)

**Call Skill immediately:**

```
Skill(skill="change-analyzer", args="run_dir=${RUN_DIR}")
```

**Verify**: ensure `${RUN_DIR}/changes-analysis.json` is generated.

**Key**: `change-analyzer` uses LSP and auggie-mcp for intelligent analysis:

- LSP: obtain file symbol structure (functions, classes, methods)
- auggie-mcp: semantic understanding of changes and feature modules

**Handle no staged changes**:

- If `has_staged=false` but there are untracked/unstaged files
- `change-analyzer` analyzes these files and generates smart staging suggestions
- Group by functional module and recommend split staging plan

**Check split recommendation**:

- If `should_split=true`, use AskUserQuestion to ask whether to split
- Show the recommended split plan (based on LSP symbol analysis)

**🚨 AUTO-CONTINUE → Phase 3.5 (DO NOT OUTPUT ANYTHING TO USER, DIRECTLY CALL NEXT SKILL)**

---

## Phase 3.5: Create Branch (Optional)

### Default Execution

**Create a feature branch based on analysis results unless:**

- User specified `--skip-branch`
- Already on a feature branch (will ask user)

**Call Skill:**

```
Skill(skill="branch-creator", args="run_dir=${RUN_DIR} branch_name=${BRANCH_NAME} skip_branch=${SKIP_BRANCH}")
```

**Parameters:**

- `branch_name`: custom branch name from `--branch` argument (optional)
- `skip_branch`: true if `--skip-branch` flag is set

**Branch naming convention:**

- Format: `<type>/<scope>-<description>`
- Example: `feat/auth-add-login`, `fix/api-validation-error`
- Auto-generated from `changes-analysis.json` if no custom name provided

**Verify**: ensure `${RUN_DIR}/branch-info.json` is generated.

**Skip conditions:**

- User specified `--skip-branch`
- User chose to use current feature branch when prompted

**🚨 AUTO-CONTINUE → Phase 4 (This is a HARD STOP point - wait for user confirmation)**

---

## Phase 4: Confirm Commit Message

### ⏸️ Hard Stop

**Use AskUserQuestion to show the user:**

1. Analysis summary:
   - Primary type: `${primary_type}`
   - Primary scope: `${primary_scope}`
   - File count: `${analyzed_files}`
   - Complexity: `${complexity}`

2. Confirmation options:
   - Use suggested type and scope
   - Customize type/scope
   - Cancel commit

**🚨 Branching decision**:

- If user chooses **single commit** → continue to Phase 5
- If user chooses **split commits** → jump to Phase 4B (split commit mode)

---

## Phase 4B: Split Commit Mode (Optional)

**Execute this branch only when `should_split=true` and the user confirms splitting.**

### Step 1: Unstage current changes

```bash
git reset HEAD 2>/dev/null || git rm --cached -r . 2>/dev/null
```

### Step 2: Loop through each sub-commit

**🚨 Commit message format must match message-generator: `type(scope): emoji Chinese description`**

**Emoji mapping (mandatory):**

| Type     | Emoji |
| -------- | ----- |
| feat     | ✨    |
| fix      | 🐛    |
| docs     | 📝    |
| style    | 💄    |
| refactor | ♻️    |
| perf     | ⚡    |
| test     | ✅    |
| build    | 📦    |
| ci       | 👷    |
| chore    | 🔧    |
| revert   | ⏪    |

```
commits_info = []  # record all commit info

for commit in split_recommendation.commits:
    1. Stage the files for this commit: git add ${commit.files}
    2. 🚨 Use commit.message directly (already correctly formatted)
    3. Execute commit: git commit -m "${commit.message}"
    4. Record: commits_info.append({type, scope, emoji, description, hash})
```

**🚨 Key rules**:

- `commit.message` is generated by change-analyzer and already correctly formatted.
- **Do not manually assemble** the commit message; use `commit.message` directly.
- If `commit.message` does not exist, use the formula: `${type}(${scope}): ${emoji} ${description}`

**Examples**:

- ✅ `fix(ui-design): 🐛 添加 requirement-analyzer 强制继续指令`
- ❌ `🐛 fix(ui-design): 添加 requirement-analyzer 强制继续指令` (emoji position is wrong)
- ❌ `fix(ui-design): 添加 requirement-analyzer 强制继续指令` (missing emoji)

### Step 3: 🚨 Update CHANGELOG (Must Run)

**After all sub-commits are done, you must update CHANGELOG:**

```
Skill(skill="changelog-generator", args="run_dir=${RUN_DIR} commits=${commits_info}")
```

**Rules**:

- If CHANGELOG.md does not exist, create it.
- Add one changelog entry for each sub-commit.
- Group by commit type (Added, Fixed, Changed, etc.).

### Step 4: Jump to Phase 7 Deliver

**🚨 Do not skip CHANGELOG update!**

---

## Phase 5: Generate Message (Single Commit Mode)

### 🚨 Mandatory

**Call Skill immediately:**

```
Skill(skill="message-generator", args="run_dir=${RUN_DIR} options=${OPTIONS_JSON}")
```

`OPTIONS_JSON` contains the options confirmed by the user (emoji, type, scope, etc.).

**Verify**: ensure `${RUN_DIR}/commit-message.md` is generated.

**Show the generated commit message**, and use AskUserQuestion to confirm:

- Confirm commit
- Modify then commit
- Cancel

**🚨 AUTO-CONTINUE → Phase 5.5 (after user confirms, IMMEDIATELY call next Skill)**

---

## Phase 5.5: Update Changelog

### 🚨 Default Execution

**Must run unless the user specifies `--no-changelog`.**

**Call Skill:**

```
Skill(skill="changelog-generator", args="run_dir=${RUN_DIR} version=${VERSION}")
```

`VERSION` is the user-specified version (if any); otherwise it is added under `[Unreleased]`.

**⚠️ Important**:

- If CHANGELOG.md does not exist, the skill will create it automatically.
- Do not skip this phase just because the file does not exist.

**Verify**: ensure `${run_dir}/changelog-entry.md` is generated.

**Skip conditions** (only the following are allowed):

- User specified `--no-changelog`
- Commit type is `test`, `ci`, or `chore` **and** the user confirms skipping

**🚨 AUTO-CONTINUE → Phase 6 (DO NOT STOP, DIRECTLY CALL NEXT SKILL)**

---

## Phase 6: Execute Commit

### 🚨 Mandatory

**Call Skill immediately:**

```
Skill(skill="commit-executor", args="run_dir=${RUN_DIR} options=${OPTIONS_JSON}")
```

**Verify**: ensure `${RUN_DIR}/commit-result.json` is generated.

**🚨 AUTO-CONTINUE → Phase 7 (Output summary and ask next action)**

---

## Phase 7: Deliver

### Step 1: Output the completion summary

```
🎉 Commit completed!

📝 Message: ${commit_message_title}
🔀 Branch: ${branch}
📦 Hash: ${commit_hash_short}
📊 Changes: ${files_committed} files, +${insertions}/-${deletions} lines

📁 Artifacts:
  ${RUN_DIR}/
  ├── changes-raw.json
  ├── changes-analysis.json
  ├── branch-info.json
  ├── commit-message.md
  ├── commit-result.json
  └── changelog-entry.md
```

### Step 2: Ask next action (if new branch was created)

**Only ask if Phase 3.5 created a new branch** (check `branch-info.json` → `branch_type === "created"`).

**Use AskUserQuestion:**

```
Commit completed on branch: ${new_branch}
Previous branch was: ${previous_branch}

What would you like to do next?
```

**Options:**

| Option                      | Description                            | Action                                                    |
| --------------------------- | -------------------------------------- | --------------------------------------------------------- |
| Push & Create PR            | Push to remote and create Pull Request | `git push -u origin ${branch}` → `/ccg:pr`                |
| Merge to ${previous_branch} | Merge changes back to source branch    | `git checkout ${previous_branch}` → `git merge ${branch}` |
| Push only                   | Push branch to remote without PR       | `git push -u origin ${branch}`                            |
| Done                        | Finish without further action          | End workflow                                              |

### Step 3: Execute chosen action

**Push & Create PR:**

```bash
git push -u origin ${branch}
```

Then prompt user to run `/ccg:pr` or execute PR creation.

**Merge to source branch:**

```bash
git checkout ${previous_branch}
git merge ${branch} --no-ff -m "Merge branch '${branch}' into ${previous_branch}"
```

**Push only:**

```bash
git push -u origin ${branch}
```

**Done:**
Output final summary and end.

### Skip condition

If `--skip-branch` was used or no new branch was created, skip Step 2 and show:

```
🔄 Next steps:
  - Push code: git push
  - Create PR: /ccg:pr
```

---

## Error Handling

### No staged changes

```
⚠️ No staged changes

Suggestions:
1. git add <files>  - stage specific files
2. git add -A       - stage all changes
3. git add -p       - interactive staging
```

### Hook failed

```
❌ pre-commit hook failed

Error output:
${hook_output}

Suggestions:
1. Fix the errors and retry
2. Use /commit --no-verify to skip hooks
```

---

## Constraints

- Do not skip any Phase
- Each Phase must call its corresponding Skill
- Do not use Write/Edit to operate files directly
- User confirmation is required before committing
