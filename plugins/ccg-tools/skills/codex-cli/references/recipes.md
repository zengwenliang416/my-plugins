# Codex CLI 常用配方

## 快速参考

```bash
# 基础调用
~/.claude/bin/codeagent-wrapper codex \
  --workdir /path/to/project \
  --role architect \
  --prompt "Your task"
```

## 配方 1：需求分析

```bash
--prompt "Analyze the requirement: [REQUIREMENT].

Tasks:
1. Identify entry points and files to inspect
2. Explain the implementation approach
3. List clarifying questions
4. Propose a minimal change plan

Do NOT output a patch yet."
```

## 配方 2：生成补丁

```bash
--session-id "$SESSION_ID" \
--prompt "Implement the plan we discussed.

Requirements:
- Output UNIFIED DIFF PATCH ONLY
- Keep changes minimal
- Follow project conventions
- Add tests if applicable"
```

## 配方 3：Debug 分析

```bash
--prompt "Debug this error:

[PASTE ERROR/STACK TRACE]

Tasks:
1. Identify likely root cause
2. Suggest files to inspect
3. Propose fix strategy

No patch yet."
```

## 配方 4：代码审查

```bash
--prompt "Review the code changes:

[SUMMARY OF CHANGES]

Check:
- Correctness and edge cases
- Security vulnerabilities
- Performance issues
- Test coverage"
```

## 配方 5：最小修复

```bash
--session-id "$SESSION_ID" \
--prompt "Based on our analysis, provide the minimal fix.

Output UNIFIED DIFF PATCH ONLY.
Include regression test if feasible."
```

## 多轮对话模式

```bash
# 第一轮：保存 SESSION_ID
RESULT=$(~/.claude/bin/codeagent-wrapper codex \
  --workdir /project --role architect --prompt "...")
SESSION_ID=$(echo "$RESULT" | jq -r '.SESSION_ID')

# 后续轮：使用 SESSION_ID
~/.claude/bin/codeagent-wrapper codex \
  --workdir /project \
  --session "$SESSION_ID" \
  --prompt "Continue..."
```

## 输出格式控制

| 需求        | Prompt 结尾                       |
| ----------- | --------------------------------- |
| 只要分析    | "No patch yet."                   |
| 只要补丁    | "Output UNIFIED DIFF PATCH ONLY." |
| 分析 + 补丁 | 不加限定（但不推荐，输出较长）    |
