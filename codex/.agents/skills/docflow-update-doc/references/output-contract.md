# 输出契约：docflow-update-doc

## TypeScript 接口

```ts
export type UpdateMode = "incremental" | "full";

export interface SkillInput {
  changeSummary: string;
  changedPaths: string[];
  updateMode: UpdateMode;
}

export interface SkillOutput {
  status: "success" | "blocked";
  updatedDocs: Array<{
    path: string;
    action: "created" | "modified" | "deleted";
  }>;
  indexSynced: boolean;
  risks: string[];
}
```

## 字段约束
- `updatedDocs` 不能为空；若为空应改为 `status=blocked` 并说明原因。
- `indexSynced=true` 时需确保 `llmdoc/index.md` 已检查。
- `risks` 为空时显式写明“无新增风险”。

## 脚本入口
- `scripts/run-docflow-update-doc.ts` 输出以上契约对应的 JSON。
