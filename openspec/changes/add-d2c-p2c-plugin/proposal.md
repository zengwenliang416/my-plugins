# Change: Add D2C + P2C Plugin for C-End AI Coding

## Why

C-end (consumer-facing) development requires both pixel-perfect UI reproduction from design screenshots and logic code generation from PRD documents. Current plugins (ui-design, feature-impl) do not address this dual challenge: ui-design focuses on design creation rather than design-to-code conversion, and feature-impl lacks design-aware code generation. A dedicated D2C+P2C plugin bridges this gap by combining AI vision-based UI code generation with PRD-driven logic code generation, all from local files without external data source dependencies.

## What Changes

- **NEW** `plugins/d2c/` plugin with 3 capabilities:
  - **D2C (Design to Code)**: Design screenshots → AI visual analysis → tech-stack-adapted semantic component code
  - **P2C (PRD to Code)**: Local PRD documents → intelligent chunking → multi-agent concurrent logic code generation
  - **Full Pipeline**: D2C + P2C integrated workflow with project context enhancement
- **NEW** 4 agent roles: `design-analyzer`, `ui-generator`, `prd-analyzer`, `logic-generator`
- **NEW** 3 commands: `/d2c`, `/p2c`, `/d2c-full`
- **NEW** Skills: `tech-stack-adapter`, `prd-chunker`
- Reuses existing `mcp__auggie-mcp__codebase-retrieval` for project context (replaces external knowledge base)

## Impact

- Affected specs: None (new capability)
- Affected code: No existing code modified
- New plugin directory: `plugins/d2c/`
- Dependencies: AI vision capability (model multimodal input), codebase-retrieval MCP
