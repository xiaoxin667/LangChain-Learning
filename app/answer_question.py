from langchain_classic.indexes import VectorstoreIndexCreator
from langchain_classic.memory import ConversationTokenBufferMemory
from langchain_community.vectorstores import DocArrayInMemorySearch
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama import OllamaEmbeddings
from IPython.display import Markdown, display
from app.io import get_loader
from app.load_llm import create_llm

# 综测规则查询提示词模板
QUERY_PROMPT_TEMPLATE = """
Please answer the question {question} in Chinese in markdown,\
if it isn't mentioned in the text \
reply the user you don't know
"""


def get_embeddings():
    """获取嵌入模型"""
    return OllamaEmbeddings(model="ryanshillington/Qwen3-Embedding-8B:latest")


def get_index(embedding: OllamaEmbeddings, loader):
    """创建向量索引"""
    index = VectorstoreIndexCreator(
        vectorstore_cls=DocArrayInMemorySearch,
        embedding=embedding
    ).from_loaders([loader])
    return index

def get_response(query , index : VectorstoreIndexCreator, llm):
    response = index.query(query, llm=llm)
    return response

def get_message(question):
    template = ChatPromptTemplate.from_template(QUERY_PROMPT_TEMPLATE)
    message = template.format_messages(question=question)
    return message

if __name__ == '__main__':
    # 测试查询
    question = input("请输入你要查询的问题：")
    query = get_message(question)

    llm = create_llm()
    result = get_response(query,get_index(get_embeddings(),get_loader()),llm)



    display(Markdown(result))
