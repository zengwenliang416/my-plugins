# Subtask 3 Plan

## Objective
将新建 prompts 同步到 `/Users/wenliang_zeng/.codex` 对应目录并完成基础验证。

## Inputs
- `.codex/prompts/docflow-*.md`
- 目标目录 `/Users/wenliang_zeng/.codex/prompts`

## Outputs
- `/Users/wenliang_zeng/.codex/prompts/docflow-init-doc.md`
- `/Users/wenliang_zeng/.codex/prompts/docflow-with-scout.md`
- `/Users/wenliang_zeng/.codex/prompts/docflow-what.md`

## Execution Steps
1. 创建（如不存在）目标目录。
2. 复制 prompts 到目标目录。
3. 读取并比对内容确认同步成功。

## Risks
- 覆盖同名文件导致用户自定义内容丢失。

## Verification
- `ls ~/.codex/prompts` 可见三个新文件。
- `diff` 比对仓库与目标目录内容一致。
