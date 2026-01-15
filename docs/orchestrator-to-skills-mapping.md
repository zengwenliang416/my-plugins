# Orchestrator → Skills 映射表

## 文档目的

本文档对 10 个待迁移的 orchestrators 进行步骤拆解，形成每个步骤的 Skill 清单（复用/新建/弃用）与命名空间约定。

**关联文档**:

- `docs/orchestrator-contract.md` - 总体架构契约
- `.claude/planning/2-phase2-batch-migration-outline.md` - Phase 2 规划

**创建时间**: 2026-01-14
**版本**: v1.0

---

## 1. 域名空间约定

| Orchestrator                | Domain         | Skills 命名空间  | 产物目录                |
| --------------------------- | -------------- | ---------------- | ----------------------- |
| commit-orchestrator         | `committing`   | `committing:*`   | `.claude/committing/`   |
| dev-orchestrator            | `developing`   | `developing:*`   | `.claude/developing/`   |
| debug-orchestrator          | `debugging`    | `debugging:*`    | `.claude/debugging/`    |
| review-orchestrator         | `reviewing`    | `reviewing:*`    | `.claude/reviewing/`    |
| test-orchestrator           | `testing`      | `testing:*`      | `.claude/testing/`      |
| plan-orchestrator           | `planning`     | `planning:*`     | `.claude/planning/`     |
| social-post-orchestrator    | `writing`      | `writing:*`      | `.claude/writing/`      |
| image-orchestrator          | `imaging`      | `imaging:*`      | `.claude/imaging/`      |
| ui-ux-design-orchestrator   | `ui-ux-design` | `ui-ux-design:*` | `.claude/ui-ux-design/` |
| migration-init-orchestrator | `migration`    | `migration:*`    | `.claude/migration/`    |

**命名规则**:

- Skill 名称: `{domain}:{action-noun}` (如 `committing:change-analyzer`)
- 避免动词式命名 (❌ `committing:analyze-changes`)
- 保持单一职责 (一个 Skill 只做一件事)

---

## 2. 共享 Skills（跨域复用）

### 2.1 通用工作流 Skills

**命名空间**: `shared/workflow`

| Skill 名称                 | 职责                  | 复用场景           | 状态      |
| -------------------------- | --------------------- | ------------------ | --------- |
| `workflow:state-reader`    | 读取和解析 state.json | 所有 orchestrators | ✅ 已存在 |
| `workflow:state-writer`    | 更新 state.json       | 所有 orchestrators | ✅ 已存在 |
| `workflow:file-validator`  | 验证输出文件格式      | 所有 orchestrators | 🆕 待创建 |
| `workflow:run-initializer` | 初始化 run_dir 结构   | 所有 orchestrators | 🆕 待创建 |

### 2.2 通用内容处理 Skills

**命名空间**: `_shared/content`

| Skill 名称                  | 职责                      | 复用场景                     | 状态      |
| --------------------------- | ------------------------- | ---------------------------- | --------- |
| `content:markdown-parser`   | 解析 Markdown frontmatter | writing, planning, reviewing | 🆕 待创建 |
| `content:diff-generator`    | 生成代码差异视图          | reviewing, committing        | 🆕 待创建 |
| `content:summary-generator` | 生成执行摘要              | 所有 orchestrators           | 🆕 待创建 |

### 2.3 通用多模型协作 Skills

**命名空间**: `_shared/multimodel`

| Skill 名称                    | 职责           | 复用场景              | 状态      |
| ----------------------------- | -------------- | --------------------- | --------- |
| `multimodel:codex-delegator`  | 委托给 Codex   | dev, debug, review    | 🆕 待创建 |
| `multimodel:gemini-delegator` | 委托给 Gemini  | ui-ux, image, writing | 🆕 待创建 |
| `multimodel:result-merger`    | 合并多模型结果 | dev, debug, review    | 🆕 待创建 |

---

## 3. commit-orchestrator 映射

### 3.1 当前步骤（推测）

| 步骤 | 当前实现 | 职责                        |
| ---- | -------- | --------------------------- |
| 0    | Precheck | 运行 lint/build             |
| 1    | 收集变更 | git status, git diff        |
| 2    | 分析变更 | 识别变更类型、建议拆分      |
| 3    | 生成信息 | conventional commit message |
| 4    | 确认提交 | 用户确认                    |
| 5    | 执行提交 | git commit, git hooks       |

### 3.2 Skills 映射

| Phase | Skill 名称                     | 职责                        | 状态 | 输出文件              |
| ----- | ------------------------------ | --------------------------- | ---- | --------------------- |
| 0     | `committing:precheck-runner`   | 执行预检查（lint/build）    | ✅   | precheck-result.json  |
| 1     | `committing:change-collector`  | 收集 git 变更               | ✅   | changes-raw.json      |
| 2     | `committing:change-analyzer`   | 分析变更类型和范围          | ✅   | changes-analysis.json |
| 3     | `committing:message-generator` | 生成 commit message         | ✅   | commit-message.md     |
| 4     | _(Agent 层直接处理)_           | 用户确认（AskUserQuestion） | N/A  | -                     |
| 5     | `committing:commit-executor`   | 执行 git commit             | ✅   | commit-result.json    |

**产物文件**:

```
.claude/committing/runs/{run-id}/
├── state.json                 # 工作流状态（V2 格式）
├── precheck-result.json       # Phase 0: 预检查结果
├── changes-raw.json           # Phase 1: 原始变更数据
├── changes-analysis.json      # Phase 2: 变更分析结果
├── commit-message.md          # Phase 3: 生成的提交信息
└── commit-result.json         # Phase 5: 提交执行结果
```

**共享 Skills 依赖**:

- `_shared/content:diff-generator` (Phase 2)
- `shared/workflow:state-writer` (所有 Phase)

---

## 4. dev-orchestrator 映射

### 4.1 当前步骤（推测）

| 步骤 | 当前实现   | 职责                       |
| ---- | ---------- | -------------------------- |
| 1    | 需求澄清   | 理解用户意图、识别模糊点   |
| 2    | 探索代码库 | 定位相关文件和符号         |
| 3    | 设计方案   | 多模型协作设计             |
| 4    | 实现代码   | 多模型协作编写             |
| 5    | 验证功能   | 测试、构建                 |
| 6    | 可选提交   | 委托给 commit-orchestrator |

### 4.2 Skills 映射

| Phase | Skill 名称                           | 职责                       | 类型    | 依赖                                 |
| ----- | ------------------------------------ | -------------------------- | ------- | ------------------------------------ |
| 1     | `developing:requirement-clarifier`   | 澄清需求、识别关键点       | 🆕 新建 | -                                    |
| 2     | `developing:codebase-explorer`       | 探索相关代码（LSP/auggie） | 🆕 新建 | -                                    |
| 3     | `developing:design-architect`        | 多模型协作设计方案         | 🆕 新建 | `_shared/multimodel:codex-delegator` |
| 4     | `developing:code-implementer`        | 多模型协作实现代码         | 🆕 新建 | `_shared/multimodel:codex-delegator` |
| 5     | `developing:functionality-validator` | 运行测试和构建             | 🆕 新建 | `testing:test-runner`                |
| 6     | _(委托给 commit-orchestrator)_       | -                          | -       | `committing:*`                       |

**产物文件**:

```
.claude/developing/runs/{run-id}/
├── state.json
├── requirements.md       # Phase 1 输出
├── exploration.md        # Phase 2 输出
├── design.md             # Phase 3 输出
├── implementation.json   # Phase 4 输出（包含文件变更列表）
└── validation-result.md  # Phase 5 输出
```

**共享 Skills 依赖**:

- `_shared/multimodel:codex-delegator` (Phase 3, 4)
- `_shared/multimodel:result-merger` (Phase 3, 4)
- `testing:test-runner` (Phase 5)

---

## 5. debug-orchestrator 映射

### 5.1 当前步骤（推测）

| 步骤 | 当前实现 | 职责                     |
| ---- | -------- | ------------------------ |
| 1    | 症状收集 | 错误信息、日志、复现步骤 |
| 2    | 问题复现 | 最小化复现案例           |
| 3    | 根因定位 | 多模型协作分析           |
| 4    | 修复方案 | 多模型协作设计修复       |
| 5    | 验证修复 | 测试验证                 |
| 6    | 总结记录 | 生成调试报告             |

### 5.2 Skills 映射

| Phase | Skill 名称                      | 职责                 | 类型    | 依赖                                 |
| ----- | ------------------------------- | -------------------- | ------- | ------------------------------------ |
| 1     | `debugging:symptom-collector`   | 收集错误信息和上下文 | 🆕 新建 | -                                    |
| 2     | `debugging:repro-minimizer`     | 最小化复现步骤       | 🆕 新建 | -                                    |
| 3     | `debugging:root-cause-analyzer` | 多模型协作根因分析   | 🆕 新建 | `_shared/multimodel:codex-delegator` |
| 4     | `debugging:fix-designer`        | 设计修复方案         | 🆕 新建 | `_shared/multimodel:codex-delegator` |
| 5     | `debugging:fix-validator`       | 验证修复有效性       | 🆕 新建 | `testing:test-runner`                |
| 6     | `debugging:report-generator`    | 生成调试报告         | 🆕 新建 | `_shared/content:summary-generator`  |

**产物文件**:

```
.claude/debugging/runs/{run-id}/
├── state.json
├── symptoms.md           # Phase 1 输出
├── repro-steps.md        # Phase 2 输出
├── root-cause.md         # Phase 3 输出
├── fix-design.md         # Phase 4 输出
├── validation-result.md  # Phase 5 输出
└── report.md             # Phase 6 输出
```

**共享 Skills 依赖**:

- `_shared/multimodel:codex-delegator` (Phase 3, 4)
- `testing:test-runner` (Phase 5)
- `_shared/content:summary-generator` (Phase 6)

---

## 6. review-orchestrator 映射

### 6.1 当前步骤（推测）

| 步骤 | 当前实现     | 职责                             |
| ---- | ------------ | -------------------------------- |
| 1    | 变更收集     | git diff 或指定文件              |
| 2    | 静态检查     | lint, type check                 |
| 3    | 架构审查     | 多模型协作（架构、正确性）       |
| 4    | 安全审查     | 多模型协作（安全漏洞）           |
| 5    | 可维护性审查 | 多模型协作（命名、注释、复杂度） |
| 6    | 报告生成     | 合并所有审查结果                 |

### 6.2 Skills 映射

| Phase | Skill 名称                           | 职责                   | 类型    | 依赖                                 |
| ----- | ------------------------------------ | ---------------------- | ------- | ------------------------------------ |
| 1     | `reviewing:change-collector`         | 收集待审查的变更       | ♻️ 复用 | `committing:change-collector`        |
| 2     | `reviewing:static-checker`           | 执行静态检查           | 🆕 新建 | -                                    |
| 3     | `reviewing:architecture-reviewer`    | 多模型协作架构审查     | 🆕 新建 | `_shared/multimodel:codex-delegator` |
| 4     | `reviewing:security-reviewer`        | 多模型协作安全审查     | 🆕 新建 | `_shared/multimodel:codex-delegator` |
| 5     | `reviewing:maintainability-reviewer` | 多模型协作可维护性审查 | 🆕 新建 | `_shared/multimodel:codex-delegator` |
| 6     | `reviewing:report-generator`         | 合并生成审查报告       | 🆕 新建 | `_shared/multimodel:result-merger`   |

**产物文件**:

```
.claude/reviewing/runs/{run-id}/
├── state.json
├── changes.json          # Phase 1 输出
├── static-check.md       # Phase 2 输出
├── architecture.md       # Phase 3 输出
├── security.md           # Phase 4 输出
├── maintainability.md    # Phase 5 输出
└── report.md             # Phase 6 输出（合并）
```

**并行可能性**: Phase 3-5 可并行执行（三个审查维度独立）

**共享 Skills 依赖**:

- `committing:change-collector` (Phase 1，复用)
- `_shared/multimodel:codex-delegator` (Phase 3-5)
- `_shared/multimodel:result-merger` (Phase 6)

---

## 7. test-orchestrator 映射

### 7.1 当前步骤（推测）

| 步骤 | 当前实现 | 职责               |
| ---- | -------- | ------------------ |
| 1    | 测试选集 | 识别需要运行的测试 |
| 2    | 环境准备 | 检测和准备测试环境 |
| 3    | 执行测试 | 运行测试套件       |
| 4    | 解析结果 | 解析测试输出       |
| 5    | 失败聚类 | 分组相似失败       |
| 6    | 生成摘要 | 测试报告           |

### 7.2 Skills 映射

| Phase | Skill 名称                    | 职责               | 类型    | 依赖                                |
| ----- | ----------------------------- | ------------------ | ------- | ----------------------------------- |
| 1     | `testing:test-selector`       | 选择需要运行的测试 | 🆕 新建 | -                                   |
| 2     | `testing:environment-checker` | 检测测试环境       | 🆕 新建 | -                                   |
| 3     | `testing:test-runner`         | 执行测试套件       | 🆕 新建 | -                                   |
| 4     | `testing:result-parser`       | 解析测试输出       | 🆕 新建 | -                                   |
| 5     | `testing:failure-clusterer`   | 聚类相似失败       | 🆕 新建 | -                                   |
| 6     | `testing:report-generator`    | 生成测试摘要       | 🆕 新建 | `_shared/content:summary-generator` |

**产物文件**:

```
.claude/testing/runs/{run-id}/
├── state.json
├── test-selection.json   # Phase 1 输出
├── environment.json      # Phase 2 输出
├── test-output.log       # Phase 3 输出
├── parsed-results.json   # Phase 4 输出
├── failure-clusters.md   # Phase 5 输出
└── report.md             # Phase 6 输出
```

**共享 Skills 依赖**:

- `_shared/content:summary-generator` (Phase 6)

**复用可能性**: `testing:test-runner` 可被 `developing:functionality-validator` 和 `debugging:fix-validator` 复用

---

## 8. plan-orchestrator 映射

### 8.1 当前步骤（推测）

| 步骤 | 当前实现 | 职责               |
| ---- | -------- | ------------------ |
| 1    | 目标澄清 | 理解规划目标       |
| 2    | 任务拆解 | 分解为子任务       |
| 3    | 依赖分析 | 识别任务依赖关系   |
| 4    | 风险评估 | 识别技术和业务风险 |
| 5    | 验收标准 | 定义完成标准       |
| 6    | 生成计划 | 输出结构化计划     |

### 8.2 Skills 映射

| Phase | Skill 名称                     | 职责           | 类型    | 依赖                                 |
| ----- | ------------------------------ | -------------- | ------- | ------------------------------------ |
| 1     | `planning:goal-clarifier`      | 澄清规划目标   | 🆕 新建 | -                                    |
| 2     | `planning:task-decomposer`     | 拆解任务       | 🆕 新建 | -                                    |
| 3     | `planning:dependency-analyzer` | 分析任务依赖   | 🆕 新建 | -                                    |
| 4     | `planning:risk-assessor`       | 评估风险       | 🆕 新建 | `_shared/multimodel:codex-delegator` |
| 5     | `planning:acceptance-definer`  | 定义验收标准   | 🆕 新建 | -                                    |
| 6     | `planning:plan-generator`      | 生成结构化计划 | 🆕 新建 | -                                    |

**产物文件**:

```
.claude/planning/runs/{run-id}/
├── state.json
├── goals.md              # Phase 1 输出
├── tasks.md              # Phase 2 输出
├── dependencies.json     # Phase 3 输出
├── risks.md              # Phase 4 输出
├── acceptance.md         # Phase 5 输出
└── plan.md               # Phase 6 输出（合并）
```

**共享 Skills 依赖**:

- `_shared/multimodel:codex-delegator` (Phase 4，用于技术风险评估)

---

## 9. social-post-orchestrator 映射

### 9.1 当前步骤（推测）

| 步骤 | 当前实现     | 职责               |
| ---- | ------------ | ------------------ |
| 1    | 内容分析     | 理解主题和受众     |
| 2    | 多风格生成   | 并行生成多版本文案 |
| 3    | 平台适配     | 针对不同平台格式化 |
| 4    | Hashtags/CTA | 生成标签和行动号召 |
| 5    | 用户选择     | 用户选择版本       |
| 6    | 最终润色     | 润色选定版本       |

### 9.2 Skills 映射

| Phase | Skill 名称                  | 职责                 | 类型    | 依赖               |
| ----- | --------------------------- | -------------------- | ------- | ------------------ |
| 1     | `writing:content-analyzer`  | 分析内容主题和受众   | ♻️ 复用 | `writing:analyzer` |
| 2     | `writing:social-writer`     | 生成社交媒体文案     | 🆕 新建 | -                  |
| 3     | `writing:platform-adapter`  | 平台格式适配         | 🆕 新建 | -                  |
| 4     | `writing:hashtag-generator` | 生成 hashtags 和 CTA | 🆕 新建 | -                  |
| 5     | _(Agent 层直接处理)_        | 用户选择版本         | -       | -                  |
| 6     | `writing:social-polisher`   | 润色社交媒体文案     | ♻️ 复用 | `writing:polish`   |

**产物文件**:

```
.claude/writing/runs/{run-id}/
├── state.json
├── analysis.md           # Phase 1 输出
├── draft-1.md            # Phase 2 输出（多版本）
├── draft-2.md
├── draft-3.md
├── platform-variants.json # Phase 3 输出
├── hashtags.md           # Phase 4 输出
└── final.md              # Phase 6 输出
```

**并行可能性**: Phase 2 可并行生成 3 个风格版本

**共享 Skills 依赖**:

- `writing:analyzer` (Phase 1，复用自 article-workflow)
- `writing:polish` (Phase 6，复用自 article-workflow)

---

## 10. image-orchestrator 映射

### 10.1 当前步骤（推测）

| 步骤 | 当前实现     | 职责                     |
| ---- | ------------ | ------------------------ |
| 1    | 需求理解     | 理解图像用途和风格       |
| 2    | Prompt 生成  | 生成正向和负向 prompt    |
| 3    | 多风格变体   | 并行生成多风格 prompt    |
| 4    | 调用生成工具 | 委托给外部图像生成 API   |
| 5    | 结果展示     | 展示生成结果（如有）     |
| 6    | Spec 保存    | 保存可复用的 prompt spec |

### 10.2 Skills 映射

| Phase | Skill 名称                        | 职责                       | 类型    | 依赖                                  |
| ----- | --------------------------------- | -------------------------- | ------- | ------------------------------------- |
| 1     | `imaging:requirement-analyzer`    | 分析图像需求               | 🆕 新建 | -                                     |
| 2     | `imaging:prompt-generator`        | 生成图像 prompt            | 🆕 新建 | `_shared/multimodel:gemini-delegator` |
| 3     | `imaging:style-variant-generator` | 生成多风格变体             | 🆕 新建 | `_shared/multimodel:gemini-delegator` |
| 4     | `imaging:api-caller`              | 调用图像生成 API（如可用） | 🆕 新建 | -                                     |
| 5     | _(Agent 层直接处理)_              | 展示结果                   | -       | -                                     |
| 6     | `imaging:spec-saver`              | 保存 prompt spec           | 🆕 新建 | -                                     |

**产物文件**:

```
.claude/imaging/runs/{run-id}/
├── state.json
├── requirements.md       # Phase 1 输出
├── prompt-base.md        # Phase 2 输出
├── prompt-variants.json  # Phase 3 输出（多风格）
├── generated-images/     # Phase 4 输出（如有）
│   ├── variant-1.png
│   ├── variant-2.png
│   └── variant-3.png
└── spec.json             # Phase 6 输出（可复用）
```

**并行可能性**: Phase 3 可并行生成多风格 prompt 变体

**共享 Skills 依赖**:

- `_shared/multimodel:gemini-delegator` (Phase 2, 3)

**降级策略**: 如外部工具不可用，Phase 4 跳过，仅产出 prompt

---

## 11. ui-ux-design-orchestrator 映射

### 11.1 当前步骤（推测）

| 步骤 | 当前实现 | 职责                   |
| ---- | -------- | ---------------------- |
| 1    | 需求分析 | 理解用户画像和功能需求 |
| 2    | 信息架构 | 设计信息层级和导航     |
| 3    | 线框图   | 生成线框和流程图       |
| 4    | 交互细节 | 定义交互规则           |
| 5    | 设计规范 | 生成 design tokens     |
| 6    | Handoff  | 输出开发可用的设计文档 |

### 11.2 Skills 映射

| Phase | Skill 名称                            | 职责               | 类型    | 依赖                                  |
| ----- | ------------------------------------- | ------------------ | ------- | ------------------------------------- |
| 1     | `ui-ux-design:requirement-analyzer`   | 分析 UI/UX 需求    | 🆕 新建 | -                                     |
| 2     | `ui-ux-design:ia-designer`            | 设计信息架构       | 🆕 新建 | `_shared/multimodel:gemini-delegator` |
| 3     | `ui-ux-design:wireframe-generator`    | 生成线框图描述     | 🆕 新建 | `_shared/multimodel:gemini-delegator` |
| 4     | `ui-ux-design:interaction-designer`   | 定义交互细节       | 🆕 新建 | `_shared/multimodel:gemini-delegator` |
| 5     | `ui-ux-design:design-token-generator` | 生成 design tokens | 🆕 新建 | -                                     |
| 6     | `ui-ux-design:handoff-generator`      | 生成开发文档       | 🆕 新建 | -                                     |

**产物文件**:

```
.claude/ui-ux-design/runs/{run-id}/
├── state.json
├── requirements.md       # Phase 1 输出
├── information-architecture.md # Phase 2 输出
├── wireframes.md         # Phase 3 输出
├── interactions.md       # Phase 4 输出
├── design-tokens.json    # Phase 5 输出
└── handoff.md            # Phase 6 输出
```

**可选集成**: Phase 3 可委托 `imaging:prompt-generator` 生成 mockup prompt

**共享 Skills 依赖**:

- `_shared/multimodel:gemini-delegator` (Phase 2-4)
- `imaging:prompt-generator` (Phase 3，可选)

---

## 12. migration-init-orchestrator 映射

### 12.1 当前步骤（推测）

| 步骤 | 当前实现     | 职责                        |
| ---- | ------------ | --------------------------- |
| 1    | 参数收集     | 收集 orchestrator 基本信息  |
| 2    | 生成 Command | 生成 Command 层脚手架       |
| 3    | 生成 Agent   | 生成 Agent 层脚手架         |
| 4    | 生成 Skills  | 生成 Skill 层脚手架（多个） |
| 5    | 生成状态模板 | 生成 state.json 模板        |
| 6    | 生成验收清单 | 生成测试和验收文档          |

### 12.2 Skills 映射

| Phase | Skill 名称                           | 职责                 | 类型    | 依赖 |
| ----- | ------------------------------------ | -------------------- | ------- | ---- |
| 1     | `migration:param-collector`          | 收集迁移参数         | 🆕 新建 | -    |
| 2     | `migration:command-generator`        | 生成 Command 脚手架  | 🆕 新建 | -    |
| 3     | `migration:agent-generator`          | 生成 Agent 脚手架    | 🆕 新建 | -    |
| 4     | `migration:skill-generator`          | 生成 Skill 脚手架    | 🆕 新建 | -    |
| 5     | `migration:state-template-generator` | 生成 state.json 模板 | 🆕 新建 | -    |
| 6     | `migration:acceptance-generator`     | 生成验收清单         | 🆕 新建 | -    |

**产物文件**:

```
.claude/migration/runs/{run-id}/
├── state.json
├── params.json           # Phase 1 输出
├── command-{name}.md     # Phase 2 输出
├── agent-{name}.md       # Phase 3 输出
├── skills/               # Phase 4 输出
│   ├── skill-1.md
│   ├── skill-2.md
│   └── skill-3.md
├── state-template.json   # Phase 5 输出
└── acceptance.md         # Phase 6 输出
```

**特殊性**: 此 orchestrator 的输出是其他 orchestrators 的脚手架代码

---

## 13. 共享 Skills 优先级

### 13.1 高优先级（P0，立即创建）

| Skill                                 | 原因                                | 被依赖数 |
| ------------------------------------- | ----------------------------------- | -------- |
| `workflow-file-validator`     | 所有 orchestrators 需验证输出       | 10       |
| `workflow-run-initializer`    | 所有 orchestrators 需初始化 run_dir | 10       |
| `_shared/multimodel:codex-delegator`  | dev, debug, review, plan 依赖       | 4        |
| `_shared/multimodel:gemini-delegator` | ui-ux, image, writing 依赖          | 3        |

### 13.2 中优先级（P1，批量迁移时创建）

| Skill                               | 原因                       | 被依赖数 |
| ----------------------------------- | -------------------------- | -------- |
| `_shared/content:diff-generator`    | committing, reviewing 依赖 | 2        |
| `_shared/content:summary-generator` | debugging, testing 依赖    | 2        |
| `_shared/multimodel:result-merger`  | dev, review 依赖           | 2        |

### 13.3 低优先级（P2，按需创建）

| Skill                             | 原因                     | 被依赖数 |
| --------------------------------- | ------------------------ | -------- |
| `_shared/content:markdown-parser` | 仅 writing/planning 依赖 | 2        |

---

## 14. 复用矩阵

### 14.1 Skill 复用关系

| 被复用 Skill                  | 原始域     | 复用者                                    |
| ----------------------------- | ---------- | ----------------------------------------- |
| `writing:analyzer`            | writing    | social-post (Phase 1)                     |
| `writing:polish`              | writing    | social-post (Phase 6)                     |
| `committing:change-collector` | committing | reviewing (Phase 1)                       |
| `testing:test-runner`         | testing    | developing (Phase 5), debugging (Phase 5) |
| `imaging:prompt-generator`    | imaging    | ui-ux-design (Phase 3, 可选)              |

### 14.2 跨域调用模式

**模式 1: 完全复用**

```
# social-post-orchestrator Phase 1
Skill("writing:analyzer", args="input_path=${RUN_DIR}/input.md output_path=${RUN_DIR}/analysis.md")
```

**模式 2: 委托调用**

```
# developing-orchestrator Phase 6
Task(subagent_type="commit-orchestrator",
     prompt="请提交以下变更: ${RUN_DIR}/implementation.json")
```

---

## 15. Skill 粒度原则

### 15.1 单一职责

**✅ 正确**：

- `committing:change-analyzer` - 只分析变更
- `committing:message-generator` - 只生成 message

**❌ 错误**：

- `committing:analyze-and-generate` - 职责混杂

### 15.2 可组合性

**✅ 正确**：

- `testing:test-runner` + `testing:result-parser` + `testing:failure-clusterer`
- 每个 Skill 独立，可按需组合

**❌ 错误**：

- `testing:run-and-parse-and-cluster` - 无法灵活组合

### 15.3 可测试性

**✅ 正确**：

- 输入输出明确（文件路径）
- 可独立测试

**❌ 错误**：

- 依赖全局变量或外部状态

---

## 16. 实施优先级总结

### 16.1 阶段 0：共享 Skills（Week 1）

| 优先级 | Skill                                 | 复杂度 |
| ------ | ------------------------------------- | ------ |
| P0     | `workflow-file-validator`     | 2/5    |
| P0     | `workflow-run-initializer`    | 2/5    |
| P0     | `_shared/multimodel:codex-delegator`  | 3/5    |
| P0     | `_shared/multimodel:gemini-delegator` | 3/5    |
| P1     | `_shared/content:diff-generator`      | 2/5    |
| P1     | `_shared/content:summary-generator`   | 2/5    |
| P1     | `_shared/multimodel:result-merger`    | 3/5    |

### 16.2 阶段 1：P0 Orchestrators（Week 2）

| Orchestrator        | Skills 数量 | 新建 | 复用 |
| ------------------- | ----------- | ---- | ---- |
| commit-orchestrator | 5           | 5    | 0    |
| dev-orchestrator    | 5           | 5    | 0    |

### 16.3 阶段 2-4：P1-P3 Orchestrators（Week 3-5）

| Orchestrator                | Skills 数量 | 新建 | 复用 |
| --------------------------- | ----------- | ---- | ---- |
| debug-orchestrator          | 6           | 6    | 0    |
| review-orchestrator         | 6           | 5    | 1    |
| test-orchestrator           | 6           | 6    | 0    |
| plan-orchestrator           | 6           | 6    | 0    |
| social-post-orchestrator    | 6           | 4    | 2    |
| image-orchestrator          | 6           | 6    | 0    |
| ui-ux-design-orchestrator   | 6           | 6    | 0    |
| migration-init-orchestrator | 6           | 6    | 0    |

**总计**:

- **新建 Skills**: 66 个
- **复用 Skills**: 3 个
- **共享 Skills**: 7 个

---

## 17. 风险缓解

### 17.1 Skill 粒度不一致

**风险**: 不同 orchestrator 的 Skill 粒度差异大，难以复用

**缓解**:

- 严格遵循单一职责原则
- 定期审查 Skill 定义
- 使用 checklist（见第 15 节）

### 17.2 重复实现（DRY 破坏）

**风险**: 多个 orchestrator 重复实现相似功能

**缓解**:

- 优先创建共享 Skills（见第 2 节）
- 建立复用矩阵（见第 14 节）
- 代码审查时检查重复

### 17.3 职责边界不清

**风险**: Agent 层和 Skill 层职责混淆

**缓解**:

- Agent 层：只编排，不处理文件内容
- Skill 层：只执行，不做决策
- 参考 `docs/skills-invocation-best-practices.md`

---

## 18. 验收标准

每个 Skill 创建后，必须满足：

- [ ] **Frontmatter 完整**: name, description, arguments 字段齐全
- [ ] **单一职责**: 只做一件事
- [ ] **文件路径通信**: 仅接收和返回文件路径
- [ ] **错误分类**: 定义 recoverable/user_intervention/fatal
- [ ] **独立测试**: 可单独运行和验证
- [ ] **文档对齐**: 与 orchestrator-contract.md 一致

---

**版本**: v1.0
**创建时间**: 2026-01-14
**更新时间**: 2026-01-14
**维护者**: Task 1 完成后由全体开发者维护
