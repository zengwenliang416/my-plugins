---
description: "规范提交工作流：收集变更 → 分析 → 生成消息 → 执行提交"
argument-hint: "[--no-verify] [--amend] [--scope <scope>] [--type <type>] [--no-changelog] [--version <version>]"
allowed-tools:
  - Skill
  - AskUserQuestion
  - Read
  - Bash
---

# /commit - 规范提交命令

## 🚨🚨🚨 强制执行规则（不可跳过）

**你必须按顺序完成以下所有阶段，每个阶段完成后立即执行下一阶段：**

```
Phase 1: 初始化        → 创建 RUN_DIR
Phase 2: 收集变更      → Skill("change-collector")
Phase 3: 分析变更      → Skill("change-analyzer")  ← 必须使用 LSP + auggie-mcp
Phase 4: 确认提交信息  → AskUserQuestion
Phase 5: 生成消息      → Skill("message-generator")
Phase 5.5: 更新 Changelog → Skill("changelog-generator")
Phase 6: 执行提交      → Skill("commit-executor")
Phase 7: 交付          → 输出摘要
```

**⚠️ 关键规则：**
- 每个 Skill 完成后，**立即**执行下一个 Phase，不要停止
- Phase 3 分析完成后才能进入 Phase 4 让用户确认
- 用户只在 Phase 4 和 Phase 5 有机会确认/修改

---

## Phase 1: 初始化

1. 解析参数：
   - `--no-verify`: 跳过 git hooks
   - `--amend`: 修改上次提交
   - `--scope <name>`: 指定作用域
   - `--type <type>`: 强制提交类型（feat/fix/docs 等）
   - `--no-changelog`: 跳过 CHANGELOG.md 更新
   - `--version <version>`: 指定版本号（默认添加到 Unreleased）

2. 生成运行目录：
   - RUN_ID: 当前 UTC 时间戳，格式 `YYYYMMDDTHHMMSSZ`
   - RUN_DIR: `.claude/committing/runs/${RUN_ID}`

3. 创建运行目录：
   ```bash
   mkdir -p ${RUN_DIR}
   ```

---

## Phase 2: 收集变更

### 🚨 强制执行

**立即调用 Skill：**
```
Skill(skill="change-collector", args="run_dir=${RUN_DIR}")
```

**验证**：确认 `${RUN_DIR}/changes-raw.json` 已生成

**🚨 完成后立即执行 Phase 3，不要停止！**

---

## Phase 3: 分析变更（LSP + auggie-mcp）

### 🚨 强制执行（使用 LSP + auggie-mcp）

**立即调用 Skill：**
```
Skill(skill="change-analyzer", args="run_dir=${RUN_DIR}")
```

**验证**：确认 `${RUN_DIR}/changes-analysis.json` 已生成

**关键**：`change-analyzer` 会使用 LSP 和 auggie-mcp 进行智能分析：
- LSP：获取文件符号结构（函数、类、方法）
- auggie-mcp：语义理解变更内容和功能模块

**处理无暂存变更的情况**：
- 如果 `has_staged=false` 但有未跟踪/未暂存文件
- `change-analyzer` 会分析这些文件，生成智能暂存建议
- 按功能模块分组，推荐分批暂存方案

**检查拆分建议**：
- 如果 `should_split=true`，使用 AskUserQuestion 询问用户是否拆分
- 展示建议的拆分方案（基于 LSP 符号分析）

**🚨 完成后立即执行 Phase 4，不要停止！**

---

## Phase 4: 确认提交信息

### ⏸️ 硬停止

**使用 AskUserQuestion 向用户展示：**

1. 分析结果摘要：
   - 主要类型: `${primary_type}`
   - 主要作用域: `${primary_scope}`
   - 文件数: `${analyzed_files}`
   - 复杂度: `${complexity}`

2. 询问确认：
   - 使用建议的类型和作用域
   - 自定义类型/作用域
   - 取消提交

**🚨 用户确认后立即执行 Phase 5，不要停止！**

---

## Phase 5: 生成消息

### 🚨 强制执行

**立即调用 Skill：**
```
Skill(skill="message-generator", args="run_dir=${RUN_DIR} options=${OPTIONS_JSON}")
```

其中 `OPTIONS_JSON` 包含用户确认的选项（emoji、type、scope 等）。

**验证**：确认 `${RUN_DIR}/commit-message.md` 已生成

**展示生成的提交信息**，使用 AskUserQuestion 确认：
- 确认提交
- 修改后提交
- 取消

**🚨 用户确认后立即执行 Phase 5.5，不要停止！**

---

## Phase 5.5: 更新 Changelog

### 🚨 默认执行

**除非用户指定 `--no-changelog`，否则必须执行**

**调用 Skill：**
```
Skill(skill="changelog-generator", args="run_dir=${RUN_DIR} version=${VERSION}")
```

其中 `VERSION` 为用户指定的版本号（如有），否则添加到 `[Unreleased]` 部分。

**验证**：确认 `${run_dir}/changelog-entry.md` 已生成

**注意**：
- 如果是 `test`、`ci`、`chore` 类型的提交，询问用户是否跳过 changelog
- 这些类型通常不记录到 changelog

**🚨 完成后立即执行 Phase 6，不要停止！**

---

## Phase 6: 执行提交

### 🚨 强制执行

**立即调用 Skill：**
```
Skill(skill="commit-executor", args="run_dir=${RUN_DIR} options=${OPTIONS_JSON}")
```

**验证**：确认 `${RUN_DIR}/commit-result.json` 已生成

**🚨 完成后立即执行 Phase 7 交付！**

---

## Phase 7: 交付

输出完成摘要：

```
🎉 提交完成！

📝 消息: ${commit_message_title}
🔀 分支: ${branch}
📦 哈希: ${commit_hash_short}
📊 变更: ${files_committed} 个文件，+${insertions}/-${deletions} 行

📁 产物:
  ${RUN_DIR}/
  ├── changes-raw.json
  ├── changes-analysis.json
  ├── commit-message.md
  ├── commit-result.json
  └── changelog-entry.md

🔄 后续:
  - 推送代码: git push
  - 创建 PR: /ccg:pr
```

---

## 错误处理

### 无暂存变更

```
⚠️ 没有已暂存的变更

建议:
1. git add <files>  - 暂存指定文件
2. git add -A       - 暂存所有变更
3. git add -p       - 交互式暂存
```

### Hook 失败

```
❌ pre-commit hook 失败

错误输出:
${hook_output}

建议:
1. 修复错误后重试
2. 使用 /commit --no-verify 跳过 hooks
```

---

## 约束

- 不跳过任何 Phase
- 每个 Phase 必须调用对应的 Skill
- 不使用 Write/Edit 直接操作文件
- 提交前必须用户确认
