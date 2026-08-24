# 01 提示词工程：原生 SDK 对比 LangChain

对应文件：`01_LangChain_diff.ipynb`

本文件演示了两种调用大模型的方式：直接用 OpenAI SDK（原生）和使用 LangChain 封装，并在此基础上引入提示词模板与结构化输出解析器，是整门课的地基。

## 原生 OpenAI SDK 的调用方式

- `openai` 包 1.0.0 之后，所有请求都必须挂在 `client` 对象上，写法为 `client.chat.completions.create(...)`。
- 创建客户端时指定 `api_key` 和 `base_url`（DeepSeek 兼容 OpenAI 协议，`base_url` 填 `https://api.deepseek.com`）。
- 一次调用的完整链路：组装 `messages` 列表（角色 + 内容）→ `create` 发起请求 → 从返回结果的 `choices[0].message.content` 取出回答文本。
- 示例中把这一套封装成了 `get_completion(prompt, model)` 函数，方便复用。

## LangChain 的封装方式

- 从 `langchain_openai` 导入 `ChatOpenAI`，同样传入 `api_key`、`base_url`、`model`，额外加 `temperature=0.0` 降低输出随机性。
- 调用统一走 `chat.invoke(messages)`，返回 `AIMessage` 对象，用 `.content` 取文本；旧的 `chat(messages)` 写法已废弃。

## 提示词模板（Prompt Template）

- 模板本质是含 `{占位符}` 的字符串，用 `ChatPromptTemplate.from_template()` 转换为模板对象。
- 用 `format_messages(style=..., text=...)` 填入实际值，得到消息列表；这个过程只是本地字符串替换，不产生网络请求。
- 相比 f-string 拼接，模板更适合长且复杂的提示词、方便复用；LangChain 还为摘要、连数据库等常见任务内置了现成模板。

## 结构化输出（Structured Output）

- 模型返回的"JSON"本质上只是一个字符串（`type(response.content)` 结果是 `str`），必须经过解析才能按 key 取值。
- 用 `ResponseSchema(name, description)` 逐个声明要提取的字段，组成 schema 列表。
- `StructuredOutputParser.from_response_schemas(schema)` 创建解析器，同一个解析器承担两个职责：`get_format_instructions()` 生成 JSON 格式说明书注入提示词，`parse()` 把模型回复解析成 Python 字典——"谁发说明书谁来阅卷"。
- 提示词模板里预留 `{format_instructions}` 占位符，把格式说明书拼进用户消息里，模型才能按指定格式输出。

## 调用大模型的四步流程（本文件的核心总结）

1. 创建模型对象：`ChatOpenAI(model=..., api_key=..., base_url=..., temperature=...)`
2. 创建模板对象：`ChatPromptTemplate.from_template(含 {变量} 的模板字符串)`
3. 填充变量生成消息列表：`prompt_template.format_messages(变量=实际值)`
4. 调用模型：`chat.invoke(消息列表).content`

## 注意事项

- 新版包结构：模型在 `langchain_openai`，模板在 `langchain_core.prompts`，而 `ResponseSchema`、`StructuredOutputParser` 等旧版类位于 `langchain_classic`（官方已标记弃用）。
- 用 `prompt_template.messages[0].prompt.input_variables` 可以查看模板里声明的变量名列表。
- 分隔符（如三反引号）能有效帮助模型区分"指令"和"待处理文本"。
