# LangChain 学习笔记（整合版）

本文件整合 01–05 五个 notebook 的全部知识点，是本仓库统一的笔记文件，便于集中查阅。

学习路径主线：调用模型（01）→ 让模型记住上下文（02）→ 把多步骤串成链（03）→ 基于文档问答 RAG（04）→ 评估应用效果（05）。

## 目录

- [01 提示词工程：原生 SDK 对比 LangChain](#01-提示词工程原生-sdk-对比-langchain)
- [02 会话记忆管理](#02-会话记忆管理)
- [03 链（Chains）](#03-链chains)
- [04 基于文档问答（RAG）](#04-基于文档问答rag)
- [05 LLM 应用评估（Evaluation）](#05-llm-应用评估evaluation)
- [附录：新版 API 与旧教程差异速查](#附录新版-api-与旧教程差异速查)

## 01 提示词工程：原生 SDK 对比 LangChain

对应文件：`01_LangChain_diff.ipynb`

本部分演示了两种调用大模型的方式：直接用 OpenAI SDK（原生）和使用 LangChain 封装，并在此基础上引入提示词模板与结构化输出解析器，是整门课的地基。

### 原生 OpenAI SDK 的调用方式

- `openai` 包 1.0.0 之后，所有请求都必须挂在 `client` 对象上，写法为 `client.chat.completions.create(...)`。
- 创建客户端时指定 `api_key` 和 `base_url`（DeepSeek 兼容 OpenAI 协议，`base_url` 填 `https://api.deepseek.com`）。
- 一次调用的完整链路：组装 `messages` 列表（角色 + 内容）→ `create` 发起请求 → 从返回结果的 `choices[0].message.content` 取出回答文本。
- 示例中把这一套封装成了 `get_completion(prompt, model)` 函数，方便复用。

### LangChain 的封装方式

- 从 `langchain_openai` 导入 `ChatOpenAI`，同样传入 `api_key`、`base_url`、`model`，额外加 `temperature=0.0` 降低输出随机性。
- 调用统一走 `chat.invoke(messages)`，返回 `AIMessage` 对象，用 `.content` 取文本；旧的 `chat(messages)` 写法已废弃。

### 提示词模板（Prompt Template）

- 模板本质是含 `{占位符}` 的字符串，用 `ChatPromptTemplate.from_template()` 转换为模板对象。
- 用 `format_messages(style=..., text=...)` 填入实际值，得到消息列表；这个过程只是本地字符串替换，不产生网络请求。
- 相比 f-string 拼接，模板更适合长且复杂的提示词、方便复用；LangChain 还为摘要、连数据库等常见任务内置了现成模板。

### 结构化输出（Structured Output）

- 模型返回的"JSON"本质上只是一个字符串（`type(response.content)` 结果是 `str`），必须经过解析才能按 key 取值。
- 用 `ResponseSchema(name, description)` 逐个声明要提取的字段，组成 schema 列表。
- `StructuredOutputParser.from_response_schemas(schema)` 创建解析器，同一个解析器承担两个职责：`get_format_instructions()` 生成 JSON 格式说明书注入提示词，`parse()` 把模型回复解析成 Python 字典——"谁发说明书谁来阅卷"。
- 提示词模板里预留 `{format_instructions}` 占位符，把格式说明书拼进用户消息里，模型才能按指定格式输出。

### 调用大模型的四步流程（本章核心总结）

1. 创建模型对象：`ChatOpenAI(model=..., api_key=..., base_url=..., temperature=...)`
2. 创建模板对象：`ChatPromptTemplate.from_template(含 {变量} 的模板字符串)`
3. 填充变量生成消息列表：`prompt_template.format_messages(变量=实际值)`
4. 调用模型：`chat.invoke(消息列表).content`

### 注意事项

- 新版包结构：模型在 `langchain_openai`，模板在 `langchain_core.prompts`，而 `ResponseSchema`、`StructuredOutputParser` 等旧版类位于 `langchain_classic`（官方已标记弃用）。
- 用 `prompt_template.messages[0].prompt.input_variables` 可以查看模板里声明的变量名列表。
- 分隔符（如三反引号）能有效帮助模型区分"指令"和"待处理文本"。

## 02 会话记忆管理

对应文件：`02_LangChain_Memory.ipynb`

本部分讲解会话记忆的核心思想与四种记忆实现。关键前提：**大模型本身是无状态的**，每次 API 请求相互独立，它并不"记得"之前说过什么；记忆组件的作用是把历史对话保存下来，再注入到每次请求的提示词里，让模型表现出"记得"。

### 核心组件

- `ConversationChain(llm=..., memory=..., verbose=True)`：把模型、提示词、记忆串成一条对话链，自动完成"读取记忆 → 拼提示词 → 调用模型 → 更新记忆"的完整流程，用 `predict(input=...)` 发起对话。
- `verbose=True` 可以看到链内部拼接了哪些内容，适合学习阶段观察记忆是如何注入的。
- `save_context({"input": ...}, {"output": ...})` 手动写入一轮对话；`load_memory_variables({})` 读取当前记忆。

### 四种记忆实现

#### ConversationBufferMemory（完整历史）

- 无差别保存全部对话历史，`memory.buffer` 可以看到完整内容。
- 缺点：对话越长，注入提示词的历史越多，最终会超出模型上下文上限。

#### ConversationBufferWindowMemory（滑动窗口）

- `k=1` 表示只保留最近 1 轮对话，超过的旧对话直接丢弃。
- 防止记忆量随对话无限增长，代价是会遗忘更早的上下文。

#### ConversationTokenBufferMemory（按 token 裁剪）

- `max_token_limit` 限定记忆的 token 总数，超出时从最早的内容开始丢弃。
- 它的 `llm` 参数**仅用于统计 token 数量**，不是用来对话的，所以复用前面创建的 `ChatOpenAI` 实例即可。
- 需要配置计数方式：`ChatOpenAI(tiktoken_model_name="gpt-4o-mini")`。

#### ConversationSummaryBufferMemory（超限自动摘要）

- 同样有 `max_token_limit` 上限，但超出时不是直接丢弃，而是调用 LLM 把旧对话压缩成一段摘要，保留要点。
- 兼顾"记得全"与"装得下"：近期的保留原文，更早的保留摘要。

### 注意事项

- 本章的 Memory 类都来自 `langchain_classic`（旧版 API，官方已标记弃用，2.0 将移除），此处用于理解记忆机制原理；新项目应改用 `create_agent` + checkpointer。
- 旧教程里 `from langchain_community.llms import OpenAI` 的写法在本环境已不可用：它调用的是旧版文本补全接口，DeepSeek 并不支持，会报 `ModuleNotFoundError`。

## 03 链（Chains）

对应文件：`03_LangChain_Chains.ipynb`

本部分讲解链的概念：链把大语言模型（LLM）和提示词（Prompt）等组件组合成可复用的调用单元，从而把复杂任务拆成多个步骤串联起来。演示了三种链：LLMChain、顺序链、路由链。

### LLMChain（最基础的一条链）

- `LLMChain(llm=..., prompt=...)`：把模型和提示词模板绑在一起，一条链只做一件事。
- 用 `chain.run(product)` 发起调用，把参数填进模板的占位符再交给模型。
- 提示词模板示例：`"What is the best name to describe a company that makes {product}?"`。

### SimpleSequentialChain（简单顺序链）

- 适合"单输入 → 单输出"的串联：前一条链的输出作为后一条链的输入。
- 示例：链一根据产品起公司名，链二根据公司名写一句话介绍。
- 优点：写法简单；局限：只能处理一个输入和一个输出，中间结果拿不到。

### SequentialChain（多输入多输出顺序链）

- 适合多个步骤、每步有多个输入输出的场景，中间结果也能保留。
- 每条子链通过 `output_key` 给输出命名（如 `Chinese_Review`、`summary`），后续子链可以直接引用这些名字作为输入。
- 装配时声明 `input_variables` 和 `output_variables`，调用时传入原始输入，返回字典包含所有输出。
- 示例：评论翻译成中文 → 中文评论生成一句话摘要 → 判断原文语言 → 用指定语言写回复，四步串联。

### 路由链（MultiPromptChain）

- 场景：有多条子链，每条擅长一类输入，路由链先判断"这条输入该交给谁"，再把输入转发过去。
- 结构三件套：
  - `destination_chains`：字典，键是子链名（如 `physics`），值是对应的 LLMChain。
  - `default_chain`：兜底链，问题不属于任何子链时使用（模板只有 `{input}`，相当于通用问答）。
  - `router_chain`：调度员，由 `LLMRouterChain.from_llm(llm, router_prompt)` 创建，只负责选链、不负责回答。
- `RouterOutputParser` 把模型返回的 ```json``` 代码块解析成字典（`destination` 选中的链名 + `next_inputs` 可能的改写后输入）。
- 路由模板 `MULTI_PROMPT_ROUTER_TEMPLATE` 的要点：`<< FORMATTING >>` 规定模型必须按 JSON 格式输出；`<< CANDIDATE PROMPTS >>` 列出候选链清单（由"名字:描述"拼成）；模板里的 `{{` 是转义，`format` 后会还原成 `{`。
- 运行流程：`chain.run(问题)` → 路由链判断归属 → 命中则走对应子链 → 未命中走 default_chain。

### 注意事项

- 路由链要求模型稳定输出 JSON，所以路由用的 LLM 必须设 `temperature=0`（生成子链的 LLM 可以用较高温度，如 0.9）。
- `chain.run(...)` 已标记弃用，新代码建议用 `chain.invoke(...)`。

## 04 基于文档问答（RAG）

对应文件：`04_LangChain_Response.ipynb`

本部分实现"基于文档的问答"：让 LLM 回答关于一份 CSV 商品目录的问题。核心是引入 **Embedding 模型 + 向量存储（Vector Store）**，即 RAG（检索增强生成）的完整流程。

### 为什么要用 Embedding 和向量库

- LLM 一次只能接收有限个 token，大文档无法整篇塞进上下文。
- Embedding 把一段文字转换成一串数字（向量），**意思相近的文本向量距离相近**，从而可以在向量空间中比较文本片段。
- 向量库负责存储这些向量：建库时把文档拆成小块、每块生成向量、向量和原始块一起入库；查询时把问题也转成向量，与库里所有向量比较相似度，取最相关的几个块。
- 把检索到的相关片段连同问题一起交给 LLM，模型就能基于文档内容作答——这就是"检索"与"生成"的分工。

### 模型分工（本章关键）

- **Embedding 模型（负责检索）**：04 章用的是阿里云百炼（DashScope）的 Qwen embedding 接口（05 章换成本地 `qwen3-embedding:0.6b`）；DeepSeek 本身不是 embedding 模型，没有向量化接口，所以必须另找 embedding 服务。
- **LLM（负责生成答案）**：04 章用 DeepSeek，05 章换成本地 Ollama，通过 `ChatOpenAI` / `ChatOllama` 配置。

### 一键建索引（高层 API）

`VectorstoreIndexCreator` 把"加载 → 切块 → 向量化 → 入库"打包成一步：

```python
index = VectorstoreIndexCreator(
    vectorstore_cls=DocArrayInMemorySearch,  # 向量存储方式可替换
    embedding=embedding,
).from_loaders([loader])
```

查询时注意：`index.query(query, llm=llm)` **必须显式传 `llm`**，这个版本不再有默认模型。

### 底层手动流程（拆开看每一步）

1. 加载文档：`CSVLoader(file_path=file, encoding="utf-8")`，再 `loader.load()` 得到文档列表。
2. 配置 Embedding：`OpenAIEmbeddings(model=..., api_key=..., base_url=..., ...)`。
3. 用 `embed_query(text)` 得到单个向量；`embed_documents(texts)` 批量向量化。
4. 建向量库：`DocArrayInMemorySearch.from_documents(docs, embeddings)`。
5. 相似度检索：`db.similarity_search(query)` 返回最相关的几个文档块。
6. 手动问答：把检索到的内容拼进问题，`llm.invoke(f"{qdocs} Question: ...").content`。
7. 链式封装：`retriever = db.as_retriever()` 后，用 `RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=retriever)` 把检索和生成串成一条链。

### 回答的四种组合方式（chain_type）

- **stuff（默认）**：把检索到的所有内容一次性塞进提示词发给模型，简单直接，适合内容不多的情况。
- **map_reduce**：每个分块独立调用模型得到结果，再让模型把所有结果合并总结；调用次数多，且各块独立处理，不一定是最优结果。
- **refine**：迭代式，基于前一个文档的答案逐步构建；适合整合信息、随时间推移构建答案，但答案更长、速度更慢，每步依赖前面的结果。
- **map_rerank**：每个分块调用一次模型并额外返回一个评分，最后取最高分的结果；所有调用独立、响应快，但依赖模型评分是否准确。

### 注意事项（踩过的坑）

- CSVLoader 必须指定 `encoding="utf-8"`：中文 Windows 系统默认用 gbk 打开文件，会报 `UnicodeDecodeError`。
- DashScope 的兼容接口有两个限制：`check_embedding_ctx_length=False`（否则 langchain 会在本地用 tiktoken 分词、发送 token 数组，DashScope 只认原始文本，报 `contents is neither str nor list of str`）；`chunk_size=20`（单次请求最多 20 条文本，否则报 batch size 超限）。
- `display(Markdown(response))` 在 PyCharm 的 notebook 里可能不渲染，内容其实已生成，改用 `print(response)` 即可查看。
- Embedding 维数：`len(embed_query(...))` 可以查看单个向量的维度。

## 05 LLM 应用评估（Evaluation）

对应文件：`05_LangChain_assess.ipynb`

本部分解决"应用做出来之后，怎么系统地评估它好不好"的问题。核心思路：手工准备少量标准问答对，再用 LLM 从文档自动批量生成更多测试用例，最后用另一条 LLM 链当"阅卷老师"给回答评分——因为答案表述往往不唯一，无法用正则或字符串匹配判断对错，评估本身也要借助语言模型。

### 评估的基本思路

- 评估需要两部分材料：examples（问题 + 标准答案）和 predictions（应用对同一批问题的实际回答）。
- 答案表述不唯一：标准答案是 "Yes"，模型回答 "Yes, the ... has side pockets"，语义相同但字符串完全不同，所以简单匹配会把正确答案判错。
- 完整流程：准备 examples → 批量生成 predictions → `QAEvalChain` 逐条评分 → 人工抽查评分结果。

### 搭建被评估的问答链

- 复用 04 章的 RAG 流程：`CSVLoader` 加载商品目录 → 本地 `OllamaEmbeddings(model="qwen3-embedding:0.6b")` 向量化 → `VectorstoreIndexCreator` 一键建索引。
- 生成模型换成本地 Ollama：`ChatOllama(model="qwen3.5:2b", temperature=0.0, reasoning=False)`，不再依赖云端 API 余额。
- `reasoning=False` 必须设置：qwen3 系列默认开启思考模式，一个简单问题会先"思考"几千个 token 才给答案，关闭后响应速度相差几十倍。
- `RetrievalQA.from_chain_type(..., chain_type_kwargs={"document_separator": "<<<<>>>>"})` 可以自定义多个文档块拼进提示词时的分隔符。

### 准备评估数据集（examples）

两种互补的方式：

- **手工预设**：直接写 `[{"query": ..., "answer": ...}, ...]`，答案精确可控，但数量少、费人工。
- **LLM 自动生成**：`QAGenerateChain.from_llm(llm)` 专门负责从文档生成问答对；`example_gen_chain.apply_and_parse([{"doc": t} for t in data[:5]])` 逐篇文档生成。
- 新版返回结构多了一层 `qa_pairs` 包装（`{'qa_pairs': {'query': ..., 'answer': ...}}`），拼接前要拆掉：`examples += [e["qa_pairs"] for e in new_examples]`。

### 观察链的内部过程（调试）

- `qa.run(...)` 只能看到最终答案，看不到实际传给 LLM 的 Prompt 是什么。
- `from langchain_core.globals import set_debug` 后执行 `set_debug(True)`，会完整打印链每一步的输入输出（含拼接后的 Prompt、检索到的文档内容），学习原理和排查问题都靠它；看完记得 `set_debug(False)` 关掉。

### 批量预测与 LLM 评分

- `predictions = qa.apply(examples)`：批量执行，每个 example 的 dict 必须含 `query` 键（RetrievalQA 的输入键名）；返回列表的每项含 `query`、`answer`、`result`（模型实际回答）。
- `eval_chain = QAEvalChain.from_llm(llm)`：用 LLM 当阅卷员的评估链。
- `graded_outputs = eval_chain.evaluate(examples, predictions)`：逐条对比标准答案与预测答案，输出形如 `CORRECT/INCORRECT: 理由` 的评分文本。
- 新版评分结果的键是 `results`（旧教程是 `text`），取值写 `graded_outputs[i]['results']`。

### 注意事项（踩过的坑）

- 链的 `apply` / `run` 方法已弃用（2.0 将移除），新代码用 `invoke` / `batch`；`apply_and_parse` 同样弃用，新写法是把输出解析器直接传给链。
- `examples += ...` 是累加操作：重复运行会重复追加；修改代码后重跑之前，先重新执行定义 `examples` 的 cell 重置变量，否则残留的旧结构数据会导致 `Missing some input keys: {'query'}`。
- 手写字典里键名重复（写了两个 `"query"`）不会报错，后者静默覆盖前者，且很难从报错看出来。
- `ChatOllama` 的模型名必须与 `ollama list` 里的名字完全一致：全角冒号 `：`（中文输入法残留）会让 Ollama 返回 400 `invalid model name`；且这个错误在创建 `ChatOllama` 对象时不暴露，直到真正调用链才报错。
- 全角冒号问题要在**每一处**用到模型名的地方改（本章里生成链、评估链各建了一次 LLM，只改一处另一处还会报同样的错）。
- `QAGenerateChain` 要求模型严格输出 JSON，小模型偶尔会输出不合法 JSON 导致解析失败，生成测试用例这类"格式敏感"任务建议用能力更强的模型。

## 附录：新版 API 与旧教程差异速查

跟着旧课程视频学 1.x 新版时高频踩坑的地方，按章节汇总：

| 旧教程写法 / 认知 | 现版本（1.x）实际行为 |
| --- | --- |
| `chat(messages)`、`chain.run(...)` 直接调用 | 已弃用（2.0 移除），统一改用 `invoke()`，批量用 `batch()` |
| `Chain.apply(input_list)` 批量执行 | 已弃用，改用 `chain.batch()` |
| `apply_and_parse` 解析链输出 | 已弃用，把输出解析器直接传给链 |
| `QAGenerateChain` 返回 `{'query':..., 'answer':...}` | 多了一层包装 `{'qa_pairs': {...}}`，拼接前要拆包 |
| `QAEvalChain` 评分在 `graded_outputs[i]['text']` | 输出键改为 `results` |
| Memory 类、旧式链在 `langchain` 主包 | 移到 `langchain_classic`（弃用中），新项目用 `create_agent` + checkpointer |
| `langchain_community.llms.OpenAI` 文本补全 | 旧补全接口，DeepSeek 不支持，本环境不可用 |
| `index.query(query)` 用默认模型 | 必须显式传 `llm=index.query(query, llm=llm)` |
| 本地模型难以接入 | `ChatOllama` / `OllamaEmbeddings` 即插即用；注意模型名精确匹配、qwen3 关 `reasoning` |
