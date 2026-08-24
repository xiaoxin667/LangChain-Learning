# 综测问答助手

基于 LangChain RAG 的本地问答助手：把综测相关的细则、加分办法、通知等文档整理成知识库，用自然语言提问，助手基于这些文档内容回答。

## 功能

- 支持多种格式的综测文档作为知识库（PDF、Word、txt、csv 等，通过换 Loader 实现）
- 自然语言提问，基于文档内容回答，回答内容来自检索到的文档片段（可溯源）
- 生成模型默认走 DeepSeek API，可切换到本地 Ollama（数据不出本机）
- 网页界面（Gradio），本地启动后在浏览器中使用
- 规划中：多轮对话记忆（结合 02 章的会话记忆）

## 技术架构

```
综测文档（app/data/ 下的 PDF / Word / txt）
  │  DirectoryLoader 批量加载
  ▼
文本切块 → Embedding 向量化 → 存入向量库（建索引）
  ▼
学生提问
  ▼
问题向量化 → 相似度检索，取最相关的几条文档片段
  ▼
文档片段 + 问题 → LLM 生成答案 → 界面展示
```

整条链路就是 04 章学过的 RAG：**检索（Retrieval）+ 增强（Augmented）+ 生成（Generation）**，Embedding 负责"找资料"，LLM 负责"写答案"。

## 技术选型

- **生成模型**：DeepSeek（`ChatOpenAI` + `base_url="https://api.deepseek.com"`），默认方案，快且中文质量好；隐私敏感场景可切换为本地 Ollama 的 `qwen3:8b`（4GB 量化版，8GB 显存可全量加载，速度尚可）
- **Embedding 模型**：阿里云百炼 Qwen（DashScope 兼容接口），配置与 04 notebook 一致
- **向量库**：`DocArrayInMemorySearch`（内存存储，学习阶段够用；数据量大或需持久化时可换 Chroma / FAISS）
- **界面**：Gradio（轻量，几行代码出网页界面）
- **文档加载**：`DirectoryLoader` 一次加载整个文件夹，按扩展名自动选择对应的子 Loader

## 目录结构（规划）

```
app/
├── README.md          # 项目文档
├── app.py             # 主程序：Gradio 界面 + 问答逻辑（待实现）
├── build_index.py     # 加载文档、构建向量索引（待实现）
├── requirements.txt   # 依赖清单（待实现）
└── data/              # 综测文档放这里，格式不限（待创建）
```

## 快速开始

1. 安装依赖

```bash
pip install langchain-openai langchain-classic langchain-core openai gradio docarray pypdf docx2txt python-dotenv
```

2. 配置环境变量（创建 `.env` 文件，参考根目录的 `.gitignore` 确认它不会被提交）

```
DEEPSEEK_API_KEY=你的DeepSeek密钥
QWEN_API_KEY=你的阿里云百炼密钥
```

3. 把综测文档放进 `app/data/`（PDF、Word、txt 均可）

4. 运行主程序，浏览器打开界面提问

## 关键实现要点（04 章踩过的坑，实现时直接规避）

- 文本类 Loader 必须指定 `encoding="utf-8"`，中文 Windows 默认 gbk 会报 `UnicodeDecodeError`
- Embedding 用 DashScope 时两个参数必须设置：`check_embedding_ctx_length=False`（否则发送 token 数组被拒）、`chunk_size=20`（DashScope 单次请求最多 20 条）
- `VectorstoreIndexCreator` 必须显式传入 `embedding=`
- 旧的 `chain.run()`、`llm.call_as_llm()` 写法已弃用，统一用 `invoke()`
- `RetrievalQA` 等类来自 `langchain_classic`（官方已标记弃用，学习用没问题）

## 隐私说明

默认链路中，你的问题和检索到的文档片段会发送到 DeepSeek 与阿里云服务器。若综测文档包含个人信息且要求数据不出本机，请切换到全本地方案：本地 Ollama 生成（`qwen3:8b`）+ 本地 Embedding（`OllamaEmbeddings`），速度会慢一些但数据完全不出机器。

## 实现路线

1. **建索引**：`DirectoryLoader` 加载 `app/data/` → 切块 → embedding → 存向量库，复用 04 章的 `VectorstoreIndexCreator`
2. **问答**：先手动验证 `similarity_search` 检索是否准确（问几个真实问题，调整切块大小）
3. **界面**：Gradio 包一层输入框 + 输出框，把问答逻辑接进去
4. **多轮对话**：接入 02 章的记忆，让助手记得对话上下文（可选）
