# 04 基于文档问答（RAG）

对应文件：`04_LangChain_Response.ipynb`

本文件实现"基于文档的问答"：让 LLM 回答关于一份 CSV 商品目录的问题。核心是引入 **Embedding 模型 + 向量存储（Vector Store）**，即 RAG（检索增强生成）的完整流程。

## 为什么要用 Embedding 和向量库

- LLM 一次只能接收有限个 token，大文档无法整篇塞进上下文。
- Embedding 把一段文字转换成一串数字（向量），**意思相近的文本向量距离相近**，从而可以在向量空间中比较文本片段。
- 向量库负责存储这些向量：建库时把文档拆成小块、每块生成向量、向量和原始块一起入库；查询时把问题也转成向量，与库里所有向量比较相似度，取最相关的几个块。
- 把检索到的相关片段连同问题一起交给 LLM，模型就能基于文档内容作答——这就是"检索"与"生成"的分工。

## 模型分工（本文件的关键）

- **Embedding 模型（负责检索）**：用的是阿里云百炼（DashScope）的 Qwen embedding 接口；DeepSeek 本身不是 embedding 模型，没有向量化接口，所以必须另找 embedding 服务。
- **LLM（负责生成答案）**：仍是 DeepSeek，通过 `ChatOpenAI` 配置。

## 一键建索引（高层 API）

`VectorstoreIndexCreator` 把"加载 → 切块 → 向量化 → 入库"打包成一步：

```python
index = VectorstoreIndexCreator(
    vectorstore_cls=DocArrayInMemorySearch,  # 向量存储方式可替换
    embedding=embedding,
).from_loaders([loader])
```

查询时注意：`index.query(query, llm=llm)` **必须显式传 `llm`**，这个版本不再有默认模型。

## 底层手动流程（拆开看每一步）

1. 加载文档：`CSVLoader(file_path=file, encoding="utf-8")`，再 `loader.load()` 得到文档列表。
2. 配置 Embedding：`OpenAIEmbeddings(model=..., api_key=..., base_url=..., ...)`。
3. 用 `embed_query(text)` 得到单个向量；`embed_documents(texts)` 批量向量化。
4. 建向量库：`DocArrayInMemorySearch.from_documents(docs, embeddings)`。
5. 相似度检索：`db.similarity_search(query)` 返回最相关的几个文档块。
6. 手动问答：把检索到的内容拼进问题，`llm.invoke(f"{qdocs} Question: ...").content`。
7. 链式封装：`retriever = db.as_retriever()` 后，用 `RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=retriever)` 把检索和生成串成一条链。

## 回答的四种组合方式（chain_type）

- **stuff（默认）**：把检索到的所有内容一次性塞进提示词发给模型，简单直接，适合内容不多的情况。
- **map_reduce**：每个分块独立调用模型得到结果，再让模型把所有结果合并总结；调用次数多，且各块独立处理，不一定是最优结果。
- **refine**：迭代式，基于前一个文档的答案逐步构建；适合整合信息、随时间推移构建答案，但答案更长、速度更慢，每步依赖前面的结果。
- **map_rerank**：每个分块调用一次模型并额外返回一个评分，最后取最高分的结果；所有调用独立、响应快，但依赖模型评分是否准确。

## 注意事项（本文件踩过的坑）

- CSVLoader 必须指定 `encoding="utf-8"`：中文 Windows 系统默认用 gbk 打开文件，会报 `UnicodeDecodeError`。
- DashScope 的兼容接口有两个限制：`check_embedding_ctx_length=False`（否则 langchain 会在本地用 tiktoken 分词、发送 token 数组，DashScope 只认原始文本，报 `contents is neither str nor list of str`）；`chunk_size=20`（单次请求最多 20 条文本，否则报 batch size 超限）。
- `display(Markdown(response))` 在 PyCharm 的 notebook 里可能不渲染，内容其实已生成，改用 `print(response)` 即可查看。
- Embedding 维数：`len(embed_query(...))` 可以查看单个向量的维度。
