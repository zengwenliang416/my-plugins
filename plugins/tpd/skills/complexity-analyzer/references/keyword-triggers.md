# 关键词触发规则

关键词检测优先级高于复杂度评分。

## Ultra 深度触发词

| 关键词        | 语言 | 示例                     |
| ------------- | ---- | ------------------------ |
| ultrathink    | EN   | "ultrathink about this"  |
| 深度分析      | CN   | "请深度分析这个问题"     |
| 全面分析      | CN   | "全面分析一下"           |
| think deeply  | EN   | "think deeply about"     |
| comprehensive | EN   | "comprehensive analysis" |

## Deep 深度触发词

| 关键词           | 语言 | 示例                      |
| ---------------- | ---- | ------------------------- |
| think hard       | EN   | "think hard about this"   |
| 仔细想           | CN   | "仔细想一下"              |
| 深入分析         | CN   | "深入分析"                |
| careful analysis | EN   | "careful analysis needed" |
| 认真考虑         | CN   | "认真考虑这个问题"        |

## Light 深度触发词

| 关键词 | 语言 | 示例             |
| ------ | ---- | ---------------- |
| 简单   | CN   | "简单分析一下"   |
| 快速   | CN   | "快速回答"       |
| quick  | EN   | "quick thought"  |
| brief  | EN   | "brief analysis" |
| 想一想 | CN   | "想一想这个"     |

## 检测逻辑

```python
def detect_depth_keyword(question: str) -> str | None:
    # 优先级: ultra > deep > light
    ultra_keywords = ["ultrathink", "深度分析", "全面分析", "think deeply", "comprehensive"]
    deep_keywords = ["think hard", "仔细想", "深入分析", "careful", "认真考虑"]
    light_keywords = ["简单", "快速", "quick", "brief", "想一想"]

    question_lower = question.lower()

    for kw in ultra_keywords:
        if kw in question_lower:
            return "ultra"

    for kw in deep_keywords:
        if kw in question_lower:
            return "deep"

    for kw in light_keywords:
        if kw in question_lower:
            return "light"

    return None  # 使用复杂度评分
```
