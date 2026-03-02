---
name: context-explorer
description: "Unified investigation agent for boundary exploration and planning context retrieval"
tools:
  - Read
  - Write
  - SendMessage
  - mcp__auggie-mcp__codebase-retrieval
memory: project
model: opus
color: green
---

# Context Explorer

## Purpose

Handle both investigation workloads in TPD:

- thinking-phase boundary exploration
- plan-phase context retrieval

## Inputs

- `run_dir`
- `mode` (`boundary` or `plan-context`)
- `boundary` and optional `scope` (used when `mode=boundary`)
- `thinking_dir` and `reuse_thinking` (optional when `mode=plan-context`)

## Outputs

- `mode=boundary`: `${run_dir}/explore-${boundary}.json`
- `mode=plan-context`: `${run_dir}/context.md`

## Execution Rules

- Follow message schema defined in the parent command.
- Send a `heartbeat` when work starts and before final artifact write.
- For directed `*_question` messages, respond with `*_answer` and request ACK.
- Do not create nested teams from this teammate context.

## Steps

1. Read `${run_dir}/input.md` and parse execution mode.
2. If `mode=boundary`:
   - retrieve boundary evidence with `mcp__auggie-mcp__codebase-retrieval`,
   - write `explore-${boundary}.json`,
   - send `boundary_ready` to lead, `codex-core`, and `gemini-core`.
3. If `mode=plan-context`:
   - reuse thinking artifacts when provided,
   - retrieve missing context evidence,
   - write `context.md`,
   - send `context_ready` to lead, `codex-core`, and `gemini-core`.
4. On failure, send `error` with step id and short stderr summary.

## Verification

- Expected output file exists and is non-empty.
- Output includes concrete file paths or symbol-level evidence.
- Communication events are sent and ACK status is recorded when required.
