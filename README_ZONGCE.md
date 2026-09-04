# 综测规则智能检索系统 - 使用说明

## 📁 文件结构

```
F:\LangChain\
├── app/
│   ├── answer_question.py      # 核心检索问答模块
│   ├── load_llm.py             # LLM 加载模块（DeepSeek）
│   ├── io.py                   # 文档加载模块（加密 PDF）
│   ├── environ.py              # 环境变量配置（支持 .env）
│   ├── app.py                  # Gradio 网页界面
│   ├── build_index.py          # 建索引 + 检索质量自检
│   ├── requirements.txt        # 依赖清单
│   ├── query_prompt_template.md  # 提示词模板（实际加载使用）
│   └── file/
│       └── data.pdf            # 综测规则文档
├── query_zongce.py             # 独立查询脚本（命令行交互）
└── README_ZONGCE.md            # 本说明文档
```

## 🚀 快速开始

### 方法一：使用独立脚本（推荐）

```bash
cd F:\LangChain
python query_zongce.py
```

然后输入问题即可查询综测规则。

### 方法二：在 Python 代码中调用

```python
from app.answer_question import query_zongce

# 查询综测规则
result = query_zongce("综合素质测评的评分标准是什么？")
print(result)
```

### 方法三：在 Jupyter Notebook 中使用

```python
from app.answer_question import query_zongce
from IPython.display import Markdown, display

result = query_zongce("综合素质测评的评分标准是什么？")
display(Markdown(result))
```

## 🔍 查询示例

以下是一些可以提问的示例：

1. **基础查询**
   - "综合素质测评包含哪些部分？"
   - "德育分的计算方法是什么？"
   - "智育成绩如何评定？"

2. **具体条款查询**
   - "获得奖学金需要满足什么条件？"
   - "旷课会扣多少分？"
   - "参加竞赛获奖如何加分？"

3. **计算规则查询**
   - "综测总分如何计算？"
   - "各部分权重是多少？"
   - "加分项有哪些限制？"

## ⚙️ 配置说明

### 1. LLM 配置

默认使用 DeepSeek API。如需修改，请编辑 `app/load_llm.py`：

```python
llm = ChatOpenAI(
    api_key="your-api-key",
    model="your-model",
    base_url="your-base-url",
    temperature=0.0
)
```

### 2. 嵌入模型配置

默认使用阿里云百炼 DashScope 的轻量 Qwen embedding（与 04 notebook 配置一致），无需本地模型，只需配置 `QWEN_API_KEY` 环境变量。如需修改模型，编辑 `app/answer_question.py` 的 `get_embeddings()`。

### 3. 文档路径配置

如需更改综测规则文档路径，请修改 `app/io.py`。

## 📝 输出格式说明

系统会以 Markdown 格式输出查询结果，包含：

- 🔍 **查询结果**：查询问题回顾
- 📜 **相关条款**：按章节组织的条款内容
- 📋 **要点总结**：关键信息归纳
- ⚠️ **注意事项**：特别说明或易混淆点
- 🔗 **相关条款**：可能相关的其他条款

## ❓ 常见问题

### Q1: 查询无结果怎么办？
- 检查 PDF 文档是否包含相关内容
- 尝试使用不同的关键词提问
- 确认文档路径和密码配置正确

### Q2: 响应速度很慢？
- 首次提问会为整份 PDF 建向量索引，慢属正常，之后复用索引
- 确认网络连接正常（DeepSeek / DashScope 均为在线 API）

### Q3: 输出格式不正确？
- 检查 LLM 是否支持 Markdown 输出
- 尝试调整 temperature 参数为 0.0
- 确认提示词模板正确加载

## 🔧 故障排除

1. **ModuleNotFoundError**
   ```bash
   pip install -r requirements.txt
   ```

2. **Embedding 调用失败（401 / 限流）**
   - 检查 `QWEN_API_KEY` 环境变量是否设置且有效
   - DashScope 单次最多 20 条文本，代码中已通过 `chunk_size=20` 处理

3. **PDF 解密失败**
   - 检查 `PDF_DATA_KEY` 环境变量是否设置
   - 确认 PDF 密码正确

## 📞 技术支持

如遇问题，请检查：
1. Python 版本 >= 3.10
2. 所有依赖包已安装（`pip install -r app/requirements.txt`）
3. `DEEPSEEK_API_KEY`、`QWEN_API_KEY`、`PDF_DATA_KEY` 配置正确

---

**更新日期**：2026-08-29  
**版本**：1.1.0
