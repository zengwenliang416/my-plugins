---
name: pdf-processor
description: |
  【触发条件】当用户要求处理 PDF（提取文本/表格、合并/拆分、填写表单、加密/解密、转图片）时使用。
  【核心产出】输出：处理后的 PDF 文件、提取的文本/表格数据、填写完成的表单。
  【不触发】不用于：Word/Excel 文档处理（改用 docx-processor/xlsx-processor）。
  【先问什么】若缺少：PDF 文件路径、处理类型（提取/合并/填写表单），先提问补齐。
allowed-tools: Read, Write, Edit, Bash, mcp__context7__resolve-library-id, mcp__context7__get-library-docs
---

# PDF Processor - PDF 文档处理助手

## 功能概述

使用 Python 处理 PDF 文档，支持文本提取、表格识别、元数据读取、合并拆分等操作。

## 依赖库

| 库               | 用途                               |
| ---------------- | ---------------------------------- |
| `PyPDF2`         | PDF 基础操作（合并、拆分、元数据） |
| `pdfplumber`     | 提取文本和表格                     |
| `pdf2image`      | 转换为图片                         |
| `reportlab`      | 创建 PDF                           |
| `PyMuPDF (fitz)` | 高性能 PDF 处理                    |

## 文本提取

### 基础提取

```python
import pdfplumber

def extract_text(path: str) -> str:
    """提取 PDF 全部文本"""
    text_parts = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
    return "\n\n".join(text_parts)

def extract_text_by_page(path: str) -> list[dict]:
    """按页提取文本"""
    pages = []
    with pdfplumber.open(path) as pdf:
        for i, page in enumerate(pdf.pages):
            pages.append({
                "page": i + 1,
                "text": page.extract_text() or "",
                "width": page.width,
                "height": page.height
            })
    return pages
```

### 表格提取

```python
def extract_tables(path: str) -> list[list[list[str]]]:
    """提取所有表格"""
    tables = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            page_tables = page.extract_tables()
            tables.extend(page_tables)
    return tables

def tables_to_dataframe(path: str):
    """将表格转换为 DataFrame"""
    import pandas as pd

    all_dfs = []
    tables = extract_tables(path)

    for table in tables:
        if table and len(table) > 1:
            df = pd.DataFrame(table[1:], columns=table[0])
            all_dfs.append(df)

    return all_dfs
```

## 元数据操作

```python
from PyPDF2 import PdfReader, PdfWriter

def get_metadata(path: str) -> dict:
    """获取 PDF 元数据"""
    reader = PdfReader(path)
    info = reader.metadata

    return {
        "title": info.title if info else None,
        "author": info.author if info else None,
        "subject": info.subject if info else None,
        "creator": info.creator if info else None,
        "producer": info.producer if info else None,
        "pages": len(reader.pages)
    }

def set_metadata(path: str, output_path: str, metadata: dict):
    """设置 PDF 元数据"""
    reader = PdfReader(path)
    writer = PdfWriter()

    for page in reader.pages:
        writer.add_page(page)

    writer.add_metadata(metadata)

    with open(output_path, "wb") as f:
        writer.write(f)
```

## 合并与拆分

### 合并 PDF

```python
def merge_pdfs(paths: list[str], output_path: str):
    """合并多个 PDF"""
    writer = PdfWriter()

    for path in paths:
        reader = PdfReader(path)
        for page in reader.pages:
            writer.add_page(page)

    with open(output_path, "wb") as f:
        writer.write(f)
```

### 拆分 PDF

```python
def split_pdf(path: str, output_dir: str):
    """拆分 PDF 为单页"""
    import os
    reader = PdfReader(path)

    for i, page in enumerate(reader.pages):
        writer = PdfWriter()
        writer.add_page(page)

        output_path = os.path.join(output_dir, f"page_{i+1}.pdf")
        with open(output_path, "wb") as f:
            writer.write(f)

def split_by_range(path: str, ranges: list[tuple], output_paths: list[str]):
    """按页码范围拆分"""
    reader = PdfReader(path)

    for (start, end), output_path in zip(ranges, output_paths):
        writer = PdfWriter()
        for i in range(start - 1, end):
            writer.add_page(reader.pages[i])

        with open(output_path, "wb") as f:
            writer.write(f)
```

## 高级操作

### 添加水印

```python
def add_watermark(input_path: str, watermark_path: str, output_path: str):
    """添加水印"""
    reader = PdfReader(input_path)
    watermark_reader = PdfReader(watermark_path)
    watermark_page = watermark_reader.pages[0]

    writer = PdfWriter()

    for page in reader.pages:
        page.merge_page(watermark_page)
        writer.add_page(page)

    with open(output_path, "wb") as f:
        writer.write(f)
```

### 加密 PDF

```python
def encrypt_pdf(input_path: str, output_path: str, password: str):
    """加密 PDF"""
    reader = PdfReader(input_path)
    writer = PdfWriter()

    for page in reader.pages:
        writer.add_page(page)

    writer.encrypt(password)

    with open(output_path, "wb") as f:
        writer.write(f)

def decrypt_pdf(input_path: str, output_path: str, password: str):
    """解密 PDF"""
    reader = PdfReader(input_path)
    if reader.is_encrypted:
        reader.decrypt(password)

    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)

    with open(output_path, "wb") as f:
        writer.write(f)
```

### 转换为图片

```python
from pdf2image import convert_from_path

def pdf_to_images(path: str, output_dir: str, dpi: int = 200):
    """将 PDF 转换为图片"""
    import os
    images = convert_from_path(path, dpi=dpi)

    paths = []
    for i, image in enumerate(images):
        output_path = os.path.join(output_dir, f"page_{i+1}.png")
        image.save(output_path, "PNG")
        paths.append(output_path)

    return paths
```

## 使用 PyMuPDF (高性能)

```python
import fitz  # PyMuPDF

def extract_text_fast(path: str) -> str:
    """快速提取文本"""
    doc = fitz.open(path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def extract_images(path: str, output_dir: str):
    """提取 PDF 中的图片"""
    import os
    doc = fitz.open(path)
    image_count = 0

    for page_num in range(len(doc)):
        page = doc[page_num]
        images = page.get_images()

        for img_index, img in enumerate(images):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]

            image_path = os.path.join(
                output_dir,
                f"image_p{page_num+1}_{img_index+1}.{image_ext}"
            )
            with open(image_path, "wb") as f:
                f.write(image_bytes)
            image_count += 1

    return image_count
```

## 可执行脚本

| 脚本                                        | 功能               | 用法                                                          |
| ------------------------------------------- | ------------------ | ------------------------------------------------------------- |
| `scripts/pdf-to-text.py`                    | 提取 PDF 文本      | `python scripts/pdf-to-text.py <pdf文件>`                     |
| `scripts/check_fillable_fields.py`          | 检查表单是否可填写 | `python scripts/check_fillable_fields.py <pdf>`               |
| `scripts/extract_form_field_info.py`        | 提取表单字段信息   | `python scripts/extract_form_field_info.py <pdf> <json>`      |
| `scripts/fill_fillable_fields.py`           | 填写可填写表单     | `python scripts/fill_fillable_fields.py <pdf> <json> <out>`   |
| `scripts/convert_pdf_to_images.py`          | PDF 转图片         | `python scripts/convert_pdf_to_images.py <pdf> <outdir>`      |
| `scripts/create_validation_image.py`        | 创建验证图像       | `python scripts/create_validation_image.py <page> <json> ...` |
| `scripts/check_bounding_boxes.py`           | 检查边界框         | `python scripts/check_bounding_boxes.py <json>`               |
| `scripts/fill_pdf_form_with_annotations.py` | 用注释填写表单     | `python scripts/fill_pdf_form_with_annotations.py <pdf> ...`  |

## 参考文档

- `forms.md` - **PDF 表单填写指南**（可填写/不可填写表单处理流程）
- `reference.md` - 高级 PDF 处理参考（pypdfium2、JavaScript 库、故障排除）
- `extraction-tips.md` - 提取技巧
- `templates/` - PDF 模板
