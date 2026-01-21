# Skill File Format Reference

## SKILL.md 结构

```markdown
---
name: skill-name
description: |
  【触发条件】何时触发
  【核心产出】输出什么
  【专属用途】能做什么
  【强制工具】必须使用的工具
  【不触发】何时不触发
allowed-tools:
  - Tool1
  - Tool2
arguments:
  - name: arg1
    type: string
    required: true
    description: 参数说明
---

# Skill Title

## 执行流程

流程图...

## 详细说明

...
```

## 字段说明

| 字段          | 类型   | 必须 | 说明               |
| ------------- | ------ | ---- | ------------------ |
| name          | string | ✅   | 技能唯一标识       |
| description   | string | ✅   | 技能描述（多行）   |
| allowed-tools | array  | ✅   | 允许使用的工具列表 |
| arguments     | array  | ❌   | 参数定义           |

## 触发条件格式

```
【触发条件】/command subcommand 或 某种场景描述
【核心产出】产出物描述
【专属用途】功能列表（换行缩进）
【强制工具】必须调用的 Skill
【不触发】排除条件
```

## 分类规则

| 类别       | 关键词       | 示例           |
| ---------- | ------------ | -------------- |
| workflow   | 工作流、流程 | dev-workflow   |
| analysis   | 分析、检测   | code-analyzer  |
| generation | 生成、创建   | doc-generator  |
| utility    | 工具、辅助   | context-loader |
