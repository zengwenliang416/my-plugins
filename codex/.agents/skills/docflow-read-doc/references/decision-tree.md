# 决策树：docflow-read-doc

## 文档阅读路径判断

[llmdoc 是否存在]
├── 否：返回初始化建议 `/prompts:docflow-init-doc`。
└── 是：继续
    └── [用户需要的阅读深度]
        ├── 概览：读取 index + overview，输出高层摘要。
        └── 深入：在概览基础上补读 architecture/guides/reference。
            └── [是否指定主题]
                ├── 是：优先输出主题相关文档路径。
                └── 否：输出全局推荐阅读顺序。
