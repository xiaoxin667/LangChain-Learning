# 02 LangChain 的功能、工具和代理

对应 B 站课程合集第二门课（P9–P16）。

主要内容：

- OpenAI 函数调用（Function Calling）：模型原生的结构化工具调用能力
- LangChain 表达语言（LCEL）：`prompt | model | parser` 管道式现代写法
- 标记与提取（Tagging & Extraction）：用函数调用做结构化信息抽取
- 工具、路由与对话代理

学习时新建的 notebook 和笔记直接放入本文件夹。

---

## ⚠️ 常见坑：旧版 functions API 与新版 tools API 混用（已踩多次）

本课程原版代码基于**旧版 OpenAI 函数调用 API（`functions`）**编写，而我们现在用的是 **DeepSeek + 新版 tools API**。两套 API 的参数名、返回格式、配套 parser 都不一样，混用会报错。**每次报 `OutputParserException: Could not parse function call: 'function_call'` 都是同一个原因**，先查这里。

### 错误现场

```
KeyError: 'function_call'
OutputParserException: Could not parse function call: 'function_call'
```

### 根本原因

| | 旧版 functions API（课程原版） | 新版 tools API（我们实际用的） |
|---|---|---|
| 绑定工具 | `model.bind(functions=...)` | `model.bind_tools(...)` |
| 强制调用 | `function_call={"name": "X"}` | `tool_choice="X"` |
| 模型返回位置 | `additional_kwargs["function_call"]` | `message.tool_calls`（即 `additional_kwargs["tool_calls"]`） |
| 配套 parser | `JsonOutputFunctionsParser` | `JsonOutputToolsParser` |

`JsonOutputFunctionsParser` 只会去 `additional_kwargs["function_call"]` 取结果；新版 `bind_tools` 返回的数据里根本没有这个键 → `KeyError` → 被包装成 `OutputParserException`。

另外 **DeepSeek API 只支持新版 `tools` 参数**，不支持已废弃的旧版 `functions`，所以只能走「tools + 新 parser」，不能倒退回旧写法。

### 正确写法

链：`prompt | model_with_tools | parser`。

```python
# 1. 绑定 + 强制调用（新版写法）
model_with_tools = model.bind_tools(
    extraction_functions,          # convert_pydantic_to_openai_tool 转出来的列表
    tool_choice="Information",     # 传工具名字符串
    extra_body={"thinking": {"type": "disabled"}},  # DeepSeek 需关思考模式
)

# 2. 解析：用 JsonOutputToolsParser（读 tool_calls），别再用 JsonOutputFunctionsParser
from langchain_core.output_parsers.openai_tools import JsonOutputToolsParser

chain = prompt | model_with_tools | JsonOutputToolsParser()
# 输出: [{'args': {'sentiment': 'neg', 'language': 'it'}, 'type': 'Tagging', 'id': 'call_...'}]

# 只想要 args 字典时，链尾再加一层（旧教程里的 JsonKeyOutputToolsParser 在
# langchain_core 1.6.0 中已被移除，用它代替）
chain = prompt | model_with_tools | JsonOutputToolsParser() | (lambda r: r[0]["args"])
# 输出: {'sentiment': 'neg', 'language': 'it'}
```

按工具名过滤并直接取 args 用 `JsonOutputKeyToolsParser`。注意它的 **`key_name` 是工具名（匹配 tool call 的 `type` 字段），不是 args 里面的键**——填成 args 内部的键（如 `"people"`）会得到空列表 `[]`：

```python
chain = prompt | model_with_tools | JsonOutputKeyToolsParser(key_name="Information", first_tool_only=True)
# 输出: {'people': [...]}（直接是 args 本体，等价于已移除的旧版 JsonKeyOutputToolsParser）
```

**两个 `key_name`，两套语义（迁移课程代码最易踩）**：functions 系的 `JsonKeyOutputFunctionsParser(key_name="people")` 里，`key_name` 是 **args 里面的键名**（源码 `res[self.key_name]`），所以课程里能直接输出人物列表；而 tools 系的 `JsonOutputKeyToolsParser` 里 `key_name` 是**工具名**。两个类名字像但语义不同——旧版的 `key_name="people"` 在新版要拆成两步：`JsonOutputKeyToolsParser(key_name="工具名", first_tool_only=True) | (lambda r: r["people"])`。

更推荐的现代写法（一行顶所有，直接返回 Pydantic 对象）：

```python
chain = prompt | model.with_structured_output(Tagging)
chain.invoke({"input": "non mi piace questo cibo"})
# Tagging(sentiment='neg', language='it')
```

### 易错的参数名

```python
model.bind(tool=..., tool_call=...)        # ❌ 两个参数名都不存在
model.bind(tools=..., tool_choice={"type": "function",
            "function": {"name": "Information"}})   # ✅ 原生 bind 的正确格式
model.bind_tools(..., tool_choice="Information")    # ✅ 日常推荐
```

`tool_choice` 传的是工具名字符串（或原生 dict 格式），不是 Pydantic 类对象。

**工具名 = Pydantic 类名**：`convert_pydantic_to_openai_tool(Xxx)` 生成的工具名就是类名 `Xxx`，`tool_choice` 里的名字必须与之**完全一致**（拼写、大小写都不能差）。类名拼错（如 `Informaton`）会导致 400 报错：

```
Invalid value for 'tool_call': no function named 'Information' was specified in the 'tools' parameter.
```

排查方法：打印 `extraction_functions[0]["function"]["name"]` 看实际工具名，与 `tool_choice` 里的名字逐字符核对。改完类名后要重新运行转换和 bind 的 cell（kernel 里缓存着旧类）。

另外 `tool_choice` 的原生 dict 格式中，`"type": "function"` 等字符串值必须逐字符精确，多一个空格都会被 API 拒绝（报 `unknown variant`）。

### 自查顺序

报解析类错误时按顺序检查：

1. 是不是用了 `JsonOutputFunctionsParser`？→ 换成 `JsonOutputToolsParser`。
2. `bind`/`bind_tools` 的参数名对不对（`tools` / `tool_choice`）？
3. 报 `Thinking mode does not support this tool_choice`？→ DeepSeek 开思考模式时不允许强制 tool_choice，在 `bind`/`bind_tools` 里加上 `extra_body={"thinking": {"type": "disabled"}}`（强制调用工具时这个参数是必需的，不是可选的）。
