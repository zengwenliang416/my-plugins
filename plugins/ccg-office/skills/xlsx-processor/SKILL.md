---
name: xlsx-processor
description: |
  【触发条件】当用户要求处理 Excel（创建/编辑/分析数据、公式计算、图表生成、格式设置）时使用。
  【核心产出】输出：Excel 文件、数据分析结果、图表、CSV/JSON 转换。
  【不触发】不用于：PDF/Word 文档（改用 pdf-processor/docx-processor）、财务建模（需更详细规范）。
  【先问什么】若缺少：Excel 文件路径、处理类型（创建/分析/转换），先提问补齐。
allowed-tools: Read, Write, Edit, Bash, mcp__context7__resolve-library-id, mcp__context7__get-library-docs
---

# XLSX Processor - Excel 文档处理助手

使用 Python 处理 Microsoft Excel (.xlsx) 文件，支持读写数据、公式计算、样式设置、图表生成等操作。

## 工作流程

```
1. 读取/创建 Excel → 2. 数据处理 → 3. 添加公式/图表 → 4. 公式重算 → 5. 验证输出
```

---

## 任务路由

| 任务类型 | 处理方式             | 参考文档                                  |
| -------- | -------------------- | ----------------------------------------- |
| 读写数据 | pandas / openpyxl    | `references/code-templates.md`            |
| 公式计算 | 写入公式 + recalc.py | `references/code-templates.md#公式和计算` |
| 样式设置 | openpyxl styles      | `references/code-templates.md#样式设置`   |
| 图表生成 | openpyxl charts      | `references/code-templates.md#图表生成`   |
| 格式转换 | pandas read/write    | `references/code-templates.md#数据转换`   |

---

## 依赖库

| 库           | 用途           |
| ------------ | -------------- |
| `openpyxl`   | 读写 xlsx 文件 |
| `pandas`     | 数据分析和转换 |
| `xlsxwriter` | 高级写入和图表 |

---

## 公式重算（重要）

openpyxl 创建/修改的 Excel 文件包含公式字符串但不包含计算值。**必须使用 recalc.py 重算公式**：

```bash
python scripts/recalc.py output.xlsx [timeout_seconds]
```

脚本功能：

- 自动配置 LibreOffice 宏（首次运行）
- 重算所有公式
- 扫描 Excel 错误（#REF!, #DIV/0!, #VALUE!, #NAME?, #N/A）
- 返回 JSON 格式的错误报告

返回示例：

```json
{
  "status": "success",
  "total_errors": 0,
  "total_formulas": 42,
  "error_summary": {}
}
```

**重要提示**：

- 始终使用 Excel 公式而非 Python 硬编码计算值
- ❌ 错误：`sheet['B10'] = df['Sales'].sum()`
- ✅ 正确：`sheet['B10'] = '=SUM(B2:B9)'`

---

## 工具脚本

| 脚本                       | 功能         | 用法                                     |
| -------------------------- | ------------ | ---------------------------------------- |
| `scripts/recalc.py`        | **公式重算** | `python scripts/recalc.py <xlsx> [秒]`   |
| `scripts/xlsx-to-csv.py`   | Excel 转 CSV | `python scripts/xlsx-to-csv.py <xlsx>`   |
| `scripts/xlsx-analysis.py` | 分析 Excel   | `python scripts/xlsx-analysis.py <xlsx>` |

---

## 常用操作速查

### 读写数据

```python
import pandas as pd
df = pd.read_excel("data.xlsx")
df.to_excel("output.xlsx", index=False)
```

### 添加公式

```python
from openpyxl import load_workbook
wb = load_workbook("data.xlsx")
ws = wb.active
ws["E2"] = "=SUM(B2:D2)"
wb.save("data.xlsx")
```

### 应用样式

```python
from openpyxl.styles import Font, PatternFill
cell.font = Font(bold=True)
cell.fill = PatternFill(start_color="4472C4", fill_type="solid")
```

---

## 参考文档导航

| 需要         | 读取                           |
| ------------ | ------------------------------ |
| 完整代码模板 | `references/code-templates.md` |
| 公式参考     | `formulas-reference.md`        |
| Excel 模板   | `templates/`                   |
