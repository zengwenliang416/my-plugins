# Change: Harden TaskOutput Anti-Pattern Across All Plugins

## Why

Lead agent incorrectly called `TaskOutput` with manually constructed task IDs, causing cascade failure. Warnings were buried in code comments inside code blocks, easily overlooked.

## What Changes

- Add prominent `## Task Result Handling` section to all 16 command files
- Add `Task Tool Rules` prohibition to all 11 plugin CLAUDE.md files
- Fix outdated `TaskCreate/TaskOutput` reference in llmdoc

## Impact

- All team-based plugins now have three-layer defense against TaskOutput misuse
- No functional code changes — documentation/instruction only
