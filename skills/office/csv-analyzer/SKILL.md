---
name: csv-analyzer
description: |
  【触发条件】当用户需要分析 CSV 文件、生成数据洞察、创建可视化图表时使用。
  【核心产出】输出：数据统计摘要、可视化图表、分析报告、清洗后的数据。
  【不触发】不用于：Excel 处理（改用 xlsx-processor）、数据库操作（改用 db-migration-helper）。
  【先问什么】若缺少：CSV 文件路径、分析目标（统计/趋势/异常检测），先提问补齐。
allowed-tools: Read, Write, Edit, Bash, mcp__context7__resolve-library-id, mcp__context7__get-library-docs
---

# CSV Analyzer - CSV 数据分析助手

## 功能概述

自动分析 CSV 文件，生成数据洞察、统计摘要和可视化图表。

## 可执行脚本

本 Skill 包含以下可执行脚本（位于 `scripts/` 目录）：

| 脚本              | 用途                  | 执行方式                                   |
| ----------------- | --------------------- | ------------------------------------------ |
| `analyze-csv.py`  | 自动分析 CSV 生成报告 | `python scripts/analyze-csv.py <csv文件>`  |
| `data-profile.py` | 生成数据质量报告      | `python scripts/data-profile.py <csv文件>` |

## 依赖库

| 库                | 用途           |
| ----------------- | -------------- |
| `pandas`          | 数据处理和分析 |
| `matplotlib`      | 基础可视化     |
| `seaborn`         | 统计可视化     |
| `ydata-profiling` | 自动数据报告   |

## 快速分析

### 自动洞察生成

```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

def analyze_csv(path: str) -> dict:
    """自动分析 CSV 文件"""
    df = pd.read_csv(path)

    analysis = {
        "shape": df.shape,
        "columns": list(df.columns),
        "dtypes": df.dtypes.to_dict(),
        "missing": df.isnull().sum().to_dict(),
        "duplicates": df.duplicated().sum(),
        "memory_usage": df.memory_usage(deep=True).sum(),
    }

    # 数值列统计
    numeric_cols = df.select_dtypes(include=['number']).columns
    if len(numeric_cols) > 0:
        analysis["numeric_summary"] = df[numeric_cols].describe().to_dict()

    # 分类列统计
    categorical_cols = df.select_dtypes(include=['object']).columns
    if len(categorical_cols) > 0:
        analysis["categorical_summary"] = {
            col: {
                "unique": df[col].nunique(),
                "top_values": df[col].value_counts().head(5).to_dict()
            }
            for col in categorical_cols
        }

    return analysis
```

### 数据质量检查

```python
def check_data_quality(df: pd.DataFrame) -> dict:
    """数据质量检查"""
    issues = []

    # 缺失值检查
    missing_pct = (df.isnull().sum() / len(df) * 100)
    high_missing = missing_pct[missing_pct > 10]
    if len(high_missing) > 0:
        issues.append({
            "type": "high_missing",
            "message": f"以下列缺失率超过 10%: {high_missing.to_dict()}"
        })

    # 重复行检查
    dup_count = df.duplicated().sum()
    if dup_count > 0:
        issues.append({
            "type": "duplicates",
            "message": f"发现 {dup_count} 行重复数据"
        })

    # 异常值检查（数值列）
    for col in df.select_dtypes(include=['number']).columns:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        outliers = ((df[col] < Q1 - 1.5 * IQR) | (df[col] > Q3 + 1.5 * IQR)).sum()
        if outliers > 0:
            issues.append({
                "type": "outliers",
                "column": col,
                "message": f"列 {col} 发现 {outliers} 个潜在异常值"
            })

    return {
        "total_issues": len(issues),
        "issues": issues,
        "quality_score": max(0, 100 - len(issues) * 10)
    }
```

## 可视化

### 自动生成图表

```python
def generate_visualizations(df: pd.DataFrame, output_dir: str):
    """自动生成分析图表"""
    import os

    os.makedirs(output_dir, exist_ok=True)

    # 数值列分布
    numeric_cols = df.select_dtypes(include=['number']).columns
    for col in numeric_cols[:5]:  # 限制数量
        fig, axes = plt.subplots(1, 2, figsize=(12, 4))

        # 直方图
        df[col].hist(ax=axes[0], bins=30, edgecolor='black')
        axes[0].set_title(f'{col} 分布')
        axes[0].set_xlabel(col)

        # 箱线图
        df.boxplot(column=col, ax=axes[1])
        axes[1].set_title(f'{col} 箱线图')

        plt.tight_layout()
        plt.savefig(f"{output_dir}/{col}_distribution.png", dpi=100)
        plt.close()

    # 相关性热力图
    if len(numeric_cols) > 1:
        plt.figure(figsize=(10, 8))
        correlation = df[numeric_cols].corr()
        sns.heatmap(correlation, annot=True, cmap='coolwarm', center=0)
        plt.title('相关性热力图')
        plt.tight_layout()
        plt.savefig(f"{output_dir}/correlation_heatmap.png", dpi=100)
        plt.close()

    # 分类列柱状图
    categorical_cols = df.select_dtypes(include=['object']).columns
    for col in categorical_cols[:3]:
        if df[col].nunique() <= 20:
            plt.figure(figsize=(10, 6))
            df[col].value_counts().head(10).plot(kind='bar')
            plt.title(f'{col} 分布')
            plt.xlabel(col)
            plt.ylabel('计数')
            plt.xticks(rotation=45)
            plt.tight_layout()
            plt.savefig(f"{output_dir}/{col}_bar.png", dpi=100)
            plt.close()
```

### 使用 ydata-profiling

```python
from ydata_profiling import ProfileReport

def generate_profile_report(path: str, output_path: str):
    """生成完整数据分析报告"""
    df = pd.read_csv(path)

    profile = ProfileReport(
        df,
        title="数据分析报告",
        explorative=True,
        minimal=False
    )

    profile.to_file(output_path)
```

## 常用分析模式

### 时间序列分析

```python
def analyze_time_series(df: pd.DataFrame, date_col: str, value_col: str):
    """时间序列分析"""
    df[date_col] = pd.to_datetime(df[date_col])
    df = df.sort_values(date_col)

    # 趋势分析
    df['rolling_mean'] = df[value_col].rolling(window=7).mean()

    # 按周期聚合
    daily = df.groupby(df[date_col].dt.date)[value_col].sum()
    weekly = df.groupby(df[date_col].dt.to_period('W'))[value_col].sum()
    monthly = df.groupby(df[date_col].dt.to_period('M'))[value_col].sum()

    return {
        "daily": daily,
        "weekly": weekly,
        "monthly": monthly
    }
```

### 分组分析

```python
def group_analysis(df: pd.DataFrame, group_col: str, value_cols: list):
    """分组统计分析"""
    return df.groupby(group_col)[value_cols].agg(['count', 'sum', 'mean', 'std', 'min', 'max'])
```

## 输出报告

### Markdown 报告

```python
def generate_markdown_report(analysis: dict, output_path: str):
    """生成 Markdown 分析报告"""
    report = f"""# 数据分析报告

## 数据概览

- **总行数**: {analysis['shape'][0]:,}
- **总列数**: {analysis['shape'][1]}
- **重复行**: {analysis['duplicates']}
- **内存占用**: {analysis['memory_usage'] / 1024 / 1024:.2f} MB

## 列信息

| 列名 | 类型 | 缺失值 |
|------|------|--------|
"""
    for col, dtype in analysis['dtypes'].items():
        missing = analysis['missing'].get(col, 0)
        report += f"| {col} | {dtype} | {missing} |\n"

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(report)
```

## 参考文档

- `analysis-templates.md` - 分析模板
- `visualization-guide.md` - 可视化指南
