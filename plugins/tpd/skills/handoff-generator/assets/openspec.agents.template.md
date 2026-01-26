# OpenSpec Instructions (Minimal)

## Quick Checklist

- 查看已有变更：`openspec list`
- 查看规格列表：`openspec list --specs`
- 选择唯一 change-id（kebab-case，动词开头）
- 生成 proposal/tasks/specs
- 校验：`openspec validate <change-id> --strict --no-interactive`

## Directory Structure

```
openspec/
├── project.md
├── specs/
└── changes/
    ├── <change-id>/
    │   ├── proposal.md
    │   ├── tasks.md
    │   └── specs/<capability>/spec.md
    └── archive/
```

## Rules

- 不清楚就先提问，不要假设
- 变更必须可验证，写出成功判据与验收标准
- 任务按最小可验证阶段拆分
