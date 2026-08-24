import os

def get_pdf_key():
    return os.environ.get("PDF_DATA_KEY")

def get_api_key():
    return os.environ.get("DEEPSEEK_API_KEY")

def get_qwen_key():
    return os.environ.get("QWEN_API_KEY")