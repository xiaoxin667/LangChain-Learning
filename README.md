# LangChain 框架学习笔记

基于 LangChain（1.x 新版包结构）+ DeepSeek API 的学习实践仓库：提示词工程、结构化输出、会话记忆管理，每个知识点配有可运行的代码。

> 🔗 **GitHub 仓库**：https://github.com/lonely-square-three/LangChain-Learning （本仓库与 Gitee 双端同步更新）

## 环境

- Python 3.12.x
- 依赖包：`langchain-openai`、`langchain-classic`、`langchain-core`、`openai`、`python-dotenv`、`jupyter`
- 模型：DeepSeek（`deepseek-v4-flash`）。DeepSeek 的 API 兼容 OpenAI 协议，直接用 `ChatOpenAI` 指定 `base_url="https://api.deepseek.com"` 即可，无需专用类
- 密钥从环境变量 `DEEPSEEK_API_KEY` 读取，不在代码中硬编码

## 目录结构

| 文件 | 内容 |
|:---|:---|
| `01_LangChain_diff.ipynb` | 提示词工程入门：原生 OpenAI SDK 与 LangChain 封装的写法对比（风格转换、分隔符、提示词模板） |
| `01_LangChain_Output_Explain.py` | 结构化输出：`ResponseSchema` 声明字段 → `StructuredOutputParser` 生成格式说明并解析模型回复，从商品评论中提取信息 |
| `02_LangChain_Memory.ipynb` | 会话记忆管理：`ConversationBufferMemory`、`ConversationBufferWindowMemory`、`ConversationTokenBufferMemory`、`ConversationSummaryBufferMemory` 四种记忆的用法与对比 |
| `LangChain/01.json` | 结构化输出示例的运行结果 |

## 学习进度

- [x] 原生 OpenAI SDK 调用与 LangChain 封装对比，`invoke()` 统一调用接口
- [x] 提示词模板 `ChatPromptTemplate`：占位符填充，本质是本地字符串替换
- [x] 结构化输出：`get_format_instructions()` 把 JSON 格式说明书注入提示词，`parse()` 把模型回复解析成 Python 字典，"谁发说明书谁来阅卷"
- [x] 会话记忆：完整历史 / 滑动窗口（k 条）/ 按 token 上限裁剪 / 超限自动摘要，以及 `save_context()`、`load_memory_variables()` 手动读写记忆

> 注：Memory 系列类来自 `langchain_classic`（旧版 API，官方已标记弃用，2.0 将移除），此处用于理解记忆机制原理；新项目应使用 `create_agent` + checkpointer。

## 核心概念笔记

### model
指代基础的语言模型

### prompt
一种用于给模型传递信息的一种方式

### 解析器(parsers)
接收模型的输出，并将输出结果解析成更结构化的格式，以便对其进行后续操作
