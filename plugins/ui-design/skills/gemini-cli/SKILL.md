---
name: gemini-cli
description: "Gemini wrapper skill for UI reference analysis, style design, and frontend prototype generation"
allowed-tools:
  - Bash
  - Read
  - Write
arguments:
  - name: role
    type: string
    required: true
    description: analyzer, ui_designer, or frontend
  - name: mode
    type: string
    required: false
    description: reference, style, variant, or prototype (used by caller to choose prompt template)
  - name: prompt
    type: string
    required: true
    description: Final prompt passed to Gemini wrapper
  - name: image
    type: string
    required: false
    description: Image path for vision tasks
  - name: dimension
    type: string
    required: false
    description: Optional analysis dimension (visual/color/component/layout)
  - name: session_id
    type: string
    required: false
    description: Existing Gemini session id
---

# gemini-cli

## Purpose
Call `scripts/invoke-gemini-ui.ts` with controlled arguments and keep session continuity for multi-round UI tasks.

## Script Entry
```bash
npx tsx scripts/invoke-gemini-ui.ts --role "${ROLE}" --prompt "${PROMPT}" [--image "${IMAGE}"] [--dimension "${DIMENSION}"] [--session "${SESSION_ID}"]
```

## Execution
1. Validate `role` in `analyzer|ui_designer|frontend`.
2. Validate `prompt` is non-empty.
3. If `image` is provided, verify file exists.
4. Execute wrapper script.
5. Capture result and session id for follow-up calls.

## Skill Policy
- Use this skill only when model synthesis is required.
- Reuse `session_id` for multi-round analysis to keep context.
- Do not call raw `gemini` directly in agent flows.

## Verification
- Wrapper command exits successfully or returns structured error.
- Output is persisted by caller into run-dir artifacts.
