# Subtask 9 Plan

## Objective
删除 legacy docflow markdown agents 第 2 批（1 文件）并删除 legacy skills 第 1 批（2 文件）。

## Inputs
- `.codex/agents/docflow-recorder.md`
- `.codex/skills/docflow-commit/SKILL.md`
- `.codex/skills/docflow-read-doc/SKILL.md`

## Outputs
- 上述 3 个 legacy 文件被删除

## Execution Steps
1. 删除 `docflow-recorder.md`。
2. 删除 2 个 legacy skill 文件。
3. 确认官方 skills 路径 `.agents/skills/docflow-*` 对应文件存在。

## Risks
- 老路径残留引用导致文档或脚本误导。

## Verification
- 三个目标路径不存在。
- `.agents/skills/docflow-commit/SKILL.md` 与 `.agents/skills/docflow-read-doc/SKILL.md` 存在。
