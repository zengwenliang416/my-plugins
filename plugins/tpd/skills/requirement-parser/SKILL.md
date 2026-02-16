---
name: requirement-parser
description: "Normalize proposal and request input into structured requirements"
allowed-tools:
  - Read
  - Write
arguments:
  - name: run_dir
    type: string
    required: true
    description: Plan run directory
---

# requirement-parser

## Purpose
Extract functional and non-functional requirements for plan phase.

## Inputs
- Proposal artifacts and optional user clarifications.

## Outputs
- `${run_dir}/requirements.md`

## Steps
1. Read proposal and available thinking artifacts.
2. Extract explicit requirements and assumptions.
3. Separate mandatory and optional requirements.
4. Write `requirements.md`.

## Verification
- Requirements are testable and grouped by category.
