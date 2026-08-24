# LangChain 框架学习笔记

基于 LangChain（1.x 新版包结构）+ DeepSeek API 的学习实践仓库，共四个 Jupyter notebook，从"如何调用模型"一步步走到"基于文档的问答（RAG）"。每个 notebook 的知识点单独成文，README 只做整体概览。

> 🔗 **GitHub 仓库**：https://github.com/lonely-square-three/LangChain-Learning （本仓库与 Gitee 双端同步更新）

## 环境

- Python 3.12.x
- 依赖包：`langchain-openai`、`langchain-classic`、`langchain-core`、`openai`、`jupyter`
- 生成模型：DeepSeek（`deepseek-v4-flash`）。DeepSeek 的 API 兼容 OpenAI 协议，直接用 `ChatOpenAI` 指定 `base_url="https://api.deepseek.com"` 即可，无需专用类
- Embedding 模型：阿里云百炼（DashScope）Qwen 接口，仅第 04 章使用（DeepSeek 没有 embedding 接口）
- 密钥从环境变量读取（`DEEPSEEK_API_KEY` 等），不在代码中硬编码

## 笔记导航

- [01 提示词工程：原生 SDK 对比 LangChain](01_LangChain_diff.md)（对应 `01_LangChain_diff.ipynb`）
- [02 会话记忆管理](02_LangChain_Memory.md)（对应 `02_LangChain_Memory.ipynb`）
- [03 链（Chains）](03_LangChain_Chains.md)（对应 `03_LangChain_Chains.ipynb`）
- [04 基于文档问答（RAG）](04_LangChain_Response.md)（对应 `04_LangChain_Response.ipynb`）

## 实战项目

- [综测问答助手](app/README.md)（`app/`）：把 04 章的 RAG 落地成可用的本地问答助手，支持 PDF / Word / txt 等多种文档格式，带网页界面

## 知识概览

这条学习路径的本质，是从"单次调用模型"逐步走向"围绕模型搭一套应用框架"。

**第 01 章解决"怎么调模型"**。先看原生 OpenAI SDK 的手动拼消息流程，再对比 LangChain 的封装：`ChatOpenAI` 创建模型、`ChatPromptTemplate` 管理提示词、`invoke()` 统一调用。这章还引入了结构化输出——模型返回的"JSON"其实是字符串，需要用 `StructuredOutputParser` 声明字段、注入格式说明书、再解析成字典，即"谁发说明书谁来阅卷"。

**第 02 章解决"模型记不住"**。大模型是无状态的，记忆组件把历史对话存起来、注入每次请求的提示词。四种记忆的取舍本质是同一个问题：记忆会无限增长，怎么控制？滑动窗口丢最早的、token 裁剪按量丢弃、摘要缓冲把旧对话压缩成摘要——分别对应"遗忘、限额、压缩"三种思路。

**第 03 章解决"多步骤任务"**。链把模型和提示词组合成可复用单元：`LLMChain` 是单步，`SimpleSequentialChain` 是单进单出的串联，`SequentialChain` 是多输入多输出且保留中间结果，`MultiPromptChain` 则让模型当调度员，把问题路由给最擅长它的子链。

**第 04 章解决"文档太大塞不进上下文"**。引入 RAG：文档切块 → embedding 向量化 → 存进向量库；查询时问题同样向量化，按相似度取最相关的几块，连同问题一起交给 LLM 生成答案。全链路既可一键（`VectorstoreIndexCreator`）也可拆开手动执行，`RetrievalQA` 链支持 stuff、map_reduce、refine、map_rerank 四种组合策略。

贯穿四章的一条主线是**分工**：生成模型负责"写答案"，embedding 模型负责"理解与检索"，链负责"编排"，记忆负责"上下文"。学习时建议顺着 01 → 04 的顺序跑通代码，再回头看各章笔记复习原理。

## 学习进度

- [x] 原生 OpenAI SDK 调用与 LangChain 封装对比，`invoke()` 统一调用接口
- [x] 提示词模板 `ChatPromptTemplate`：占位符填充，本质是本地字符串替换
- [x] 结构化输出：`get_format_instructions()` 注入格式说明，`parse()` 解析成字典
- [x] 会话记忆：完整历史 / 滑动窗口 / token 裁剪 / 超限自动摘要
- [x] 链：LLMChain、SimpleSequentialChain、SequentialChain、MultiPromptChain 路由链
- [x] 文档问答（RAG）：embedding + 向量存储 + `RetrievalQA`，四种 chain_type 策略

> 注：`ConversationChain`、Memory 系列、`RetrievalQA` 等类来自 `langchain_classic`（旧版 API，官方已标记弃用，2.0 将移除），此处用于理解机制原理；新项目应使用 `create_agent` + checkpointer 等新式 API。
