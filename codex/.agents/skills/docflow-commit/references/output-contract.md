# 输出契约：docflow-commit

## TypeScript 接口

```ts
export interface SkillInput {
  intent: string;
  hasStagedChanges: boolean;
  hasUnstagedChanges: boolean;
  preferredMessage?: string;
}

export interface SkillOutput {
  status: "success" | "blocked";
  decision: "commit" | "need_confirmation" | "stop";
  commitMessage?: string;
  nextStep: string;
  notes: string[];
}
```

## 字段约束
- `status=blocked` 时必须给出可执行的 `nextStep`。
- `decision=commit` 时必须提供 `commitMessage`。
- `notes` 至少包含一条可追溯说明。

## 脚本入口
- `scripts/run-docflow-commit.ts` 输出以上契约对应的 JSON。
