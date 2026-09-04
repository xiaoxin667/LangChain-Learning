import os

from langchain_community.document_loaders import PyPDFLoader

from app.environ import get_pdf_key

# 相对本文件定位，避免硬编码绝对路径导致换机器后失效
PDF_PATH = os.path.join(os.path.dirname(__file__), "file", "data.pdf")


def get_loader():
    """综测规则 PDF 加载器（文档加密时通过 PDF_DATA_KEY 环境变量提供密码）"""
    if not os.path.exists(PDF_PATH):
        raise FileNotFoundError(f"未找到综测规则文档：{PDF_PATH}")
    return PyPDFLoader(PDF_PATH, password=get_pdf_key())
