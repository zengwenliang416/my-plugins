# 输出契约：docflow-investigate

## TypeScript 接口

```ts
export interface InvestigationFinding {
  path: string;
  summary: string;
  confidence: "high" | "medium" | "low";
}

export interface SkillInput {
  question: string;
  scope?: string;
  needsExternalInfo?: boolean;
}

export interface SkillOutput {
  status: "success" | "blocked";
  findings: InvestigationFinding[];
  relations: string[];
  directAnswer: string;
}
```

## 字段约束
- `findings` 至少包含一条证据路径。
- `directAnswer` 必须直接回应用户问题。
- 证据不足时使用 `status=blocked` 并给出补充建议。

## 脚本入口
- `scripts/run-docflow-investigate.ts` 输出以上契约对应的 JSON。
