---
name: commit
description: "Commit workflow: investigate → parallel analyze → synthesize → branch → message → commit"
---

# /commit

## 🚨 执行规则

**完全自动化，阶段之间不停顿。**

| ❌ 禁止              | ✅ 必须                  |
| -------------------- | ------------------------ |
| 完成调用后停下       | 完成后立即调用下一步     |
| 阶段间询问"继续吗？" | 仅在 Phase 6 & 10 硬停顿 |
| 输出中间结果         | Phase 1→2→3→4→5 原子操作 |

---

## 流程

```
1   Initialize      → mkdir RUN_DIR
2   Investigate     → 调用 @change-investigator       ─┐
3   Parallel Analyze                                    │
    ├─ 调用 @semantic-analyzer (后台)                   │ 并行
    └─ 调用 @symbol-analyzer (后台)                    ─┤
4   Synthesize      → 调用 /analysis-synthesizer      ─┘
5   Branch          → 调用 /branch-creator
6   Confirm         → 询问用户 ⏸️ 硬停顿
    ├─ Single → 7 → 8 → 9 → 10
    └─ Split  → 6B → 8 → 10
7   Message         → 调用 /message-generator
8   Changelog       → 调用 /changelog-generator
9   Execute         → 调用 @commit-worker
10  Deliver         → Summary + Next action ⏸️ 硬停顿
```

---

## 参数

| 参数              | 说明         |
| ----------------- | ------------ |
| `--no-verify`     | 跳过 hooks   |
| `--amend`         | 修改上次提交 |
| `--scope <name>`  | 设置 scope   |
| `--type <type>`   | 强制类型     |
| `--no-changelog`  | 跳过更新日志 |
| `--version <ver>` | 设置版本     |
| `--skip-branch`   | 使用当前分支 |
| `--branch <name>` | 自定义分支名 |

---

## 阶段详情

### Phase 1: 初始化

```bash
RUN_DIR=".claude/committing/runs/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p ${RUN_DIR}
```

### Phase 2: 调查变更

调用 @change-investigator，参数：

- run_dir=${RUN_DIR}

输出: `${RUN_DIR}/changes-raw.json`, `${RUN_DIR}/investigation-summary.md`

### Phase 3: 并行分析 🔀

**关键: 同时启动两个智能体（并行执行）**

并行调用以下智能体：

- @semantic-analyzer，参数：run_dir=${RUN_DIR}
- @symbol-analyzer，参数：run_dir=${RUN_DIR}

**等待两者都完成后再进入 Phase 4。**

输出: `${RUN_DIR}/semantic-analysis.json`, `${RUN_DIR}/symbol-analysis.json`

### Phase 4: 合成分析

调用 /analysis-synthesizer，参数：run_dir=${RUN_DIR}

合并并行分析结果到统一的 `changes-analysis.json`。

输出: `${RUN_DIR}/changes-analysis.json`

### Phase 5: 创建分支

调用 /branch-creator，参数：run_dir=${RUN_DIR}

输出: `${RUN_DIR}/branch-info.json` + 新分支 (如需要)

### Phase 6: 确认 ⏸️

显示: type, scope, files, complexity → 用户选择: 接受 / 自定义 / 取消 / 拆分

询问用户：

- (a) 接受并继续提交
- (b) 自定义 type/scope
- (c) 拆分为多个提交
- (d) 取消

### Phase 6B: 拆分模式

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

### Phase 7: 生成消息

调用 /message-generator，参数：run_dir=${RUN_DIR} options=${OPTIONS}

→ 用户确认 → 自动继续

### Phase 8: 更新日志

调用 /changelog-generator，参数：run_dir=${RUN_DIR} version=${VERSION}

仅跳过: `--no-changelog` 或 (test/ci/chore + 用户确认)

### Phase 9: 执行提交

调用 @commit-worker，参数：

- run_dir=${RUN_DIR}
- options=${OPTIONS}

### Phase 10: 交付 ⏸️

**10.1 摘要:**

```
🎉 提交完成！
📝 ${title} | 🔀 ${branch} | 📦 ${hash} | 📊 ${files} files
```

**10.2 下一步操作 (如果是新分支):**

| 选项       | 操作                                |
| ---------- | ----------------------------------- |
| Push & PR  | `git push -u` → 创建 PR             |
| Merge back | `git checkout ${prev} && git merge` |
| Push only  | `git push -u`                       |
| Done       | 结束                                |

---

## 错误处理

| 错误      | 解决方案             |
| --------- | -------------------- |
| No staged | 建议 `git add`       |
| Hook 失败 | 修复或 `--no-verify` |
