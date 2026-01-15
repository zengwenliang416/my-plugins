#!/usr/bin/env python3
"""
PDF 文本提取脚本
用法: python pdf-to-text.py <pdf文件路径> [输出文件路径]
"""

import sys
import os

# 尝试多个 PDF 库
PDF_LIB = None

try:
    import pdfplumber

    PDF_LIB = "pdfplumber"
except ImportError:
    pass

if not PDF_LIB:
    try:
        import PyPDF2

        PDF_LIB = "pypdf2"
    except ImportError:
        pass

if not PDF_LIB:
    try:
        import fitz  # PyMuPDF

        PDF_LIB = "pymupdf"
    except ImportError:
        pass

if not PDF_LIB:
    print("请安装 PDF 处理库之一:")
    print("  pip install pdfplumber  (推荐)")
    print("  pip install PyPDF2")
    print("  pip install PyMuPDF")
    sys.exit(1)


def extract_with_pdfplumber(pdf_path: str) -> tuple:
    """使用 pdfplumber 提取文本"""
    import pdfplumber

    text = ""
    metadata = {}

    with pdfplumber.open(pdf_path) as pdf:
        metadata = {"pages": len(pdf.pages), "metadata": pdf.metadata or {}}

        for i, page in enumerate(pdf.pages, 1):
            page_text = page.extract_text() or ""
            if page_text:
                text += f"\n--- 第 {i} 页 ---\n\n"
                text += page_text + "\n"

    return text, metadata


def extract_with_pypdf2(pdf_path: str) -> tuple:
    """使用 PyPDF2 提取文本"""
    import PyPDF2

    text = ""
    metadata = {}

    with open(pdf_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)

        metadata = {
            "pages": len(reader.pages),
            "metadata": dict(reader.metadata) if reader.metadata else {},
        }

        for i, page in enumerate(reader.pages, 1):
            page_text = page.extract_text() or ""
            if page_text:
                text += f"\n--- 第 {i} 页 ---\n\n"
                text += page_text + "\n"

    return text, metadata


def extract_with_pymupdf(pdf_path: str) -> tuple:
    """使用 PyMuPDF 提取文本"""
    import fitz

    text = ""
    metadata = {}

    doc = fitz.open(pdf_path)

    metadata = {"pages": len(doc), "metadata": doc.metadata or {}}

    for i, page in enumerate(doc, 1):
        page_text = page.get_text() or ""
        if page_text:
            text += f"\n--- 第 {i} 页 ---\n\n"
            text += page_text + "\n"

    doc.close()

    return text, metadata


def extract_text(pdf_path: str) -> tuple:
    """提取 PDF 文本"""
    if PDF_LIB == "pdfplumber":
        return extract_with_pdfplumber(pdf_path)
    elif PDF_LIB == "pypdf2":
        return extract_with_pypdf2(pdf_path)
    elif PDF_LIB == "pymupdf":
        return extract_with_pymupdf(pdf_path)


def main():
    if len(sys.argv) < 2:
        print("用法: python pdf-to-text.py <pdf文件路径> [输出文件路径]")
        sys.exit(1)

    pdf_path = sys.argv[1]

    if not os.path.exists(pdf_path):
        print(f"文件不存在: {pdf_path}")
        sys.exit(1)

    # 确定输出路径
    if len(sys.argv) > 2:
        output_path = sys.argv[2]
    else:
        output_path = os.path.splitext(pdf_path)[0] + ".txt"

    print(f"📑 提取 PDF 文本: {pdf_path}")
    print(f"   使用库: {PDF_LIB}")

    text, metadata = extract_text(pdf_path)

    # 添加元数据信息
    header = f"""# PDF 文本提取结果

**源文件**: {os.path.basename(pdf_path)}
**页数**: {metadata['pages']}
**提取库**: {PDF_LIB}

---

"""

    full_text = header + text

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(full_text)

    print(f"✅ 文本已保存: {output_path}")
    print(f"   页数: {metadata['pages']}")
    print(f"   字符数: {len(text)}")


if __name__ == "__main__":
    main()
