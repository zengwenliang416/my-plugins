# 决策树：docflow-doc-workflow

## 文档工作流入口判断

[用户需求涉及 llmdoc 或文档流程]
├── 否：返回“不触发”，建议走代码实现流程。
└── 是：继续
    └── [llmdoc 是否已初始化]
        ├── 否：推荐 `/prompts:docflow-init-doc`。
        └── 是：继续
            └── [用户目标类型]
                ├── 阅读：推荐 `docflow-read-doc`。
                ├── 更新：推荐 `docflow-update-doc`。
                ├── 调研：推荐 `docflow-investigate`。
                └── 不明确：先追问 1 个澄清问题。
