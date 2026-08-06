# 项目介绍
本项目在学习Python基础语法、本地模型部署、云端大模型调用、网络爬虫和数据分析的基础上，对LangChain+LangGraph进行学习，学习主要分为：Agent入门、Agent进阶、RAG Agent和LangGraph四个部分

## 📋 目录
- [前置知识自评](#前置知识自评)
- [阶段 0：前置知识补齐（1-2 周）](#阶段-0前置知识补齐1-2-周)
- [阶段 1：LangChain 核心（1-2 周）](#阶段-1langchain-核心1-2-周)
- [阶段 2：LangGraph 进阶（2-3 周）](#阶段-2langgraph-进阶2-3-周)
- [阶段 3：实战项目（2-3 周）](#阶段-3实战项目2-3-周)
- [阶段 4：进阶与部署（持续）](#阶段-4进阶与部署持续)
- [推荐工具链](#推荐工具链)
- [学习社区与资讯](#学习社区与资讯)

---

## 前置知识自评

在开始前，请确认以下知识是否已掌握。如未掌握，请先完成 **阶段 0**。

| 知识领域 | 掌握标准 | 优先级 |
|:---:|:---|:---:|
| Prompt Engineering | 能写出有效的 System Prompt，理解 Few-shot、CoT、ReAct 模式 | 🔴 P0 |
| 向量数据库与 Embedding | 理解 Embedding 原理，能用 ChromaDB/FAISS 做相似度检索 | 🔴 P0 |
| 异步编程 (async/await) | 理解 `asyncio.gather`，能写并发调用代码 | 🟡 P1 |
| 状态机与图论基础 | 理解"节点-边-状态"模型，能设计简单状态转移 | 🟡 P1 |
| Pydantic 数据验证 | 能用 Pydantic 定义数据模型和输出 Schema | 🟡 P1 |

---

## 阶段 0：前置知识补齐（1-2 周）

> ⚠️ **此阶段不可跳过**。Agent 的本质是"用 Prompt 驱动 LLM 做决策"，不会 Prompt Engineering 和 Tool Calling，框架只是空壳。

### 0.1 Prompt Engineering 与结构化输出

**学习目标**：
- 掌握 System Prompt 设计原则
- 理解 Few-shot Prompting、Chain-of-Thought (CoT)、ReAct 模式
- 能用 Pydantic 约束 LLM 输出为结构化数据（JSON）

**核心知识点**：
- 角色设定与上下文注入
- 少样本示例（Few-shot）
- 思维链（Chain-of-Thought）
- ReAct 模式（Reasoning + Acting）
- Function Calling / Tool Calling 格式
- 结构化输出（JSON Mode / Pydantic Schema）

**推荐资源**：

| 类型 | 资源名称 | 链接 | 说明 |
|:---:|:---|:---|:---|
| 📖 文档 | OpenAI Prompt Engineering Guide | https://platform.openai.com/docs/guides/prompt-engineering | 官方最佳实践 |
| 📖 文档 | Anthropic Prompt Engineering | https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering | Claude 官方指南 |
| 📖 文档 | Pydantic 官方文档 | https://docs.pydantic.dev/latest/ | 数据验证与序列化 |
| 🎥 视频 | Prompt Engineering for Developers (DeepLearning.AI) | https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/ | 吴恩达免费短课 |
| 🎥 视频 | ReAct 模式详解 | https://www.youtube.com/results?search_query=react+prompt+engineering+llm | YouTube 搜索 |
| 📦 代码 | LangChain Structured Output | https://python.langchain.com/docs/how_to/structured_output/ | 官方结构化输出教程 |

### 0.2 向量数据库与 Embedding

**学习目标**：
- 理解 Embedding 将文本转为向量的原理
- 掌握文本分块（Chunking）策略
- 能用 ChromaDB 或 FAISS 构建检索系统

**核心知识点**：
- Embedding 模型原理（`sentence-transformers`）
- 文本分块策略（固定长度、递归、语义分块）
- 向量数据库选型（ChromaDB、FAISS、Milvus、Qdrant）
- 相似度检索（Cosine Similarity、MMR）
- RAG 基础架构

**推荐资源**：

| 类型 | 资源名称 | 链接 | 说明 |
|:---:|:---|:---|:---|
| 📖 文档 | Hugging Face Embedding 指南 | https://huggingface.co/blog/getting-started-with-embeddings | Embedding 入门 |
| 📖 文档 | ChromaDB 官方文档 | https://docs.trychroma.com/ | 轻量级向量数据库 |
| 📖 文档 | LangChain RAG 教程 | https://python.langchain.com/docs/tutorials/rag/ | 官方 RAG 完整教程 |
| 📦 代码 | LangChain RAG Quickstart | https://github.com/langchain-ai/rag-from-scratch | 从零实现 RAG |
| 🎥 视频 | RAG 架构详解 | https://www.youtube.com/results?search_query=rag+retrieval+augmented+generation+explained | YouTube 搜索 |

### 0.3 异步编程 (async/await)

**学习目标**：
- 理解事件循环与协程
- 掌握 `asyncio.gather` 并发调用
- 能在 LangChain 中使用异步接口

**核心知识点**：
- `async` / `await` 语法
- `asyncio.run()` 与事件循环
- `asyncio.gather()` 并发执行
- LangChain `Runnable` 异步接口（`ainvoke`、`abatch`、`astream`）

**推荐资源**：

| 类型 | 资源名称 | 链接 | 说明 |
|:---:|:---|:---|:---|
| 📖 文档 | Python asyncio 官方文档 | https://docs.python.org/3/library/asyncio.html | 官方权威文档 |
| 📖 文档 | LangChain Async Guide | https://python.langchain.com/docs/concepts/#async-interface | LangChain 异步接口 |
| 🎥 视频 | Python Asyncio 完整教程 | https://www.youtube.com/results?search_query=python+asyncio+tutorial | YouTube 搜索 |

### 0.4 状态机与图论基础

**学习目标**：
- 理解"节点-边-状态"模型
- 能设计简单的状态转移图

**核心知识点**：
- 状态机（FSM）基本概念
- 有向图（Directed Graph）
- 状态转移条件
- LangGraph 核心概念映射：Node = 函数, Edge = 条件, State = 共享字典

**推荐资源**：

| 类型 | 资源名称 | 链接 | 说明 |
|:---:|:---|:---|:---|
| 📖 文章 | 有限状态机入门 | https://en.wikipedia.org/wiki/Finite-state_machine | Wikipedia 概念 |
| 📖 文档 | LangGraph 概念介绍 | https://langchain-ai.github.io/langgraph/concepts/ | 官方概念文档 |

---

## 阶段 1：LangChain 核心（1-2 周）

> 🎯 **目标**：掌握 LangChain 现代写法（LCEL），能构建简单的 LLM 应用链

### 1.1 LangChain 基础架构

**核心知识点**：
- **LCEL（LangChain Expression Language）**：用 `|` 符号链式组合组件
- **Components**：PromptTemplate、ChatModel、OutputParser、Tool
- **Chains**：Sequential Chain、Router Chain
- **Memory**：Buffer Memory、Buffer Window Memory、Summary Memory
- **Callbacks**：监听链执行过程

**推荐资源**：

| 类型 | 资源名称 | 链接 | 说明 |
|:---:|:---|:---|:---|
| 📖 文档 | LangChain 官方文档 | https://python.langchain.com/docs/introduction/ | 最权威的资料 |
| 📖 文档 | LCEL 入门 | https://python.langchain.com/docs/how_to/#langchain-expression-language-lcel | 现代 LangChain 核心 |
| 📖 文档 | LangChain 概念总览 | https://python.langchain.com/docs/concepts/ | 系统理解架构 |
| 📦 代码 | LangChain Cookbook | https://github.com/langchain-ai/langchain/blob/master/cookbook/README.md | 官方代码示例 |
| 🎥 视频 | LangChain Crash Course 2026 | https://www.youtube.com/results?search_query=langchain+crash+course+2026 | YouTube 搜索 |

### 1.2 Tool 与 Function Calling

**核心知识点**：
- Tool 的定义与装饰器（`@tool`）
- Function Calling 让 LLM 自主选择工具
- Tool 参数 Schema 定义（Pydantic）
- 错误处理与重试机制

**推荐资源**：

| 类型 | 资源名称 | 链接 | 说明 |
|:---:|:---|:---|:---|
| 📖 文档 | LangChain Tools 教程 | https://python.langchain.com/docs/how_to/tools/ | 官方 Tool 指南 |
| 📖 文档 | Function Calling 指南 | https://python.langchain.com/docs/concepts/tool_calling/ | Tool Calling 概念 |
| 📦 代码 | Tool Use Examples | https://github.com/langchain-ai/langchain/tree/master/docs/docs/how_to | 官方 How-to 示例 |

### 1.3 记忆管理（Memory）

**核心知识点**：
- 短期记忆 vs 长期记忆
- ConversationBufferMemory
- ConversationBufferWindowMemory
- VectorStore-backed Memory

**推荐资源**：

| 类型 | 资源名称 | 链接 | 说明 |
|:---:|:---|:---|:---|
| 📖 文档 | LangChain Memory 指南 | https://python.langchain.com/docs/how_to/memory/ | 官方 Memory 教程 |

---

## 阶段 2：LangGraph 进阶（2-3 周）

> 🎯 **目标**：掌握状态图设计，能构建复杂多步骤 Agent 工作流

### 2.1 LangGraph 核心概念

**核心知识点**：
- **StateGraph**：定义整个 Agent 的骨架
- **Node**：每个节点是一个 Python 函数（调用 LLM、工具、逻辑判断）
- **Edge**：控制流，普通边顺序执行，条件边让 LLM 决定下一步
- **State**：所有节点读写同一个状态对象（TypedDict / Pydantic BaseModel）
- **Checkpointing**：状态持久化，支持人机交互（Human-in-the-loop）

**关键认知**：
```
LangChain = 线性链（Chain）
LangGraph = 有环图（Graph）→ 支持循环、反思、多 Agent 协作
```

**推荐资源**：

| 类型 | 资源名称 | 链接 | 说明 |
|:---:|:---|:---|:---|
| 📖 文档 | LangGraph 官方文档 | https://langchain-ai.github.io/langgraph/ | 最权威 |
| 📖 文档 | LangGraph 概念 | https://langchain-ai.github.io/langgraph/concepts/ | 核心概念详解 |
| 📖 文档 | LangGraph 快速开始 | https://langchain-ai.github.io/langgraph/tutorials/introduction/ | 官方入门教程 |
| 📦 代码 | LangGraph Examples | https://github.com/langchain-ai/langgraph/tree/main/examples | 官方示例仓库 |
| 🎥 视频 | LangGraph Crash Course | https://www.youtube.com/results?search_query=langgraph+crash+course | YouTube 搜索 |

### 2.2 Agent 执行器（Agent Executor）

**核心知识点**：
- ReAct Agent 的图实现
- Tool Node 与 Tool Executor
- 决策节点（让 LLM 决定下一步）
- 循环控制与终止条件

**推荐资源**：

| 类型 | 资源名称 | 链接 | 说明 |
|:---:|:---|:---|:---|
| 📖 文档 | Agent Executor 教程 | https://langchain-ai.github.io/langgraph/tutorials/agent_executor/ | 官方 Agent 教程 |
| 📦 代码 | ReAct Agent 实现 | https://github.com/langchain-ai/langgraph/tree/main/examples/agent_executor | 官方代码 |

### 2.3 条件边与复杂工作流

**核心知识点**：
- `add_conditional_edges` 条件路由
- 并行节点（`Send` API）
- 子图（Subgraph）复用
- 循环与反思（Reflection Pattern）

**推荐资源**：

| 类型 | 资源名称 | 链接 | 说明 |
|:---:|:---|:---|:---|
| 📖 文档 | Conditional Edges | https://langchain-ai.github.io/langgraph/how-tos/branching/ | 分支与条件 |
| 📖 文档 | Subgraphs | https://langchain-ai.github.io/langgraph/how-tos/subgraph/ | 子图复用 |
| 📦 代码 | Reflection Pattern | https://github.com/langchain-ai/langgraph/tree/main/examples/reflection | 反思模式示例 |

### 2.4 持久化与人机交互

**核心知识点**：
- Checkpointer（内存 / SQLite / Postgres）
- `interrupt` 实现 Human-in-the-loop
- 时间旅行调试（Time Travel）
- 状态回滚与重放

**推荐资源**：

| 类型 | 资源名称 | 链接 | 说明 |
|:---:|:---|:---|:---|
| 📖 文档 | Persistence | https://langchain-ai.github.io/langgraph/concepts/persistence/ | 持久化概念 |
| 📖 文档 | Human-in-the-loop | https://langchain-ai.github.io/langgraph/concepts/human_in_the_loop/ | 人机交互 |
| 📦 代码 | HITL Examples | https://github.com/langchain-ai/langgraph/tree/main/examples/human-in-the-loop | 官方示例 |

---

## 阶段 3：实战项目（2-3 周）

> 🎯 **目标**：通过完整项目串联所有知识，产出可展示的 Portfolio

### 项目 1：RAG 问答 Agent

**需求**：爬取某技术文档网站 → 清洗数据 → Embedding 入库 → 构建带检索的问答 Agent

**技术栈**：
- 爬虫（Scrapy / BeautifulSoup）
- 数据清洗（Pandas）
- Embedding（`sentence-transformers` / OpenAI Embedding）
- 向量数据库（ChromaDB / FAISS）
- LangChain RAG Chain
- LangGraph 构建带检索决策的 Agent

**检验标准**：
- [ ] 能回答知识库内的问题
- [ ] 能识别知识库外的问题并拒绝或搜索网络
- [ ] 支持多轮对话保持上下文

### 项目 2：多工具自主 Agent

**需求**：构建一个能自主选择工具的 Agent，工具包括：网页搜索、本地数据库查询、代码执行、文件读写

**技术栈**：
- LangGraph StateGraph
- 多个 Tool Node
- 条件边路由
- ReAct 决策模式

**检验标准**：
- [ ] LLM 能根据用户问题自主选择正确工具
- [ ] 工具调用失败时有重试和错误处理
- [ ] 支持复杂多步骤任务（如：搜索→分析→写入文件）

### 项目 3：Multi-Agent 协作系统

**需求**：构建"研究员 → 写手 → 审稿员"多 Agent 协作工作流

**技术栈**：
- LangGraph Multi-Agent 架构
- Supervisor 模式或 Agent 间直接通信
- 状态共享与消息传递
- 循环迭代直到审稿通过

**检验标准**：
- [ ] 各 Agent 角色职责清晰
- [ ] 支持迭代改进（审稿不通过返回修改）
- [ ] 最终输出质量高于单 Agent

**参考资源**：

| 类型 | 资源名称 | 链接 | 说明 |
|:---:|:---|:---|:---|
| 📦 代码 | Multi-Agent Collab | https://github.com/langchain-ai/langgraph/tree/main/examples/multi_agent | 官方多 Agent 示例 |
| 📦 代码 | LangGraph Studio | https://github.com/langchain-ai/langgraph-studio | 可视化调试工具 |
| 📖 文档 | Multi-Agent Patterns | https://langchain-ai.github.io/langgraph/concepts/multi_agent/ | 多 Agent 设计模式 |

---

## 阶段 4：进阶与部署（持续）

> 🎯 **目标**：掌握生产级 Agent 的优化与部署

### 4.1 性能优化

**核心知识点**：
- 流式输出（Streaming）
- 批处理（Batching）
- 缓存策略（LLM 结果缓存、Embedding 缓存）
- Token 用量优化

**推荐资源**：

| 类型 | 资源名称 | 链接 |
|:---:|:---|:---|
| 📖 文档 | LangChain Streaming | https://python.langchain.com/docs/how_to/streaming/ |
| 📖 文档 | LangChain Caching | https://python.langchain.com/docs/how_to/caching/ |

### 4.2 评估与测试

**核心知识点**：
- Agent 轨迹评估（Trajectory Evaluation）
- LLM-as-a-Judge
- 回归测试与基准数据集

**推荐资源**：

| 类型 | 资源名称 | 链接 |
|:---:|:---|:---|
| 📖 文档 | LangSmith Evaluation | https://docs.smith.langchain.com/evaluation |
| 📖 文档 | LangGraph Evaluation | https://langchain-ai.github.io/langgraph/concepts/evaluation/ |

### 4.3 部署与监控

**核心知识点**：
- FastAPI / Streamlit 构建 Web 界面
- Docker 容器化部署
- LangSmith 监控与调试
- 日志与追踪

**推荐资源**：

| 类型 | 资源名称 | 链接 |
|:---:|:---|:---|
| 📖 文档 | LangSmith 官方文档 | https://docs.smith.langchain.com/ |
| 📖 文档 | LangServe 部署 | https://python.langchain.com/docs/langserve/ |
| 📦 代码 | Streamlit + LangChain | https://github.com/langchain-ai/streamlit-agent |

---

## 推荐工具链

| 类别 | 工具 | 用途 |
|:---:|:---|:---|
| LLM 本地部署 | Ollama | 本地运行开源模型 |
| LLM API | OpenAI / Anthropic / 硅基流动 | 云端模型调用 |
| 开发框架 | LangChain + LangGraph | Agent 开发核心框架 |
| 向量数据库 | ChromaDB / FAISS / Qdrant | 向量存储与检索 |
| Embedding | `sentence-transformers` / OpenAI | 文本向量化 |
| 数据验证 | Pydantic | 结构化输出定义 |
| Web 框架 | FastAPI / Streamlit | API 与界面开发 |
| 监控调试 | LangSmith / LangGraph Studio | 追踪与可视化 |
| 容器化 | Docker | 部署与分发 |

---

## 学习社区与资讯

| 平台 | 链接 | 说明 |
|:---:|:---|:---|
| LangChain 官方 Discord | https://discord.gg/langchain | 最活跃的开发者社区 |
| LangChain 官方博客 | https://blog.langchain.dev/ | 最新特性与案例 |
| GitHub Discussions | https://github.com/langchain-ai/langchain/discussions | 技术讨论 |
| Reddit r/LangChain | https://www.reddit.com/r/LangChain/ | 社区分享 |
| Twitter/X @LangChainAI | https://x.com/LangChainAI | 官方动态 |

---

## 📅 建议学习节奏

```
第 1-2 周：阶段 0（前置知识补齐）
第 3-4 周：阶段 1（LangChain 核心）
第 5-7 周：阶段 2（LangGraph 进阶）
第 8-10 周：阶段 3（实战项目）
第 11 周+：阶段 4（进阶与部署，持续迭代）
```

---

> 💡 **学习建议**：不要试图看完所有文档再动手。每学完一个知识点，立即写代码实践。LangChain/LangGraph 的 API 迭代很快，官方文档永远是最准确的参考。

> 📝 **更新记录**：本文档建议每季度回顾一次，更新过时链接和新增资源。