# Excel 处理代码模板

Python 操作 Excel 的完整代码模板。

---

## 依赖库

| 库           | 用途           |
| ------------ | -------------- |
| `openpyxl`   | 读写 xlsx 文件 |
| `pandas`     | 数据分析和转换 |
| `xlsxwriter` | 高级写入和图表 |

---

## 基础读写

### 使用 Pandas

```python
import pandas as pd

def read_excel(path: str, sheet_name: str = None) -> pd.DataFrame:
    """读取 Excel 文件"""
    return pd.read_excel(path, sheet_name=sheet_name)

def read_all_sheets(path: str) -> dict[str, pd.DataFrame]:
    """读取所有工作表"""
    return pd.read_excel(path, sheet_name=None)

def write_excel(df: pd.DataFrame, path: str, sheet_name: str = "Sheet1"):
    """写入 Excel 文件"""
    df.to_excel(path, sheet_name=sheet_name, index=False)

def write_multiple_sheets(dfs: dict[str, pd.DataFrame], path: str):
    """写入多个工作表"""
    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        for sheet_name, df in dfs.items():
            df.to_excel(writer, sheet_name=sheet_name, index=False)
```

### 使用 Openpyxl

```python
from openpyxl import Workbook, load_workbook

def create_workbook(data: list[list], path: str):
    """创建新工作簿"""
    wb = Workbook()
    ws = wb.active
    ws.title = "数据"

    for row in data:
        ws.append(row)

    wb.save(path)

def read_workbook(path: str) -> list[list]:
    """读取工作簿数据"""
    wb = load_workbook(path)
    ws = wb.active

    data = []
    for row in ws.iter_rows(values_only=True):
        data.append(list(row))

    return data

def update_cell(path: str, sheet: str, row: int, col: int, value):
    """更新单元格"""
    wb = load_workbook(path)
    ws = wb[sheet]
    ws.cell(row=row, column=col, value=value)
    wb.save(path)
```

---

## 公式和计算

```python
from openpyxl import Workbook, load_workbook
from openpyxl.utils import get_column_letter

def add_formulas(path: str):
    """添加公式"""
    wb = load_workbook(path)
    ws = wb.active

    # 添加求和公式
    ws["E2"] = "=SUM(B2:D2)"

    # 添加条件公式
    ws["F2"] = '=IF(E2>100,"高","低")'

    # 添加 VLOOKUP
    ws["G2"] = '=VLOOKUP(A2,Sheet2!A:B,2,FALSE)'

    wb.save(path)

def create_summary_sheet(path: str):
    """创建汇总表"""
    wb = load_workbook(path)
    data_sheet = wb.active

    # 创建汇总表
    summary = wb.create_sheet("汇总")

    summary["A1"] = "统计项"
    summary["B1"] = "值"

    summary["A2"] = "总行数"
    summary["B2"] = f"=COUNTA('{data_sheet.title}'!A:A)-1"

    summary["A3"] = "总和"
    summary["B3"] = f"=SUM('{data_sheet.title}'!B:B)"

    summary["A4"] = "平均值"
    summary["B4"] = f"=AVERAGE('{data_sheet.title}'!B:B)"

    wb.save(path)
```

---

## 样式设置

```python
from openpyxl.styles import Font, Alignment, Border, Side, PatternFill
from openpyxl.utils import get_column_letter

def apply_styles(path: str):
    """应用样式"""
    wb = load_workbook(path)
    ws = wb.active

    # 标题样式
    header_font = Font(name="微软雅黑", size=12, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_alignment = Alignment(horizontal="center", vertical="center")

    # 边框样式
    thin_border = Border(
        left=Side(style="thin"),
        right=Side(style="thin"),
        top=Side(style="thin"),
        bottom=Side(style="thin")
    )

    # 应用到第一行
    for cell in ws[1]:
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = thin_border

    # 设置列宽
    for col in range(1, ws.max_column + 1):
        ws.column_dimensions[get_column_letter(col)].width = 15

    # 冻结首行
    ws.freeze_panes = "A2"

    wb.save(path)

def conditional_formatting(path: str):
    """条件格式"""
    from openpyxl.formatting.rule import ColorScaleRule, CellIsRule

    wb = load_workbook(path)
    ws = wb.active

    # 颜色渐变
    color_scale = ColorScaleRule(
        start_type="min", start_color="FF0000",
        mid_type="percentile", mid_value=50, mid_color="FFFF00",
        end_type="max", end_color="00FF00"
    )
    ws.conditional_formatting.add("B2:B100", color_scale)

    # 条件高亮
    red_fill = PatternFill(start_color="FFC7CE", end_color="FFC7CE", fill_type="solid")
    ws.conditional_formatting.add(
        "C2:C100",
        CellIsRule(operator="lessThan", formula=["0"], fill=red_fill)
    )

    wb.save(path)
```

---

## 图表生成

```python
from openpyxl.chart import BarChart, LineChart, PieChart, Reference

def create_bar_chart(path: str, data_range: str, chart_position: str = "F2"):
    """创建柱状图"""
    wb = load_workbook(path)
    ws = wb.active

    chart = BarChart()
    chart.title = "数据分析"
    chart.x_axis.title = "类别"
    chart.y_axis.title = "数值"

    data = Reference(ws, min_col=2, min_row=1, max_col=2, max_row=10)
    categories = Reference(ws, min_col=1, min_row=2, max_row=10)

    chart.add_data(data, titles_from_data=True)
    chart.set_categories(categories)

    ws.add_chart(chart, chart_position)
    wb.save(path)

def create_line_chart(path: str):
    """创建折线图"""
    wb = load_workbook(path)
    ws = wb.active

    chart = LineChart()
    chart.title = "趋势分析"
    chart.style = 10

    data = Reference(ws, min_col=2, max_col=4, min_row=1, max_row=10)
    chart.add_data(data, titles_from_data=True)

    categories = Reference(ws, min_col=1, min_row=2, max_row=10)
    chart.set_categories(categories)

    ws.add_chart(chart, "F2")
    wb.save(path)

def create_pie_chart(path: str):
    """创建饼图"""
    wb = load_workbook(path)
    ws = wb.active

    chart = PieChart()
    chart.title = "占比分析"

    data = Reference(ws, min_col=2, min_row=1, max_row=5)
    labels = Reference(ws, min_col=1, min_row=2, max_row=5)

    chart.add_data(data, titles_from_data=True)
    chart.set_categories(labels)

    ws.add_chart(chart, "F2")
    wb.save(path)
```

---

## 数据转换

```python
import pandas as pd

def excel_to_csv(excel_path: str, csv_path: str):
    """Excel 转 CSV"""
    df = pd.read_excel(excel_path)
    df.to_csv(csv_path, index=False, encoding="utf-8-sig")

def csv_to_excel(csv_path: str, excel_path: str):
    """CSV 转 Excel"""
    df = pd.read_csv(csv_path)
    df.to_excel(excel_path, index=False)

def excel_to_json(excel_path: str, json_path: str):
    """Excel 转 JSON"""
    df = pd.read_excel(excel_path)
    df.to_json(json_path, orient="records", force_ascii=False, indent=2)

def json_to_excel(json_path: str, excel_path: str):
    """JSON 转 Excel"""
    df = pd.read_json(json_path)
    df.to_excel(excel_path, index=False)
```

---

## 批量处理

```python
import os
from glob import glob
import pandas as pd

def merge_excel_files(input_dir: str, output_path: str):
    """合并多个 Excel 文件"""
    all_files = glob(os.path.join(input_dir, "*.xlsx"))
    dfs = []

    for file in all_files:
        df = pd.read_excel(file)
        df["source_file"] = os.path.basename(file)
        dfs.append(df)

    merged = pd.concat(dfs, ignore_index=True)
    merged.to_excel(output_path, index=False)

def split_by_column(path: str, column: str, output_dir: str):
    """按列值拆分为多个文件"""
    df = pd.read_excel(path)

    for value in df[column].unique():
        subset = df[df[column] == value]
        output_path = os.path.join(output_dir, f"{value}.xlsx")
        subset.to_excel(output_path, index=False)
```
