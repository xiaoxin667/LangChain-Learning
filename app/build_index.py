# 建索引自检脚本：加载综测 PDF → Embedding 向量化 → 用示例问题验证检索质量
# 对应 app/README.md 实现路线第 2 步："先手动验证 similarity_search 检索是否准确"
# 用法（项目根目录下执行）：python -m app.build_index
from app.answer_question import get_index, search_zongce
from app.io import get_loader

# 换成你想验证的真实问题；检索不准时优先调整 PDF 切块大小，其次换提问关键词
TEST_QUESTIONS = [
    "综合素质测评包含哪些部分？",
    "参加竞赛获奖如何加分？",
    "旷课会扣多少分？",
]


def count_chunks(vectorstore):
    """统计向量库中的文档片段数（即生成的 Embedding 条数）"""
    doc_index = vectorstore.doc_index
    for attr in ("num_docs", "__len__"):
        try:
            value = getattr(doc_index, attr)()
            if isinstance(value, int):
                return value
        except (AttributeError, TypeError):
            continue
    return -1


if __name__ == "__main__":
    pages = len(get_loader().load())
    print(f"📄 PDF 加载完成，共 {pages} 页")

    print("⏳ 正在向量化并构建索引（DashScope embedding，受单次 20 条限制，页数多时稍慢）...")
    index = get_index()
    chunks = count_chunks(index.vectorstore)
    print(f"✅ 索引构建完成，共 {chunks} 个文档片段")

    for question in TEST_QUESTIONS:
        docs = search_zongce(question, k=2)
        print(f"\n🔍 {question}")
        for i, doc in enumerate(docs, 1):
            page = doc.metadata.get("page", "?")
            preview = doc.page_content.replace("\n", " ")[:80]
            print(f"   [{i}] 第 {page} 页：{preview}...")
