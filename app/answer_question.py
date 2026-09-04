# 综测规则检索问答核心模块
# 链路与 04 章一致：PDF 加载 → Embedding 向量化建索引 → 相似度检索 → LLM 生成
# Embedding 走阿里云百炼 DashScope 的轻量 Qwen 模型（不需要本地跑 8B 大模型），
# 生成模型走 DeepSeek（见 app/load_llm.py）
import os

from langchain_classic.indexes import VectorstoreIndexCreator
from langchain_community.vectorstores import DocArrayInMemorySearch
from langchain_core.prompts import PromptTemplate
from langchain_openai import OpenAIEmbeddings

from app.environ import get_qwen_key
from app.io import get_loader
from app.load_llm import create_llm

PROMPT_FILE = os.path.join(os.path.dirname(__file__), "query_prompt_template.md")

# 每次检索取最相关的文档片段数
TOP_K = 4


def get_embeddings():
    """嵌入模型：与 04 章配置完全一致，阿里云百炼 DashScope 兼容接口的 Qwen embedding"""
    return OpenAIEmbeddings(
        api_key=get_qwen_key(),
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        model="qwen3.7-text-embedding",
        check_embedding_ctx_length=False,  # 发送原始文本而非 token 数组，否则 DashScope 拒绝
        chunk_size=20,  # DashScope 单次请求最多 20 条文本
    )


def load_prompt() -> PromptTemplate:
    """加载综测检索提示词模板（app/query_prompt_template.md）

    模板中 {context} 会被替换为检索到的文档片段，{question} 替换为用户问题
    """
    with open(PROMPT_FILE, encoding="utf-8") as f:
        return PromptTemplate.from_template(f.read())


_index = None


def get_index():
    """创建向量索引；进程内缓存，避免每问一个问题都重新向量化整份 PDF"""
    global _index
    if _index is None:
        _index = VectorstoreIndexCreator(
            vectorstore_cls=DocArrayInMemorySearch,
            embedding=get_embeddings(),
        ).from_loaders([get_loader()])
    return _index


def search_zongce(question, k=TOP_K):
    """只检索不生成：返回与问题最相关的 k 个文档片段（用于溯源 / 调试检索质量）"""
    retriever = get_index().vectorstore.as_retriever(search_kwargs={"k": k})
    return retriever.invoke(question)


def query_zongce_with_sources(question, llm=None):
    """检索 + 生成，同时返回答案和引用的文档片段"""
    llm = llm or create_llm()
    docs = search_zongce(question)
    context = "\n\n---\n\n".join(d.page_content for d in docs)
    prompt = load_prompt().format(context=context, question=question)
    answer = llm.invoke(prompt).content
    return answer, docs


def query_zongce(question, llm=None):
    """对外主入口：基于综测规则文档回答问题，返回 Markdown 字符串"""
    answer, _ = query_zongce_with_sources(question, llm=llm)
    return answer


if __name__ == "__main__":
    question = input("请输入你要查询的问题：").strip()
    if question:
        print(query_zongce(question))
