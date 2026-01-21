# Gemini CLI - Memory Plugin Prompts Library

## 文档生成

### SKILL.md 索引生成

```
为技能目录生成 SKILL.md 索引文档。

要求：
1. 支持 4 级渐进式加载
   - Level 1: 名称 + 一句话描述
   - Level 2: 触发条件 + 核心产出
   - Level 3: 参数列表 + 依赖关系
   - Level 4: 完整执行流程

2. 包含以下章节
   - Skills 概览表格
   - 按类别分组
   - 快速导航链接

输出: SKILL.md (Markdown)
```

### 项目文档摘要

```
生成项目文档摘要。

摘要结构:
1. 项目概述 (100-200字)
   - 项目目的
   - 主要功能
   - 技术栈

2. 架构要点 (bullet points)
   - 核心模块
   - 数据流向
   - 关键依赖

3. API 概览 (如适用)
   - 主要端点
   - 认证方式

4. 快速开始
   - 安装命令
   - 运行命令

约束: 总长度 ≤ 2000 tokens
输出: Markdown
```

### README 生成

```
为项目生成 README.md。

包含章节:
1. 项目标题 + 徽章
2. 简介 (1段)
3. 特性列表
4. 快速开始
5. 安装
6. 使用示例
7. API 文档链接
8. 贡献指南
9. 许可证

输出: README.md
```

## 设计分析

### 设计 Token 提取

```
从设计系统文件中提取 token。

Token 类别:
1. 颜色系统
   - primary, secondary, accent
   - semantic (success, error, warning)
   - gradients

2. 间距系统
   - base unit
   - scale (xs, sm, md, lg, xl)

3. 字体层级
   - font-family
   - font-size scale
   - font-weight

4. 动画系统
   - duration
   - easing
   - transitions

输出: YAML (design-tokens.yaml)
```

### 组件文档

```
为 UI 组件生成文档。

文档结构:
1. 组件名称 + 描述
2. Props 表格
3. 使用示例
4. 变体展示
5. 可访问性说明

输出: Markdown
```

## 工作流总结

### 会话总结

```
总结工作流会话 [session_id]。

总结内容:
1. 关键决策
   - 决策内容
   - 决策理由
   - 替代方案

2. 已完成任务
   - 任务列表
   - 完成状态

3. 产出文件
   - 文件路径
   - 文件用途

4. 待处理事项
   - 优先级
   - 阻塞因素

5. 重要上下文
   - 需要保留的信息
   - 后续会话需要的知识

输出: Markdown
```

### 进度报告

```
生成工作流进度报告。

报告结构:
1. 执行概要
   - 总任务数
   - 完成数/进行中/待处理

2. 详细进度
   - 每个阶段状态
   - 关键里程碑

3. 问题与风险
   - 已解决问题
   - 当前阻塞
   - 潜在风险

4. 下一步计划

输出: Markdown
```

## 代码文档

### 模块文档

```
为模块生成文档。

文档结构:
1. 模块概述
2. 导出接口
3. 使用示例
4. 配置选项
5. 错误处理

输出: Markdown
```

### API 文档

```
为 API 端点生成文档。

文档结构:
1. 端点描述
2. 请求格式
   - Method
   - Path
   - Headers
   - Body
3. 响应格式
   - 成功响应
   - 错误响应
4. 示例请求/响应
5. 错误码说明

输出: Markdown
```

## 使用说明

1. 选择合适的 prompt 模板
2. 替换方括号中的占位符
3. 根据需要调整输出格式

支持的输出格式:

- `markdown` - 文档
- `yaml` - 配置/token
- `json` - 结构化数据
