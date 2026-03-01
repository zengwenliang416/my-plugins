# 输出契约：docflow-read-doc

## TypeScript 接口

```ts
export type ReadDepth = "overview" | "deep";

export interface SkillInput {
  llmdocInitialized: boolean;
  focusArea?: string;
  depth: ReadDepth;
}

export interface SkillOutput {
  status: "success" | "blocked";
  summary: {
    goals: string[];
    architecture: string[];
    workflows: string[];
    references: string[];
  };
  nextReads: string[];
}
```

## 字段约束
- `summary` 必须包含 goals/architecture/workflows/references 四组。
- `nextReads` 至少包含 3 条文档路径。
- `llmdocInitialized=false` 时使用 `status=blocked`。

## 脚本入口
- `scripts/run-docflow-read-doc.ts` 输出以上契约对应的 JSON。
