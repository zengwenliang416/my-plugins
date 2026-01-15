#!/usr/bin/env python3
"""
CSV 自动分析脚本
用法: python analyze-csv.py <csv文件路径> [输出目录]
"""

import sys
import os
import json
from datetime import datetime

try:
    import pandas as pd
    import matplotlib.pyplot as plt
    import seaborn as sns
except ImportError as e:
    print(f"请安装依赖: pip install pandas matplotlib seaborn")
    print(f"缺少模块: {e}")
    sys.exit(1)


def analyze_csv(path: str) -> dict:
    """分析 CSV 文件"""
    df = pd.read_csv(path)

    analysis = {
        "file": os.path.basename(path),
        "analyzed_at": datetime.now().isoformat(),
        "shape": {"rows": df.shape[0], "columns": df.shape[1]},
        "columns": list(df.columns),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "missing": {col: int(count) for col, count in df.isnull().sum().items()},
        "missing_pct": {
            col: round(count / len(df) * 100, 2)
            for col, count in df.isnull().sum().items()
        },
        "duplicates": int(df.duplicated().sum()),
        "memory_mb": round(df.memory_usage(deep=True).sum() / 1024 / 1024, 2),
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

    return analysis, df


def generate_visualizations(df: pd.DataFrame, output_dir: str):
    """生成可视化图表"""
    os.makedirs(output_dir, exist_ok=True)

    # 设置中文字体
    plt.rcParams["font.sans-serif"] = ["SimHei", "Arial Unicode MS", "DejaVu Sans"]
    plt.rcParams["axes.unicode_minus"] = False

    numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()

    # 数值列分布
    for col in numeric_cols[:5]:
        fig, axes = plt.subplots(1, 2, figsize=(12, 4))

        df[col].hist(ax=axes[0], bins=30, edgecolor="black", alpha=0.7)
        axes[0].set_title(f"{col} Distribution")
        axes[0].set_xlabel(col)
        axes[0].set_ylabel("Frequency")

        df.boxplot(column=col, ax=axes[1])
        axes[1].set_title(f"{col} Box Plot")

        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, f"{col}_distribution.png"), dpi=100)
        plt.close()

    # 相关性热力图
    if len(numeric_cols) > 1:
        plt.figure(figsize=(10, 8))
        correlation = df[numeric_cols].corr()
        sns.heatmap(
            correlation, annot=True, cmap="coolwarm", center=0, fmt=".2f", square=True
        )
        plt.title("Correlation Heatmap")
        plt.tight_layout()
        plt.savefig(os.path.join(output_dir, "correlation_heatmap.png"), dpi=100)
        plt.close()

    # 分类列柱状图
    categorical_cols = df.select_dtypes(include=["object"]).columns.tolist()
    for col in categorical_cols[:3]:
        if df[col].nunique() <= 20:
            plt.figure(figsize=(10, 6))
            df[col].value_counts().head(10).plot(kind="bar", color="steelblue")
            plt.title(f"{col} Distribution")
            plt.xlabel(col)
            plt.ylabel("Count")
            plt.xticks(rotation=45, ha="right")
            plt.tight_layout()
            plt.savefig(os.path.join(output_dir, f"{col}_bar.png"), dpi=100)
            plt.close()


def generate_report(analysis: dict, output_path: str):
    """生成 Markdown 报告"""
    report = f"""# CSV 数据分析报告

**文件**: {analysis['file']}
**分析时间**: {analysis['analyzed_at']}

## 数据概览

| 指标 | 值 |
|------|------|
| 总行数 | {analysis['shape']['rows']:,} |
| 总列数 | {analysis['shape']['columns']} |
| 重复行 | {analysis['duplicates']} |
| 内存占用 | {analysis['memory_mb']} MB |

## 列信息

| 列名 | 类型 | 缺失值 | 缺失率 |
|------|------|--------|--------|
"""
    for col in analysis["columns"]:
        dtype = analysis["dtypes"][col]
        missing = analysis["missing"].get(col, 0)
        missing_pct = analysis["missing_pct"].get(col, 0)
        report += f"| {col} | {dtype} | {missing} | {missing_pct}% |\n"

    if "numeric_summary" in analysis:
        report += "\n## 数值列统计\n\n"
        report += "| 列名 | 计数 | 均值 | 标准差 | 最小值 | 最大值 | 中位数 |\n"
        report += "|------|------|------|--------|--------|--------|--------|\n"
        for col, stats in analysis["numeric_summary"].items():
            report += f"| {col} | {stats['count']} | {stats['mean']} | {stats['std']} | {stats['min']} | {stats['max']} | {stats['median']} |\n"

    if "categorical_summary" in analysis:
        report += "\n## 分类列统计\n\n"
        for col, stats in analysis["categorical_summary"].items():
            report += f"### {col}\n\n"
            report += f"- 唯一值数量: {stats['unique']}\n"
            report += f"- Top 5 值:\n"
            for val, count in stats["top_values"].items():
                report += f"  - {val}: {count}\n"
            report += "\n"

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(report)


def main():
    if len(sys.argv) < 2:
        print("用法: python analyze-csv.py <csv文件路径> [输出目录]")
        sys.exit(1)

    csv_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "./csv_analysis_output"

    if not os.path.exists(csv_path):
        print(f"文件不存在: {csv_path}")
        sys.exit(1)

    print(f"📊 分析 CSV 文件: {csv_path}")

    # 分析数据
    analysis, df = analyze_csv(csv_path)

    # 创建输出目录
    os.makedirs(output_dir, exist_ok=True)

    # 保存分析结果 JSON
    json_path = os.path.join(output_dir, "analysis.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(analysis, f, ensure_ascii=False, indent=2)
    print(f"✅ 分析结果已保存: {json_path}")

    # 生成可视化
    print("📈 生成可视化图表...")
    generate_visualizations(df, output_dir)

    # 生成报告
    report_path = os.path.join(output_dir, "report.md")
    generate_report(analysis, report_path)
    print(f"✅ 分析报告已保存: {report_path}")

    print(f"\n✅ 分析完成！输出目录: {output_dir}")


if __name__ == "__main__":
    main()
