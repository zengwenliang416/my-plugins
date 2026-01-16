#!/usr/bin/env python3
"""
会议记录解析脚本
从会议记录/转写文本中提取结构化信息
用法: python parse-meeting.py <会议记录文件路径>
"""

import sys
import os
import re
import json
from datetime import datetime
from collections import Counter


def extract_participants(content: str) -> list:
    """提取参与者"""
    participants = set()

    # 常见格式: "参与者: 张三、李四、王五"
    match = re.search(r"参与者[：:]\s*(.+?)(?:\n|$)", content)
    if match:
        names = re.split(r"[、,，\s]+", match.group(1))
        participants.update([n.strip() for n in names if n.strip()])

    # 从发言中提取: "张三: 说的内容" 或 "【张三】说的内容"
    speakers = re.findall(r"^(?:【([^】]+)】|([^：:]+)[：:])\s*", content, re.MULTILINE)
    for match in speakers:
        name = match[0] or match[1]
        if (
            name
            and len(name) <= 10
            and not re.match(r"^(时间|日期|地点|主题|议题)", name)
        ):
            participants.add(name.strip())

    return list(participants)


def extract_action_items(content: str) -> list:
    """提取行动项/待办事项"""
    action_items = []

    # 匹配常见格式
    patterns = [
        r"[-*]\s*\[[ x]\]\s*(.+?)(?:\n|$)",  # - [ ] 任务
        r"行动项[：:]\s*(.+?)(?:\n|$)",
        r"TODO[：:]\s*(.+?)(?:\n|$)",
        r"待办[：:]\s*(.+?)(?:\n|$)",
        r"@(\S+)\s+(.+?)(?:\n|$)",  # @张三 完成XX
    ]

    for pattern in patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        for match in matches:
            if isinstance(match, tuple):
                item = " ".join(match).strip()
            else:
                item = match.strip()
            if item and item not in action_items:
                action_items.append(item)

    return action_items


def extract_decisions(content: str) -> list:
    """提取决策"""
    decisions = []

    patterns = [
        r"决[定议][：:]\s*(.+?)(?:\n|$)",
        r"结论[：:]\s*(.+?)(?:\n|$)",
        r"达成共识[：:]\s*(.+?)(?:\n|$)",
        r"确定[：:]\s*(.+?)(?:\n|$)",
    ]

    for pattern in patterns:
        matches = re.findall(pattern, content)
        for match in matches:
            if match.strip() and match.strip() not in decisions:
                decisions.append(match.strip())

    return decisions


def analyze_participation(content: str, participants: list) -> dict:
    """分析参与度"""
    participation = {}

    for person in participants:
        # 统计发言次数
        speak_count = len(
            re.findall(rf"(?:^|\n)(?:【{person}】|{person}[：:])", content)
        )
        # 估算发言字数
        speak_matches = re.findall(
            rf"(?:【{person}】|{person}[：:])\s*(.+?)(?=\n|$)", content
        )
        word_count = sum(len(m) for m in speak_matches)

        participation[person] = {"speak_count": speak_count, "word_count": word_count}

    # 计算百分比
    total_words = sum(p["word_count"] for p in participation.values())
    if total_words > 0:
        for person in participation:
            participation[person]["percentage"] = round(
                participation[person]["word_count"] / total_words * 100, 1
            )

    return participation


def extract_topics(content: str) -> list:
    """提取议题"""
    topics = []

    # 匹配议题格式
    patterns = [
        r"议题\s*\d*[：:]\s*(.+?)(?:\n|$)",
        r"^##\s+(.+?)(?:\n|$)",  # Markdown H2
        r"^[一二三四五六七八九十]+[、.]\s*(.+?)(?:\n|$)",  # 一、二、三
        r"^\d+[、.]\s*(.+?)(?:\n|$)",  # 1. 2. 3.
    ]

    for pattern in patterns:
        matches = re.findall(pattern, content, re.MULTILINE)
        for match in matches:
            topic = match.strip()
            if topic and len(topic) < 100 and topic not in topics:
                topics.append(topic)

    return topics[:10]  # 最多返回10个议题


def extract_dates(content: str) -> dict:
    """提取日期时间"""
    dates = {}

    # 日期格式
    date_patterns = [
        (r"(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?)", "date"),
        (r"(\d{1,2}:\d{2}(?::\d{2})?)", "time"),
        (r"(上午|下午|AM|PM)\s*(\d{1,2})[点时]", "time_period"),
    ]

    for pattern, key in date_patterns:
        match = re.search(pattern, content)
        if match:
            dates[key] = match.group(0)

    return dates


def calculate_efficiency_metrics(
    content: str, topics: list, decisions: list, action_items: list
) -> dict:
    """计算会议效率指标"""
    metrics = {
        "has_clear_topics": len(topics) > 0,
        "has_decisions": len(decisions) > 0,
        "has_action_items": len(action_items) > 0,
        "decision_rate": len(decisions) / len(topics) if topics else 0,
        "action_item_rate": len(action_items) / len(topics) if topics else 0,
    }

    # 计算效率评分
    score = 0
    if metrics["has_clear_topics"]:
        score += 30
    if metrics["has_decisions"]:
        score += 30
    if metrics["has_action_items"]:
        score += 20
    if metrics["decision_rate"] >= 0.5:
        score += 10
    if metrics["action_item_rate"] >= 0.5:
        score += 10

    metrics["efficiency_score"] = score

    return metrics


def parse_meeting(file_path: str) -> dict:
    """解析会议记录"""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    participants = extract_participants(content)
    topics = extract_topics(content)
    decisions = extract_decisions(content)
    action_items = extract_action_items(content)
    dates = extract_dates(content)
    participation = analyze_participation(content, participants)
    efficiency = calculate_efficiency_metrics(content, topics, decisions, action_items)

    return {
        "file": os.path.basename(file_path),
        "parsed_at": datetime.now().isoformat(),
        "dates": dates,
        "participants": participants,
        "participant_count": len(participants),
        "topics": topics,
        "decisions": decisions,
        "action_items": action_items,
        "participation": participation,
        "efficiency": efficiency,
        "word_count": len(content),
    }


def generate_summary(analysis: dict) -> str:
    """生成会议摘要"""
    summary = f"""# 会议记录解析报告

**文件**: {analysis['file']}
**解析时间**: {analysis['parsed_at']}

## 基本信息

- **日期**: {analysis['dates'].get('date', '未识别')}
- **时间**: {analysis['dates'].get('time', '未识别')}
- **参与人数**: {analysis['participant_count']}
- **参与者**: {', '.join(analysis['participants']) if analysis['participants'] else '未识别'}

## 议题列表

"""
    if analysis["topics"]:
        for i, topic in enumerate(analysis["topics"], 1):
            summary += f"{i}. {topic}\n"
    else:
        summary += "未识别到明确议题\n"

    summary += "\n## 决策记录\n\n"
    if analysis["decisions"]:
        for decision in analysis["decisions"]:
            summary += f"- {decision}\n"
    else:
        summary += "未识别到明确决策\n"

    summary += "\n## 行动项\n\n"
    if analysis["action_items"]:
        for item in analysis["action_items"]:
            summary += f"- [ ] {item}\n"
    else:
        summary += "未识别到行动项\n"

    summary += "\n## 参与度分析\n\n"
    if analysis["participation"]:
        summary += "| 参与者 | 发言次数 | 发言字数 | 占比 |\n"
        summary += "|--------|----------|----------|------|\n"
        for person, stats in sorted(
            analysis["participation"].items(),
            key=lambda x: x[1].get("percentage", 0),
            reverse=True,
        ):
            summary += f"| {person} | {stats['speak_count']} | {stats['word_count']} | {stats.get('percentage', 0):.1f}% |\n"

    summary += f"""
## 会议效率评估

**效率评分**: {analysis['efficiency']['efficiency_score']}/100

| 指标 | 状态 |
|------|------|
| 有明确议题 | {'✅' if analysis['efficiency']['has_clear_topics'] else '❌'} |
| 有明确决策 | {'✅' if analysis['efficiency']['has_decisions'] else '❌'} |
| 有行动项 | {'✅' if analysis['efficiency']['has_action_items'] else '❌'} |

### 改进建议

"""
    suggestions = []
    if not analysis["efficiency"]["has_clear_topics"]:
        suggestions.append("建议在会议开始时明确列出议题")
    if not analysis["efficiency"]["has_decisions"]:
        suggestions.append("建议在讨论后明确记录决策结论")
    if not analysis["efficiency"]["has_action_items"]:
        suggestions.append("建议明确指定后续行动项和负责人")
    if analysis["efficiency"]["decision_rate"] < 0.5:
        suggestions.append("决策率较低，建议提高会议决策效率")

    if suggestions:
        for suggestion in suggestions:
            summary += f"- {suggestion}\n"
    else:
        summary += "- 会议记录结构完整，继续保持！\n"

    return summary


def main():
    if len(sys.argv) < 2:
        print("用法: python parse-meeting.py <会议记录文件路径>")
        sys.exit(1)

    file_path = sys.argv[1]

    if not os.path.exists(file_path):
        print(f"文件不存在: {file_path}")
        sys.exit(1)

    print(f"📋 解析会议记录: {file_path}")

    analysis = parse_meeting(file_path)

    # 保存 JSON 结果
    output_dir = os.path.dirname(file_path) or "."
    json_path = os.path.join(output_dir, "meeting-analysis.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(analysis, f, ensure_ascii=False, indent=2)
    print(f"✅ 解析结果已保存: {json_path}")

    # 生成摘要
    summary = generate_summary(analysis)
    summary_path = os.path.join(output_dir, "meeting-summary.md")
    with open(summary_path, "w", encoding="utf-8") as f:
        f.write(summary)
    print(f"✅ 会议摘要已保存: {summary_path}")

    # 打印摘要
    print(f"\n📊 解析摘要:")
    print(f"   参与者: {analysis['participant_count']} 人")
    print(f"   议题: {len(analysis['topics'])} 个")
    print(f"   决策: {len(analysis['decisions'])} 条")
    print(f"   行动项: {len(analysis['action_items'])} 个")
    print(f"   效率评分: {analysis['efficiency']['efficiency_score']}/100")


if __name__ == "__main__":
    main()
