#!/usr/bin/env python3
"""
Excel 转 CSV 脚本
用法: python xlsx-to-csv.py <xlsx文件路径> [输出目录]
"""

import sys
import os

try:
    import pandas as pd
except ImportError:
    print("请安装依赖: pip install pandas openpyxl")
    sys.exit(1)


def convert_xlsx_to_csv(xlsx_path: str, output_dir: str) -> list:
    """将 Excel 文件转换为 CSV"""
    os.makedirs(output_dir, exist_ok=True)

    # 读取所有工作表
    xlsx = pd.ExcelFile(xlsx_path)
    sheet_names = xlsx.sheet_names

    output_files = []
    base_name = os.path.splitext(os.path.basename(xlsx_path))[0]

    for sheet_name in sheet_names:
        df = pd.read_excel(xlsx, sheet_name=sheet_name)

        # 清理工作表名（移除特殊字符）
        safe_sheet_name = "".join(
            c if c.isalnum() or c in ("-", "_") else "_" for c in sheet_name
        )

        if len(sheet_names) == 1:
            output_file = os.path.join(output_dir, f"{base_name}.csv")
        else:
            output_file = os.path.join(output_dir, f"{base_name}_{safe_sheet_name}.csv")

        df.to_csv(output_file, index=False, encoding="utf-8-sig")

        output_files.append(
            {
                "sheet": sheet_name,
                "file": output_file,
                "rows": len(df),
                "columns": len(df.columns),
            }
        )

    return output_files


def main():
    if len(sys.argv) < 2:
        print("用法: python xlsx-to-csv.py <xlsx文件路径> [输出目录]")
        sys.exit(1)

    xlsx_path = sys.argv[1]

    if not os.path.exists(xlsx_path):
        print(f"文件不存在: {xlsx_path}")
        sys.exit(1)

    # 确定输出目录
    if len(sys.argv) > 2:
        output_dir = sys.argv[2]
    else:
        output_dir = os.path.dirname(xlsx_path) or "."

    print(f"📊 转换 Excel: {xlsx_path}")

    results = convert_xlsx_to_csv(xlsx_path, output_dir)

    print(f"\n✅ 转换完成!")
    print(f"   共 {len(results)} 个工作表:\n")

    for result in results:
        print(f"   - {result['sheet']}")
        print(f"     文件: {result['file']}")
        print(f"     行数: {result['rows']}, 列数: {result['columns']}\n")


if __name__ == "__main__":
    main()
