---
description: "Clarify vague requests with focused option-based questions"
argument-hint: ""
allowed-tools: [Read, AskUserQuestion]
---

# /what

Use this command when user intent is ambiguous (for example: "fix it", "add a thing").

## Actions

1. **Step 1: Gather context**
   - Read `llmdoc/index.md` and relevant high-level docs.

2. **Step 2: Draft clarifying questions**
   - Build concise, option-based questions.
   - Prefer actionable choices over open-ended prompts.

3. **Step 3: Ask user**
   - Use `AskUserQuestion` to collect explicit intent.

4. **Step 4: Forward to investigation**
   - Convert user answer into concrete investigation questions.
   - Invoke `/docflow:with-scout` with those questions.
   - Do not jump directly to implementation in this command.
