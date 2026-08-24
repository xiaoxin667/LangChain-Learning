# 02 会话记忆管理

对应文件：`02_LangChain_Memory.ipynb`

本文件讲解会话记忆的核心思想与四种记忆实现。关键前提：**大模型本身是无状态的**，每次 API 请求相互独立，它并不"记得"之前说过什么；记忆组件的作用是把历史对话保存下来，再注入到每次请求的提示词里，让模型表现出"记得"。

## 核心组件

- `ConversationChain(llm=..., memory=..., verbose=True)`：把模型、提示词、记忆串成一条对话链，自动完成"读取记忆 → 拼提示词 → 调用模型 → 更新记忆"的完整流程，用 `predict(input=...)` 发起对话。
- `verbose=True` 可以看到链内部拼接了哪些内容，适合学习阶段观察记忆是如何注入的。
- `save_context({"input": ...}, {"output": ...})` 手动写入一轮对话；`load_memory_variables({})` 读取当前记忆。

## 四种记忆实现

### ConversationBufferMemory（完整历史）

- 无差别保存全部对话历史，`memory.buffer` 可以看到完整内容。
- 缺点：对话越长，注入提示词的历史越多，最终会超出模型上下文上限。

### ConversationBufferWindowMemory（滑动窗口）

- `k=1` 表示只保留最近 1 轮对话，超过的旧对话直接丢弃。
- 防止记忆量随对话无限增长，代价是会遗忘更早的上下文。

### ConversationTokenBufferMemory（按 token 裁剪）

- `max_token_limit` 限定记忆的 token 总数，超出时从最早的内容开始丢弃。
- 它的 `llm` 参数**仅用于统计 token 数量**，不是用来对话的，所以复用前面创建的 `ChatOpenAI` 实例即可。
- 需要配置计数方式：`ChatOpenAI(tiktoken_model_name="gpt-4o-mini")`。

### ConversationSummaryBufferMemory（超限自动摘要）

- 同样有 `max_token_limit` 上限，但超出时不是直接丢弃，而是调用 LLM 把旧对话压缩成一段摘要，保留要点。
- 兼顾"记得全"与"装得下"：近期的保留原文，更早的保留摘要。

## 注意事项

- 本文件的 Memory 类都来自 `langchain_classic`（旧版 API，官方已标记弃用，2.0 将移除），此处用于理解记忆机制原理；新项目应改用 `create_agent` + checkpointer。
- 旧教程里 `from langchain_community.llms import OpenAI` 的写法在本环境已不可用：它调用的是旧版文本补全接口，DeepSeek 并不支持，会报 `ModuleNotFoundError`。
