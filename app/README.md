# 综测问答助手

基于 LangChain RAG 的本地问答助手：把综测相关的细则、加分办法、通知等文档整理成知识库，用自然语言提问，助手基于这些文档内容回答。

## 功能

- 加载加密综测规则 PDF（密码通过 `PDF_DATA_KEY` 环境变量提供），向量化后建内存索引
- 自然语言提问，基于文档内容回答，回答内容来自检索到的文档片段（可溯源）
- Embedding 用阿里云百炼 DashScope 的轻量 Qwen 模型（与 04 章配置一致），不需要本地跑 8B 大模型
- 生成模型走 DeepSeek API（`deepseek-v4-flash`）
- 三种使用方式：命令行交互（`query_zongce.py`）、网页界面（Gradio）、Python 调用（`query_zongce()`）
- 自定义前端页面（`app/web/`，纯静态无依赖），接口已预留待接后端
- 规划中：多轮对话记忆（结合 02 章的会话记忆）

## 技术架构

```
综测规则 PDF（app/file/data.pdf，PyPDFLoader 按页加载）
  │
  ▼
文本切块 → DashScope Qwen Embedding 向量化 → 存入 DocArrayInMemorySearch（建索引）
  ▼
学生提问
  ▼
问题向量化 → 相似度检索，取最相关的几条文档片段
  ▼
文档片段 + 问题 + 提示词模板 → DeepSeek 生成答案 → 界面展示（附引用片段溯源）
```

整条链路就是 04 章学过的 RAG：**检索（Retrieval）+ 增强（Augmented）+ 生成（Generation）**，Embedding 负责"找资料"，LLM 负责"写答案"。

## 技术选型

- **生成模型**：DeepSeek（`ChatOpenAI` + `base_url="https://api.deepseek.com/"`，`deepseek-v4-flash`，`temperature=0` 保证引用条款稳定）
- **Embedding 模型**：阿里云百炼 Qwen（`OpenAIEmbeddings` + DashScope 兼容接口，`qwen3.7-text-embedding`），配置与 04 notebook 完全一致
- **向量库**：`DocArrayInMemorySearch`（内存存储，学习阶段够用；数据量大或需持久化时可换 Chroma / FAISS）
- **界面**：Gradio（轻量，几行代码出网页界面）
- **文档加载**：`PyPDFLoader`，支持加密 PDF

## 目录结构

```
app/
├── README.md                  # 本文档
├── answer_question.py         # 核心模块：embedding、建索引、检索、问答入口 query_zongce()
├── load_llm.py                # DeepSeek LLM 加载（含 02 章的会话记忆封装）
├── io.py                      # 文档加载：加密综测 PDF
├── environ.py                 # 环境变量（支持根目录 .env 文件）
├── app.py                     # Gradio 网页界面
├── build_index.py             # 建索引 + 检索质量自检脚本
├── requirements.txt           # 依赖清单
├── query_prompt_template.md   # 提示词模板（{context}/{question} 占位符）
├── web/                       # 自定义前端页面（纯静态，无外部依赖）
│   ├── index.html             # 页面结构
│   ├── style.css              # 样式
│   ├── markdown.js            # 轻量 Markdown 渲染器
│   ├── api.js                 # ★ 接口层：预留接口 + 演示 mock，后端就绪后只改这里
│   └── app.js                 # 界面交互逻辑
└── file/
    └── data.pdf               # 综测规则文档（不入库）
```

## 快速开始

1. 安装依赖

```bash
pip install -r app/requirements.txt
```

2. 配置密钥：设置环境变量，或在项目根目录创建 `.env` 文件（已被 `.gitignore` 排除，不会提交）

```
DEEPSEEK_API_KEY=你的DeepSeek密钥
QWEN_API_KEY=你的阿里云百炼密钥
PDF_DATA_KEY=综测PDF的打开密码
```

3. 运行（项目根目录下执行）

```bash
python -m app.build_index   # 可选：先自检索引构建和检索质量
python -m app.app           # 启动 Gradio 网页界面，浏览器打开 http://127.0.0.1:7860
python query_zongce.py      # 或者用命令行交互界面
```

Python 中直接调用：

```python
from app.answer_question import query_zongce

result = query_zongce("参加竞赛获奖如何加分？")  # 返回 Markdown 字符串
```

前端页面（`app/web/`）：纯静态页面，无需构建、无外部依赖，直接双击 `index.html` 或本地起服务浏览：

```bash
cd app/web && python -m http.server 8080   # 浏览器打开 http://127.0.0.1:8080
```

当前为**演示模式**（顶栏有徽标提示），回答为 mock 数据。后端 HTTP 接口实现后，在 `app/web/api.js` 中把 `USE_MOCK` 改为 `false` 并填写 `BASE_URL`、`QUERY_ENDPOINT` 即可接入，其余前端代码不用动。接口约定写在 `api.js` 顶部注释里：

```
POST {BASE_URL}{QUERY_ENDPOINT}
请求体:  { "question": "用户问题" }
响应体:  { "answer": "Markdown 字符串", "sources": [ { "page": 5, "text": "引用片段" } ] }
```

## 关键实现要点（04 章踩过的坑，代码里已规避）

- 文本类 Loader 必须指定 `encoding="utf-8"`，中文 Windows 默认 gbk 会报 `UnicodeDecodeError`
- Embedding 用 DashScope 时两个参数必须设置：`check_embedding_ctx_length=False`（否则发送 token 数组被拒）、`chunk_size=20`（DashScope 单次请求最多 20 条）
- `VectorstoreIndexCreator` 必须显式传入 `embedding=`
- 旧的 `chain.run()`、`llm.call_as_llm()` 写法已弃用，统一用 `invoke()`
- 索引在进程内缓存（`get_index()`），避免每问一个问题都重新向量化整份 PDF；首次提问慢属正常
- `RetrievalQA` 等类来自 `langchain_classic`（官方已标记弃用，学习用没问题）

## 隐私说明

默认链路中，你的问题和检索到的文档片段会发送到 DeepSeek 与阿里云服务器。若综测文档包含个人信息且要求数据不出本机，可切换为全本地方案：本地 Ollama 生成 + `OllamaEmbeddings` 本地嵌入，速度会慢一些但数据完全不出机器。

## 实现路线

1. ~~建索引：PDF 加载 → 切块 → embedding → 向量库~~（已完成，`answer_question.py`）
2. ~~手动验证 `similarity_search` 检索准确性~~（已完成，`build_index.py` 自检脚本）
3. ~~Gradio 界面：输入框 + 输出框 + 溯源片段展示~~（已完成，`app.py`）
4. 自定义前端页面：`app/web/` 静态页面 + 预留接口（已完成，待接后端）
5. 后端 HTTP 接口：按 `app/web/api.js` 顶部的约定实现（FastAPI / Flask 均可，复用 `query_zongce_with_sources()`）
6. 多轮对话：接入 02 章的记忆，让助手记得对话上下文（可选，`load_llm.py` 已备好 `get_conversation()`）
