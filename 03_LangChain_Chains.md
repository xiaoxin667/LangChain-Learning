# 03 链（Chains）

对应文件：`03_LangChain_Chains.ipynb`

本文件讲解链的概念：链把大语言模型（LLM）和提示词（Prompt）等组件组合成可复用的调用单元，从而把复杂任务拆成多个步骤串联起来。演示了三种链：LLMChain、顺序链、路由链。

## LLMChain（最基础的一条链）

- `LLMChain(llm=..., prompt=...)`：把模型和提示词模板绑在一起，一条链只做一件事。
- 用 `chain.run(product)` 发起调用，把参数填进模板的占位符再交给模型。
- 提示词模板示例：`"What is the best name to describe a company that makes {product}?"`。

## SimpleSequentialChain（简单顺序链）

- 适合"单输入 → 单输出"的串联：前一条链的输出作为后一条链的输入。
- 示例：链一根据产品起公司名，链二根据公司名写一句话介绍。
- 优点：写法简单；局限：只能处理一个输入和一个输出，中间结果拿不到。

## SequentialChain（多输入多输出顺序链）

- 适合多个步骤、每步有多个输入输出的场景，中间结果也能保留。
- 每条子链通过 `output_key` 给输出命名（如 `Chinese_Review`、`summary`），后续子链可以直接引用这些名字作为输入。
- 装配时声明 `input_variables` 和 `output_variables`，调用时传入原始输入，返回字典包含所有输出。
- 示例：评论翻译成中文 → 中文评论生成一句话摘要 → 判断原文语言 → 用指定语言写回复，四步串联。

## 路由链（MultiPromptChain）

- 场景：有多条子链，每条擅长一类输入，路由链先判断"这条输入该交给谁"，再把输入转发过去。
- 结构三件套：
  - `destination_chains`：字典，键是子链名（如 `physics`），值是对应的 LLMChain。
  - `default_chain`：兜底链，问题不属于任何子链时使用（模板只有 `{input}`，相当于通用问答）。
  - `router_chain`：调度员，由 `LLMRouterChain.from_llm(llm, router_prompt)` 创建，只负责选链、不负责回答。
- `RouterOutputParser` 把模型返回的 ```json``` 代码块解析成字典（`destination` 选中的链名 + `next_inputs` 可能的改写后输入）。
- 路由模板 `MULTI_PROMPT_ROUTER_TEMPLATE` 的要点：`<< FORMATTING >>` 规定模型必须按 JSON 格式输出；`<< CANDIDATE PROMPTS >>` 列出候选链清单（由"名字:描述"拼成）；模板里的 `{{` 是转义，`format` 后会还原成 `{`。
- 运行流程：`chain.run(问题)` → 路由链判断归属 → 命中则走对应子链 → 未命中走 default_chain。

## 注意事项

- 路由链要求模型稳定输出 JSON，所以路由用的 LLM 必须设 `temperature=0`（生成子链的 LLM 可以用较高温度，如 0.9）。
- `chain.run(...)` 已标记弃用，新代码建议用 `chain.invoke(...)`。
