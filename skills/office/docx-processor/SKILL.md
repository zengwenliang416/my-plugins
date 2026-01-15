---
name: docx-processor
description: |
  【触发条件】当用户要求处理 Word 文档（创建/编辑/分析内容、tracked changes、批注、格式设置）时使用。
  【核心产出】输出：Word 文件、提取的文本/表格数据、Markdown/HTML 转换、带修订的文档。
  【不触发】不用于：PDF 文档（改用 pdf-processor）、Excel 文档（改用 xlsx-processor）。
  【先问什么】若缺少：文档文件路径、处理类型（创建/编辑/分析/转换），先提问补齐。
allowed-tools: Read, Write, Edit, Bash, mcp__context7__resolve-library-id, mcp__context7__get-library-docs
---

# DOCX Processor - Word 文档处理助手

## 功能概述

使用 Python 处理 Microsoft Word (.docx) 文档，支持创建、编辑、分析、tracked changes、批注等操作。

## 工作流决策树

### 读取/分析内容

使用 pandoc 或 python-docx 提取文本

### 创建新文档

- **简单文档** → 使用 python-docx（见下方"基础操作"）
- **复杂格式文档** → 使用 docx-js（见 `docx-js.md`）

### 编辑现有文档

- **自己的文档 + 简单修改** → 使用 python-docx
- **他人的文档 / 需要 tracked changes** → 使用 **Redlining 工作流**（推荐）

## 依赖库

| 库            | 用途                        |
| ------------- | --------------------------- |
| `python-docx` | 创建和编辑 Word 文档        |
| `docx2txt`    | 提取文档纯文本              |
| `mammoth`     | 转换为 HTML/Markdown        |
| `defusedxml`  | 安全 XML 解析（OOXML 编辑） |
| `docx` (npm)  | JavaScript 创建 Word 文档   |

## 基础操作（python-docx）

### 创建文档

```python
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def create_document(title: str, content: list[dict]) -> Document:
    """创建 Word 文档"""
    doc = Document()
    doc.add_heading(title, level=0)

    for item in content:
        if item["type"] == "heading":
            doc.add_heading(item["text"], level=item.get("level", 1))
        elif item["type"] == "paragraph":
            doc.add_paragraph(item["text"])
        elif item["type"] == "bullet":
            doc.add_paragraph(item["text"], style="List Bullet")

    return doc

doc = create_document("项目报告", [
    {"type": "heading", "text": "概述", "level": 1},
    {"type": "paragraph", "text": "这是项目概述..."},
])
doc.save("report.docx")
```

### 读取文档

```python
from docx import Document

def read_document(path: str) -> dict:
    """读取文档内容和结构"""
    doc = Document(path)
    result = {"paragraphs": [], "tables": []}

    for para in doc.paragraphs:
        result["paragraphs"].append({
            "text": para.text,
            "style": para.style.name if para.style else None
        })

    for table in doc.tables:
        table_data = [[cell.text for cell in row.cells] for row in table.rows]
        result["tables"].append(table_data)

    return result
```

## 文本提取

使用 pandoc 转换为 Markdown（推荐，可保留 tracked changes）：

```bash
# 转换为 Markdown，保留 tracked changes
pandoc --track-changes=all document.docx -o output.md
# 选项: --track-changes=accept/reject/all
```

## OOXML 高级编辑

对于需要 tracked changes、批注、复杂格式的场景，使用 OOXML 工作流。

### Redlining 工作流（文档修订追踪）

1. **获取 Markdown 表示**：

   ```bash
   pandoc --track-changes=all document.docx -o current.md
   ```

2. **读取文档参考**：
   - **必读**：`ooxml.md`（~600 行）- Document Library API 和 XML 模式
   - **解包文档**：`python ooxml/scripts/unpack.py <file.docx> <dir>`

3. **使用 Document Library 编辑**：

   ```python
   from scripts.document import Document

   doc = Document('unpacked')
   node = doc["word/document.xml"].get_node(tag="w:r", contains="target text")
   # 执行修改...
   doc.save()
   ```

4. **打包文档**：
   ```bash
   python ooxml/scripts/pack.py <dir> output.docx
   ```

### 关键 XML 文件结构

- `word/document.xml` - 主文档内容
- `word/comments.xml` - 批注
- `word/media/` - 嵌入的图片和媒体
- Tracked changes 使用 `<w:ins>`（插入）和 `<w:del>`（删除）标签

## 转换工具

```python
import mammoth

def docx_to_html(path: str) -> str:
    """转换为 HTML"""
    with open(path, "rb") as f:
        return mammoth.convert_to_html(f).value

def docx_to_markdown(path: str) -> str:
    """转换为 Markdown"""
    with open(path, "rb") as f:
        return mammoth.convert_to_markdown(f).value
```

## 文档转图片

```bash
# 1. DOCX 转 PDF
soffice --headless --convert-to pdf document.docx

# 2. PDF 转 JPEG
pdftoppm -jpeg -r 150 document.pdf page
# 输出: page-1.jpg, page-2.jpg, ...
```

## 可执行脚本

| 脚本                          | 功能             | 用法                                          |
| ----------------------------- | ---------------- | --------------------------------------------- |
| `scripts/docx-to-markdown.py` | Word 转 Markdown | `python scripts/docx-to-markdown.py <docx>`   |
| `ooxml/scripts/unpack.py`     | 解包 Office 文件 | `python ooxml/scripts/unpack.py <file> <dir>` |
| `ooxml/scripts/pack.py`       | 打包 Office 文件 | `python ooxml/scripts/pack.py <dir> <file>`   |
| `ooxml/scripts/validate.py`   | 验证 XML Schema  | `python ooxml/scripts/validate.py <dir>`      |

## 参考文档

- `ooxml.md` - **OOXML 编辑指南**（Document Library API、tracked changes 模式）
- `docx-js.md` - **docx-js 创建文档**（JavaScript/TypeScript 创建复杂文档）
- `templates/` - 文档模板
