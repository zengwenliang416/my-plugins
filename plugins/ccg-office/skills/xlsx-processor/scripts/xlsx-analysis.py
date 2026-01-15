#!/usr/bin/env python3
"""
Excel 数据分析脚本
用法: python xlsx-analysis.py <xlsx文件路径> [工作表名]
"""

import sys
import os
import json
from datetime import datetime

try:
    import pandas as pd
except ImportError:
    print("请安装依赖: pip install pandas openpyxl")
    sys.exit(1)


def analyze_dataframe(df: pd.DataFrame, sheet_name: str) -> dict:
    """分析 DataFrame"""
    analysis = {
        "sheet_name": sheet_name,
        "shape": {"rows": df.shape[0], "columns": df.shape[1]},
        "columns": list(df.columns),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "missing": {col: int(count) for col, count in df.isnull().sum().items()},
        "missing_pct": {
            col: round(count / len(df) * 100, 2) if len(df) > 0 else 0
            for col, count in df.isnull().sum().items()
        },
        "duplicates": int(df.duplicated().sum()),
        "memory_kb": round(df.memory_usage(deep=True).sum() / 1024, 2),
    }

    # 数值列统计
    numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
    if numeric_cols:
        analysis["numeric_summary"] = {}
        for col in numeric_cols:
            analysis["numeric_summary"][col] = {
                "count": int(df[col].count()),
                "mean": (
                    round(float(df[col].mean()), 4)
                    if not pd.isna(df[col].mean())
                    else None
                ),
                "std": (
                    round(float(df[col].std()), 4)
                    if not pd.isna(df[col].std())
                    else None
                ),
                "min": float(df[col].min()) if not pd.isna(df[col].min()) else None,
                "max": float(df[col].max()) if not pd.isna(df[col].max()) else None,
                "median": (
                    float(df[col].median()) if not pd.isna(df[col].median()) else None
                ),
            }

    # 分类列统计
    categorical_cols = df.select_dtypes(include=["object"]).columns.tolist()
    if categorical_cols:
        analysis["categorical_summary"] = {}
        for col in categorical_cols:
            analysis["categorical_summary"][col] = {
                "unique": int(df[col].nunique()),
                "top_values": {
                    str(k): int(v) for k, v in df[col].value_counts().head(5).items()
                },
            }

    # 日期列统计
    date_cols = df.select_dtypes(include=["datetime64"]).columns.tolist()
    if date_cols:
        analysis["date_summary"] = {}
        for col in date_cols:
            analysis["date_summary"][col] = {
                "min": str(df[col].min()) if not pd.isna(df[col].min()) else None,
                "max": str(df[col].max()) if not pd.isna(df[col].max()) else None,
            }

    return analysis


def analyze_xlsx(xlsx_path: str, sheet_name: str = None) -> dict:
    """分析 Excel 文件"""
    xlsx = pd.ExcelFile(xlsx_path)
    sheet_names = xlsx.sheet_names

    if sheet_name:
        if sheet_name not in sheet_names:
            raise ValueError(f"工作表 '{sheet_name}' 不存在。可用: {sheet_names}")
        sheets_to_analyze = [sheet_name]
    else:
        sheets_to_analyze = sheet_names

    results = {
        "file": os.path.basename(xlsx_path),
        "analyzed_at": datetime.now().isoformat(),
        "total_sheets": len(sheet_names),
        "sheet_names": sheet_names,
        "sheets": [],
    }

    for name in sheets_to_analyze:
        df = pd.read_excel(xlsx, sheet_name=name)
        analysis = analyze_dataframe(df, name)
        results["sheets"].append(analysis)

    return results


def generate_report(analysis: dict) -> str:
    """生成分析报告"""
    report = f"""# Excel 数据分析报告

**文件**: {analysis['file']}
**分析时间**: {analysis['analyzed_at']}
**工作表数**: {analysis['total_sheets']}

## 工作表列表

"""
    for name in analysis["sheet_names"]:
        report += f"- {name}\n"

    for sheet in analysis["sheets"]:
        report += f"""
---

## 工作表: {sheet['sheet_name']}

### 基本信息

| 指标 | 值 |
|------|------|
| 行数 | {sheet['shape']['rows']:,} |
| 列数 | {sheet['shape']['columns']} |
| 重复行 | {sheet['duplicates']} |
| 内存占用 | {sheet['memory_kb']:.2f} KB |

### 列信息

| 列名 | 类型 | 缺失值 | 缺失率 |
|------|------|--------|--------|
"""
        for col in sheet["columns"]:
            dtype = sheet["dtypes"][col]
            missing = sheet["missing"].get(col, 0)
            missing_pct = sheet["missing_pct"].get(col, 0)
            report += f"| {col} | {dtype} | {missing} | {missing_pct}% |\n"

        if "numeric_summary" in sheet:
            report += "\n### 数值列统计\n\n"
            report += "| 列名 | 计数 | 均值 | 标准差 | 最小值 | 最大值 | 中位数 |\n"
            report += "|------|------|------|--------|--------|--------|--------|\n"
            for col, stats in sheet["numeric_summary"].items():
                report += f"| {col} | {stats['count']} | {stats['mean']} | {stats['std']} | {stats['min']} | {stats['max']} | {stats['median']} |\n"

        if "categorical_summary" in sheet:
            report += "\n### 分类列统计\n\n"
            for col, stats in sheet["categorical_summary"].items():
                report += f"#### {col}\n\n"
                report += f"- 唯一值数量: {stats['unique']}\n"
                report += f"- Top 5 值:\n"
                for val, count in stats["top_values"].items():
                    report += f"  - {val}: {count}\n"
                report += "\n"

    return report


def main():
    if len(sys.argv) < 2:
        print("用法: python xlsx-analysis.py <xlsx文件路径> [工作表名]")
        sys.exit(1)

    xlsx_path = sys.argv[1]
    sheet_name = sys.argv[2] if len(sys.argv) > 2 else None

    if not os.path.exists(xlsx_path):
        print(f"文件不存在: {xlsx_path}")
        sys.exit(1)

    print(f"📊 分析 Excel 文件: {xlsx_path}")
    if sheet_name:
        print(f"   工作表: {sheet_name}")

    analysis = analyze_xlsx(xlsx_path, sheet_name)

    # 保存 JSON 结果
    output_dir = os.path.dirname(xlsx_path) or "."
    json_path = os.path.join(output_dir, "xlsx-analysis.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(analysis, f, ensure_ascii=False, indent=2)
    print(f"✅ 分析结果已保存: {json_path}")

    # 生成报告
    report = generate_report(analysis)
    report_path = os.path.join(output_dir, "xlsx-analysis-report.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"✅ 分析报告已保存: {report_path}")

    # 打印摘要
    print(f"\n📊 分析摘要:")
    for sheet in analysis["sheets"]:
        print(f"\n   工作表: {sheet['sheet_name']}")
        print(f"   - 行数: {sheet['shape']['rows']:,}")
        print(f"   - 列数: {sheet['shape']['columns']}")
        print(f"   - 重复行: {sheet['duplicates']}")


if __name__ == "__main__":
    main()
