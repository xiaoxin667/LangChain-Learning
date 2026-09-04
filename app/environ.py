import os

from dotenv import load_dotenv

# 支持把密钥写在项目根目录的 .env 文件里（该文件已被 .gitignore 排除）。
# 默认不覆盖已存在的环境变量，系统环境变量优先。
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


def get_pdf_key():
    return os.environ.get("PDF_DATA_KEY")


def get_api_key():
    return os.environ.get("DEEPSEEK_API_KEY")


def get_qwen_key():
    return os.environ.get("QWEN_API_KEY")
