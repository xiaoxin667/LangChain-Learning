from langchain_classic.document_loaders import PyPDFLoader
from app.environ import get_pdf_key

def get_loader():
    pdf_key = get_pdf_key()
    file = r"F:\LangChain\app\file\data.pdf"
    loader = PyPDFLoader(file,password=pdf_key)
    return loader