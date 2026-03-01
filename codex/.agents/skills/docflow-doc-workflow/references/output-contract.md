# 输出契约：docflow-doc-workflow

## TypeScript 接口

```ts
export type WorkflowGoal = "init" | "read" | "update" | "investigate" | "clarify";

export interface SkillInput {
  llmdocInitialized: boolean;
  userGoal: WorkflowGoal;
  userQuestion?: string;
}

export interface SkillOutput {
  status: "success" | "blocked";
  recommendedEntry: string;
  rationale: string;
  followUps: string[];
}
```

## 字段约束
- `recommendedEntry` 必须是 docflow prompt 或 docflow skill。
- `followUps` 至少给出一条下一步动作。
- 当 `userGoal=clarify` 时，`rationale` 需说明需要补充的信息。

## 脚本入口
- `scripts/run-docflow-doc-workflow.ts` 输出以上契约对应的 JSON。
