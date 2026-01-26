# 上下文检索报告

## 元信息

- 检索时间: {{retrieved_at}}
- 需求 ID: {{requirement_id}}
- 任务类型: {{task_type}}
- 检索深度: {{retrieval_depth}}

## 需求摘要

{{requirement_summary}}

## 内部代码上下文

### 核心模块

{{#each internal_context.core_modules}}

#### {{name}}

| 属性     | 值                                                                 |
| -------- | ------------------------------------------------------------------ |
| 路径     | `{{path}}`                                                         |
| 类型     | {{type}}                                                           |
| 相关性   | {{relevance_score}}                                                |
| 最后修改 | {{last_modified}}                                                  |
| 职责     | {{responsibility}}                                                 |
| 导出符号 | {{#each exports}}`{{this}}`{{#unless @last}}, {{/unless}}{{/each}} |

**关键代码片段**:

```{{language}}
{{snippet}}
```

**证据**: [{{evidence_id}}]

{{/each}}

### 依赖模块

{{#each internal_context.dependencies}}

| 模块     | 路径       | 依赖类型            | 证据              |
| -------- | ---------- | ------------------- | ----------------- |
| {{name}} | `{{path}}` | {{dependency_type}} | [{{evidence_id}}] |

{{/each}}

### 相关测试

{{#if internal_context.tests}}
{{#each internal_context.tests}}

| 测试文件   | 覆盖范围     | 状态       |
| ---------- | ------------ | ---------- |
| `{{file}}` | {{coverage}} | {{status}} |

{{/each}}
{{else}}
[未发现相关测试]
{{/if}}

### 配置文件

{{#if internal_context.configs}}
{{#each internal_context.configs}}

| 配置文件   | 类型     | 相关配置项                                                      |
| ---------- | -------- | --------------------------------------------------------------- |
| `{{file}}` | {{type}} | {{#each keys}}`{{this}}`{{#unless @last}}, {{/unless}}{{/each}} |

{{/each}}
{{else}}
[无相关配置]
{{/if}}

## 外部文档上下文

{{#if external_context}}
{{#each external_context}}

### {{title}}

| 属性     | 值                    |
| -------- | --------------------- |
| 来源     | [{{source}}]({{url}}) |
| 类型     | {{type}}              |
| 检索日期 | {{retrieved_at}}      |
| 相关性   | {{relevance_score}}   |

**摘要**:

{{summary}}

**关键要点**:

{{#each key_points}}

- {{this}}
  {{/each}}

{{/each}}
{{else}}
[本次检索未使用外部文档]
{{/if}}

## 调用关系图

```mermaid
graph TD
{{#each call_graph}}
    {{from}} --> {{to}}
{{/each}}
```

## 模块边界

### 涉及模块

| 模块 | 边界类型 | 入口文件 | 公共 API |
| ---- | -------- | -------- | -------- |

{{#each module_boundaries}}
| {{name}} | {{boundary_type}} | `{{entry}}` | {{api_count}} |
{{/each}}

### 跨模块依赖

{{#if cross_module_dependencies}}
| 源模块 | 目标模块 | 依赖类型 | 合规性 |
|--------|----------|----------|--------|
{{#each cross_module_dependencies}}
| {{source}} | {{target}} | {{type}} | {{compliance}} |
{{/each}}
{{else}}
[无跨模块依赖]
{{/if}}

## 证据链

### 证据索引

| ID  | 类型 | 文件 | 行号 | 描述 |
| --- | ---- | ---- | ---- | ---- |

{{#each evidence_chain}}
| {{id}} | {{type}} | `{{file}}` | {{line}} | {{description}} |
{{/each}}

### 证据详情

{{#each evidence_chain}}

#### {{id}}: {{description}}

- **文件**: `{{file}}:{{line_start}}-{{line_end}}`
- **工具**: {{tool_used}}
- **查询**: {{query}}
- **采集时间**: {{collected_at}}

```{{language}}
{{snippet}}
```

{{/each}}

## 检索统计

| 指标       | 值                         |
| ---------- | -------------------------- |
| 总检索次数 | {{stats.total_queries}}    |
| 语义检索   | {{stats.semantic_queries}} |
| 符号检索   | {{stats.symbol_queries}}   |
| 外部检索   | {{stats.external_queries}} |
| 命中文件数 | {{stats.files_found}}      |
| 证据数量   | {{stats.evidence_count}}   |
| 总耗时     | {{stats.duration_ms}}ms    |

## 检索日志

{{#each retrieval_log}}

- `{{timestamp}}` [{{tool}}] {{query}} → {{result_count}} 结果
  {{/each}}

## 上下文覆盖度

| 维度     | 覆盖                        | 说明                             |
| -------- | --------------------------- | -------------------------------- |
| 核心实现 | {{coverage.implementation}} | {{coverage.implementation_note}} |
| 类型定义 | {{coverage.types}}          | {{coverage.types_note}}          |
| 测试用例 | {{coverage.tests}}          | {{coverage.tests_note}}          |
| 配置文件 | {{coverage.configs}}        | {{coverage.configs_note}}        |
| 外部文档 | {{coverage.external}}       | {{coverage.external_note}}       |

## 待补充

{{#if gaps}}
{{#each gaps}}

- [ ] {{this}}
      {{/each}}
      {{else}}
      [上下文收集完整]
      {{/if}}

---

下一步: 调用 architecture-analyzer 进行架构分析
